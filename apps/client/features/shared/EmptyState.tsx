/**
 * EmptyState — a first-time-user-friendly placeholder for learning screens.
 *
 * Used when a hook returns an empty data set (no phrases saved, no revisions yet,
 * no YKI plan tasks, etc.). Provides a clear next action so the user is never
 * stranded on a blank screen.
 *
 * Design matches FeatureScaffold.tsx card styling so it slots into any learning
 * screen without style conflicts.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

type EmptyStateProps = {
  /** Short 1-3 word headline, e.g. "No phrases yet" */
  title: string;
  /** 1-2 sentence explanation of what this screen shows once populated */
  description: string;
  /** Label for the primary CTA, e.g. "Save your first phrase" */
  actionLabel: string;
  /** Invoked on CTA press. Should route to the action that populates this screen. */
  onAction: () => void;
  /** Optional emoji/character for visual interest. Keep to 1-2 chars. */
  icon?: string;
  /** Theme-aware color resolution. Default 'dark' matches FeatureScaffold. */
  themeMode?: FloentlyThemeMode;
};

export function EmptyState({ title, description, actionLabel, onAction, icon, themeMode = 'dark' }: EmptyStateProps) {
  const palette = getFloentlyPalette(themeMode);

  const surface = palette.surface;
  const raised  = palette.surfaceMuted;
  const border  = palette.border;
  const text    = palette.text;
  const muted   = palette.textMuted;
  const primary = palette.primary;
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: raised, borderColor: border }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      ) : null}
      <Text style={[styles.title, { color: text }]}>{title}</Text>
      <Text style={[styles.description, { color: muted }]}>{description}</Text>
      <Pressable
        onPress={onAction}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={[styles.buttonText, { color: textOnPrimary }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'stretch',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default EmptyState;
