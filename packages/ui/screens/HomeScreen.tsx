import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import AppScaffold from '../components/AppScaffold';
import PageHeader from '../components/PageHeader';
import SmartHintPopup from '../components/SmartHintPopup';
import { getFloentlyPalette, type FloentlyThemeMode } from '../theme/floentlyPalette';

const D = {
  bg: '#0C1222',
  surface: '#111B30',
  raised: '#16233E',
  border: '#1E2E47',
  text: '#F0F5FF',
  muted: '#8EA3C3',
  soft: '#5C7299',
  primary: '#4F7FFF',
  accent: '#F0C86D',
  accentDim: 'rgba(240,200,109,0.12)',
  success: '#3EC58A',
  successDim: 'rgba(62,197,138,0.12)',
  yki: '#A78BFA',
  speak: '#F0A436',
  pro: '#2DD4BF',
};

function formatGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Hyvää huomenta';
  if (h < 17) return 'Hyvää päivää';
  return 'Hyvää iltaa';
}

type Skill = { label: string; pct: number; color: string };

type Props = {
  isAuthenticated?: boolean;
  userName?: string;
  userEmail?: string;
  avatarUri?: string | null;
  themeMode?: FloentlyThemeMode;
  onToggleTheme?: () => void;
  onAuthAction?: () => void;
  onSelectMode?: (mode: string) => void;
  accessState?: {
    learn: boolean;
    yki: boolean;
    professional: boolean;
    professionalLabel?: string;
    activeContext?: 'none' | 'yki' | 'doctor' | 'nurse' | 'practical_nurse';
    bundle?: boolean;
    isPreview?: boolean;
    previewPath?: 'yki' | 'doctor' | 'nurse' | 'practical_nurse' | null;
  };
  onOpenMenu?: () => void;
  streakDays?: number;
  cardsDue?: number;
  totalCards?: number;
  estimatedLevel?: string;
  skills?: Skill[];
};

const DEFAULT_SKILLS: Skill[] = [
  { label: 'Listening', pct: 72, color: D.primary },
  { label: 'Reading', pct: 65, color: D.yki },
  { label: 'Writing', pct: 48, color: D.accent },
  { label: 'Speaking', pct: 55, color: D.speak },
];

type EmberSpec = {
  left: `${number}%`;
  size: number;
  rise: number;
  drift: number;
  duration: number;
  delay: number;
  color: string;
  opacity: number;
  bottom: number;
};

type SmokeSpec = {
  left: `${number}%`;
  width: number;
  height: number;
  rise: number;
  drift: number;
  duration: number;
  delay: number;
  bottom: number;
};

const EMBERS: EmberSpec[] = [
  { left: '3%', size: 3, rise: 520, drift: 16, duration: 4100, delay: 0, color: '#FFD787', opacity: 0.68, bottom: 10 },
  { left: '6%', size: 4, rise: 620, drift: 20, duration: 5000, delay: 350, color: '#F0C86D', opacity: 0.82, bottom: 12 },
  { left: '10%', size: 5, rise: 700, drift: 22, duration: 5600, delay: 850, color: '#F0A436', opacity: 0.88, bottom: 14 },
  { left: '15%', size: 3, rise: 560, drift: 16, duration: 4300, delay: 1250, color: '#FFD787', opacity: 0.66, bottom: 16 },
  { left: '19%', size: 4, rise: 650, drift: 18, duration: 5100, delay: 650, color: '#FFC65A', opacity: 0.78, bottom: 10 },
  { left: '24%', size: 6, rise: 760, drift: 24, duration: 6000, delay: 250, color: '#F08E2D', opacity: 0.84, bottom: 12 },
  { left: '29%', size: 3, rise: 560, drift: 14, duration: 4200, delay: 1550, color: '#FFD787', opacity: 0.62, bottom: 18 },
  { left: '34%', size: 5, rise: 700, drift: 22, duration: 5600, delay: 900, color: '#F0C86D', opacity: 0.82, bottom: 12 },
  { left: '39%', size: 4, rise: 650, drift: 18, duration: 5000, delay: 450, color: '#F0A436', opacity: 0.76, bottom: 10 },
  { left: '44%', size: 6, rise: 780, drift: 26, duration: 6200, delay: 1300, color: '#F08E2D', opacity: 0.82, bottom: 14 },
  { left: '49%', size: 3, rise: 540, drift: 14, duration: 4100, delay: 1750, color: '#FFD787', opacity: 0.6, bottom: 20 },
  { left: '54%', size: 5, rise: 710, drift: 20, duration: 5700, delay: 700, color: '#FFC65A', opacity: 0.8, bottom: 9 },
  { left: '59%', size: 4, rise: 660, drift: 16, duration: 5050, delay: 300, color: '#F0C86D', opacity: 0.74, bottom: 12 },
  { left: '64%', size: 6, rise: 790, drift: 24, duration: 6300, delay: 1150, color: '#F0A436', opacity: 0.82, bottom: 14 },
  { left: '69%', size: 3, rise: 560, drift: 12, duration: 4300, delay: 1950, color: '#FFD787', opacity: 0.58, bottom: 18 },
  { left: '74%', size: 5, rise: 720, drift: 18, duration: 5750, delay: 850, color: '#FFC65A', opacity: 0.76, bottom: 10 },
  { left: '79%', size: 4, rise: 650, drift: 15, duration: 5000, delay: 1450, color: '#F0C86D', opacity: 0.7, bottom: 12 },
  { left: '84%', size: 6, rise: 760, drift: 22, duration: 6100, delay: 550, color: '#F08E2D', opacity: 0.78, bottom: 14 },
  { left: '89%', size: 3, rise: 520, drift: 10, duration: 4000, delay: 2100, color: '#FFD787', opacity: 0.54, bottom: 16 },
  { left: '94%', size: 4, rise: 610, drift: 16, duration: 4900, delay: 950, color: '#F0C86D', opacity: 0.68, bottom: 10 },
];

const SMOKE: SmokeSpec[] = [
  { left: '8%', width: 52, height: 180, rise: 280, drift: 18, duration: 6500, delay: 0, bottom: -8 },
  { left: '24%', width: 66, height: 230, rise: 360, drift: 24, duration: 7800, delay: 1200, bottom: -16 },
  { left: '43%', width: 58, height: 210, rise: 330, drift: 20, duration: 7200, delay: 2500, bottom: -10 },
  { left: '61%', width: 54, height: 190, rise: 300, drift: 18, duration: 6900, delay: 900, bottom: -6 },
  { left: '78%', width: 70, height: 240, rise: 380, drift: 26, duration: 8000, delay: 1800, bottom: -18 },
];

function repeatingTiming(
  value: Animated.Value,
  duration: number,
  delay = 0,
  toValue = 1,
  easing = Easing.inOut(Easing.sin),
) {
  let mounted = true;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    if (!mounted) return;
    value.setValue(0);
    Animated.timing(value, {
      toValue,
      duration,
      easing,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && mounted) {
        timeoutId = setTimeout(run, delay);
      }
    });
  };

  timeoutId = setTimeout(run, delay);

  return () => {
    mounted = false;
    if (timeoutId) clearTimeout(timeoutId);
    value.stopAnimation();
  };
}

function EmberParticle({ left, size, rise, drift, duration, delay, color, opacity: baseOpacity, bottom }: EmberSpec) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => repeatingTiming(progress, duration, delay), [delay, duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -rise],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, drift, -drift * 0.55],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.72, 1],
    outputRange: [0, baseOpacity, baseOpacity * 0.38, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.72, 1, 1.22],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ember,
        {
          left,
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

function SmokeWisp({ left, width, height, rise, drift, duration, delay, bottom }: SmokeSpec) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => repeatingTiming(progress, duration, delay), [delay, duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -rise],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, drift, -drift * 0.4],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.7, 1],
    outputRange: [0, 0.055, 0.03, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.14],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.smoke,
        {
          left,
          bottom,
          width,
          height,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

function DriftGlow({
  style,
  duration,
  x = 18,
  y = 12,
  delay = 0,
}: {
  style: object;
  duration: number;
  x?: number;
  y?: number;
  delay?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => repeatingTiming(progress, duration, delay), [delay, duration, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, x, -x * 0.5],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, -y, y * 0.35],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.06, 0.98],
              }),
            },
          ],
          opacity: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.72, 1, 0.74],
          }),
        },
      ]}
    />
  );
}

function EmberBackground() {
  return (
    <View pointerEvents="none" style={styles.emberLayer}>
      <DriftGlow style={styles.fireGlowPrimary} duration={9000} x={18} y={12} />
      <DriftGlow style={styles.fireGlowSecondary} duration={10800} x={24} y={16} delay={700} />
      <DriftGlow style={styles.fireGlowAccent} duration={9800} x={14} y={10} delay={1400} />
      <DriftGlow style={styles.fireGlowSoft} duration={8600} x={16} y={8} delay={300} />

      {SMOKE.map((item, index) => (
        <SmokeWisp key={`smoke-${index}`} {...item} />
      ))}

      {EMBERS.map((ember, index) => (
        <EmberParticle key={`ember-${index}`} {...ember} />
      ))}
    </View>
  );
}

function AnimatedSection({
  animation,
  children,
}: {
  animation: Animated.Value;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
          {
            scale: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.985, 1],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function SkillMeter({
  label,
  pct,
  color,
  muted,
  soft,
  raised,
}: {
  label: string;
  pct: number;
  color: string;
  muted: string;
  soft: string;
  raised: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: pct,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.skillRow}>
      <Text style={[styles.skillLabel, { color: muted }]}>{label}</Text>
      <View style={[styles.skillTrack, { backgroundColor: raised }]}>
        <Animated.View style={[styles.skillFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[styles.skillPct, { color: soft }]}>{pct}%</Text>
    </View>
  );
}

export default function HomeScreen({
  isAuthenticated = false,
  userName = 'Learner',
  themeMode = 'light',
  onSelectMode,
  onOpenMenu,
  accessState,
  streakDays = 0,
  cardsDue = 0,
  totalCards = 0,
  estimatedLevel = 'B1',
  skills = DEFAULT_SKILLS,
}: Props) {
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  const [showHint, setShowHint] = useState(true);
  const [greeting, setGreeting] = useState(formatGreeting());

  const heroAnim = useRef(new Animated.Value(0)).current;
  const quickAnim = useRef(new Animated.Value(0)).current;
  const skillsAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const guideAnim = useRef(new Animated.Value(0)).current;
  const heroSweep = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setGreeting(formatGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    heroAnim.setValue(0);
    quickAnim.setValue(0);
    skillsAnim.setValue(0);
    statsAnim.setValue(0);
    guideAnim.setValue(0);

    Animated.stagger(95, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(quickAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(skillsAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(guideAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [guideAnim, heroAnim, quickAnim, skillsAnim, statsAnim]);

  useEffect(() => {
    const stopSweep = repeatingTiming(heroSweep, 2800, 3600);
    const stopPulse = repeatingTiming(livePulse, 2400, 0);

    return () => {
      stopSweep();
      stopPulse();
    };
  }, [heroSweep, livePulse]);

  const surface = isDark ? D.surface : palette.surface;
  const raised = isDark ? D.raised : palette.surfaceMuted;
  const border = isDark ? D.border : palette.border;
  const text = isDark ? D.text : palette.text;
  const muted = isDark ? D.muted : palette.textMuted;
  const soft = isDark ? D.soft : palette.textSoft;
  const primary = isDark ? D.primary : palette.primary;

  const quickActions = [
    {
      label: 'Vocabulary & roleplay',
      sub: accessState?.isPreview ? 'Locked during preview — upgrade to open the full learning loop.' : accessState?.learn ? 'Cards, phrase support, and guided practice' : 'Unlock core learning tools',
      tag: accessState?.isPreview ? 'Preview' : accessState?.learn ? 'Learn' : '🔒 Locked',
      color: D.primary,
      mode: 'learn',
      locked: !accessState?.learn,
    },
    {
      label: 'Workplace scenarios',
      sub: accessState?.isPreview && accessState?.previewPath !== 'yki' ? 'One guided workplace conversation is available in preview mode.' : accessState?.learn ? 'Instructions, handovers, and reporting' : 'Unlock work communication practice',
      tag: accessState?.isPreview && accessState?.previewPath !== 'yki' ? 'Preview' : accessState?.learn ? 'Scenarios' : '🔒 Locked',
      color: D.speak,
      mode: 'scenarios',
      locked: !accessState?.learn,
    },
    {
      label: 'YKI Prep',
      sub: accessState?.isPreview && accessState?.previewPath === 'yki' ? 'Practice sampler available. Full exam remains locked.' : accessState?.yki ? 'Practice and exam simulation' : 'Available in YKI and bundle plans',
      tag: accessState?.isPreview && accessState?.previewPath === 'yki' ? 'Preview' : accessState?.yki ? 'YKI' : '🔒 Locked',
      color: D.yki,
      mode: 'yki',
      locked: !accessState?.yki,
    },
    {
      label: accessState?.professionalLabel ?? 'My Profession',
      sub: accessState?.isPreview && accessState?.previewPath && accessState?.previewPath !== 'yki' ? 'One profession sampler is available. Upgrade to unlock the full pathway.' : accessState?.professional ? 'Vocabulary, interview, and work-ready Finnish' : 'Choose Doctor, Nurse, or Practical Nurse',
      tag: accessState?.isPreview && accessState?.previewPath && accessState?.previewPath !== 'yki' ? 'Preview' : accessState?.professional ? 'Profession' : '🔒 Locked',
      color: D.pro,
      mode: 'work',
      locked: !accessState?.professional,
    },
  ];

  const pathwayStatus = accessState?.isPreview
    ? `Free preview active — ${accessState?.previewPath === 'yki' ? 'YKI sampler unlocked with the full exam still locked.' : 'one profession pathway and one guided conversation are available in preview mode.'}`
    : accessState?.bundle
    ? 'Bundle pathway active — continue YKI Prep or your profession track today.'
    : accessState?.yki && accessState?.professional
      ? 'YKI and profession access are both active. Choose the pathway that needs attention most.'
      : accessState?.yki
        ? 'YKI pathway active — keep exam readiness moving with short daily work.'
        : accessState?.professional
          ? `${accessState.professionalLabel ?? 'Professional'} pathway active — keep work-ready Finnish moving today.`
          : 'Choose a plan to unlock YKI Prep or a profession pathway.';

  const completedPct =
    totalCards > 0 ? Math.round(((totalCards - cardsDue) / totalCards) * 100) : 100;

  return (
    <>
      <AppScaffold
        allowScroll
        themeMode={themeMode}
        header={
          <PageHeader
            themeMode={themeMode}
            eyebrow="KieliTaika"
            showEyebrow={false}
            showLogo
            title={`${greeting}, ${userName}`}
            subtitle={
              cardsDue > 0
                ? `${cardsDue} review item${cardsDue !== 1 ? 's' : ''} waiting. Keep the language-to-work pathway moving with one focused task.`
                : 'All caught up! Choose the pathway that needs attention next.'
            }
            pulseMenu
            onMenuPress={onOpenMenu}
          />
        }
      >
        <View style={styles.page}>
          <EmberBackground />

          <AnimatedSection animation={heroAnim}>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? '#0F1F45' : palette.primarySurface,
                  borderColor: isDark ? '#1C2F5A' : palette.border,
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heroSweep,
                  {
                    opacity: heroSweep.interpolate({
                      inputRange: [0, 0.18, 0.7, 1],
                      outputRange: [0, 0.34, 0.16, 0],
                    }),
                    transform: [
                      {
                        translateX: heroSweep.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-240, 300],
                        }),
                      },
                      { rotate: '12deg' },
                    ],
                  },
                ]}
              />

              <View style={styles.heroAccentLine} />

              <View style={styles.heroLeft}>
                <View style={styles.heroTopRow}>
                  <Text style={[styles.heroEyebrow, { color: primary }]}>Language to work</Text>

                  <Animated.View
                    style={[
                      styles.liveBadge,
                      {
                        backgroundColor: D.successDim,
                        borderColor: 'rgba(62,197,138,0.20)',
                        transform: [
                          {
                            scale: livePulse.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.045, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.liveDot,
                        {
                          opacity: livePulse.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.8, 1, 0.8],
                          }),
                        },
                      ]}
                    />
                    <Text style={styles.liveText}>Momentum live</Text>
                  </Animated.View>
                </View>

                <Text style={[styles.heroTitle, { color: text }]}>Next best step</Text>
                <Text style={[styles.heroSub, { color: muted }]}>
                  {pathwayStatus}
                </Text>

                <Pressable
                  onPress={() => onSelectMode?.('learn')}
                  style={[styles.heroCta, { backgroundColor: primary }]}
                >
                  <Text style={styles.heroCtaText}>
                    {accessState?.learn ? 'Continue pathway' : 'Choose plan'} →
                  </Text>
                </Pressable>
              </View>

              <View style={styles.heroRing}>
                <View style={[styles.ringOuter, { borderColor: raised }]}>
                  <View style={[styles.ringInner, { borderColor: primary }]} />
                  <Text style={[styles.ringPct, { color: text }]}>{completedPct}%</Text>
                </View>

                {streakDays > 0 && (
                  <View
                    style={[
                      styles.streakBadge,
                      {
                        backgroundColor: D.accentDim,
                        borderColor: 'rgba(240,200,109,0.25)',
                      },
                    ]}
                  >
                    <Text style={styles.streakFire}>🔥</Text>
                    <Text style={[styles.streakNum, { color: D.accent }]}>{streakDays}</Text>
                  </View>
                )}
              </View>
            </View>
          </AnimatedSection>

          <AnimatedSection animation={quickAnim}>
            <View>
              <Text style={[styles.sectionLabel, { color: soft }]}>Pathways</Text>
              <View style={styles.quickGrid}>
                {quickActions.map((qa) => (
                  <Pressable
                    key={qa.label}
                    onPress={() => onSelectMode?.(qa.mode)}
                    style={({ pressed }) => [
                      styles.quickCard,
                      { backgroundColor: surface, borderColor: border },
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <View style={[styles.quickDot, { backgroundColor: `${qa.color}20` }]}>
                      <View style={[styles.quickDotInner, { backgroundColor: qa.color }]} />
                    </View>
                    <Text style={[styles.quickTitle, { color: text }]}>{qa.label}</Text>
                    <Text style={[styles.quickSub, { color: muted }]}>{qa.sub}</Text>
                    <View style={[styles.quickTag, { backgroundColor: `${qa.color}18` }]}>
                      <Text style={[styles.quickTagText, { color: qa.locked ? text : qa.color }]}>{qa.tag}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </AnimatedSection>

          <AnimatedSection animation={skillsAnim}>
            <View style={[styles.skillsCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.skillsHeader}>
                <Text style={[styles.skillsTitle, { color: text }]}>Readiness pillars</Text>
                <View style={[styles.levelBadge, { backgroundColor: raised, borderColor: border }]}>
                  <Text style={[styles.levelText, { color: primary }]}>Est. {estimatedLevel}</Text>
                </View>
              </View>

              <View style={styles.skillList}>
                {skills.map((skill) => (
                  <SkillMeter
                    key={skill.label}
                    label={skill.label}
                    pct={skill.pct}
                    color={skill.color}
                    muted={muted}
                    soft={soft}
                    raised={raised}
                  />
                ))}
              </View>
            </View>
          </AnimatedSection>

          <AnimatedSection animation={statsAnim}>
            <View style={styles.statsRow}>
              {[
                { val: String(totalCards), label: 'Vocabulary items' },
                { val: String(streakDays), label: 'Day streak' },
                { val: estimatedLevel, label: 'Est. level' },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[styles.statCell, { backgroundColor: surface, borderColor: border }]}
                >
                  <Text style={[styles.statVal, { color: text }]}>{s.val}</Text>
                  <Text style={[styles.statLabel, { color: muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </AnimatedSection>

          <AnimatedSection animation={guideAnim}>
            <View
              style={[
                styles.sidebarGuide,
                { backgroundColor: isDark ? D.raised : palette.primarySurface, borderColor: border },
              ]}
            >
              <Text style={[styles.sidebarGuideTitle, { color: text }]}>Deployment-ready flow</Text>
              <Text style={[styles.sidebarGuideText, { color: muted }]}>
                Navigation follows paid access, while Home and Billing still show the locked pathways clearly. That keeps upgrades understandable during deployment and later organisation rollout.
              </Text>
            </View>
          </AnimatedSection>
        </View>
      </AppScaffold>

      <SmartHintPopup
        visible={showHint && isAuthenticated}
        themeMode={themeMode}
        title="Looking for YKI Prep?"
        body={accessState?.yki ? 'Open the sidebar and choose YKI Prep when you want formal exam work, or use Workplace Scenarios when you want spoken work communication.' : 'YKI Prep is available in YKI and Bundle plans.'}
        onPrimary={() => {
          setShowHint(false);
          onSelectMode?.('yki');
        }}
        onSecondary={() => setShowHint(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    gap: 14,
    paddingTop: 2,
  },

  emberLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 28,
  },

  fireGlowPrimary: {
    position: 'absolute',
    bottom: -14,
    left: '4%',
    width: 220,
    height: 126,
    borderRadius: 110,
    backgroundColor: 'rgba(240,164,54,0.16)',
  },

  fireGlowSecondary: {
    position: 'absolute',
    bottom: -28,
    left: '24%',
    width: 300,
    height: 160,
    borderRadius: 150,
    backgroundColor: 'rgba(240,200,109,0.11)',
  },

  fireGlowAccent: {
    position: 'absolute',
    bottom: -10,
    left: '58%',
    width: 190,
    height: 108,
    borderRadius: 95,
    backgroundColor: 'rgba(255,215,135,0.08)',
  },

  fireGlowSoft: {
    position: 'absolute',
    bottom: 12,
    left: '42%',
    width: 130,
    height: 56,
    borderRadius: 65,
    backgroundColor: 'rgba(255,226,170,0.06)',
  },

  ember: {
    position: 'absolute',
  },

  smoke: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },

  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },

  heroSweep: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 96,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  heroLeft: {
    flex: 1,
    gap: 5,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: D.success,
  },

  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: D.success,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  heroSub: {
    fontSize: 13,
    lineHeight: 18,
  },

  heroCta: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 4,
  },

  heroCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  heroRing: {
    alignItems: 'center',
    gap: 8,
  },

  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  ringInner: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },

  ringPct: {
    fontSize: 15,
    fontWeight: '700',
  },

  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },

  streakFire: { fontSize: 13 },

  streakNum: {
    fontSize: 14,
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  quickCard: {
    width: '47.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },

  quickDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  quickSub: {
    fontSize: 12,
    lineHeight: 16,
  },

  quickTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  quickTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  skillsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },

  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  skillsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },

  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },

  skillList: {
    gap: 12,
  },

  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  skillLabel: {
    fontSize: 12,
    width: 66,
    flexShrink: 0,
  },

  skillTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },

  skillFill: {
    height: '100%',
    borderRadius: 999,
  },

  skillPct: {
    fontSize: 12,
    width: 32,
    textAlign: 'right',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statCell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },

  statVal: {
    fontSize: 22,
    fontWeight: '700',
  },

  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  sidebarGuide: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 5,
  },

  sidebarGuideTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  sidebarGuideText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
