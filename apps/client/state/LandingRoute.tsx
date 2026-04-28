import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LanguageSelector from '../features/i18n/LanguageSelector';
import { usePreferencesStore } from './preferencesStore';
import { useTranslator } from '../features/i18n';

const LOGO = require('../components/public/logo.png');

function getGoogleAsset() {
  if (Platform.OS === 'ios') return require('../components/public/google/iOS/continue.png');
  if (Platform.OS === 'web') return require('../components/public/google/web/continue.png');
  return require('../components/public/google/android/continue_2x.png');
}

function getFeatures(t: (key: 'landingFeature1Label' | 'landingFeature1Sub' | 'landingFeature2Label' | 'landingFeature2Sub' | 'landingFeature3Label' | 'landingFeature3Sub' | 'landingFeature4Label' | 'landingFeature4Sub') => string) {
  return [
    {
      icon: '📚',
      label: t('landingFeature1Label'),
      sub: t('landingFeature1Sub'),
      accent: '#4F7FFF',
    },
    {
      icon: '🎙',
      label: t('landingFeature2Label'),
      sub: t('landingFeature2Sub'),
      accent: '#2DD4BF',
    },
    {
      icon: '📋',
      label: t('landingFeature3Label'),
      sub: t('landingFeature3Sub'),
      accent: '#A78BFA',
    },
    {
      icon: '💼',
      label: t('landingFeature4Label'),
      sub: t('landingFeature4Sub'),
      accent: '#F0C86D',
    },
  ];
}

type Props = { onOpenAuth: () => void };

export default function LandingRoute({ onOpenAuth }: Props) {
  const hydratePreferences = usePreferencesStore((s) => s.hydrate);
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const clockFormat = usePreferencesStore((s) => s.clockFormat);
  const { t } = useTranslator();
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => new Date());

  const heroAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;
  const tagsAnim = useRef(new Animated.Value(0)).current;
  const authAnim = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const blobDrift = useRef(new Animated.Value(0)).current;
  const features = getFeatures(t);
  const featureAnims = useRef(features.map(() => new Animated.Value(0))).current;
  const logoWidth = Math.min(Math.max(width * 0.82, 320), 540);
  const logoHeight = logoWidth * (1024 / 1536);
  const logoStyle = useMemo(() => ({
    width: logoWidth,
    height: logoHeight,
    marginLeft: -(logoWidth / 2),
  }), [logoHeight, logoWidth]);

  useEffect(() => {
    void hydratePreferences();

    const entranceAnimations = [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(subAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tagsAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      ...featureAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ),
      Animated.timing(authAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    const entrance = Animated.stagger(110, entranceAnimations);

    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const blobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobDrift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobDrift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    entrance.start();
    logoLoop.start();
    blobLoop.start();
    const clockTimer = setInterval(() => setNow(new Date()), 30_000);

    return () => {
      logoLoop.stop();
      blobLoop.stop();
      clearInterval(clockTimer);
    };
  }, [authAnim, blobDrift, featureAnims, heroAnim, hydratePreferences, logoFloat, subAnim, tagsAnim]);

  const clockLabel = useMemo(() => {
    if (clockFormat === '12h') {
      return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [clockFormat, now]);

  const makeEnterStyle = (anim: Animated.Value, distance = 22, startScale = 0.98) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [startScale, 1],
        }),
      },
    ],
  });

  const logoAnimatedStyle = {
    transform: [
      {
        translateY: logoFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        scale: logoFloat.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.015, 1],
        }),
      },
    ],
  };

  const blobTopAnimatedStyle = {
    transform: [
      {
        translateX: blobDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 14],
        }),
      },
      {
        translateY: blobDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
      {
        scale: blobDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.06],
        }),
      },
    ],
  };

  const blobBottomAnimatedStyle = {
    transform: [
      {
        translateX: blobDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -16],
        }),
      },
      {
        translateY: blobDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 12],
        }),
      },
      {
        scale: blobDrift.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.04],
        }),
      },
    ],
  };

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.blobTop, blobTopAnimatedStyle]} pointerEvents="none" />
      <Animated.View style={[styles.blobBottom, blobBottomAnimatedStyle]} pointerEvents="none" />
      <View style={styles.centerGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topBar}>
            <View style={styles.topMeta}>
              <View style={styles.clockPill}>
                <Text style={styles.clockPillText}>{clockLabel}</Text>
              </View>
              <LanguageSelector language={language} onChange={(next) => void setLanguage(next)} compact />
            </View>
          </View>

          <View style={styles.logoRow}>
            <Animated.Image
              source={LOGO}
              style={[styles.logo, logoStyle, logoAnimatedStyle]}
              resizeMode="contain"
            />
          </View>

          <Animated.View style={[styles.hero, makeEnterStyle(heroAnim, 18, 0.99)]}>
            <View style={styles.tagPill}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>{t('landingTag')}</Text>
            </View>

            <Text style={styles.title}>
              {t('landingTitleLine1')}{'\n'}
              <Text style={styles.titleHighlight}>{t('landingTitleHighlight')}</Text>
            </Text>
          </Animated.View>

          <Animated.Text style={[styles.subtitle, makeEnterStyle(subAnim, 18, 1)]}>
            {t('landingSubtitle')}
          </Animated.Text>

          <Animated.View style={[styles.quickTagRow, makeEnterStyle(tagsAnim, 18, 1)]}>
            {[t('landingQuickTag1'), t('landingQuickTag2'), t('landingQuickTag3')].map((item) => (
              <View key={item} style={styles.quickTag}>
                <Text style={styles.quickTagText}>{item}</Text>
              </View>
            ))}
          </Animated.View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>{t('landingSectionEyebrow')}</Text>

            <View style={styles.featureList}>
              {features.map((feature, index) => {
                const anim = featureAnims[index];
                return (
                  <Animated.View
                    key={feature.label}
                    style={[
                      styles.featureCard,
                      makeEnterStyle(anim, 24, 0.97),
                      {
                        borderColor: `${feature.accent}22`,
                        backgroundColor: 'rgba(255,255,255,0.045)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.featureIconWrap,
                        {
                          backgroundColor: `${feature.accent}18`,
                          borderColor: `${feature.accent}34`,
                        },
                      ]}
                    >
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                    </View>

                    <View style={styles.featureBody}>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                      <Text style={styles.featureSub}>{feature.sub}</Text>
                    </View>

                    <Text style={[styles.featureAccentMark, { color: feature.accent }]}>•</Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <Animated.View style={[styles.authBlock, makeEnterStyle(authAnim, 24, 0.985)]}>
            <Text style={styles.authTitle}>{t('landingAuthTitle')}</Text>
            <Text style={styles.authSubtitle}>{t('landingAuthSubtitle')}</Text>

            <Pressable
              onPress={onOpenAuth}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('landingContinueSignIn')}
            >
              <Text style={styles.primaryBtnText}>{t('landingContinueSignIn')}</Text>
            </Pressable>

            <Pressable
              onPress={onOpenAuth}
              style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('landingContinueGoogle')}
            >
              <Image source={getGoogleAsset()} style={styles.googleImage} resizeMode="contain" />
            </Pressable>

            <Text style={styles.legalNote}>
              {t('landingLegal')}
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1121',
  },

  safe: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    flexGrow: 1,
  },

  topBar: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  clockPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(79,127,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.18)',
  },

  clockPillText: {
    color: '#D9E4FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  blobTop: {
    position: 'absolute',
    top: -80,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(79,127,255,0.12)',
  },

  blobBottom: {
    position: 'absolute',
    bottom: 40,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(167,139,250,0.10)',
  },

  centerGlow: {
    position: 'absolute',
    top: 210,
    left: 30,
    right: 30,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(79,127,255,0.05)',
  },

  logoRow: {
    minHeight: 220,
    position: 'relative',
    overflow: 'visible',
    marginBottom: 4,
  },

  logo: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 460,
    height: 300,
    marginLeft: -230,
  },

  hero: {
    marginTop: 6,
  },

  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(79,127,255,0.34)',
    backgroundColor: 'rgba(79,127,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },

  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F7FFF',
    marginRight: 7,
  },

  tagText: {
    color: '#9AAEFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.05,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 39,
    lineHeight: 45,
    fontWeight: '700',
    letterSpacing: -1.15,
  },

  titleHighlight: {
    color: '#79A0FF',
  },

  subtitle: {
    marginTop: 14,
    color: 'rgba(232,238,255,0.72)',
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 620,
  },

  quickTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    marginBottom: 24,
  },

  quickTag: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },

  quickTagText: {
    color: '#D9E4FF',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionCard: {
    marginTop: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(13,20,38,0.72)',
    padding: 16,
  },

  sectionEyebrow: {
    color: 'rgba(232,238,255,0.52)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 14,
  },

  featureList: {
    gap: 10,
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },

  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  featureIcon: {
    fontSize: 20,
  },

  featureBody: {
    flex: 1,
    paddingTop: 2,
  },

  featureLabel: {
    color: '#F4F7FF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  featureSub: {
    color: 'rgba(232,238,255,0.56)',
    fontSize: 12.5,
    lineHeight: 18,
  },

  featureAccentMark: {
    fontSize: 24,
    lineHeight: 24,
    paddingLeft: 8,
    opacity: 0.9,
  },

  authBlock: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },

  authTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },

  authSubtitle: {
    color: 'rgba(232,238,255,0.62)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },

  primaryBtn: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: '#4F7FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },

  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  googleBtn: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  googleBtnPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },

  googleImage: {
    width: 200,
    height: 44,
  },

  legalNote: {
    color: 'rgba(232,238,255,0.38)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    paddingTop: 12,
  },
});
