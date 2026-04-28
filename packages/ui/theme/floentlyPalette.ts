/**
 * Floently palette — canonical color system.
 *
 * This is the single source of truth for all color decisions in the app. Every screen
 * should resolve colors through this palette, not hard-code hex values.
 *
 * Design brief:
 *   • Deep navy dominates surfaces (primary coverage)
 *   • Near-white for reading text
 *   • Two shades of blue (one deep, one lighter) for primary interactive elements
 *   • Teal as the accent — chosen for healthcare context where amber/peach would
 *     read as "warning." Teal reads as trust + active + healthcare-appropriate.
 *   • Semantic success/danger/warning stay distinct from the accent
 *
 * Light mode is supported on every token. All screens should render cleanly in
 * either mode by reading from this palette rather than hard-coding.
 */

export type FloentlyThemeMode = 'light' | 'dark';

export type FloentlyPalette = {
  mode: FloentlyThemeMode;

  // Surfaces (dominant coverage)
  background: string;       // app-wide page background
  surface: string;          // card / panel surface — slight elevation from background
  surfaceRaised: string;    // higher-elevation card (modal, featured)
  surfaceMuted: string;     // de-emphasized surface (recessed areas)

  // Borders
  border: string;           // default 0.5-1px line
  borderStrong: string;     // emphasized lines, focus states

  // Text (optimized for reading against background/surface)
  text: string;             // default body + heading text
  textMuted: string;        // secondary text, metadata
  textSoft: string;         // tertiary/placeholder text

  // Primary (interactive, "do the thing")
  primary: string;          // buttons, CTAs, active tab, brand voice
  primaryPressed: string;   // pressed state
  primarySurface: string;   // subtle filled bg for primary-colored areas
  primarySurfaceStrong: string; // more saturated variant

  // Accent (contrast, attention — healthcare-safe teal)
  accent: string;
  accentSoft: string;       // muted accent bg

  // Shadows + overlays
  shadow: string;           // drop shadow (if ever used — prefer flat surfaces)
  overlay: string;          // modal/drawer scrim

  // Semantic (meaning-bearing — keep distinct from accent)
  success: string;          // positive states, confirmations
  danger: string;           // errors, destructive
  warning: string;          // genuine warnings (rare — careful with healthcare overlap)
};

// ─── DARK MODE (primary — dominant use) ──────────────────────────────────────

const darkPalette: FloentlyPalette = {
  mode: 'dark',

  background:      '#0A1838',  // deep navy — dominant coverage
  surface:         '#112346',  // card surface, one step up from bg
  surfaceRaised:   '#17306A',  // elevated card (modal, featured)
  surfaceMuted:    '#0D1D42',  // recessed panel

  border:          '#263B6B',
  borderStrong:    '#36508A',

  text:            '#F5F9FF',  // near-white, reads cleanly on navy
  textMuted:       '#A8BAD6',
  textSoft:        '#7A8CAE',

  primary:         '#5A85FF',  // lighter saturated blue — punchy on navy
  primaryPressed:  '#7A9FFF',
  primarySurface:  '#1B2C5D',  // primary-tinted background
  primarySurfaceStrong: '#22397A',

  accent:          '#3EC5A8',  // teal — healthcare-safe, active, trustworthy
  accentSoft:      '#143530',  // teal-tinted dark background

  shadow:          'rgba(0, 0, 0, 0.38)',
  overlay:         'rgba(4, 10, 24, 0.62)',

  success:         '#3EC58A',
  danger:          '#FF7A85',
  warning:         '#E8B65E',
};

// ─── LIGHT MODE ──────────────────────────────────────────────────────────────

const lightPalette: FloentlyPalette = {
  mode: 'light',

  background:      '#F6F8FD',  // cool-tinted near-white
  surface:         '#FFFFFF',
  surfaceRaised:   '#FFFFFF',
  surfaceMuted:    '#EEF2FB',

  border:          '#D7DFF0',
  borderStrong:    '#B9C5DE',

  text:            '#0A1838',  // deep navy for reading on white
  textMuted:       '#5A6A89',
  textSoft:        '#8497B3',

  primary:         '#1F47E8',  // deep saturated blue — readable on white
  primaryPressed:  '#1839BA',
  primarySurface:  '#E4ECFF',
  primarySurfaceStrong: '#CAD9FF',

  accent:          '#0E9F7E',  // deeper teal for white-background readability
  accentSoft:      '#E1F5EE',

  shadow:          'rgba(20, 34, 84, 0.08)',
  overlay:         'rgba(7, 14, 31, 0.20)',

  success:         '#1E9E67',
  danger:          '#D65656',
  warning:         '#B8791E',
};

// ─── API ─────────────────────────────────────────────────────────────────────

export function getFloentlyPalette(mode: FloentlyThemeMode = 'dark'): FloentlyPalette {
  return mode === 'light' ? lightPalette : darkPalette;
}

/**
 * Returns BOTH palettes — useful for components that need to know both modes'
 * values in one call (e.g. when computing a derived color that should be stable
 * regardless of current mode).
 */
export function getBothFloentlyPalettes() {
  return { light: lightPalette, dark: darkPalette };
}
