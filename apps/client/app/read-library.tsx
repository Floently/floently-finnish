import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listReadProjects, type ReadProject } from '@core/api/read';
import { useAuthStore } from '../state/authStore';

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ReadLibraryScreen() {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const [projects, setProjects] = useState<ReadProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);
  useEffect(() => {
    if (hasHydrated && !token) router.replace('/read-login' as never);
  }, [hasHydrated, token]);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!token) return;
    if (mode === 'refresh') setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      setProjects(await listReadProjects(token, 100));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load your Read library.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void load('initial'); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.topCopy}><Text style={styles.kicker}>FLOENTLY READ</Text><Text style={styles.topTitle}>Library</Text></View>
        <Pressable onPress={() => router.push('/read-upload' as never)} style={styles.addButton}><Text style={styles.addText}>＋</Text></Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} tintColor="#7187FF" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Saved reading</Text>
          <Text style={styles.introBody}>Documents you upload or paste into Read stay available here.</Text>
        </View>

        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load('initial')}><Text style={styles.retry}>Try again</Text></Pressable></View> : null}
        {loading ? <ActivityIndicator color="#7187FF" style={{ marginTop: 34 }} /> : null}
        {!loading && !error && projects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>＋</Text>
            <Text style={styles.emptyTitle}>Your library is empty</Text>
            <Text style={styles.emptyBody}>Upload a file or paste text to create your first saved reading.</Text>
            <Pressable onPress={() => router.push('/read-upload' as never)} style={styles.primaryButton}><Text style={styles.primaryText}>Add content</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {projects.map((project) => {
            const pct = Math.max(0, Math.min(100, Math.round(project.progress?.progressPercent ?? 0)));
            return (
              <Pressable key={project.id} onPress={() => router.push({ pathname: '/read-document', params: { id: project.id } } as never)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.typeBadge}><Text style={styles.typeText}>{project.sourceType.toUpperCase().slice(0, 4)}</Text></View>
                <View style={styles.rowCopy}>
                  <Text numberOfLines={2} style={styles.rowTitle}>{project.title}</Text>
                  <Text style={styles.rowMeta}>{project.wordCount ? `${project.wordCount.toLocaleString()} words` : `${project.characterCount.toLocaleString()} characters`}{project.updatedAt ? ` · ${formatDate(project.updatedAt)}` : ''}</Text>
                  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
                </View>
                <View style={styles.rowEnd}><Text style={styles.progressText}>{pct}%</Text><Text style={styles.chevron}>›</Text></View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060B15' },
  topBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#182437' },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#111B2B', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 30, lineHeight: 32 },
  topCopy: { flex: 1 },
  kicker: { color: '#7187FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  topTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 2 },
  addButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#5364FF', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#FFFFFF', fontSize: 22, lineHeight: 24, fontWeight: '500' },
  content: { padding: 18, paddingBottom: 42 },
  intro: { marginBottom: 17 },
  introTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  introBody: { color: '#7F8DA2', fontSize: 12.5, lineHeight: 19, marginTop: 5 },
  list: { gap: 9 },
  row: { minHeight: 88, borderRadius: 21, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0D1625', borderWidth: 1, borderColor: '#19283D' },
  typeBadge: { width: 50, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17243A' },
  typeText: { color: '#8094FF', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  rowCopy: { flex: 1 },
  rowTitle: { color: '#F7F9FF', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  rowMeta: { color: '#728096', fontSize: 10.5, marginTop: 4 },
  progressTrack: { height: 3, borderRadius: 999, overflow: 'hidden', backgroundColor: '#1E2A3D', marginTop: 9 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#6F83FF' },
  rowEnd: { alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 50 },
  progressText: { color: '#7187FF', fontSize: 10, fontWeight: '900' },
  chevron: { color: '#6E7B91', fontSize: 25, lineHeight: 26 },
  pressed: { opacity: 0.72 },
  emptyCard: { marginTop: 22, borderRadius: 25, backgroundColor: '#0D1625', borderWidth: 1, borderColor: '#19283D', alignItems: 'center', padding: 28 },
  emptyIcon: { color: '#7187FF', fontSize: 31, marginBottom: 8 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  emptyBody: { color: '#7F8DA2', fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 17 },
  primaryButton: { minHeight: 44, borderRadius: 14, backgroundColor: '#5364FF', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  errorCard: { borderRadius: 18, backgroundColor: '#2A131B', borderWidth: 1, borderColor: '#542432', padding: 15, marginBottom: 14 },
  errorText: { color: '#FF9AAA', fontSize: 12, lineHeight: 18 },
  retry: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 8 },
});
