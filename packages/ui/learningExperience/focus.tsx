import type { PropsWithChildren } from 'react';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { FloentlyPalette } from '../theme/floentlyPalette';
import { learningRadius, learningSpacing } from './tokens';

export type LearningFocusMode = 'reading' | 'writing' | 'yki' | 'recording';
export type LearningScaffoldDensity = 'high' | 'moderate' | 'low' | 'minimal';

export function getLearningScaffoldDensity(levelBand?: string): LearningScaffoldDensity {
  const normalized = levelBand?.trim().toUpperCase() ?? '';
  if (normalized.startsWith('A1')) return 'high';
  if (normalized.startsWith('A2')) return 'moderate';
  if (normalized.startsWith('B1')) return 'low';
  return 'minimal';
}

export type LearningFocusSurfaceProps = PropsWithChildren<{
  mode: LearningFocusMode;
  palette: FloentlyPalette;
  title?: string;
  levelBand?: string;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Static focus container by design: no timers, shared values, loops or ambient motion.
 * Reading, Writing, formal YKI work and microphone recording can safely compose it.
 */
export function LearningFocusSurface({
  mode,
  palette,
  title,
  levelBand,
  style,
  children,
}: LearningFocusSurfaceProps) {
  const density = getLearningScaffoldDensity(levelBand);
  const formal = mode === 'yki';

  return (
    <View
      accessibilityLabel={title ? `${title}, ${mode} focus` : `${mode} focus`}
      style={[
        styles.surface,
        density === 'high' && styles.highScaffold,
        formal && styles.formal,
        { backgroundColor: formal ? palette.background : palette.surface, borderColor: formal ? palette.borderStrong : palette.border },
        style,
      ]}
    >
      {title ? <Text style={[styles.title, { color: palette.text }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: '100%',
    gap: learningSpacing.md,
    padding: learningSpacing.md,
    borderWidth: 1,
    borderRadius: learningRadius.large,
  },
  highScaffold: {
    padding: learningSpacing.lg,
  },
  formal: {
    borderRadius: learningRadius.small,
  },
  title: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
  },
});
