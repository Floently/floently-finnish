import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E7EC', gap: 8 },
  title: { fontWeight: '700', color: '#1E2430' },
  subtitle: { color: '#667085', lineHeight: 20 },
});
