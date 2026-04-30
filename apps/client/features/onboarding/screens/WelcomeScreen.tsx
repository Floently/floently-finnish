/**
 * WelcomeScreen — premium landing for Floently Finnish.
 *
 * Positioning thesis: YKI is the gateway, not the destination. The product helps
 * people integrate into Finnish society — pass the official language exam, work
 * inside Finnish organizations, and live as a recognized member of Finnish life.
 * YKI and the workplace are the two recognized gates; this app addresses both
 * because they're the same goal.
 *
 * Design principles applied:
 *   • Type-first hero. No images, no stock illustrations.
 *   • Generous whitespace and a single primary action.
 *   • Specific, quietly confident copy. No marketing puffery.
 *   • Two-audience footer: individuals route directly into onboarding; B2B
 *     traffic (employers, municipalities) routes to /for-organizations.
 *   • Subtle motion only — single fade-in, no Lottie, no shimmer, no gradient
 *     animation. The premium feel comes from typography and pacing, not effects.
 *   • Honest positioning. No fabricated stats, no fake testimonials, no
 *     "trusted by" rows we cannot back up.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { onboardingRoutes } from '../routes';
import { spacing } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useTranslator } from '../../i18n';

export default function WelcomeScreen() {
  const { t } = useTranslator();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

  // One subtle entrance fade. Nothing more. The point of premium here is to
  // resist the temptation to over-animate.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const enterStyle = useMemo(
    () => ({
      opacity: enter,
      transform: [
        {
          translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
        },
      ],
    }),
    [enter],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.container, enterStyle]}>
          {/* Eyebrow — quiet brand voice, no logo competing */}
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, { color: palette.primary }]}>{t('onboardingWelcomeEyebrow')}</Text>
            <View style={[styles.eyebrowDot, { backgroundColor: palette.accent }]} />
            <Text style={[styles.eyebrowMeta, { color: palette.textMuted }]}>{t('onboardingWelcomeFinland')}</Text>
          </View>

          {/* Hero — editorial typography. Three lines, deliberate breaks. */}
          <View style={styles.heroBlock}>
            <Text style={[styles.heroLine, { color: palette.text }]}>{t('onboardingWelcomeHeroLine1')}</Text>
            <Text style={[styles.heroLine, { color: palette.text }]}>{t('onboardingWelcomeHeroLine2')}</Text>
            <Text style={[styles.heroLine, { color: palette.accent }]}>{t('onboardingWelcomeHeroLine3')}</Text>
          </View>

          {/* Subhead — specific positioning, names the niche directly */}
          <Text style={[styles.subhead, { color: palette.textMuted }]}>
            {t('onboardingWelcomeSubhead')}
          </Text>

          {/* Three pillars — what makes this app different. Quietly stated. */}
          <View style={styles.pillarsBlock}>
            <Pillar
              palette={palette}
              label={t('onboardingWelcomePillar1Title')}
              body={t('onboardingWelcomePillar1Body')}
            />
            <Pillar
              palette={palette}
              label={t('onboardingWelcomePillar2Title')}
              body={t('onboardingWelcomePillar2Body')}
            />
            <Pillar
              palette={palette}
              label={t('onboardingWelcomePillar3Title')}
              body={t('onboardingWelcomePillar3Body')}
            />
          </View>

          {/* Spacer pushes CTAs to the lower portion */}
          <View style={{ flex: 1, minHeight: spacing.xxl }} />

          {/* Primary CTA — single, decisive */}
          <View style={styles.ctaBlock}>
            <Text style={[styles.ctaSubtext, { color: palette.textMuted }]}>
              {t('onboardingWelcomeCtaSubtext')}
            </Text>
            <Pressable
              onPress={() => router.push(onboardingRoutes.intent)}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('onboardingWelcomeGetStarted')}
            >
              <Text style={[styles.primaryBtnLabel, { color: textOnPrimary }]}>{t('onboardingWelcomeGetStarted')}</Text>
            </Pressable>

            {/* Secondary — sign-in for returning users */}
            <Pressable
              onPress={() => router.push(onboardingRoutes.login as never)}
              style={styles.secondaryRow}
              accessibilityRole="link"
                accessibilityLabel={t('onboardingWelcomeSignIn')}
              >
              <Text style={[styles.secondaryText, { color: palette.textMuted }]}>
                {t('onboardingWelcomeAlreadyHaveAccount')}{' '}
                <Text style={[styles.secondaryStrong, { color: palette.primary }]}>{t('onboardingWelcomeSignIn')}</Text>
              </Text>
            </Pressable>
          </View>

          {/* Org footer — the B2B audience handshake. Quiet, single line. */}
          <View style={[styles.orgFooter, { borderColor: palette.border }]}>
            <Text style={[styles.orgFooterTitle, { color: palette.text }]}>{t('onboardingWelcomeForEmployersTitle')}</Text>
            <Text style={[styles.orgFooterBody, { color: palette.textMuted }]}>{t('onboardingWelcomeForEmployersBody')}</Text>
            <Pressable
              onPress={() => router.push('/for-organizations' as never)}
              style={styles.orgFooterLink}
              accessibilityRole="link"
              accessibilityLabel={t('onboardingWelcomeOrgAccessAccessibility')}
            >
              <Text style={[styles.orgFooterLinkText, { color: palette.accent }]}>{t('onboardingWelcomeOrgAccessLabel')} →</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Pillar — small reusable copy block ──────────────────────────────────────

type PillarProps = {
  label: string;
  body: string;
  palette: ReturnType<typeof getFloentlyPalette>;
};

function Pillar({ label, body, palette }: PillarProps) {
  return (
    <View style={styles.pillar}>
      <View style={[styles.pillarRule, { backgroundColor: palette.accent }]} />
      <View style={styles.pillarText}>
        <Text style={[styles.pillarLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.pillarBody, { color: palette.textMuted }]}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // Eyebrow
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  eyebrowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eyebrowMeta: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },

  // Hero
  heroBlock: {
    marginBottom: spacing.lg,
  },
  heroLine: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.6,
  },

  // Subhead
  subhead: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.xxl,
    fontWeight: '400',
    maxWidth: 480,
  },

  // Pillars
  pillarsBlock: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pillarRule: {
    width: 2,
    height: 26,
    borderRadius: 1,
    marginTop: 2,
  },
  pillarText: {
    flex: 1,
    gap: 4,
  },
  pillarLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  pillarBody: {
    fontSize: 13,
    lineHeight: 19,
  },

  // CTA
  ctaBlock: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  ctaSubtext: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryRow: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 36,
  },
  secondaryText: {
    fontSize: 14,
  },
  secondaryStrong: {
    fontWeight: '700',
  },

  // Org footer
  orgFooter: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    gap: 4,
  },
  orgFooterTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  orgFooterBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  orgFooterLink: {
    paddingVertical: 4,
  },
  orgFooterLinkText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
