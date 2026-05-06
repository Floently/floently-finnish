import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslator } from '../features/i18n';
import { usePreferencesStore } from '../state/preferencesStore';

type Props = Record<string, any>;

type LandingLanguageOption = {
  code: string;
  flag: string;
  label: string;
  nativeLabel: string;
};

const LOGO = require('../components/public/logo.png');

const LANGUAGE_OPTIONS: LandingLanguageOption[] = [
  { code: 'fi', flag: '🇫🇮', label: 'Finnish', nativeLabel: 'Suomi' },
  { code: 'en', flag: '🇬🇧', label: 'English', nativeLabel: 'English' },
  { code: 'sv', flag: '🇸🇪', label: 'Swedish', nativeLabel: 'Svenska' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'bn', flag: '🇧🇩', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'de', flag: '🇩🇪', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'et', flag: '🇪🇪', label: 'Estonian', nativeLabel: 'Eesti' },
  { code: 'fa', flag: '🇮🇷', label: 'Persian', nativeLabel: 'فارسی' },
  { code: 'fr', flag: '🇫🇷', label: 'French', nativeLabel: 'Français' },
  { code: 'hi', flag: '🇮🇳', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ne', flag: '🇳🇵', label: 'Nepali', nativeLabel: 'नेपाली' },
  { code: 'pl', flag: '🇵🇱', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'pt', flag: '🇵🇹', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'ru', flag: '🇷🇺', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'so', flag: '🇸🇴', label: 'Somali', nativeLabel: 'Soomaali' },
  { code: 'sw', flag: '🇰🇪', label: 'Swahili', nativeLabel: 'Kiswahili' },
  { code: 'th', flag: '🇹🇭', label: 'Thai', nativeLabel: 'ไทย' },
  { code: 'tr', flag: '🇹🇷', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'uk', flag: '🇺🇦', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'vi', flag: '🇻🇳', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese', nativeLabel: '中文' },
];

const LANGUAGE_MARKETING_COPY: Record<string, string> = {
  en: 'Access Finnish in the language that suits you.',
  fi: 'Opiskele suomea sinulle sopivalla kielellä.',
  sv: 'Lär dig finska på det språk som passar dig.',
  ar: 'تعلّم الفنلندية باللغة التي تناسبك.',
  bn: 'আপনার উপযোগী ভাষায় ফিনিশ শিখুন।',
  de: 'Lerne Finnisch in der Sprache, die zu dir passt.',
  es: 'Aprende finés en el idioma que mejor se adapte a ti.',
  et: 'Õpi soome keelt sulle sobivas keeles.',
  fa: 'فنلاندی را به زبانی یاد بگیرید که برای شما مناسب است.',
  fr: 'Apprenez le finnois dans la langue qui vous convient.',
  hi: 'अपनी सुविधा की भाषा में फ़िनिश सीखें।',
  ne: 'तपाईंलाई सजिलो भाषामा फिनिस सिक्नुहोस्।',
  pl: 'Ucz się fińskiego w języku, który Ci odpowiada.',
  pt: 'Aprenda finlandês no idioma que combina com você.',
  ru: 'Изучайте финский на удобном для вас языке.',
  so: 'Ku baro Finnish-ka luqadda kugu habboon.',
  sw: 'Jifunze Kifini kwa lugha inayokufaa.',
  th: 'เรียนภาษาฟินแลนด์ด้วยภาษาที่เหมาะกับคุณ',
  tr: 'Finceyi sana uygun dilde öğren.',
  uk: 'Вивчайте фінську мовою, яка вам підходить.',
  vi: 'Học tiếng Phần Lan bằng ngôn ngữ phù hợp với bạn.',
  zh: '用适合你的语言学习芬兰语。',
};

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
      start: () =>
        callAny(
          ['onGetStarted', 'onStart', 'onOpenAuth', 'onOpenRegister'],
          () => router.push('/auth/register' as never),
        ),
      login: () =>
        callAny(
          ['onLogin', 'onOpenLogin', 'onOpenAuth'],
          () => router.push('/auth/login' as never),
        ),
      pricing: () =>
        callAny(
          ['onOpenBilling', 'onPricing', 'onOpenAuth'],
          () => router.push('/billing/subscription' as never),
        ),
      yki: () =>
        callAny(
          ['onOpenYki', 'onOpenYkiExam', 'onOpenAuth'],
          () => router.push('/yki-exam' as never),
        ),
      professional: () =>
        callAny(
          ['onOpenProfessional', 'onOpenProfessionalFinnish', 'onOpenAuth'],
          () => router.push('/professional' as never),
        ),
    };
  }, [props]);
}

function currentLanguageOption(language: string | undefined): LandingLanguageOption {
  return LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[1];
}

function CorrectionDemoCard({ caption }: { caption: string }) {
  const { t } = useTranslator();
  const progress = useRef(new Animated.Value(0)).current;
  const [step, setStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        label: t('landingDraftLabel'),
        before: 'Kävin apteekkiin eilen.',
        wrong: 'apteekkiin',
        after: 'Kävin apteekissa eilen.',
        right: 'apteekissa',
        note: t('landingCorrectionLocationCaseExplanation'),
      },
      {
        label: t('landingFeedbackLabel'),
        before: 'Haluan puhua esimies.',
        wrong: 'esimies',
        after: 'Haluan puhua esimiehen kanssa.',
        right: 'esimiehen kanssa',
        note: t('landingCorrectionNaturalWorkplaceFinnish'),
      },
      {
        label: t('landingPracticeLabel'),
        before: 'Voinko saada apu?',
        wrong: 'apu',
        after: 'Voinko saada apua?',
        right: 'apua',
        note: t('landingCorrectionPartitiveImproved'),
      },
    ],
    [t],
  );

  useEffect(() => {
    progress.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );

    const timer = setInterval(() => {
      setStep((value) => (value + 1) % steps.length);
    }, 2600);

    loop.start();

    return () => {
      loop.stop();
      clearInterval(timer);
    };
  }, [progress, steps.length]);

  const active = steps[step];

  const cursorTranslate = progress.interpolate({
    inputRange: [0, 0.38, 1],
    outputRange: [0, 92, 188],
  });

  const cardFloat = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -9, 0],
  });

  const correctionOpacity = progress.interpolate({
    inputRange: [0, 0.42, 0.72, 1],
    outputRange: [0.1, 0.35, 1, 0.95],
  });

  const correctionTranslate = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [12, 4, 0],
  });

  const highlightScale = progress.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: [0.2, 1, 1, 0.75],
  });

  const pulseScale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.75, 1.15, 0.9],
  });

  return (
    <Animated.View style={[styles.demoCard, { transform: [{ translateY: cardFloat }] }]}>
      <View style={styles.demoHeader}>
        <View>
          <Text style={styles.demoKicker}>{t('landingLiveCorrectionLabel')}</Text>
          <Text style={styles.demoTitle}>{active.label}</Text>
        </View>
        <View style={styles.demoPulseOuter}>
          <Animated.View
            style={[
              styles.demoPulseInner,
              {
                opacity: correctionOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.demoInputBubble}>
        <Text style={styles.demoInputText}>
          {active.before.split(active.wrong)[0]}
          <Text style={styles.demoInputMistake}>{active.wrong}</Text>
          {active.before.split(active.wrong)[1]}
        </Text>
        <Animated.View
          style={[
            styles.demoMistakeUnderline,
            {
              transform: [{ scaleX: highlightScale }],
              opacity: correctionOpacity,
            },
          ]}
        />
        <Animated.View style={[styles.demoCursor, { transform: [{ translateX: cursorTranslate }] }]} />
      </View>

      <Animated.View
        style={[
          styles.demoCorrectionBubble,
          {
            opacity: correctionOpacity,
            transform: [{ translateY: correctionTranslate }],
          },
        ]}
      >
        <Text style={styles.demoCorrectionLabel}>{t('landingCorrectionLabel')}</Text>
        <Text style={styles.demoCorrectionText}>
          {active.after.split(active.right)[0]}
          <Text style={styles.demoCorrectionStrong}>{active.right}</Text>
          {active.after.split(active.right)[1]}
        </Text>
      </Animated.View>

      <View style={styles.demoRuleRow}>
        <Text style={styles.demoRuleText}>{active.note}</Text>
      </View>

      <View style={styles.waveRow}>
        {[22, 34, 26, 46, 30, 52, 28, 40, 24].map((height, index) => (
          <Animated.View
            key={`${height}-${index}`}
            style={[
              styles.waveBar,
              {
                height,
                opacity: progress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: index % 2 === 0 ? [0.35, 1, 0.45] : [0.85, 0.4, 1],
                }),
                transform: [
                  {
                    scaleY: progress.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: index % 2 === 0 ? [0.55, 1.18, 0.7] : [1.1, 0.65, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.demoCaption}>{caption}</Text>
    </Animated.View>
  );
}

export default function LandingRoute(props: Props) {
  const { t } = useTranslator();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const [languageOpen, setLanguageOpen] = useState(false);
  const nav = useLandingNav(props);

  const selectedLanguage = currentLanguageOption(language);

  const trustPoints = [
    t('landingTrustYkiAligned'),
    t('landingTrustProfessionSpecific'),
    t('landingTrustWorkplaceCommunication'),
    t('landingTrustSettlementSupport'),
  ];

  const pathways = [
    {
      eyebrow: t('landingPlatformYkiEyebrow'),
      title: t('landingPlatformYkiTitle'),
      body: t('landingPlatformYkiBody'),
      onPress: nav.yki,
    },
    {
      eyebrow: t('landingPlatformProfessionalEyebrow'),
      title: t('landingPlatformProfessionalTitle'),
      body: t('landingPlatformProfessionalBody'),
      onPress: nav.professional,
    },
    {
      eyebrow: t('landingPlatformLifeEyebrow'),
      title: t('landingPlatformLifeTitle'),
      body: t('landingPlatformLifeBody'),
      onPress: nav.start,
    },
  ];

  const features = [
    [t('landingFeature1Label'), t('landingFeature1Sub')],
    [t('landingFeature2Label'), t('landingFeature2Sub')],
    [t('landingFeature3Label'), t('landingFeature3Sub')],
    [t('landingFeature4Label'), t('landingFeature4Sub')],
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <Image
              source={LOGO}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel={t('landingLogoAlt')}
            />

            <View style={styles.topActions}>
              <Pressable
                onPress={() => setLanguageOpen(true)}
                style={styles.languageButton}
                accessibilityRole="button"
                accessibilityLabel="Change language"
              >
                <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
                <Text style={styles.languageCode}>{selectedLanguage.code.toUpperCase()}</Text>
              </Pressable>

              <Pressable onPress={nav.login} style={styles.signInButton} accessibilityRole="button">
                <Text style={styles.signInText}>{t('landingNavSignIn')}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.languageLine}>
            {LANGUAGE_MARKETING_COPY[String(language ?? 'en')] ?? LANGUAGE_MARKETING_COPY.en}
          </Text>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{t('landingHeroEyebrow')}</Text>

            <Text style={styles.title}>
              {t('landingHeroPassYki')}{' '}
              <Text style={styles.titleAccent}>{t('landingHeroSucceedInWorkAndLife')}</Text>{' '}
              {t('landingHeroInFinland')}
            </Text>

            <Text style={styles.subtitle}>{t('landingHeroLede')}</Text>

            <View style={styles.ctaStack}>
              <Pressable onPress={nav.start} style={styles.primaryButton} accessibilityRole="button">
                <Text style={styles.primaryButtonText}>{t('landingPathwayLearnersCta')}</Text>
              </Pressable>

              <Pressable onPress={nav.login} style={styles.secondaryButton} accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>{t('landingFinalSignIn')}</Text>
              </Pressable>
            </View>

            <View style={styles.trustGrid}>
              {trustPoints.map((point) => (
                <View key={point} style={styles.trustPill}>
                  <Text style={styles.trustText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          <CorrectionDemoCard caption={t('landingHeroDemoCaption')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>{t('landingPlatformEyebrow')}</Text>
          <Text style={styles.sectionTitle}>
            {t('landingPlatformTitleLine1')} {t('landingPlatformTitleHighlight')}
          </Text>
          <Text style={styles.sectionBody}>{t('landingPlatformBody')}</Text>

          <View style={styles.pathwayStack}>
            {pathways.map((item) => (
              <Pressable
                key={item.title}
                onPress={item.onPress}
                style={styles.pathwayCard}
                accessibilityRole="button"
              >
                <Text style={styles.pathwayEyebrow}>{item.eyebrow}</Text>
                <Text style={styles.pathwayTitle}>{item.title}</Text>
                <Text style={styles.pathwayBody}>{item.body}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.darkSection}>
          <Text style={styles.darkEyebrow}>{t('landingInsideEyebrow')}</Text>
          <Text style={styles.darkTitle}>
            {t('landingInsideTitleLine1')} {t('landingInsideTitleLine2')}
          </Text>
          <Text style={styles.darkBody}>{t('landingInsideBody')}</Text>

          <View style={styles.featureGrid}>
            {features.map(([label, body]) => (
              <View key={label} style={styles.featureCard}>
                <Text style={styles.featureLabel}>{label}</Text>
                <Text style={styles.featureBody}>{body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.finalCard}>
          <Text style={styles.finalEyebrow}>{t('landingFinalEyebrow')}</Text>
          <Text style={styles.finalTitle}>
            {t('landingFinalTitleLine1')} {t('landingFinalTitleLine2')}
          </Text>
          <Text style={styles.finalBody}>{t('landingFinalBody')}</Text>

          <View style={styles.ctaStack}>
            <Pressable onPress={nav.login} style={styles.primaryButton} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>{t('landingFinalSignIn')}</Text>
            </Pressable>

            <Pressable onPress={nav.pricing} style={styles.secondaryButtonLight} accessibilityRole="button">
              <Text style={styles.secondaryButtonLightText}>{t('landingFinalContact')}</Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            {t('landingFooterCopyright').replace('{year}', String(new Date().getFullYear()))}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.languageModal}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>{t('commonChooseLanguage')}</Text>
              <Pressable onPress={() => setLanguageOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator>
              {LANGUAGE_OPTIONS.map((option) => {
                const active = option.code === selectedLanguage.code;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => {
                      setLanguage(option.code as any);
                      setLanguageOpen(false);
                    }}
                    style={[styles.languageOption, active && styles.languageOptionActive]}
                    accessibilityRole="button"
                  >
                    <View style={styles.languageOptionFlagCircle}>
                      <Text style={styles.languageOptionFlag}>{option.flag}</Text>
                    </View>
                    <View style={styles.languageOptionTextWrap}>
                      <Text style={styles.languageOptionLabel}>{option.nativeLabel}</Text>
                      <Text style={styles.languageOptionSub}>{option.label}</Text>
                    </View>
                    {active ? <Text style={styles.languageCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#071124',
  },
  page: {
    flex: 1,
    backgroundColor: '#071124',
  },
  content: {
    padding: 16,
    paddingBottom: 34,
    gap: 18,
  },
  hero: {
    borderRadius: 32,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#08183A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 18,
  },
  topBar: {
    gap: 12,
  },
  logo: {
    alignSelf: 'center',
    width: 270,
    height: 112,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  languageFlag: {
    fontSize: 20,
  },
  languageCode: {
    color: '#EAF0FF',
    fontSize: 12,
    fontWeight: '800',
  },
  signInButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  signInText: {
    color: '#071124',
    fontSize: 13,
    fontWeight: '900',
  },
  languageLine: {
    color: '#BFD0FF',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  heroCopy: {
    gap: 12,
  },
  eyebrow: {
    color: '#80F2DA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 37,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.15,
    textAlign: 'center',
  },
  titleAccent: {
    color: '#9AB4FF',
  },
  subtitle: {
    color: '#C8D5F4',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  ctaStack: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#5A85FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonLight: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E3F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonLightText: {
    color: '#2453D4',
    fontSize: 15,
    fontWeight: '800',
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  trustPill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  trustText: {
    color: '#DCE6FF',
    fontSize: 11,
    fontWeight: '800',
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoKicker: {
    color: '#2453D4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  demoTitle: {
    color: '#071124',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  demoPulseOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoPulseInner: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#2DD4BF',
  },
  demoInputBubble: {
    position: 'relative',
    borderRadius: 18,
    backgroundColor: '#F2F6FF',
    padding: 13,
    overflow: 'hidden',
  },
  demoInputText: {
    color: '#071124',
    fontSize: 16,
    fontWeight: '700',
  },
  demoInputMistake: {
    color: '#D64D4D',
    fontWeight: '900',
  },
  demoMistakeUnderline: {
    position: 'absolute',
    left: 78,
    bottom: 8,
    width: 78,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#F97373',
  },
  demoCursor: {
    position: 'absolute',
    bottom: 8,
    left: 14,
    width: 2,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#5A85FF',
  },
  demoCorrectionBubble: {
    borderRadius: 18,
    backgroundColor: '#E9FFF9',
    padding: 13,
    borderWidth: 1,
    borderColor: '#BAF4E7',
  },
  demoCorrectionLabel: {
    color: '#0E9F8C',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  demoCorrectionText: {
    color: '#071124',
    fontSize: 17,
    fontWeight: '900',
  },
  demoCorrectionStrong: {
    color: '#0E9F8C',
    fontWeight: '900',
  },
  demoRuleRow: {
    borderRadius: 14,
    backgroundColor: '#FFF7DF',
    padding: 10,
  },
  demoRuleText: {
    color: '#865D00',
    fontSize: 13,
    fontWeight: '800',
  },
  waveRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  waveBar: {
    width: 9,
    borderRadius: 999,
    backgroundColor: '#5A85FF',
  },
  demoCaption: {
    color: '#5B6472',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#F4F7FF',
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  sectionEyebrow: {
    color: '#2453D4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#071124',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  sectionBody: {
    color: '#526079',
    fontSize: 15,
    lineHeight: 22,
  },
  pathwayStack: {
    gap: 12,
    marginTop: 4,
  },
  pathwayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDE7F7',
    gap: 6,
  },
  pathwayEyebrow: {
    color: '#2453D4',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pathwayTitle: {
    color: '#071124',
    fontSize: 18,
    fontWeight: '900',
  },
  pathwayBody: {
    color: '#5B6472',
    fontSize: 14,
    lineHeight: 21,
  },
  darkSection: {
    backgroundColor: '#0B1730',
    borderRadius: 28,
    padding: 18,
    gap: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  darkEyebrow: {
    color: '#80F2DA',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  darkTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  darkBody: {
    color: '#C8D5F4',
    fontSize: 15,
    lineHeight: 22,
  },
  featureGrid: {
    gap: 10,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  featureLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  featureBody: {
    color: '#C8D5F4',
    fontSize: 13,
    lineHeight: 19,
  },
  finalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  finalEyebrow: {
    color: '#2453D4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  finalTitle: {
    color: '#071124',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  finalBody: {
    color: '#526079',
    fontSize: 15,
    lineHeight: 22,
  },
  footerText: {
    color: '#7A8498',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7,17,36,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  languageModal: {
    width: '100%',
    maxHeight: '82%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  languageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  languageModalTitle: {
    color: '#071124',
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5FF',
  },
  closeButtonText: {
    color: '#071124',
    fontSize: 25,
    lineHeight: 28,
    fontWeight: '700',
  },
  languageList: {
    maxHeight: 520,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  languageOptionActive: {
    backgroundColor: '#EEF4FF',
  },
  languageOptionFlagCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E3F2',
  },
  languageOptionFlag: {
    fontSize: 25,
  },
  languageOptionTextWrap: {
    flex: 1,
  },
  languageOptionLabel: {
    color: '#071124',
    fontSize: 15,
    fontWeight: '900',
  },
  languageOptionSub: {
    color: '#687386',
    fontSize: 12,
    marginTop: 1,
  },
  languageCheck: {
    color: '#2453D4',
    fontSize: 20,
    fontWeight: '900',
  },
});
