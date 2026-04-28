import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FeedbackCard({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 16, backgroundColor: '#FFF7E5', borderWidth: 1, borderColor: '#F6D58A', gap: 6 },
  title: { fontWeight: '700', color: '#7A4B00' },
  message: { lineHeight: 20, color: '#7A4B00' },
});
