import type { PropsWithChildren } from 'react';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
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

function FocusIllustration({
  mode,
  palette,
  density,
}: {
  mode: 'reading' | 'writing';
  palette: FloentlyPalette;
  density: LearningScaffoldDensity;
}) {
  const compact = density === 'low' || density === 'minimal';
  const height = compact ? 66 : 92;

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.illustration,
        compact && styles.illustrationCompact,
        { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
      ]}
    >
      <Svg width="100%" height={height} viewBox="0 0 320 100" accessible={false}>
        {mode === 'reading' ? (
          <>
            <Rect x="42" y="15" width="154" height="70" rx="10" fill={palette.surface} stroke={palette.borderStrong} strokeWidth="2" />
            <Rect x="58" y="34" width="92" height="12" rx="6" fill={palette.primarySurfaceStrong} />
            <Line x1="58" y1="58" x2="178" y2="58" stroke={palette.textMuted} strokeWidth="5" strokeLinecap="round" />
            <Line x1="58" y1="70" x2="150" y2="70" stroke={palette.textSoft} strokeWidth="5" strokeLinecap="round" />
            <Circle cx="232" cy="48" r="24" fill={palette.background} stroke={palette.accent} strokeWidth="4" />
            <Line x1="249" y1="65" x2="271" y2="83" stroke={palette.accent} strokeWidth="6" strokeLinecap="round" />
            <Path d="M220 48h24M232 36v24" stroke={palette.primary} strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Rect x="28" y="17" width="92" height="68" rx="10" fill={palette.surface} stroke={palette.borderStrong} strokeWidth="2" />
            <Line x1="45" y1="39" x2="101" y2="39" stroke={palette.textMuted} strokeWidth="5" strokeLinecap="round" />
            <Line x1="45" y1="54" x2="91" y2="54" stroke={palette.textSoft} strokeWidth="5" strokeLinecap="round" />
            <Path d="M137 50h39m-11-11 11 11-11 11" fill="none" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <Rect x="194" y="12" width="98" height="76" rx="10" fill={palette.primarySurface} stroke={palette.primary} strokeWidth="2" />
            <Line x1="211" y1="35" x2="271" y2="35" stroke={palette.textMuted} strokeWidth="5" strokeLinecap="round" />
            <Line x1="211" y1="50" x2="258" y2="50" stroke={palette.textSoft} strokeWidth="5" strokeLinecap="round" />
            <Path d="m225 69 9 8 18-21" fill="none" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </Svg>
    </View>
  );
}

/**
 * Static focus container by design: no timers, shared values, loops or ambient motion.
 * Reading, Writing, formal YKI work and microphone recording can safely compose it.
 * Reading/Writing receive a restrained contextual SVG that explains the activity
 * visually without adding an animation loop or an additional accessibility stop.
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
  const illustrated = mode === 'reading' || mode === 'writing';

  return (
    <View
      style={[
        styles.surface,
        density === 'high' && styles.highScaffold,
        formal && styles.formal,
        { backgroundColor: formal ? palette.background : palette.surface, borderColor: formal ? palette.borderStrong : palette.border },
        style,
      ]}
    >
      {title ? <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>{title}</Text> : null}
      {illustrated ? <FocusIllustration mode={mode} palette={palette} density={density} /> : null}
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
  illustration: {
    width: '100%',
    minHeight: 92,
    borderWidth: 1,
    borderRadius: learningRadius.medium,
    paddingHorizontal: learningSpacing.sm,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustrationCompact: {
    minHeight: 66,
    maxHeight: 72,
    opacity: 0.86,
  },
});
