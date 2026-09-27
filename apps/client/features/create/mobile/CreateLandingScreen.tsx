import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useReadMobileStore, type ReadTheme } from '../../read/mobile/readMobileStore';

const CREATE_LOGO = require('./assets/floently_create_word_logo_no_shadow.png');

type Palette = {
  background: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  shadow: string;
};

function paletteFor(theme: ReadTheme): Palette {
  if (theme === 'light') {
    return { background: '#F5F7FE', surface: '#FFFFFF', surfaceSoft: '#EEF2FF', text: '#111827', muted: '#667085', border: 'rgba(15,35,78,0.10)', accent: '#6D5DFF', accentText: '#FFFFFF', shadow: 'rgba(32,41,74,0.12)' };
  }
  if (theme === 'sepia') {
    return { background: '#F6EFE2', surface: '#FFF8EA', surfaceSoft: '#F1E4CF', text: '#2D2015', muted: '#766A5E', border: 'rgba(95,67,38,0.13)', accent: '#8B5CF6', accentText: '#FFFFFF', shadow: 'rgba(74,46,20,0.12)' };
  }
  if (theme === 'ink') {
    return { background: '#030407', surface: '#0B0D12', surfaceSoft: '#171B25', text: '#F6F4EF', muted: '#B5B7C2', border: 'rgba(255,255,255,0.11)', accent: '#FFFFFF', accentText: '#030407', shadow: 'rgba(0,0,0,0.42)' };
  }
  return { background: '#07111F', surface: '#101A2B', surfaceSoft: '#182641', text: '#FFFFFF', muted: '#B7C0D4', border: 'rgba(255,255,255,0.10)', accent: '#8B5CF6', accentText: '#FFFFFF', shadow: 'rgba(0,0,0,0.38)' };
}

function go(path: string) {
  router.push(path as never);
}

function goBack(fallback = '/') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.push(fallback as never);
}

export default function CreateLandingScreen() {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.glowOne, { backgroundColor: palette.accent }]} />
        <View style={[styles.glowTwo, { backgroundColor: '#38D9C0' }]} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screen}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" onPress={() => go('/create')} style={styles.logoButton}>
            <Image source={CREATE_LOGO} resizeMode="contain" style={styles.logo} />
          </Pressable>
          <View style={styles.navActions}>
            <Pressable accessibilityRole="button" onPress={() => goBack()} style={[styles.navChip, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.navChipText, { color: palette.text }]}>Back</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => go('/read/app')} style={[styles.navChip, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.navChipText, { color: palette.text }]}>Read</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <View style={[styles.createIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.createIconText, { color: palette.accent }]}>AI</Text>
          </View>
          <Text style={[styles.kicker, { color: palette.accent }]}>Floently Create</Text>
          <Text style={[styles.title, { color: palette.text }]}>Create is coming after Read is stable.</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>The creator workspace has a clean entry and protected auth flow, but unfinished tools remain safely locked.</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => go('/create/auth')} style={[styles.primaryButton, { backgroundColor: palette.accent }]}>
              <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Sign in to Create</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => go('/create/studio')} style={[styles.secondaryButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Open coming soon</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.featureGrid}>
          {[
            ['Separate product', 'Create stays separate from Read and does not crowd the reader.'],
            ['Auth ready', 'The route is protected and can send users to the coming-soon studio.'],
            ['No fake dashboard', 'Only honest upcoming features are shown until the product is ready.'],
          ].map(([titleText, body]) => (
            <View key={titleText} style={[styles.featureCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{titleText}</Text>
              <Text style={[styles.cardBody, { color: palette.muted }]}>{body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 42, gap: 18 },
  glowOne: { position: 'absolute', width: 300, height: 300, borderRadius: 150, right: -120, top: 60, opacity: 0.16 },
  glowTwo: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -130, bottom: 120, opacity: 0.12 },
  nav: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  logoButton: { minHeight: 56, justifyContent: 'center' },
  logo: { width: 150, height: 58 },
  navActions: { flexDirection: 'row', gap: 8 },
  navChip: { minHeight: 40, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  navChipText: { fontSize: 13, fontWeight: '900' },
  heroCard: { borderRadius: 32, borderWidth: 1, padding: 24, gap: 16, shadowOpacity: 1, shadowRadius: 28, shadowOffset: { width: 0, height: 16 } },
  createIcon: { width: 96, height: 96, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  createIconText: { fontSize: 30, fontWeight: '900' },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontSize: 32, lineHeight: 37, fontWeight: '900' },
  subtitle: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  actions: { gap: 10 },
  primaryButton: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 52, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { fontSize: 14, fontWeight: '900' },
  featureGrid: { gap: 12 },
  featureCard: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 7 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardBody: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
});
