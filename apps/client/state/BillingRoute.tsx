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
  formatSubscriptionAccessLabel,
  formatSubscriptionAccessSummary,
  formatSubscriptionPlanLabel,
  getPlanByPathwayPeriod,
  professionListLabel,
  type BillingPeriod,
  type CheckoutPathway,
  type ProfessionKey,
} from '@core/api/entitlements';
import { useTranslator, type TranslationKey } from '../features/i18n';

const PREVIEW_OPTIONS: Array<{ id: 'yki' | ProfessionKey; titleKey: TranslationKey; detailKey: TranslationKey }> = [
  { id: 'yki', titleKey: 'billingPreviewYkiTitle', detailKey: 'billingPreviewYkiDetail' },
  { id: 'nurse', titleKey: 'billingPreviewNurseTitle', detailKey: 'billingPreviewNurseDetail' },
  { id: 'doctor', titleKey: 'billingPreviewDoctorTitle', detailKey: 'billingPreviewDoctorDetail' },
  { id: 'practical_nurse', titleKey: 'billingPreviewPracticalNurseTitle', detailKey: 'billingPreviewPracticalNurseDetail' },
];

function isActiveSubscriptionStatus(status: unknown): boolean {
  const record = (status ?? {}) as {
    isActive?: boolean;
    hasAnySubscription?: boolean;
    tier?: string;
    billingTier?: string;
    billing_tier?: string;
  };
  const tier = String(record.billingTier ?? record.billing_tier ?? record.tier ?? 'free');
  return Boolean(record.isActive || record.hasAnySubscription || (tier && tier !== 'free'));
}

const PATHWAYS: Array<{ id: CheckoutPathway; titleKey: TranslationKey; eyebrowKey: TranslationKey; detailKey: TranslationKey; highlightKeys: TranslationKey[] }> = [
  {
    id: 'yki',
    titleKey: 'billingYkiTitle',
    eyebrowKey: 'billingYkiEyebrow',
    detailKey: 'billingYkiDetail',
    highlightKeys: ['billingYkiHighlight1', 'billingYkiHighlight2', 'billingYkiHighlight3'],
  },
  {
    id: 'professional',
    titleKey: 'billingProfessionalTitle',
    eyebrowKey: 'billingProfessionalEyebrow',
    detailKey: 'billingProfessionalDetail',
    highlightKeys: ['billingProfessionalHighlight1', 'billingProfessionalHighlight2', 'billingProfessionalHighlight3'],
  },
  {
    id: 'combined',
    titleKey: 'billingCombinedTitle',
    eyebrowKey: 'billingCombinedEyebrow',
    detailKey: 'billingCombinedDetail',
    highlightKeys: ['billingCombinedHighlight1', 'billingCombinedHighlight2', 'billingCombinedHighlight3'],
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
  const hasActiveSubscription = Boolean(
    subscription &&
    !subscription.isPreview &&
    String(subscription.planLabel ?? '').trim() &&
    !String(subscription.planLabel ?? '').toLowerCase().includes('free')
  );
  const startPreview = useSubscriptionStore((state) => state.startPreview);
  const endPreview = useSubscriptionStore((state) => state.endPreview);
  const { t } = useTranslator();
  const billingDisplayLabels = useMemo(() => ({
    billingPeriods: {
      monthly: t('billingPeriodMonthlyLabel'),
      '3_months': t('billingPeriodThreeMonthsLabel'),
      yearly: t('billingPeriodYearlyLabel'),
    },
    professions: {
      nurse: t('billingProfessionNurseLabel'),
      doctor: t('billingProfessionDoctorLabel'),
      practical_nurse: t('billingProfessionPracticalNurseLabel'),
    },
    noProfessionSelected: t('billingNoProfessionSelected'),
    ykiPathway: t('billingYkiTitle'),
    professionalPathway: t('billingProfessionalTitle'),
    combinedPathway: t('billingCombinedTitle'),
    previewYki: t('billingPreviewYkiTitle'),
    previewDoctor: t('billingPreviewDoctorTitle'),
    previewNurse: t('billingPreviewNurseTitle'),
    previewPracticalNurse: t('billingPreviewPracticalNurseTitle'),
    internalAllAccess: t('billingInternalAllAccess'),
    accessTypes: {
      individual: t('billingAccessTypeIndividual'),
      employer_programme: t('billingAccessTypeEmployerProgramme'),
      city_programme: t('billingAccessTypeCityProgramme'),
      internal: t('billingAccessTypeInternal'),
    },
    accessSummaryNoSubscription: t('billingAccessSummaryNoSubscription'),
    accessSummaryYki: t('billingAccessSummaryYki'),
    accessSummaryProfessional: t('billingAccessSummaryProfessional'),
    accessSummaryCombined: t('billingAccessSummaryCombined'),
    accessSummaryInternal: t('billingAccessSummaryInternal'),
  }), [t]);

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
      title: t('billingEmployerProgrammeTitle'),
      detail: t('billingEmployerProgrammeDetail'),
    },
    {
      id: 'city_programme',
      title: t('billingCityProgrammeTitle'),
      detail: t('billingCityProgrammeDetail'),
    },
  ], [t]);
  const currentPlanLabel = subscription
    ? formatSubscriptionPlanLabel(subscription, billingDisplayLabels)
    : t('billingNoActiveSubscription');
  const currentAccessSummary = subscription
    ? formatSubscriptionAccessSummary(subscription, billingDisplayLabels)
    : t('billingAccessSummaryNoSubscription');
  const currentAccessLabel = subscription
    ? formatSubscriptionAccessLabel(subscription.accessType, billingDisplayLabels)
    : null;

  async function openUrl(url: string | undefined) {
    if (!url) {
      Alert.alert(t('billingUnavailableTitle'), t('billingUnavailableBody'));
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
    const request = {
      ...buildCheckoutRequest(pathway, period, selectedProfessions),
      trial_days: 3,
    };
    try {
      setBusyPlan(request.plan);
      const latestStatus = await paymentService.getSubscriptionStatus();
      if (isActiveSubscriptionStatus(latestStatus)) {
        Alert.alert(t('billingTrialAlreadyActiveTitle'), t('billingTrialAlreadyActiveBody'));
        return;
      }
      if (pathway !== 'yki' && selectedProfessions.length === 0) {
        Alert.alert(t('billingChooseProfessionTitle'), t('billingChooseProfessionBody'));
        return;
      }
      if (supportsStoreBilling()) {
        if (pathway !== 'yki' && selectedProfessions.length > 1) {
          Alert.alert(t('billingUseWebCheckoutTitle'), t('billingUseWebCheckoutBody'));
          return;
        }
        await startStorePurchase(request.plan);
        Alert.alert(
          t('billingInAppTitle'),
          t('billingInAppBody'),
        );
        return;
      }
      const session = await paymentService.createCheckoutSession(request) as { checkout_url?: string; url?: string } | undefined;
      await openUrl(session?.url ?? session?.checkout_url);
    } catch (error) {
      Alert.alert(t('billingPurchaseUnavailableTitle'), error instanceof Error ? error.message : t('billingPurchaseUnavailableBody'));
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
      Alert.alert(t('billingPortalUnavailableTitle'), error instanceof Error ? error.message : t('billingPortalUnavailableBody'));
    } finally {
      setPortalBusy(false);
    }
  }

  async function handleStartTrial() {
    try {
      setTrialBusy(true);
      const latestStatus = await paymentService.getSubscriptionStatus();
      if (isActiveSubscriptionStatus(latestStatus)) {
        Alert.alert(t('billingTrialAlreadyActiveTitle'), t('billingTrialAlreadyActiveBody'));
        return;
      }
      await refreshSubscription({
        email: user?.email ?? null,
        subscriptionTierHint: user?.subscriptionTier ?? null,
      });
      const trialPathway: CheckoutPathway = 'yki';
      const request = {
        ...buildCheckoutRequest(trialPathway, period, []),
        trial_days: 3,
      };
      const session = await paymentService.createCheckoutSession(request) as { checkout_url?: string; url?: string } | undefined;
      await openUrl(session?.url ?? session?.checkout_url);
    } catch (error) {
      Alert.alert(t('billingTrialUnavailableTitle'), error instanceof Error ? error.message : t('billingTrialUnavailableBody'));
    } finally {
      setTrialBusy(false);
    }
  }

  function renderProfessionSelector() {
    return (
      <View style={styles.professionBox}>
        <View style={styles.planTopRow}>
          <Text style={[styles.professionTitle, { color: palette.text }]}>{t('billingProfessionSlots')}</Text>
          <Text style={[styles.planChipText, { color: palette.primary }]}>{selectedProfessions.length} {t('billingSelectedSuffix')}</Text>
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
                <Text style={[styles.professionPillText, { color: selected ? textOnPrimary : palette.text }]}>{t((option.shortLabelKey ?? option.labelKey ?? 'billingProfessionNurseShortLabel') as TranslationKey)}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedProfessions.length > 1 ? (
          <Text style={[styles.planBody, { color: palette.accent }]}>{t('billingExtraSlotsDiscountPrefix')} {ADDITIONAL_PROFESSION_DISCOUNT_PERCENT}{t('billingExtraSlotsDiscountSuffix')}</Text>
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
          eyebrow={t('billingAccessEyebrow')}
          title={t('billingHeaderTitle')}
          subtitle={t('billingHeaderSubtitle')}
          actionLabel={t('billingHomeAction')}
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.statusCard, { backgroundColor: palette.primary, shadowColor: palette.shadow }]}>
        <Text style={styles.statusLabel}>{t('settingsAccessType')}</Text>
        <Text style={styles.statusTitle}>{currentPlanLabel}</Text>
        <Text style={styles.statusBody}>{currentAccessSummary}</Text>
        {currentAccessLabel ? <Text style={styles.statusMeta}>{t('settingsAccessType')} - {currentAccessLabel}</Text> : null}
      </View>

      <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.portalTitle, { color: palette.text }]}>{hasActiveSubscription ? t('billingTrialAlreadyActiveTitle') : trialBusy ? t('billingStartingTrial') : t('billingStartTrial')}</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>{hasActiveSubscription ? t('billingTrialActiveBody') : t('billingPreviewBody')}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={hasActiveSubscription}
          onPress={() => { void handleStartTrial(); }}
          style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary, opacity: hasActiveSubscription ? 0.65 : 1 }, pressed && !hasActiveSubscription && styles.pressed]}
        >
          <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>{hasActiveSubscription ? t('billingTrialAlreadyActiveTitle') : t('billingActivateTrial')}</Text>
        </Pressable>
        <View style={styles.stack}>
          {PREVIEW_OPTIONS.map((option) => (
            <Pressable key={option.id} accessibilityRole="button" onPress={() => { startPreview(option.id); Alert.alert(t('billingPreviewStartedTitle'), t('billingPreviewStartedBody')); }} style={({ pressed }) => [styles.planCardSmall, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>{t(option.titleKey)}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{t(option.detailKey)}</Text>
            </Pressable>
          ))}
          {subscription?.isPreview ? (
            <Pressable accessibilityRole="button" onPress={() => { endPreview(); Alert.alert(t('billingPreviewClearedTitle'), t('billingPreviewClearedBody')); }} style={({ pressed }) => [styles.planCardSmall, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>{t('billingClearPreview')}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{t('billingClearPreviewBody')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <Pressable accessibilityRole="button" onPress={() => { void handlePortal(); }} style={({ pressed }) => [styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
          <Text style={[styles.portalTitle, { color: palette.text }]}>{portalBusy ? t('billingOpeningPortal') : t('billingManageSubscription')}</Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>{t('billingPortalBody')}</Text>
        </Pressable>
      ) : (
        <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.portalTitle, { color: palette.text }]}>{t('billingManageSubscription')}</Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>{t('billingMobilePortalBody')}</Text>
        </View>
      )}

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('billingChoosePaidPathway')}</Text>
        <Text style={[styles.sectionBody, { color: palette.textMuted }]}>{t('billingPaidPathwayBody')}</Text>
      </View>

      <View style={[styles.segmentWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {BILLING_PERIOD_OPTIONS.map((option) => {
          const active = period === option.key;
          return (
            <Pressable key={option.key} accessibilityRole="button" onPress={() => setPeriod(option.key)} style={[styles.segmentButton, { backgroundColor: active ? palette.primary : 'transparent' }]}>
              <Text style={[styles.segmentText, { color: active ? textOnPrimary : palette.text }]}>{t((option.labelKey ?? 'billingPeriodMonthlyLabel') as TranslationKey)}</Text>
              <Text style={[styles.segmentSubtext, { color: active ? textOnPrimary : palette.textMuted }]}>{t((option.savingsLabelKey ?? 'billingPeriodMonthlySavings') as TranslationKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.pathwayGrid}>
        {PATHWAYS.map((pathway) => {
          const estimate = estimateCheckoutTotal(pathway.id, period, selectedProfessions, billingDisplayLabels);
          const plan = getPlanByPathwayPeriod(pathway.id, period);
          const isBusy = busyPlan === plan.id;
          const needsProfession = pathway.id !== 'yki';
          return (
            <View key={pathway.id} style={[styles.pricingCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.shadow }]}>
              <View style={styles.planTopRow}>
                <Text style={[styles.planEyebrow, { color: palette.primary }]}>{t(pathway.eyebrowKey)}</Text>
                <View style={[styles.planChip, { backgroundColor: palette.primarySurface }]}>
                  <Text style={[styles.planChipText, { color: palette.primary }]}>{estimate.totalLabel}</Text>
                </View>
              </View>
              <Text style={[styles.pricingTitle, { color: palette.text }]}>{t(pathway.titleKey)}</Text>
              <Text style={[styles.portalBody, { color: palette.textMuted }]}>{t(pathway.detailKey)}</Text>
              <Text style={[styles.priceText, { color: palette.text }]}>{estimate.totalLabel}</Text>
              {needsProfession ? <Text style={[styles.portalBody, { color: palette.textMuted }]}>{professionListLabel(selectedProfessions, billingDisplayLabels.professions, billingDisplayLabels.noProfessionSelected)}</Text> : null}
              {needsProfession ? renderProfessionSelector() : null}
              <View style={styles.stackTight}>
                {pathway.highlightKeys.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <Text style={[styles.check, { color: palette.accent }]}>✓</Text>
                    <Text style={[styles.planBody, { color: palette.textMuted }]}>{t(item)}</Text>
                  </View>
                ))}
              </View>
              <Pressable accessibilityRole="button" onPress={() => { void handleCheckout(pathway.id); }} style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
                <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>{isBusy ? t('billingOpeningCheckout') : t('billingStartCheckout')}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.organisationCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.portalTitle, { color: palette.text }]}>{t('billingOrgTitle')}</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>{t('billingOrgBody')}</Text>
        <View style={styles.stack}>
          {organisationPlans.map((option) => (
            <View key={option.id} style={[styles.planCardSmall, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.planTitle, { color: palette.text }]}>{option.title}</Text>
              <Text style={[styles.planBody, { color: palette.textMuted }]}>{option.detail}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={() => Alert.alert(t('billingContactSalesTitle'), t('billingContactSalesBody'))} style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
            <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>{t('billingBookDemo')}</Text>
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
