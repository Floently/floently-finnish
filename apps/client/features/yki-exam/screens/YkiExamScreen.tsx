import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { getYkiExamOverview, type YkiExamOverview, type YkiLevelBand } from '@core/api/ykiExam';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { startExamSession } from '../services/ykiExamService';

const LEVEL_BANDS: YkiLevelBand[] = ['A1-A2', 'B1-B2', 'C1-C2'];

type Props = {
  onExit: () => void;
  onOpenMenu?: () => void;
  onOpenPractice?: (levelBand?: YkiLevelBand) => void;
  onOpenSpeakingConversation?: (levelBand: YkiLevelBand) => void;
  onOpenSpeakingRecording?: (levelBand: YkiLevelBand) => void;
  onOpenMockCycle?: () => void;
  onOpenResults?: () => void;
  onOpenCertificate?: () => void;
  initialLevelBand?: YkiLevelBand;
};

export default function YkiExamScreen({
  onExit,
  onOpenMenu,
  onOpenPractice,
  onOpenSpeakingConversation,
  onOpenSpeakingRecording,
  onOpenMockCycle,
  onOpenResults,
  onOpenCertificate,
  initialLevelBand = 'B1-B2',
}: Props) {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const [selectedLevel, setSelectedLevel] = useState<YkiLevelBand>(initialLevelBand);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<YkiExamOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => { setSelectedLevel(initialLevelBand); }, [initialLevelBand]);

  useEffect(() => {
    let cancelled = false;
    setLoadingOverview(true);
    void (async () => {
      try {
        const next = await getYkiExamOverview(selectedLevel);
        if (!cancelled) setOverview(next);
      } catch {
        if (!cancelled) setOverview(null);
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedLevel]);

  function handleOpenMockCycle() {
    if (onOpenMockCycle) {
      onOpenMockCycle();
      return;
    }
    router.push('/yki-exam/mock-cycle' as never);
  }

  async function handleStartExam() {
    setStarting(true);
    setError(null);
    try {
      await startExamSession(selectedLevel);
    } catch {
      // best-effort — navigate to runtime regardless; session tracking is non-blocking
    } finally {
      setStarting(false);
    }
    router.push('/yki-exam/runtime' as never);
  }

  return (
    <AppScaffold
      themeMode={themeMode}
      allowScroll={true}
      header={
        <PageHeader
          eyebrow="YKI Exam"
          title="Full YKI exam simulation for real outcomes"
          subtitle="Choose a level band and run the formal YKI flow. Use this route when you need exam-true practice that also supports work, citizenship, permanent residence, and long-term life in Finland."
          actionLabel="Home"
          onActionPress={onExit}
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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{selectedLevel} exam overview</Text>
        <Text style={styles.summaryBody}>
          {loadingOverview
            ? 'Loading certified YKI bank details…'
            : `${overview?.certified_total ?? overview?.total_tasks ?? 0} tasks in the certified bank · Authority: ${overview?.material_authority ?? 'engine_v3_2_certified'}`}
        </Text>
        <Text style={styles.summaryHint}>
          {overview?.exam_identity?.why ?? 'Use this route for the full exam-style run across the certified bank.'}
        </Text>
      </View>

      <View style={styles.sectionsCard}>
        <Text style={styles.sectionsTitle}>Exam coverage</Text>
        {(overview?.sections ?? []).map((section) => (
          <View key={section.key} style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              <Text style={styles.sectionMeta}>{section.task_count} tasks · about {section.recommended_minutes} min</Text>
            </View>
            <Text style={styles.sectionBadge}>{section.key.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        <TaskCard themeMode={themeMode} accent="blue" title={`Start ${selectedLevel} YKI exam`} detail="Open the full exam runtime for the selected level band." meta="Exam" actionLabel={starting ? 'Starting…' : 'Start'} onPress={() => void handleStartExam()} />
        <TaskCard themeMode={themeMode} accent="yellow" title="Mock cycle" detail="Open a preparation cycle for timing pressure, exam confidence, and readiness for work and life in Finland." meta="Preparation" actionLabel="Open" onPress={handleOpenMockCycle} />
        <TaskCard themeMode={themeMode} title="Recording speaking" detail="Open the recorded-speaking preparation surface for solo speaking." meta="Speaking" actionLabel="Open" onPress={() => onOpenSpeakingRecording?.(selectedLevel)} />
        <TaskCard themeMode={themeMode} title="Conversation speaking" detail="Open the conversation-speaking surface when you want more realistic communication practice." meta="Conversation" actionLabel="Open" onPress={() => onOpenSpeakingConversation?.(selectedLevel)} />
        <TaskCard themeMode={themeMode} title="Guided YKI practice" detail="Open the lighter practice surface when you want guided feedback before returning to the full YKI route." meta="Practice" actionLabel="Open" onPress={() => onOpenPractice?.(selectedLevel)} />
        {onOpenResults ? <TaskCard themeMode={themeMode} title="Results" detail="Review outcomes in one clean place." meta="After practice or mock" actionLabel="Open" onPress={onOpenResults} /> : null}
        {onOpenCertificate ? <TaskCard themeMode={themeMode} title="Certificate" detail="Open certification details only when they matter." meta="Reference" actionLabel="Open" onPress={onOpenCertificate} /> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable onPress={() => void handleStartExam()} disabled={starting} style={[styles.primaryButton, starting && styles.primaryButtonDisabled]}>
        {starting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Start {selectedLevel} exam now</Text>}
      </Pressable>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  levelPill: { minHeight: 38, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#101A30', borderWidth: 1, borderColor: '#223252' },
  activeLevelPill: { backgroundColor: '#2453D4' },
  levelText: { color: '#D6E2FF', fontSize: 12, fontWeight: '800' },
  activeLevelText: { color: '#FFFFFF' },
  summaryCard: { borderRadius: 20, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 8, backgroundColor: '#FFFFFF', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  summaryBody: { fontSize: 13, lineHeight: 20, color: '#374151' },
  summaryHint: { fontSize: 12, lineHeight: 18, color: '#5B6472' },
  sectionsCard: { borderRadius: 20, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 10, backgroundColor: '#FFFFFF', marginBottom: 12 },
  sectionsTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sectionMeta: { fontSize: 12, color: '#6B7280' },
  sectionBadge: { fontSize: 11, fontWeight: '800', color: '#2453D4', backgroundColor: '#EEF4FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  grid: { gap: 12 },
  primaryButton: { alignSelf: 'flex-start', minHeight: 40, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#2453D4', marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  errorText: { color: '#C03737', fontSize: 12, marginTop: 8 },
});
