import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { loadExamResults, type StoredExamResults } from '../state/examResultsPersistence';

export default function ResultsOverviewScreen() {
  const [results, setResults] = useState<StoredExamResults | null>(null);

  useEffect(() => {
    void (async () => {
      setResults(await loadExamResults());
    })();
  }, []);

  const exportText = useMemo(() => {
    if (!results) return '';
    const lines = [
      `YKI Result`,
      `Completed: ${results.completedAt}`,
      `Level: ${results.levelBand}`,
      `Total tasks: ${results.totalTasks}`,
      `Objective correct: ${results.objectiveCorrect}/${results.objectiveTasks}`,
      '',
      'Section breakdown:',
      ...results.sectionBreakdown.map((section) =>
        `${section.sectionTitle}: ${section.objectiveCorrect}/${section.objectiveTasks} objective correct, ${section.totalTasks} tasks total`,
      ),
    ];
    return lines.join('\n');
  }, [results]);

  async function handleExport() {
    if (!exportText) return;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yki-results-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    await Share.share({ message: exportText, title: 'YKI results' });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Results overview</Text>
        {results ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{results.levelBand} exam summary</Text>
              <Text style={styles.cardBody}>Objective score: {results.objectiveCorrect} / {results.objectiveTasks}</Text>
              <Text style={styles.cardBody}>Incorrect objective answers: {results.objectiveIncorrect}</Text>
              <Text style={styles.cardBody}>Total tasks completed: {results.totalTasks}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Section breakdown</Text>
              {results.sectionBreakdown.map((section) => (
                <Text key={section.sectionTitle} style={styles.cardBody}>
                  {section.sectionTitle}: {section.objectiveCorrect}/{section.objectiveTasks} objective correct
                </Text>
              ))}
            </View>
            <Pressable onPress={() => void handleExport()} style={styles.exportButton}>
              <Text style={styles.exportButtonText}>Download / Share result</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No completed exam result</Text>
            <Text style={styles.cardBody}>Finish a YKI exam run first, then the final result will appear here.</Text>
          </View>
        )}
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardBody: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
  exportButton: { alignSelf: 'flex-start', minHeight: 42, borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: '#2453D4' },
  exportButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
