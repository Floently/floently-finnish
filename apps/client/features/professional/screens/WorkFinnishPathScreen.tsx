import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { FeatureScaffold, Card, MetricRow } from '../../shared/FeatureScaffold';
import { useWorkFinnishPath } from '../hooks/useWorkFinnishPath';

export default function WorkFinnishPathScreen() {
  const { summary, loading, error, refresh } = useWorkFinnishPath();

  return (
    <FeatureScaffold
      title="Work Finnish Path"
      subtitle="Follow a profession-aware path where each mission strengthens Finnish you can actually use at work, in services, and in everyday life in Finland — not isolated textbook fragments."
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
    >
      {summary ? (
        <View style={styles.panel}>
          <MetricRow label="Track" value={summary.track} />
          <Text style={styles.text}>{summary.nextMission}</Text>
        </View>
      ) : null}

      {summary?.missions.map((mission) => (
        <Card key={mission.id} title={mission.title} body={mission.focus} meta={mission.status} />
      ))}
    </FeatureScaffold>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  text: {
    lineHeight: 22,
    color: '#374151',
  },
});
