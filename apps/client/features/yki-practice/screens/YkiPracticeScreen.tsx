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
import { useTranslator } from '../../i18n';
import { audioPlayer } from '../../exam/services/audioPlayer';

const LEVEL_BANDS: YkiLevelBand[] = ['A1-A2', 'B1-B2', 'C1-C2'];
const FOCUS_OPTIONS: Array<{ key: YkiPracticeFocus; labelKey: 'ykiPracticeFocusMixed' | 'ykiPracticeFocusReading' | 'ykiPracticeFocusListening' | 'ykiPracticeFocusWriting' | 'ykiPracticeFocusSpeaking' }> = [
  { key: 'mixed', labelKey: 'ykiPracticeFocusMixed' },
  { key: 'reading', labelKey: 'ykiPracticeFocusReading' },
  { key: 'listening', labelKey: 'ykiPracticeFocusListening' },
  { key: 'writing', labelKey: 'ykiPracticeFocusWriting' },
  { key: 'speaking', labelKey: 'ykiPracticeFocusSpeaking' },
];

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenExam: (levelBand?: YkiLevelBand) => void;
  onOpenPractice?: () => void;
  onOpenMockCycle?: () => void;
};

export default function YkiPracticeScreen({ onBack, onOpenMenu, onOpenExam, onOpenPractice, onOpenMockCycle }: Props) {
  // YKI_AUDIO_STOP_ON_EXIT_GUARD
  useEffect(() => {
    return () => {
      void audioPlayer.stopAsync();
    };
  }, []);


  useEffect(() => {
    return () => {
      void audioPlayer.stopAsync();
    };
  }, []);

  const { t } = useTranslator();
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
          setErrorMessage(error instanceof Error ? error.message : t('ykiPracticeOverviewLoadFailed'));
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
        setErrorMessage(t('ykiPracticeSessionEmpty'));
      }
    } catch (error) {
      setSession(null);
      setErrorMessage(error instanceof Error ? error.message : t('ykiPracticeStartFailed'));
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
    : [t('ykiPracticeFocusReading'), t('ykiPracticeFocusListening'), t('ykiPracticeFocusWriting'), t('ykiPracticeFocusSpeaking')].join(' • ');
  const counts = overview?.countsBySkill;
  const taskCounter = session ? `${currentIndex + 1}/${session.tasks.length}` : null;

  return (
    <AppScaffold
      themeMode={themeMode}
      allowScroll={true}
      header={
        <PageHeader
          eyebrow={t('ykiPracticeEyebrow')}
          title={t('ykiPracticeHeaderTitle')}
          subtitle={t('ykiPracticeHeaderSubtitle')}
          actionLabel={t('commonBack')}
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
            <Text style={[styles.focusText, selectedFocus === option.key && styles.activeFocusText]}>{t(option.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {onOpenPractice ? (
          <TaskCard
            themeMode={themeMode}
            title={t('ykiPracticeOverviewTitle')}
            detail={t('ykiPracticeOverviewDetail')}
            meta={t('ykiPracticeOverviewMeta')}
            actionLabel={t('commonOpen')}
            onPress={onOpenPractice}
          />
        ) : null}
        <TaskCard
          themeMode={themeMode}
          accent="blue"
          title={t('ykiPracticeGuidedPathwayTitle')}
          detail={overview?.nextTask ?? t('ykiPracticeGuidedPathwayDetail').replace('{level}', selectedLevel)}
          meta={loading ? t('commonLoading') : `${overview?.dailyPractice?.minutes ?? 15} ${t('ykiPracticeMinutesShortLabel')}`}
          actionLabel={starting ? t('ykiPracticeStarting') : t('ykiPracticeStart')}
          onPress={() => void handleStartPractice()}
        />
        <TaskCard
          themeMode={themeMode}
          accent="yellow"
          title={t('ykiPracticeMockCycleTitle')}
          detail={t('ykiPracticeMockCycleDetail')}
          meta={t('ykiPracticeMockCycleMeta')}
          actionLabel={t('commonOpen')}
          onPress={handleOpenMockCycle}
        />
        <TaskCard
          themeMode={themeMode}
          title={t('ykiPracticeFullExamTitle')}
          detail={t('ykiPracticeFullExamDetail').replace('{level}', selectedLevel)}
          meta={t('ykiPracticeExamMeta')}
          actionLabel={t('commonOpen')}
          onPress={() => onOpenExam(selectedLevel)}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('ykiPracticeFindLaterTitle')}</Text>
        <Text style={styles.infoText}>{t('ykiPracticeFindLaterBody')}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('ykiPracticeBankCoverageTitle').replace('{level}', selectedLevel)}</Text>
        <Text style={styles.infoText}>
          {loading
            ? t('ykiPracticeLoadingBankOverview')
            : `${overview?.total_tasks ?? 0} ${t('ykiPracticeTasksAvailable')} · ${t('ykiPracticeRecommendedFocus')} ${overview?.nextFocus ?? t('ykiPracticeFocusMixed')} · ${t('ykiPracticeSectionsLabel')}: ${recommendedSections}`}
        </Text>
        {counts ? (
          <View style={styles.metricsRow}>
            <Text style={styles.metric}>{t('ykiPracticeFocusReading')} {counts.reading}</Text>
            <Text style={styles.metric}>{t('ykiPracticeFocusListening')} {counts.listening}</Text>
            <Text style={styles.metric}>{t('ykiPracticeFocusWriting')} {counts.writing}</Text>
            <Text style={styles.metric}>{t('ykiPracticeFocusSpeaking')} {counts.speaking}</Text>
          </View>
        ) : null}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {currentTask ? (
        <View style={styles.practiceCard}>
          <Text style={styles.practiceEyebrow}>{t('ykiPracticeGuidedPracticeLabel')} · {session?.display_level_band} · {taskCounter}</Text>
          <Text style={styles.practiceTitle}>{currentTask.title}</Text>
          <Text style={styles.practicePrompt}>{currentTask.prompt}</Text>
          <Text style={styles.practiceGuidance}>{currentTask.guidance}</Text>
          <Text style={styles.debugText}>{t('ykiPracticeTaskIdLabel')}: {currentTask.task_id}</Text>
          <View style={styles.practiceActions}>
            <Pressable
              onPress={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              style={[styles.secondaryButton, currentIndex === 0 && styles.secondaryButtonDisabled]}
              disabled={currentIndex === 0}
            >
              <Text style={styles.secondaryButtonText}>{t('ykiPracticePrevious')}</Text>
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
              <Text style={styles.primaryButtonText}>{currentIndex >= (session?.tasks.length ?? 1) - 1 ? t('ykiPracticeFinishBlock') : t('ykiPracticeNextTask')}</Text>
            </Pressable>
          </View>
        </View>
      ) : session && !starting ? (
        <View style={styles.practiceCard}>
          <Text style={styles.practiceEyebrow}>{t('ykiPracticeSessionTitle')}</Text>
          <Text style={styles.practiceTitle}>{t('ykiPracticeNoVisibleTask')}</Text>
          <Text style={styles.practiceGuidance}>{t('ykiPracticeSessionIdLabel')}: {session.session_id}</Text>
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
