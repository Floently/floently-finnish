import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { useActiveReadDocument, useReadMobileStore, type ReadDocument } from './readMobileStore';

const sampleText = 'This is a short Floently Read test. I want to check that reading, saving, and listening work correctly.';

function navigate(path: string) {
  router.push(path as never);
}

function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'read' | 'create' }) {
  return <Text style={[styles.pill, tone === 'read' && styles.readPill, tone === 'create' && styles.createPill]}>{label}</Text>;
}

function ScreenFrame({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Native Floently Read screen built directly inside the mobile app.</Text>
      </View>
      {children}
    </ScrollView>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function DocumentCard({ document }: { document: ReadDocument }) {
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
      <Text style={styles.documentMeta}>{Math.round(document.readingProgress * 100)}% read</Text>
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

  return (
    <ScreenFrame eyebrow="Floently Read" title="Read, listen, and continue anywhere">
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.cardTitle}>Read automatically</Text>
            <Text style={styles.bodyText}>Default on. New uploads should detect language, generate, and start reading unless you turn this off.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
      </View>

      <View style={styles.actionGrid}>
        <PrimaryButton label="Import text or book" onPress={() => navigate('/read/import')} />
        <SecondaryButton label="Open library" onPress={() => navigate('/read/library')} />
        <SecondaryButton label="Reader" onPress={() => navigate('/read/reader')} />
        <SecondaryButton label="Read settings" onPress={() => navigate('/read/settings')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent reading</Text>
        {documents.length ? (
          documents.slice(0, 3).map((document) => <DocumentCard key={document.id} document={document} />)
        ) : (
          <Text style={styles.bodyText}>No saved readings yet. Import text to create your first native Read item.</Text>
        )}
      </View>
    </ScreenFrame>
  );
}

export function ReadImportScreen() {
  const createFromText = useReadMobileStore((state) => state.createFromText);
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const [title, setTitle] = useState('Floently Read test');
  const [text, setText] = useState(sampleText);

  function generate() {
    createFromText({ title, text, language: 'auto' });
    if (readAutomatically) {
      navigate('/read/reader');
      return;
    }
    navigate('/read/library');
  }

  return (
    <ScreenFrame eyebrow="Native import" title="Import reading material">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book upload behavior</Text>
        <Text style={styles.bodyText}>Target behavior: detect language automatically, generate reading output, then start reading by default.</Text>
        <View style={styles.inlinePills}>
          <Pill label="Auto language" tone="read" />
          <Pill label={readAutomatically ? 'Auto read on' : 'Manual read'} tone="read" />
        </View>
      </View>

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
        />
        <PrimaryButton label={readAutomatically ? 'Generate and start reading' : 'Generate and save'} onPress={generate} />
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Native file picker</Text>
        <Text style={styles.bodyText}>The app frame is ready for a native book picker. The next implementation pass should connect file selection and backend extraction.</Text>
      </View>
    </ScreenFrame>
  );
}

export function ReadLibraryScreen() {
  const documents = useReadMobileStore((state) => state.documents);
  return (
    <ScreenFrame eyebrow="Read library" title="Saved readings">
      <View style={styles.card}>
        {documents.length ? (
          documents.map((document) => <DocumentCard key={document.id} document={document} />)
        ) : (
          <>
            <Text style={styles.bodyText}>Your native Read library is empty.</Text>
            <PrimaryButton label="Import first reading" onPress={() => navigate('/read/import')} />
          </>
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

  const timeLabel = useMemo(() => {
    if (!document) return '00:00 / 00:00';
    const totalSeconds = Math.max(20, Math.ceil(document.generatedText.length / 12));
    const currentSeconds = Math.floor(totalSeconds * document.readingProgress);
    const format = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return `${format(currentSeconds)} / ${format(totalSeconds)}`;
  }, [document]);

  if (!document) {
    return (
      <ScreenFrame eyebrow="Reader" title="Nothing open yet">
        <View style={styles.card}>
          <Text style={styles.bodyText}>Import or paste text to open the native reader.</Text>
          <PrimaryButton label="Import reading" onPress={() => navigate('/read/import')} />
        </View>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame eyebrow="Native reader" title={document.title}>
      <View style={styles.readerHero}>
        <CircularProgress progress={document.readingProgress} />
        <View style={styles.playerMetaBlock}>
          <Text style={styles.compactMeta}>{timeLabel}</Text>
          <Text style={styles.compactMeta}>{document.playbackSpeed.toFixed(1)}x speed</Text>
          <Text style={styles.bodyText}>Language: {document.detectedLanguageLabel}</Text>
        </View>
      </View>

      <View style={styles.playerActions}>
        <SecondaryButton label="25%" onPress={() => updateProgress(document.id, 0.25)} />
        <SecondaryButton label="50%" onPress={() => updateProgress(document.id, 0.5)} />
        <SecondaryButton label="100%" onPress={() => updateProgress(document.id, 1)} />
      </View>

      <View style={styles.playerActions}>
        <SecondaryButton label="0.8x" onPress={() => setPlaybackSpeed(document.id, 0.8)} />
        <SecondaryButton label="1.0x" onPress={() => setPlaybackSpeed(document.id, 1)} />
        <SecondaryButton label="1.2x" onPress={() => setPlaybackSpeed(document.id, 1.2)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.readerText}>{document.generatedText}</Text>
      </View>
    </ScreenFrame>
  );
}

export function ReadSettingsScreen() {
  const readAutomatically = useReadMobileStore((state) => state.readAutomatically);
  const setReadAutomatically = useReadMobileStore((state) => state.setReadAutomatically);

  return (
    <ScreenFrame eyebrow="Read settings" title="Reading preferences">
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextBlock}>
            <Text style={styles.cardTitle}>Read automatically</Text>
            <Text style={styles.bodyText}>When enabled, new uploads should detect language, generate, and start reading automatically.</Text>
          </View>
          <Switch value={readAutomatically} onValueChange={setReadAutomatically} />
        </View>
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
  syncNote: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 10,
    color: '#d0b8a3',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#1a120d',
    borderWidth: 1,
    borderColor: '#34261d',
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
    minHeight: 180,
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
  documentMeta: {
    color: '#f6b66d',
    fontSize: 12,
    fontWeight: '800',
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
    gap: 4,
  },
  compactMeta: {
    color: '#fff7ef',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  playerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  readerText: {
    color: '#fff7ef',
    fontSize: 18,
    lineHeight: 30,
  },
});
