import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { paymentService } from '../features/billing/services/paymentService';
import { startStorePurchase, supportsStoreBilling } from '../features/billing/services/storeBillingService';
import { useAuthStore } from './authStore';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';
import {
  ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  BILLING_PERIOD_OPTIONS,
  PROFESSION_OPTIONS,
  buildCheckoutRequest,
  estimateCheckoutTotal,
  getPlanByPathwayPeriod,
  professionListLabel,
  type BillingPeriod,
  type CheckoutPathway,
  type ProfessionKey,
} from '@core/api/entitlements';
import { useTranslator } from '../features/i18n';

const PREVIEW_OPTIONS: Array<{ id: 'yki' | ProfessionKey; title: string; detail: string }> = [
  { id: 'yki', title: 'Free Preview - YKI Pathway', detail: 'One YKI sampler, one guided conversation, and a limited pathway preview. The full exam stays locked.' },
  { id: 'nurse', title: 'Free Preview - Nurse Pathway', detail: 'One nurse pathway preview with one guided conversation and limited workplace Finnish access.' },
  { id: 'doctor', title: 'Free Preview - Doctor Pathway', detail: 'One doctor pathway preview with one guided conversation and limited workplace Finnish access.' },
  { id: 'practical_nurse', title: 'Free Preview - Practical Nurse Pathway', detail: 'One practical nurse pathway preview with one guided conversation and limited workplace Finnish access.' },
];

const PATHWAYS: Array<{ id: CheckoutPathway; title: string; eyebrow: string; detail: string; highlights: string[] }> = [
  {
    id: 'yki',
    title: 'YKI Pathway',
    eyebrow: 'Exam and residence route',
    detail: 'YKI speaking, writing, reading, and listening practice for citizenship, permanent residence, study, and daily life.',
    highlights: ['YKI practice and guided feedback', 'No profession selection needed', 'Simple individual exam route'],
  },
  {
    id: 'professional',
    title: 'Professional Pathway',
    eyebrow: 'Role-specific work route',
    detail: 'Select one or more professions and unlock Finnish for workplace communication, documentation, teamwork, and real role situations.',
    highlights: ['One profession included', 'Extra professions become extra slots', 'Extra slots get a discount'],
  },
  {
    id: 'combined',
    title: 'Combined Pathway',
    eyebrow: 'Best for YKI plus work',
    detail: 'YKI preparation plus one selected profession, with the option to add more professional tracks when needed.',
    highlights: ['YKI plus one profession included', 'Add additional profession slots', 'Best complete learner route'],
  },
];

type Props = { onBack: () => void; onOpenMenu: () => void };

export default function BillingRoute({ onBack, onOpenMenu }: Props) {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [trialBusy, setTrialBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  const [selectedProfessions, setSelectedProfessions] = useState<ProfessionKey[]>(['nurse']);
  const user = useAuthStore((state) => state.user);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const refreshSubscription = useSubscriptionStore((state) => state.refresh);
  const subscription = useSubscriptionStore((state) => state.status);
  const startPreview = useSubscriptionStore((state) => state.startPreview);
  const endPreview = useSubscriptionStore((state) => state.endPreview);
  const { t } = useTranslator();

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    void hydrateSubscription({
      email: user?.email ?? null,
      subscriptionTierHint: user?.subscriptionTier ?? null,
    });
  }, [hydrateSubscription, user?.email, user?.subscriptionTier]);

  useEffect(() => {
    if (subscription?.professions?.length) {
      setSelectedProfessions(subscription.professions);
    }
  }, [subscription?.professions]);

  const organisationPlans = useMemo(() => [
    {
      id: 'employer_programme',
      title: 'Employer Programme Access',
      detail: 'Support international employees with YKI preparation, workplace Finnish, onboarding language, and role-based communication practice.',
    },
    {
      id: 'city_programme',
      title: 'City Programme Access',
      detail: 'Offer residents a scalable pathway for YKI, employability, integration, citizenship, and permanent residence language goals.',
    },
  ], []);

  async function openUrl(url: string | undefined) {
    if (!url) {
      Alert.alert('Billing unavailable', 'The billing link was missing from the server response.');
      return;
    }
    await Linking.openURL(url);
  }

  function toggleProfession(profession: ProfessionKey) {
    setSelectedProfessions((current) => {
      if (current.includes(profession)) {
        return current.length === 1 ? current : current.filter((item) => item !== profession);
      }
      return [...current, profession];
    });
  }

  async function handleCheckout(pathway: CheckoutPathway) {
    const request = buildCheckoutRequest(pathway, period, selectedProfessions);
    try {
      setBusyPlan(request.plan);
      if (pathway !== 'yki' && selectedProfessions.length === 0) {
        Alert.alert('Choose a profession', 'Select at least one profession before checkout.');
        return;
      }
      if (supportsStoreBilling()) {
        if (pathway !== 'yki' && selectedProfessions.length > 1) {
          Alert.alert('Use web checkout', 'Multiple profession slots need the Stripe checkout flow so the selected professions can be attached to the subscription.');
          return;
        }
        await startStorePurchase(request.plan);
        Alert.alert(
          'In-app billing',
          'Store purchase flow is enabled for release builds. If you are running a dev client, complete the purchase on a store-enabled build.',
        );
        return;
      }
      const session = await paymentService.createCheckoutSession(request) as { checkout_url?: string; url?: string } | undefined;
      await openUrl(session?.url ?? session?.checkout_url);
    } catch (error) {
      Alert.alert('Purchase unavailable', error instanceof Error ? error.message : 'The purchase flow could not be started.');
    } finally {
      setBusyPlan(null);
    }
  }

  async function handlePortal() {
    try {
      setPortalBusy(true);
      const session = await paymentService.createPortalSession() as { portal_url?: string; url?: string } | undefined;
      await openUrl(session?.url ?? session?.portal_url);
    } catch (error) {
      Alert.alert('Portal unavailable', error instanceof Error ? error.message : 'The billing portal could not be opened.');
    } finally {
      setPortalBusy(false);
    }
  }

  async function handleStartTrial() {
    try {
      setTrialBusy(true);
      await paymentService.startSubscriptionTrial(3);
      await refreshSubscription({
        email: user?.email ?? null,
        subscriptionTierHint: user?.subscriptionTier ?? null,
      });
      const session = await paymentService.createCheckoutSession('trial_3day') as { checkout_url?: string; url?: string } | undefined;
      await openUrl(session?.url ?? session?.checkout_url);
    } catch (error) {
      Alert.alert('Trial unavailable', error instanceof Error ? error.message : 'The trial flow could not be started.');
    } finally {
      setTrialBusy(false);
    }
  }

  function renderProfessionSelector() {
    return (
      <View style={styles.professionBox}>
        <View style={styles.planTopRow}>
          <Text style={[styles.professionTitle, { color: palette.text }]}>Profession slots</Text>
          <Text style={[styles.planChipText, { color: palette.primary }]}>{selectedProfessions.length} selected</Text>
        </View>
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
                  { backgroundColor: selected ? palette.primary : palette.surface, borderColor: selected ? palette.primary : palette.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.professionPillText, { color: selected ? textOnPrimary : palette.text }]}>{option.shortLabel}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedProfessions.length > 1 ? (
          <Text style={[styles.planBody, { color: palette.accent }]}>Extra profession slots use {ADDITIONAL_PROFESSION_DISCOUNT_PERCENT}% off.</Text>
        ) : null}
      </View>
    );
  }

  return (
    <AppScaffold
      allowScroll
      themeMode={themeMode}
      header={
        <PageHeader
          themeMode={themeMode}
          eyebrow="Access"
          title="Choose the pathway that fits your goals in Finland"
          subtitle="Three individual plans stay visible. Use the billing toggle and profession slots instead of creating hundreds of payment products."
          actionLabel="Home"
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.statusCard, { backgroundColor: palette.primary, shadowColor: palette.shadow }]}>
        <Text style={styles.statusLabel}>{t('settingsAccessType')}</Text>
        <Text style={styles.statusTitle}>{subscription?.planLabel ?? '...'}</Text>
        <Text style={styles.statusBody}>{subscription?.accessSummary ?? ''}</Text>
        {subscription?.accessLabel ? <Text style={styles.statusMeta}>{t('settingsAccessType')} - {subscription.accessLabel}</Text> : null}
      </View>

      <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.portalTitle, { color: palette.text }]}>{trialBusy ? 'Starting 3-day trial...' : 'Start 3-day trial'}</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>Free preview stays separate from paid Stripe access. It gives a small taste before the learner chooses a pathway.</Text>
        <Pressable accessibilityRole="button" onPress={() => { void handleStartTrial(); }} style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
          <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>Activate trial</Text>
        </Pressable>
        <View style={styles.stack}>
          {PREVIEW_OPTIONS.map((option) => (
            <Pressable key={option.id} accessibilityRole="button" onPress={() => { startPreview(option.id); Alert.alert('Preview started', `${option.title} is now active on this device session.`); }} style={({ pressed }) => [styles.planCardSmall, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>{option.title}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{option.detail}</Text>
            </Pressable>
          ))}
          {subscription?.isPreview ? (
            <Pressable accessibilityRole="button" onPress={() => { endPreview(); Alert.alert('Preview cleared', 'Preview mode was removed from this device session.'); }} style={({ pressed }) => [styles.planCardSmall, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>Clear preview</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>Return this device session to the locked free state.</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <Pressable accessibilityRole="button" onPress={() => { void handlePortal(); }} style={({ pressed }) => [styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
          <Text style={[styles.portalTitle, { color: palette.text }]}>{portalBusy ? 'Opening portal...' : 'Manage subscription'}</Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>Customer portal, invoices, payment method, and pathway access details.</Text>
        </Pressable>
      ) : (
        <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.portalTitle, { color: palette.text }]}>Manage subscription</Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>On mobile, single-slot purchases can run through app store billing. Multi-profession subscriptions should use web checkout.</Text>
        </View>
      )}

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose a paid pathway</Text>
        <Text style={[styles.sectionBody, { color: palette.textMuted }]}>The Microsoft-style layout keeps only three choices visible. Billing period and profession count do the rest.</Text>
      </View>

      <View style={[styles.segmentWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {BILLING_PERIOD_OPTIONS.map((option) => {
          const active = period === option.key;
          return (
            <Pressable key={option.key} accessibilityRole="button" onPress={() => setPeriod(option.key)} style={[styles.segmentButton, { backgroundColor: active ? palette.primary : 'transparent' }]}>
              <Text style={[styles.segmentText, { color: active ? textOnPrimary : palette.text }]}>{option.label}</Text>
              <Text style={[styles.segmentSubtext, { color: active ? textOnPrimary : palette.textMuted }]}>{option.savingsLabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.pathwayGrid}>
        {PATHWAYS.map((pathway) => {
          const estimate = estimateCheckoutTotal(pathway.id, period, selectedProfessions);
          const plan = getPlanByPathwayPeriod(pathway.id, period);
          const isBusy = busyPlan === plan.id;
          const needsProfession = pathway.id !== 'yki';
          return (
            <View key={pathway.id} style={[styles.pricingCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
              <View style={styles.planTopRow}>
                <Text style={[styles.planEyebrow, { color: palette.primary }]}>{pathway.eyebrow}</Text>
                <View style={[styles.planChip, { backgroundColor: palette.primarySurface }]}>
                  <Text style={[styles.planChipText, { color: palette.primary }]}>{plan.checkoutLabel}</Text>
                </View>
              </View>
              <Text style={[styles.pricingTitle, { color: palette.text }]}>{pathway.title}</Text>
              <Text style={[styles.portalBody, { color: palette.textMuted }]}>{pathway.detail}</Text>
              <Text style={[styles.priceText, { color: palette.text }]}>{estimate.totalLabel}</Text>
              {needsProfession ? <Text style={[styles.portalBody, { color: palette.textMuted }]}>{professionListLabel(selectedProfessions)}</Text> : null}
              {needsProfession ? renderProfessionSelector() : null}
              <View style={styles.stackTight}>
                {pathway.highlights.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <Text style={[styles.check, { color: palette.accent }]}>✓</Text>
                    <Text style={[styles.planBody, { color: palette.textMuted }]}>{item}</Text>
                  </View>
                ))}
              </View>
              <Pressable accessibilityRole="button" onPress={() => { void handleCheckout(pathway.id); }} style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
                <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>{isBusy ? 'Opening checkout...' : 'Start checkout'}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.organisationCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.portalTitle, { color: palette.text }]}>Need access for employees, residents, or programme participants?</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>Employer and city programme access remains separate from individual Stripe subscriptions, just as planned.</Text>
        <View style={styles.stack}>
          {organisationPlans.map((option) => (
            <View key={option.id} style={[styles.planCardSmall, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>{option.title}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{option.detail}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Contact sales', 'Use the web demo flow to discuss employer or city programme access.')} style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
            <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>Book a demo</Text>
          </Pressable>
        </View>
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  statusCard: { borderRadius: 24, padding: 18, gap: 8, shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  statusLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  statusTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  statusBody: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20 },
  statusMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
  portalButton: { borderRadius: 20, padding: 16, gap: 10, borderWidth: 1 },
  portalTitle: { fontSize: 16, fontWeight: '800' },
  portalBody: { fontSize: 13, lineHeight: 18 },
  sectionHeading: { gap: 6, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionBody: { fontSize: 13, lineHeight: 19 },
  stack: { gap: 12 },
  stackTight: { gap: 7 },
  segmentWrap: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 4, gap: 4 },
  segmentButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  segmentText: { fontSize: 13, fontWeight: '900' },
  segmentSubtext: { fontSize: 10, fontWeight: '700' },
  pathwayGrid: { gap: 14 },
  pricingCard: { borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 1 },
  planCardSmall: { borderRadius: 18, padding: 14, gap: 7, borderWidth: 1 },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  planEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase', flex: 1 },
  pricingTitle: { fontSize: 21, fontWeight: '900' },
  priceText: { fontSize: 26, fontWeight: '900' },
  planTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  planBody: { fontSize: 13, lineHeight: 19, flex: 1 },
  planChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  planChipText: { fontSize: 11, fontWeight: '800' },
  professionBox: { gap: 9 },
  professionTitle: { fontSize: 13, fontWeight: '900' },
  professionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  professionPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  professionPillText: { fontSize: 12, fontWeight: '800' },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  check: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  organisationCard: { borderRadius: 22, padding: 18, gap: 12, borderWidth: 1 },
  organisationCta: { minHeight: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  organisationCtaText: { fontWeight: '800' },
  pressed: { opacity: 0.92 },
});
