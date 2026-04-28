/**
 * ForOrganizationsScreen — premium B2B page.
 *
 * Honest framing: this is currently a pilot-partners surface, not a self-serve
 * enterprise product. The app does not yet have org accounts, cohort dashboards,
 * SSO, or enterprise billing. We do not pretend it does. We invite pilots.
 *
 * Two audiences addressed:
 *   1. Employers (hospitals, clinics, care providers, recruiting firms importing
 *      international healthcare workers)
 *   2. Municipalities (integration offices, city programmes for new residents)
 *
 * Both share the same underlying need — get incoming Finnish-second-language
 * speakers ready to pass YKI and operate in Finnish workplaces. The page treats
 * them as a single buyer pattern with two flavors of context.
 *
 * Design: type-first, no stock photos, no fake logos, no fabricated testimonials.
 * The premium feel is supposed to come from restraint and specificity, not
 * decoration.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { spacing } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';

const PILOT_CONTACT_EMAIL = 'pilots@floently.com';

export default function ForOrganizationsScreen() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

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
      transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
    }),
    [enter],
  );

  const handleContact = () => {
    const subject = encodeURIComponent('Floently — pilot interest');
    const body = encodeURIComponent(
      'Hello,\n\nWe are interested in piloting Floently for our team or residents.\n\nOrganization:\nNumber of users (approx):\nPrimary need (YKI, workplace Finnish, both):\n\n— ',
    );
    void Linking.openURL(`mailto:${PILOT_CONTACT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar — back link */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backLink}
            accessibilityRole="link"
            accessibilityLabel="Back"
          >
            <Text style={[styles.backText, { color: palette.textMuted }]}>← Back</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.container, enterStyle]}>
          {/* Eyebrow */}
          <View style={styles.eyebrowRow}>
            <Text style={[styles.eyebrow, { color: palette.primary }]}>FLOENTLY</Text>
            <View style={[styles.eyebrowDot, { backgroundColor: palette.accent }]} />
            <Text style={[styles.eyebrowMeta, { color: palette.textMuted }]}>For organizations</Text>
          </View>

          {/* Hero */}
          <View style={styles.heroBlock}>
            <Text style={[styles.heroLine, { color: palette.text }]}>Get your incoming staff</Text>
            <Text style={[styles.heroLine, { color: palette.text }]}>and residents ready</Text>
            <Text style={[styles.heroLine, { color: palette.accent }]}>to work in Finnish.</Text>
          </View>

          <Text style={[styles.subhead, { color: palette.textMuted }]}>
            Floently helps healthcare employers and municipalities prepare international hires and new
            residents for the YKI exam and the Finnish workplace — the two recognized gates to
            registered, integrated working life in Finland.
          </Text>

          {/* Two audiences — explicit, addressed in parallel */}
          <View style={styles.audienceBlock}>
            <AudienceCard
              palette={palette}
              eyebrow="EMPLOYERS"
              title="Hospitals, clinics, and care providers"
              body="Bring nurses, doctors, and practical nurses from abroad onto the floor faster. Practice for YKI, plus the workplace Finnish that shift handovers, patient updates, and team meetings actually require."
              points={[
                'YKI exam preparation aligned to professional registration timelines',
                'Workplace roleplay scenarios specific to nursing, medicine, and practical care',
                'Daily speaking practice your staff can fit between shifts',
              ]}
            />

            <AudienceCard
              palette={palette}
              eyebrow="MUNICIPALITIES"
              title="Integration offices and city programmes"
              body="Help new residents move from beginner Finnish to YKI-ready and into the local workforce. Support the language path that the rest of integration depends on."
              points={[
                'YKI as the recognized milestone — citizenship, residence, professional gates',
                'Workplace Finnish for the sectors that hire new residents',
                'A path that respects how busy adult learners actually study',
              ]}
            />
          </View>

          {/* What an org pilot looks like — honest about scope */}
          <View style={[styles.pilotBlock, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.pilotEyebrow, { color: palette.accent }]}>EARLY ACCESS · PILOT PARTNERS</Text>
            <Text style={[styles.pilotTitle, { color: palette.text }]}>
              We are taking a small number of pilot partners.
            </Text>
            <Text style={[styles.pilotBody, { color: palette.textMuted }]}>
              Floently is in active development. Organizational accounts, cohort visibility,
              and enterprise billing are not yet self-serve. We work directly with each pilot to
              fit the language path to your hires or residents — and to learn from how they use it.
            </Text>

            <View style={styles.pilotBullets}>
              <PilotBullet palette={palette} text="Direct setup with our team" />
              <PilotBullet palette={palette} text="Negotiated pilot pricing" />
              <PilotBullet palette={palette} text="Feedback shapes what we build next" />
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaBlock}>
            <Pressable
              onPress={handleContact}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Contact us about a pilot"
            >
              <Text style={[styles.primaryBtnLabel, { color: textOnPrimary }]}>
                Contact us about a pilot
              </Text>
            </Pressable>
            <Text style={[styles.ctaSubtext, { color: palette.textMuted }]}>
              Reply within two working days · {PILOT_CONTACT_EMAIL}
            </Text>
          </View>

          {/* What's not in scope yet — honest disclosure */}
          <View style={[styles.notYetBlock, { borderColor: palette.border }]}>
            <Text style={[styles.notYetTitle, { color: palette.textMuted }]}>What's not yet in scope</Text>
            <Text style={[styles.notYetBody, { color: palette.textSoft }]}>
              Self-serve organizational accounts. Cohort analytics dashboards. Single sign-on. Multi-seat
              billing through procurement systems. We are building toward these — pilots help us prioritize.
            </Text>
          </View>

          {/* Individual users link back */}
          <Pressable
            onPress={() => router.push('/onboarding/welcome' as never)}
            style={styles.indivLink}
            accessibilityRole="link"
            accessibilityLabel="Are you an individual learner"
          >
            <Text style={[styles.indivLinkText, { color: palette.textMuted }]}>
              Looking for an individual account?{' '}
              <Text style={[styles.indivLinkStrong, { color: palette.primary }]}>Start here →</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── AudienceCard ────────────────────────────────────────────────────────────

type AudienceCardProps = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  palette: ReturnType<typeof getFloentlyPalette>;
};

function AudienceCard({ eyebrow, title, body, points, palette }: AudienceCardProps) {
  return (
    <View style={[styles.audienceCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.audienceEyebrow, { color: palette.primary }]}>{eyebrow}</Text>
      <Text style={[styles.audienceTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.audienceBody, { color: palette.textMuted }]}>{body}</Text>
      <View style={styles.audiencePoints}>
        {points.map((p) => (
          <View key={p} style={styles.audiencePoint}>
            <View style={[styles.audiencePointDot, { backgroundColor: palette.accent }]} />
            <Text style={[styles.audiencePointText, { color: palette.text }]}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PilotBullet({ text, palette }: { text: string; palette: ReturnType<typeof getFloentlyPalette> }) {
  return (
    <View style={styles.pilotBullet}>
      <Text style={[styles.pilotBulletDot, { color: palette.accent }]}>✓</Text>
      <Text style={[styles.pilotBulletText, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backLink: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },

  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
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

  heroBlock: {
    marginBottom: spacing.xs,
  },
  heroLine: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  subhead: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.lg,
    fontWeight: '400',
    maxWidth: 520,
  },

  audienceBlock: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  audienceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  audienceEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  audienceTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 25,
  },
  audienceBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  audiencePoints: {
    gap: 8,
    marginTop: 6,
  },
  audiencePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  audiencePointDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  audiencePointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  pilotBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pilotEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  pilotTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 25,
  },
  pilotBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  pilotBullets: {
    gap: 8,
    marginTop: 8,
  },
  pilotBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pilotBulletDot: {
    fontSize: 14,
    fontWeight: '900',
    width: 16,
  },
  pilotBulletText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },

  ctaBlock: {
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  ctaSubtext: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },

  notYetBlock: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: 4,
  },
  notYetTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  notYetBody: {
    fontSize: 12,
    lineHeight: 18,
  },

  indivLink: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 36,
  },
  indivLinkText: {
    fontSize: 13,
  },
  indivLinkStrong: {
    fontWeight: '700',
  },
});
