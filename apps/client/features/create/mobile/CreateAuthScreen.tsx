import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function go(path: string) {
  router.push(path as never);
}

export default function CreateAuthScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => go('/' as never)} style={styles.topLink}>
          <Text style={styles.topLinkText}>← Floently Home</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Floently Create Studio</Text>
        <Text style={styles.title}>Create sign-in</Text>
        <Text style={styles.subtitle}>
          Create Studio will require its own signed-in workspace. The studio itself remains coming soon, but the auth entry is now present.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create account access</Text>
        <Text style={styles.body}>Sign in now, or continue to the Create Studio coming-soon screen.</Text>
        <Pressable onPress={() => go('/auth/login' as never)} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Sign in to Create</Text>
        </Pressable>
        <Pressable onPress={() => go('/create/studio' as never)} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Continue to Create Studio</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#070814',
    padding: 22,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
  },
  topLink: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#5B4AA5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#14112A',
  },
  topLinkText: {
    color: '#BFB4FF',
    fontWeight: '900',
  },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4B3E91',
    backgroundColor: '#131126',
    padding: 24,
  },
  eyebrow: {
    color: '#BFB4FF',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    fontWeight: '900',
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '900',
  },
  subtitle: {
    color: '#CBC5EE',
    fontSize: 17,
    lineHeight: 27,
    marginTop: 18,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#4B3E91',
    backgroundColor: '#131126',
    padding: 22,
    gap: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  body: {
    color: '#CBC5EE',
    fontSize: 16,
    lineHeight: 25,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#9C8CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#090617',
    fontWeight: '900',
    fontSize: 17,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#211C3A',
    borderWidth: 1,
    borderColor: '#4B3E91',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});
