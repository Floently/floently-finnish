import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const CREATE_LOGO = require('./assets/floently_create_word_logo_no_shadow.png');

function go(path: string) {
  router.push(path as never);
}

export default function CreateAuthScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.ambientOne} />
      <View style={styles.ambientTwo} />

      <View style={styles.nav}>
        <Pressable accessibilityRole="button" onPress={() => go('/')} style={styles.logoButton}>
          <Image source={CREATE_LOGO} resizeMode="contain" style={styles.logo} />
        </Pressable>
        <View style={styles.navActions}>
          <Pressable onPress={() => go('/')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Floently Home</Text>
          </Pressable>
          <Pressable onPress={() => go('/read')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Read</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Creator workspace</Text>
        <Text style={styles.title}>Create sign-in is present before launch</Text>
        <Text style={styles.subtitle}>
          Create Studio stays behind a safe coming-soon gate, but its auth entry exists now so the product flow is ready.
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => go('/auth/login?returnTo=/create/studio')} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Sign in to Create</Text>
          </Pressable>
          <Pressable onPress={() => go('/create/studio')} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Continue to coming soon</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardGrid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Correct Create flow</Text>
          <Text style={styles.body}>Floently Home to Create auth to login to Create Studio coming soon.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product separation</Text>
          <Text style={styles.body}>Create has its own entry and auth surface. It is not mixed inside Read tabs.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#050403',
    padding: 22,
    gap: 20,
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
  logoButton: {
    minHeight: 66,
    justifyContent: 'center',
  },
  logo: {
    width: 178,
    height: 70,
  },
  navActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  navLink: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.18)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,239,218,0.055)',
  },
  navLinkText: {
    color: 'rgba(255,239,218,0.72)',
    fontWeight: '900',
    fontSize: 12,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.13)',
    backgroundColor: 'rgba(255,239,218,0.045)',
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: '#E2AA62',
    backgroundColor: 'rgba(169,107,46,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.30)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: '#FFF7EC',
    fontSize: 40,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    color: 'rgba(255,239,218,0.62)',
    fontSize: 16,
    lineHeight: 25,
  },
  actions: { gap: 12 },
  primaryButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: '#E2AA62',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryText: {
    color: '#120804',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(255,239,218,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: '#FFF7EC',
    fontSize: 15,
    fontWeight: '900',
  },
  cardGrid: { gap: 12 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(225,169,95,0.10)',
    backgroundColor: 'rgba(255,239,218,0.035)',
    padding: 18,
    gap: 8,
  },
  cardTitle: { color: '#FFF7EC', fontSize: 18, fontWeight: '900' },
  body: { color: 'rgba(255,239,218,0.58)', fontSize: 14, lineHeight: 22 },
});
