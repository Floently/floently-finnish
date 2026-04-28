import React from 'react';
import { View } from 'react-native';
import { colors, radius } from '@ui/theme';
export default function ExamProgressBar({ value }: { value: number }) { return <View style={{ height: 8, backgroundColor: colors.panelSoft, borderRadius: radius.pill, overflow: 'hidden' }}><View style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: colors.exam, height: '100%' }} /></View>; }
