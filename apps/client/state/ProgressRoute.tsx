import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { resolveProfessionalDisplayName } from '@core/api/entitlements';

import { useTranslator } from '../features/i18n';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';

type Props = {
  onBack: () => void;
  onOpenLearning: () => void;
  onOpenSpeaking: () => void;
  onOpenYki: () => void;
  onOpenMenu: () => void;
};

type ReadinessPillar = {
  title: string;
  percent: number;
  summary: string;
  routeLabel: string;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function ProgressRoute({ onBack, onOpenLearning, onOpenSpeaking, onOpenYki, onOpenMenu }: Props) {
  const { t } = useTranslator();
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const activeContext = useSubscriptionStore((state) => state.activeContext);
  const palette = getFloentlyPalette(themeMode);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const pillars = useMemo<ReadinessPillar[]>(() => {
    const entitlements = subscriptionStatus?.entitlements;
    const hasYki = Boolean(entitlements?.ykiAccess);
    const hasProfessional = Boolean(entitlements?.professionalAccess);
    const hasLearn = Boolean(entitlements?.learnAccess);
    const professionLabel = activeContext === 'doctor' || activeContext === 'nurse' || activeContext === 'practical_nurse'
      ? resolveProfessionalDisplayName(activeContext)
      : t('progressYourProfession');

    return [
      {
        title: t('progressYkiProgressTitle'),
        percent: clampPercent(hasYki ? (subscriptionStatus?.plan.category === 'bundle' ? 74 : 68) : 18),
        summary: hasYki ? t('progressYkiProgressSummaryActive') : t('progressYkiProgressSummaryLocked'),
        routeLabel: t('progressOpenYkiPrep'),
      },
      {
        title: t('progressWorkplaceCommunicationTitle'),
        percent: clampPercent(hasLearn ? (hasProfessional ? 71 : 56) : 20),
        summary: hasProfessional
          ? t('progressWorkplaceCommunicationSummaryActive').replace('{profession}', professionLabel.toLowerCase())
          : t('progressWorkplaceCommunicationSummaryLocked'),
        routeLabel: t('progressOpenWorkplaceScenarios'),
      },
      {
        title: t('progressProfessionVocabularyTitle'),
        percent: clampPercent(hasProfessional ? 76 : 24),
        summary: hasProfessional
          ? t('progressProfessionVocabularySummaryActive').replace('{profession}', professionLabel.toLowerCase())
          : t('progressProfessionVocabularySummaryLocked'),
        routeLabel: t('progressOpenVocabulary'),
      },
    ];
  }, [activeContext, subscriptionStatus?.entitlements, subscriptionStatus?.plan.category, t]);

  const readinessScore = Math.round(pillars.reduce((sum, pillar) => sum + pillar.percent, 0) / pillars.length);
  const readinessLabel = readinessScore >= 75
    ? t('progressWorkReadyMomentum')
    : readinessScore >= 55
      ? t('progressBuildingReadiness')
      : t('progressEarlyPathwayStage');

  return (
    <AppScaffold
      themeMode={themeMode}
      header={
          <PageHeader
          themeMode={themeMode}
          eyebrow={t('progressEyebrow')}
          title={t('progressTitle')}
          subtitle={t('progressSubtitle')}
          actionLabel={t('commonBack')}
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.summaryLabel, { color: palette.primary }]}>{t('progressOverallReadiness')}</Text>
        <Text style={[styles.summaryTitle, { color: palette.text }]}>{readinessScore}% · {readinessLabel}</Text>
        <Text style={[styles.summaryBody, { color: palette.textMuted }]}>{t('progressSummaryBody')}</Text>
      </View>

      <View style={styles.pillarStack}>
        {pillars.map((pillar) => (
          <View key={pillar.title} style={[styles.pillarCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}> 
            <View style={styles.pillarHeader}>
              <Text style={[styles.pillarTitle, { color: palette.text }]}>{pillar.title}</Text>
              <Text style={[styles.pillarPercent, { color: palette.primary }]}>{pillar.percent}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: palette.surface }]}> 
              <View style={[styles.progressFill, { width: `${pillar.percent}%`, backgroundColor: palette.primary }]} />
            </View>
            <Text style={[styles.pillarBody, { color: palette.textMuted }]}>{pillar.summary}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stack}>
        <TaskCard themeMode={themeMode} title={t('progressStrengthenVocabularyAndRoleplay')} detail={t('progressStrengthenVocabularyAndRoleplayDetail')} meta={t('homeVocabularyRoleplay')} actionLabel={t('commonOpen')} onPress={onOpenLearning} />
        <TaskCard themeMode={themeMode} title={t('progressPracticeWorkplaceScenarios')} detail={t('progressPracticeWorkplaceScenariosDetail')} meta={t('homeWorkplaceScenarios')} actionLabel={t('commonOpen')} onPress={onOpenSpeaking} />
        <TaskCard themeMode={themeMode} accent="yellow" title={t('progressCheckYkiReadiness')} detail={t('progressCheckYkiReadinessDetail')} meta={t('homeYkiPrep')} actionLabel={t('commonOpen')} onPress={onOpenYki} />
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  summaryCard: { borderRadius: 24, padding: 18, gap: 8, borderWidth: 1 },
  summaryLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  summaryTitle: { fontSize: 22, fontWeight: '800' },
  summaryBody: { fontSize: 14, lineHeight: 20 },
  pillarStack: { gap: 12 },
  pillarCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  pillarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillarTitle: { fontSize: 16, fontWeight: '800' },
  pillarPercent: { fontSize: 16, fontWeight: '800' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  pillarBody: { fontSize: 13, lineHeight: 19 },
  stack: { gap: 12 },
});
