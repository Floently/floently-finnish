import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { useActiveReadDocument, useReadMobileStore, type ReadDocument } from './readMobileStore';
import { readTtsApi, type ReadTtsResult } from './readTtsApi';
import { readRenderApi } from './readRenderApi';
import { restoreReadStorePurchases, startReadStorePurchase, type ReadStorePlanId } from '../../billing/services/storeBillingService';
import { useSubscriptionStore } from '../../../state/subscriptionStore';

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'warm';
type ReadTab = 'reader' | 'library' | 'import' | 'settings' | 'analytics' | 'subscribe';
type ImportMode = 'paste' | 'file' | 'url';
type SyncStatus = 'idle' | 'loading' | 'syncing' | 'offline' | 'error';
type AudioPlaybackState = 'idle' | 'preparing' | 'ready' | 'playing' | 'paused' | 'error';

const READ_LOGO = require('./assets/floently_read.png');

const sampleText = 'Deep focus is the ability to concentrate without distraction on a cognitively demanding task. It is becoming rare, but it can be trained with the right environment, rhythm, and deliberate practice.';

const tabs: Array<{ key: ReadTab; label: string; route: string; icon: string }> = [
  { key: 'reader', label: 'Reader', route: '/read/reader', icon: 'book' },
  { key: 'library', label: 'Library', route: '/read/library', icon: 'books' },
  { key: 'import', label: 'Import', route: '/read/import', icon: 'upload' },
  { key: 'settings', label: 'Preferences', route: '/read/settings', icon: 'sliders' },
  { key: 'analytics', label: 'Analytics', route: '/read/analytics', icon: 'trend' },
];

const importChannels: Array<{ mode: ImportMode; label: string; detail: string; icon: string }> = [
  { mode: 'file', label: 'PDF / Document', detail: 'PDF, DOCX, TXT, EPUB - up to 25 MB', icon: 'file' },
  { mode: 'paste', label: 'Paste text', detail: 'Article, notes, script, transcript', icon: 'text' },
  { mode: 'url', label: 'Paste URL', detail: 'Any public article or page', icon: 'world' },
];

function navigate(path: string) {
  router.push(path as never);
}

function goBack(fallback = '/read/app') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.push(fallback as never);
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Saved reading';
  return new Date(parsed).toLocaleDateString();
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingMinutes(text: string) {
  return Math.max(1, Math.ceil(countWords(text) / 170));
}

function safePct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function FloatingAtmosphere({ tone = 'read' }: { tone?: 'read' | 'create' }) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(motion, {
        toValue: 1,
        duration: 7600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [motion]);

  const lift = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -18, 0] });
  const drift = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, 0] });
  const pulse = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.82, 1.06, 0.82] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.orbLarge,
          tone === 'create' && styles.orbCreate,
          { transform: [{ translateY: lift }, { scale: pulse }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orbSmall,
          tone === 'create' && styles.orbCreateSoft,
          { transform: [{ translateX: drift }, { scale: pulse }] },
        ]}
      />
      <Animated.View style={[styles.floatingLine, { transform: [{ translateX: drift }] }]} />
    </View>
  );
}

function ProductLogo() {
  return <Image source={READ_LOGO} resizeMode="contain" style={styles.productLogo} />;
}

function ProductSwitcher() {
  return (
    <View style={styles.productSwitcher}>
      <Pressable accessibilityRole="button" onPress={() => navigate('/read/app')} style={[styles.productTab, styles.productTabActive]}>
        <View style={[styles.productDot, styles.blueDot]} />
        <Text style={styles.productTabTextActive}>Floently Read</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate('/create')} style={styles.productTab}>
        <View style={[styles.productDot, styles.tealDot]} />
        <Text style={styles.productTabText}>Floently Create</Text>
      </Pressable>
    </View>
  );
}

function iconBadgeToneStyle(tone: 'blue' | 'teal' | 'purple' | 'amber' | 'red') {
  if (tone === 'teal') return styles.iconBadge_teal;
  if (tone === 'purple') return styles.iconBadge_purple;
  if (tone === 'amber') return styles.iconBadge_amber;
  if (tone === 'red') return styles.iconBadge_red;
  return styles.iconBadge_blue;
}

function IconBadge({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'teal' | 'purple' | 'amber' | 'red' }) {
  return (
    <View style={[styles.iconBadge, iconBadgeToneStyle(tone)]}>
      <Text style={styles.iconBadgeText}>{label.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

function TopNav({ active = 'reader' }: { active?: ReadTab }) {
  return (
    <View style={styles.topShell}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={() => navigate('/read')} style={styles.logoButton}>
          <ProductLogo />
        </Pressable>
        <View style={styles.navActions}>
          <Pressable accessibilityRole="button" onPress={() => goBack()} style={styles.topIconButton}>
            <Text style={styles.topIconText}>Back</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigate('/')} style={styles.topIconButton}>
            <Text style={styles.topIconText}>Home</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigate('/read')} style={styles.topIconButton}>
            <Text style={styles.topIconText}>Read landing</Text>
          </Pressable>
        </View>
      </View>

      <ProductSwitcher />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.innerTabRail}>
        {tabs.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.key === active }}
            key={item.key}
            onPress={() => navigate(item.route)}
            style={[styles.innerTab, item.key === active && styles.innerTabActive]}
          >
            <Text style={[styles.innerTabIcon, item.key === active && styles.innerTabTextActive]}>{item.icon}</Text>
            <Text style={[styles.innerTabText, item.key === active && styles.innerTabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: active === 'subscribe' }}
          onPress={() => navigate('/read/subscribe')}
          style={[styles.innerTab, active === 'subscribe' && styles.innerTabActive]}
        >
          <Text style={[styles.innerTabIcon, active === 'subscribe' && styles.innerTabTextActive]}>crown</Text>
          <Text style={[styles.innerTabText, active === 'subscribe' && styles.innerTabTextActive]}>Upgrade</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ReadAppFrame({
  active,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  active?: ReadTab;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <FloatingAtmosphere />
      <TopNav active={active} />
      <View style={styles.heroCard}>
        <View style={styles.heroAccent} />
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </ScrollView>
  );
}

function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'read' | 'create' | 'warning' }) {
  return (
    <Text
      style={[
        styles.pill,
        tone === 'read' && styles.readPill,
        tone === 'create' && styles.createPill,
        tone === 'warning' && styles.warningPill,
      ]}
    >
      {label}
    </Text>
  );
}

function AppButton({
  label,
  onPress,
  tone = 'secondary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
}) {
  const buttonStyle =
    tone === 'primary'
      ? styles.primaryButton
      : tone === 'ghost'
        ? styles.ghostButton
        : tone === 'warm'
          ? styles.warmButton
          : styles.secondaryButton;
  const textStyle =
    tone === 'primary'
      ? styles.primaryButtonText
      : tone === 'ghost'
        ? styles.ghostButtonText
        : tone === 'warm'
          ? styles.warmButtonText
          : styles.secondaryButtonText;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[buttonStyle, disabled && styles.buttonDisabled]}
    >
      <Text style={[textStyle, disabled && styles.buttonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <AppButton label={label} onPress={onPress} tone="primary" disabled={disabled} />;
}

function SecondaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <AppButton label={label} onPress={onPress} tone="secondary" disabled={disabled} />;
}

function GhostButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <AppButton label={label} onPress={onPress} tone="ghost" disabled={disabled} />;
}

function WarmButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <AppButton label={label} onPress={onPress} tone="warm" disabled={disabled} />;
}

function SyncBanner({ status, error, onRefresh }: { status: SyncStatus; error: string | null; onRefresh?: () => void }) {
  const isBusy = status === 'loading' || status === 'syncing';
  const isOffline = status === 'offline' || status === 'error';

  return (
    <View style={[styles.syncBanner, isOffline && styles.syncBannerWarning]}>
      <View style={styles.syncTextBlock}>
        <Text style={styles.syncTitle}>{isBusy ? 'Syncing Read library' : isOffline ? 'Read is using local fallback' : 'Read library connected'}</Text>
        <Text style={styles.syncText} numberOfLines={2}>
          {isBusy
            ? 'Syncing documents and progress.'
            : isOffline
              ? error || 'Online library is temporarily unavailable. Local readings stay open.'
              : 'Documents, narration, progress, and mobile state sync when you are signed in.'}
        </Text>
      </View>
      {isBusy ? <ActivityIndicator color="#7BA3FF" /> : onRefresh ? <GhostButton label="Refresh" onPress={onRefresh} /> : null}
    </View>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <View style={styles.emptyState}>
      <IconBadge label="RE" tone="blue" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      <PrimaryButton label={actionLabel} onPress={onAction} />
    </View>
  );
}

function DocumentCard({ document }: { document: ReadDocument }) {
  const pct = safePct(document.readingProgress);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        useReadMobileStore.getState().openDocument(document.id);
        navigate('/read/reader');
      }}
      style={styles.documentCard}
    >
      <View style={styles.documentTopRow}>
        <IconBadge label={document.detectedLanguageLabel} tone="purple" />
        <View style={styles.documentTitleBlock}>
          <Text numberOfLines={1} style={styles.documentTitle}>{document.title}</Text>
          <Text style={styles.documentMeta}>{formatDate(document.createdAtIso)} . {readingMinutes(document.generatedText)} min read</Text>
        </View>
        <Pill label={`${pct}%`} tone={pct >= 100 ? 'read' : 'neutral'} />
      </View>
      <Text numberOfLines={3} style={styles.documentPreview}>{document.generatedText}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </Pressable>
  );
}

function QuickActionCard({ label, detail, tone, onPress }: { label: string; detail: string; tone: 'blue' | 'teal' | 'purple' | 'amber' | 'red'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickActionCard}>
      <IconBadge label={label} tone={tone} />
      <Text style={styles.quickTitle}>{label}</Text>
      <Text style={styles.quickDetail}>{detail}</Text>
    </Pressable>
  );
}

function ImportChannelCard({ mode, label, detail, activeMode, onPress }: { mode: ImportMode; label: string; detail: string; activeMode: ImportMode; onPress: () => void }) {
  const active = activeMode === mode;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.sourceCard, active && styles.sourceCardActive]}>
      <IconBadge label={label} tone={mode === 'file' ? 'red' : mode === 'url' ? 'teal' : mode === 'paste' ? 'blue' : 'purple'} />
      <Text style={styles.sourceTitle}>{label}</Text>
      <Text style={styles.sourceDetail}>{detail}</Text>
    </Pressable>
  );
}

export function ReadHomeScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const setReadAutomatically = useReadMobileStore((state) => state.setReadAutomatically);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const activeReading = documents.find((document) => document.readingProgress > 0 && document.readingProgress < 1) ?? documents[0] ?? null;
  const completedCount = documents.filter((document) => document.readingProgress >= 1).length;

  return (
    <ReadAppFrame
      active="reader"
      eyebrow="Read dashboard"
      title="Listen to any text, anytime, anywhere"
      subtitle="The native app mirrors the web Read suite: Reader, Library, Import, Preferences, Analytics, and Upgrade stay in the same product flow."
    >
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />

      <View style={styles.dashboardGrid}>
        <View style={styles.panelLarge}>
          <Text style={styles.panelKicker}>Reader</Text>
          <Text style={styles.panelTitle}>Open a document or import something new.</Text>
          <Text style={styles.bodyText}>Load an article, paste text, upload a PDF, or open a saved reading from your library to start reading and listening.</Text>
          <View style={styles.buttonRow}>
            <PrimaryButton label="Open reader" onPress={() => navigate('/read/reader')} />
            <SecondaryButton label="Import" onPress={() => navigate('/read/import')} />
          </View>
        </View>

        <View style={styles.panelSmall}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <Text style={styles.panelKicker}>Preferences</Text>
              <Text style={styles.cardTitle}>Read automatically</Text>
              <Text style={styles.bodyText}>New imports detect language, save to library, and open the reader when enabled.</Text>
            </View>
            <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
          </View>
          <View style={styles.inlinePills}>
            <Pill label="Auto language" tone="read" />
            <Pill label={readAutomatically ? 'Auto-open reader' : 'Save first'} tone={readAutomatically ? 'read' : 'warning'} />
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard value={String(documents.length)} label="Saved" />
        <MetricCard value={String(completedCount)} label="Finished" />
        <MetricCard value={activeReading ? `${safePct(activeReading.readingProgress)}%` : '0%'} label="Current" />
      </View>

      <View style={styles.qaGrid}>
        <QuickActionCard label="Import document" detail="PDF, DOCX, TXT - up to 25 MB" tone="blue" onPress={() => navigate('/read/import')} />
        <QuickActionCard label="Open reader" detail="Continue text or narration" tone="purple" onPress={() => navigate('/read/reader')} />
        <QuickActionCard label="Create from content" detail="Read can feed future Create flows" tone="teal" onPress={() => navigate('/create')} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently opened</Text>
        <GhostButton label="View all" onPress={() => navigate('/read/library')} />
      </View>
      {activeReading ? (
        <DocumentCard document={activeReading} />
      ) : (
        <EmptyState
          title="Nothing open yet"
          body="Import a file, paste text, or use a URL to create your first native Read item."
          actionLabel="Add new content"
          onAction={() => navigate('/read/import')}
        />
      )}
    </ReadAppFrame>
  );
}

export function ReadImportScreen() {
  const createFromText = useReadMobileStore((state) => state.createFromText);
  const createFromUrl = useReadMobileStore((state) => state.createFromUrl);
  const createFromFile = useReadMobileStore((state) => state.createFromFile);
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const [title, setTitle] = useState('The Neuroscience of Deep Focus');
  const [text, setText] = useState(sampleText);
  const [mode, setMode] = useState<ImportMode>('file');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const trimmedText = text.trim();
  const wordCount = useMemo(() => countWords(trimmedText), [trimmedText]);
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 170));
  const canGenerate = trimmedText.length >= 8;

  function openAfterImport(id: string) {
    useReadMobileStore.getState().openDocument(id);
    navigate(readAutomatically ? '/read/reader' : '/read/library');
  }

  function generate() {
    if (!canGenerate) return;
    setImportError(null);
    const document = createFromText({ title, text: trimmedText, language: 'auto' });
    openAfterImport(document.id);
  }

  async function importFile() {
    setIsImporting(true);
    setImportError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'text/plain',
          'text/markdown',
          'text/html',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/epub+zip',
        ],
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('No readable file was selected.');

      const selectedName = asset.name || 'Imported document.txt';
      setFileName(selectedName);
      const document = await createFromFile({
        uri: asset.uri,
        name: selectedName,
        mimeType: asset.mimeType ?? null,
        title: title?.trim() || selectedName.replace(/\.[^/.]+$/, ''),
      });
      openAfterImport(document.id);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  }

  async function importUrl() {
    if (!url.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const document = await createFromUrl({ title, url });
      openAfterImport(document.id);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ReadAppFrame
      active="import"
      eyebrow="Read . Import"
      title="Add new content"
      subtitle="Import a PDF, paste text, or paste a URL. Content is saved to your library and opened in the reader."
    >
      <SyncBanner status={syncStatus} error={syncError} />

      <View style={styles.uploadDropzone}>
        <View style={styles.uploadIconRing}>
          <Text style={styles.uploadIconText}>up</Text>
        </View>
        <Text style={styles.dropzoneTitle}>Drop a file here, or tap to browse</Text>
        <Text style={styles.dropzoneSub}>Supports PDF . DOCX . TXT . EPUB - up to 25 MB</Text>
        <WarmButton label={isImporting ? 'Importing...' : readAutomatically ? 'Choose file and open reader' : 'Choose file and save'} onPress={() => void importFile()} disabled={isImporting} />
        {fileName ? <Text style={styles.helpText}>Selected: {fileName}</Text> : null}
      </View>

      <View style={styles.sourceGrid}>
        {importChannels.map((channel) => (
          <ImportChannelCard
            key={channel.mode}
            mode={channel.mode}
            label={channel.label}
            detail={channel.detail}
            activeMode={mode}
            onPress={() => setMode(channel.mode)}
          />
        ))}
      </View>

      {mode === 'paste' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paste text</Text>
          <Text style={styles.bodyText}>Save pasted content to your library or open it directly in the reader.</Text>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Reading title" placeholderTextColor="rgba(255,255,255,0.36)" />
          <Text style={styles.label}>Text</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            style={[styles.input, styles.textArea]}
            placeholder="Paste text here"
            placeholderTextColor="rgba(255,255,255,0.36)"
            textAlignVertical="top"
          />
          <View style={styles.inlinePills}>
            <Pill label={`${wordCount} words`} tone="read" />
            <Pill label={`About ${estimatedMinutes} min`} tone="read" />
            <Pill label={readAutomatically ? 'Open in reader' : 'Save to library'} tone={readAutomatically ? 'read' : 'warning'} />
          </View>
          <View style={styles.buttonRow}>
            <PrimaryButton label="Save to library" onPress={generate} disabled={!canGenerate} />
            <SecondaryButton label="Open in reader" onPress={generate} disabled={!canGenerate} />
          </View>
          {!canGenerate ? <Text style={styles.helpText}>Paste at least a short paragraph to generate a reading.</Text> : null}
        </View>
      ) : null}

      {mode === 'url' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paste URL</Text>
          <Text style={styles.bodyText}>Import a public article or web page. Floently saves the readable text to your library.</Text>
          <Text style={styles.label}>Web link</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
            placeholder="https://example.com/article"
            placeholderTextColor="rgba(255,255,255,0.36)"
          />
          <View style={styles.buttonRow}>
            <PrimaryButton label={isImporting ? 'Importing...' : 'Save to library'} onPress={() => void importUrl()} disabled={isImporting || !url.trim()} />
            <SecondaryButton label={isImporting ? 'Importing...' : 'Open in reader'} onPress={() => void importUrl()} disabled={isImporting || !url.trim()} />
          </View>
          {importError ? <Text style={styles.errorText}>{importError}</Text> : null}
        </View>
      ) : null}

      {mode === 'file' ? (
        <View style={styles.cardMuted}>
          <Text style={styles.cardTitle}>Native document upload</Text>
          <Text style={styles.bodyText}>The mobile upload uses the native iOS/Android document picker while matching the web dropzone structure.</Text>
          <View style={styles.inlinePills}>
            <Pill label="PDF" tone="read" />
            <Pill label="DOCX" tone="read" />
            <Pill label="TXT" tone="read" />
            <Pill label="EPUB" tone="read" />
          </View>
          {importError ? <Text style={styles.errorText}>{importError}</Text> : null}
        </View>
      ) : null}
    </ReadAppFrame>
  );
}

export function ReadLibraryScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  return (
    <ReadAppFrame
      active="library"
      eyebrow="Read . Library"
      title="Continue reading"
      subtitle="All your saved documents, articles, PDFs, and web pages in one place."
    >
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />
      <View style={styles.qaGrid}>
        <QuickActionCard label="Import document" detail="PDF, DOCX, TXT - up to 25 MB" tone="blue" onPress={() => navigate('/read/import')} />
        <QuickActionCard label="Open reader" detail="Pasted text or saved document" tone="purple" onPress={() => navigate('/read/reader')} />
        <QuickActionCard label="Create from content" detail="Turn saved material into assets" tone="teal" onPress={() => navigate('/create')} />
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All projects</Text>
        <GhostButton label="Refresh" onPress={() => void refreshLibrary()} />
      </View>
      {documents.length ? (
        <View style={styles.documentList}>
          {documents.map((document) => <DocumentCard key={document.id} document={document} />)}
        </View>
      ) : (
        <EmptyState
          title="Your Read library is empty"
          body="Import text now. This screen holds books, files, web articles, and saved reading progress."
          actionLabel="Import first reading"
          onAction={() => navigate('/read/import')}
        />
      )}
    </ReadAppFrame>
  );
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 126;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - safeProgress);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHalo} />
      <Svg width={size} height={size} style={styles.progressSvg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#7BA3FF"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.progressCenter}>
        <Text style={styles.progressNumber}>{safePct(safeProgress)}%</Text>
        <Text style={styles.progressLabel}>read</Text>
      </View>
    </View>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = [12, 20, 14, 28, 16, 24, 18, 31, 14, 23, 17, 26, 13, 22, 18, 30];
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      motion.stopAnimation();
      motion.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(motion, {
        toValue: 1,
        duration: 950,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, motion]);

  const scale = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 1.05, 0.55] });

  return (
    <View style={styles.waveform}>
      {bars.map((height, index) => (
        <Animated.View
          key={`${height}-${index}`}
          style={[
            styles.waveBar,
            { height, opacity: active ? 0.95 : 0.45, transform: [{ scaleY: index % 2 === 0 ? scale : 1 }] },
          ]}
        />
      ))}
    </View>
  );
}

function ReaderSidePanel({ document, onSpeed }: { document: ReadDocument; onSpeed: (speed: number) => void }) {
  return (
    <View style={styles.readerSidePanel}>
      <View style={styles.sideSection}>
        <Text style={styles.sideLabel}>Voice</Text>
        <View style={styles.selectBox}>
          <Text style={styles.selectText}>Aria - Natural</Text>
        </View>
      </View>
      <View style={styles.sideSection}>
        <View style={styles.sideRowBetween}>
          <Text style={styles.sideLabel}>Speed</Text>
          <Text style={styles.speedValue}>{document.playbackSpeed.toFixed(1)}x</Text>
        </View>
        <View style={styles.speedButtons}>
          {[0.8, 1.0, 1.2, 1.5].map((speed) => (
            <Pressable key={speed} onPress={() => onSpeed(speed)} style={[styles.speedButton, Math.abs(document.playbackSpeed - speed) < 0.01 && styles.speedButtonActive]}>
              <Text style={[styles.speedButtonText, Math.abs(document.playbackSpeed - speed) < 0.01 && styles.speedButtonTextActive]}>{speed.toFixed(1)}x</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.sideSection}>
        <Text style={styles.sideLabel}>Font size</Text>
        <View style={styles.hmButtons}>
          <Text style={styles.hmButton}>A</Text>
          <Text style={[styles.hmButton, styles.hmButtonActive]}>A</Text>
          <Text style={[styles.hmButton, styles.hmButtonLarge]}>A</Text>
        </View>
      </View>
      <View style={styles.sideSection}>
        <Text style={styles.sideLabel}>Highlight mode</Text>
        <View style={styles.hmButtons}>
          <Text style={styles.hmButton}>None</Text>
          <Text style={[styles.hmButton, styles.hmButtonActive]}>Sentence</Text>
          <Text style={styles.hmButton}>Word</Text>
        </View>
      </View>
      <View style={styles.sideSection}>
        <Text style={styles.sideLabel}>Display</Text>
        {['Auto-scroll', 'Dim others', 'Focus mode', 'Dark reader'].map((label, index) => (
          <View key={label} style={styles.toggleRowMini}>
            <Text style={styles.toggleLabelMini}>{label}</Text>
            <View style={[styles.toggleMini, index !== 2 && styles.toggleMiniOn]} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ReadReaderScreen() {
  const document = useActiveReadDocument();
  const updateProgress = useReadMobileStore((state) => state.updateProgress);
  const setPlaybackSpeed = useReadMobileStore((state) => state.setPlaybackSpeed);
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const playbackStatus = useAudioPlayerStatus(player);
  const [audioState, setAudioState] = useState<AudioPlaybackState>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioResult, setAudioResult] = useState<ReadTtsResult | null>(null);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (!document) return;
    player.playbackRate = document.playbackSpeed;
  }, [document, player]);

  useEffect(() => {
    if (!document || !playbackStatus.duration || playbackStatus.duration <= 0) return;
    const nextProgress = Math.max(0, Math.min(1, playbackStatus.currentTime / playbackStatus.duration));
    if (Math.abs(nextProgress - document.readingProgress) >= 0.01) {
      updateProgress(document.id, nextProgress);
    }
  }, [document, playbackStatus.currentTime, playbackStatus.duration, updateProgress]);

  useEffect(() => {
    if (playbackStatus.playing) {
      setAudioState('playing');
    } else if (audioResult && audioState === 'playing') {
      setAudioState('paused');
    }
  }, [audioResult, audioState, playbackStatus.playing]);

  const timeLabel = useMemo(() => {
    if (!document) return '00:00 / 00:00';
    const estimatedTotalSeconds = Math.max(20, Math.ceil(document.generatedText.length / 12));
    const totalSeconds = playbackStatus.duration > 0 ? Math.ceil(playbackStatus.duration) : estimatedTotalSeconds;
    const currentSeconds = playbackStatus.duration > 0
      ? Math.floor(playbackStatus.currentTime)
      : Math.floor(totalSeconds * document.readingProgress);
    const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return `${format(currentSeconds)} / ${format(totalSeconds)}`;
  }, [document, playbackStatus.currentTime, playbackStatus.duration]);

  const displayedProgress = useMemo(() => {
    if (!document) return 0;
    if (playbackStatus.duration > 0) return Math.max(0, Math.min(1, playbackStatus.currentTime / playbackStatus.duration));
    return document.readingProgress;
  }, [document, playbackStatus.currentTime, playbackStatus.duration]);

  async function generateAndPlayAudio() {
    if (!document) return;

    if (audioResult?.audioUrl) {
      player.playbackRate = document.playbackSpeed;
      player.play();
      setAudioState('playing');
      return;
    }

    setAudioState('preparing');
    setAudioError(null);

    try {
      const result = await readTtsApi.prerenderReading({ text: document.generatedText, language: document.language });
      setAudioResult(result);
      player.replace(result.audioUrl);
      player.playbackRate = document.playbackSpeed;
      player.play();
      setAudioState('playing');
    } catch (error) {
      setAudioState('error');
      setAudioError(error instanceof Error ? error.message : String(error));
    }
  }

  function pauseAudio() {
    player.pause();
    setAudioState('paused');
  }

  function replayAudio() {
    void player.seekTo(0);
    player.playbackRate = document?.playbackSpeed ?? 1;
    player.play();
    setAudioState('playing');
  }

  if (!document) {
    return (
      <ReadAppFrame active="reader" eyebrow="Reader" title="Nothing open yet" subtitle="Load an article, paste text, or open something from your library to start reading and listening.">
        <EmptyState title="Nothing open yet" body="Import or paste text to open the native reader." actionLabel="Import" onAction={() => navigate('/read/import')} />
      </ReadAppFrame>
    );
  }

  const isPreparing = audioState === 'preparing' || playbackStatus.isBuffering;
  const isPlaying = audioState === 'playing' || playbackStatus.playing;
  const sentences = document.generatedText.split(/(?<=[.!?])\s+/).filter(Boolean);

  return (
    <ReadAppFrame active="reader" eyebrow="Reader" title={document.title} subtitle={`${sentences.length || 1} sentences . ${document.detectedLanguageLabel} . ${readingMinutes(document.generatedText)} min read`}>
      <View style={styles.readerLayout}>
        <View style={styles.readerMain}>
          <Text style={styles.docTitle}>{document.title}</Text>
          <Text style={styles.docMeta}>{sentences.length || 1} sentences . {document.detectedLanguageLabel} . {readingMinutes(document.generatedText)} min read</Text>
          <View style={styles.docDivider} />
          <Text style={styles.readerText}>{document.generatedText}</Text>
        </View>
        <ReaderSidePanel document={document} onSpeed={(speed) => setPlaybackSpeed(document.id, speed)} />
      </View>

      <View style={styles.playerDock}>
        <View style={styles.playerTopRow}>
          <View style={styles.playerThumb}><Text style={styles.playerThumbText}>R</Text></View>
          <View style={styles.playerInfo}>
            <Text numberOfLines={1} style={styles.playerTitle}>{document.title}</Text>
            <Text style={styles.playerSub}>Aria . {document.playbackSpeed.toFixed(1)}x . {timeLabel}</Text>
          </View>
          <Text style={styles.playerTime}>{safePct(displayedProgress)}%</Text>
        </View>
        <View style={styles.playerControls}>
          <Pressable accessibilityRole="button" onPress={() => updateProgress(document.id, Math.max(0, document.readingProgress - 0.1))} style={styles.plButton}>
            <Text style={styles.plButtonText}>-10</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={isPlaying ? pauseAudio : generateAndPlayAudio} disabled={isPreparing} style={[styles.playButton, isPreparing && styles.buttonDisabled]}>
            <Text style={styles.playButtonText}>{isPreparing ? '...' : isPlaying ? 'Pause' : audioResult ? 'Play' : 'Listen'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={replayAudio} disabled={!audioResult || isPreparing} style={[styles.plButton, (!audioResult || isPreparing) && styles.buttonDisabled]}>
            <Text style={styles.plButtonText}>Replay</Text>
          </Pressable>
        </View>
        <Waveform active={isPlaying || isPreparing} />
        <View style={styles.progressTrackTall}>
          <View style={[styles.progressFill, { width: `${safePct(displayedProgress)}%` }]} />
        </View>
        <View style={styles.playerBottomRow}>
          <Text style={styles.compactMeta}>{timeLabel}</Text>
          <Pressable onPress={() => setPlaybackSpeed(document.id, document.playbackSpeed >= 1.5 ? 1 : document.playbackSpeed + 0.1)} style={styles.speedChip}>
            <Text style={styles.speedChipText}>{document.playbackSpeed.toFixed(1)}x</Text>
          </Pressable>
          <SecondaryButton label="Library" onPress={() => navigate('/read/library')} />
        </View>
        {audioError ? <Text style={styles.errorText}>{audioError}</Text> : null}
      </View>

      <View style={styles.readerProgressCard}>
        <CircularProgress progress={displayedProgress} />
        <View style={styles.readerProgressCopy}>
          <Text style={styles.cardTitle}>Progress</Text>
          <Text style={styles.bodyText}>Est. {Math.max(1, readingMinutes(document.generatedText) - Math.round(readingMinutes(document.generatedText) * displayedProgress))} min remaining.</Text>
          <View style={styles.buttonRow}>
            <GhostButton label="25%" onPress={() => updateProgress(document.id, 0.25)} />
            <GhostButton label="50%" onPress={() => updateProgress(document.id, 0.5)} />
            <GhostButton label="Done" onPress={() => updateProgress(document.id, 1)} />
          </View>
        </View>
      </View>
    </ReadAppFrame>
  );
}

const READ_PLANS: Array<{
  id: ReadStorePlanId;
  title: string;
  priceHint: string;
  body: string;
  platformNote?: string;
}> = [
  { id: 'reader_monthly', title: 'Reader Monthly', priceHint: '11.99 EUR / month', body: 'Read, listen, import text, and continue your library across sessions.' },
  { id: 'reader_yearly', title: 'Reader Yearly', priceHint: '119.90 EUR / year', body: 'Annual Reader access for reading, listening, and document practice.', platformNote: 'Android yearly is added after the RevenueCat compatibility warning is cleared; iOS yearly is ready.' },
  { id: 'creator_monthly', title: 'Creator Monthly', priceHint: '29.99 EUR / month', body: 'Creator-tier access for Read content tools, summaries, captions, and hooks as they are enabled.' },
  { id: 'creator_yearly', title: 'Creator Yearly', priceHint: '299.90 EUR / year', body: 'Annual Creator access for Read content tools and richer creator workflows.', platformNote: 'Android yearly is added after the RevenueCat compatibility warning is cleared; iOS yearly is ready.' },
];

type ReadRevenueCatSyncSource = {
  readAccess: boolean;
  creatorAccess: boolean;
  activeEntitlements: string[];
  packageId?: string | null;
  platform?: string | null;
  status?: string | null;
};

function getReadPurchasePackageId(value: unknown): ReadStorePlanId | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as { packageId?: unknown; productId?: unknown; planId?: unknown };
  const raw = record.packageId ?? record.productId ?? record.planId;
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if (normalized === 'reader_monthly' || normalized === 'reader_yearly' || normalized === 'creator_monthly' || normalized === 'creator_yearly') return normalized;
  return null;
}

async function syncReadPurchaseToBackend(result: ReadRevenueCatSyncSource, planId?: ReadStorePlanId | null): Promise<boolean> {
  const activeEntitlements = Array.isArray(result.activeEntitlements) ? result.activeEntitlements : [];
  const shouldSync = result.readAccess || result.creatorAccess || activeEntitlements.length > 0;
  if (!shouldSync) return false;

  try {
    await readRenderApi.syncRevenueCatEntitlements({
      readAccess: result.readAccess,
      creatorAccess: result.creatorAccess,
      activeEntitlements,
      packageId: result.packageId ?? planId ?? null,
      planId: planId ?? result.packageId ?? null,
      platform: result.platform ?? null,
      status: result.status ?? null,
    });
    return true;
  } catch (error) {
    console.warn('Read RevenueCat backend sync failed', error);
    return false;
  }
}

export function ReadSubscriptionScreen() {
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const applyStoreReadAccess = useSubscriptionStore((state) => state.applyStoreReadAccess);
  const refreshSubscription = useSubscriptionStore((state) => state.refresh);
  const [busyPlan, setBusyPlan] = useState<ReadStorePlanId | 'restore' | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const hasReadAccess = Boolean(subscriptionStatus?.readAccess || subscriptionStatus?.entitlements.readAccess);
  const hasCreatorAccess = Boolean(subscriptionStatus?.createAccess || subscriptionStatus?.entitlements.createAccess);

  async function purchase(planId: ReadStorePlanId) {
    setBusyPlan(planId);
    setPurchaseMessage(null);
    setPurchaseError(null);
    try {
      const result = await startReadStorePurchase(planId);
      applyStoreReadAccess({ readAccess: result.readAccess, creatorAccess: result.creatorAccess });
      const backendSynced = await syncReadPurchaseToBackend(result, planId);
      await refreshSubscription();
      applyStoreReadAccess({ readAccess: result.readAccess, creatorAccess: result.creatorAccess });
      const syncSuffix = backendSynced ? ' Backend access is synced.' : '';
      setPurchaseMessage(result.creatorAccess ? `Creator access is active.${syncSuffix}` : result.readAccess ? `Read access is active.${syncSuffix}` : 'Purchase completed. If access does not update immediately, tap Restore purchases.');
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyPlan(null);
    }
  }

  async function restorePurchases() {
    setBusyPlan('restore');
    setPurchaseMessage(null);
    setPurchaseError(null);
    try {
      const result = await restoreReadStorePurchases();
      applyStoreReadAccess({ readAccess: result.readAccess, creatorAccess: result.creatorAccess });
      const backendSynced = await syncReadPurchaseToBackend(result, getReadPurchasePackageId(result));
      await refreshSubscription();
      applyStoreReadAccess({ readAccess: result.readAccess, creatorAccess: result.creatorAccess });
      const syncSuffix = backendSynced ? ' Backend access is synced.' : '';
      setPurchaseMessage(result.creatorAccess ? `Creator access restored.${syncSuffix}` : result.readAccess ? `Read access restored.${syncSuffix}` : 'No active Read purchase was found for this store account.');
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <ReadAppFrame active="subscribe" eyebrow="Upgrade" title="Floently Read access" subtitle="Native mobile plans stay connected to RevenueCat and backend Read entitlements.">
      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Current access</Text>
        <Text style={styles.bodyText}>{hasCreatorAccess ? 'Creator access active.' : hasReadAccess ? 'Read access active.' : 'No active Read access detected yet.'}</Text>
      </View>
      <View style={styles.planList}>
        {READ_PLANS.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPrice}>{plan.priceHint}</Text>
              </View>
              <Pill label={plan.id.includes('creator') ? 'Creator' : 'Read'} tone={plan.id.includes('creator') ? 'create' : 'read'} />
            </View>
            <Text style={styles.bodyText}>{plan.body}</Text>
            {plan.platformNote ? <Text style={styles.helpText}>{plan.platformNote}</Text> : null}
            <PrimaryButton label={busyPlan === plan.id ? 'Processing...' : 'Choose plan'} onPress={() => void purchase(plan.id)} disabled={Boolean(busyPlan)} />
          </View>
        ))}
      </View>
      <SecondaryButton label={busyPlan === 'restore' ? 'Restoring...' : 'Restore purchases'} onPress={() => void restorePurchases()} disabled={Boolean(busyPlan)} />
      {purchaseMessage ? <Text style={styles.successText}>{purchaseMessage}</Text> : null}
      {purchaseError ? <Text style={styles.errorText}>{purchaseError}</Text> : null}
    </ReadAppFrame>
  );
}

export function ReadSettingsScreen() {
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const setReadAutomatically = useReadMobileStore((state) => state.setReadAutomatically);

  return (
    <ReadAppFrame active="settings" eyebrow="Read . Preferences" title="Reading preferences" subtitle="Customise your reader, voice, and narration settings.">
      <View style={styles.preferenceGrid}>
        <View style={styles.prefCard}>
          <Text style={styles.prefTitle}>Typography</Text>
          <Text style={styles.bodyText}>Font size, line height, paragraph width, serif vs sans-serif reading surface.</Text>
        </View>
        <View style={styles.prefCard}>
          <Text style={styles.prefTitle}>Voice & narration</Text>
          <Text style={styles.bodyText}>Default voice, speed, pitch, pause length, auto-play next document.</Text>
        </View>
        <View style={styles.prefCard}>
          <Text style={styles.prefTitle}>Highlighting</Text>
          <Text style={styles.bodyText}>Sentence or word highlight, colour, dim-others behaviour, scroll mode.</Text>
        </View>
        <View style={styles.prefCard}>
          <Text style={styles.prefTitle}>Language & locale</Text>
          <Text style={styles.bodyText}>Interface language, subtitle language, translation default, locale settings.</Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.cardTitle}>Read automatically after import</Text>
            <Text style={styles.bodyText}>When enabled, new readings open directly in the reader after text, URL, or file import.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
      </View>
    </ReadAppFrame>
  );
}

export function ReadAnalyticsScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const completedCount = documents.filter((document) => document.readingProgress >= 1).length;
  const activeCount = documents.filter((document) => document.readingProgress > 0 && document.readingProgress < 1).length;
  const totalWords = documents.reduce((total, document) => total + countWords(document.generatedText || document.sourceText || ''), 0);
  const averageProgress = documents.length ? Math.round((documents.reduce((total, document) => total + document.readingProgress, 0) / documents.length) * 100) : 0;

  return (
    <ReadAppFrame active="analytics" eyebrow="Read . Analytics" title="Reading analytics" subtitle="The native app now represents the web Analytics product area with progress, library health, and reading activity signals.">
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />
      <View style={styles.metricsRow}>
        <MetricCard value={String(documents.length)} label="Saved" />
        <MetricCard value={String(activeCount)} label="Active" />
        <MetricCard value={String(completedCount)} label="Finished" />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard value={`${averageProgress}%`} label="Average" />
        <MetricCard value={String(totalWords)} label="Words" />
        <MetricCard value={documents.length ? 'On' : 'Ready'} label="Library" />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analytics represented</Text>
        <Text style={styles.bodyText}>Reader, Library, Import, Preferences, Analytics, and Upgrade now exist in the native mobile product structure.</Text>
        <View style={styles.inlinePills}>
          <Pill label="Progress" tone="read" />
          <Pill label="Library health" tone="read" />
          <Pill label="Reading activity" tone="read" />
        </View>
      </View>
    </ReadAppFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#07111F',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 42,
    gap: 16,
    overflow: 'hidden',
  },
  orbLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    left: -110,
    top: 140,
    backgroundColor: 'rgba(79,131,255,0.15)',
  },
  orbSmall: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -95,
    top: 30,
    backgroundColor: 'rgba(155,114,255,0.13)',
  },
  orbCreate: { backgroundColor: 'rgba(56,201,168,0.16)' },
  orbCreateSoft: { backgroundColor: 'rgba(245,166,35,0.12)' },
  floatingLine: {
    position: 'absolute',
    width: 190,
    height: 1,
    right: 34,
    top: 190,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  topShell: { gap: 10, position: 'relative' },
  topBar: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  logoButton: { minHeight: 64, justifyContent: 'center' },
  productLogo: { width: 154, height: 76 },
  navActions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  topIconButton: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  topIconText: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '800' },
  productSwitcher: {
    flexDirection: 'row',
    gap: 8,
    padding: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  productTab: { flex: 1, minHeight: 42, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  productTabActive: { backgroundColor: 'rgba(255,255,255,0.09)' },
  productDot: { width: 8, height: 8, borderRadius: 4 },
  blueDot: { backgroundColor: '#4F83FF' },
  tealDot: { backgroundColor: '#38C9A8' },
  productTabText: { color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: '800' },
  productTabTextActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  innerTabRail: { gap: 8, paddingRight: 10 },
  innerTab: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  innerTabActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  innerTabIcon: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '900' },
  innerTabText: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '800' },
  innerTabTextActive: { color: '#07111F' },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    gap: 13,
    minHeight: 190,
    overflow: 'hidden',
    backgroundColor: '#0C1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroAccent: { position: 'absolute', width: 240, height: 240, borderRadius: 120, right: -80, top: -80, backgroundColor: 'rgba(79,131,255,0.16)' },
  eyebrow: { alignSelf: 'flex-start', color: '#7BA3FF', fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(79,131,255,0.14)', borderWidth: 1, borderColor: 'rgba(79,131,255,0.28)', overflow: 'hidden' },
  title: { color: '#FFFFFF', fontSize: 36, lineHeight: 41, fontWeight: '900', letterSpacing: -1.05 },
  subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 23 },
  dashboardGrid: { gap: 14 },
  panelLarge: { borderRadius: 24, padding: 20, gap: 12, backgroundColor: '#111F36', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  panelSmall: { borderRadius: 22, padding: 18, gap: 12, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  panelKicker: { color: '#7BA3FF', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  panelTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '900' },
  card: { borderRadius: 22, padding: 18, gap: 13, backgroundColor: '#111F36', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardMuted: { borderRadius: 22, padding: 18, gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  bodyText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 22 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryButton: { minHeight: 48, borderRadius: 999, backgroundColor: '#4F83FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: { minHeight: 46, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.065)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  ghostButton: { minHeight: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  ghostButtonText: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '900' },
  warmButton: { minHeight: 50, borderRadius: 999, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  warmButtonText: { color: '#07111F', fontSize: 14, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 },
  buttonTextDisabled: { opacity: 0.75 },
  inlinePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.76)', fontSize: 11, fontWeight: '900' },
  readPill: { backgroundColor: 'rgba(56,201,168,0.12)', color: '#38C9A8' },
  createPill: { backgroundColor: 'rgba(245,166,35,0.12)', color: '#F5A623' },
  warningPill: { backgroundColor: 'rgba(255,94,108,0.12)', color: '#FF5E6C' },
  settingRow: { flexDirection: 'row', gap: 14, alignItems: 'center', justifyContent: 'space-between' },
  settingTextBlock: { flex: 1, gap: 7 },
  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, backgroundColor: 'rgba(56,201,168,0.10)', borderWidth: 1, borderColor: 'rgba(56,201,168,0.18)' },
  syncBannerWarning: { backgroundColor: 'rgba(245,166,35,0.10)', borderColor: 'rgba(245,166,35,0.18)' },
  syncTextBlock: { flex: 1, gap: 3 },
  syncTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  syncText: { color: 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 17 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: 18, padding: 14, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  metricValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  metricLabel: { marginTop: 4, color: 'rgba(255,255,255,0.54)', fontSize: 12, fontWeight: '800' },
  qaGrid: { gap: 10 },
  quickActionCard: { borderRadius: 20, padding: 16, gap: 8, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  quickTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  quickDetail: { color: 'rgba(255,255,255,0.56)', fontSize: 13, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  emptyState: { borderRadius: 24, padding: 22, gap: 12, alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  iconBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79,131,255,0.12)' },
  iconBadge_blue: { backgroundColor: 'rgba(79,131,255,0.13)' },
  iconBadge_teal: { backgroundColor: 'rgba(56,201,168,0.13)' },
  iconBadge_purple: { backgroundColor: 'rgba(155,114,255,0.13)' },
  iconBadge_amber: { backgroundColor: 'rgba(245,166,35,0.13)' },
  iconBadge_red: { backgroundColor: 'rgba(255,94,108,0.13)' },
  iconBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  documentList: { gap: 12 },
  documentCard: { borderRadius: 22, padding: 16, gap: 12, backgroundColor: '#111F36', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  documentTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  documentTitleBlock: { flex: 1, gap: 2 },
  documentTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  documentMeta: { color: 'rgba(255,255,255,0.48)', fontSize: 12, fontWeight: '700' },
  documentPreview: { color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 20 },
  progressTrack: { height: 5, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  progressTrackTall: { height: 7, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#4F83FF' },
  uploadDropzone: { borderRadius: 28, padding: 22, gap: 12, alignItems: 'center', backgroundColor: 'rgba(79,131,255,0.08)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(123,163,255,0.45)' },
  uploadIconRing: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79,131,255,0.14)' },
  uploadIconText: { color: '#7BA3FF', fontWeight: '900', fontSize: 16 },
  dropzoneTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  dropzoneSub: { color: 'rgba(255,255,255,0.58)', fontSize: 13, textAlign: 'center' },
  sourceGrid: { gap: 10 },
  sourceCard: { borderRadius: 20, padding: 16, gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sourceCardActive: { borderColor: 'rgba(123,163,255,0.50)', backgroundColor: 'rgba(79,131,255,0.10)' },
  sourceTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  sourceDetail: { color: 'rgba(255,255,255,0.56)', fontSize: 13, lineHeight: 19 },
  label: { color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { minHeight: 50, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', color: '#FFFFFF', fontSize: 15 },
  textArea: { minHeight: 160, lineHeight: 22 },
  helpText: { color: 'rgba(255,255,255,0.52)', fontSize: 12, lineHeight: 18 },
  errorText: { color: '#FF5E6C', fontSize: 13, lineHeight: 19, fontWeight: '800' },
  successText: { color: '#38C9A8', fontSize: 13, lineHeight: 19, fontWeight: '800' },
  readerLayout: { gap: 14 },
  readerMain: { borderRadius: 24, padding: 20, gap: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  docTitle: { color: '#07111F', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  docMeta: { color: 'rgba(7,17,31,0.52)', fontSize: 13, fontWeight: '800' },
  docDivider: { height: 1, backgroundColor: 'rgba(7,17,31,0.12)', marginVertical: 6 },
  readerText: { color: '#111F36', fontSize: 18, lineHeight: 31, fontWeight: '500' },
  readerSidePanel: { borderRadius: 24, padding: 16, gap: 14, backgroundColor: '#0C1A2E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sideSection: { gap: 9 },
  sideLabel: { color: 'rgba(255,255,255,0.56)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  selectBox: { minHeight: 44, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  selectText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sideRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  speedValue: { color: '#7BA3FF', fontSize: 13, fontWeight: '900' },
  speedButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  speedButton: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  speedButtonActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  speedButtonText: { color: 'rgba(255,255,255,0.76)', fontWeight: '900', fontSize: 12 },
  speedButtonTextActive: { color: '#07111F' },
  hmButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  hmButton: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.055)', color: 'rgba(255,255,255,0.70)', fontWeight: '900', fontSize: 12 },
  hmButtonActive: { backgroundColor: '#FFFFFF', color: '#07111F' },
  hmButtonLarge: { fontSize: 16 },
  toggleRowMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 },
  toggleLabelMini: { color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: '700' },
  toggleMini: { width: 34, height: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  toggleMiniOn: { backgroundColor: '#38C9A8' },
  playerDock: { borderRadius: 28, padding: 16, gap: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  playerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerThumb: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F83FF' },
  playerThumbText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  playerInfo: { flex: 1, gap: 2 },
  playerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  playerSub: { color: 'rgba(255,255,255,0.56)', fontSize: 12, fontWeight: '700' },
  playerTime: { color: '#7BA3FF', fontSize: 13, fontWeight: '900' },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  plButton: { minHeight: 42, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.075)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  plButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  playButton: { minHeight: 54, borderRadius: 999, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  playButtonText: { color: '#07111F', fontSize: 15, fontWeight: '900' },
  waveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 38, overflow: 'hidden' },
  waveBar: { width: 4, borderRadius: 999, backgroundColor: '#7BA3FF' },
  playerBottomRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  compactMeta: { color: 'rgba(255,255,255,0.60)', fontSize: 12, fontWeight: '700' },
  speedChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  speedChipText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  readerProgressCard: { flexDirection: 'row', gap: 16, alignItems: 'center', borderRadius: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  readerProgressCopy: { flex: 1, gap: 8 },
  progressWrap: { width: 126, height: 126, alignItems: 'center', justifyContent: 'center' },
  progressHalo: { position: 'absolute', width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(79,131,255,0.13)' },
  progressSvg: { position: 'absolute' },
  progressCenter: { alignItems: 'center', justifyContent: 'center' },
  progressNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  progressLabel: { color: 'rgba(255,255,255,0.52)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  planList: { gap: 12 },
  planCard: { borderRadius: 22, padding: 18, gap: 12, backgroundColor: '#111F36', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  planHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  planPrice: { color: '#7BA3FF', fontSize: 13, fontWeight: '900', marginTop: 4 },
  preferenceGrid: { gap: 10 },
  prefCard: { borderRadius: 20, padding: 16, gap: 8, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  prefTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
});
