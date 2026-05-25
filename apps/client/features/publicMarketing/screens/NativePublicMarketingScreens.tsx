import React, { useMemo, useState } from 'react';
import {
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
            {common.forOrganizations ?? common.forOrganizationsArrow ?? 'For organizations'}
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

  const label = firstString(
    landing,
    ['correction.kicker', 'demo.kicker', 'liveCorrectionLabel', 'correctionEyebrow'],
    'Floently · live correction',
  );

  const note = firstString(
    landing,
    ['correction.note', 'demo.note', 'demoCaption', 'correctionBody'],
    'Practice Finnish, get corrected, and learn the rule.',
  );

  return (
    <View style={styles.correctionCard}>
      <Text style={styles.correctionKicker}>{label}</Text>
      <View style={styles.correctionBox}>
        <Text style={styles.correctionSmall}>YOUR ANSWER IN FINNISH</Text>
        <Text style={styles.correctionText}>
          Kävin <Text style={styles.correctionBad}>apteekkiin</Text> eilen.
        </Text>
        <Text style={styles.correctionGood}>Now it sounds Finnish. One step closer to YKI.</Text>
      </View>
      <Text style={styles.correctionNote}>{note}</Text>
    </View>
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
    ['title1', 'headlineTop', 'heroTitleTop', 'heroLine1'],
    'Pass YKI.',
  );

  const title2 = firstString(
    landing,
    ['title2', 'headlineGradient', 'heroTitleGradient', 'heroLine2'],
    'Speak Finnish at work.',
  );

  const subtitle = firstString(
    landing,
    ['subtitle', 'heroBody', 'body', 'lede'],
    'Real Finnish for YKI and work — built for professionals preparing to live and work in Finland.',
  );

  const trustItems = firstArray<string>(
    landing,
    ['trustItems', 'trust', 'badges'],
    ['Built for YKI', 'For professionals', 'Free to start'],
  );

  const pathways = firstArray<AnyRecord>(
    landing,
    ['pathways', 'cards', 'routes'],
    [
      {
        eyebrow: 'For learners',
        title: 'Pass YKI and start profession.',
        body: 'Reading, listening, writing and speaking — built around YKI and the Finnish you need at work.',
        cta: common.startLearning ?? 'Start learning',
      },
      {
        eyebrow: 'For employers',
        title: 'Onboard and retain international staff.',
        body: 'Workplace Finnish for safer communication, faster onboarding, and stronger retention.',
        cta: common.bookDemo ?? 'Book a pilot',
      },
      {
        eyebrow: 'For cities',
        title: 'A scalable language pathway.',
        body: 'Connect language learning to employability and long-term participation in Finnish society.',
        cta: common.contact ?? 'Talk to us',
      },
    ],
  );

  return (
    <SafeAreaView style={styles.darkSafe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.darkScroll} showsVerticalScrollIndicator={false}>
        <BrandHeader />

        <View style={styles.hero}>
          <Text style={styles.heroBadge}>{eyebrow}</Text>
          <Text style={styles.heroTitle}>{title1}</Text>
          <Text style={styles.heroGradient}>{title2}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/auth/register' as never)}>
            <Text style={styles.primaryButtonText}>{common.startLearning ?? 'Start learning'} →</Text>
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
            {firstString(copy.common ?? {}, ['footerMade', 'footerBuilt'], '© 2026 Floently. Built for Finland.')}
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

  const audiences = firstArray<AnyRecord>(
    org,
    ['audiences', 'audienceCards'],
    [
      {
        eyebrow: 'Employers',
        title: 'Onboard international staff with safer Finnish communication.',
        body: 'Give employees a structured path from everyday Finnish to role-specific workplace situations.',
      },
      {
        eyebrow: 'Cities and municipalities',
        title: 'Connect language learning to integration and employment.',
        body: 'Support newcomers with Finnish practice tied to YKI readiness and work life.',
      },
      {
        eyebrow: 'Training providers',
        title: 'Add AI-supported speaking practice around your programme.',
        body: 'Use Floently as a practice layer between lessons.',
      },
    ],
  );

  const pillars = firstArray<AnyRecord>(
    org,
    ['pillars', 'platformCards'],
    [
      { eyebrow: 'YKI pathway', title: 'Exam readiness with real skill practice', body: 'Reading, listening, writing and speaking practice are structured around the skills learners need.' },
      { eyebrow: 'Professional Finnish', title: 'Role-specific communication', body: 'Profession tracks help learners practise phrases, decisions and misunderstandings from work.' },
      { eyebrow: 'Speaking and roleplay', title: 'Confidence before real conversations', body: 'Learners practise with AI roleplay and correction loops.' },
      { eyebrow: 'Programme visibility', title: 'A clearer view of learner progress', body: 'Support learning with clearer progress signals.' },
    ],
  );

  const pilotSteps = firstArray<string | AnyRecord>(
    org,
    ['pilotSteps', 'steps'],
    [
      'Choose the target group.',
      'Pick the training goal.',
      'Run a small pilot and collect feedback.',
      'Decide whether Floently should scale.',
    ],
  );

  return (
    <SafeAreaView style={styles.lightSafe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.lightScroll} showsVerticalScrollIndicator={false}>
        <BrandHeader light />

        <View style={styles.orgHero}>
          <View style={styles.orgHeroText}>
            <Text style={styles.lightEyebrow}>
              {firstString(org, ['eyebrow', 'heroEyebrow'], 'For organizations')}
            </Text>
            <Text style={styles.lightTitle}>
              {firstString(org, ['heroTitle', 'title'], 'Finnish language support for work, integration and retention.')}
            </Text>
            <Text style={styles.lightBody}>
              {firstString(
                org,
                ['heroBody', 'body'],
                'Floently helps organizations support international talent with practical Finnish.',
              )}
            </Text>
            <View style={styles.rowButtons}>
              <Pressable style={styles.lightPrimaryButton} onPress={() => router.push('/contact' as never)}>
                <Text style={styles.lightPrimaryText}>{common.bookDemo ?? 'Book demo'} →</Text>
              </Pressable>
              <Pressable style={styles.lightSecondaryButton} onPress={() => router.push('/' as never)}>
                <Text style={styles.lightSecondaryText}>{common.learnerPage ?? 'Learner page'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.cardEyebrow}>
              {firstString(org, ['whyEyebrow'], 'Why it matters')}
            </Text>
            <Text style={styles.whyTitle}>
              {firstString(org, ['whyTitle'], 'Language is not only an exam problem.')}
            </Text>
            <Text style={styles.whyBody}>
              {firstString(
                org,
                ['whyBody'],
                'It affects onboarding, safety, confidence, customer communication and whether people feel they can build a future in Finland.',
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
            {firstString(org, ['audienceEyebrow'], 'Who it serves')}
          </Text>
          <Text style={styles.lightSectionTitle}>
            {firstString(org, ['audienceTitle'], 'Built for the organizations helping people succeed in Finland.')}
          </Text>
          <Text style={styles.lightBody}>
            {firstString(
              org,
              ['audienceBody'],
              'This page explains why an organization would use Floently and what kind of pilot makes sense.',
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
            {firstString(org, ['platformEyebrow'], 'What Floently provides')}
          </Text>
          <Text style={styles.navyTitle}>
            {firstString(org, ['platformTitle'], 'A learning layer for YKI, work and real conversations.')}
          </Text>
          <Text style={styles.navyBody}>
            {firstString(
              org,
              ['platformBody'],
              'Floently gives learners repeated practice and gives organizations a clearer way to support language development.',
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
            {firstString(contact, ['title'], common.bookDemo ?? 'Book demo')}
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
            <Text style={styles.lightPrimaryText}>{common.bookDemo ?? 'Book demo'} →</Text>
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
