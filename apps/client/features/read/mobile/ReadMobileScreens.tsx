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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import {
  useActiveReadDocument,
  useReadMobileStore,
  type ReadDocument,
  type ReadTheme,
} from './readMobileStore';
import { readTtsApi, type ReadTtsResult } from './readTtsApi';
import { readRenderApi } from './readRenderApi';
import { restoreReadStorePurchases, startReadStorePurchase, type ReadStorePlanId } from '../../billing/services/storeBillingService';
import { useSubscriptionStore } from '../../../state/subscriptionStore';

type ReadTab = 'home' | 'library' | 'import' | 'reader' | 'settings' | 'analytics' | 'subscribe' | 'create';
type ImportMode = 'file' | 'paste' | 'url' | 'scan' | 'record';
type AudioPlaybackState = 'idle' | 'preparing' | 'ready' | 'playing' | 'paused' | 'error';
type ReadTone = 'blue' | 'purple' | 'teal' | 'amber' | 'rose' | 'neutral';

type Palette = {
  key: ReadTheme;
  isLight: boolean;
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceRaised: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  borderStrong: string;
  accent: string;
  accent2: string;
  accentText: string;
  success: string;
  warning: string;
  danger: string;
  readerPaper: string;
  readerText: string;
  readerMuted: string;
  nav: string;
  shadow: string;
};

const READ_LOGO = require('./assets/floently_read.png');
const sampleText = 'Paste an article, a note, a chapter, or a script. Floently will save it to your library instantly and prepare natural narration while you keep moving.';

const bottomTabs: Array<{ key: ReadTab; label: string; route: string; icon: string }> = [
  { key: 'home', label: 'Home', route: '/read/app', icon: 'Home' },
  { key: 'library', label: 'Library', route: '/read/library', icon: 'Files' },
  { key: 'import', label: 'Import', route: '/read/import', icon: '+' },
  { key: 'create', label: 'Create', route: '/create', icon: 'AI' },
  { key: 'settings', label: 'Settings', route: '/read/settings', icon: 'Set' },
];

const importActions: Array<{ mode: ImportMode; label: string; detail: string; icon: string; soon?: boolean }> = [
  { mode: 'file', label: 'File', detail: 'PDF, DOCX, TXT, EPUB', icon: 'File' },
  { mode: 'scan', label: 'Scan', detail: 'Camera scan soon', icon: 'Cam', soon: true },
  { mode: 'url', label: 'Link', detail: 'Paste any URL', icon: 'Link' },
  { mode: 'paste', label: 'Paste', detail: 'Text from clipboard', icon: 'Text' },
  { mode: 'record', label: 'Record', detail: 'Audio import soon', icon: 'Mic', soon: true },
];

const readPlans: Array<{ id: ReadStorePlanId; title: string; priceHint: string; body: string; platformNote?: string }> = [
  { id: 'reader_monthly', title: 'Reader Monthly', priceHint: '11.99 EUR / month', body: 'Read, listen, import text, and continue your library across sessions.' },
  { id: 'reader_yearly', title: 'Reader Yearly', priceHint: '119.90 EUR / year', body: 'Annual Reader access for reading, listening, and document practice.', platformNote: 'Android yearly can be enabled after RevenueCat compatibility is clear; iOS yearly is ready.' },
];

function paletteFor(theme: ReadTheme): Palette {
  if (theme === 'light') {
    return {
      key: theme,
      isLight: true,
      background: '#F5F7FE',
      surface: '#FFFFFF',
      surfaceSoft: '#EEF2FF',
      surfaceRaised: '#FFFFFF',
      text: '#111827',
      muted: '#667085',
      faint: '#9AA4B2',
      border: 'rgba(15, 35, 78, 0.10)',
      borderStrong: 'rgba(88, 76, 255, 0.28)',
      accent: '#6D5DFF',
      accent2: '#3CD5C7',
      accentText: '#FFFFFF',
      success: '#19A974',
      warning: '#B87900',
      danger: '#DC3545',
      readerPaper: '#FFFFFF',
      readerText: '#111827',
      readerMuted: '#6B7280',
      nav: 'rgba(255,255,255,0.92)',
      shadow: 'rgba(32, 41, 74, 0.12)',
    };
  }

  if (theme === 'sepia') {
    return {
      key: theme,
      isLight: true,
      background: '#F6EFE2',
      surface: '#FFF8EA',
      surfaceSoft: '#F1E4CF',
      surfaceRaised: '#FFFDF6',
      text: '#2D2015',
      muted: '#766A5E',
      faint: '#A99B89',
      border: 'rgba(95, 67, 38, 0.13)',
      borderStrong: 'rgba(139, 92, 246, 0.25)',
      accent: '#8B5CF6',
      accent2: '#C0832F',
      accentText: '#FFFFFF',
      success: '#408A63',
      warning: '#9A6500',
      danger: '#B33A3A',
      readerPaper: '#FFF8EA',
      readerText: '#2D2015',
      readerMuted: '#766A5E',
      nav: 'rgba(255,248,234,0.92)',
      shadow: 'rgba(74, 46, 20, 0.12)',
    };
  }

  if (theme === 'ink') {
    return {
      key: theme,
      isLight: false,
      background: '#030407',
      surface: '#0B0D12',
      surfaceSoft: '#11141C',
      surfaceRaised: '#171B25',
      text: '#F6F4EF',
      muted: '#B5B7C2',
      faint: '#747987',
      border: 'rgba(255,255,255,0.11)',
      borderStrong: 'rgba(255,255,255,0.22)',
      accent: '#FFFFFF',
      accent2: '#A9B4FF',
      accentText: '#030407',
      success: '#49D19E',
      warning: '#F5B84B',
      danger: '#FF6B7A',
      readerPaper: '#0B0D12',
      readerText: '#F6F4EF',
      readerMuted: '#B5B7C2',
      nav: 'rgba(8,10,15,0.94)',
      shadow: 'rgba(0, 0, 0, 0.42)',
    };
  }

  return {
    key: theme,
    isLight: false,
    background: '#07111F',
    surface: '#101A2B',
    surfaceSoft: '#13223B',
    surfaceRaised: '#182641',
    text: '#FFFFFF',
    muted: '#B7C0D4',
    faint: '#7E89A3',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(134, 113, 255, 0.34)',
    accent: '#8B5CF6',
    accent2: '#38D9C0',
    accentText: '#FFFFFF',
    success: '#39D98A',
    warning: '#F5A623',
    danger: '#FF5E6C',
    readerPaper: '#F8FAFF',
    readerText: '#111827',
    readerMuted: '#5D6679',
    nav: 'rgba(12, 19, 34, 0.94)',
    shadow: 'rgba(0, 0, 0, 0.38)',
  };
}

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

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingMinutes(text: string) {
  return Math.max(1, Math.ceil(countWords(text) / 170));
}

function safePct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Saved reading';
  return new Date(parsed).toLocaleDateString();
}

function sourceLabel(document?: ReadDocument | null) {
  if (!document) return 'Reading';
  if (document.sourceType === 'url') return 'Web page';
  if (document.sourceType === 'file') return 'Document';
  if (document.sourceType === 'text') return 'Text';
  return document.sourceType || 'Reading';
}

function cardTone(tone: ReadTone, palette: Palette) {
  if (tone === 'teal') return { backgroundColor: palette.isLight ? '#E5FAF5' : 'rgba(56,217,192,0.12)', borderColor: palette.isLight ? '#B2F2E6' : 'rgba(56,217,192,0.25)' };
  if (tone === 'amber') return { backgroundColor: palette.isLight ? '#FFF6DF' : 'rgba(245,166,35,0.12)', borderColor: palette.isLight ? '#F9D586' : 'rgba(245,166,35,0.26)' };
  if (tone === 'rose') return { backgroundColor: palette.isLight ? '#FFF0F2' : 'rgba(255,94,108,0.12)', borderColor: palette.isLight ? '#F9B8C0' : 'rgba(255,94,108,0.25)' };
  if (tone === 'purple') return { backgroundColor: palette.isLight ? '#F0EDFF' : 'rgba(139,92,246,0.14)', borderColor: palette.isLight ? '#C8BEFF' : 'rgba(139,92,246,0.32)' };
  if (tone === 'neutral') return { backgroundColor: palette.surfaceSoft, borderColor: palette.border };
  return { backgroundColor: palette.isLight ? '#EAF1FF' : 'rgba(79,131,255,0.12)', borderColor: palette.isLight ? '#B6CAFF' : 'rgba(79,131,255,0.26)' };
}

function setPlayerPlaybackRate(player: ReturnType<typeof useAudioPlayer>, rate: number) {
  const safeRate = Math.max(0.1, Math.min(2, Number.isFinite(rate) ? rate : 1));
  const maybePlayer = player as unknown as { setPlaybackRate?: (rate: number) => void; playbackRate?: number };

  try {
    if (typeof maybePlayer.setPlaybackRate === 'function') {
      maybePlayer.setPlaybackRate(safeRate);
      return;
    }

    Reflect.set(maybePlayer, 'playbackRate', safeRate);
  } catch (error) {
    console.warn('Unable to set audio playback rate', error);
  }
}

function AppShell({ active, children, showBottomNav = true }: { active: ReadTab; children: ReactNode; showBottomNav?: boolean }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.glowA, { backgroundColor: palette.accent }]} />
        <View style={[styles.glowB, { backgroundColor: palette.accent2 }]} />
      </View>
      <View style={styles.appContent}>{children}</View>
      {showBottomNav ? <BottomNav active={active} palette={palette} /> : null}
    </SafeAreaView>
  );
}

function Header({ title, subtitle, showBack = false, right }: { title?: string; subtitle?: string; showBack?: boolean; right?: ReactNode }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <Pressable accessibilityRole="button" onPress={() => goBack()} style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.iconButtonText, { color: palette.text }]}>‹</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => navigate('/read/app')} style={styles.logoPressable}>
            <Image source={READ_LOGO} resizeMode="contain" style={styles.logo} />
          </Pressable>
        )}
        <View style={styles.headerTitleWrap}>
          {title ? <Text numberOfLines={1} style={[styles.headerTitle, { color: palette.text }]}>{title}</Text> : null}
          {subtitle ? <Text numberOfLines={1} style={[styles.headerSubtitle, { color: palette.muted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.headerRight}>
        {right ?? (
          <Pressable accessibilityRole="button" onPress={() => navigate('/')} style={[styles.pillButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.pillButtonText, { color: palette.text }]}>Home</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function BottomNav({ active, palette }: { active: ReadTab; palette: Palette }) {
  return (
    <View style={[styles.bottomNav, { backgroundColor: palette.nav, borderColor: palette.border, shadowColor: palette.shadow }]}>
      {bottomTabs.map((item) => {
        const isActive = item.key === active;
        const isPlus = item.key === 'import';
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={item.key}
            onPress={() => navigate(item.route)}
            style={[styles.navItem, isPlus && [styles.navPlus, { backgroundColor: palette.accent }]]}
          >
            <Text style={[styles.navIcon, { color: isPlus ? palette.accentText : isActive ? palette.accent : palette.faint }]}>{item.icon}</Text>
            {!isPlus ? <Text style={[styles.navLabel, { color: isActive ? palette.accent : palette.faint }]}>{item.label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.primaryButton, { backgroundColor: palette.accent }, disabled && styles.disabled]}>
      <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.secondaryButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, disabled && styles.disabled]}>
      <Text style={[styles.secondaryButtonText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

function MetricPill({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: ReadTone }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <View style={[styles.metricPill, cardTone(tone, palette)]}>
      <Text style={[styles.metricValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: palette.muted }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ progress, height = 5 }: { progress: number; height?: number }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <View style={[styles.progressTrack, { height, backgroundColor: palette.isLight ? 'rgba(17,24,39,0.08)' : 'rgba(255,255,255,0.09)' }]}>
      <View style={[styles.progressFill, { width: `${safePct(progress)}%`, backgroundColor: palette.accent }]} />
    </View>
  );
}

function ProgressRing({ progress, size = 68 }: { progress: number; size?: number }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <Text style={[styles.ringText, { color: palette.text }]}>{safePct(progress)}%</Text>
    </View>
  );
}

function DocumentCover({ document, large = false }: { document: ReadDocument; large?: boolean }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  const initials = document.title.trim().slice(0, 2).toUpperCase() || 'RD';
  return (
    <View style={[large ? styles.coverLarge : styles.cover, { backgroundColor: palette.surfaceSoft, borderColor: palette.borderStrong }]}>
      <Text style={[large ? styles.coverTextLarge : styles.coverText, { color: palette.accent }]}>{initials}</Text>
      <Text numberOfLines={1} style={[styles.coverType, { color: palette.muted }]}>{sourceLabel(document)}</Text>
    </View>
  );
}

function MiniPlayer({ document }: { document: ReadDocument | null }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  if (!document) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => navigate('/read/reader')} style={[styles.miniPlayer, { backgroundColor: palette.surfaceRaised, borderColor: palette.border, shadowColor: palette.shadow }]}>
      <DocumentCover document={document} />
      <View style={styles.miniPlayerText}>
        <Text numberOfLines={1} style={[styles.miniTitle, { color: palette.text }]}>{document.title}</Text>
        <Text numberOfLines={1} style={[styles.miniSub, { color: palette.muted }]}>{document.status === 'processing' ? 'Processing document' : `${readingMinutes(document.generatedText)} min • ${safePct(document.readingProgress)}%`}</Text>
        <ProgressBar progress={document.readingProgress} />
      </View>
      <View style={[styles.miniPlay, { backgroundColor: palette.accent }]}>
        <Text style={[styles.miniPlayText, { color: palette.accentText }]}>▶</Text>
      </View>
    </Pressable>
  );
}

function SyncBanner() {
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  if (syncStatus === 'idle') return null;
  const isBusy = syncStatus === 'loading' || syncStatus === 'syncing';
  const title = isBusy ? 'Syncing Read library' : syncStatus === 'offline' ? 'Read is using local fallback' : 'Read needs attention';
  const body = isBusy ? 'Documents and progress are updating in the background.' : syncError || 'Online Read service is temporarily unavailable.';

  return (
    <Pressable accessibilityRole="button" onPress={() => void refreshLibrary()} style={[styles.syncBanner, { backgroundColor: isBusy ? cardTone('teal', palette).backgroundColor : cardTone('amber', palette).backgroundColor, borderColor: isBusy ? cardTone('teal', palette).borderColor : cardTone('amber', palette).borderColor }]}>
      {isBusy ? <ActivityIndicator color={palette.accent} /> : <Text style={[styles.syncIcon, { color: palette.warning }]}>!</Text>}
      <View style={styles.syncTextWrap}>
        <Text style={[styles.syncTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.syncBody, { color: palette.muted }]}>{body}</Text>
      </View>
    </Pressable>
  );
}

function QuickAction({ mode, label, detail, icon, soon, onPress }: { mode: ImportMode; label: string; detail: string; icon: string; soon?: boolean; onPress: (mode: ImportMode) => void }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(mode)} style={[styles.quickAction, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
      <View style={[styles.quickIcon, { backgroundColor: soon ? cardTone('amber', palette).backgroundColor : cardTone('purple', palette).backgroundColor, borderColor: soon ? cardTone('amber', palette).borderColor : cardTone('purple', palette).borderColor }]}>
        <Text style={[styles.quickIconText, { color: soon ? palette.warning : palette.accent }]}>{icon}</Text>
      </View>
      <Text style={[styles.quickLabel, { color: palette.text }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.quickDetail, { color: palette.muted }]}>{soon ? 'Soon' : detail}</Text>
    </Pressable>
  );
}

function DocumentListCard({ document, compact = false }: { document: ReadDocument; compact?: boolean }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  const isProcessing = document.status === 'processing';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        useReadMobileStore.getState().openDocument(document.id);
        navigate('/read/reader');
      }}
      style={[compact ? styles.documentCardCompact : styles.documentCard, { backgroundColor: palette.surfaceRaised, borderColor: isProcessing ? palette.borderStrong : palette.border }]}
    >
      <DocumentCover document={document} large={!compact} />
      <View style={styles.documentMeta}>
        <Text numberOfLines={2} style={[styles.documentTitle, { color: palette.text }]}>{document.title}</Text>
        <Text numberOfLines={1} style={[styles.documentSub, { color: palette.muted }]}>{isProcessing ? 'Processing...' : `${sourceLabel(document)} • ${formatDate(document.createdAtIso)}`}</Text>
        <ProgressBar progress={document.readingProgress} height={4} />
      </View>
      <Text style={[styles.documentPct, { color: isProcessing ? palette.warning : palette.accent }]}>{isProcessing ? '...' : `${safePct(document.readingProgress)}%`}</Text>
    </Pressable>
  );
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel: string; onAction: () => void }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  return (
    <View style={[styles.emptyState, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
      <Text style={styles.emptyBook}>▰</Text>
      <Text style={[styles.emptyTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: palette.muted }]}>{body}</Text>
      <PrimaryButton label={actionLabel} onPress={onAction} />
    </View>
  );
}

export function ReadHomeScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const activeDocument = useActiveReadDocument();
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const completed = documents.filter((document) => document.readingProgress >= 1).length;
  const processing = documents.filter((document) => document.status === 'processing').length;

  return (
    <AppShell active="home">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollScreen}>
        <Header right={<Pressable accessibilityRole="button" onPress={() => navigate('/read/settings')} style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}><Text style={[styles.iconMini, { color: palette.text }]}>Set</Text></Pressable>} />

        <View style={styles.homeHeroRow}>
          <View style={styles.homeHeroText}>
            <Text style={[styles.kicker, { color: palette.accent2 }]}>Floently Read</Text>
            <Text style={[styles.homeTitle, { color: palette.text }]}>Read, listen, and understand.</Text>
            <Text style={[styles.homeSubtitle, { color: palette.muted }]}>Import anything, continue instantly, and listen with a calm native reader.</Text>
          </View>
          <MetricPill label="Day streak" value="7" tone="amber" />
        </View>

        <SyncBanner />

        <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Continue reading</Text>
            <Pressable onPress={() => navigate('/read/library')}>
              <Text style={[styles.linkText, { color: palette.accent }]}>See all</Text>
            </Pressable>
          </View>
          {activeDocument ? (
            <MiniPlayer document={activeDocument} />
          ) : (
            <EmptyState title="No reading yet" body="Import a file, paste text, or add a link to create your first reading." actionLabel="Add content" onAction={() => navigate('/read/import')} />
          )}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Import content</Text>
          <View style={styles.quickGrid}>
            {importActions.map((action) => (
              <QuickAction key={action.mode} {...action} onPress={(mode) => navigate(mode === 'file' || mode === 'paste' || mode === 'url' ? `/read/import?mode=${mode}` : '/read/import')} />
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricPill label="Saved" value={String(documents.length)} tone="blue" />
          <MetricPill label="Done" value={String(completed)} tone="teal" />
          <MetricPill label="Processing" value={String(processing)} tone="purple" />
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Recently opened</Text>
            <Pressable onPress={() => navigate('/read/library')}>
              <Text style={[styles.linkText, { color: palette.accent }]}>Library</Text>
            </Pressable>
          </View>
          {documents.length ? documents.slice(0, 4).map((document) => <DocumentListCard key={document.id} document={document} compact />) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

export function ReadImportScreen() {
  const createFromText = useReadMobileStore((state) => state.createFromText);
  const createFromUrl = useReadMobileStore((state) => state.createFromUrl);
  const createFromFile = useReadMobileStore((state) => state.createFromFile);
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const setReadAutomatically = useReadMobileStore((state) => state.setReadAutomatically);
  const [mode, setMode] = useState<ImportMode>('file');
  const [title, setTitle] = useState('New reading');
  const [text, setText] = useState(sampleText);
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  const trimmedText = text.trim();
  const canGenerate = trimmedText.length >= 8;
  const estimatedMinutes = readingMinutes(trimmedText || sampleText);

  function openAfterImport(document: ReadDocument) {
    useReadMobileStore.getState().openDocument(document.id);
    navigate(readAutomatically ? '/read/reader' : '/read/library');
  }

  function generateFromText() {
    if (!canGenerate) return;
    setImportError(null);
    const document = createFromText({ title, text: trimmedText, language: 'auto' });
    openAfterImport(document);
  }

  async function importFile() {
    setImportError(null);
    setIsImporting(true);
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
      openAfterImport(document);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  }

  async function importUrl() {
    if (!url.trim()) return;
    setImportError(null);
    setIsImporting(true);
    try {
      const document = await createFromUrl({ title, url });
      openAfterImport(document);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <AppShell active="import">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollScreen}>
        <Header showBack title="Add content" subtitle="Import now, process in background" right={<Pressable accessibilityRole="button" onPress={() => navigate('/read/library')} style={[styles.pillButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}><Text style={[styles.pillButtonText, { color: palette.text }]}>Library</Text></Pressable>} />

        <View style={[styles.dropZone, { backgroundColor: palette.surface, borderColor: palette.borderStrong }]}>
          <View style={[styles.bookIcon, { backgroundColor: cardTone('purple', palette).backgroundColor, borderColor: cardTone('purple', palette).borderColor }]}>
            <Text style={[styles.bookIconText, { color: palette.accent }]}>book</Text>
          </View>
          <Text style={[styles.dropTitle, { color: palette.text }]}>Drop or choose a file</Text>
          <Text style={[styles.dropBody, { color: palette.muted }]}>PDF, EPUB, DOCX, TXT and more. Floently creates a reading item immediately.</Text>
          <PrimaryButton label={isImporting ? 'Opening picker...' : 'Choose file'} onPress={() => void importFile()} disabled={isImporting} />
          {fileName ? <Text numberOfLines={2} style={[styles.fileName, { color: palette.muted }]}>Selected: {fileName}</Text> : null}
        </View>

        <View style={styles.autoRow}>
          <View style={styles.autoTextWrap}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Read automatically after import</Text>
            <Text style={[styles.cardBody, { color: palette.muted }]}>Open the reader as soon as a local item is created.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>

        <View style={styles.importGrid}>
          {importActions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.mode}
              onPress={() => setMode(action.mode)}
              style={[styles.importOption, { backgroundColor: palette.surfaceRaised, borderColor: mode === action.mode ? palette.borderStrong : palette.border }]}
            >
              <Text style={[styles.importOptionIcon, { color: action.soon ? palette.warning : palette.accent }]}>{action.icon}</Text>
              <View style={styles.importOptionText}>
                <Text style={[styles.importOptionTitle, { color: palette.text }]}>{action.label}</Text>
                <Text style={[styles.importOptionBody, { color: palette.muted }]}>{action.soon ? 'Coming soon' : action.detail}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {mode === 'paste' ? (
          <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Paste text</Text>
            <TextInput value={title} onChangeText={setTitle} style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]} placeholder="Reading title" placeholderTextColor={palette.faint} />
            <TextInput value={text} onChangeText={setText} multiline style={[styles.input, styles.textArea, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]} placeholder="Paste text here" placeholderTextColor={palette.faint} textAlignVertical="top" />
            <View style={styles.inlineRow}>
              <MetricPill label="Words" value={String(countWords(trimmedText))} tone="blue" />
              <MetricPill label="Minutes" value={String(estimatedMinutes)} tone="purple" />
            </View>
            <PrimaryButton label="Save and open" onPress={generateFromText} disabled={!canGenerate} />
          </View>
        ) : null}

        {mode === 'url' ? (
          <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Paste URL</Text>
            <TextInput value={title} onChangeText={setTitle} style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]} placeholder="Reading title" placeholderTextColor={palette.faint} />
            <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" style={[styles.input, { backgroundColor: palette.surfaceSoft, borderColor: palette.border, color: palette.text }]} placeholder="https://example.com/article" placeholderTextColor={palette.faint} />
            <PrimaryButton label={isImporting ? 'Creating item...' : 'Save and open'} onPress={() => void importUrl()} disabled={isImporting || !url.trim()} />
          </View>
        ) : null}

        {(mode === 'scan' || mode === 'record') ? (
          <View style={[styles.panel, cardTone('amber', palette)]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{mode === 'scan' ? 'Scan document' : 'Record audio'}</Text>
            <Text style={[styles.cardBody, { color: palette.muted }]}>This entry is designed into the app now and will be connected after the reader/import foundation is stable.</Text>
          </View>
        ) : null}

        {importError ? <Text style={[styles.errorText, { color: palette.danger }]}>{importError}</Text> : null}
      </ScrollView>
    </AppShell>
  );
}

export function ReadLibraryScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);
  const [query, setQuery] = useState('');
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const filtered = documents.filter((document) => document.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <AppShell active="library">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollScreen}>
        <Header showBack title="Library" subtitle={`${documents.length} saved items`} right={<Pressable accessibilityRole="button" onPress={() => navigate('/read/import')} style={[styles.iconButton, { backgroundColor: palette.accent, borderColor: palette.accent }]}><Text style={[styles.iconMini, { color: palette.accentText }]}>+</Text></Pressable>} />
        <TextInput value={query} onChangeText={setQuery} style={[styles.searchInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} placeholder="Search your readings" placeholderTextColor={palette.faint} />
        <View style={styles.filterRow}>
          {['All', 'Books', 'Articles', 'Notes', 'Processing'].map((label) => (
            <View key={label} style={[styles.filterChip, { backgroundColor: label === 'All' ? palette.accent : palette.surfaceSoft, borderColor: label === 'All' ? palette.accent : palette.border }]}>
              <Text style={[styles.filterText, { color: label === 'All' ? palette.accentText : palette.muted }]}>{label}</Text>
            </View>
          ))}
        </View>
        {filtered.length ? filtered.map((document) => <DocumentListCard key={document.id} document={document} />) : <EmptyState title="Library is empty" body="Import a file, paste text, or add a URL. New items appear here instantly." actionLabel="Add content" onAction={() => navigate('/read/import')} />}
      </ScrollView>
    </AppShell>
  );
}

function ReaderText({ document }: { document: ReadDocument }) {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  const paragraphs = document.generatedText.split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  return (
    <View style={[styles.readerPaper, { backgroundColor: palette.readerPaper, borderColor: palette.border }]}>
      <Text style={[styles.readerChapter, { color: palette.readerMuted }]}>Chapter 1</Text>
      <Text style={[styles.readerTitle, { color: palette.readerText }]}>{document.title}</Text>
      {paragraphs.slice(0, 12).map((paragraph, index) => (
        <Text key={`${paragraph.slice(0, 16)}-${index}`} style={[styles.readerParagraph, { color: palette.readerText }, index === 0 && { backgroundColor: palette.key === 'dark' ? 'rgba(139,92,246,0.16)' : 'rgba(139,92,246,0.10)', borderColor: palette.borderStrong }]}>
          {paragraph.trim()}
        </Text>
      ))}
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
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (!document) return;
    setPlayerPlaybackRate(player, document.playbackSpeed);
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

  const displayedProgress = useMemo(() => {
    if (!document) return 0;
    if (playbackStatus.duration > 0) return Math.max(0, Math.min(1, playbackStatus.currentTime / playbackStatus.duration));
    return document.readingProgress;
  }, [document, playbackStatus.currentTime, playbackStatus.duration]);

  const timeLabel = useMemo(() => {
    if (!document) return '00:00 / 00:00';
    const estimatedTotalSeconds = Math.max(30, Math.ceil(document.generatedText.length / 12));
    const totalSeconds = playbackStatus.duration > 0 ? Math.ceil(playbackStatus.duration) : estimatedTotalSeconds;
    const currentSeconds = playbackStatus.duration > 0 ? Math.floor(playbackStatus.currentTime) : Math.floor(totalSeconds * displayedProgress);
    const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return `${format(currentSeconds)} / ${format(totalSeconds)}`;
  }, [displayedProgress, document, playbackStatus.currentTime, playbackStatus.duration]);

  async function generateAndPlayAudio() {
    if (!document || document.status === 'processing') return;

    if (audioResult?.audioUrl) {
      setPlayerPlaybackRate(player, document.playbackSpeed);
      player.play();
      setAudioState('playing');
      return;
    }

    setAudioState('preparing');
    setAudioError(null);

    try {
      const ttsText = document.generatedText.slice(0, 4000);
      const result = await readTtsApi.prerenderReading({ text: ttsText, language: document.language });
      setAudioResult(result);
      player.replace(result.audioUrl);
      setPlayerPlaybackRate(player, document.playbackSpeed);
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
    if (document) setPlayerPlaybackRate(player, document.playbackSpeed);
    player.play();
    setAudioState('playing');
  }

  if (!document) {
    return (
      <AppShell active="reader">
        <ScrollView contentContainerStyle={styles.scrollScreen}>
          <Header showBack title="Reader" subtitle="Nothing open yet" />
          <EmptyState title="Nothing open yet" body="Import a file, paste text, or open something from your library to start reading." actionLabel="Add content" onAction={() => navigate('/read/import')} />
        </ScrollView>
      </AppShell>
    );
  }

  const isPreparing = audioState === 'preparing' || playbackStatus.isBuffering;
  const isPlaying = audioState === 'playing' || playbackStatus.playing;
  const isProcessing = document.status === 'processing';

  return (
    <AppShell active="reader" showBottomNav={false}>
      <View style={[styles.readerScreen, { backgroundColor: palette.background }]}>
        <Header showBack title={document.title} subtitle={`${sourceLabel(document)} • ${document.detectedLanguageLabel}`} right={<Pressable accessibilityRole="button" onPress={() => navigate('/read/settings')} style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}><Text style={[styles.iconMini, { color: palette.text }]}>Aa</Text></Pressable>} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.readerScroll}>
          {isProcessing ? (
            <View style={[styles.processingReader, { backgroundColor: palette.surface, borderColor: palette.borderStrong }]}>
              <ActivityIndicator color={palette.accent} />
              <Text style={[styles.processingTitle, { color: palette.text }]}>Preparing your reading</Text>
              <Text style={[styles.processingBody, { color: palette.muted }]}>{document.statusMessage || 'Extracting text and preparing audio in the background.'}</Text>
              <ProgressBar progress={0.62} />
              <SecondaryButton label="Open library" onPress={() => navigate('/read/library')} />
            </View>
          ) : (
            <ReaderText document={document} />
          )}
        </ScrollView>
        <View style={[styles.readerDock, { backgroundColor: palette.nav, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <View style={styles.readerDockTop}>
            <Text style={[styles.readerTime, { color: palette.muted }]}>{timeLabel}</Text>
            <Text style={[styles.readerTime, { color: palette.muted }]}>{safePct(displayedProgress)}%</Text>
          </View>
          <ProgressBar progress={displayedProgress} height={4} />
          <View style={styles.readerControls}>
            <Pressable accessibilityRole="button" onPress={() => updateProgress(document.id, Math.max(0, document.readingProgress - 0.1))} style={[styles.roundControl, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.roundControlText, { color: palette.text }]}>-10</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={isPlaying ? pauseAudio : generateAndPlayAudio} disabled={isPreparing || isProcessing} style={[styles.mainPlay, { backgroundColor: palette.accent }, (isPreparing || isProcessing) && styles.disabled]}>
              <Text style={[styles.mainPlayText, { color: palette.accentText }]}>{isPreparing ? '...' : isPlaying ? 'Pause' : 'Play'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={replayAudio} disabled={!audioResult || isPreparing || isProcessing} style={[styles.roundControl, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, (!audioResult || isPreparing || isProcessing) && styles.disabled]}>
              <Text style={[styles.roundControlText, { color: palette.text }]}>Replay</Text>
            </Pressable>
          </View>
          <View style={styles.readerDockBottom}>
            <SecondaryButton label={`Voice`} onPress={() => navigate('/read/settings')} />
            <SecondaryButton label={`${document.playbackSpeed.toFixed(1)}x`} onPress={() => setPlaybackSpeed(document.id, document.playbackSpeed >= 1.5 ? 1 : document.playbackSpeed + 0.1)} />
            <SecondaryButton label={document.detectedLanguageLabel} onPress={() => navigate('/read/settings')} />
          </View>
          {audioError ? <Text style={[styles.errorText, { color: palette.danger }]}>{audioError}</Text> : null}
        </View>
      </View>
    </AppShell>
  );
}

export function ReadSettingsScreen() {
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const setReadAutomatically = useReadMobileStore((state) => state.setReadAutomatically);
  const readTheme = useReadMobileStore((state) => state.readTheme);
  const setReadTheme = useReadMobileStore((state) => state.setReadTheme);
  const activeDocument = useActiveReadDocument();
  const setPlaybackSpeed = useReadMobileStore((state) => state.setPlaybackSpeed);
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  return (
    <AppShell active="settings">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollScreen}>
        <Header showBack title="Reader settings" subtitle="Appearance, speed, import behavior" />
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Appearance</Text>
          <View style={styles.themeGrid}>
            {([
              ['light', 'Light'],
              ['sepia', 'Sepia'],
              ['dark', 'Dark'],
              ['ink', 'Ink'],
            ] as Array<[ReadTheme, string]>).map(([key, label]) => (
              <Pressable key={key} onPress={() => setReadTheme(key)} style={[styles.themeCard, { backgroundColor: paletteFor(key).surface, borderColor: readTheme === key ? palette.accent : palette.border }]}>
                <Text style={[styles.themeAa, { color: paletteFor(key).text }]}>Aa</Text>
                <Text style={[styles.themeLabel, { color: paletteFor(key).muted }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.autoRowInner}>
            <View style={styles.autoTextWrap}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>Read automatically after import</Text>
              <Text style={[styles.cardBody, { color: palette.muted }]}>Open new imports in the reader immediately.</Text>
            </View>
            <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
          </View>
          {activeDocument ? (
            <View style={styles.speedRow}>
              {[0.8, 1.0, 1.2, 1.5].map((speed) => (
                <Pressable key={speed} onPress={() => setPlaybackSpeed(activeDocument.id, speed)} style={[styles.speedChip, { backgroundColor: Math.abs(activeDocument.playbackSpeed - speed) < 0.01 ? palette.accent : palette.surfaceSoft, borderColor: Math.abs(activeDocument.playbackSpeed - speed) < 0.01 ? palette.accent : palette.border }]}>
                  <Text style={[styles.speedChipText, { color: Math.abs(activeDocument.playbackSpeed - speed) < 0.01 ? palette.accentText : palette.text }]}>{speed.toFixed(1)}x</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

export function ReadAnalyticsScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);
  const totalWords = documents.reduce((sum, document) => sum + countWords(document.generatedText), 0);
  const averageProgress = documents.length ? documents.reduce((sum, document) => sum + document.readingProgress, 0) / documents.length : 0;

  return (
    <AppShell active="analytics">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollScreen}>
        <Header showBack title="Reading analytics" subtitle="Progress, library health, and activity" />
        <View style={styles.analyticsGrid}>
          <MetricPill label="Documents" value={String(documents.length)} tone="blue" />
          <MetricPill label="Words" value={String(totalWords)} tone="purple" />
          <MetricPill label="Average" value={`${safePct(averageProgress)}%`} tone="teal" />
        </View>
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <ProgressRing progress={averageProgress} size={116} />
          <Text style={[styles.cardTitle, { color: palette.text }]}>Library health</Text>
          <Text style={[styles.cardBody, { color: palette.muted }]}>Analytics are now represented in the native app. Detailed weekly trends can be connected after the reader foundation is stable.</Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}

type ReadRevenueCatSyncSource = {
  readAccess?: boolean;
  creatorAccess?: boolean;
  activeEntitlements?: string[];
  packageId?: string | null;
  productId?: string | null;
  planId?: string | null;
  platform?: string | null;
  status?: string | null;
};

function getReadPurchasePackageId(source: ReadRevenueCatSyncSource): ReadStorePlanId | null {
  const normalized = String(source.packageId || source.planId || source.productId || '').trim();
  if (normalized === 'reader_monthly' || normalized === 'reader_yearly' || normalized === 'creator_monthly' || normalized === 'creator_yearly') return normalized;
  return null;
}

async function syncReadPurchaseToBackend(result: ReadRevenueCatSyncSource, planId?: ReadStorePlanId | null): Promise<boolean> {
  try {
    const syncResult = await readRenderApi.syncRevenueCatEntitlements({
      readAccess: result.readAccess,
      creatorAccess: result.creatorAccess,
      activeEntitlements: result.activeEntitlements,
      packageId: result.packageId ?? planId ?? null,
      productId: result.productId,
      planId: planId ?? result.planId ?? null,
      platform: result.platform,
      status: result.status,
    });
    return syncResult.ignoredReason !== 'not_authenticated';
  } catch (error) {
    console.warn('Read RevenueCat backend sync failed', error);
    return false;
  }
}

export function ReadSubscriptionScreen() {
  const subscriptionState = useSubscriptionStore((state) => state);
  const subscriptionAny = subscriptionState as unknown as {
    status?: {
      readAccess?: boolean;
      read_access?: boolean;
      creatorAccess?: boolean;
      creator_access?: boolean;
      createAccess?: boolean;
      create_access?: boolean;
      entitlements?: {
        readAccess?: boolean;
        read_access?: boolean;
        creatorAccess?: boolean;
        creator_access?: boolean;
        createAccess?: boolean;
        create_access?: boolean;
      };
    } | null;
    applyStoreReadAccess?: (input: { readAccess?: boolean; creatorAccess?: boolean }) => void;
    refresh?: () => Promise<void> | void;
  };
  const subscriptionStatus = subscriptionAny.status;
  const applyStoreReadAccess = subscriptionAny.applyStoreReadAccess;
  const refreshSubscription = subscriptionAny.refresh;
  const readAccess = Boolean(
    subscriptionStatus?.readAccess ||
    subscriptionStatus?.read_access ||
    subscriptionStatus?.entitlements?.readAccess ||
    subscriptionStatus?.entitlements?.read_access
  );
  const creatorAccess = Boolean(
    subscriptionStatus?.creatorAccess ||
    subscriptionStatus?.creator_access ||
    subscriptionStatus?.createAccess ||
    subscriptionStatus?.create_access ||
    subscriptionStatus?.entitlements?.creatorAccess ||
    subscriptionStatus?.entitlements?.creator_access ||
    subscriptionStatus?.entitlements?.createAccess ||
    subscriptionStatus?.entitlements?.create_access
  );
  const [busyPlan, setBusyPlan] = useState<ReadStorePlanId | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  async function purchase(planId: ReadStorePlanId) {
    setBusyPlan(planId);
    setMessage(null);
    try {
      const result = await startReadStorePurchase(planId);
      const accessResult = result as unknown as { readAccess?: boolean; creatorAccess?: boolean };
      if (typeof applyStoreReadAccess === 'function') {
        applyStoreReadAccess({
          readAccess: Boolean(accessResult.readAccess),
          creatorAccess: Boolean(accessResult.creatorAccess),
        });
      }
      if (typeof refreshSubscription === 'function') {
        await refreshSubscription();
      }
      const backendSynced = await syncReadPurchaseToBackend(result, planId);
      setMessage(`Purchase complete.${backendSynced ? ' Backend access is synced.' : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyPlan(null);
    }
  }

  async function restore() {
    setBusyPlan('restore');
    setMessage(null);
    try {
      const result = await restoreReadStorePurchases();
      const accessResult = result as unknown as { readAccess?: boolean; creatorAccess?: boolean };
      if (typeof applyStoreReadAccess === 'function') {
        applyStoreReadAccess({
          readAccess: Boolean(accessResult.readAccess),
          creatorAccess: Boolean(accessResult.creatorAccess),
        });
      }
      if (typeof refreshSubscription === 'function') {
        await refreshSubscription();
      }
      const backendSynced = await syncReadPurchaseToBackend(result, getReadPurchasePackageId(result));
      setMessage(`Purchases restored.${backendSynced ? ' Backend access is synced.' : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <AppShell active="subscribe">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollScreen}>
        <Header showBack title="Floently Read access" subtitle="Native plans, RevenueCat, and backend entitlements" />
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{readAccess || creatorAccess ? 'Access active' : 'Upgrade Read'}</Text>
          <Text style={[styles.cardBody, { color: palette.muted }]}>Read, listen, import, and continue your library across sessions.</Text>
        </View>
        {readPlans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{plan.title}</Text>
            <Text style={[styles.priceText, { color: palette.accent }]}>{plan.priceHint}</Text>
            <Text style={[styles.cardBody, { color: palette.muted }]}>{plan.body}</Text>
            {plan.platformNote ? <Text style={[styles.noteText, { color: palette.warning }]}>{plan.platformNote}</Text> : null}
            <PrimaryButton label={busyPlan === plan.id ? 'Processing...' : 'Choose plan'} onPress={() => void purchase(plan.id)} disabled={Boolean(busyPlan)} />
          </View>
        ))}
        <SecondaryButton label={busyPlan === 'restore' ? 'Restoring...' : 'Restore purchases'} onPress={() => void restore()} disabled={Boolean(busyPlan)} />
        {message ? <Text style={[styles.messageText, { color: palette.muted }]}>{message}</Text> : null}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  appContent: { flex: 1 },
  glowA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -92, top: 30, opacity: 0.16 },
  glowB: { position: 'absolute', width: 300, height: 300, borderRadius: 150, left: -140, top: 190, opacity: 0.13 },
  scrollScreen: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 120, gap: 18 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitleWrap: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSubtitle: { fontSize: 12, fontWeight: '700' },
  logoPressable: { minHeight: 56, justifyContent: 'center' },
  logo: { width: 126, height: 52 },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconButtonText: { fontSize: 30, fontWeight: '700', marginTop: -2 },
  iconMini: { fontSize: 13, fontWeight: '900' },
  pillButton: { minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingHorizontal: 14 },
  pillButtonText: { fontSize: 13, fontWeight: '900' },
  homeHeroRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  homeHeroText: { flex: 1, gap: 8 },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  homeTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  homeSubtitle: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  sectionBlock: { gap: 12 },
  sectionCard: { borderRadius: 28, borderWidth: 1, padding: 16, gap: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  linkText: { fontSize: 13, fontWeight: '900' },
  syncBanner: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncIcon: { fontSize: 20, fontWeight: '900' },
  syncTextWrap: { flex: 1, gap: 2 },
  syncTitle: { fontSize: 15, fontWeight: '900' },
  syncBody: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  miniPlayer: { borderRadius: 22, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  miniPlayerText: { flex: 1, gap: 5 },
  miniTitle: { fontSize: 15, fontWeight: '900' },
  miniSub: { fontSize: 12, fontWeight: '700' },
  miniPlay: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  miniPlayText: { fontSize: 15, fontWeight: '900' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { width: '30.8%', minHeight: 104, borderRadius: 20, borderWidth: 1, padding: 12, gap: 7, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { minWidth: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickIconText: { fontSize: 12, fontWeight: '900' },
  quickLabel: { fontSize: 13, fontWeight: '900' },
  quickDetail: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricPill: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 12, gap: 2 },
  metricValue: { fontSize: 20, fontWeight: '900' },
  metricLabel: { fontSize: 11, fontWeight: '800' },
  cover: { width: 50, height: 62, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  coverLarge: { width: 78, height: 102, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverText: { fontSize: 15, fontWeight: '900' },
  coverTextLarge: { fontSize: 22, fontWeight: '900' },
  coverType: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  documentCard: { borderRadius: 24, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  documentCardCompact: { borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  documentMeta: { flex: 1, gap: 6 },
  documentTitle: { fontSize: 15, fontWeight: '900', lineHeight: 20 },
  documentSub: { fontSize: 12, fontWeight: '700' },
  documentPct: { fontSize: 13, fontWeight: '900' },
  progressTrack: { width: '100%', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  emptyState: { borderRadius: 26, borderWidth: 1, padding: 22, gap: 10, alignItems: 'center' },
  emptyBook: { fontSize: 36 },
  emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', fontWeight: '600' },
  dropZone: { borderRadius: 30, borderWidth: 1.5, borderStyle: 'dashed', padding: 24, gap: 12, alignItems: 'center' },
  bookIcon: { width: 80, height: 72, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bookIconText: { fontSize: 15, fontWeight: '900' },
  dropTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  dropBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', fontWeight: '600' },
  fileName: { fontSize: 13, lineHeight: 18, textAlign: 'center', fontWeight: '700' },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  autoRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  autoTextWrap: { flex: 1, gap: 4 },
  importGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  importOption: { width: '48.5%', borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  importOptionIcon: { width: 34, fontSize: 12, fontWeight: '900' },
  importOptionText: { flex: 1, gap: 2 },
  importOptionTitle: { fontSize: 13, fontWeight: '900' },
  importOptionBody: { fontSize: 11, fontWeight: '700' },
  panel: { borderRadius: 26, borderWidth: 1, padding: 16, gap: 14, alignItems: 'stretch' },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardBody: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontWeight: '600' },
  textArea: { minHeight: 150, lineHeight: 21 },
  inlineRow: { flexDirection: 'row', gap: 10 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
  primaryButton: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryButtonText: { fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.52 },
  searchInput: { minHeight: 50, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  filterText: { fontSize: 12, fontWeight: '900' },
  readerScreen: { flex: 1 },
  readerScroll: { paddingHorizontal: 18, paddingBottom: 250, gap: 18 },
  readerPaper: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30, gap: 14 },
  readerChapter: { textAlign: 'center', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  readerTitle: { textAlign: 'center', fontSize: 24, lineHeight: 30, fontWeight: '900', marginBottom: 8 },
  readerParagraph: { fontSize: 18, lineHeight: 31, padding: 10, borderRadius: 14, borderWidth: 0, fontFamily: 'serif' },
  processingReader: { borderRadius: 28, borderWidth: 1, padding: 26, gap: 14, alignItems: 'center' },
  processingTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  processingBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', fontWeight: '600' },
  readerDock: { position: 'absolute', left: 14, right: 14, bottom: 16, borderRadius: 30, borderWidth: 1, padding: 14, gap: 10, shadowOpacity: 1, shadowRadius: 26, shadowOffset: { width: 0, height: 14 } },
  readerDockTop: { flexDirection: 'row', justifyContent: 'space-between' },
  readerTime: { fontSize: 12, fontWeight: '800' },
  readerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  roundControl: { minWidth: 56, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  roundControlText: { fontSize: 12, fontWeight: '900' },
  mainPlay: { minWidth: 82, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  mainPlayText: { fontSize: 15, fontWeight: '900' },
  readerDockBottom: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ringText: { position: 'absolute', fontSize: 16, fontWeight: '900' },
  analyticsGrid: { flexDirection: 'row', gap: 10 },
  themeGrid: { flexDirection: 'row', gap: 10 },
  themeCard: { flex: 1, minHeight: 82, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  themeAa: { fontSize: 24, fontWeight: '900' },
  themeLabel: { fontSize: 11, fontWeight: '900' },
  speedRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  speedChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  speedChipText: { fontSize: 13, fontWeight: '900' },
  planCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  priceText: { fontSize: 22, fontWeight: '900' },
  noteText: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  messageText: { fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  bottomNav: { position: 'absolute', left: 14, right: 14, bottom: 12, minHeight: 72, borderRadius: 32, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, shadowOpacity: 1, shadowRadius: 26, shadowOffset: { width: 0, height: 16 } },
  navItem: { minWidth: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navPlus: { width: 58, height: 58, borderRadius: 29, marginTop: -22 },
  navIcon: { fontSize: 12, fontWeight: '900' },
  navLabel: { fontSize: 10, fontWeight: '900' },
});
