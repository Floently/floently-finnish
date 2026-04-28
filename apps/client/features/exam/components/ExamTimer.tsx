import React from 'react';
import { Text } from 'react-native';

export default function ExamTimer({ seconds, style }: { seconds: number; style?: object }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <Text style={[{ fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'], color: '#1F2937', letterSpacing: 1 }, style]}>
      {mm}:{ss}
    </Text>
  );
}
