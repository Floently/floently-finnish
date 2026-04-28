import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { resolveProfessionalDisplayName } from '@core/api/entitlements';

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
      : 'Your profession';

    return [
      {
        title: 'YKI progress',
        percent: clampPercent(hasYki ? (subscriptionStatus?.plan.category === 'bundle' ? 74 : 68) : 18),
        summary: hasYki ? 'Track exam readiness and section confidence instead of only counting sessions.' : 'Unlock YKI Prep to measure formal exam readiness here.',
        routeLabel: 'Open YKI Prep',
      },
      {
        title: 'Workplace communication',
        percent: clampPercent(hasLearn ? (hasProfessional ? 71 : 56) : 20),
        summary: hasProfessional ? `Scenario fluency, instructions, and repair language for ${professionLabel.toLowerCase()}.` : 'Use workplace scenarios to turn vocabulary into real work communication.',
        routeLabel: 'Open workplace scenarios',
      },
      {
        title: 'Profession vocabulary',
        percent: clampPercent(hasProfessional ? 76 : 24),
        summary: hasProfessional ? `Monitor how ready you are for ${professionLabel.toLowerCase()} vocabulary and interview language.` : 'Choose a profession plan to make this pillar trackable.',
        routeLabel: 'Open vocabulary',
      },
    ];
  }, [activeContext, subscriptionStatus?.entitlements, subscriptionStatus?.plan.category]);

  const readinessScore = Math.round(pillars.reduce((sum, pillar) => sum + pillar.percent, 0) / pillars.length);
  const readinessLabel = readinessScore >= 75 ? 'Work-ready momentum' : readinessScore >= 55 ? 'Building readiness' : 'Early pathway stage';

  return (
    <AppScaffold
      themeMode={themeMode}
      header={
        <PageHeader
          themeMode={themeMode}
          eyebrow="Readiness"
          title="Progress"
          subtitle="Track exam readiness, workplace communication, and profession vocabulary in one view."
          actionLabel="Home"
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.summaryLabel, { color: palette.primary }]}>Overall readiness</Text>
        <Text style={[styles.summaryTitle, { color: palette.text }]}>{readinessScore}% · {readinessLabel}</Text>
        <Text style={[styles.summaryBody, { color: palette.textMuted }]}>Use this page to decide the next useful action. The goal is not to admire a dashboard — it is to remove the next barrier between language learning and working life in Finland.</Text>
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
        <TaskCard themeMode={themeMode} title="Strengthen vocabulary and roleplay" detail="Use learning tools when retrieval, recall, or phrase flexibility starts to weaken." meta="Vocabulary & roleplay" actionLabel="Open" onPress={onOpenLearning} />
        <TaskCard themeMode={themeMode} title="Practise workplace scenarios" detail="Use scenario practice when hesitation grows in spoken work situations, handovers, or issue reporting." meta="Workplace scenarios" actionLabel="Open" onPress={onOpenSpeaking} />
        <TaskCard themeMode={themeMode} accent="yellow" title="Check YKI readiness" detail="Go back to YKI Prep when you need section-based repair or formal exam confidence." meta="YKI Prep" actionLabel="Open" onPress={onOpenYki} />
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
