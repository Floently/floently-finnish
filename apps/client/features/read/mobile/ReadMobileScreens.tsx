import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { useActiveReadDocument, useReadMobileStore, type ReadDocument } from './readMobileStore';
import { readTtsApi, type ReadTtsResult } from './readTtsApi';
import { readRenderApi } from './readRenderApi';
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
      <View style={styles.productNavRow}>
        <Pressable accessibilityRole="button" onPress={() => navigate('/')} style={styles.productNavButton}>
          <Text style={styles.productNavButtonText}>← Floently Home</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigate('/read')} style={styles.productNavButton}>
          <Text style={styles.productNavButtonText}>Read landing</Text>
        </Pressable>
      </View>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Turn text, articles, and study material into a calm reading and listening library.</Text>
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
            ? 'Syncing your readings and progress.'
            : isOffline
              ? error || 'Your online library is temporarily unavailable. Local readings stay open.'
              : 'Your readings and progress sync when you are signed in.'}
        </Text>
      </View>
      {isBusy ? <ActivityIndicator color="#5EA8FF" /> : onRefresh ? <GhostButton label="Refresh" onPress={onRefresh} /> : null}
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
            <Text style={styles.cardTitle}>Start reading automatically</Text>
            <Text style={styles.bodyText}>New imports detect language, create a reading, and open the reader by default.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
        <View style={styles.inlinePills}>
          <Pill label="Floently Read" tone="read" />
          <Pill label="Cloud library" tone="read" />
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
    if (readAutomatically) {
      navigate('/read/reader');
      return;
    }
    navigate('/read/library');
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

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error('No readable file was selected.');
      }

      const selectedName = asset.name || 'Imported document.txt';
      setFileName(selectedName);
      const document = await createFromFile({
        uri: asset.uri,
        name: selectedName,
        mimeType: asset.mimeType ?? null,
        title: title?.trim() || selectedName.replace(/\.[^/.]+$/, ''),
      });
      useReadMobileStore.getState().openDocument(document.id);

      if (readAutomatically) {
        navigate('/read/reader');
        return;
      }
      navigate('/read/library');
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
      if (readAutomatically) {
        navigate('/read/reader');
        return;
      }
      navigate('/read/library');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ScreenFrame eyebrow="Floently Read" title="Import text, links, and files">
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
          <PrimaryButton label={isImporting ? 'Importing…' : readAutomatically ? 'Choose file and start reading' : 'Choose file and save'} onPress={() => void importFile()} disabled={isImporting} />
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
          <PrimaryButton label={isImporting ? 'Importing…' : readAutomatically ? 'Import and start reading' : 'Import to library'} onPress={() => void importUrl()} disabled={isImporting || !url.trim()} />
          {importError ? <Text style={styles.errorText}>{importError}</Text> : null}
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
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#1D3B66" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#5EA8FF"
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
          Floently prepares natural audio for this reading and plays it directly in the app.
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


type ReadRevenueCatSyncSource = {
  readAccess: boolean;
  creatorAccess: boolean;
  activeEntitlements: string[];
  packageId?: string | null;
  platform?: string | null;
  status?: string | null;
};

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
      const backendSynced = await syncReadPurchaseToBackend(result, null);
      await refreshSubscription();
      applyStoreReadAccess({ readAccess: result.readAccess, creatorAccess: result.creatorAccess });
      const syncSuffix = backendSynced ? ' Backend access is synced.' : '';
      setPurchaseMessage(
        result.creatorAccess
          ? `Creator access restored.${syncSuffix}`
          : result.readAccess
            ? `Read access restored.${syncSuffix}`
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
            <Text style={styles.cardTitle}>Start reading automatically</Text>
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
        <Text style={styles.cardTitle}>Floently products</Text>
        <Text style={styles.bodyText}>Floently Read stays separate from Learn billing unless a bundle is created. Read and Learn remain separate subscriptions unless a bundle is created.</Text>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#07111F',
    padding: 20,
    gap: 16,
  },
  productNavRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  productNavButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#244A7D',
    backgroundColor: '#0B1728',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  productNavButtonText: {
    color: '#65AEFF',
    fontSize: 13,
    fontWeight: '900',
  },
  headerCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#0E1A2F',
    borderWidth: 1,
    borderColor: '#1D3B66',
  },
  eyebrow: {
    color: '#5EA8FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#F8FBFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 10,
    color: '#AFC4E8',
    fontSize: 15,
    lineHeight: 22,
  },
  syncBanner: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#092236',
    borderWidth: 1,
    borderColor: '#1A6FA8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  syncBannerWarning: {
    backgroundColor: '#251A34',
    borderColor: '#7C4DFF',
  },
  syncBannerTextBlock: {
    flex: 1,
    gap: 3,
  },
  syncTitle: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '900',
  },
  syncText: {
    color: '#AFC4E8',
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#0B1628',
    borderWidth: 1,
    borderColor: '#203B64',
    gap: 14,
  },
  cardHero: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: '#081425',
    borderWidth: 1,
    borderColor: '#2B6DFF',
    gap: 14,
  },
  cardMuted: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#0A1424',
    borderWidth: 1,
    borderColor: '#172A46',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: '#F8FBFF',
    fontSize: 18,
    fontWeight: '800',
  },
  bodyText: {
    color: '#AFC4E8',
    fontSize: 14,
    lineHeight: 21,
  },
  helpText: {
    color: '#7F96BE',
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
    backgroundColor: '#0B1628',
    borderWidth: 1,
    borderColor: '#203B64',
    alignItems: 'center',
  },
  metricValue: {
    color: '#F8FBFF',
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#5EA8FF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  actionGrid: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#5EA8FF',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#081425',
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#10213A',
    borderColor: '#25466F',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F8FBFF',
    fontWeight: '800',
    fontSize: 14,
  },
  ghostButton: {
    backgroundColor: '#0C1A2E',
    borderColor: '#244469',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#5EA8FF',
    fontWeight: '900',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextDisabled: {
    color: '#6F83A8',
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
    backgroundColor: '#0B1628',
    borderWidth: 1,
    borderColor: '#203B64',
  },
  modeButtonActive: {
    backgroundColor: '#5EA8FF',
    borderColor: '#5EA8FF',
  },
  modeButtonText: {
    color: '#AFC4E8',
    fontSize: 12,
    fontWeight: '900',
  },
  modeButtonTextActive: {
    color: '#081425',
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
    backgroundColor: '#10213A',
    color: '#D8E7FF',
    fontSize: 12,
    fontWeight: '800',
  },
  readPill: {
    backgroundColor: '#123A63',
    color: '#5EA8FF',
  },
  createPill: {
    backgroundColor: '#17213F',
    color: '#BFD0FF',
  },
  warningPill: {
    backgroundColor: '#2A2138',
    color: '#FFD28A',
  },
  label: {
    color: '#5EA8FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#25466F',
    backgroundColor: '#07111F',
    color: '#F8FBFF',
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
    backgroundColor: '#07111F',
    borderColor: '#1C365C',
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
    color: '#F8FBFF',
    fontSize: 16,
    fontWeight: '800',
  },
  documentPreview: {
    color: '#BBD0EF',
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
    color: '#5EA8FF',
    fontSize: 12,
    fontWeight: '800',
  },
  documentMetaMuted: {
    color: '#7F96BE',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#07111F',
    borderWidth: 1,
    borderColor: '#1A314F',
    gap: 12,
  },
  emptyTitle: {
    color: '#F8FBFF',
    fontSize: 17,
    fontWeight: '900',
  },
  readerHero: {
    borderRadius: 26,
    backgroundColor: '#0B1B36',
    borderWidth: 1,
    borderColor: '#255B91',
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
    backgroundColor: '#5EA8FF',
    opacity: 0.16,
  },
  progressSvg: {
    position: 'absolute',
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressNumber: {
    color: '#F8FBFF',
    fontSize: 24,
    fontWeight: '900',
  },
  progressLabel: {
    color: '#5EA8FF',
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
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  errorText: {
    color: '#FFB8D2',
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
    color: '#F8FBFF',
    fontSize: 18,
    lineHeight: 30,
  },
});
