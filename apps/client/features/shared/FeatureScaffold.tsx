/**
 * FeatureScaffold.tsx
 *
 * Used by: PersonalPhraseBankScreen, RevisionVaultScreen, YkiPlannerScreen,
 *          ConfidenceTrackerScreen, WorkplaceIncidentLabScreen
 *
 * Colors resolve entirely through the canonical `floentlyPalette`. No hard-coded
 * hexes. Both light and dark modes supported — parent passes `themeMode` or lets
 * the default (dark) apply.
 */
import React, { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

type FeatureScaffoldProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  themeMode?: FloentlyThemeMode;
  /** Optional action slot rendered between the header card and body children.
   * Use with the `ActionBar` sub-component for a consistent "do the thing" CTA. */
  actions?: React.ReactNode;
}>;

export function FeatureScaffold({
  title,
  subtitle,
  eyebrow = 'Floently',
  loading = false,
  error,
  onRefresh,
  themeMode = 'dark',
  actions,
  children,
}: FeatureScaffoldProps) {
  const palette = getFloentlyPalette(themeMode);

  const bg      = palette.background;
  const surface = palette.surface;
  const border  = palette.border;
  const text    = palette.text;
  const muted   = palette.textMuted;
  const soft    = palette.textSoft;
  const primary = palette.primary;
  const raised  = palette.surfaceMuted;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <View style={[styles.backBar, { backgroundColor: bg }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: raised, borderColor: border }]}
          accessibilityRole="button"
          accessibilityLabel="Takaisin"
        >
          <Text style={[styles.backBtnText, { color: primary }]}>← Takaisin</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: bg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={[styles.headerCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.headerEyebrow, { color: primary }]}>{eyebrow}</Text>
          <Text style={[styles.headerTitle, { color: text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.headerSub, { color: muted }]}>{subtitle}</Text> : null}

          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              style={[styles.refreshBtn, { backgroundColor: raised, borderColor: border }]}
            >
              <Text style={[styles.refreshBtnText, { color: primary }]}>↻  Päivitä</Text>
            </Pressable>
          )}

          {loading && (
            <Text style={[styles.stateText, { color: soft }]}>Ladataan…</Text>
          )}

          {error && (
            <View style={[styles.errorRow, { backgroundColor: palette.danger + '1A', borderColor: palette.danger }]}>
              <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {actions ? <View style={styles.actionsWrap}>{actions}</View> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type CardProps = {
  title: string;
  body: string;
  meta?: string;
  accentColor?: string;
  themeMode?: FloentlyThemeMode;
};

export function Card({ title, body, meta, accentColor, themeMode = 'dark' }: CardProps) {
  const palette = getFloentlyPalette(themeMode);
  const surface = palette.surface;
  const border  = palette.border;
  const text    = palette.text;
  const muted   = palette.textMuted;
  const primary = palette.primary;

  return (
    <View style={[
      styles.card,
      { backgroundColor: surface, borderColor: border },
      accentColor && { borderLeftColor: accentColor, borderLeftWidth: 3 },
    ]}>
      <Text style={[styles.cardTitle, { color: text }]}>{title}</Text>
      <Text style={[styles.cardBody, { color: muted }]}>{body}</Text>
      {meta && <Text style={[styles.cardMeta, { color: primary }]}>{meta}</Text>}
    </View>
  );
}

type MetricRowProps = {
  label: string;
  value: string | number;
  themeMode?: FloentlyThemeMode;
};

export function MetricRow({ label, value, themeMode = 'dark' }: MetricRowProps) {
  const palette = getFloentlyPalette(themeMode);
  const text  = palette.text;
  const muted = palette.textMuted;

  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: text }]}>{String(value)}</Text>
    </View>
  );
}

// ─── ActionBar ───────────────────────────────────────────────────────────────

type ActionBarButton = {
  /** Button label. Keep short and action-oriented: "Start today's review" not "Click here". */
  label: string;
  /** Primary buttons get the filled background + accent color. Secondary is outlined. */
  variant?: 'primary' | 'secondary';
  /** Optional sublabel shown below the label in a smaller muted font. Useful for
   * context like "3 items due" or "5 min session". */
  hint?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Accent color override. Defaults to primary for primary variant, muted for secondary. */
  accentColor?: string;
};

type ActionBarProps = {
  buttons: ActionBarButton[];
  themeMode?: FloentlyThemeMode;
};

/**
 * ActionBar — consistent "do the thing" bar for learning screens.
 *
 * Designed to be passed into FeatureScaffold's `actions` slot, but also usable
 * standalone in screens that don't use the scaffold (e.g. PersonalPhraseBankScreen).
 * Renders 1-2 buttons; the first is the primary action, the rest are secondary.
 */
export function ActionBar({ buttons, themeMode = 'dark' }: ActionBarProps) {
  const palette = getFloentlyPalette(themeMode);
  const primary = palette.primary;
  const border  = palette.border;
  const text    = palette.text;
  const muted   = palette.textMuted;
  // Text on primary-filled buttons: in dark mode, primary is a lighter blue so dark
  // text is readable. In light mode, primary is deep saturated blue so white text
  // is readable. Keep this as one line so intent is obvious.
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';
  const textOnPrimaryMuted = themeMode === 'dark' ? palette.background + 'B3' : 'rgba(255,255,255,0.75)';

  return (
    <View style={styles.actionBarRow}>
      {buttons.map((btn, idx) => {
        const variant = btn.variant ?? (idx === 0 ? 'primary' : 'secondary');
        const accent = btn.accentColor ?? primary;
        const isPrimary = variant === 'primary';
        return (
          <Pressable
            key={btn.label}
            onPress={btn.onPress}
            disabled={btn.disabled}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: isPrimary ? accent : 'transparent',
                borderColor: isPrimary ? accent : border,
                opacity: btn.disabled ? 0.5 : pressed ? 0.88 : 1,
                flex: buttons.length === 1 ? undefined : 1,
                alignSelf: buttons.length === 1 ? 'stretch' : undefined,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={btn.label}
            accessibilityState={{ disabled: !!btn.disabled }}
          >
            <Text
              style={[
                styles.actionBtnLabel,
                { color: isPrimary ? textOnPrimary : accent },
              ]}
              numberOfLines={1}
            >
              {btn.label}
            </Text>
            {btn.hint ? (
              <Text
                style={[
                  styles.actionBtnHint,
                  { color: isPrimary ? textOnPrimaryMuted : muted },
                ]}
                numberOfLines={1}
              >
                {btn.hint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  backBtn: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 },
  backBtnText: { fontSize: 13, fontWeight: '700' },

  scrollContent: { padding: 16, gap: 14, paddingBottom: 36 },

  headerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 7,
  },
  headerEyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 14, lineHeight: 21 },
  refreshBtn: { alignSelf: 'flex-start', minHeight: 34, borderRadius: 999, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, marginTop: 4 },
  refreshBtnText: { fontSize: 12, fontWeight: '700' },
  stateText: { fontSize: 13 },
  errorRow: { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 4 },
  errorText: { fontSize: 13 },

  body: { gap: 12 },

  actionsWrap: { marginBottom: 4 },

  actionBarRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  actionBtn: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionBtnLabel: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionBtnHint: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardBody: { fontSize: 13, lineHeight: 20 },
  cardMeta: { fontSize: 12, fontWeight: '700' },

  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  metricLabel: { fontSize: 13 },
  metricValue: { fontSize: 16, fontWeight: '700' },
});
