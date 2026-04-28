import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PhraseChip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EEF4FF' },
  text: { color: '#2F6BFF', fontWeight: '600' },
});
