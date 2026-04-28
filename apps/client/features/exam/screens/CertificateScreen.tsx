import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type Props = {
  level?: string;
  score?: number;
  date?: string;
};

export default function CertificateScreen({ level, score, date }: Props) {
  const hasCertificateData = level !== undefined || score !== undefined || Boolean(date);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Certificate</Text>
        {hasCertificateData ? (
          <View style={styles.certificateCard}>
            <Text style={styles.cardTitle}>YKI Certificate</Text>
            <Text style={styles.levelValue}>{level ?? 'Pending'}</Text>
            {score !== undefined ? <Text style={styles.cardBody}>Score: {score}</Text> : null}
            {date ? <Text style={styles.metaText}>Issued: {date}</Text> : null}
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certificate route is reachable</Text>
          <Text style={styles.cardBody}>This screen stays available so certificate access never becomes a dead end. When a verified exam session exists, the issued certificate should render here.</Text>
        </View>
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
  certificateCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 6, alignItems: 'center' },
  levelValue: { fontSize: 42, fontWeight: '900', color: '#2453D4' },
  metaText: { fontSize: 13, color: '#6B7280' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardBody: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
});
