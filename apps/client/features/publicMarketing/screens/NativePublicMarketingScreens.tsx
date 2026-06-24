import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PUBLIC_LANGUAGE_FLAGS,
  PUBLIC_LANGUAGES,
  getPublicMarketingCopy,
  type PublicPageLanguage,
} from '../../../web/i18n/publicMarketingCopy';
import { usePreferencesStore } from '../../../state/preferencesStore';

const LOGO = require('../../../components/public/logo.png');

const CONTACT_EMAIL = 'pilots@floently.com';
const PUBLIC_LANGUAGE_CODES = new Set<string>(PUBLIC_LANGUAGES.map((item) => item.code));

type AnyRecord = Record<string, any>;

function asPublicLanguage(value: string | undefined): PublicPageLanguage {
  return PUBLIC_LANGUAGE_CODES.has(value ?? '') ? (value as PublicPageLanguage) : 'en';
}

function getAt<T>(source: AnyRecord, path: string, fallback: T): T {
  let current: any = source;
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object' || !(part in current)) {
      return fallback;
    }
    current = current[part];
  }
  return (current ?? fallback) as T;
}

function firstString(source: AnyRecord, paths: string[], fallback: string): string {
  for (const path of paths) {
    const value = getAt<string | undefined>(source, path, undefined);
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

function firstArray<T>(source: AnyRecord, paths: string[], fallback: T[]): T[] {
  for (const path of paths) {
    const value = getAt<T[] | undefined>(source, path, undefined);
    if (Array.isArray(value) && value.length) return value;
  }
  return fallback;
}

function useNativePublicCopy() {
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const publicLanguage = asPublicLanguage(language);
  const copy = useMemo(() => getPublicMarketingCopy(publicLanguage), [publicLanguage]);

  const selectedLanguage =
    PUBLIC_LANGUAGES.find((item) => item.code === publicLanguage) ?? PUBLIC_LANGUAGES[0];

  return {
    copy: copy as AnyRecord,
    language: publicLanguage,
    selectedLanguage,
    setLanguage: async (next: PublicPageLanguage) => {
      await setLanguage(next as any);
    },
  };
}

function LanguagePicker() {
  const { language, selectedLanguage, setLanguage } = useNativePublicCopy();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.languageWrap}>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.languageCurrent}
        accessibilityRole="button"
      >
        <Text style={styles.languageFlag}>{PUBLIC_LANGUAGE_FLAGS[selectedLanguage.code] ?? '🌐'}</Text>
        <Text style={styles.languageCurrentText}>{selectedLanguage.label}</Text>
        <Text style={styles.languageChevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.languageModal} onPress={() => {}}>
            <ScrollView style={styles.languageList} showsVerticalScrollIndicator>
              {PUBLIC_LANGUAGES.map((item) => {
                const active = item.code === language;
                return (
                  <Pressable
                    key={item.code}
                    onPress={async () => {
                      await setLanguage(item.code);
                      setOpen(false);
                    }}
                    style={[styles.languageOption, active && styles.languageOptionActive]}
                  >
                    <Text style={styles.languageFlag}>{PUBLIC_LANGUAGE_FLAGS[item.code] ?? '🌐'}</Text>
                    <Text style={[styles.languageOptionText, active && styles.languageOptionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function BrandHeader({ light = false }: { light?: boolean }) {
  const { copy } = useNativePublicCopy();
  const common = copy.common ?? {};

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push('/' as never)} style={styles.logoRow}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.logoText, light && styles.darkText]}>Floently</Text>
      </Pressable>

      <View style={styles.headerLinks}>
        <Pressable onPress={() => router.push('/for-organizations' as never)}>
          <Text style={[styles.headerLink, light && styles.headerLinkDark]}>
            {common.forOrganizations ?? common.forOrganizationsArrow ?? ''}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/auth/login' as never)} style={[styles.signInPill, light && styles.signInPillLight]}>
          <Text style={[styles.signInText, light && styles.signInTextLight]}>
            {common.signIn ?? 'Sign in'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CorrectionPreview() {
  const { copy } = useNativePublicCopy();
  const landing = copy.landing ?? {};
  const demo = copy.demo ?? {};

  const label = firstString(
    { landing, demo },
    ['demo.label', 'landing.correction.kicker', 'landing.demo.kicker', 'landing.liveCorrectionLabel', 'landing.correctionEyebrow'],
    'Floently · live correction',
  );

  const prompt = firstString(
    { demo },
    ['demo.prompt'],
    'Your answer in Finnish',
  );

  const sentence = firstString(
    { demo },
    ['demo.sentence'],
    'Kävin apteekkiin eilen.',
  );

  const wrongWord = firstString(
    { demo },
    ['demo.wrongWord'],
    '',
  );

  const success = firstString(
    { demo },
    ['demo.success'],
    'Now it sounds Finnish. One step closer to YKI.',
  );

  const note = firstString(
    { landing, demo },
    ['landing.demoCaption', 'landing.correction.note', 'landing.demo.note', 'landing.correctionBody', 'demo.tooltipBody'],
    'Practice Finnish, get corrected, and learn the rule.',
  );

  const parts = wrongWord && sentence.includes(wrongWord) ? sentence.split(wrongWord) : null;

  return (
    <View style={styles.correctionCard}>
      <Text style={styles.correctionKicker}>{label}</Text>
      <View style={styles.correctionBox}>
        <Text style={styles.correctionSmall}>{prompt}</Text>
        <Text style={styles.correctionText}>
          {parts ? (
            <>
              {parts[0]}
              <Text style={styles.correctionBad}>{wrongWord}</Text>
              {parts.slice(1).join(wrongWord)}
            </>
          ) : (
            sentence
          )}
        </Text>
        <Text style={styles.correctionGood}>{success}</Text>
      </View>
      <Text style={styles.correctionNote}>{note}</Text>
    </View>
  );
}

type FloentlyGatewayProps = {
  onOpenLearn: () => void;
  onOpenRead: () => void;
};

type FloentlyReadPreviewProps = {
  onOpenGateway: () => void;
  onOpenLearn: () => void;
};

function ReadComingSoonModal(_: { visible: boolean; onClose: () => void }) {
  return null;
}

export function NativeFloentlyProductGatewayScreen({ onOpenLearn, onOpenRead }: FloentlyGatewayProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#07122F' }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image source={LOGO} style={{ width: 92, height: 54 }} resizeMode="contain" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/auth/login' as never)}
              style={{
                minHeight: 38,
                paddingHorizontal: 16,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.24)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>Sign In</Text>
            </Pressable>
            <Pressable
              onPress={onOpenLearn}
              style={{
                minHeight: 38,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: '#7470FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>Open App</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 52 }}>
          <View style={{ alignItems: 'center', marginBottom: 34 }}>
            <Text
              style={{
                color: '#CBD6FF',
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.10)',
                marginBottom: 20,
              }}
            >
              Floently Product Gateway
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 38,
                lineHeight: 44,
                fontWeight: '900',
                textAlign: 'center',
                letterSpacing: -1.2,
              }}
            >
              Choose Your Floently Product
            </Text>
            <Text
              style={{
                color: '#B8C5E8',
                fontSize: 16,
                lineHeight: 24,
                textAlign: 'center',
                marginTop: 14,
                maxWidth: 760,
              }}
            >
              Floently includes Learn for Finnish readiness and Read for premium text-to-speech. Pick the product that fits your current goal.
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <Pressable
              onPress={onOpenLearn}
              style={{
                borderRadius: 26,
                borderWidth: 1,
                borderColor: 'rgba(123, 157, 255, 0.35)',
                backgroundColor: 'rgba(34, 67, 157, 0.62)',
                padding: 24,
                minHeight: 250,
              }}
            >
              <Text
                style={{
                  alignSelf: 'flex-start',
                  color: '#D9E5FF',
                  fontSize: 11,
                  fontWeight: '900',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  marginBottom: 18,
                }}
              >
                Floently Learn
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginBottom: 10 }}>Learn</Text>
              <Text style={{ color: '#CAD6F3', fontSize: 15, lineHeight: 23, marginBottom: 18 }}>
                A serious Finnish progression system for adults building YKI readiness and confidence for working life in Finland.
              </Text>
              <Text style={{ color: '#E8EFFF', lineHeight: 22 }}>
                - Prepare for YKI speaking readiness{'\n'}
                - Train workplace communication for Finland{'\n'}
                - Practice with roleplay, flashcards, and placement
              </Text>
              <View
                style={{
                  marginTop: 22,
                  alignSelf: 'flex-start',
                  minHeight: 44,
                  borderRadius: 999,
                  paddingHorizontal: 18,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Go to Learn</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/read' as never)}
              style={{
                borderRadius: 26,
                borderWidth: 1,
                borderColor: 'rgba(77, 197, 255, 0.28)',
                backgroundColor: 'rgba(18, 83, 130, 0.58)',
                padding: 24,
                minHeight: 250,
              }}
            >
              <Text
                style={{
                  alignSelf: 'flex-start',
                  color: '#D9E5FF',
                  fontSize: 11,
                  fontWeight: '900',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  marginBottom: 18,
                }}
              >
                Floently Read
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginBottom: 10 }}>Read</Text>
              <Text style={{ color: '#CAD6F3', fontSize: 15, lineHeight: 23, marginBottom: 18 }}>
                A working reading and listening workspace for importing text, saving readings, generating audio, and continuing your library.
              </Text>
              <Text style={{ color: '#E8EFFF', lineHeight: 22 }}>
                - Listen to text in natural AI voices{'\n'}
                - Import web pages, PDFs, and direct text{'\n'}
                - Control voice, speed, and reading mode
              </Text>
              <View
                style={{
                  marginTop: 22,
                  alignSelf: 'flex-start',
                  minHeight: 44,
                  borderRadius: 999,
                  paddingHorizontal: 18,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Go to Read</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 18 }}>
          <Text style={{ color: '#66789F', fontSize: 12 }}>© 2026 Floently</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function NativeReadPreviewScreen({ onOpenGateway, onOpenLearn }: FloentlyReadPreviewProps) {

  const showReadApp = () => router.push('/read/auth' as never);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#070B2B' }} edges={['top', 'bottom']}>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 26,
          paddingBottom: 44,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={onOpenGateway}>
            <Image source={LOGO} style={{ width: 82, height: 48 }} resizeMode="contain" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onOpenLearn}>
              <Text style={{ color: '#C9D4FF', fontSize: 12, fontWeight: '800' }}>Floently Finnish</Text>
            </Pressable>
            <Pressable onPress={showReadApp}>
              <Text style={{ color: '#C9D4FF', fontSize: 12, fontWeight: '800' }}>Sign In</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingTop: 58, alignItems: 'center' }}>
          <Text
            style={{
              color: '#AFC0FF',
              fontSize: 11,
              fontWeight: '900',
              letterSpacing: 1,
              textTransform: 'uppercase',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: 'rgba(117, 116, 255, 0.20)',
              marginBottom: 16,
            }}
          >
            AI-powered text to speech
          </Text>

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 36,
              lineHeight: 42,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: -1,
            }}
          >
            Listen to any text,{'\n'}
            <Text style={{ color: '#8C72FF' }}>anytime, anywhere</Text>
          </Text>

          <Text
            style={{
              color: '#AEB9DD',
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 23,
              marginTop: 16,
              maxWidth: 560,
            }}
          >
            Floently Read transforms your text into natural-sounding audio. Read articles, books, and notes without reading every word.
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Pressable
              onPress={showReadApp}
              style={{
                minHeight: 46,
                borderRadius: 999,
                paddingHorizontal: 20,
                backgroundColor: '#7568FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Get Started For Free</Text>
            </Pressable>
            <Pressable
              onPress={showReadApp}
              style={{
                minHeight: 46,
                borderRadius: 999,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>View Plans</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 58 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
            Transform text into lifelike speech
          </Text>
          <Text style={{ color: '#8794BE', textAlign: 'center', marginTop: 8, marginBottom: 22 }}>
            Everything you need to listen smarter
          </Text>

          <View style={{ gap: 14 }}>
            {[
              ['Lifelike Voices', 'Natural-sounding AI voices that read your content like a human would.'],
              ['Easy Import', 'Paste text, drop a URL, or upload a PDF. Floently handles the rest.'],
              ['Customizable', 'Control speed, voice, and reading mode to match how you learn.'],
            ].map(([title, body]) => (
              <View
                key={title}
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.10)',
                  backgroundColor: 'rgba(255,255,255,0.045)',
                  padding: 18,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 8 }}>{title}</Text>
                <Text style={{ color: '#AEB9DD', lineHeight: 21 }}>{body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 54 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900' }}>Start listening today</Text>
          <Text style={{ color: '#8D99C0', marginTop: 8, marginBottom: 18 }}>Your text. Your voice. Your pace.</Text>
          <Pressable
            onPress={showReadApp}
            style={{
              minHeight: 48,
              borderRadius: 999,
              paddingHorizontal: 22,
              backgroundColor: '#7568FF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Get Started For Free</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 54, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 20, alignItems: 'center' }}>
          <Pressable onPress={onOpenGateway}>
            <Text style={{ color: '#8FA0D0', fontWeight: '800' }}>Back to Floently products</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


export function NativeLandingScreen() {
  const { copy } = useNativePublicCopy();
  const common = copy.common ?? {};
  const landing = copy.landing ?? {};

  const eyebrow = firstString(
    landing,
    ['eyebrow', 'badge', 'heroEyebrow'],
    'Pass YKI, succeed at work, love Finland',
  );

  const title1 = firstString(
    landing,
    ['h1Line1', 'title1', 'headlineTop', 'heroTitleTop', 'heroLine1'],
    'Pass YKI.',
  );

  const title2 = firstString(
    landing,
    ['h1Line2', 'title2', 'headlineGradient', 'heroTitleGradient', 'heroLine2'],
    '',
  );

  const subtitle = firstString(
    landing,
    ['heroSub', 'subtitle', 'heroBody', 'body', 'lede'],
    '',
  );

  const explicitTrustItems = firstArray<string>(
    landing,
    ['trustItems', 'trust', 'badges'],
    [],
  );
  const trustItems = explicitTrustItems.length
    ? explicitTrustItems
    : [
        landing.trustBuiltForYki,
        landing.trustForProfessionals,
        landing.trustFreeToStart,
      ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  const explicitPathways = firstArray<AnyRecord>(landing, ['pathways', 'cards', 'routes'], []);
  const pathways = explicitPathways.length
    ? explicitPathways
    : [landing.learnerPath, landing.employerPath, landing.cityPath].filter(
        (item): item is AnyRecord => item && typeof item === 'object' && typeof item.title === 'string',
      );

  const heroPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heroPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [heroPulse]);

  const heroPulseStyle = {
    opacity: heroPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    }),
    transform: [
      {
        translateY: heroPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
      {
        scale: heroPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.06],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.darkSafe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.darkScroll} showsVerticalScrollIndicator={false}>
        <BrandHeader />

        <View style={styles.hero}>
            <Animated.View style={[styles.heroMotionWrap, heroPulseStyle]}>
            <Text style={styles.heroBadge}>{eyebrow}</Text>
            <Text style={styles.heroTitle}>{title1}</Text>
            <Text style={styles.heroGradient}>{title2}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
            </Animated.View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/auth/register' as never)}>
            <Text style={styles.primaryButtonText}>{common.startLearning ?? ''} →</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/auth/login' as never)}>
            <Text style={styles.secondaryButtonText}>{common.signIn ?? 'Sign in'}</Text>
          </Pressable>
        </View>

        <CorrectionPreview />

        <View style={styles.trustRow}>
          {trustItems.slice(0, 3).map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.trustItem}>• {item}</Text>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionIntro}>
          <Text style={styles.sectionEyebrow}>
            {firstString(landing, ['pathwaysEyebrow', 'sectionEyebrow'], 'Three pathways')}
          </Text>
          <Text style={styles.sectionTitle}>
            {firstString(landing, ['pathwaysTitle', 'sectionTitle'], 'YKI, workplace, and life in Finland.')}
          </Text>
          <Text style={styles.sectionBody}>
            {firstString(
              landing,
              ['pathwaysBody', 'sectionBody'],
              'Pick the pathway that matches your goal. Floently works at scale for individuals, companies and cities.',
            )}
          </Text>
        </View>

        <View style={styles.cardGrid}>
          {pathways.slice(0, 3).map((item, index) => (
            <Pressable
              key={`${item.title ?? index}`}
              style={styles.darkInfoCard}
              onPress={() => {
                if (index === 1) router.push('/for-organizations' as never);
                else if (index === 2) router.push('/contact' as never);
                else router.push('/auth/register' as never);
              }}
            >
              <Text style={styles.cardEyebrow}>{item.eyebrow ?? item.label ?? ''}</Text>
              <Text style={styles.darkCardTitle}>{item.title ?? ''}</Text>
              <Text style={styles.darkCardBody}>{item.body ?? ''}</Text>
              <Text style={styles.cardCta}>{item.cta ?? 'Open'} →</Text>
            </Pressable>
          ))}
        </View>

        <LanguagePicker />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {firstString(landing, ['footerMade'], firstString(copy.common ?? {}, ['footerMade', 'footerBuilt'], '© 2026 Floently. Built for Finland.'))}
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push('/for-organizations' as never)}>
              <Text style={styles.footerLink}>{common.forOrganizations ?? 'Organizations'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/auth/login' as never)}>
              <Text style={styles.footerLink}>{common.signIn ?? 'Sign in'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/contact' as never)}>
              <Text style={styles.footerLink}>{common.contact ?? 'Contact'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function NativeForOrganizationsScreen() {
  const { copy } = useNativePublicCopy();
  const common = copy.common ?? {};
  const org = copy.organizations ?? {};

  const rows = firstArray<AnyRecord>(
    org,
    ['whyRows', 'rows', 'whyItems'],
    [
      { label: 'YKI', value: 'readiness' },
      { label: 'Workplace', value: 'scenarios' },
      { label: 'Speaking', value: 'practice' },
    ],
  );

  const audiences = firstArray<AnyRecord>(org, ['audiences', 'audienceCards'], []);

  const pillars = firstArray<AnyRecord>(org, ['pillars', 'platformCards'], []);

  const pilotSteps = firstArray<string | AnyRecord>(org, ['pilotSteps', 'steps'], []);

  return (
    <SafeAreaView style={styles.lightSafe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.lightScroll} showsVerticalScrollIndicator={false}>
        <BrandHeader light />

        <View style={styles.orgHero}>
          <View style={styles.orgHeroText}>
            <Text style={styles.lightEyebrow}>
              {firstString(org, ['eyebrow', 'heroEyebrow'], '')}
            </Text>
            <Text style={styles.lightTitle}>
              {firstString(org, ['heroTitle', 'title'], '')}
            </Text>
            <Text style={styles.lightBody}>
              {firstString(
                org,
                ['heroBody', 'body'],
                '',
              )}
            </Text>
            <View style={styles.rowButtons}>
              <Pressable style={styles.lightPrimaryButton} onPress={() => router.push('/contact' as never)}>
                <Text style={styles.lightPrimaryText}>{common.bookDemo ?? ''} →</Text>
              </Pressable>
              <Pressable style={styles.lightSecondaryButton} onPress={() => router.push('/' as never)}>
                <Text style={styles.lightSecondaryText}>{common.learnerPage ?? ''}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.cardEyebrow}>
              {firstString(org, ['whyEyebrow'], '')}
            </Text>
            <Text style={styles.whyTitle}>
              {firstString(org, ['whyTitle'], '')}
            </Text>
            <Text style={styles.whyBody}>
              {firstString(
                org,
                ['whyBody'],
                '',
              )}
            </Text>
            {rows.slice(0, 3).map((row, index) => (
              <View key={index} style={styles.whyRow}>
                <Text style={styles.whyRowLabel}>{row.label ?? row.title ?? ''}</Text>
                <Text style={styles.whyRowValue}>{row.value ?? row.body ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.whiteSection}>
          <Text style={styles.lightEyebrow}>
            {firstString(org, ['audienceEyebrow'], '')}
          </Text>
          <Text style={styles.lightSectionTitle}>
            {firstString(org, ['audienceTitle'], '')}
          </Text>
          <Text style={styles.lightBody}>
            {firstString(
              org,
              ['audienceBody'],
              '',
            )}
          </Text>

          <View style={styles.lightCardGrid}>
            {audiences.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.lightInfoCard}>
                <Text style={styles.blueEyebrow}>{item.eyebrow ?? item.label ?? ''}</Text>
                <Text style={styles.lightCardTitle}>{item.title ?? ''}</Text>
                <Text style={styles.lightCardBody}>{item.body ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.navySection}>
          <Text style={styles.cardEyebrow}>
            {firstString(org, ['platformEyebrow'], '')}
          </Text>
          <Text style={styles.navyTitle}>
            {firstString(org, ['platformTitle'], '')}
          </Text>
          <Text style={styles.navyBody}>
            {firstString(
              org,
              ['platformBody'],
              '',
            )}
          </Text>

          <View style={styles.pillarGrid}>
            {pillars.slice(0, 4).map((item, index) => (
              <View key={index} style={styles.pillarCard}>
                <Text style={styles.cardEyebrow}>{item.eyebrow ?? item.label ?? ''}</Text>
                <Text style={styles.darkCardTitle}>{item.title ?? ''}</Text>
                <Text style={styles.darkCardBody}>{item.body ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.whiteSection}>
          <Text style={styles.lightEyebrow}>
            {firstString(org, ['pilotEyebrow'], 'Pilot model')}
          </Text>
          <Text style={styles.lightSectionTitle}>
            {firstString(org, ['pilotTitle'], 'Start small, measure usefulness, then scale.')}
          </Text>
          <Text style={styles.lightBody}>
            {firstString(
              org,
              ['pilotBody'],
              'A good organization pilot should be concrete and measurable.',
            )}
          </Text>

          <View style={styles.stepList}>
            {pilotSteps.slice(0, 4).map((step, index) => {
              const text = typeof step === 'string' ? step : step.body ?? step.title ?? '';
              return (
                <View key={index} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.stepText}>{text}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.demoCtaSection}>
          <Text style={styles.demoEyebrow}>{firstString(org, ['demoEyebrow'], 'Book demo')}</Text>
          <Text style={styles.demoCtaTitle}>{firstString(org, ['demoTitle'], 'Tell us about your organization.')}</Text>
          <Text style={styles.demoCtaBody}>
            {firstString(org, ['demoBody'], 'Use the contact form to send a demo request for your organization.')}
          </Text>
          <Pressable style={styles.demoButton} onPress={() => router.push('/contact' as never)}>
            <Text style={styles.demoButtonText}>{common.openContactForm ?? common.bookDemo ?? 'Open contact form'}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/' as never)}>
            <Text style={styles.demoBackText}>{common.backToFloently ?? 'Back to Floently'}</Text>
          </Pressable>
          <Text style={styles.demoNote}>{firstString(org, ['demoNote'], '')}</Text>
        </View>

        <LanguagePicker />
      </ScrollView>
    </SafeAreaView>
  );
}

export function NativeContactScreen() {
  const { copy } = useNativePublicCopy();
  const common = copy.common ?? {};
  const contact = copy.contact ?? {};
  const subject = encodeURIComponent('Floently demo request');
  const body = encodeURIComponent(
    firstString(
      contact,
      ['messagePlaceholder', 'body'],
      'Organization name:\nTarget group:\nNumber of learners:\nGoal:\nPreferred demo time:',
    ),
  );

  return (
    <SafeAreaView style={styles.lightSafe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.lightScroll}>
        <BrandHeader light />

        <View style={styles.contactCard}>
          <Text style={styles.lightEyebrow}>{firstString(contact, ['eyebrow'], 'Contact')}</Text>
          <Text style={styles.lightTitle}>
            {firstString(contact, ['title'], common.bookDemo ?? '')}
          </Text>
          <Text style={styles.lightBody}>
            {firstString(
              contact,
              ['copy', 'body'],
              'Request a Floently demo for employers, cities, training providers or integration programmes.',
            )}
          </Text>
          <Text style={styles.contactHint}>
            {firstString(contact, ['formIntro'], 'Send us an email and we will reply.')}
          </Text>

          <Pressable
            style={styles.lightPrimaryButtonWide}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`)}
          >
            <Text style={styles.lightPrimaryText}>{common.bookDemo ?? ''} →</Text>
          </Pressable>

          <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>

          <Pressable onPress={() => router.push('/for-organizations' as never)}>
            <Text style={styles.contactBack}>{common.backToFloently ?? 'Back to Floently'}</Text>
          </Pressable>
        </View>

        <LanguagePicker />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: Record<string, any> = StyleSheet.create({
  darkSafe: {
    flex: 1,
    backgroundColor: '#071738',
  },
  darkScroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 42,
  },
  lightSafe: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  lightScroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 42,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 58,
    height: 34,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  darkText: {
    color: '#0A1838',
  },
  headerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLink: {
    color: '#D8E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerLinkDark: {
    color: '#0A1838',
  },
  signInPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  signInPillLight: {
    borderColor: 'rgba(10,24,56,0.14)',
    backgroundColor: '#FFFFFF',
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  signInTextLight: {
    color: '#0A1838',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 22,
  },
  heroMotionWrap: {
    width: '100%',
    alignItems: 'center',
  },
  heroBadge: {
    color: '#77E6D8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(54,118,255,0.18)',
    overflow: 'hidden',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1.4,
  },
  heroGradient: {
    color: '#67D7CC',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1.2,
    marginBottom: 18,
  },
  heroSubtitle: {
    color: '#B9C9E8',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryButton: {
    minHeight: 58,
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#4F7DFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F6BFF',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 54,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  correctionCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(109,144,209,0.26)',
    backgroundColor: 'rgba(15,35,78,0.70)',
    padding: 18,
    marginTop: 14,
  },
  correctionKicker: {
    color: '#8FA5C9',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  correctionBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(104,225,218,0.55)',
    padding: 18,
    alignItems: 'center',
  },
  correctionSmall: {
    color: '#AEBCE0',
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 10,
  },
  correctionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  correctionBad: {
    color: '#FF8BA1',
    textDecorationLine: 'underline',
  },
  correctionGood: {
    color: '#69E2D2',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  correctionNote: {
    color: '#7F92B7',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 28,
  },
  trustItem: {
    color: '#7FE5DA',
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 34,
  },
  sectionIntro: {
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: '#6B91FF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionBody: {
    color: '#B9C9E8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  cardGrid: {
    gap: 12,
  },
  darkInfoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 18,
  },
  cardEyebrow: {
    color: '#6BE1D1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  darkCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 8,
  },
  darkCardBody: {
    color: '#B9C9E8',
    fontSize: 13,
    lineHeight: 20,
  },
  cardCta: {
    color: '#66E0D2',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 14,
  },
  languageWrap: {
    width: '100%',
    marginTop: 32,
    marginBottom: 18,
    alignItems: 'center',
  },
  languageCurrent: {
    width: '72%',
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(120,140,180,0.25)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  languageFlag: {
    fontSize: 18,
  },
  languageCurrentText: {
    color: '#0A1838',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  languageChevron: {
    color: '#52627A',
    fontSize: 12,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,10,25,0.52)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  languageModal: {
    maxHeight: '72%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  languageList: {
    maxHeight: 430,
  },
  languageOption: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  languageOptionActive: {
    backgroundColor: '#0A1838',
  },
  languageOptionText: {
    color: '#0A1838',
    fontSize: 14,
    fontWeight: '800',
  },
  languageOptionTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    paddingTop: 18,
    gap: 14,
  },
  footerText: {
    color: '#7F92B7',
    fontSize: 11,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  footerLink: {
    color: '#9BB0D2',
    fontSize: 11,
    fontWeight: '800',
  },
  orgHero: {
    gap: 18,
  },
  orgHeroText: {
    gap: 12,
  },
  lightEyebrow: {
    color: '#2F61E8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  lightTitle: {
    color: '#0A1838',
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.3,
  },
  lightBody: {
    color: '#425371',
    fontSize: 15,
    lineHeight: 23,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  lightPrimaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#2F6BFF',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightPrimaryButtonWide: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#2F6BFF',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  lightPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  lightSecondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,24,56,0.10)',
  },
  lightSecondaryText: {
    color: '#0A1838',
    fontSize: 14,
    fontWeight: '900',
  },
  whyCard: {
    backgroundColor: '#071738',
    borderRadius: 26,
    padding: 20,
    shadowColor: '#0A1838',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  whyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  whyBody: {
    color: '#C2D0EA',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  whyRow: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  whyRowLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  whyRowValue: {
    color: '#D8E5FF',
    fontSize: 13,
  },
  whiteSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginTop: 26,
    gap: 10,
  },
  lightSectionTitle: {
    color: '#0A1838',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  lightCardGrid: {
    gap: 12,
    marginTop: 10,
  },
  lightInfoCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(10,24,56,0.10)',
    backgroundColor: '#F7FAFF',
    padding: 16,
  },
  blueEyebrow: {
    color: '#2F61E8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  lightCardTitle: {
    color: '#0A1838',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  lightCardBody: {
    color: '#425371',
    fontSize: 13,
    lineHeight: 20,
  },
  navySection: {
    backgroundColor: '#071738',
    borderRadius: 28,
    padding: 22,
    marginTop: 26,
  },
  navyTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    marginBottom: 10,
  },
  navyBody: {
    color: '#B9C9E8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  pillarGrid: {
    gap: 12,
  },
  pillarCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  stepList: {
    gap: 10,
    marginTop: 10,
  },
  stepRow: {
    borderRadius: 16,
    backgroundColor: '#F1F5FD',
    borderWidth: 1,
    borderColor: 'rgba(10,24,56,0.08)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#071738',
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingTop: 8,
  },
  stepText: {
    color: '#253757',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
    fontWeight: '700',
  },
  demoCtaSection: {
    backgroundColor: '#0B1D46',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    marginTop: 26,
  },
  demoEyebrow: {
    color: '#78EFE0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  demoCtaTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  demoCtaBody: {
    color: '#C2D0EA',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  demoButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  demoButtonText: {
    color: '#071738',
    fontSize: 14,
    fontWeight: '900',
  },
  demoBackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 14,
  },
  demoNote: {
    color: '#8FA5C9',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    gap: 14,
    marginTop: 20,
  },
  contactHint: {
    color: '#52627A',
    fontSize: 13,
    lineHeight: 20,
  },
  contactEmail: {
    color: '#2F6BFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  contactBack: {
    color: '#0A1838',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
});
