import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchReadVoices, getReadProject, updateReadProjectProgress, type ReadProject, type ReadVoice } from '@core/api/read';
import { formatReadTime, useReadNarrator } from '../features/read/useReadNarrator';
import { useAuthStore } from '../state/authStore';


type DocumentFocusMode = 'chunk' | 'sentence' | 'word';
type DocumentPlaybackEntry = { segmentIndex: number; startWord: number; endWord: number; sourceWordStart: number };
type DocumentPlaybackChunk = { text: string; entries: DocumentPlaybackEntry[] };
const DOCUMENT_CHUNK_CHARS = 1100;

function splitDocumentSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const rough = clean.match(/[^.!?…！？。]+(?:[.!?…！？。]+|$)/g) ?? [clean];
  const result: string[] = [];
  for (const raw of rough) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const words = sentence.match(/\S+/g) ?? [];
    if (words.length <= 40) {
      result.push(sentence);
      continue;
    }
    for (let index = 0; index < words.length; index += 34) result.push(words.slice(index, index + 34).join(' '));
  }
  return result;
}

function buildDocumentChunks(segments: string[], startSegmentIndex = 0, firstWordOffset = 0): DocumentPlaybackChunk[] {
  const chunks: DocumentPlaybackChunk[] = [];
  let textParts: string[] = [];
  let entries: DocumentPlaybackEntry[] = [];
  let charCount = 0;
  let wordCount = 0;
  const flush = () => {
    if (!textParts.length) return;
    chunks.push({ text: textParts.join(' ').trim(), entries });
    textParts = [];
    entries = [];
    charCount = 0;
    wordCount = 0;
  };
  segments.forEach((segment, localIndex) => {
    const sourceWords = segment.match(/\S+/g) ?? [];
    if (!sourceWords.length) return;
    let cursor = localIndex === 0 ? Math.min(Math.max(0, firstWordOffset), Math.max(0, sourceWords.length - 1)) : 0;
    while (cursor < sourceWords.length) {
      const availableChars = Math.max(120, DOCUMENT_CHUNK_CHARS - charCount - (textParts.length ? 1 : 0));
      let take = 0;
      let pieceChars = 0;
      while (cursor + take < sourceWords.length) {
        const word = sourceWords[cursor + take];
        const added = word.length + (take ? 1 : 0);
        if (take > 0 && pieceChars + added > availableChars) break;
        pieceChars += added;
        take += 1;
      }
      if (!take && textParts.length) { flush(); continue; }
      const count = Math.max(1, take);
      const piece = sourceWords.slice(cursor, cursor + count).join(' ');
      if (textParts.length && charCount + 1 + piece.length > DOCUMENT_CHUNK_CHARS) { flush(); continue; }
      const startWord = wordCount;
      textParts.push(piece);
      entries.push({ segmentIndex: startSegmentIndex + localIndex, startWord, endWord: startWord + count, sourceWordStart: cursor });
      charCount += (textParts.length > 1 ? 1 : 0) + piece.length;
      wordCount += count;
      cursor += count;
      if (charCount >= DOCUMENT_CHUNK_CHARS) flush();
    }
  });
  flush();
  return chunks;
}

export default function ReadDocumentScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const scrollRef = useRef<ScrollView>(null);
  const segmentYRef = useRef<Record<number, number>>({});
  const [project, setProject] = useState<ReadProject | null>(null);
  const [voices, setVoices] = useState<ReadVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<DocumentFocusMode>('sentence');
  const [playbackChunks, setPlaybackChunks] = useState<DocumentPlaybackChunk[]>([]);
  const selectedVoice = voices.find((voice) => voice.id === selectedVoiceId) ?? voices[0] ?? null;
  const narrator = useReadNarrator({
    token,
    voice: selectedVoice,
    rate,
    nowPlaying: {
      title: project?.title || 'Floently Read',
      artist: selectedVoice ? `${selectedVoice.name} · ${selectedVoice.provider}` : 'Floently Read',
      albumTitle: 'Document Reading',
    },
  });
  const segments = useMemo(() => splitDocumentSentences(project?.rawText ?? ''), [project?.rawText]);
  const activePlaybackChunk = playbackChunks[narrator.currentSegment] ?? null;
  const activePlaybackEntry = activePlaybackChunk?.entries.find((entry) => narrator.currentWordIndex >= entry.startWord && narrator.currentWordIndex < entry.endWord)
    ?? activePlaybackChunk?.entries[0]
    ?? null;
  const activeSourceSegmentIndex = activePlaybackEntry?.segmentIndex ?? -1;
  const activeSourceWordIndex = activePlaybackEntry
    ? activePlaybackEntry.sourceWordStart + Math.max(0, narrator.currentWordIndex - activePlaybackEntry.startWord)
    : 0;
  const activeSourceWords = activeSourceSegmentIndex >= 0 ? segments[activeSourceSegmentIndex]?.match(/\S+/g) ?? [] : [];
  const absoluteProgressPercent = segments.length > 0 && activeSourceSegmentIndex >= 0
    ? Math.min(100, Math.max(0, ((activeSourceSegmentIndex + Math.min(1, activeSourceWordIndex / Math.max(1, activeSourceWords.length))) / segments.length) * 100))
    : narrator.totalSegments > 0 && narrator.progress >= 0.999 ? 100 : 0;

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);
  useEffect(() => {
    if (hasHydrated && !token) router.replace('/read-login' as never);
  }, [hasHydrated, token]);

  useEffect(() => {
    if (!token || !projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([getReadProject(token, projectId), fetchReadVoices(token)])
      .then(([loadedProject, catalog]) => {
        if (cancelled) return;
        setProject(loadedProject);
        const sorted = [...catalog.voices].sort((a, b) => {
          const pa = a.provider.toLowerCase() === 'google' ? 0 : a.provider.toLowerCase() === 'azure' ? 1 : 2;
          const pb = b.provider.toLowerCase() === 'google' ? 0 : b.provider.toLowerCase() === 'azure' ? 1 : 2;
          if (pa !== pb) return pa - pb;
          const ae = /^en/i.test(a.language) ? 0 : 1;
          const be = /^en/i.test(b.language) ? 0 : 1;
          if (ae !== be) return ae - be;
          return a.name.localeCompare(b.name);
        });
        setVoices(sorted);
        const savedVoice = loadedProject.progress?.voiceId;
        const preferred = sorted.find((voice) => voice.id === savedVoice)
          ?? sorted.find((voice) => voice.id === catalog.defaultVoiceId)
          ?? sorted.find((voice) => voice.provider.toLowerCase() === 'google' && /^en/i.test(voice.language))
          ?? sorted[0];
        setSelectedVoiceId(preferred?.id ?? null);
        const savedRate = loadedProject.progress?.playbackRate;
        if (typeof savedRate === 'number' && savedRate >= 0.5 && savedRate <= 2) setRate(savedRate);
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not open this document.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, token]);

  useEffect(() => {
    if (!narrator.active || activeSourceSegmentIndex < 0) return;
    const y = segmentYRef.current[activeSourceSegmentIndex];
    if (typeof y === 'number') scrollRef.current?.scrollTo({ y: Math.max(0, y - 84), animated: true });
  }, [activeSourceSegmentIndex, narrator.active]);

  const latestProgressRef = useRef({
    currentSegment: activeSourceSegmentIndex,
    progressPercent: absoluteProgressPercent,
    totalSegments: segments.length,
  });
  latestProgressRef.current = {
    currentSegment: activeSourceSegmentIndex,
    progressPercent: absoluteProgressPercent,
    totalSegments: segments.length,
  };

  useEffect(() => {
    if (!token || !project?.id || !narrator.active) return;
    const timer = setInterval(() => {
      const latest = latestProgressRef.current;
      if (latest.totalSegments <= 0) return;
      void updateReadProjectProgress(token, project.id, {
        currentSegmentIndex: latest.currentSegment,
        progressPercent: Math.round(latest.progressPercent * 10) / 10,
        voiceId: selectedVoice?.id ?? null,
        playbackRate: rate,
      }).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [narrator.active, project?.id, rate, selectedVoice?.id, token]);

  useEffect(() => {
    if (!token || !project?.id || narrator.totalSegments <= 0) return;
    const timer = setTimeout(() => {
      void updateReadProjectProgress(token, project.id, {
        currentSegmentIndex: Math.max(0, activeSourceSegmentIndex),
        progressPercent: Math.round(absoluteProgressPercent * 10) / 10,
        voiceId: selectedVoice?.id ?? null,
        playbackRate: rate,
      }).catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [absoluteProgressPercent, activeSourceSegmentIndex, narrator.active, narrator.totalSegments, project?.id, rate, selectedVoice?.id, token]);

  const startFromSentence = (sourceIndex: number) => {
    if (!segments.length) return;
    const startIndex = Math.min(segments.length - 1, Math.max(0, Math.floor(sourceIndex)));
    const chunks = buildDocumentChunks(segments.slice(startIndex), startIndex);
    setPlaybackChunks(chunks);
    void narrator.startSegments(chunks.map((chunk) => ({ text: chunk.text, pauseAfterMs: 0 })));
  };

  const startReading = () => {
    if (!segments.length || !project) return;
    const resumeIndex = project.progress?.currentSegmentIndex ?? 0;
    const shouldResume = !narrator.totalSegments && (project.progress?.progressPercent ?? 0) > 0 && (project.progress?.progressPercent ?? 0) < 99.9;
    startFromSentence(shouldResume ? resumeIndex : 0);
  };

  const changeRate = (delta: number) => {
    setRate((current) => Math.min(2, Math.max(0.5, Math.round((current + delta) * 10) / 10)));
  };

  const status = narrator.error
    ? narrator.error
    : narrator.buffering
      ? `Preparing audio · sentence ${Math.max(1, activeSourceSegmentIndex + 1)} of ${Math.max(segments.length, 1)}…`
      : narrator.active
        ? `${narrator.paused ? 'Paused' : 'Reading'} ${Math.max(1, activeSourceSegmentIndex + 1)} of ${segments.length}${focusMode === 'word' && narrator.currentWord ? ` · ${narrator.currentWord}` : ''}`
        : narrator.totalSegments > 0 && narrator.progress >= 0.999
          ? 'Finished'
          : 'Ready to read';

  if (!hasHydrated || loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color="#7187FF" /><Text style={styles.loadingText}>Opening your reading…</Text></View></SafeAreaView>;
  }

  if (error || !project) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorState}><Text style={styles.errorTitle}>Could not open this reading</Text><Text style={styles.errorBody}>{error || 'Document not found.'}</Text><Pressable onPress={() => router.replace('/read-library' as never)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Back to Library</Text></Pressable></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => { narrator.stop(); router.back(); }} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.titleWrap}><Text numberOfLines={1} style={styles.title}>{project.title}</Text><Text style={styles.meta}>{project.wordCount ? `${project.wordCount.toLocaleString()} words` : `${project.characterCount.toLocaleString()} characters`} · {project.sourceType.toUpperCase()}</Text></View>
        <Pressable onPress={() => router.push({ pathname: '/read-study', params: { id: project.id } } as never)} style={styles.studyButton}><Text style={styles.studyText}>Study</Text></Pressable>
        <Pressable onPress={() => { narrator.stop(); router.replace('/read-home' as never); }} style={styles.homeButton}><Text style={styles.homeText}>F</Text></Pressable>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.documentContent} showsVerticalScrollIndicator={false}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentKicker}>READING</Text>
          <Text style={styles.documentTitle}>{project.title}</Text>
        </View>
        <View style={styles.textCard}>
          {segments.map((segment, index) => {
            const inActiveChunk = Boolean(activePlaybackChunk?.entries.some((entry) => entry.segmentIndex === index));
            const activeSentence = narrator.totalSegments > 0 && index === activeSourceSegmentIndex;
            const visuallyActive = focusMode === 'chunk' ? inActiveChunk : activeSentence;
            const words = segment.match(/\S+/g) ?? [];
            return (
              <Pressable
                key={`${index}-${segment.slice(0, 24)}`}
                accessibilityLabel={`Read from sentence ${index + 1}`}
                onLayout={(event) => { segmentYRef.current[index] = event.nativeEvent.layout.y; }}
                onPress={() => startFromSentence(index)}
                style={({ pressed }) => [styles.segment, visuallyActive && styles.segmentActive, pressed && styles.segmentPressed]}
              >
                <Text style={[styles.segmentText, visuallyActive && styles.segmentTextActive]}>
                  {words.map((word, wordIndex) => {
                    const activeWord = focusMode === 'word' && activeSentence && wordIndex === activeSourceWordIndex;
                    return (
                      <Text key={`${index}-${wordIndex}`} style={activeWord ? styles.wordActive : undefined}>
                        {word}{wordIndex < words.length - 1 ? ' ' : ''}
                      </Text>
                    );
                  })}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 268 }} />
      </ScrollView>

      <View style={styles.player}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(absoluteProgressPercent)}%` }]} /></View>
        <View style={styles.playerStatusRow}>
          <Text numberOfLines={1} style={[styles.playerStatus, narrator.error && styles.playerError]}>{status}</Text>
          <Text style={styles.time}>{formatReadTime(narrator.currentTime)} / {formatReadTime(narrator.duration)}</Text>
        </View>
        <View style={styles.playerMainRow}>
          <Pressable onPress={() => setVoicePickerOpen(true)} style={styles.voiceButton} accessibilityLabel="Choose voice">
            <View style={styles.voiceLabelRow}><Ionicons name="mic-outline" size={13} color="#8597FF" /><Text style={styles.controlLabel}>VOICE</Text></View>
            <Text numberOfLines={1} style={styles.voiceText}>{selectedVoice?.name ?? 'Loading…'}</Text>
          </Pressable>
          <View style={styles.speedBox}>
            <Pressable onPress={() => changeRate(-0.1)} style={styles.speedTap}><Text style={styles.speedGlyph}>−</Text></Pressable>
            <Text style={styles.speedText}>{rate.toFixed(1)}×</Text>
            <Pressable onPress={() => changeRate(0.1)} style={styles.speedTap}><Text style={styles.speedGlyph}>+</Text></Pressable>
          </View>
        </View>
        <View style={styles.focusRow}>
          {(['chunk', 'sentence', 'word'] as DocumentFocusMode[]).map((mode) => (
            <Pressable key={mode} onPress={() => setFocusMode(mode)} style={[styles.focusButton, focusMode === mode && styles.focusButtonActive]}>
              <Text style={[styles.focusText, focusMode === mode && styles.focusTextActive]}>{mode[0].toUpperCase() + mode.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.transportRow}>
          <Pressable disabled={!narrator.active || narrator.buffering} onPress={() => narrator.seekCurrent(narrator.currentTime - 15)} style={[styles.seekButton, (!narrator.active || narrator.buffering) && styles.disabled]} accessibilityLabel="Rewind 15 seconds">
            <Ionicons name="play-back" size={18} color="#E6ECF7" /><Text style={styles.seekText}>15</Text>
          </Pressable>
          {!narrator.active ? (
            <Pressable disabled={!selectedVoice} onPress={startReading} style={[styles.playButton, !selectedVoice && styles.disabled]}>
              <Ionicons name="play" size={17} color="#FFFFFF" /><Text style={styles.playText}>{absoluteProgressPercent >= 99.9 ? 'Read again' : 'Play'}</Text>
            </Pressable>
          ) : (
            <Pressable disabled={narrator.buffering} onPress={narrator.togglePause} style={[styles.playButton, narrator.buffering && styles.disabled]}>
              <Ionicons name={narrator.paused ? 'play' : 'pause'} size={17} color="#FFFFFF" /><Text style={styles.playText}>{narrator.paused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
          )}
          <Pressable disabled={!narrator.active || narrator.buffering} onPress={() => narrator.seekCurrent(narrator.currentTime + 15)} style={[styles.seekButton, (!narrator.active || narrator.buffering) && styles.disabled]} accessibilityLabel="Forward 15 seconds">
            <Ionicons name="play-forward" size={18} color="#E6ECF7" /><Text style={styles.seekText}>15</Text>
          </Pressable>
          <Pressable disabled={!narrator.active} onPress={narrator.stop} style={[styles.stopIconButton, !narrator.active && styles.disabled]} accessibilityLabel="Stop reading"><Ionicons name="stop" size={16} color="#E9DCE4" /></Pressable>
        </View>
        <View style={styles.positionRow}>
          <Text style={styles.positionText}>Sentence {activeSourceSegmentIndex >= 0 ? activeSourceSegmentIndex + 1 : 1} of {Math.max(segments.length, 1)}</Text>
          <Text style={styles.positionText}>{Math.round(absoluteProgressPercent)}%</Text>
        </View>
      </View>

      <Modal visible={voicePickerOpen} transparent animationType="slide" onRequestClose={() => setVoicePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.voiceSheet}>
            <View style={styles.sheetHeader}><View><Text style={styles.sheetKicker}>FLOENTLY VOICES</Text><Text style={styles.sheetTitle}>Choose narration</Text></View><Pressable onPress={() => setVoicePickerOpen(false)} style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable></View>
            <ScrollView contentContainerStyle={styles.voiceList}>
              {voices.map((voice) => (
                <Pressable
                  key={voice.id}
                  onPress={() => { narrator.stop(); setSelectedVoiceId(voice.id); setVoicePickerOpen(false); }}
                  style={[styles.voiceOption, voice.id === selectedVoiceId && styles.voiceOptionActive]}
                >
                  <View style={{ flex: 1 }}><Text style={styles.voiceOptionName}>{voice.name}</Text><Text style={styles.voiceOptionMeta}>{voice.provider.toUpperCase()} · {voice.locale}{voice.accent ? ` · ${voice.accent}` : ''}</Text></View>
                  {voice.id === selectedVoiceId ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080D16' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#78869A', fontSize: 12 },
  topBar: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, backgroundColor: '#0B121E', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1C293B' },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#121D2C', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 29, lineHeight: 31 },
  titleWrap: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  meta: { color: '#69778C', fontSize: 9.5, marginTop: 3, fontWeight: '700' },
  studyButton: { minHeight: 38, borderRadius: 13, backgroundColor: '#17243A', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  studyText: { color: '#8EA0FF', fontSize: 10.5, fontWeight: '900' },
  homeButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#5364FF', alignItems: 'center', justifyContent: 'center' },
  homeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  documentContent: { paddingHorizontal: 15, paddingTop: 18 },
  documentHeader: { paddingHorizontal: 7, paddingBottom: 15 },
  documentKicker: { color: '#7187FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  documentTitle: { color: '#F7F9FF', fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.45, marginTop: 5 },
  textCard: { borderRadius: 24, backgroundColor: '#101722', borderWidth: 1, borderColor: '#1B2839', paddingVertical: 12, paddingHorizontal: 9 },
  segment: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, marginVertical: 1 },
  segmentActive: { backgroundColor: '#1B2A50', borderLeftWidth: 3, borderLeftColor: '#7187FF' },
  segmentPressed: { opacity: 0.78 },
  segmentText: { color: '#D6DCE6', fontSize: 17, lineHeight: 28, letterSpacing: 0.05 },
  segmentTextActive: { color: '#FFFFFF' },
  wordActive: { color: '#FFFFFF', backgroundColor: '#5364FF', fontWeight: '900' },
  player: { position: 'absolute', left: 10, right: 10, bottom: 8, borderRadius: 24, backgroundColor: '#111A29', borderWidth: 1, borderColor: '#25334B', padding: 12, gap: 9, shadowColor: '#000000', shadowOpacity: 0.38, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 12 },
  progressTrack: { height: 4, borderRadius: 999, backgroundColor: '#253149', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7187FF', borderRadius: 999 },
  playerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerStatus: { flex: 1, color: '#A9B4C5', fontSize: 10.5, fontWeight: '700' },
  playerError: { color: '#FF91A1' },
  time: { color: '#7187FF', fontSize: 10, fontWeight: '900' },
  playerMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceButton: { flex: 1, minHeight: 46, borderRadius: 15, backgroundColor: '#18243A', paddingHorizontal: 12, justifyContent: 'center' },
  voiceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  controlLabel: { color: '#7187FF', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.1 },
  voiceText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900', marginTop: 2 },
  speedBox: { minHeight: 46, borderRadius: 15, backgroundColor: '#18243A', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  speedTap: { width: 39, height: 46, alignItems: 'center', justifyContent: 'center' },
  speedGlyph: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  speedText: { width: 45, color: '#FFFFFF', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusButton: { flex: 1, minHeight: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151F30', borderWidth: 1, borderColor: '#24334B' },
  focusButtonActive: { backgroundColor: '#263A72', borderColor: '#7187FF' },
  focusText: { color: '#9EABBD', fontSize: 9.5, fontWeight: '800' },
  focusTextActive: { color: '#FFFFFF' },
  transportRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  seekButton: { width: 48, minHeight: 43, borderRadius: 14, backgroundColor: '#202C40', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2 },
  seekText: { color: '#AEB8C8', fontSize: 8, fontWeight: '900' },
  playButton: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: '#5364FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  playIcon: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  playText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  stopIconButton: { width: 43, minHeight: 43, borderRadius: 14, backgroundColor: '#2A2632', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#493647' },
  positionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  positionText: { color: '#75849A', fontSize: 9.5, fontWeight: '800' },
  stopButton: { minWidth: 78, minHeight: 43, borderRadius: 14, backgroundColor: '#273247', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  stopIcon: { color: '#D8DFEA', fontSize: 8 },
  stopText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  counterBox: { minWidth: 65, minHeight: 43, borderRadius: 14, backgroundColor: '#151F30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  counterTop: { color: '#65758D', fontSize: 6.5, letterSpacing: 0.8, fontWeight: '900' },
  counterText: { color: '#E8ECF4', fontSize: 10.5, fontWeight: '900', marginTop: 2 },
  disabled: { opacity: 0.36 },
  errorState: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  errorBody: { color: '#8390A4', fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  primaryButton: { minHeight: 46, borderRadius: 15, backgroundColor: '#5364FF', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.56)', justifyContent: 'flex-end' },
  voiceSheet: { maxHeight: '74%', backgroundColor: '#101827', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: '#293750', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetKicker: { color: '#7187FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 },
  sheetTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
  doneButton: { minHeight: 40, borderRadius: 14, backgroundColor: '#1B2639', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  voiceList: { gap: 7, paddingBottom: 10 },
  voiceOption: { minHeight: 60, borderRadius: 16, backgroundColor: '#162033', borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceOptionActive: { borderColor: '#5364FF', backgroundColor: '#19294F' },
  voiceOptionName: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  voiceOptionMeta: { color: '#8795AA', fontSize: 10.5, marginTop: 3 },
  check: { color: '#8094FF', fontSize: 18, fontWeight: '900' },
});
