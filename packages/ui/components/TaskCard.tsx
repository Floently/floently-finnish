import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

type Props = {
  title: string;
  detail: string;
  meta?: string;
  actionLabel?: string;
  onPress?: () => void;
  themeMode?: FloentlyThemeMode;
  accent?: 'blue' | 'yellow';
};

export default function TaskCard({
  title,
  detail,
  meta,
  actionLabel = 'Next',
  onPress,
  themeMode = 'light',
  accent = 'blue',
}: Props) {
  const palette = getFloentlyPalette(themeMode);
  const accentBg = accent === 'yellow' ? palette.accentSoft : palette.primarySurface;
  const accentText = accent === 'yellow' ? '#8A5A00' : palette.primary;

  const content = (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}> 
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.detail, { color: palette.textMuted }]}>{detail}</Text>
      <View style={styles.bottomRow}>
        {meta ? (
          <View style={[styles.metaPill, { backgroundColor: accentBg }]}> 
            <Text style={[styles.meta, { color: accentText }]}>{meta}</Text>
          </View>
        ) : <View />}
        {onPress ? (
          <View style={[styles.ctaPill, { backgroundColor: accentBg }]}> 
            <Text style={[styles.cta, { color: accentText }]}>{actionLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      {content}
    </Pressable>
  ) : content;
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 20 },
  pressed: { opacity: 0.94 },
  card: {
    borderRadius: 20,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  title: { fontSize: 16, fontWeight: '800' },
  detail: { fontSize: 13, lineHeight: 19 },
  metaPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  meta: { fontSize: 11, fontWeight: '700' },
  ctaPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  cta: { fontSize: 11, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
