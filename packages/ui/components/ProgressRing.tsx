import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProgressRing({ percent }: { percent: number }) {
  return (
    <View style={styles.outer}>
      <Text style={styles.percent}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: 82, height: 82, borderRadius: 999, borderWidth: 8, borderColor: '#2F6BFF', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  percent: { fontWeight: '700', color: '#1E2430' },
});
