import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FeatureScaffold, Card, MetricRow, ActionBar } from '../../shared/FeatureScaffold';
import { EmptyState } from '../../shared/EmptyState';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useYkiPlanner } from '../hooks/useYkiPlanner';

export default function YkiPlannerScreen() {
  const { summary, loading, error, refresh } = useYkiPlanner();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);

  const hasData = !!summary && summary.milestones.length > 0;

  const nextMilestone = useMemo(() => {
    if (!hasData || !summary) return null;
    const incomplete = summary.milestones.find((m) => {
      const status = (m.status || '').toLowerCase();
      return !status.includes('complete') && !status.includes('done');
    });
    return incomplete ?? summary.milestones[0];
  }, [hasData, summary]);

  const actions = hasData ? (
    <ActionBar
      themeMode={themeMode}
      buttons={[
        {
          label: nextMilestone ? `Work on: ${nextMilestone.title}` : 'Start YKI practice',
          hint: nextMilestone?.week ?? undefined,
          onPress: () => router.push('/yki-practice' as never),
        },
        {
          label: 'Mock exam',
          variant: 'secondary',
          onPress: () => router.push('/yki-exam' as never),
        },
      ]}
    />
  ) : null;

  return (
    <FeatureScaffold
      title="YKI Planner"
      subtitle="Turn long preparation into a clear sequence of milestones, next-best actions, and weekly focus areas so study remains deliberate and sustainable."
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      themeMode={themeMode}
      actions={actions}
    >
      {!loading && !error && !hasData ? (
        <EmptyState
          icon="📅"
          title="No plan yet"
          description="Start a YKI practice session and we'll build your milestones, weekly focus, and next-best actions around real progress."
          actionLabel="Start YKI practice"
          onAction={() => router.push('/yki-practice' as never)}
          themeMode={themeMode}
        />
      ) : null}

      {summary && hasData ? (
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <MetricRow label="Target level" value={summary.targetLevel} themeMode={themeMode} />
          <MetricRow label="Weekly focus" value={summary.weeklyFocus} themeMode={themeMode} />
          <Text style={[styles.text, { color: palette.textMuted }]}>{summary.nextBestAction}</Text>
        </View>
      ) : null}

      {summary?.milestones.map((milestone) => (
        <Card key={milestone.id} themeMode={themeMode} title={milestone.title} body={milestone.week} meta={milestone.status} />
      ))}
    </FeatureScaffold>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  text: {
    marginTop: 8,
    lineHeight: 22,
  },
});
