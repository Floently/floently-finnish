import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getAuthToken } from '@core/api/apiClient';

function go(path: string) {
  router.push(path as never);
}

export default function ReadAuthScreen() {
  const hasToken = Boolean(getAuthToken());

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => go('/' as never)} style={styles.topLink}>
          <Text style={styles.topLinkText}>← Floently Home</Text>
        </Pressable>
        <Pressable onPress={() => go('/read' as never)} style={styles.topLink}>
          <Text style={styles.topLinkText}>Read landing</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Floently Read</Text>
        <Text style={styles.title}>Sign in to Read</Text>
        <Text style={styles.subtitle}>
          Continue to your Read library, uploads, audio, subscriptions, and saved progress.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Read account access</Text>
        <Text style={styles.body}>
          Floently Read uses its own Read access. Sign in first, then continue into the Read app.
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => go('/auth/login' as never)} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{hasToken ? 'Switch or refresh sign in' : 'Sign in to Read'}</Text>
          </Pressable>
          <Pressable onPress={() => go('/read/app' as never)} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{hasToken ? 'Open Read app' : 'I have signed in — continue'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Correct Read flow</Text>
        <Text style={styles.body}>Read landing → Read auth → Sign in → Read app.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#060C18',
    padding: 22,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  topLink: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#244A7D',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#0B1728',
  },
  topLinkText: {
    color: '#65AEFF',
    fontWeight: '900',
    fontSize: 13,
  },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#244A7D',
    backgroundColor: '#0B1728',
    padding: 24,
  },
  eyebrow: {
    color: '#65AEFF',
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    color: '#BBD0F3',
    fontSize: 18,
    lineHeight: 29,
    marginTop: 18,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#244A7D',
    backgroundColor: '#0B1728',
    padding: 22,
    gap: 16,
  },
  cardMuted: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C365F',
    backgroundColor: '#091221',
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  body: {
    color: '#BBD0F3',
    fontSize: 16,
    lineHeight: 25,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#58A8FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryText: {
    color: '#061021',
    fontSize: 17,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#10233C',
    borderWidth: 1,
    borderColor: '#244A7D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
