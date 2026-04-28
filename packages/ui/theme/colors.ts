/**
 * Legacy `colors` export — kept for backward compatibility.
 *
 * Historically this file held a flat grab-bag of hex values used directly across the
 * app. That drifted from the theme-aware floentlyPalette system that shipped later,
 * leading to the same "primary blue" being three different hex values across screens.
 *
 * After the theme-unification sweep, this file re-exports colors derived from the
 * canonical floentlyPalette. Old code that imports `colors` still compiles and
 * renders correctly; new code should import `getFloentlyPalette` directly so it
 * can respond to theme mode changes.
 *
 * The values here are the DARK MODE snapshot. Anywhere a screen needs a different
 * mode, migrate it to call `getFloentlyPalette(themeMode)` instead of reading from
 * this flat object.
 */

import { getFloentlyPalette } from './floentlyPalette';

const dark = getFloentlyPalette('dark');

export const colors = {
  // Core surfaces & text — aliased to the canonical dark palette
  bg:         dark.background,
  panel:      dark.surface,
  panelSoft:  dark.surfaceMuted,
  text:       dark.text,
  textMuted:  dark.textMuted,
  border:     dark.border,

  // Primary (interactive)
  primary:    dark.primary,
  primarySoft: dark.primarySurface,

  // Semantic
  success:    dark.success,
  warning:    dark.warning,
  danger:     dark.danger,

  // Legacy feature-scoped colors — unified under the canonical accent.
  // Historically these varied (speaking=amber, cards=green, etc.) to give each
  // learning surface its own tint. Keeping them points at the accent creates a
  // consistent "Floently teal" moment everywhere a feature wants to assert identity.
  learn:         dark.primary,
  practice:      dark.primarySurfaceStrong,
  exam:          dark.danger,
  professional:  dark.accent,
  speaking:      dark.accent,
  cards:         dark.accent,

  // Light-mode neutrals (from older screens — still referenced by a few surfaces)
  background: '#F7F8FB',
  surface:    '#FFFFFF',
  muted:      '#667085',
  accent:     dark.accent,
} as const;

export type AppColorName = keyof typeof colors;

/**
 * `legacyColors` kept for the rare call sites still importing it. Prefer
 * importing `getFloentlyPalette(mode)` for anything new.
 */
export const legacyColors = {
  background: colors.background,
  surface:    colors.surface,
  text:       '#1E2430',
  muted:      colors.muted,
  accent:     colors.accent,
  success:    '#0F9D58',
  warning:    colors.warning,
  danger:     '#D92D20',
  border:     '#E4E7EC',
} as const;
