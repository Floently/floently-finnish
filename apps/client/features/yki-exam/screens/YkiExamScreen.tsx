import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { getYkiExamOverview, type YkiExamOverview, type YkiLevelBand } from '@core/api/ykiExam';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { startExamSession } from '../services/ykiExamService';
import { useTranslator } from '../../i18n';

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
  const { t } = useTranslator();
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
          eyebrow={t('ykiExamEyebrow')}
          title={t('ykiExamHeaderTitle')}
          subtitle={t('ykiExamHeaderSubtitle')}
          actionLabel={t('commonBack')}
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
        <Text style={styles.summaryTitle}>{t('ykiExamOverviewTitle')}</Text>
        <Text style={styles.summaryBody}>
          {loadingOverview
            ? t('ykiExamLoadingOverview')
            : `${overview?.certified_total ?? overview?.total_tasks ?? 0} ${t('ykiExamTasksInCertifiedBank')} · ${t('ykiExamAuthorityLabel')}: ${overview?.material_authority ?? 'engine_v3_2_certified'}`}
        </Text>
        <Text style={styles.summaryHint}>
          {overview?.exam_identity?.why ?? t('ykiExamOverviewFallback')}
        </Text>
      </View>

      <View style={styles.sectionsCard}>
        <Text style={styles.sectionsTitle}>{t('ykiExamCoverageTitle')}</Text>
        {(overview?.sections ?? []).map((section) => (
          <View key={section.key} style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              <Text style={styles.sectionMeta}>{section.task_count} {t('ykiExamSectionTasksLabel')} · {t('ykiExamAboutPrefix')} {section.recommended_minutes} {t('ykiExamMinutesShortLabel')}</Text>
            </View>
            <Text style={styles.sectionBadge}>{section.key.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        <TaskCard themeMode={themeMode} accent="blue" title={t('ykiExamStartNow').replace('{level}', selectedLevel)} detail={t('ykiExamRuntimeDetail')} meta={t('ykiExamRuntimeMeta')} actionLabel={starting ? t('ykiExamStarting') : t('ykiExamStartLabel')} onPress={() => void handleStartExam()} />
        <TaskCard themeMode={themeMode} accent="yellow" title={t('ykiExamMockTitle')} detail={t('ykiExamMockDetail')} meta={t('ykiExamMockMeta')} actionLabel={t('commonOpen')} onPress={handleOpenMockCycle} />
        <TaskCard themeMode={themeMode} title={t('ykiExamRecordingTitle')} detail={t('ykiExamRecordingDetail')} meta={t('ykiExamRecordingMeta')} actionLabel={t('commonOpen')} onPress={() => onOpenSpeakingRecording?.(selectedLevel)} />
        <TaskCard themeMode={themeMode} title={t('ykiExamConversationTitle')} detail={t('ykiExamConversationDetail')} meta={t('ykiExamConversationMeta')} actionLabel={t('commonOpen')} onPress={() => onOpenSpeakingConversation?.(selectedLevel)} />
        <TaskCard themeMode={themeMode} title={t('ykiExamGuidedTitle')} detail={t('ykiExamGuidedDetail')} meta={t('ykiExamGuidedMeta')} actionLabel={t('commonOpen')} onPress={() => onOpenPractice?.(selectedLevel)} />
        {onOpenResults ? <TaskCard themeMode={themeMode} title={t('ykiExamResultsTitle')} detail={t('ykiExamResultsDetail')} meta={t('ykiExamResultsMeta')} actionLabel={t('commonOpen')} onPress={onOpenResults} /> : null}
        {onOpenCertificate ? <TaskCard themeMode={themeMode} title={t('ykiExamCertificateTitle')} detail={t('ykiExamCertificateDetail')} meta={t('ykiExamCertificateMeta')} actionLabel={t('commonOpen')} onPress={onOpenCertificate} /> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable onPress={() => void handleStartExam()} disabled={starting} style={[styles.primaryButton, starting && styles.primaryButtonDisabled]}>
        {starting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t('ykiExamStartNow').replace('{level}', selectedLevel)}</Text>}
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
