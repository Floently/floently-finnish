import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { useActiveReadDocument, useReadMobileStore, type ReadDocument } from './readMobileStore';
import { readTtsApi, type ReadTtsResult } from './readTtsApi';
import { restoreReadStorePurchases, startReadStorePurchase, type ReadStorePlanId } from '../../billing/services/storeBillingService';
import { useSubscriptionStore } from '../../../state/subscriptionStore';

type ButtonTone = 'primary' | 'secondary' | 'ghost';
type ImportMode = 'paste' | 'file' | 'url';
type SyncStatus = 'idle' | 'loading' | 'syncing' | 'offline' | 'error';
type AudioPlaybackState = 'idle' | 'preparing' | 'ready' | 'playing' | 'paused' | 'error';

const sampleText = 'This is a short Floently Read test. I want to check that reading, saving, and listening work correctly.';

function navigate(path: string) {
  router.push(path as never);
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

function ScreenFrame({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Real native Floently Read screen built directly inside the mobile app.</Text>
      </View>
      {children}
    </ScrollView>
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
  const buttonStyle = tone === 'primary' ? styles.primaryButton : tone === 'ghost' ? styles.ghostButton : styles.secondaryButton;
  const textStyle = tone === 'primary' ? styles.primaryButtonText : tone === 'ghost' ? styles.ghostButtonText : styles.secondaryButtonText;

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
            ? 'Connecting to the Render Read API and keeping the native library up to date.'
            : isOffline
              ? error || 'Render is unavailable or the session needs refresh. Your local reading still stays open.'
              : 'Learn login token is shared with Render Read. Imported readings sync when the API is available.'}
        </Text>
      </View>
      {isBusy ? <ActivityIndicator color="#f6b66d" /> : onRefresh ? <GhostButton label="Refresh" onPress={onRefresh} /> : null}
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
  const created = Number.isNaN(Date.parse(document.createdAtIso)) ? 'Saved reading' : new Date(document.createdAtIso).toLocaleDateString();

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
        <Text style={styles.documentMetaMuted}>{created}</Text>
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
    <ScreenFrame eyebrow="Floently Read" title="Read, listen, and continue anywhere">
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />

      <View style={styles.cardHero}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.cardTitle}>Read automatically</Text>
            <Text style={styles.bodyText}>New imports detect language, create a reading, and open the reader by default.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
        <View style={styles.inlinePills}>
          <Pill label="Native app" tone="read" />
          <Pill label="Render API" tone="read" />
          <Pill label={readAutomatically ? 'Auto-read on' : 'Manual start'} tone={readAutomatically ? 'read' : 'warning'} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard value={String(documents.length)} label="Saved" />
        <MetricCard value={String(completedCount)} label="Finished" />
        <MetricCard value={activeReading ? `${Math.round(activeReading.readingProgress * 100)}%` : '0%'} label="Current" />
      </View>

      <View style={styles.actionGrid}>
        <PrimaryButton label="Import text or book" onPress={() => navigate('/read/import')} />
        <SecondaryButton label="Open library" onPress={() => navigate('/read/library')} />
        <SecondaryButton label="Reader" onPress={() => navigate('/read/reader')} />
        <SecondaryButton label="Read settings" onPress={() => navigate('/read/settings')} />
        <SecondaryButton label="Read subscription" onPress={() => navigate('/read/subscribe')} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Continue reading</Text>
          <GhostButton label="Refresh" onPress={() => void refreshLibrary()} />
        </View>
        {activeReading ? (
          <DocumentCard document={activeReading} />
        ) : (
          <EmptyState
            title="No readings yet"
            body="Paste text or prepare a book import to create your first native Read item."
            actionLabel="Import reading"
            onAction={() => navigate('/read/import')}
          />
        )}
      </View>
    </ScreenFrame>
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
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const [title, setTitle] = useState('Floently Read test');
  const [text, setText] = useState(sampleText);
  const [mode, setMode] = useState<ImportMode>('paste');

  const trimmedText = text.trim();
  const wordCount = useMemo(() => trimmedText ? trimmedText.split(/\s+/).length : 0, [trimmedText]);
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 170));
  const canGenerate = trimmedText.length >= 8;

  function generate() {
    if (!canGenerate) return;
    const document = createFromText({ title, text: trimmedText, language: 'auto' });
    useReadMobileStore.getState().openDocument(document.id);
    if (readAutomatically) {
      navigate('/read/reader');
      return;
    }
    navigate('/read/library');
  }

  return (
    <ScreenFrame eyebrow="Native import" title="Import reading material">
      <SyncBanner status={syncStatus} error={syncError} />

      <View style={styles.modeTabs}>
        <ImportModeButton mode="paste" activeMode={mode} label="Paste text" onPress={() => setMode('paste')} />
        <ImportModeButton mode="file" activeMode={mode} label="Book file" onPress={() => setMode('file')} />
        <ImportModeButton mode="url" activeMode={mode} label="Web link" onPress={() => setMode('url')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Import behavior</Text>
        <Text style={styles.bodyText}>Read will detect the language, create a clean reading, save it to your library, and open the reader automatically when the setting is on.</Text>
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
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Reading title" placeholderTextColor="#8b7c70" />
          <Text style={styles.label}>Text</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            style={[styles.input, styles.textArea]}
            placeholder="Paste text here"
            placeholderTextColor="#8b7c70"
            textAlignVertical="top"
          />
          <PrimaryButton label={readAutomatically ? 'Generate and start reading' : 'Generate and save'} onPress={generate} disabled={!canGenerate} />
          {!canGenerate ? <Text style={styles.helpText}>Paste at least a short paragraph to generate a reading.</Text> : null}
        </View>
      ) : null}

      {mode === 'file' ? (
        <View style={styles.cardMuted}>
          <Text style={styles.cardTitle}>Native book picker</Text>
          <Text style={styles.bodyText}>This screen is ready for native PDF, EPUB, DOCX, and text-file selection. The button is intentionally safe until the file picker and extraction endpoint are connected.</Text>
          <View style={styles.inlinePills}>
            <Pill label="PDF" tone="read" />
            <Pill label="EPUB" tone="read" />
            <Pill label="DOCX" tone="read" />
            <Pill label="TXT" tone="read" />
          </View>
          <SecondaryButton label="File picker coming next" onPress={() => undefined} disabled />
        </View>
      ) : null}

      {mode === 'url' ? (
        <View style={styles.cardMuted}>
          <Text style={styles.cardTitle}>Import from web link</Text>
          <Text style={styles.bodyText}>Render already has a from-url route. The native input is kept disabled until URL extraction, content safety, and loading states are wired fully.</Text>
          <SecondaryButton label="URL import coming next" onPress={() => undefined} disabled />
        </View>
      ) : null}
    </ScreenFrame>
  );
}

export function ReadLibraryScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);

  return (
    <ScreenFrame eyebrow="Read library" title="Saved readings">
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Library</Text>
          <GhostButton label="Refresh" onPress={() => void refreshLibrary()} />
        </View>
        {documents.length ? (
          documents.map((document) => <DocumentCard key={document.id} document={document} />)
        ) : (
          <EmptyState
            title="Your native Read library is empty"
            body="Import text now. Later, this same screen will hold books, files, and web articles."
            actionLabel="Import first reading"
            onAction={() => navigate('/read/import')}
          />
        )}
      </View>
    </ScreenFrame>
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
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#3a2b22" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f6b66d"
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
      <ScreenFrame eyebrow="Reader" title="Nothing open yet">
        <View style={styles.card}>
          <EmptyState
            title="No active reading"
            body="Import or paste text to open the native reader."
            actionLabel="Import reading"
            onAction={() => navigate('/read/import')}
          />
        </View>
      </ScreenFrame>
    );
  }

  const isPreparing = audioState === 'preparing' || playbackStatus.isBuffering;
  const isPlaying = audioState === 'playing' || playbackStatus.playing;

  return (
    <ScreenFrame eyebrow="Native reader" title={document.title}>
      <View style={styles.readerHero}>
        <CircularProgress progress={displayedProgress} />
        <View style={styles.playerMetaBlock}>
          <Text style={styles.compactMeta}>{timeLabel} · {document.playbackSpeed.toFixed(1)}x</Text>
          <Text style={styles.bodyText}>Language: {document.detectedLanguageLabel}</Text>
          <Pill
            label={isPreparing ? 'Generating audio' : isPlaying ? 'Listening now' : audioResult ? 'Audio ready' : 'Ready to listen'}
            tone={audioState === 'error' ? 'warning' : isPlaying || audioResult ? 'read' : 'neutral'}
          />
        </View>
      </View>

      <View style={styles.playerActions}>
        <PrimaryButton
          label={isPreparing ? 'Preparing audio…' : isPlaying ? 'Pause listening' : audioResult ? 'Play audio' : 'Generate and listen'}
          onPress={isPlaying ? pauseAudio : generateAndPlayAudio}
          disabled={isPreparing}
        />
        <SecondaryButton label="Replay" onPress={replayAudio} disabled={!audioResult || isPreparing} />
        <SecondaryButton label="Back to library" onPress={() => navigate('/read/library')} />
      </View>

      <View style={styles.playerActions}>
        <SecondaryButton label="25%" onPress={() => updateProgress(document.id, 0.25)} />
        <SecondaryButton label="50%" onPress={() => updateProgress(document.id, 0.5)} />
        <SecondaryButton label="Done" onPress={() => updateProgress(document.id, 1)} />
      </View>

      <View style={styles.playerActions}>
        <SecondaryButton label="0.8x" onPress={() => setPlaybackSpeed(document.id, 0.8)} />
        <SecondaryButton label="1.0x" onPress={() => setPlaybackSpeed(document.id, 1)} />
        <SecondaryButton label="1.2x" onPress={() => setPlaybackSpeed(document.id, 1.2)} />
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Listening connected</Text>
        <Text style={styles.bodyText}>
          Render TTS prerenders audio for this reading and the native player uses expo-audio for playback.
          {audioResult?.cacheHit ? ' This audio was served from cache.' : audioResult ? ' This audio is ready for replay.' : ' Tap Generate and listen to start.'}
        </Text>
        {audioResult?.duration ? <Text style={styles.helpText}>Audio duration: {Math.round(audioResult.duration)} seconds</Text> : null}
        {audioError ? <Text style={styles.errorText}>{audioError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.readerText}>{document.generatedText}</Text>
      </View>
    </ScreenFrame>
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
      await refreshSubscription();
      setPurchaseMessage(
        result.creatorAccess
          ? 'Creator access is active. Read Creator purchases now unlock the Read Creator tier in this app.'
          : result.readAccess
            ? 'Read access is active. Your app-store subscription has been restored in the app.'
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
      await refreshSubscription();
      setPurchaseMessage(
        result.creatorAccess
          ? 'Creator access restored.'
          : result.readAccess
            ? 'Read access restored.'
            : 'No active Read purchase was found for this app-store account.',
      );
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <ScreenFrame eyebrow="Read subscription" title="Choose your Read access">
      <View style={styles.cardHero}>
        <Text style={styles.cardTitle}>Mobile subscriptions use RevenueCat</Text>
        <Text style={styles.bodyText}>
          Stripe remains for web checkout. Native iOS and Android purchases use App Store / Google Play products through RevenueCat offering read_default.
        </Text>
        <View style={styles.inlinePills}>
          <Pill label={hasReadAccess ? 'Read active' : 'Read locked'} tone={hasReadAccess ? 'read' : 'warning'} />
          <Pill label={hasCreatorAccess ? 'Creator active' : 'Creator separate'} tone={hasCreatorAccess ? 'create' : 'neutral'} />
        </View>
      </View>

      {READ_PLANS.map((plan) => (
        <View key={plan.id} style={styles.documentCard}>
          <View style={styles.documentTitleRow}>
            <Text style={styles.documentTitle}>{plan.title}</Text>
            <Pill label={plan.priceHint} tone={plan.id.includes('creator') ? 'create' : 'read'} />
          </View>
          <Text style={styles.bodyText}>{plan.body}</Text>
          {plan.platformNote ? <Text style={styles.helpText}>{plan.platformNote}</Text> : null}
          <PrimaryButton
            label={busyPlan === plan.id ? 'Opening store…' : `Choose ${plan.title}`}
            onPress={() => void purchase(plan.id)}
            disabled={busyPlan !== null}
          />
        </View>
      ))}

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Already purchased?</Text>
        <Text style={styles.bodyText}>Restore purchases to refresh RevenueCat entitlements for this device.</Text>
        <SecondaryButton label={busyPlan === 'restore' ? 'Restoring…' : 'Restore purchases'} onPress={() => void restorePurchases()} disabled={busyPlan !== null} />
        {purchaseMessage ? <Text style={styles.helpText}>{purchaseMessage}</Text> : null}
        {purchaseError ? <Text style={styles.errorText}>{purchaseError}</Text> : null}
      </View>
    </ScreenFrame>
  );
}

export function ReadSettingsScreen() {
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const setReadAutomatically = useReadMobileStore((state) => state.setReadAutomatically);
  const syncStatus = useReadMobileStore((state) => state.syncStatus);
  const syncError = useReadMobileStore((state) => state.syncError);
  const refreshLibrary = useReadMobileStore((state) => state.refreshLibrary);

  return (
    <ScreenFrame eyebrow="Read settings" title="Reading preferences">
      <SyncBanner status={syncStatus} error={syncError} onRefresh={() => void refreshLibrary()} />
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.cardTitle}>Read automatically</Text>
            <Text style={styles.bodyText}>When enabled, new uploads detect language, create a reading, and open the reader automatically.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
      </View>
      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Read subscription</Text>
        <Text style={styles.bodyText}>Manage mobile Read purchases through RevenueCat. Reader and Creator stay separate from Learn.</Text>
        <PrimaryButton label="Manage Read subscription" onPress={() => navigate('/read/subscribe')} />
      </View>
      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Product boundary</Text>
        <Text style={styles.bodyText}>Floently Read stays separate from Learn billing unless a bundle is created. This native app frame keeps the products clearly separated.</Text>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#120d0a',
    padding: 20,
    gap: 16,
  },
  headerCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#211811',
    borderWidth: 1,
    borderColor: '#3a2b22',
  },
  eyebrow: {
    color: '#f6b66d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#fff7ef',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 10,
    color: '#d0b8a3',
    fontSize: 15,
    lineHeight: 22,
  },
  syncBanner: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#182016',
    borderWidth: 1,
    borderColor: '#2f4b2b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  syncBannerWarning: {
    backgroundColor: '#24170f',
    borderColor: '#704d2c',
  },
  syncBannerTextBlock: {
    flex: 1,
    gap: 3,
  },
  syncTitle: {
    color: '#fff7ef',
    fontSize: 13,
    fontWeight: '900',
  },
  syncText: {
    color: '#ccb5a2',
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#1a120d',
    borderWidth: 1,
    borderColor: '#34261d',
    gap: 14,
  },
  cardHero: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: '#21150d',
    borderWidth: 1,
    borderColor: '#5b3b22',
    gap: 14,
  },
  cardMuted: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#17110d',
    borderWidth: 1,
    borderColor: '#2a2019',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: '#fff7ef',
    fontSize: 18,
    fontWeight: '800',
  },
  bodyText: {
    color: '#ccb5a2',
    fontSize: 14,
    lineHeight: 21,
  },
  helpText: {
    color: '#9f8a78',
    fontSize: 12,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  settingTextBlock: {
    flex: 1,
    gap: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#1a120d',
    borderWidth: 1,
    borderColor: '#34261d',
    alignItems: 'center',
  },
  metricValue: {
    color: '#fff7ef',
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#f6b66d',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  actionGrid: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#f6b66d',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#21150d',
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#2a1e17',
    borderColor: '#473426',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff7ef',
    fontWeight: '800',
    fontSize: 14,
  },
  ghostButton: {
    backgroundColor: '#201710',
    borderColor: '#3f2c20',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#f6b66d',
    fontWeight: '900',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextDisabled: {
    color: '#9e8975',
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a120d',
    borderWidth: 1,
    borderColor: '#34261d',
  },
  modeButtonActive: {
    backgroundColor: '#f6b66d',
    borderColor: '#f6b66d',
  },
  modeButtonText: {
    color: '#ccb5a2',
    fontSize: 12,
    fontWeight: '900',
  },
  modeButtonTextActive: {
    color: '#21150d',
  },
  inlinePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2a1e17',
    color: '#d6c1ad',
    fontSize: 12,
    fontWeight: '800',
  },
  readPill: {
    backgroundColor: '#3a2418',
    color: '#f6b66d',
  },
  createPill: {
    backgroundColor: '#241d33',
    color: '#c7b7ff',
  },
  warningPill: {
    backgroundColor: '#35210f',
    color: '#ffcf91',
  },
  label: {
    color: '#f6b66d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b2d23',
    backgroundColor: '#120d0a',
    color: '#fff7ef',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 190,
    textAlignVertical: 'top',
  },
  documentCard: {
    borderRadius: 18,
    backgroundColor: '#120d0a',
    borderColor: '#30231a',
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  documentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  documentTitle: {
    flex: 1,
    color: '#fff7ef',
    fontSize: 16,
    fontWeight: '800',
  },
  documentPreview: {
    color: '#cbb3a0',
    fontSize: 13,
    lineHeight: 19,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  documentMeta: {
    color: '#f6b66d',
    fontSize: 12,
    fontWeight: '800',
  },
  documentMetaMuted: {
    color: '#9f8a78',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#120d0a',
    borderWidth: 1,
    borderColor: '#2d2119',
    gap: 12,
  },
  emptyTitle: {
    color: '#fff7ef',
    fontSize: 17,
    fontWeight: '900',
  },
  readerHero: {
    borderRadius: 26,
    backgroundColor: '#1d140f',
    borderWidth: 1,
    borderColor: '#3b2b20',
    padding: 18,
    alignItems: 'center',
    gap: 14,
  },
  progressWrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f6b66d',
    opacity: 0.16,
  },
  progressSvg: {
    position: 'absolute',
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressNumber: {
    color: '#fff7ef',
    fontSize: 24,
    fontWeight: '900',
  },
  progressLabel: {
    color: '#f6b66d',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  playerMetaBlock: {
    alignItems: 'center',
    gap: 6,
  },
  compactMeta: {
    color: '#fff7ef',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  errorText: {
    color: '#ffb4a6',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  playerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  readerText: {
    color: '#fff7ef',
    fontSize: 18,
    lineHeight: 30,
  },
});
