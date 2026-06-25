import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const CREATE_LOGO = require('./assets/floently_create_word_logo_no_shadow.png');

function navigate(path: string) {
  router.push(path as never);
}

export default function CreateComingSoonScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.ambientOne} />
      <View style={styles.ambientTwo} />

      <View style={styles.nav}>
        <Pressable onPress={() => navigate('/create')} style={styles.logoButton}>
          <Image source={CREATE_LOGO} resizeMode="contain" style={styles.logo} />
        </Pressable>
        <View style={styles.navActions}>
          <Pressable onPress={() => navigate('/')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Floently Home</Text>
          </Pressable>
          <Pressable onPress={() => navigate('/create')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Create landing</Text>
          </Pressable>
          <Pressable onPress={() => navigate('/create/auth')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Create auth</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Floently Create</Text>
        <Text style={styles.title}>Create Studio is coming soon</Text>
        <Text style={styles.subtitle}>
          The native Create area is intentionally gated until the product is ready. Auth is already in place, but unfinished Create tools stay locked.
        </Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => navigate('/create')}>
            <Text style={styles.primaryButtonText}>Back to Create landing</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => navigate('/read')}>
            <Text style={styles.secondaryButtonText}>Go to Read</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What will be here</Text>
        <Text style={styles.body}>Dashboard, Create studio, writing tools, analytics, projects, CRM, brand deals, invoices, calendar, and automation will be connected after Read and payments are stable.</Text>
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Access rule</Text>
        <Text style={styles.body}>Read users should not see unfinished Create tools. Create has a separate auth entry and a safe coming-soon workspace.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#050403',
    padding: 22,
    gap: 16,
    overflow: 'hidden',
  },
  ambientOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    left: -110,
    top: 120,
    backgroundColor: 'rgba(157,96,36,0.15)',
  },
  ambientTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -100,
    top: 20,
    backgroundColor: 'rgba(225,169,95,0.10)',
  },
  nav: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    position: 'relative',
  },
  logoButton: { minHeight: 66, justifyContent: 'center' },
  logo: { width: 178, height: 70 },
  navActions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  navLink: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.18)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,239,218,0.055)',
  },
  navLinkText: { color: 'rgba(255,239,218,0.72)', fontWeight: '900', fontSize: 12 },
  hero: {
    borderRadius: 34,
    padding: 24,
    backgroundColor: 'rgba(255,239,218,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.13)',
    gap: 16,
    position: 'relative',
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: '#E2AA62',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(169,107,46,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.30)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  title: { color: '#FFF7EC', fontSize: 38, fontWeight: '900', lineHeight: 43, letterSpacing: -1.1 },
  subtitle: { color: 'rgba(255,239,218,0.62)', fontSize: 16, lineHeight: 25 },
  actions: { gap: 12 },
  primaryButton: { minHeight: 56, borderRadius: 999, backgroundColor: '#E2AA62', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: '#120804', fontSize: 16, fontWeight: '900' },
  secondaryButton: { minHeight: 54, borderRadius: 999, backgroundColor: 'rgba(255,239,218,0.07)', borderWidth: 1, borderColor: 'rgba(225,169,95,0.18)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButtonText: { color: '#FFF7EC', fontSize: 15, fontWeight: '900' },
  card: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(255,239,218,0.045)', borderWidth: 1, borderColor: 'rgba(225,169,95,0.12)', gap: 8 },
  cardMuted: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(255,239,218,0.03)', borderWidth: 1, borderColor: 'rgba(225,169,95,0.09)', gap: 8 },
  cardTitle: { color: '#FFF7EC', fontSize: 18, fontWeight: '900' },
  body: { color: 'rgba(255,239,218,0.58)', fontSize: 14, lineHeight: 22 },
});
