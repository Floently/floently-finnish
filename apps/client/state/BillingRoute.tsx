import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { paymentService } from '../features/billing/services/paymentService';
import { supportsStoreBilling } from '../features/billing/services/storeBillingService';
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


type BillingStatusSnapshot = {
  subscription_status?: string | null;
  subscriptionStatus?: string | null;
  access_expired?: boolean;
  accessExpired?: boolean;
  has_any_subscription?: boolean;
  hasAnySubscription?: boolean;
  has_payment_issue?: boolean;
  hasPaymentIssue?: boolean;
  payment_issue_message?: string | null;
  paymentIssueMessage?: string | null;
  trial_used?: boolean;
  trialUsed?: boolean;
  can_start_trial?: boolean;
  canStartTrial?: boolean;
  trial_already_used?: boolean;
  trialAlreadyUsed?: boolean;
  tier?: string;
  billingTier?: string;
  billing_tier?: string;
  plan_key?: string;
  planKey?: string;
  is_trial?: boolean;
  isTrial?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  cancel_at_period_end?: boolean;
  cancelAtPeriodEnd?: boolean;
  access_ends_at?: string | null;
  accessEndsAt?: string | null;
  trial_ends_at?: string | null;
  trialEndsAt?: string | null;
  expires_at?: string | null;
  expiresAt?: string | null;
};

function unwrapStatusPayload(value: unknown): BillingStatusSnapshot {
  const root = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root;
  const subscription = data.subscription && typeof data.subscription === 'object'
    ? data.subscription as Record<string, unknown>
    : data;
  return subscription as BillingStatusSnapshot;
}

function firstText(...values: Array<unknown>): string | null {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return null;
}

function isTrialAlreadyUsedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /TRIAL_ALREADY_USED|trial already used|already used your trial|already used the free trial/i.test(message);
}

function formatAccessDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type Props = { onBack: () => void; onOpenMenu: () => void };

export default function BillingRoute({ onBack, onOpenMenu }: Props) {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [trialBusy, setTrialBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [billingStatusSnapshot, setBillingStatusSnapshot] = useState<BillingStatusSnapshot | null>(null);
  const [billingActionBusy, setBillingActionBusy] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  const [selectedProfessions, setSelectedProfessions] = useState<ProfessionKey[]>(['nurse']);
  const user = useAuthStore((state) => state.user);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';
  const { t } = useTranslator();
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const refreshSubscription = useSubscriptionStore((state) => state.refresh);
  const subscription = useSubscriptionStore((state) => state.status);
  const statusForBillingUi = billingStatusSnapshot ?? (subscription as unknown as BillingStatusSnapshot | null);
  const isTrial = Boolean(statusForBillingUi?.is_trial ?? statusForBillingUi?.isTrial);
  const cancelAtPeriodEnd = Boolean(statusForBillingUi?.cancel_at_period_end ?? statusForBillingUi?.cancelAtPeriodEnd);
  const rawSubscriptionStatus = String(
    statusForBillingUi?.subscription_status ??
      statusForBillingUi?.subscriptionStatus ??
      '',
  ).toLowerCase();
  const hasPaymentIssue = Boolean(
    statusForBillingUi?.has_payment_issue ??
      statusForBillingUi?.hasPaymentIssue ??
      ['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'canceled'].includes(rawSubscriptionStatus),
  );
  const paymentIssueMessage =
    statusForBillingUi?.payment_issue_message ??
    statusForBillingUi?.paymentIssueMessage ??
    t('billingPaymentFailedBody');
  const accessEndsAtRaw = firstText(
    statusForBillingUi?.access_ends_at,
    statusForBillingUi?.accessEndsAt,
    statusForBillingUi?.trial_ends_at,
    statusForBillingUi?.trialEndsAt,
    statusForBillingUi?.expires_at,
    statusForBillingUi?.expiresAt,
  );
  const accessEndsAtLabel = formatAccessDate(accessEndsAtRaw);
  const accessExpired = Boolean(
    statusForBillingUi?.access_expired ??
      statusForBillingUi?.accessExpired ??
      (accessEndsAtRaw ? new Date(accessEndsAtRaw).getTime() <= Date.now() : false)
  );

  const hasActiveSubscription = Boolean(
    (statusForBillingUi?.is_active ??
      statusForBillingUi?.isActive ??
      statusForBillingUi?.has_any_subscription ??
      statusForBillingUi?.hasAnySubscription) &&
      !hasPaymentIssue &&
      !accessExpired &&
      !['expired', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'canceled'].includes(rawSubscriptionStatus)
  );

  const trialAlreadyUsed = Boolean(
    statusForBillingUi?.trial_already_used ??
      statusForBillingUi?.trialAlreadyUsed ??
      statusForBillingUi?.trial_used ??
      statusForBillingUi?.trialUsed
  );
  const canStartTrial = Boolean(
    statusForBillingUi?.can_start_trial ??
      statusForBillingUi?.canStartTrial ??
      !trialAlreadyUsed
  );
  const trialActionDisabled = Boolean(hasActiveSubscription || trialAlreadyUsed || !canStartTrial || trialBusy);
  const showTrialStartCard = Boolean(!hasPaymentIssue && !trialAlreadyUsed && canStartTrial && !hasActiveSubscription);

  const trialEndRawForManagement =
    statusForBillingUi?.trial_ends_at ??
    statusForBillingUi?.trialEndsAt ??
    accessEndsAtRaw;

  const trialEndsAtLabel = formatAccessDate(trialEndRawForManagement);
  const trialDaysLeft = (() => {
    const raw = trialEndRawForManagement;
    if (!raw) return null;
    const end = new Date(raw);
    if (Number.isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86400000));
  })();

  const subscriptionManagementStatus = hasPaymentIssue
    ? t('billingPaymentFailedTitle')
    : trialAlreadyUsed && !hasActiveSubscription
      ? t('billingTrialAlreadyUsedTitle')
      : accessExpired && !hasActiveSubscription
        ? t('billingAccessExpiredTitle')
        : isTrial
          ? cancelAtPeriodEnd
            ? t('billingTrialCancelledStatus')
            : t('billingTrialActiveStatus')
          : cancelAtPeriodEnd
            ? t('billingRenewalCancelledStatus')
            : hasActiveSubscription
              ? t('billingStatusSubscriptionActive')
              : t('billingStatusNoActiveSubscription');

  const subscriptionManagementBody = hasPaymentIssue
    ? t('billingManagementPaymentFailedBody')
    : trialAlreadyUsed && !hasActiveSubscription
      ? t('billingTrialAlreadyUsedBody')
      : accessExpired && !hasActiveSubscription
        ? t('billingAccessExpiredBody')
        : isTrial
          ? cancelAtPeriodEnd
            ? t('billingManagementTrialCancelledBody')
            : t('billingManagementTrialActiveBody')
          : cancelAtPeriodEnd
            ? t('billingManagementRenewalCancelledBody')
            : hasActiveSubscription
              ? t('billingManagementSubscriptionActiveBody')
              : t('billingManagementNoActiveBody');


  const trialCardTitle = trialAlreadyUsed
    ? t('billingTrialAlreadyUsedTitle')
    : hasActiveSubscription
      ? t('billingTrialAlreadyActiveTitle')
      : trialBusy
        ? t('billingStartingTrial')
        : t('billingStartTrial');

  const trialCardBody = trialAlreadyUsed
    ? t('billingTrialAlreadyUsedBody')
    : hasActiveSubscription
      ? t('billingTrialActiveBody')
      : t('billingPreviewBody');

  const trialCardActionLabel = trialAlreadyUsed
    ? t('billingTrialAlreadyUsedCta')
    : hasActiveSubscription
      ? t('billingTrialAlreadyActiveTitle')
      : t('billingActivateTrial');

  const startPreview = useSubscriptionStore((state) => state.startPreview);
  const endPreview = useSubscriptionStore((state) => state.endPreview);
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
    void refreshBillingSnapshot();
  }, [user?.email, user?.subscriptionTier]);


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

  async function refreshBillingSnapshot() {
    try {
      const raw = await paymentService.getSubscriptionStatus();
      setBillingStatusSnapshot(unwrapStatusPayload(raw));
      await refreshSubscription({
        email: user?.email ?? null,
        subscriptionTierHint: user?.subscriptionTier ?? null,
      });
    } catch {
      // Keep existing subscription UI if the status refresh fails.
    }
  }

  async function handleCancelTrial() {
    if (billingActionBusy) return;
    Alert.alert(
      t('billingCancelTrialTitle'),
      accessEndsAtLabel
        ? t('billingCancelTrialBodyWithDate').replace('{date}', accessEndsAtLabel)
        : t('billingCancelTrialBodyNoDate'),
      [
        { text: t('billingKeepTrialActive'), style: 'cancel' },
        {
          text: t('billingCancelTrialAction'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setBillingActionBusy(true);
                const raw = await paymentService.cancelSubscriptionTrial();
                setBillingStatusSnapshot(unwrapStatusPayload(raw));
                await refreshBillingSnapshot();
                Alert.alert(
                  t('billingTrialCancelledTitle'),
                  accessEndsAtLabel
                    ? t('billingTrialCancelledBodyWithDate').replace('{date}', accessEndsAtLabel)
                    : t('billingTrialCancelledBodyNoDate'),
                );
              } catch (error) {
                Alert.alert(t('billingCancellationFailedTitle'), error instanceof Error ? error.message : t('billingCouldNotCancelTrial'));
              } finally {
                setBillingActionBusy(false);
              }
            })();
          },
        },
      ],
    );
  }

  async function handleReactivateSubscription() {
    if (billingActionBusy) return;
    try {
      setBillingActionBusy(true);
      const raw = await paymentService.reactivateSubscription();
      setBillingStatusSnapshot(unwrapStatusPayload(raw));
      await refreshBillingSnapshot();
      Alert.alert(t('billingTrialActiveTitle'), t('billingTrialReactivatedBody'));
    } catch (error) {
      Alert.alert(t('billingReactivationFailedTitle'), error instanceof Error ? error.message : t('billingCouldNotReactivateTrial'));
    } finally {
      setBillingActionBusy(false);
    }
  }

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
        Alert.alert(t('billingPurchaseUnavailableTitle'), t('billingPurchaseUnavailableBody'));
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
    if (supportsStoreBilling()) {
      Alert.alert(t('billingPortalUnavailableTitle'), t('billingPortalUnavailableBody'));
      return;
    }
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
    if (trialAlreadyUsed || !canStartTrial) {
      Alert.alert(t('billingTrialAlreadyUsedRetryTitle'), t('billingTrialAlreadyUsedRetryBody'));
      return;
    }

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
      if (supportsStoreBilling()) {
        Alert.alert(t('billingPurchaseUnavailableTitle'), t('billingPurchaseUnavailableBody'));
        return;
      }
      const trialPathway: CheckoutPathway = 'yki';
      const request = {
        ...buildCheckoutRequest(trialPathway, period, []),
        trial_days: 3,
      };
      const session = await paymentService.createCheckoutSession(request) as { checkout_url?: string; url?: string } | undefined;
      await openUrl(session?.url ?? session?.checkout_url);
    } catch (error) {
      if (isTrialAlreadyUsedError(error)) {
        Alert.alert(t('billingTrialAlreadyUsedRetryTitle'), t('billingTrialAlreadyUsedRetryBody'));
      } else {
        const message = error instanceof Error ? error.message : t('billingPurchaseUnavailableBody');
        Alert.alert(t('billingPurchaseUnavailableTitle'), message);
      }
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
          title={t('billingManagementPageTitle')}
          subtitle={t('billingManagementPageSubtitle')}
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
        {hasPaymentIssue ? (
          <View style={styles.paymentIssueCard}>
            <Text style={styles.paymentIssueTitle}>{t('billingPaymentFailedTitle')}</Text>
            <Text style={styles.paymentIssueBody}>{paymentIssueMessage}</Text>
            <Text style={styles.paymentIssueBody}>{t('billingPaymentFailedBody')}</Text>
          </View>
        ) : null}

        {!hasPaymentIssue && accessEndsAtLabel ? (
          <Text style={styles.statusMeta}>
            {isTrial
              ? cancelAtPeriodEnd
                ? `${t('billingTrialCancelledStatus')} — ${t('billingAccessActiveUntilStatus')} ${accessEndsAtLabel}`
                : `${t('billingTrialActiveStatus')} — ${t('billingRenewsAfterStatus')} ${accessEndsAtLabel}`
              : cancelAtPeriodEnd
                ? `${t('billingRenewalCancelledStatus')} — ${t('billingAccessActiveUntilStatus')} ${accessEndsAtLabel}`
                : `${t('billingAccessActiveUntilStatus')} ${accessEndsAtLabel}`}
          </Text>
        ) : null}
        {!hasPaymentIssue && isTrial && !cancelAtPeriodEnd ? (
          <Pressable
            accessibilityRole="button"
            disabled={billingActionBusy}
            onPress={handleCancelTrial}
            style={[styles.billingTrialLifecycleButton, { opacity: billingActionBusy ? 0.6 : 1 }]}
          >
            <Text style={styles.billingTrialLifecycleText}>
              {billingActionBusy ? t('billingUpdatingLabel') : t('billingCancelTrialAction')}
            </Text>
          </Pressable>
        ) : null}
        {!hasPaymentIssue && cancelAtPeriodEnd ? (
          <Pressable
            accessibilityRole="button"
            disabled={billingActionBusy}
            onPress={() => { void handleReactivateSubscription(); }}
            style={[styles.billingTrialLifecycleButton, { opacity: billingActionBusy ? 0.6 : 1 }]}
          >
            <Text style={styles.billingTrialLifecycleText}>
              {billingActionBusy ? t('billingUpdatingLabel') : t('billingKeepTrialReactivate')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {showTrialStartCard ? (
      <View style={[styles.portalButton, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.portalTitle, { color: palette.text }]}>{trialCardTitle}</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>{trialCardBody}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={trialActionDisabled}
          onPress={() => { void handleStartTrial(); }}
          style={({ pressed }) => [styles.organisationCta, { backgroundColor: palette.primary, opacity: trialActionDisabled ? 0.65 : 1 }, pressed && !trialActionDisabled && styles.pressed]}
        >
          <Text style={[styles.organisationCtaText, { color: textOnPrimary }]}>{trialCardActionLabel}</Text>
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
      ) : null}

      <View style={[styles.subscriptionManagementCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.portalTitle, { color: palette.text }]}>{t('billingSubscriptionManagementTitle')}</Text>
        <Text style={[styles.portalBody, { color: palette.textMuted }]}>
          {t('billingSubscriptionManagementBody')}
        </Text>

        <View style={[styles.subscriptionManagementSummary, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.subscriptionManagementLabel, { color: palette.textMuted }]}>{t('billingCurrentStatusLabel')}</Text>
          <Text style={[styles.subscriptionManagementValue, { color: hasPaymentIssue ? '#991B1B' : palette.text }]}>
            {subscriptionManagementStatus}
          </Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>{subscriptionManagementBody}</Text>
        </View>

        {isTrial ? (
          <View style={[styles.subscriptionManagementSummary, { backgroundColor: palette.surfaceMuted ?? palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.subscriptionManagementLabel, { color: palette.textMuted }]}>{t('billingTrialLabel')}</Text>
            <Text style={[styles.subscriptionManagementValue, { color: palette.text }]}>
              {trialDaysLeft === null ? t('billingTrialEndUnavailable') : trialDaysLeft === 1 ? t('billingTrialDayLeftLabel') : t('billingTrialDaysLeftLabel').replace('{count}', String(trialDaysLeft))}
            </Text>
            {trialEndsAtLabel ? (
              <Text style={[styles.portalBody, { color: palette.textMuted }]}>{t('billingTrialEndsOnLabel').replace('{date}', trialEndsAtLabel)}</Text>
            ) : null}
          </View>
        ) : null}

        {!hasPaymentIssue && isTrial && !cancelAtPeriodEnd ? (
          <Pressable
            accessibilityRole="button"
            disabled={billingActionBusy}
            onPress={handleCancelTrial}
            style={({ pressed }) => [
              styles.subscriptionManagementAction,
              { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', opacity: billingActionBusy ? 0.6 : 1 },
              pressed && !billingActionBusy && styles.pressed,
            ]}
          >
            <Text style={[styles.subscriptionManagementActionText, { color: '#991B1B' }]}>
              {billingActionBusy ? t('billingUpdatingLabel') : t('billingCancelTrialAction')}
            </Text>
          </Pressable>
        ) : null}

        {!hasPaymentIssue && cancelAtPeriodEnd ? (
          <Pressable
            accessibilityRole="button"
            disabled={billingActionBusy}
            onPress={() => { void handleReactivateSubscription(); }}
            style={({ pressed }) => [
              styles.subscriptionManagementAction,
              { borderColor: palette.border, backgroundColor: palette.primary, opacity: billingActionBusy ? 0.6 : 1 },
              pressed && !billingActionBusy && styles.pressed,
            ]}
          >
            <Text style={[styles.subscriptionManagementActionText, { color: textOnPrimary }]}>
              {billingActionBusy ? t('billingUpdatingLabel') : t('billingKeepTrialReactivate')}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => { void handlePortal(); }}
          disabled={portalBusy}
          style={({ pressed }) => [
            styles.subscriptionManagementAction,
            { borderColor: palette.border, backgroundColor: palette.surfaceMuted ?? palette.surface, opacity: portalBusy ? 0.65 : 1 },
            pressed && !portalBusy && styles.pressed,
          ]}
        >
          <Text style={[styles.subscriptionManagementActionText, { color: palette.text }]}>
            {portalBusy ? t('billingOpeningPortal') : t('billingPaymentMethodStripeAction')}
          </Text>
          <Text style={[styles.portalBody, { color: palette.textMuted }]}>
            {t('billingPaymentMethodStripeBody')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('billingChoosePlanAfterStatusTitle')}</Text>
        <Text style={[styles.sectionBody, { color: palette.textMuted }]}>{t('billingChoosePlanAfterStatusBody')}</Text>
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
  billingTrialLifecycleButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  billingTrialLifecycleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
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
  subscriptionManagementCard: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  subscriptionManagementSummary: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
  },
  subscriptionManagementLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subscriptionManagementValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  subscriptionManagementAction: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  subscriptionManagementActionText: {
    fontSize: 14,
    fontWeight: '900',
  },
  paymentIssueCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 14,
    gap: 6,
    marginTop: 10,
  },
  paymentIssueTitle: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '900',
  },
  paymentIssueBody: {
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

});
