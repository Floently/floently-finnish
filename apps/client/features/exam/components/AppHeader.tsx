import React from 'react';
import { Text, View } from 'react-native';
import { colors, spacing, typography } from '@ui/theme';
export default function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={{ gap: spacing.xs }}><Text style={{ color: colors.text, ...typography.h1 }}>{title}</Text>{subtitle ? <Text style={{ color: colors.textMuted }}>{subtitle}</Text> : null}</View>;
}
