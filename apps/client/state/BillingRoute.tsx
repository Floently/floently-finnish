import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { paymentService } from '../features/billing/services/paymentService';
import { startStorePurchase, supportsStoreBilling } from '../features/billing/services/storeBillingService';
import { useAuthStore } from './authStore';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';
import { PLAN_CATALOG, type ProfessionKey } from '@core/api/entitlements';
import { useTranslator } from '../features/i18n';

const PREVIEW_OPTIONS: Array<{ id: 'yki' | ProfessionKey; title: string; detail: string }> = [
  { id: 'yki', title: 'Free Preview · YKI Pathway', detail: 'One YKI sampler, one guided conversation, and a limited pathway preview. The full exam stays locked.' },
  { id: 'nurse', title: 'Free Preview · Nurse Pathway', detail: 'One nurse pathway preview with one guided conversation and limited workplace Finnish access.' },
  { id: 'doctor', title: 'Free Preview · Doctor Pathway', detail: 'One doctor pathway preview with one guided conversation and limited workplace Finnish access.' },
  { id: 'practical_nurse', title: 'Free Preview · Practical Nurse Pathway', detail: 'One practical nurse pathway preview with one guided conversation and limited workplace Finnish access.' },
];

type Props = { onBack: () => void; onOpenMenu: () => void };

export default function BillingRoute({ onBack, onOpenMenu }: Props) {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [trialBusy, setTrialBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const user = useAuthStore((state) => state.user);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
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

  const groupedPlans = useMemo(() => ({
    learner: PLAN_CATALOG,
    organisation: [
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
    ],
  }), []);

  async function openUrl(url: string | undefined) {
    if (!url) {
      Alert.alert('Billing unavailable', 'The billing link was missing from the server response.');
      return;
    }
    await Linking.openURL(url);
  }

  async function handleCheckout(planId: string) {
    try {
      setBusyPlan(planId);
      if (supportsStoreBilling()) {
        await startStorePurchase(planId);
        Alert.alert(
          'In-app billing',
          'Store purchase flow is enabled for release builds. If you are running a dev client, complete the purchase on a store-enabled build.',
        );
        return;
      }
      const session = await paymentService.createCheckoutSession(planId) as { checkout_url?: string; url?: string } | undefined;
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

  return (
    <AppScaffold
      allowScroll
      themeMode={themeMode}
      header={
        <PageHeader
          themeMode={themeMode}
          eyebrow="Access"
          title="Choose the pathway that fits your goals in Finland"
          subtitle="Start with YKI, workplace Finnish, or a combined pathway. Employer and city access options are also available."
          actionLabel="Home"
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.statusCard, { backgroundColor: palette.primary, shadowColor: palette.shadow }]}> 
        <Text style={styles.statusLabel}>{t('settingsAccessType')}</Text>
        <Text style={styles.statusTitle}>{subscription?.planLabel ?? '…'}</Text>
        <Text style={styles.statusBody}>{subscription?.accessSummary ?? ''}</Text>
        {subscription?.accessLabel ? <Text style={styles.statusMeta}>{t('settingsAccessType')} · {subscription.accessLabel}</Text> : null}
      </View>

      <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.portalTitle, { color: palette.text }]}>{trialBusy ? 'Starting 3-day trial…' : 'Start 3-day trial'}</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>Open the limited trial first. Payment details can be added during checkout when the provider is connected.</Text>
        <Pressable accessibilityRole="button" onPress={() => { void handleStartTrial(); }} style={({ pressed }) => [styles.organisationCta, pressed && styles.pressed]}>
          <Text style={styles.organisationCtaText}>Activate trial</Text>
        </Pressable>
        <View style={styles.stack}>
          {PREVIEW_OPTIONS.map((option) => (
            <Pressable key={option.id} accessibilityRole="button" onPress={() => { startPreview(option.id); Alert.alert('Preview started', `${option.title} is now active on this device session.`); }} style={({ pressed }) => [styles.planCard, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>{option.title}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{option.detail}</Text>
            </Pressable>
          ))}
          {subscription?.isPreview ? (
            <Pressable accessibilityRole="button" onPress={() => { endPreview(); Alert.alert('Preview cleared', 'Preview mode was removed from this device session.'); }} style={({ pressed }) => [styles.planCard, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>Clear preview</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>Return this device session to the locked free state.</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <Pressable accessibilityRole="button" onPress={() => { void handlePortal(); }} style={({ pressed }) => [styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
          <Text style={[styles.portalTitle, { color: palette.text }]}>{portalBusy ? 'Opening portal…' : 'Manage subscription'}</Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>Customer portal, invoices, payment method, and pathway access details.</Text>
        </Pressable>
      ) : (
        <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.portalTitle, { color: palette.text }]}>Manage subscription</Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>On mobile, purchases and subscription management run through Apple App Store or Google Play billing.</Text>
        </View>
      )}

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose a paid pathway</Text>
        <Text style={[styles.sectionBody, { color: palette.textMuted }]}>Pick the route that fits YKI, work, citizenship, permanent residence, and long-term life in Finland.</Text>
      </View>

      <View style={styles.stack}>
        {groupedPlans.learner.map((plan) => {
          const isBusy = busyPlan === plan.id;
          return (
            <Pressable key={plan.id} accessibilityRole="button" onPress={() => { void handleCheckout(plan.id); }} style={({ pressed }) => [styles.planCard, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <View style={styles.planTopRow}>
                <Text style={[styles.planTitle, { color: palette.text }]}>{isBusy ? 'Opening checkout…' : plan.title}</Text>
                <View style={[styles.planChip, { backgroundColor: palette.primarySurface }]}>
                  <Text style={[styles.planChipText, { color: palette.primary }]}>{plan.checkoutLabel}</Text>
                </View>
              </View>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{plan.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.organisationCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
        <Text style={[styles.portalTitle, { color: palette.text }]}>Need access for employees, residents, or programme participants?</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>Floently Learn supports employer and city access models for workforce development, integration, and language-to-opportunity programmes.</Text>
        <View style={styles.stack}>
          {groupedPlans.organisation.map((option) => (
            <View key={option.id} style={[styles.planCard, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }]}> 
              <Text style={[styles.planTitle, { color: palette.text }]}>{option.title}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{option.detail}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Contact sales', 'Use the web demo flow to discuss employer or city programme access.')} style={({ pressed }) => [styles.organisationCta, pressed && styles.pressed]}>
            <Text style={styles.organisationCtaText}>Book a demo</Text>
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
  portalButton: { borderRadius: 20, padding: 16, gap: 6, borderWidth: 1 },
  portalTitle: { fontSize: 16, fontWeight: '800' },
  portalBody: { fontSize: 13, lineHeight: 18 },
  sectionHeading: { gap: 6, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionBody: { fontSize: 13, lineHeight: 19 },
  stack: { gap: 12 },
  planCard: { borderRadius: 20, padding: 16, gap: 8, borderWidth: 1 },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  planTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  planBody: { fontSize: 13, lineHeight: 19 },
  planChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  planChipText: { fontSize: 11, fontWeight: '800' },
  organisationCard: { borderRadius: 22, padding: 18, gap: 12, borderWidth: 1 },
  organisationCta: { minHeight: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F47E8' },
  organisationCtaText: { color: '#FFFFFF', fontWeight: '800' },
  pressed: { opacity: 0.92 },
});
