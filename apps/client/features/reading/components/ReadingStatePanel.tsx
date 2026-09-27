import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FloentlyPalette } from '@ui/theme/floentlyPalette';

type ReadingStatePanelProps = {
  palette: FloentlyPalette;
  eyebrow: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  live?: boolean;
};

export function ReadingStatePanel({
  palette,
  eyebrow,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  live = false,
}: ReadingStatePanelProps) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
      accessibilityLiveRegion={live ? 'polite' : 'none'}
    >
      <Text style={[styles.eyebrow, { color: palette.accent }]}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: pressed ? palette.primaryPressed : palette.primary,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: palette.background }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          onPress={onSecondary}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: pressed ? palette.surfaceMuted : 'transparent',
              borderColor: palette.borderStrong,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '800',
  },
  message: {
    fontSize: 17,
    lineHeight: 26,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
