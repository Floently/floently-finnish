import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { FeatureScaffold, Card, MetricRow, ActionBar } from '../../shared/FeatureScaffold';
import { EmptyState } from '../../shared/EmptyState';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useConfidenceTracker } from '../hooks/useConfidenceTracker';

export default function ConfidenceTrackerScreen() {
  const { summary, loading, error, refresh } = useConfidenceTracker();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);

  const hasData = !!summary && summary.entries.length > 0;

  const weakestCalibrationSkill = useMemo(() => {
    if (!hasData || !summary) return null;
    const overconfident = summary.entries.filter((e) => e.confidence > e.accuracy);
    if (!overconfident.length) return null;
    return overconfident.reduce((worst, cur) =>
      cur.confidence - cur.accuracy > worst.confidence - worst.accuracy ? cur : worst,
    );
  }, [hasData, summary]);

  const actions = hasData ? (
    <ActionBar
      themeMode={themeMode}
      buttons={
        weakestCalibrationSkill
          ? [
              {
                label: `Practice ${weakestCalibrationSkill.skill}`,
                hint: `Confidence ${weakestCalibrationSkill.confidence}% vs accuracy ${weakestCalibrationSkill.accuracy}%`,
                onPress: () => router.push('/speaking' as never),
              },
              {
                label: 'General practice',
                variant: 'secondary',
                onPress: () => router.push('/speaking' as never),
              },
            ]
          : [
              {
                label: 'Start a practice session',
                onPress: () => router.push('/speaking' as never),
              },
            ]
      }
    />
  ) : null;

  return (
    <FeatureScaffold
      title="Confidence Tracker"
      subtitle="Separate hesitation from real skill gaps so you spend practice time on the right problem: accuracy, fluency, or confidence calibration."
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      themeMode={themeMode}
      actions={actions}
    >
      {!loading && !error && !hasData ? (
        <EmptyState
          icon="📊"
          title="No confidence data yet"
          description="Once you've done a few practice sessions, we'll show you where your confidence matches your actual accuracy — and where to focus."
          actionLabel="Start a practice session"
          onAction={() => router.push('/speaking' as never)}
          themeMode={themeMode}
        />
      ) : null}

      {summary && hasData ? (
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <MetricRow label="Calibration score" value={`${summary.calibrationScore}%`} themeMode={themeMode} />
          <MetricRow label="Overconfidence" value={`${summary.overconfidenceRate}%`} themeMode={themeMode} />
          <MetricRow label="Underconfidence" value={`${summary.underconfidenceRate}%`} themeMode={themeMode} />
          <Text style={[styles.tip, { color: palette.text }]}>{summary.nextAction}</Text>
        </View>
      ) : null}

      {summary?.entries.map((entry) => (
        <Card
          key={entry.id}
          themeMode={themeMode}
          title={entry.skill}
          body={`Confidence: ${entry.confidence}%\nAccuracy: ${entry.accuracy}%\n\n${entry.note}`}
          meta={entry.confidence > entry.accuracy ? 'Confidence is running ahead of performance' : 'Performance is stronger than prediction'}
        />
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
  tip: {
    marginTop: 8,
    lineHeight: 22,
  },
});
