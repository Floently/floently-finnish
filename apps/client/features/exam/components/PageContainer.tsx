import React from 'react'; import { ScrollView } from 'react-native'; import { colors, spacing } from '@ui/theme';
export default function PageContainer({ children }: { children: React.ReactNode }) { return <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg }}>{children}</ScrollView>; }
