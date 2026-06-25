import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAuthToken } from '@core/api/apiClient';

const READ_LOGO = require('./assets/floently_read.png');

function go(path: string) {
  router.push(path as never);
}

export default function ReadAuthScreen() {
  const hasToken = Boolean(getAuthToken());

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.ambientOne} />
      <View style={styles.ambientTwo} />

      <View style={styles.nav}>
        <Pressable accessibilityRole="button" onPress={() => go('/read')} style={styles.logoButton}>
          <Image source={READ_LOGO} resizeMode="contain" style={styles.logo} />
        </Pressable>
        <View style={styles.navActions}>
          <Pressable accessibilityRole="button" onPress={() => go('/')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Floently Home</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => go('/read')} style={styles.navLink}>
            <Text style={styles.navLinkText}>Read landing</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Floently Read auth</Text>
        <Text style={styles.title}>Sign in before entering Read</Text>
        <Text style={styles.subtitle}>
          The mobile flow follows the web product order: Read landing, Read auth, login, then the native Read app with Reader, Library, Import, Preferences, Analytics, and Upgrade.
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => go('/auth/login?returnTo=/read/app')} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{hasToken ? 'Switch or refresh sign in' : 'Sign in to Read'}</Text>
          </Pressable>
          <Pressable onPress={() => go(hasToken ? '/read/app' : '/auth/login?returnTo=/read/app')} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{hasToken ? 'Open Read app' : 'Continue to login'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardGrid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Correct Read flow</Text>
          <Text style={styles.body}>Floently Home to Read landing to Read auth to login to Reader, Library, Import, Preferences, Analytics, and Upgrade.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Native app rule</Text>
          <Text style={styles.body}>This opens native Read screens for iOS and Android after authentication.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#0B0F24',
    padding: 22,
    gap: 20,
    overflow: 'hidden',
  },
  ambientOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    left: -120,
    top: 140,
    backgroundColor: 'rgba(79,107,255,0.16)',
  },
  ambientTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -100,
    top: 20,
    backgroundColor: 'rgba(155,107,255,0.12)',
  },
  nav: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    position: 'relative',
  },
  logoButton: {
    minHeight: 70,
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 84,
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
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  navLinkText: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '900',
    fontSize: 12,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    color: '#8FA8FF',
    backgroundColor: 'rgba(79,107,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79,107,255,0.30)',
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
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 47,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 16,
    lineHeight: 25,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: '#6F77FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  cardGrid: {
    gap: 12,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    lineHeight: 22,
  },
});
