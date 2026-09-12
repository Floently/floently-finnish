import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listReadProjects, type ReadProject } from '@core/api/read';
import { useAuthStore } from '../state/authStore';

const LOGO = require('../components/public/logo.png');

function FeatureCard(props: { symbol: string; title: string; body: string; accent?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.featureCard, props.accent && styles.featureCardAccent, pressed && styles.pressed]}>
      <View style={[styles.featureIcon, props.accent && styles.featureIconAccent]}><Text style={styles.featureSymbol}>{props.symbol}</Text></View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{props.title}</Text>
        <Text style={styles.featureBody}>{props.body}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function ReadHomeScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const logout = useAuthStore((state) => state.logout);
  const [recent, setRecent] = useState<ReadProject[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);

  useEffect(() => {
    if (!token) {
      setRecent([]);
      return;
    }
    let cancelled = false;
    setLoadingRecent(true);
    void listReadProjects(token, 4)
      .then((projects) => { if (!cancelled) setRecent(projects); })
      .catch(() => { if (!cancelled) setRecent([]); })
      .finally(() => { if (!cancelled) setLoadingRecent(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (!hasHydrated) {
    return <SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color="#6F83FF" /></View></SafeAreaView>;
  }

  if (!user || !token) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.publicContent} showsVerticalScrollIndicator={false}>
          <View style={styles.publicNav}>
            <Pressable onPress={() => router.replace('/' as never)} style={styles.backButton}><Text style={styles.backText}>‹ Floently</Text></Pressable>
            <View style={styles.readBadge}><Text style={styles.readBadgeText}>READ</Text></View>
          </View>
          <View style={styles.publicHero}>
            <View style={styles.glow} />
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.eyebrow}>FLOENTLY READ</Text>
            <Text style={styles.publicTitle}>Your reading workspace, not just a browser.</Text>
            <Text style={styles.publicSubtitle}>Sign in to open websites, upload documents, keep a Read library, and listen with Floently voices across your study material.</Text>
            <Pressable onPress={() => router.push('/read-login' as never)} style={styles.signInButton}><Text style={styles.signInText}>Sign in to Floently Read</Text><Text style={styles.signInArrow}>→</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandKicker}>FLOENTLY READ</Text>
            <Text style={styles.greeting}>What do you want to read?</Text>
          </View>
          <Pressable onPress={() => router.replace('/' as never)} style={styles.suiteButton}><Text style={styles.suiteButtonText}>F</Text></Pressable>
        </View>

        <View style={styles.accountStrip}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || user.email || 'F').slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.accountCopy}>
            <Text numberOfLines={1} style={styles.accountName}>{user.name || 'Floently reader'}</Text>
            <Text numberOfLines={1} style={styles.accountEmail}>{user.email}</Text>
          </View>
          <Pressable onPress={() => void logout()} style={styles.logoutButton}><Text style={styles.logoutText}>Sign out</Text></Pressable>
        </View>

        <Text style={styles.sectionLabel}>START READING</Text>
        <View style={styles.features}>
          <FeatureCard accent symbol="↗" title="Website" body="Open Udacity or another live website and keep Read controls around the real page." onPress={() => router.push('/read' as never)} />
          <FeatureCard symbol="＋" title="Upload" body="Import PDF, DOCX, EPUB, Markdown, HTML, or text from this iPhone." onPress={() => router.push('/read-upload' as never)} />
          <FeatureCard symbol="▤" title="Library" body="Open documents you already saved and continue reading them." onPress={() => router.push('/read-library' as never)} />
        </View>

        <View style={styles.recentHeader}>
          <View><Text style={styles.sectionLabel}>RECENT</Text><Text style={styles.sectionTitle}>Your Read library</Text></View>
          <Pressable onPress={() => router.push('/read-library' as never)}><Text style={styles.seeAll}>See all</Text></Pressable>
        </View>

        <View style={styles.recentPanel}>
          {loadingRecent ? <ActivityIndicator color="#6F83FF" style={{ marginVertical: 20 }} /> : null}
          {!loadingRecent && recent.length === 0 ? (
            <View style={styles.emptyRecent}>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptyBody}>Upload a document or paste text and it will appear here.</Text>
              <Pressable onPress={() => router.push('/read-upload' as never)} style={styles.compactButton}><Text style={styles.compactButtonText}>Add content</Text></Pressable>
            </View>
          ) : null}
          {recent.map((project, index) => (
            <Pressable
              key={project.id}
              onPress={() => router.push({ pathname: '/read-document', params: { id: project.id } } as never)}
              style={[styles.recentRow, index > 0 && styles.recentDivider]}
            >
              <View style={styles.docIcon}><Text style={styles.docIconText}>{project.sourceType === 'pdf' ? 'PDF' : 'TXT'}</Text></View>
              <View style={styles.recentCopy}>
                <Text numberOfLines={1} style={styles.recentTitle}>{project.title}</Text>
                <Text style={styles.recentMeta}>{project.wordCount ? `${project.wordCount.toLocaleString()} words` : 'Saved document'}{project.progress?.progressPercent ? ` · ${Math.round(project.progress.progressPercent)}%` : ''}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060B15' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 42, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 70 },
  brandKicker: { color: '#7187FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  greeting: { color: '#FFFFFF', fontSize: 27, lineHeight: 31, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  suiteButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#5364FF', alignItems: 'center', justifyContent: 'center' },
  suiteButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  accountStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 18, backgroundColor: '#0E1726', borderWidth: 1, borderColor: '#1B2A40' },
  avatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B2B52' },
  avatarText: { color: '#8EA0FF', fontSize: 16, fontWeight: '900' },
  accountCopy: { flex: 1 },
  accountName: { color: '#F6F8FF', fontSize: 13, fontWeight: '800' },
  accountEmail: { color: '#77859B', fontSize: 11, marginTop: 2 },
  logoutButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 10 },
  logoutText: { color: '#9AA8BA', fontSize: 11, fontWeight: '800' },
  sectionLabel: { color: '#7187FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  features: { gap: 9 },
  featureCard: { minHeight: 88, borderRadius: 22, padding: 14, backgroundColor: '#0D1625', borderWidth: 1, borderColor: '#19283D', flexDirection: 'row', alignItems: 'center', gap: 13 },
  featureCardAccent: { backgroundColor: '#111B36', borderColor: '#253C71' },
  featureIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172339' },
  featureIconAccent: { backgroundColor: '#21356D' },
  featureSymbol: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  featureCopy: { flex: 1 },
  featureTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  featureBody: { color: '#8D9AAF', fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  chevron: { color: '#738199', fontSize: 26, lineHeight: 28 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.994 }] },
  recentHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 3 },
  seeAll: { color: '#8194FF', fontSize: 12, fontWeight: '900', paddingVertical: 4 },
  recentPanel: { borderRadius: 22, backgroundColor: '#0D1625', borderWidth: 1, borderColor: '#19283D', overflow: 'hidden' },
  recentRow: { minHeight: 72, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#1C2A3D' },
  docIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17243A' },
  docIconText: { color: '#8094FF', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  recentCopy: { flex: 1 },
  recentTitle: { color: '#F7F9FF', fontSize: 13.5, fontWeight: '800' },
  recentMeta: { color: '#77859A', fontSize: 10.5, marginTop: 4 },
  emptyRecent: { padding: 20, alignItems: 'flex-start' },
  emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  emptyBody: { color: '#8390A4', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 12 },
  compactButton: { minHeight: 38, borderRadius: 13, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364FF' },
  compactButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  publicContent: { padding: 18, paddingBottom: 42, gap: 16 },
  publicNav: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minHeight: 40, justifyContent: 'center', paddingRight: 12 },
  backText: { color: '#DCE6FF', fontSize: 14, fontWeight: '800' },
  readBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(90,167,255,0.14)', borderWidth: 1, borderColor: 'rgba(90,167,255,0.28)' },
  readBadgeText: { color: '#5AA7FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  publicHero: { overflow: 'hidden', borderRadius: 30, backgroundColor: '#07152E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 24, alignItems: 'center' },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 999, backgroundColor: 'rgba(90,167,255,0.15)', top: -190, right: -100 },
  logo: { width: 180, height: 90, marginBottom: -2 },
  eyebrow: { color: '#5AA7FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.6, marginBottom: 12 },
  publicTitle: { color: '#FFFFFF', fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  publicSubtitle: { color: 'rgba(255,255,255,0.70)', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 14, marginBottom: 22 },
  signInButton: { width: '100%', minHeight: 54, borderRadius: 18, backgroundColor: '#4E75FF', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signInText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  signInArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
});
