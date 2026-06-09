import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

function navigate(path: string) {
  router.push(path as never);
}

export default function CreateComingSoonScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Floently Create</Text>
        <Text style={styles.title}>Create Studio is coming soon in the app</Text>
        <Text style={styles.subtitle}>
          Create tools are being kept behind a safe coming-soon gate until the product is ready. This is a real native app screen built directly inside the mobile app.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What will be here</Text>
        <Text style={styles.body}>Video tools, writing tools, client delivery, brand memory, and automation workflows will be connected after Read and payments are stable.</Text>
      </View>

      <View style={styles.cardMuted}>
        <Text style={styles.cardTitle}>Access rule</Text>
        <Text style={styles.body}>Users who only pay for Read should not see unfinished Create tools. Users with Create access can see this coming-soon app area until Create is ready.</Text>
      </View>

      <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => navigate('/read')}>
        <Text style={styles.primaryButtonText}>Go to Read</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: '#120d0a',
    padding: 20,
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: '#1b1421',
    borderWidth: 1,
    borderColor: '#392a4d',
  },
  eyebrow: {
    color: '#c7b7ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#fff7ef',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 12,
    color: '#d8cce8',
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#19111f',
    borderWidth: 1,
    borderColor: '#30243f',
    gap: 8,
  },
  cardMuted: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#151016',
    borderWidth: 1,
    borderColor: '#2a2130',
    gap: 8,
  },
  cardTitle: {
    color: '#fff7ef',
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    color: '#d8cce8',
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#c7b7ff',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#171120',
    fontSize: 15,
    fontWeight: '900',
  },
});
