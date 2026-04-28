import React from 'react';
import { Text, View } from 'react-native';
import { colors, radius, spacing } from '@ui/theme';
export default function ContentCard({ children }: { children: React.ReactNode }) { return <View style={{ backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.xl }}><Text style={{ color: colors.text }}>{children}</Text></View>; }
