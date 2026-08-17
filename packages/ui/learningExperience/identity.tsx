import type { LearningPathway, LearningSkill } from '../../core/schemas/learning';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { FloentlyPalette } from '../theme/floentlyPalette';
import { learningRadius, learningSpacing, pathwayIdentity, skillIdentity } from './tokens';

type MarkProps = {
  color: string;
  size?: number;
};

function PathwayMark({ pathway, color, size = 18 }: MarkProps & { pathway: LearningPathway }) {
  if (pathway === 'professional') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
        <Rect x="4" y="7" width="16" height="12" rx="2" fill="none" stroke={color} strokeWidth="2" />
        <Path d="M9 7V5h6v2M4 12h16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }

  if (pathway === 'yki') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
        <Rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke={color} strokeWidth="2" />
        <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Line x1="8" y1="16" x2="13" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M4 11.5 12 5l8 6.5V20H4Z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9 20v-5h6v5" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

export function SkillMark({ skill, color, size = 18 }: MarkProps & { skill: LearningSkill }) {
  switch (skill) {
    case 'listening':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
          <Path d="M6 13V9a6 6 0 0 1 12 0v4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Rect x="4" y="12" width="4" height="7" rx="2" fill="none" stroke={color} strokeWidth="2" />
          <Rect x="16" y="12" width="4" height="7" rx="2" fill="none" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'speaking':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
          <Rect x="8" y="3" width="8" height="12" rx="4" fill="none" stroke={color} strokeWidth="2" />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'reading':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
          <Path d="M4 5.5c3-1 5-.5 8 1.5v13c-3-2-5-2.5-8-1.5Zm16 0c-3-1-5-.5-8 1.5v13c3-2 5-2.5 8-1.5Z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        </Svg>
      );
    case 'writing':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
          <Path d="m5 17-1 4 4-1L19 9l-3-3Z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          <Line x1="14" y1="8" x2="17" y2="11" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'vocabulary':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
          <Rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke={color} strokeWidth="2" />
          <Path d="M8 16 12 8l4 8M9.5 13h5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'grammar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
          <Circle cx="7" cy="7" r="2" fill="none" stroke={color} strokeWidth="2" />
          <Circle cx="17" cy="7" r="2" fill="none" stroke={color} strokeWidth="2" />
          <Circle cx="12" cy="17" r="2" fill="none" stroke={color} strokeWidth="2" />
          <Path d="M9 7h6M8 9l3 6M16 9l-3 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
  }
}

type IdentityBadgeProps = {
  palette: FloentlyPalette;
  compact?: boolean;
};

export function PathwayBadge({ pathway, palette, compact = false }: IdentityBadgeProps & { pathway: LearningPathway }) {
  const identity = pathwayIdentity[pathway];
  const color = pathway === 'everyday' ? palette.accent : pathway === 'professional' ? palette.primary : palette.textMuted;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Pathway: ${identity.label}`}
      style={[styles.badge, { backgroundColor: palette.surfaceMuted, borderColor: pathway === 'yki' ? palette.borderStrong : palette.border }]}
    >
      <PathwayMark pathway={pathway} color={color} />
      <Text style={[styles.label, compact && styles.compactLabel, { color: palette.text }]}>{compact ? identity.shortLabel : identity.label}</Text>
    </View>
  );
}

export function SkillBadge({ skill, palette, compact = false }: IdentityBadgeProps & { skill: LearningSkill }) {
  const identity = skillIdentity[skill];
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Skill: ${identity.label}`}
      style={[styles.badge, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
    >
      <SkillMark skill={skill} color={palette.primary} />
      <Text style={[styles.label, compact && styles.compactLabel, { color: palette.text }]}>{identity.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: learningSpacing.xs,
    paddingHorizontal: learningSpacing.sm,
    paddingVertical: 6,
    borderRadius: learningRadius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 13,
  },
});
