import type { LearningPathway, LearningSkill } from '../../core/schemas/learning';
import type { FloentlyPalette } from '../theme/floentlyPalette';

export const learningMotionDuration = {
  quick: 180,
  standard: 240,
  deliberate: 320,
  success: 480,
  milestone: 800,
} as const;

export const learningTouchTarget = {
  minimum: 44,
  compactHitSlop: 8,
} as const;

export const learningRadius = {
  small: 10,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const learningSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type LearningPathwayIdentity = {
  label: string;
  shortLabel: string;
  mark: 'everyday' | 'professional' | 'yki';
};

export const pathwayIdentity: Record<LearningPathway, LearningPathwayIdentity> = {
  everyday: { label: 'Everyday Finnish', shortLabel: 'Everyday', mark: 'everyday' },
  professional: { label: 'Professional Finnish', shortLabel: 'Professional', mark: 'professional' },
  yki: { label: 'YKI preparation', shortLabel: 'YKI', mark: 'yki' },
};

export type LearningSkillIdentity = {
  label: string;
  mark: 'listen' | 'speak' | 'read' | 'write' | 'vocabulary' | 'grammar';
};

export const skillIdentity: Record<LearningSkill, LearningSkillIdentity> = {
  listening: { label: 'Listen', mark: 'listen' },
  speaking: { label: 'Speak', mark: 'speak' },
  reading: { label: 'Read', mark: 'read' },
  writing: { label: 'Write', mark: 'write' },
  vocabulary: { label: 'Vocabulary', mark: 'vocabulary' },
  grammar: { label: 'Grammar review', mark: 'grammar' },
};

export type LearningExperienceColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  success: string;
  error: string;
  attention: string;
};

export function getLearningExperienceColors(palette: FloentlyPalette): LearningExperienceColors {
  return {
    background: palette.background,
    surface: palette.surface,
    surfaceMuted: palette.surfaceMuted,
    border: palette.border,
    borderStrong: palette.borderStrong,
    text: palette.text,
    textMuted: palette.textMuted,
    primary: palette.primary,
    accent: palette.accent,
    success: palette.success,
    error: palette.danger,
    attention: palette.warning,
  };
}
