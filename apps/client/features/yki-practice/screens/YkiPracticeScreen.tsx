import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import {
  getYkiPracticeOverview,
  type YkiLevelBand,
  type YkiPracticeFocus,
  type YkiPracticeOverview,
  type YkiPracticeSession,
  type YkiPracticeTask,
} from '@core/api/ykiPractice';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { clearPracticeSession, resumePracticeSession, startPracticeSession } from '../services/ykiPracticeService';

const LEVEL_BANDS: YkiLevelBand[] = ['A1-A2', 'B1-B2', 'C1-C2'];
const FOCUS_OPTIONS: Array<{ key: YkiPracticeFocus; label: string }> = [
  { key: 'mixed', label: 'Mixed' },
  { key: 'reading', label: 'Reading' },
  { key: 'listening', label: 'Listening' },
  { key: 'writing', label: 'Writing' },
  { key: 'speaking', label: 'Speaking' },
];

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenExam: (levelBand?: YkiLevelBand) => void;
  onOpenPractice?: () => void;
  onOpenMockCycle?: () => void;
};

export default function YkiPracticeScreen({ onBack, onOpenMenu, onOpenExam, onOpenPractice, onOpenMockCycle }: Props) {
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<YkiLevelBand>('B1-B2');
  const [selectedFocus, setSelectedFocus] = useState<YkiPracticeFocus>('mixed');
  const [overview, setOverview] = useState<YkiPracticeOverview | null>(null);
  const [session, setSession] = useState<YkiPracticeSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);

  useEffect(() => { void hydratePreferences(); }, [hydratePreferences]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    setSession(null);
    setCurrentIndex(0);
    void (async () => {
      try {
        const next = await getYkiPracticeOverview(selectedLevel);
        if (!cancelled) setOverview(next);
      } catch (error) {
        if (!cancelled) {
          setOverview(null);
          setErrorMessage(error instanceof Error ? error.message : 'Practice overview could not be loaded.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedLevel]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await resumePracticeSession();
        if (!cancelled && existing) {
          setSession(existing);
          setCurrentIndex(existing.current_task_index ?? 0);
        }
      } catch {
        if (!cancelled) {
          await clearPracticeSession();
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleOpenMockCycle() {
    if (onOpenMockCycle) {
      onOpenMockCycle();
      return;
    }
    router.push('/yki-exam/mock-cycle' as never);
  }

  async function handleStartPractice() {
    setStarting(true);
    setErrorMessage(null);
    try {
      const started = await startPracticeSession(selectedLevel, selectedFocus);
      setSession(started);
      setCurrentIndex(started.current_task_index ?? 0);
      if (!started.tasks?.length) {
        setErrorMessage('Practice session started but no tasks were returned.');
      }
    } catch (error) {
      setSession(null);
      setErrorMessage(error instanceof Error ? error.message : 'Practice session could not be started.');
    } finally {
      setStarting(false);
    }
  }

  const currentTask: YkiPracticeTask | null = useMemo(() => {
    if (!session || !Array.isArray(session.tasks) || session.tasks.length === 0) return null;
    return session.tasks[Math.min(currentIndex, session.tasks.length - 1)];
  }, [session, currentIndex]);

  const recommendedSections = overview?.recommendedSections?.length
    ? overview.recommendedSections.join(' • ')
    : 'Reading • Listening • Writing • Speaking';
  const counts = overview?.countsBySkill;
  const taskCounter = session ? `${currentIndex + 1}/${session.tasks.length}` : null;

  return (
    <AppScaffold
      themeMode={themeMode}
      allowScroll={true}
      header={
        <PageHeader
          eyebrow="YKI Practice"
          title="Guided YKI practice for work and life in Finland"
          subtitle="Choose a level and focus. Practice stays guided and skill-based so you can strengthen the parts of YKI that also matter for work, citizenship, permanent residence, and everyday life in Finland."
          actionLabel="Home"
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
          themeMode={themeMode}
        />
      }
    >
      <View style={styles.levelRow}>
        {LEVEL_BANDS.map((band) => (
          <Pressable key={band} onPress={() => setSelectedLevel(band)} style={[styles.levelPill, selectedLevel === band && styles.activeLevelPill]}>
            <Text style={[styles.levelText, selectedLevel === band && styles.activeLevelText]}>{band}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.focusRow}>
        {FOCUS_OPTIONS.map((option) => (
          <Pressable key={option.key} onPress={() => setSelectedFocus(option.key)} style={[styles.focusPill, selectedFocus === option.key && styles.activeFocusPill]}>
            <Text style={[styles.focusText, selectedFocus === option.key && styles.activeFocusText]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {onOpenPractice ? (
          <TaskCard
            themeMode={themeMode}
            title="YKI pathway overview"
            detail="Section-focused practice with clear next steps."
            meta="2–10 min"
            actionLabel="Open"
            onPress={onOpenPractice}
          />
        ) : null}
        <TaskCard
          themeMode={themeMode}
          accent="blue"
          title="Guided YKI pathway"
          detail={overview?.nextTask ?? `Start a governed ${selectedLevel} practice block.`}
          meta={loading ? 'Loading…' : `${overview?.dailyPractice?.minutes ?? 15} min`}
          actionLabel={starting ? 'Starting…' : 'Start'}
          onPress={() => void handleStartPractice()}
        />
        <TaskCard
          themeMode={themeMode}
          accent="yellow"
          title="Mock cycle"
          detail="Use the mock cycle for pressure and timing preparation without entering the full exam runtime."
          meta="Preparation"
          actionLabel="Open"
          onPress={handleOpenMockCycle}
        />
        <TaskCard
          themeMode={themeMode}
          title="Full YKI exam"
          detail={`Open the formal ${selectedLevel} exam selection and runtime when you want the real simulation.`}
          meta="Exam"
          actionLabel="Open"
          onPress={() => onOpenExam(selectedLevel)}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How to find it later</Text>
        <Text style={styles.infoText}>Dashboard → YKI Prep → Practice. Keep this route stable so YKI work is always easy to find.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Bank coverage for {selectedLevel}</Text>
        <Text style={styles.infoText}>
          {loading
            ? 'Loading the certified bank overview…'
            : `${overview?.total_tasks ?? 0} tasks available · Recommended focus: ${overview?.nextFocus ?? 'mixed'} · Sections: ${recommendedSections}`}
        </Text>
        {counts ? (
          <View style={styles.metricsRow}>
            <Text style={styles.metric}>Reading {counts.reading}</Text>
            <Text style={styles.metric}>Listening {counts.listening}</Text>
            <Text style={styles.metric}>Writing {counts.writing}</Text>
            <Text style={styles.metric}>Speaking {counts.speaking}</Text>
          </View>
        ) : null}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {currentTask ? (
        <View style={styles.practiceCard}>
          <Text style={styles.practiceEyebrow}>Guided practice · {session?.display_level_band} · {taskCounter}</Text>
          <Text style={styles.practiceTitle}>{currentTask.title}</Text>
          <Text style={styles.practicePrompt}>{currentTask.prompt}</Text>
          <Text style={styles.practiceGuidance}>{currentTask.guidance}</Text>
          <Text style={styles.debugText}>Task id: {currentTask.task_id}</Text>
          <View style={styles.practiceActions}>
            <Pressable
              onPress={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              style={[styles.secondaryButton, currentIndex === 0 && styles.secondaryButtonDisabled]}
              disabled={currentIndex === 0}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                if (!session) return;
                if (currentIndex >= session.tasks.length - 1) {
                  setCurrentIndex(0);
                  setSession(null);
                  await clearPracticeSession();
                  return;
                }
                setCurrentIndex((value) => value + 1);
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{currentIndex >= (session?.tasks.length ?? 1) - 1 ? 'Finish block' : 'Next task'}</Text>
            </Pressable>
          </View>
        </View>
      ) : session && !starting ? (
        <View style={styles.practiceCard}>
          <Text style={styles.practiceEyebrow}>Practice session</Text>
          <Text style={styles.practiceTitle}>The session started but returned no visible task.</Text>
          <Text style={styles.practiceGuidance}>Session id: {session.session_id}</Text>
        </View>
      ) : null}

      {starting ? <ActivityIndicator style={{ marginTop: 12 }} color="#2453D4" /> : null}
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  levelPill: { minHeight: 38, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#101A30', borderWidth: 1, borderColor: '#223252' },
  activeLevelPill: { backgroundColor: '#2453D4' },
  levelText: { color: '#D6E2FF', fontSize: 12, fontWeight: '800' },
  activeLevelText: { color: '#FFFFFF' },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  focusPill: { minHeight: 34, borderRadius: 999, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#F3F6FB', borderWidth: 1, borderColor: '#D7E0ED' },
  activeFocusPill: { backgroundColor: '#E8F0FF', borderColor: '#2453D4' },
  focusText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  activeFocusText: { color: '#2453D4' },
  grid: { gap: 12 },
  infoCard: { borderRadius: 20, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 8, backgroundColor: '#FFFFFF', marginTop: 12 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  infoText: { fontSize: 13, lineHeight: 20, color: '#4B5563' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  metric: { fontSize: 12, fontWeight: '700', color: '#2453D4', backgroundColor: '#EEF4FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  practiceCard: { borderRadius: 20, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 8, backgroundColor: '#FFFFFF', marginTop: 12 },
  practiceEyebrow: { fontSize: 11, fontWeight: '800', color: '#2453D4', textTransform: 'uppercase' },
  practiceTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  practicePrompt: { fontSize: 14, lineHeight: 22, color: '#111827' },
  practiceGuidance: { fontSize: 13, lineHeight: 20, color: '#4B5563' },
  debugText: { fontSize: 11, color: '#6B7280' },
  practiceActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryButton: { minHeight: 38, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#EEF2F7' },
  secondaryButtonDisabled: { opacity: 0.45 },
  secondaryButtonText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 38, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#2453D4' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  errorText: { color: '#C03737', fontSize: 12, marginTop: 8 },
});
