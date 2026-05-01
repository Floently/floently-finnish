import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

type Props = Record<string, any>;
type LandingTheme = 'dark' | 'light';

function useLandingNav(props: Props) {
  return useMemo(() => {
    function callAny(names: string[], fallback: () => void) {
      for (const name of names) {
        if (typeof props[name] === 'function') {
          props[name]();
          return;
        }
      }
      fallback();
    }

    return {
      start: () => callAny(['onGetStarted', 'onStart', 'onOpenAuth', 'onOpenRegister'], () => router.push('/auth/register' as never)),
      login: () => callAny(['onLogin', 'onOpenLogin', 'onOpenAuth'], () => router.push('/auth/login' as never)),
      pricing: () => callAny(['onOpenBilling', 'onPricing'], () => router.push('/billing/subscription' as never)),
      yki: () => callAny(['onOpenYki', 'onOpenYkiExam'], () => router.push('/yki-exam' as never)),
      professional: () => callAny(['onOpenProfessional', 'onOpenProfessionalFinnish'], () => router.push('/professional' as never)),
      organizations: () => callAny(['onOpenOrganizations'], () => router.push('/for-organizations' as never)),
    };
  }, [props]);
}

export default function LandingRoute(props: Props) {
  const [theme, setTheme] = useState<LandingTheme>('dark');
  const isDark = theme === 'dark';
  const nav = useLandingNav(props);

  const colors = isDark
    ? {
        page: '#071124',
        hero: '#08183A',
        heroSoft: '#10285A',
        card: '#FFFFFF',
        cardMuted: '#EEF4FF',
        text: '#F7FAFF',
        textMuted: '#B8C6E6',
        cardText: '#071124',
        cardSub: '#5B6472',
        border: 'rgba(255,255,255,0.14)',
        primary: '#6387FF',
        accent: '#2DD4BF',
        yellow: '#F0C86D',
        toggleBg: 'rgba(255,255,255,0.13)',
        toggleText: '#FFE8A3',
      }
    : {
        page: '#EFF4FF',
        hero: '#FFFFFF',
        heroSoft: '#E8EEFF',
        card: '#FFFFFF',
        cardMuted: '#F3F7FF',
        text: '#071124',
        textMuted: '#526079',
        cardText: '#071124',
        cardSub: '#5B6472',
        border: '#D8E3F2',
        primary: '#2453D4',
        accent: '#0E9F8C',
        yellow: '#BA7A00',
        toggleBg: '#FFF7DF',
        toggleText: '#BA7A00',
      };

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: colors.page }]}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroShell, { backgroundColor: colors.hero, borderColor: colors.border }]}>
        <Pressable
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
          style={[
            styles.heroThemeToggle,
            {
              backgroundColor: colors.toggleBg,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Toggle landing page light and dark mode"
        >
          <Text style={[styles.heroThemeToggleText, { color: colors.toggleText }]}>
            {isDark ? '☀' : '☾'}
          </Text>
        </Pressable>

        <View style={styles.backdropWordWrap} pointerEvents="none">
          <Text style={[styles.backdropWord, { color: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(36,83,212,0.06)' }]}>
            FLOENTLY
          </Text>
        </View>

        <View style={styles.navbar}>
          <Pressable onPress={nav.start} style={styles.brandRow}>
            <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={[styles.brandText, { color: colors.text }]}>Floently</Text>
          </Pressable>

          <View style={styles.navLinks}>
            <Pressable onPress={nav.yki}>
              <Text style={[styles.navLink, { color: colors.textMuted }]}>YKI Prep</Text>
            </Pressable>
            <Pressable onPress={nav.professional}>
              <Text style={[styles.navLink, { color: colors.textMuted }]}>Professional Finnish</Text>
            </Pressable>
            <Pressable onPress={nav.organizations}>
              <Text style={[styles.navLink, { color: colors.textMuted }]}>Organizations</Text>
            </Pressable>
            <Pressable onPress={nav.pricing}>
              <Text style={[styles.navLink, { color: colors.textMuted }]}>Pricing</Text>
            </Pressable>
          </View>

          <View style={styles.navActions}>
            <Pressable onPress={nav.login}>
              <Text style={[styles.loginText, { color: colors.text }]}>Log in</Text>
            </Pressable>
            <Pressable onPress={nav.start} style={[styles.navCta, { backgroundColor: colors.primary }]}>
              <Text style={styles.navCtaText}>Start free</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroGrid}>
          <View style={styles.heroCopy}>
            <View style={[styles.eyebrowPill, { backgroundColor: isDark ? 'rgba(99,135,255,0.18)' : '#E8EEFF' }]}>
              <Text style={[styles.eyebrowText, { color: colors.primary }]}>AI-powered Finnish practice</Text>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Build Finnish confidence for work, daily life, and YKI
            </Text>

            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
              Practise realistic roleplays, prepare for the YKI exam, improve speaking, and revise the exact phrases you need in Finland.
            </Text>

            <View style={styles.ctaRow}>
              <Pressable onPress={nav.start} style={[styles.primaryCta, { backgroundColor: colors.primary }]}>
                <Text style={styles.primaryCtaText}>Start practising</Text>
                <Text style={styles.primaryCtaArrow}>→</Text>
              </Pressable>

              <Pressable onPress={nav.yki} style={[styles.secondaryCta, { borderColor: colors.border }]}>
                <Text style={[styles.secondaryCtaText, { color: colors.text }]}>Explore YKI prep</Text>
              </Pressable>
            </View>

            <View style={styles.proofRow}>
              {['Roleplays', 'YKI simulation', 'Speaking feedback', 'Phrase bank'].map((item) => (
                <View
                  key={item}
                  style={[
                    styles.proofPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.proofText, { color: colors.textMuted }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.heroVisual}>
            <View style={[styles.glowOne, { backgroundColor: colors.primary }]} />
            <View style={[styles.glowTwo, { backgroundColor: colors.accent }]} />

            <View style={[styles.roleplayCard, styles.floatCard, { backgroundColor: colors.card }]}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={[styles.cardKicker, { color: colors.primary }]}>Live roleplay</Text>
                  <Text style={[styles.cardTitle, { color: colors.cardText }]}>Patient interview</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
              </View>
              <Text style={[styles.dialogueBubble, { backgroundColor: colors.cardMuted, color: colors.cardText }]}>
                Hyvää päivää. Miten voin auttaa?
              </Text>
              <View style={styles.waveRow}>
                {[28, 44, 34, 58, 40, 66, 36, 50].map((h, index) => (
                  <View key={index} style={[styles.waveBar, { height: h, backgroundColor: colors.primary }]} />
                ))}
              </View>
            </View>

            <View style={[styles.ykiCard, styles.floatCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardKicker, { color: colors.yellow }]}>YKI readiness</Text>
              <Text style={[styles.bigMetric, { color: colors.cardText }]}>B1–B2</Text>
              <Text style={[styles.cardSmall, { color: colors.cardSub }]}>Reading · Writing · Listening · Speaking</Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.cardMuted }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
              </View>
            </View>

            <View style={[styles.phraseCard, styles.floatCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardKicker, { color: colors.accent }]}>Phrase bank</Text>
              <Text style={[styles.cardTitle, { color: colors.cardText }]}>Work-ready Finnish</Text>
              <Text style={[styles.cardSmall, { color: colors.cardSub }]}>Save difficult expressions and review them later.</Text>
            </View>

            <View style={[styles.miniStatsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF', borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>sessions this week</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.belowGrid}>
        {[
          ['For YKI learners', 'Build exam confidence with realistic tasks and guided practice.'],
          ['For professionals', 'Practise healthcare, service, and workplace conversations.'],
          ['For organizations', 'Support employees, residents, and programme learners with scalable Finnish practice.'],
        ].map(([title, body]) => (
          <View key={title} style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.cardText }]}>{title}</Text>
            <Text style={[styles.infoBody, { color: colors.cardSub }]}>{body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  pageContent: {
    padding: 18,
    gap: 18,
    paddingBottom: 42,
  },
  heroShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 34,
    borderWidth: 1,
    padding: 18,
    minHeight: 640,
  },
  heroThemeToggle: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 50,
    elevation: 20,
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  heroThemeToggleText: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  backdropWordWrap: {
    position: 'absolute',
    top: 88,
    left: -22,
    right: -22,
    alignItems: 'center',
  },
  backdropWord: {
    fontSize: 82,
    fontWeight: '900',
    letterSpacing: 4,
  },
  navbar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingRight: 44,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  navLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginText: {
    fontSize: 13,
    fontWeight: '900',
  },
  navCta: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 58,
  },
  heroCopy: {
    flex: 1,
    minWidth: 280,
    maxWidth: 590,
    gap: 18,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: -1.3,
  },
  heroSubtitle: {
    maxWidth: 560,
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  primaryCta: {
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryCtaArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryCta: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    fontSize: 15,
    fontWeight: '900',
  },
  proofRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  proofPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  proofText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroVisual: {
    flex: 1,
    minWidth: 310,
    minHeight: 430,
    position: 'relative',
  },
  glowOne: {
    position: 'absolute',
    top: 30,
    right: 50,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.22,
  },
  glowTwo: {
    position: 'absolute',
    bottom: 24,
    left: 28,
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.18,
  },
  floatCard: {
    position: 'absolute',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  roleplayCard: {
    top: 28,
    right: 28,
    width: 280,
    gap: 14,
  },
  ykiCard: {
    left: 12,
    bottom: 58,
    width: 220,
    gap: 8,
  },
  phraseCard: {
    right: 12,
    bottom: 8,
    width: 230,
    gap: 7,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  dialogueBubble: {
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  waveRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  waveBar: {
    width: 12,
    borderRadius: 999,
    opacity: 0.86,
  },
  bigMetric: {
    fontSize: 34,
    fontWeight: '900',
  },
  cardSmall: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    width: '72%',
    height: '100%',
    borderRadius: 999,
  },
  miniStatsCard: {
    position: 'absolute',
    top: 210,
    left: 38,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    minWidth: 150,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  belowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  infoCard: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});
