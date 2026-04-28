import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from './preferencesStore';
import {
  getYkiPracticeOverview,
  type YkiLevelBand,
  type YkiPracticeFocus,
  type YkiPracticeOverview,
  type YkiPracticeSession,
  type YkiPracticeTask,
} from '@core/api/ykiPractice';
import { startPracticeSession } from '../features/yki-practice/services/ykiPracticeService';

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:        '#0C1222',
  surface:   '#111B30',
  raised:    '#16233E',
  border:    '#1E2E47',
  text:      '#F0F5FF',
  muted:     '#8EA3C3',
  soft:      '#5C7299',
  primary:   '#4F7FFF',
  yki:       '#A78BFA',
  ykiDim:    'rgba(167,139,250,0.12)',
  success:   '#3EC58A',
  warning:   '#F0A436',
  danger:    '#FF6B6B',
};

const LEVEL_BANDS: YkiLevelBand[] = ['A1-A2', 'B1-B2', 'C1-C2'];

const SKILL_META: Record<string, { icon: string; color: string; label: string }> = {
  reading:   { icon: '📖', color: '#4F7FFF', label: 'Reading' },
  listening: { icon: '👂', color: '#A78BFA', label: 'Listening' },
  writing:   { icon: '✍',  color: '#F0C86D', label: 'Writing'  },
  speaking:  { icon: '🎙', color: '#F0A436', label: 'Speaking'  },
};

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenExam: (levelBand?: YkiLevelBand) => void;
  /** Called when a speaking task is activated — launches the roleplay engine */
  onOpenSpeaking?: (config: { levelBand: YkiLevelBand; profession: string; scenarioHint?: string }) => void;
};

type MCQOption = { text: string; index: number };
type AnswerState = { selected: number | null; submitted: boolean; correct: boolean | null };

// ---------------------------------------------------------------------------
// Sub-component: MCQ task renderer
// ---------------------------------------------------------------------------
function McqTask({
  task,
  themeMode,
  onAnswered,
}: {
  task: YkiPracticeTask;
  themeMode: 'light' | 'dark';
  onAnswered: () => void;
}) {
  const isDark = themeMode === 'dark';
  const palette = getFloentlyPalette(themeMode);
  const surface  = isDark ? T.surface : palette.surface;
  const border   = isDark ? T.border  : palette.border;
  const text     = isDark ? T.text    : palette.text;
  const muted    = isDark ? T.muted   : palette.textMuted;

  const [answer, setAnswer] = useState<AnswerState>({ selected: null, submitted: false, correct: null });
  const options: MCQOption[] = ((task as any).options ?? []).map((opt: string, i: number) => ({ text: opt, index: i }));
  const correct_index: number = (task as any).correct_index ?? -1;
  const passage: string | undefined = (task as any).passage;
  const audio_script: string | undefined = (task as any).audio_script;

  function handleSelect(idx: number) {
    if (answer.submitted) return;
    setAnswer({ selected: idx, submitted: false, correct: null });
  }

  function handleSubmit() {
    if (answer.selected === null) return;
    const isCorrect = answer.selected === correct_index;
    setAnswer((prev) => ({ ...prev, submitted: true, correct: isCorrect }));
  }

  return (
    <View style={styles.taskInner}>
      {/* Passage or audio script */}
      {passage ? (
        <View style={[styles.passageBlock, { backgroundColor: isDark ? T.raised : palette.surfaceMuted, borderColor: border }]}>
          <Text style={[styles.passageText, { color: text }]}>{passage}</Text>
        </View>
      ) : null}
      {audio_script ? (
        <View style={[styles.passageBlock, { backgroundColor: isDark ? T.raised : palette.surfaceMuted, borderColor: border }]}>
          <Text style={[styles.passageLabel, { color: isDark ? T.yki : palette.textSoft }]}>🔊 Audio transcript (practice only)</Text>
          <Text style={[styles.passageText, { color: text }]}>{audio_script}</Text>
        </View>
      ) : null}

      {/* Question */}
      <Text style={[styles.questionText, { color: text }]}>{(task as any).question}</Text>

      {/* Options */}
      {options.map((opt) => {
        const isSelected = answer.selected === opt.index;
        const isCorrectOpt = answer.submitted && opt.index === correct_index;
        const isWrongOpt   = answer.submitted && isSelected && !answer.correct;
        return (
          <Pressable
            key={opt.index}
            onPress={() => handleSelect(opt.index)}
            style={[
              styles.optionBtn,
              { borderColor: border, backgroundColor: surface },
              isSelected && !answer.submitted && { borderColor: T.yki, backgroundColor: T.ykiDim },
              isCorrectOpt && { borderColor: T.success, backgroundColor: 'rgba(62,197,138,0.1)' },
              isWrongOpt   && { borderColor: T.danger,  backgroundColor: 'rgba(255,107,107,0.1)' },
            ]}
          >
            <Text style={[styles.optionText, { color: text },
              isCorrectOpt && { color: T.success },
              isWrongOpt   && { color: T.danger },
            ]}>
              {opt.text}
            </Text>
          </Pressable>
        );
      })}

      {/* Submit / feedback */}
      {!answer.submitted ? (
        <Pressable
          onPress={handleSubmit}
          disabled={answer.selected === null}
          style={[styles.checkBtn, { backgroundColor: T.yki }, answer.selected === null && { opacity: 0.45 }]}
        >
          <Text style={styles.checkBtnText}>Check answer</Text>
        </Pressable>
      ) : (
        <View style={[styles.feedbackRow, { backgroundColor: answer.correct ? 'rgba(62,197,138,0.1)' : 'rgba(255,107,107,0.1)', borderColor: answer.correct ? T.success : T.danger }]}>
          <Text style={{ color: answer.correct ? T.success : T.danger, fontWeight: '700', fontSize: 14 }}>
            {answer.correct ? '✓ Correct!' : '✗ Not quite — the correct answer is highlighted above.'}
          </Text>
          <Pressable onPress={onAnswered} style={[styles.nextBtn, { backgroundColor: T.yki }]}>
            <Text style={styles.nextBtnText}>Next task →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Writing task renderer
// ---------------------------------------------------------------------------
function WritingTask({
  task,
  themeMode,
  onAnswered,
}: {
  task: YkiPracticeTask;
  themeMode: 'light' | 'dark';
  onAnswered: () => void;
}) {
  const isDark = themeMode === 'dark';
  const palette = getFloentlyPalette(themeMode);
  const border = isDark ? T.border : palette.border;
  const text   = isDark ? T.text   : palette.text;
  const muted  = isDark ? T.muted  : palette.textMuted;
  const raised = isDark ? T.raised : palette.surfaceMuted;

  const [value, setValue] = useState('');
  const [saved, setSaved]   = useState(false);
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const target    = (task as any).word_count_target ?? 100;
  const prompt: string = (task as any).prompt ?? task.prompt;

  return (
    <View style={styles.taskInner}>
      <View style={[styles.passageBlock, { backgroundColor: raised, borderColor: border }]}>
        <Text style={[styles.passageText, { color: text }]}>{prompt}</Text>
      </View>

      <View style={[styles.writingGuidanceRow, { borderColor: border }]}>
        <Text style={[styles.guidanceText, { color: muted }]}>{task.guidance}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Kirjoita vastauksesi tähän…"
        placeholderTextColor={isDark ? T.soft : palette.textSoft}
        multiline
        style={[styles.writingInput, { backgroundColor: isDark ? '#0D1529' : '#F8FAFF', borderColor: border, color: text }]}
        editable={!saved}
      />

      <View style={styles.wordCountRow}>
        <Text style={[styles.wordCount, { color: wordCount >= target ? T.success : muted }]}>
          {wordCount} / {target} sanaa
        </Text>
        {!saved ? (
          <Pressable
            onPress={() => setSaved(true)}
            disabled={wordCount < Math.round(target * 0.6)}
            style={[styles.checkBtn, { backgroundColor: T.warning }, wordCount < Math.round(target * 0.6) && { opacity: 0.45 }]}
          >
            <Text style={styles.checkBtnText}>Tallenna vastaus</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onAnswered} style={[styles.nextBtn, { backgroundColor: T.yki }]}>
            <Text style={styles.nextBtnText}>Next task →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Speaking task renderer
// ---------------------------------------------------------------------------
function SpeakingTask({
  task,
  themeMode,
  onStartRoleplay,
  onAnswered,
}: {
  task: YkiPracticeTask;
  themeMode: 'light' | 'dark';
  onStartRoleplay: (config: any) => void;
  onAnswered: () => void;
}) {
  const isDark = themeMode === 'dark';
  const palette = getFloentlyPalette(themeMode);
  const border = isDark ? T.border : palette.border;
  const text   = isDark ? T.text   : palette.text;
  const muted  = isDark ? T.muted  : palette.textMuted;
  const raised = isDark ? T.raised : palette.surfaceMuted;
  const roleplayConfig = (task as any).roleplay_config;
  const prompt: string = (task as any).prompt ?? task.prompt;

  return (
    <View style={styles.taskInner}>
      <View style={[styles.passageBlock, { backgroundColor: raised, borderColor: border }]}>
        <Text style={[styles.passageText, { color: text }]}>{prompt}</Text>
      </View>

      <View style={[styles.writingGuidanceRow, { borderColor: border }]}>
        <Text style={[styles.guidanceText, { color: muted }]}>{task.guidance}</Text>
      </View>

      <View style={styles.speakingActions}>
        {roleplayConfig ? (
          <Pressable
            onPress={() => onStartRoleplay(roleplayConfig)}
            style={[styles.speakingPrimaryBtn, { backgroundColor: T.warning }]}
          >
            <Text style={styles.speakingPrimaryBtnText}>🎙  Start conversation roleplay</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onAnswered}
          style={[styles.speakingSecondaryBtn, { borderColor: border }]}
        >
          <Text style={[styles.speakingSecondaryBtnText, { color: muted }]}>
            Mark complete → Next task
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main route component
// ---------------------------------------------------------------------------
export default function YkiPracticeRoute({ onBack, onOpenMenu, onOpenExam, onOpenSpeaking }: Props) {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const hydratePreferences = usePreferencesStore((s) => s.hydrate);
  const isDark = themeMode === 'dark';
  const palette = getFloentlyPalette(themeMode);

  const bg      = isDark ? T.bg      : palette.background;
  const surface = isDark ? T.surface : palette.surface;
  const border  = isDark ? T.border  : palette.border;
  const text    = isDark ? T.text    : palette.text;
  const muted   = isDark ? T.muted   : palette.textMuted;
  const soft    = isDark ? T.soft    : palette.textSoft;

  const [selectedLevel, setSelectedLevel] = useState<YkiLevelBand>('B1-B2');
  const [overview, setOverview]     = useState<YkiPracticeOverview | null>(null);
  const [session, setSession]       = useState<YkiPracticeSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [starting, setStarting]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { void hydratePreferences(); }, [hydratePreferences]);

  // Load overview whenever level changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSession(null);
    setCurrentIndex(0);
    setError(null);
    void (async () => {
      try {
        const next = await getYkiPracticeOverview(selectedLevel);
        if (!cancelled) setOverview(next);
      } catch (e) {
        if (!cancelled) setError('Could not load practice overview. Check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedLevel]);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const started = await startPracticeSession(selectedLevel, 'mixed');
      setSession(started);
      setCurrentIndex(0);
    } catch (e) {
      setError('Could not start the practice session. Check your connection and try again.');
    } finally {
      setStarting(false);
    }
  }

  const currentTask: YkiPracticeTask | null = useMemo(() => {
    if (!session?.tasks?.length) return null;
    return session.tasks[Math.min(currentIndex, session.tasks.length - 1)];
  }, [session, currentIndex]);

  function handleTaskAnswered() {
    if (!session) return;
    const next = currentIndex + 1;
    if (next >= session.tasks.length) {
      setSession(null);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(next);
    }
  }

  function handleStartRoleplay(config: any) {
    onOpenSpeaking?.({
      levelBand: config.level_band ?? selectedLevel,
      profession: config.profession ?? 'general',
      scenarioHint: config.scenario_hint,
    });
  }

  const skillMeta = currentTask ? SKILL_META[currentTask.skill] ?? SKILL_META.reading : null;
  const taskCounter = session ? `${currentIndex + 1} / ${session.tasks.length}` : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={onBack} style={[styles.navBtn, { backgroundColor: isDark ? T.raised : palette.surfaceMuted, borderColor: border }]}>
          <Text style={[styles.navBtnText, { color: muted }]}>← Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.eyebrow, { color: T.yki }]}>YKI</Text>
          <Text style={[styles.headerTitle, { color: text }]}>YKI Exam</Text>
        </View>
        <Pressable onPress={onOpenMenu} style={[styles.navBtn, { backgroundColor: isDark ? T.raised : palette.surfaceMuted, borderColor: border }]}>
          <Text style={[styles.navBtnText, { color: muted }]}>Menu</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Level selector */}
        <View>
          <Text style={[styles.sectionLabel, { color: soft }]}>Level</Text>
          <View style={styles.levelRow}>
            {LEVEL_BANDS.map((band) => (
              <Pressable
                key={band}
                onPress={() => setSelectedLevel(band)}
                style={[
                  styles.levelPill,
                  { borderColor: border, backgroundColor: isDark ? T.raised : palette.surfaceMuted },
                  selectedLevel === band && { backgroundColor: T.yki, borderColor: T.yki },
                ]}
              >
                <Text style={[styles.levelText, { color: muted }, selectedLevel === band && { color: '#fff' }]}>
                  {band}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Overview stats */}
        {!loading && overview && !session && (
          <View style={[styles.overviewCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.overviewTitle, { color: text }]}>
              {overview.display_level_band} exam block
            </Text>
            <View style={styles.skillCountRow}>
              {Object.entries(overview.countsBySkill).map(([skill, count]) => {
                const meta = SKILL_META[skill];
                if (!meta || !count) return null;
                return (
                  <View key={skill} style={[styles.skillChip, { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}40` }]}>
                    <Text style={{ fontSize: 12 }}>{meta.icon}</Text>
                    <Text style={[styles.skillChipText, { color: meta.color }]}>{skill} {count}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.overviewNote, { color: muted }]}>
              Each exam block gives you 1 reading · 1 listening · 1 writing · 1 speaking task in one continuous run.
            </Text>
          </View>
        )}

        {!loading && !session && (
          <View style={[styles.cardsCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.cardsTitle, { color: text }]}>YKI cards</Text>
            <Text style={[styles.cardsBody, { color: muted }]}>Open the shared general-language flashcards used by the YKI pathway. The familiar card practice screen stays the same, but the content stays clearly separate from profession-specific cards.</Text>
            <Pressable
              onPress={() => router.push('/cards?mode=vocabulary&domain=general' as never)}
              style={[styles.cardsButton, { backgroundColor: T.yki }]}
            >
              <Text style={styles.cardsButtonText}>Open YKI cards</Text>
            </Pressable>
          </View>
        )}

        {/* Loading / error */}
        {loading && (
          <View style={styles.centeredRow}>
            <ActivityIndicator color={T.yki} />
            <Text style={[styles.loadingText, { color: muted }]}>Loading…</Text>
          </View>
        )}
        {error && !loading && (
          <View style={[styles.errorRow, { borderColor: T.danger, backgroundColor: 'rgba(255,107,107,0.08)' }]}>
            <Text style={[styles.errorText, { color: T.danger }]}>{error}</Text>
          </View>
        )}

        {/* Start button — shown when no session active */}
        {!session && !loading && (
          <View style={styles.startSection}>
            <Pressable
              onPress={() => void handleStart()}
              disabled={starting}
              style={[styles.startBtn, { backgroundColor: T.yki }, starting && { opacity: 0.65 }]}
            >
              {starting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.startBtnText}>Start exam block →</Text>
              }
            </Pressable>

            <Pressable
              onPress={() => onOpenExam(selectedLevel)}
              style={[styles.examLink, { borderColor: border }]}
            >
              <Text style={[styles.examLinkText, { color: soft }]}>Go back to guided YKI practice instead →</Text>
            </Pressable>
          </View>
        )}

        {/* Active task */}
        {session && currentTask && (
          <View style={[styles.taskCard, { backgroundColor: surface, borderColor: border }]}>
            {/* Task header */}
            <View style={styles.taskHeader}>
              <View style={[styles.skillBadge, { backgroundColor: `${skillMeta!.color}18`, borderColor: `${skillMeta!.color}40` }]}>
                <Text style={{ fontSize: 13 }}>{skillMeta!.icon}</Text>
                <Text style={[styles.skillBadgeText, { color: skillMeta!.color }]}>
                  {skillMeta!.label}
                </Text>
              </View>
              <Text style={[styles.taskCounter, { color: soft }]}>{taskCounter}</Text>
            </View>

            <Text style={[styles.taskTitle, { color: text }]}>{currentTask.title}</Text>

            {/* CEFR descriptor */}
            {(currentTask as any).cefr_descriptor && (
              <Text style={[styles.cefrTag, { color: soft }]}>
                {(currentTask as any).cefr_descriptor}
              </Text>
            )}

            {/* Skill-specific renderer */}
            {(currentTask.skill === 'reading' || currentTask.skill === 'listening') && (
              <McqTask key={currentIndex} task={currentTask} themeMode={themeMode} onAnswered={handleTaskAnswered} />
            )}
            {currentTask.skill === 'writing' && (
              <WritingTask key={currentIndex} task={currentTask} themeMode={themeMode} onAnswered={handleTaskAnswered} />
            )}
            {currentTask.skill === 'speaking' && (
              <SpeakingTask
                key={currentIndex}
                task={currentTask}
                themeMode={themeMode}
                onStartRoleplay={handleStartRoleplay}
                onAnswered={handleTaskAnswered}
              />
            )}
          </View>
        )}

        {/* Finish screen */}
        {session && currentIndex >= session.tasks.length && (
          <View style={[styles.finishCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.finishTitle, { color: text }]}>Session complete ✓</Text>
            <Text style={[styles.finishSub, { color: muted }]}>
              You completed {session.tasks.length} tasks at {session.display_level_band} level.
              Start a new session for a fresh random selection.
            </Text>
            <Pressable
              onPress={() => void handleStart()}
              style={[styles.startBtn, { backgroundColor: T.yki, marginTop: 8 }]}
            >
              <Text style={styles.startBtnText}>Start another session</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle: { fontSize: 15, fontWeight: '700' },
  navBtn: { minHeight: 34, borderRadius: 999, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1 },
  navBtnText: { fontSize: 12, fontWeight: '600' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelPill: { flex: 1, minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  levelText: { fontSize: 13, fontWeight: '700' },
  overviewCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  overviewTitle: { fontSize: 15, fontWeight: '700' },
  skillCountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  skillChipText: { fontSize: 12, fontWeight: '700' },
  overviewNote: { fontSize: 12, lineHeight: 18 },
  cardsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardsTitle: { fontSize: 15, fontWeight: '700' },
  cardsBody: { fontSize: 12, lineHeight: 18 },
  cardsButton: { alignSelf: 'flex-start', minHeight: 40, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center' },
  cardsButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  centeredRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', padding: 20 },
  loadingText: { fontSize: 13 },
  errorRow: { borderRadius: 12, borderWidth: 1, padding: 14 },
  errorText: { fontSize: 13, lineHeight: 19 },
  startSection: { gap: 10 },
  startBtn: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  examLink: { minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  examLinkText: { fontSize: 13, fontWeight: '600' },
  taskCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  skillBadgeText: { fontSize: 12, fontWeight: '700' },
  taskCounter: { fontSize: 12, fontWeight: '600' },
  taskTitle: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  cefrTag: { fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  taskInner: { gap: 12 },
  passageBlock: { borderRadius: 12, borderWidth: 1, padding: 14 },
  passageLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  passageText: { fontSize: 14, lineHeight: 22 },
  questionText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  optionBtn: { borderRadius: 12, borderWidth: 1, padding: 13 },
  optionText: { fontSize: 14, lineHeight: 20 },
  checkBtn: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  checkBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  feedbackRow: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  nextBtn: { alignSelf: 'flex-start', minHeight: 38, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  writingGuidanceRow: { borderLeftWidth: 3, borderColor: '#A78BFA', paddingLeft: 12 },
  guidanceText: { fontSize: 13, lineHeight: 19 },
  writingInput: { minHeight: 160, borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, lineHeight: 22, textAlignVertical: 'top' },
  wordCountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordCount: { fontSize: 13, fontWeight: '600' },
  speakingActions: { gap: 10 },
  speakingPrimaryBtn: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  speakingPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  speakingSecondaryBtn: { minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  speakingSecondaryBtnText: { fontSize: 13, fontWeight: '600' },
  finishCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 10, alignItems: 'center' },
  finishTitle: { fontSize: 20, fontWeight: '700' },
  finishSub: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
