import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getMockExamCycle, pressureLabel, type MockExamCycleState } from '@core/api/ykiExam';

export default function MockExamCycleScreen() {
  const [data, setData] = useState<MockExamCycleState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await getMockExamCycle();
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load mock cycle.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mock exam cycle</Text>
        <Text style={styles.subtitle}>Review the weekly pressure plan before you start timed exam work.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {data ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.metric}>Readiness: {data.readiness_score}%</Text>
              <Text style={styles.metric}>Pressure: {pressureLabel(data.overall_pressure)}</Text>
            </View>
            {data.segments.map((segment) => (
              <View key={segment.week_index} style={styles.card}>
                <Text style={styles.cardTitle}>Week {segment.week_index}</Text>
                <Text style={styles.cardBody}>{segment.focus}</Text>
                <Text style={styles.cardMeta}>{pressureLabel(segment.pressure_band)} • {segment.timed_minutes} min</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FBFF' },
  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FBFF' },
  backButton: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#E8F0FF' },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#2453D4' },
  container: { padding: 20, gap: 12, backgroundColor: '#F8FBFF' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
  error: { fontSize: 13, color: '#B42318' },
  panel: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 6 },
  metric: { fontSize: 14, fontWeight: '700', color: '#2453D4' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardBody: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
  cardMeta: { fontSize: 12, fontWeight: '700', color: '#2453D4' },
});
