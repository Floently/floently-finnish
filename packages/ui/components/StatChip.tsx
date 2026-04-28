import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { backgroundColor: '#F2F4F7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, flexDirection: 'row', gap: 8, alignItems: 'center' },
  value: { fontWeight: '700', color: '#1E2430' },
  label: { color: '#667085' },
});
