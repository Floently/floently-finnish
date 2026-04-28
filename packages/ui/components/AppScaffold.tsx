import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

type Props = PropsWithChildren<{
  header?: React.ReactNode;
  footer?: React.ReactNode;
  allowScroll?: boolean;
  contentStyle?: ViewStyle;
  themeMode?: FloentlyThemeMode;
}>;

export default function AppScaffold({
  header,
  footer,
  allowScroll = false,
  contentStyle,
  themeMode = 'light',
  children,
}: Props) {
  const palette = getFloentlyPalette(themeMode);
  const body = <View style={[styles.body, allowScroll ? styles.scrollBody : null, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}> 
      {header ? <View style={[styles.header, { backgroundColor: palette.background }]}>{header}</View> : null}
      {allowScroll ? <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{body}</ScrollView> : body}
      {footer ? <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.surface }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 18, gap: 14 },
  scrollBody: { flex: 0 },
  scrollContent: { paddingBottom: 26, flexGrow: 1 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
});
