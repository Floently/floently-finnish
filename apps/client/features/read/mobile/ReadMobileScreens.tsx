import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
type ReadTab = 'home' | 'import' | 'library' | 'reader' | 'settings' | 'subscribe';
type ImportMode = 'paste' | 'file' | 'url';
type SyncStatus = 'idle' | 'loading' | 'syncing' | 'offline' | 'error';
type AudioPlaybackState = 'idle' | 'preparing' | 'ready' | 'playing' | 'paused' | 'error';

const READ_LOGO = require('./assets/floently_read.png');

const sampleText = 'This is a short Floently Read test. I want to check that reading, saving, and listening work correctly.';

const importChannels = [
  { label: 'Paste text', detail: 'Paste notes, lessons, articles, or drafts.', route: '/read/import' },
  { label: 'Upload file', detail: 'PDF, EPUB, DOCX, TXT, Markdown, or HTML.', route: '/read/import' },
  { label: 'Web link', detail: 'Import a public article or readable web page.', route: '/read/import' },
  { label: 'Google Drive', detail: 'Native Drive picker is kept as a product slot.', route: '/read/import' },
  { label: 'OneDrive', detail: 'Native OneDrive import is kept as a product slot.', route: '/read/import' },
];

function navigate(path: string) {
  router.push(path as never);
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Saved reading';
  return new Date(parsed).toLocaleDateString();
}

function ProductLogo() {
  return <Image source={READ_LOGO} resizeMode="contain" style={styles.productLogo} />;
}

function TopNav({ active = 'home' }: { active?: ReadTab }) {
  const items: Array<{ key: ReadTab; label: string; route: string }> = [
    { key: 'home', label: 'Home', route: '/read/app' },
    { key: 'import', label: 'Import', route: '/read/import' },
    { key: 'library', label: 'Library', route: '/read/library' },
    { key: 'reader', label: 'Reader', route: '/read/reader' },
    { key: 'settings', label: 'Preferences', route: '/read/settings' },
  ];

  return (
    <View style={styles.topNavWrap}>
      <View style={styles.topNavMain}>
        <Pressable accessibilityRole="button" onPress={() => navigate('/read')} style={styles.logoButton}>
          <ProductLogo />
        </Pressable>
        <View style={styles.topNavActions}>
          <Pressable accessibilityRole="button" onPress={() => navigate('/')} style={styles.navTextButton}>
            <Text style={styles.navTextButtonText}>Floently Home</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigate('/read')} style={styles.navTextButton}>
            <Text style={styles.navTextButtonText}>Read landing</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRail}>
        {items.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.key === active }}
            key={item.key}
            onPress={() => navigate(item.route)}
            style={[styles.tabPill, item.key === active && styles.tabPillActive]}
          >
            <Text style={[styles.tabPillText, item.key === active && styles.tabPillTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: active === 'subscribe' }}
          onPress={() => navigate('/read/subscribe')}
          style={[styles.tabPill, styles.tabPillPlan, active === 'subscribe' && styles.tabPillActive]}
        >
          <Text style={[styles.tabPillText, active === 'subscribe' && styles.tabPillTextActive]}>Plans</Text>
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
      <TopNav active={active} />
      <View style={styles.heroShell}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
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

function SyncBanner({ status, error, onRefresh }: { status: SyncStatus; error: string | null; onRefresh?: () => void }) {
  const isBusy = status === 'loading' || status === 'syncing';
  const isOffline = status === 'offline' || status === 'error';

  return (
    <View style={[styles.syncBanner, isOffline && styles.syncBannerWarning]}>
      <View style={styles.syncBannerTextBlock}>
        <Text style={styles.syncTitle}>{isBusy ? 'Syncing Read library' : isOffline ? 'Read is using local fallback' : 'Read library connected'}</Text>
        <Text style={styles.syncText} numberOfLines={2}>
          {isBusy
            ? 'Syncing your readings and progress.'
            : isOffline
              ? error || 'Your online library is temporarily unavailable. Local readings stay open.'
              : 'Your readings and progress sync when you are signed in.'}
        </Text>
      </View>
      {isBusy ? <ActivityIndicator color="#8FA8FF" /> : onRefresh ? <GhostButton label="Refresh" onPress={onRefresh} /> : null}
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
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      <PrimaryButton label={actionLabel} onPress={onAction} />
    </View>
  );
}

function DocumentCard({ document }: { document: ReadDocument }) {
  const progressLabel = `${Math.round(document.readingProgress * 100)}% read`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        useReadMobileStore.getState().openDocument(document.id);
        navigate('/read/reader');
      }}
      style={styles.documentCard}
    >
      <View style={styles.documentTitleRow}>
        <Text style={styles.documentTitle}>{document.title}</Text>
        <Pill label={document.detectedLanguageLabel} tone="read" />
      </View>
      <Text numberOfLines={3} style={styles.documentPreview}>{document.generatedText}</Text>
      <View style={styles.documentFooter}>
        <Text style={styles.documentMeta}>{progressLabel}</Text>
        <Text style={styles.documentMetaMuted}>{formatDate(document.createdAtIso)}</Text>
      </View>
    </Pressable>
  );
}

function ImportChannelCard({ label, detail, onPress }: { label: string; detail: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.importChannelCard}>
      <View style={styles.importIconBadge}>
        <Text style={styles.importIconText}>{label.slice(0, 1)}</Text>
      </View>
      <View style={styles.importChannelText}>
        <Text style={styles.importChannelTitle}>{label}</Text>
        <Text style={styles.importChannelDetail}>{detail}</Text>
      </View>
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
      active="home"
      eyebrow="Floently Read"
      title="Listen to any text, anytime, anywhere"
      subtitle="A native Read workspace for importing text, saving readings, generating audio, and continuing your library across sessions."
    >
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />

      <View style={styles.webDashboardGrid}>
        <View style={styles.webPanelLarge}>
          <Text style={styles.panelKicker}>Start here</Text>
          <Text style={styles.panelTitle}>Import once. Read or listen immediately.</Text>
          <Text style={styles.bodyText}>The mobile app now follows the same product flow as Read on web: landing, auth, app, import, library, reader, preferences, and plans.</Text>
          <View style={styles.buttonRow}>
            <PrimaryButton label="Import text or book" onPress={() => navigate('/read/import')} />
            <SecondaryButton label="Open library" onPress={() => navigate('/read/library')} />
          </View>
          <View style={styles.inlinePills}>
            <Pill label="Auto language" tone="read" />
            <Pill label="Cloud library" tone="read" />
            <Pill label={readAutomatically ? 'Auto-read on' : 'Manual start'} tone={readAutomatically ? 'read' : 'warning'} />
          </View>
        </View>

        <View style={styles.webPanelSmall}>
          <Text style={styles.panelKicker}>Preferences</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <Text style={styles.cardTitle}>Read automatically</Text>
              <Text style={styles.bodyText}>New imports detect language, save, and open the reader by default.</Text>
            </View>
            <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard value={String(documents.length)} label="Saved" />
        <MetricCard value={String(completedCount)} label="Finished" />
        <MetricCard value={activeReading ? `${Math.round(activeReading.readingProgress * 100)}%` : '0%'} label="Current" />
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Import choices</Text>
            <Text style={styles.sectionSubtitle}>Same product slots as the web app, implemented natively.</Text>
          </View>
          <GhostButton label="Import" onPress={() => navigate('/read/import')} />
        </View>
        <View style={styles.importGrid}>
          {importChannels.map((channel) => (
            <ImportChannelCard key={channel.label} label={channel.label} detail={channel.detail} onPress={() => navigate(channel.route)} />
          ))}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Continue reading</Text>
            <Text style={styles.sectionSubtitle}>Saved readings, progress, and listening state.</Text>
          </View>
          <GhostButton label="Refresh" onPress={() => void refreshLibrary()} />
        </View>
        {activeReading ? (
          <DocumentCard document={activeReading} />
        ) : (
          <EmptyState
            title="No readings yet"
            body="Paste text, import a web link, or upload a document to create your first Read item."
            actionLabel="Import reading"
            onAction={() => navigate('/read/import')}
          />
        )}
      </View>
    </ReadAppFrame>
  );
}

function ImportModeButton({ mode, activeMode, label, onPress }: { mode: ImportMode; activeMode: ImportMode; label: string; onPress: () => void }) {
  const isActive = mode === activeMode;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.modeButton, isActive && styles.modeButtonActive]}>
      <Text style={[styles.modeButtonText, isActive && styles.modeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ReadImportScreen() {
  const createFromText = useReadMobileStore((state) => state.createFromText);
  const createFromUrl = useReadMobileStore((state) => state.createFromUrl);
  const createFromFile = useReadMobileStore((state) => state.createFromFile);
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const [title, setTitle] = useState('Floently Read test');
  const [text, setText] = useState(sampleText);
  const [mode, setMode] = useState<ImportMode>('paste');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const trimmedText = text.trim();
  const wordCount = useMemo(() => trimmedText ? trimmedText.split(/\s+/).length : 0, [trimmedText]);
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 170));
  const canGenerate = trimmedText.length >= 8;

  function generate() {
    if (!canGenerate) return;
    setImportError(null);
    const document = createFromText({ title, text: trimmedText, language: 'auto' });
    useReadMobileStore.getState().openDocument(document.id);
    navigate(readAutomatically ? '/read/reader' : '/read/library');
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
      useReadMobileStore.getState().openDocument(document.id);
      navigate(readAutomatically ? '/read/reader' : '/read/library');
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
      useReadMobileStore.getState().openDocument(document.id);
      navigate(readAutomatically ? '/read/reader' : '/read/library');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ReadAppFrame
      active="import"
      eyebrow="Import"
      title="Bring text, links, and files into Read"
      subtitle="The native import flow mirrors the web product: paste, upload, URL import, and reserved Drive slots."
    >
      <SyncBanner status={syncStatus} error={syncError} />

      <View style={styles.modeTabs}>
        <ImportModeButton mode="paste" activeMode={mode} label="Paste text" onPress={() => setMode('paste')} />
        <ImportModeButton mode="file" activeMode={mode} label="Book file" onPress={() => setMode('file')} />
        <ImportModeButton mode="url" activeMode={mode} label="Web link" onPress={() => setMode('url')} />
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Import behavior</Text>
        <Text style={styles.bodyText}>Read detects language, creates a clean reading, saves it to your library, and opens the reader automatically when the preference is on.</Text>
        <View style={styles.inlinePills}>
          <Pill label="Auto language" tone="read" />
          <Pill label={`${wordCount} words`} tone="read" />
          <Pill label={`About ${estimatedMinutes} min`} tone="read" />
          <Pill label={readAutomatically ? 'Auto-open reader' : 'Save to library'} tone={readAutomatically ? 'read' : 'warning'} />
        </View>
      </View>

      {mode === 'paste' ? (
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Reading title" placeholderTextColor="#7F96BE" />
          <Text style={styles.label}>Text</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            style={[styles.input, styles.textArea]}
            placeholder="Paste text here"
            placeholderTextColor="#7F96BE"
            textAlignVertical="top"
          />
          <PrimaryButton label={readAutomatically ? 'Generate and start reading' : 'Generate and save'} onPress={generate} disabled={!canGenerate} />
          {!canGenerate ? <Text style={styles.helpText}>Paste at least a short paragraph to generate a reading.</Text> : null}
        </View>
      ) : null}

      {mode === 'file' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload a book or document</Text>
          <Text style={styles.bodyText}>Choose TXT, Markdown, HTML, PDF, DOCX, or EPUB. Floently extracts readable text and saves it to your Read library.</Text>
          <View style={styles.inlinePills}>
            <Pill label="PDF" tone="read" />
            <Pill label="EPUB" tone="read" />
            <Pill label="DOCX" tone="read" />
            <Pill label="TXT" tone="read" />
          </View>
          {fileName ? <Text style={styles.helpText}>Selected: {fileName}</Text> : null}
          <PrimaryButton label={isImporting ? 'Importing...' : readAutomatically ? 'Choose file and start reading' : 'Choose file and save'} onPress={() => void importFile()} disabled={isImporting} />
          {importError ? <Text style={styles.errorText}>{importError}</Text> : null}
        </View>
      ) : null}

      {mode === 'url' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Import from web link</Text>
          <Text style={styles.bodyText}>Paste a public article or web page link. Floently saves the readable text to your Read library.</Text>
          <Text style={styles.label}>Web link</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
            placeholder="https://example.com/article"
            placeholderTextColor="#8FA0D0"
          />
          <PrimaryButton label={isImporting ? 'Importing...' : readAutomatically ? 'Import and start reading' : 'Import to library'} onPress={() => void importUrl()} disabled={isImporting || !url.trim()} />
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

  return (
    <ReadAppFrame active="library" eyebrow="Library" title="Saved readings" subtitle="The native library keeps the web Read structure: saved items, progress, language, and direct reader entry.">
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Library</Text>
            <Text style={styles.sectionSubtitle}>{documents.length ? `${documents.length} saved item${documents.length === 1 ? '' : 's'}` : 'No saved items yet'}</Text>
          </View>
          <GhostButton label="Refresh" onPress={() => void refreshLibrary()} />
        </View>
        {documents.length ? (
          <View style={styles.documentList}>{documents.map((document) => <DocumentCard key={document.id} document={document} />)}</View>
        ) : (
          <EmptyState
            title="Your Read library is empty"
            body="Import text now. This screen holds books, files, and web articles after they are saved."
            actionLabel="Import first reading"
            onAction={() => navigate('/read/import')}
          />
        )}
      </View>
    </ReadAppFrame>
  );
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 116;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - safeProgress);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressGlow} />
      <Svg width={size} height={size} style={styles.progressSvg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#252D61" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#8FA8FF"
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
        <Text style={styles.progressNumber}>{Math.round(safeProgress * 100)}%</Text>
        <Text style={styles.progressLabel}>read</Text>
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
    if (playbackStatus.duration > 0) {
      return Math.max(0, Math.min(1, playbackStatus.currentTime / playbackStatus.duration));
    }
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
      const result = await readTtsApi.prerenderReading({
        text: document.generatedText,
        language: document.language,
      });
      setAudioResult(result);
      player.replace(result.audioUrl);
      player.playbackRate = document.playbackSpeed;
      player.play();
      setAudioState('playing');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAudioState('error');
      setAudioError(message);
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
      <ReadAppFrame active="reader" eyebrow="Reader" title="Nothing open yet" subtitle="Import or select a saved reading to open the native reader.">
        <View style={styles.card}>
          <EmptyState
            title="No active reading"
            body="Import or paste text to open the reader."
            actionLabel="Import reading"
            onAction={() => navigate('/read/import')}
          />
        </View>
      </ReadAppFrame>
    );
  }

  const isPreparing = audioState === 'preparing' || playbackStatus.isBuffering;
  const isPlaying = audioState === 'playing' || playbackStatus.playing;

  return (
    <ReadAppFrame active="reader" eyebrow="Reader" title={document.title} subtitle="Read text and audio stay in one calm reader surface, matching the web product flow.">
      <View style={styles.readerHero}>
        <CircularProgress progress={displayedProgress} />
        <View style={styles.playerMetaBlock}>
          <Text style={styles.compactMeta}>{timeLabel} - {document.playbackSpeed.toFixed(1)}x</Text>
          <Text style={styles.bodyText}>Language: {document.detectedLanguageLabel}</Text>
          <Pill
            label={isPreparing ? 'Generating audio' : isPlaying ? 'Listening now' : audioResult ? 'Audio ready' : 'Ready to listen'}
            tone={audioState === 'error' ? 'warning' : isPlaying || audioResult ? 'read' : 'neutral'}
          />
        </View>
      </View>

      <View style={styles.playerDock}>
        <PrimaryButton
          label={isPreparing ? 'Preparing audio...' : isPlaying ? 'Pause listening' : audioResult ? 'Play audio' : 'Generate and listen'}
          onPress={isPlaying ? pauseAudio : generateAndPlayAudio}
          disabled={isPreparing}
        />
        <SecondaryButton label="Replay" onPress={replayAudio} disabled={!audioResult || isPreparing} />
        <SecondaryButton label="Library" onPress={() => navigate('/read/library')} />
      </View>

      <View style={styles.playerDock}>
        <SecondaryButton label="25%" onPress={() => updateProgress(document.id, 0.25)} />
        <SecondaryButton label="50%" onPress={() => updateProgress(document.id, 0.5)} />
        <SecondaryButton label="Done" onPress={() => updateProgress(document.id, 1)} />
      </View>

      <View style={styles.playerDock}>
        <SecondaryButton label="0.8x" onPress={() => setPlaybackSpeed(document.id, 0.8)} />
        <SecondaryButton label="1.0x" onPress={() => setPlaybackSpeed(document.id, 1)} />
        <SecondaryButton label="1.2x" onPress={() => setPlaybackSpeed(document.id, 1.2)} />
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Listening connected</Text>
        <Text style={styles.bodyText}>
          Floently prepares natural audio for this reading and plays it directly in the app.
          {audioResult?.cacheHit ? ' This audio was served from cache.' : audioResult ? ' This audio is ready for replay.' : ' Tap Generate and listen to start.'}
        </Text>
        {audioResult?.duration ? <Text style={styles.helpText}>Audio duration: {Math.round(audioResult.duration)} seconds</Text> : null}
        {audioError ? <Text style={styles.errorText}>{audioError}</Text> : null}
      </View>

      <View style={styles.readerTextCard}>
        <Text style={styles.readerText}>{document.generatedText}</Text>
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
  {
    id: 'reader_monthly',
    title: 'Reader Monthly',
    priceHint: '11.99 EUR / month',
    body: 'Read, listen, import text, and continue your library across sessions.',
  },
  {
    id: 'reader_yearly',
    title: 'Reader Yearly',
    priceHint: '119.90 EUR / year',
    body: 'Annual Reader access for reading, listening, and document practice.',
    platformNote: 'Android yearly is added after the RevenueCat compatibility warning is cleared; iOS yearly is ready.',
  },
  {
    id: 'creator_monthly',
    title: 'Creator Monthly',
    priceHint: '29.99 EUR / month',
    body: 'Creator-tier access for Read content tools, summaries, captions, and hooks as they are enabled.',
  },
  {
    id: 'creator_yearly',
    title: 'Creator Yearly',
    priceHint: '299.90 EUR / year',
    body: 'Annual Creator access for Read content tools and richer creator workflows.',
    platformNote: 'Android yearly is added after the RevenueCat compatibility warning is cleared; iOS yearly is ready.',
  },
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
  if (
    normalized === 'reader_monthly' ||
    normalized === 'reader_yearly' ||
    normalized === 'creator_monthly' ||
    normalized === 'creator_yearly'
  ) {
    return normalized;
  }
  return null;
}

async function syncReadPurchaseToBackend(
  result: ReadRevenueCatSyncSource,
  planId?: ReadStorePlanId | null,
): Promise<boolean> {
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
      setPurchaseMessage(
        result.creatorAccess
          ? `Creator access is active. Read Creator purchases now unlock the Read Creator tier in this app.${syncSuffix}`
          : result.readAccess
            ? `Read access is active. Your app-store subscription has been restored in the app.${syncSuffix}`
            : 'Purchase completed. If access does not update immediately, tap Restore purchases.',
      );
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
      setPurchaseMessage(
        result.creatorAccess
          ? `Creator access restored.${syncSuffix}`
          : result.readAccess
            ? `Read access restored.${syncSuffix}`
            : 'No active Read purchase was found for this store account.',
      );
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <ReadAppFrame active="subscribe" eyebrow="Plans" title="Floently Read access" subtitle="Native mobile plans stay connected to RevenueCat and backend Read entitlements.">
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
    <ReadAppFrame active="settings" eyebrow="Preferences" title="Read preferences" subtitle="Mobile preferences now match the web product categories instead of using the old generic settings surface.">
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.cardTitle}>Read automatically after import</Text>
            <Text style={styles.bodyText}>When enabled, new readings open directly in the reader after text, URL, or file import.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
      </View>
      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>More web-parity preferences</Text>
        <Text style={styles.bodyText}>Voice, reading mode, account, analytics, and cloud import preferences are preserved as native product slots while the app remains a real iOS and Android app.</Text>
      </View>
    </ReadAppFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#0B0F24',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 42,
    gap: 18,
  },
  topNavWrap: {
    gap: 12,
  },
  topNavMain: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoButton: {
    minHeight: 68,
    justifyContent: 'center',
  },
  productLogo: {
    width: 158,
    height: 82,
  },
  topNavActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    flex: 1,
  },
  navTextButton: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  navTextButtonText: {
    color: 'rgba(255,255,255,0.76)',
    fontWeight: '800',
    fontSize: 12,
  },
  tabRail: {
    gap: 8,
    paddingRight: 8,
  },
  tabPill: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  tabPillPlan: {
    borderColor: 'rgba(143,168,255,0.35)',
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabPillText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: '800',
  },
  tabPillTextActive: {
    color: '#11152B',
  },
  heroShell: {
    borderRadius: 34,
    padding: 24,
    minHeight: 230,
    overflow: 'hidden',
    backgroundColor: '#101838',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(79,107,255,0.18)',
    left: -90,
    top: -80,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(155,107,255,0.14)',
    right: -70,
    top: -40,
  },
  heroCopy: {
    gap: 14,
    position: 'relative',
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: '#8FA8FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(79,107,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(79,107,255,0.30)',
    overflow: 'hidden',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 16,
    lineHeight: 25,
  },
  webDashboardGrid: {
    gap: 14,
  },
  webPanelLarge: {
    borderRadius: 26,
    padding: 22,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  webPanelSmall: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  panelKicker: {
    color: '#8FA8FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardMuted: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  bodyText: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 14,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: '#6F77FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 19,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  ghostButton: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '900',
  },
  warmButton: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: '#E2AA62',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 19,
  },
  warmButtonText: {
    color: '#120804',
    fontSize: 15,
    fontWeight: '900',
  },
  buttonDisabled: { opacity: 0.55 },
  buttonTextDisabled: { opacity: 0.7 },
  inlinePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
  },
  readPill: {
    backgroundColor: 'rgba(79,107,255,0.16)',
    borderColor: 'rgba(143,168,255,0.35)',
    color: '#BFD0FF',
  },
  createPill: {
    backgroundColor: 'rgba(226,170,98,0.16)',
    borderColor: 'rgba(226,170,98,0.32)',
    color: '#F2CA8C',
  },
  warningPill: {
    backgroundColor: 'rgba(255,190,92,0.12)',
    borderColor: 'rgba(255,190,92,0.28)',
    color: '#FFD79A',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingTextBlock: { flex: 1, gap: 6 },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  sectionBlock: {
    borderRadius: 26,
    padding: 18,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  importGrid: {
    gap: 10,
  },
  importChannelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  importIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,107,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(143,168,255,0.25)',
  },
  importIconText: {
    color: '#C7D5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  importChannelText: { flex: 1, gap: 3 },
  importChannelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  importChannelDetail: { color: 'rgba(255,255,255,0.52)', fontSize: 12, lineHeight: 18 },
  emptyState: {
    gap: 12,
    alignItems: 'flex-start',
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  documentList: { gap: 10 },
  documentCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  documentTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    flex: 1,
  },
  documentPreview: {
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 20,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  documentMeta: {
    color: '#BFD0FF',
    fontSize: 12,
    fontWeight: '900',
  },
  documentMetaMuted: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontWeight: '700',
  },
  syncBanner: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(79,107,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(143,168,255,0.22)',
  },
  syncBannerWarning: {
    backgroundColor: 'rgba(255,190,92,0.10)',
    borderColor: 'rgba(255,190,92,0.24)',
  },
  syncBannerTextBlock: { flex: 1, gap: 3 },
  syncTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  syncText: { color: 'rgba(255,255,255,0.58)', fontSize: 12, lineHeight: 17 },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  modeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.66)',
    fontWeight: '900',
    fontSize: 12,
  },
  modeButtonTextActive: {
    color: '#11152B',
  },
  label: {
    color: '#BFD0FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 170,
    paddingTop: 14,
  },
  helpText: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: '#FFB4B4',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  successText: {
    color: '#9EF0CB',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  progressWrap: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(143,168,255,0.18)',
  },
  progressSvg: { position: 'absolute' },
  progressCenter: { alignItems: 'center', justifyContent: 'center' },
  progressNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  progressLabel: { color: 'rgba(255,255,255,0.52)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  readerHero: {
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  playerMetaBlock: { flex: 1, gap: 8 },
  compactMeta: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  playerDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  readerTextCard: {
    borderRadius: 26,
    padding: 22,
    backgroundColor: '#F8F9FF',
  },
  readerText: {
    color: '#151A35',
    fontSize: 18,
    lineHeight: 30,
  },
  planList: { gap: 12 },
  planCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  planHeaderRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  planTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  planPrice: { color: '#BFD0FF', fontSize: 14, fontWeight: '900', marginTop: 4 },
});
