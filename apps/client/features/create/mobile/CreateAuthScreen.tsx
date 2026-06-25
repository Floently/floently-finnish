import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useReadMobileStore, type ReadTheme } from '../../read/mobile/readMobileStore';

const CREATE_LOGO = require('./assets/floently_create_word_logo_no_shadow.png');

function paletteFor(theme: ReadTheme) {
  if (theme === 'light') return { background: '#F5F7FE', surface: '#FFFFFF', soft: '#EEF2FF', text: '#111827', muted: '#667085', border: 'rgba(15,35,78,0.10)', accent: '#6D5DFF', accentText: '#FFFFFF' };
  if (theme === 'sepia') return { background: '#F6EFE2', surface: '#FFF8EA', soft: '#F1E4CF', text: '#2D2015', muted: '#766A5E', border: 'rgba(95,67,38,0.13)', accent: '#8B5CF6', accentText: '#FFFFFF' };
  if (theme === 'ink') return { background: '#030407', surface: '#0B0D12', soft: '#171B25', text: '#F6F4EF', muted: '#B5B7C2', border: 'rgba(255,255,255,0.11)', accent: '#FFFFFF', accentText: '#030407' };
  return { background: '#07111F', surface: '#101A2B', soft: '#182641', text: '#FFFFFF', muted: '#B7C0D4', border: 'rgba(255,255,255,0.10)', accent: '#8B5CF6', accentText: '#FFFFFF' };
}

function go(path: string) {
  router.push(path as never);
}

function goBack(fallback = '/create') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.push(fallback as never);
}

export default function CreateAuthScreen() {
  const theme = useReadMobileStore((state) => state.readTheme);
  const palette = paletteFor(theme);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screen}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" onPress={() => go('/create')}>
            <Image source={CREATE_LOGO} resizeMode="contain" style={styles.logo} />
          </Pressable>
          <View style={styles.navActions}>
            <Pressable accessibilityRole="button" onPress={() => goBack()} style={[styles.navChip, { backgroundColor: palette.soft, borderColor: palette.border }]}>
              <Text style={[styles.navChipText, { color: palette.text }]}>Back</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => go('/read/app')} style={[styles.navChip, { backgroundColor: palette.soft, borderColor: palette.border }]}>
              <Text style={[styles.navChipText, { color: palette.text }]}>Read</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.kicker, { color: palette.accent }]}>Creator workspace</Text>
          <Text style={[styles.title, { color: palette.text }]}>Sign in before Create opens.</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Create is protected now, but the full studio remains a safe coming-soon area until Read and payments are stable.</Text>
          <Pressable accessibilityRole="button" onPress={() => go('/auth/login?returnTo=/create/studio')} style={[styles.primaryButton, { backgroundColor: palette.accent }]}>
            <Text style={[styles.primaryText, { color: palette.accentText }]}>Sign in to Create</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => go('/create')} style={[styles.secondaryButton, { backgroundColor: palette.soft, borderColor: palette.border }]}>
            <Text style={[styles.secondaryText, { color: palette.text }]}>Back to Create landing</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 42, gap: 18 },
  nav: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 150, height: 58 },
  navActions: { flexDirection: 'row', gap: 8 },
  navChip: { minHeight: 40, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  navChipText: { fontSize: 13, fontWeight: '900' },
  card: { borderRadius: 32, borderWidth: 1, padding: 24, gap: 16 },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontSize: 32, lineHeight: 37, fontWeight: '900' },
  subtitle: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  primaryButton: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 52, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '900' },
});
