import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { paymentService } from '../services/paymentService';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import {
  ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  BILLING_PERIOD_OPTIONS,
  PROFESSION_OPTIONS,
  buildCheckoutRequest,
  estimateCheckoutTotal,
  getPlanByPathwayPeriod,
  normalizeBillingPeriod,
  normalizeProfession,
  professionListLabel,
  type BillingPeriod,
  type CheckoutPathway,
  type ProfessionKey,
} from '@core/api/entitlements';
import { useOnboardingSession } from '../../onboarding/state/useOnboardingSession';

const PATHWAYS: Array<{ id: CheckoutPathway; title: string; eyebrow: string; body: string; highlights: string[] }> = [
  {
    id: 'yki',
    title: 'YKI Pathway',
    eyebrow: 'For exam and residence goals',
    body: 'Practice speaking, writing, reading, and listening for YKI, citizenship, permanent residence, study, and daily life.',
    highlights: ['YKI speaking and writing tasks', 'Guided corrections and progress', 'Best for learners who only need YKI'],
  },
  {
    id: 'professional',
    title: 'Professional Pathway',
    eyebrow: 'For role-specific Finnish',
    body: 'Choose one or more professions and build Finnish for real workplace situations, documentation, teamwork, and communication.',
    highlights: ['One profession included', 'Add more professions anytime', 'Extra profession slots get a discount'],
  },
  {
    id: 'combined',
    title: 'Combined Pathway',
    eyebrow: 'Best for YKI plus work',
    body: 'Prepare for YKI while also building professional Finnish in one or more chosen professions.',
    highlights: ['YKI plus one profession included', 'Add extra professions as slots', 'Best long-term pathway'],
  },
];

const TRIAL_INCLUDES = [
  '1 roleplay session with a Finnish persona',
  '1 card practice session',
  'YKI preview: 1 YKI practice set on the YKI path',
  'Home, Progress, Settings, and Help',
];

function pathwayFromOnboarding(intent?: string): CheckoutPathway {
  if (intent === 'PROFESSIONAL') return 'professional';
  if (intent === 'BOTH') return 'combined';
  return 'yki';
}

export default function SubscriptionScreen() {
  const [tier, setTier] = useState<string>('free');
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

  const onboardingIntent = useOnboardingSession((s) => s.intentType);
  const onboardingProfession = useOnboardingSession((s) => s.profession);
  const onboardingBilling = useOnboardingSession((s) => s.preferredBillingPeriod);

  const defaultProfession = normalizeProfession(onboardingProfession) ?? 'nurse';
  const [period, setPeriod] = useState<BillingPeriod>(() => normalizeBillingPeriod(onboardingBilling ?? 'yearly'));
  const [selectedProfessions, setSelectedProfessions] = useState<ProfessionKey[]>([defaultProfession]);
  const recommendedPathway = useMemo(() => pathwayFromOnboarding(onboardingIntent), [onboardingIntent]);

  useEffect(() => {
    void paymentService
      .getSubscriptionStatus()
      .then((s: unknown) => {
        const record = (s ?? {}) as { billingTier?: string; tier?: string };
        setTier(record.billingTier ?? record.tier ?? 'free');
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const profession = normalizeProfession(onboardingProfession);
    if (profession) {
      setSelectedProfessions((current) => current.includes(profession) ? current : [profession, ...current]);
    }
  }, [onboardingProfession]);

  function toggleProfession(profession: ProfessionKey) {
    setSelectedProfessions((current) => {
      if (current.includes(profession)) {
        return current.length === 1 ? current : current.filter((item) => item !== profession);
      }
      return [...current, profession];
    });
  }

  async function openCheckout(pathway: CheckoutPathway) {
    try {
      if (pathway !== 'yki' && selectedProfessions.length === 0) {
        Alert.alert('Choose a profession', 'Select at least one profession before starting checkout.');
        return;
      }
      await paymentService.startSubscriptionTrial(3);
      const request = buildCheckoutRequest(pathway, period, selectedProfessions);
      const session = await paymentService.createCheckoutSession(request) as { url?: string; checkout_url?: string } | null;
      const url = session?.url ?? session?.checkout_url;
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Billing unavailable', 'The checkout link was missing from the server response.');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not start checkout. Please try again.';
      Alert.alert('Checkout setup failed', message);
    }
  }

  function renderProfessionSelector() {
    return (
      <View style={styles.professionBox}>
        <View style={styles.professionHeaderRow}>
          <Text style={[styles.professionTitle, { color: palette.text }]}>Choose profession slots</Text>
          <Text style={[styles.professionCount, { color: palette.primary }]}>{selectedProfessions.length} selected</Text>
        </View>
        <Text style={[styles.professionHelp, { color: palette.textMuted }]}>Add two or more professions only when the learner truly needs multiple role tracks.</Text>
        <View style={styles.professionGrid}>
          {PROFESSION_OPTIONS.map((option) => {
            const selected = selectedProfessions.includes(option.key);
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                onPress={() => toggleProfession(option.key)}
                style={({ pressed }) => [
                  styles.professionPill,
                  {
                    backgroundColor: selected ? palette.primary : palette.surface,
                    borderColor: selected ? palette.primary : palette.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.professionPillText, { color: selected ? textOnPrimary : palette.text }]}>{option.shortLabel}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedProfessions.length > 1 ? (
          <Text style={[styles.discountText, { color: palette.accent }]}>Extra profession slots use {ADDITIONAL_PROFESSION_DISCOUNT_PERCENT}% off.</Text>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background, paddingBottom: spacing.xxxl }}
      style={{ backgroundColor: palette.background }}
    >
      <View style={[styles.hero, { backgroundColor: palette.primary, shadowColor: palette.shadow }]}>
        <Text style={styles.heroEyebrow}>FLOENTLY ACCESS</Text>
        <Text style={styles.heroTitle}>Three simple paths. No profession-specific payment maze.</Text>
        <Text style={styles.heroBody}>Choose YKI, Professional, or Combined. Professions are selected as slots, so new professions can be added without creating new Stripe products.</Text>
      </View>

      {tier && tier !== 'free' ? (
        <View style={[styles.currentPlan, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.currentPlanLabel, { color: palette.textMuted }]}>Current plan</Text>
          <Text style={[styles.currentPlanTitle, { color: palette.text }]}>{tier}</Text>
        </View>
      ) : null}

      <View style={[styles.segmentWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {BILLING_PERIOD_OPTIONS.map((option) => {
          const active = period === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              onPress={() => setPeriod(option.key)}
              style={[styles.segmentButton, { backgroundColor: active ? palette.primary : 'transparent' }]}
            >
              <Text style={[styles.segmentText, { color: active ? textOnPrimary : palette.text }]}>{option.label}</Text>
              <Text style={[styles.segmentSubtext, { color: active ? textOnPrimary : palette.textMuted }]}>{option.savingsLabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.planStack}>
        {PATHWAYS.map((pathway) => {
          const plan = getPlanByPathwayPeriod(pathway.id, period);
          const estimate = estimateCheckoutTotal(pathway.id, period, selectedProfessions);
          const recommended = pathway.id === recommendedPathway;
          const needsProfession = pathway.id !== 'yki';
          return (
            <View
              key={pathway.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: recommended ? palette.primarySurface : palette.surface,
                  borderColor: recommended ? palette.primary : palette.border,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              {recommended ? (
                <View style={[styles.recommendedBadge, { backgroundColor: palette.primary }]}>
                  <Text style={[styles.recommendedText, { color: textOnPrimary }]}>RECOMMENDED</Text>
                </View>
              ) : null}
              <Text style={[styles.cardEyebrow, { color: palette.primary }]}>{pathway.eyebrow}</Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{pathway.title}</Text>
              <Text style={[styles.cardBody, { color: palette.textMuted }]}>{pathway.body}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: palette.text }]}>{estimate.totalLabel}</Text>
                {needsProfession ? <Text style={[styles.priceMeta, { color: palette.textMuted }]}>{professionListLabel(selectedProfessions)}</Text> : null}
              </View>

              {needsProfession ? renderProfessionSelector() : null}

              <View style={styles.highlightList}>
                {pathway.highlights.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <Text style={[styles.check, { color: palette.accent }]}>✓</Text>
                    <Text style={[styles.highlightText, { color: palette.textMuted }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => { void openCheckout(pathway.id); }}
                style={({ pressed }) => [styles.cta, { backgroundColor: palette.primary }, pressed && styles.pressed]}
              >
                <Text style={[styles.ctaText, { color: textOnPrimary }]}>Start 3-day free trial</Text>
              </Pressable>
              <Text style={[styles.planFinePrint, { color: palette.textMuted }]}>{plan.checkoutLabel}. Cancel before day 3.</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.infoTitle, { color: palette.text }]}>What the free preview covers</Text>
        {TRIAL_INCLUDES.map((item) => (
          <View key={item} style={styles.highlightRow}>
            <Text style={[styles.check, { color: palette.accent }]}>✓</Text>
            <Text style={[styles.highlightText, { color: palette.textMuted }]}>{item}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => {
          Alert.alert(
            'For organisations',
            'Employer and city programme access remain separate from individual Stripe subscriptions and can be configured through organisation setup.',
          );
        }}
        style={{ padding: spacing.sm }}
      >
        <Text style={{ color: palette.textMuted, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>
          Employer and city programme access
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, padding: 22, gap: 10, shadowOpacity: 1, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  heroEyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', lineHeight: 32 },
  heroBody: { color: 'rgba(255,255,255,0.86)', fontSize: 14, lineHeight: 21 },
  currentPlan: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 3 },
  currentPlanLabel: { fontSize: 12, fontWeight: '700' },
  currentPlanTitle: { fontSize: 15, fontWeight: '800' },
  segmentWrap: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 4, gap: 4 },
  segmentButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  segmentText: { fontSize: 13, fontWeight: '900' },
  segmentSubtext: { fontSize: 10, fontWeight: '700' },
  planStack: { gap: 16 },
  planCard: { borderRadius: 24, padding: 18, borderWidth: 1, gap: 12, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 1 },
  recommendedBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  recommendedText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  cardEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  cardTitle: { fontSize: 21, fontWeight: '900' },
  cardBody: { fontSize: 13, lineHeight: 19 },
  priceRow: { gap: 2 },
  priceText: { fontSize: 26, fontWeight: '900' },
  priceMeta: { fontSize: 12, fontWeight: '700' },
  professionBox: { gap: 9 },
  professionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  professionTitle: { fontSize: 13, fontWeight: '900' },
  professionCount: { fontSize: 12, fontWeight: '900' },
  professionHelp: { fontSize: 12, lineHeight: 17 },
  professionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  professionPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  professionPillText: { fontSize: 12, fontWeight: '800' },
  discountText: { fontSize: 12, fontWeight: '800' },
  highlightList: { gap: 7 },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  check: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  highlightText: { flex: 1, fontSize: 13, lineHeight: 18 },
  cta: { borderRadius: 999, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  ctaText: { fontSize: 14, fontWeight: '900' },
  planFinePrint: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
  infoCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 9 },
  infoTitle: { fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.9 },
});
