import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  themeMode?: FloentlyThemeMode;
};

export default function SmartHintPopup({
  visible,
  title,
  body,
  primaryLabel = 'Take me there',
  secondaryLabel = 'Dismiss',
  onPrimary,
  onSecondary,
  themeMode = 'light',
}: Props) {
  const palette = getFloentlyPalette(themeMode);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: palette.overlay }]}>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.badge, { backgroundColor: palette.primarySurface }]}>
          <Text style={[styles.badgeText, { color: palette.primary }]}>Helpful hint</Text>
        </View>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.body, { color: palette.textMuted }]}>{body}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onSecondary} style={({ pressed }) => [styles.secondary, { borderColor: palette.borderStrong, backgroundColor: palette.surface }, pressed && styles.pressed]}>
            <Text style={[styles.secondaryText, { color: palette.text }]}>{secondaryLabel}</Text>
          </Pressable>
          <Pressable onPress={onPrimary} style={({ pressed }) => [styles.primary, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { justifyContent: 'flex-end', padding: 16, zIndex: 2000 },
  card: { borderRadius: 24, padding: 18, gap: 12, borderWidth: 1 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondary: { flex: 1, minHeight: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primary: { flex: 1.1, minHeight: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontWeight: '700', fontSize: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  pressed: { opacity: 0.92 },
});
