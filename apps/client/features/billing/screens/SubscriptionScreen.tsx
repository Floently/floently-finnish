import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { paymentService } from '../services/paymentService';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useTranslator, type TranslationKey } from '../../i18n';
import {
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

const PATHWAYS: Array<{ id: CheckoutPathway; titleKey: TranslationKey; eyebrowKey: TranslationKey; bodyKey: TranslationKey; highlightKeys: TranslationKey[] }> = [
  {
    id: 'yki',
    titleKey: 'billingYkiTitle',
    eyebrowKey: 'billingYkiEyebrow',
    bodyKey: 'billingYkiDetail',
    highlightKeys: ['billingYkiHighlight1', 'billingYkiHighlight2', 'billingYkiHighlight3'],
  },
  {
    id: 'professional',
    titleKey: 'billingProfessionalTitle',
    eyebrowKey: 'billingProfessionalEyebrow',
    bodyKey: 'billingProfessionalDetail',
    highlightKeys: ['billingProfessionalHighlight1', 'billingProfessionalHighlight2', 'billingProfessionalHighlight3'],
  },
  {
    id: 'combined',
    titleKey: 'billingCombinedTitle',
    eyebrowKey: 'billingCombinedEyebrow',
    bodyKey: 'billingCombinedDetail',
    highlightKeys: ['billingCombinedHighlight1', 'billingCombinedHighlight2', 'billingCombinedHighlight3'],
  },
];

const TRIAL_INCLUDES: TranslationKey[] = [
  'billingPreviewIncludesRoleplay',
  'billingPreviewIncludesCards',
  'billingPreviewIncludesYkiPractice',
  'billingPreviewIncludesCoreScreens',
];

function pathwayFromOnboarding(intent?: string): CheckoutPathway {
  if (intent === 'PROFESSIONAL') return 'professional';
  if (intent === 'BOTH') return 'combined';
  return 'yki';
}

type BillingStatusSnapshot = {
  tier?: string;
  billingTier?: string;
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
  subscription_status?: string | null;
  subscriptionStatus?: string | null;
  access_source?: string | null;
  accessSource?: string | null;
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

function formatAccessDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SubscriptionScreen() {
  const [tier, setTier] = useState<string>('free');
  const [billingStatus, setBillingStatus] = useState<BillingStatusSnapshot | null>(null);
  const [billingActionBusy, setBillingActionBusy] = useState(false);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';
  const isTrial = Boolean(billingStatus?.is_trial ?? billingStatus?.isTrial);
  const cancelAtPeriodEnd = Boolean(billingStatus?.cancel_at_period_end ?? billingStatus?.cancelAtPeriodEnd);
  const accessEndsAtRaw = firstText(
    billingStatus?.access_ends_at,
    billingStatus?.accessEndsAt,
    billingStatus?.trial_ends_at,
    billingStatus?.trialEndsAt,
    billingStatus?.expires_at,
    billingStatus?.expiresAt,
  );
  const accessEndsAtLabel = formatAccessDate(accessEndsAtRaw);
  const hasActiveSubscription = Boolean(tier && tier !== 'free');

  const onboardingIntent = useOnboardingSession((s) => s.intentType);
  const onboardingProfession = useOnboardingSession((s) => s.profession);
  const onboardingBilling = useOnboardingSession((s) => s.preferredBillingPeriod);

  const defaultProfession = normalizeProfession(onboardingProfession) ?? 'nurse';
  const [period, setPeriod] = useState<BillingPeriod>(() => normalizeBillingPeriod(onboardingBilling ?? 'yearly'));
  const [selectedProfessions, setSelectedProfessions] = useState<ProfessionKey[]>([defaultProfession]);
  const recommendedPathway = useMemo(() => pathwayFromOnboarding(onboardingIntent), [onboardingIntent]);
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
  }), [t]);
  const currentPlanTitle = useMemo(() => {
    if (!tier || tier === 'free') return t('billingNoActiveSubscription');
    if (tier === 'internal_all_access') return t('billingInternalAllAccess');
    if (tier === 'preview_yki') return t('billingPreviewYkiTitle');
    if (tier === 'preview_nurse') return t('billingPreviewNurseTitle');
    if (tier === 'preview_doctor') return t('billingPreviewDoctorTitle');
    if (tier === 'preview_practical_nurse') return t('billingPreviewPracticalNurseTitle');
    if (tier.startsWith('yki_') || tier === 'general_premium') return t('billingYkiTitle');
    if (tier.startsWith('professional_')) return t('billingProfessionalTitle');
    if (tier.startsWith('combined_') || tier.startsWith('bundle_')) return t('billingCombinedTitle');
    return tier.replaceAll('_', ' ');
  }, [t, tier]);

  async function refreshBillingStatus() {
    try {
      const raw = await paymentService.getSubscriptionStatus();
      const record = unwrapStatusPayload(raw);
      setBillingStatus(record);
      setTier(record.billingTier ?? record.billingTier ?? record.tier ?? record.plan_key ?? record.planKey ?? 'free');
    } catch {
      // Keep the previous UI state if refresh fails.
    }
  }

  useEffect(() => {
    void refreshBillingStatus();
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
      if (hasActiveSubscription) {
        Alert.alert(t('billingTrialAlreadyActiveTitle'), t('billingTrialAlreadyActiveBody'));
        return;
      }
      if (pathway !== 'yki' && selectedProfessions.length === 0) {
        Alert.alert(t('billingChooseProfessionTitle'), t('billingChooseProfessionBody'));
        return;
      }
      const request = {
        ...buildCheckoutRequest(pathway, period, selectedProfessions),
        trial_days: 3,
      };
      const session = await paymentService.createCheckoutSession(request) as { url?: string; checkout_url?: string } | null;
      const url = session?.url ?? session?.checkout_url;
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('billingUnavailableTitle'), t('billingUnavailableBody'));
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('billingPurchaseUnavailableBody');
      Alert.alert(t('billingPurchaseUnavailableTitle'), message);
    }
  }

  async function handleCancelTrial() {
    if (billingActionBusy) return;
    Alert.alert(
      t('billingCancelTrialTitle'),
      t('billingCancelTrialBody'),
      [
        { text: t('billingKeepTrialReactivate'), style: 'cancel' },
        {
          text: t('billingCancelTrialAction'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setBillingActionBusy(true);
                const raw = await paymentService.cancelSubscriptionTrial();
                const record = unwrapStatusPayload(raw);
                setBillingStatus(record);
                const nextTier = record.billingTier ?? record.tier ?? record.plan_key ?? record.planKey ?? tier;
                setTier(nextTier || 'free');
                await refreshBillingStatus();
                Alert.alert(
                  t('billingTrialCancelledTitle'),
                  t('billingTrialCancelledBody'),
                );
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : t('billingCouldNotCancelTrial');
                Alert.alert(t('billingCancellationFailedTitle'), message);
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
      const record = unwrapStatusPayload(raw);
      setBillingStatus(record);
      const nextTier = record.billingTier ?? record.tier ?? record.plan_key ?? record.planKey ?? tier;
      setTier(nextTier || 'free');
      await refreshBillingStatus();
      Alert.alert(t('billingTrialActiveTitle'), t('billingTrialActiveBody'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('billingCouldNotReactivateTrial');
      Alert.alert(t('billingReactivationFailedTitle'), message);
    } finally {
      setBillingActionBusy(false);
    }
  }

  function renderProfessionSelector() {
    return (
      <View style={styles.professionBox}>
        <View style={styles.professionHeaderRow}>
          <Text style={[styles.professionTitle, { color: palette.text }]}>{t('billingProfessionSlots')}</Text>
          <Text style={[styles.professionCount, { color: palette.primary }]}>{selectedProfessions.length} {t('billingSelectedSuffix')}</Text>
        </View>
        <Text style={[styles.professionHelp, { color: palette.textMuted }]}>{t('billingProfessionSlotsHelp')}</Text>
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
                <Text style={[styles.professionPillText, { color: selected ? textOnPrimary : palette.text }]}>{t((option.shortLabelKey ?? option.labelKey ?? 'billingProfessionNurseShortLabel') as TranslationKey)}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedProfessions.length > 1 ? (
          <Text style={[styles.discountText, { color: palette.accent }]}>{t('billingExtraProfessionSlotsNotice')}</Text>
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
        <Text style={styles.heroEyebrow}>{t('billingAccessEyebrow')}</Text>
        <Text style={styles.heroTitle}>{t('billingHeaderTitle')}</Text>
        <Text style={styles.heroBody}>{t('billingHeaderSubtitle')}</Text>
      </View>

      {tier && tier !== 'free' ? (
        <View style={[styles.currentPlan, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.currentPlanLabel, { color: palette.textMuted }]}>{t('billingCurrentPlanLabel')}</Text>
          <Text style={[styles.currentPlanTitle, { color: palette.text }]}>{currentPlanTitle}</Text>
          {isTrial ? (
          <Text style={[styles.currentPlanMeta, { color: palette.textMuted }]}>
              {cancelAtPeriodEnd
                ? (accessEndsAtLabel ? t('billingTrialCancelledStatus').replace('{date}', accessEndsAtLabel) : t('billingTrialCancelledTitle'))
                : (accessEndsAtLabel ? t('billingTrialActiveStatus').replace('{date}', accessEndsAtLabel) : t('billingTrialActiveTitle'))}
          </Text>
          ) : accessEndsAtLabel ? (
            <Text style={[styles.currentPlanMeta, { color: palette.textMuted }]}>
              {cancelAtPeriodEnd ? t('billingRenewalCancelledStatus').replace('{date}', accessEndsAtLabel) : t('billingAccessActiveUntilStatus').replace('{date}', accessEndsAtLabel)}
            </Text>
          ) : null}

          {isTrial && !cancelAtPeriodEnd ? (
            <Pressable
              accessibilityRole="button"
              disabled={billingActionBusy}
              onPress={handleCancelTrial}
              style={[styles.cancelButton, { borderColor: palette.border, opacity: billingActionBusy ? 0.6 : 1 }]}
            >
              <Text style={[styles.cancelButtonText, { color: palette.text }]}>
                {billingActionBusy ? t('billingUpdatingLabel') : t('billingCancelTrialAction')}
              </Text>
            </Pressable>
          ) : null}

          {cancelAtPeriodEnd ? (
            <Pressable
              accessibilityRole="button"
              disabled={billingActionBusy}
              onPress={() => { void handleReactivateSubscription(); }}
              style={[styles.reactivateButton, { backgroundColor: palette.primary, opacity: billingActionBusy ? 0.6 : 1 }]}
            >
              <Text style={[styles.reactivateButtonText, { color: textOnPrimary }]}>
                {billingActionBusy ? t('billingUpdatingLabel') : t('billingKeepTrialReactivate')}
              </Text>
            </Pressable>
          ) : null}
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
              <Text style={[styles.segmentText, { color: active ? textOnPrimary : palette.text }]}>{t((option.labelKey ?? 'billingPeriodMonthlyLabel') as TranslationKey)}</Text>
              <Text style={[styles.segmentSubtext, { color: active ? textOnPrimary : palette.textMuted }]}>{t((option.savingsLabelKey ?? 'billingPeriodMonthlySavings') as TranslationKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.planStack}>
        {PATHWAYS.map((pathway) => {
          const plan = getPlanByPathwayPeriod(pathway.id, period);
          const estimate = estimateCheckoutTotal(pathway.id, period, selectedProfessions, billingDisplayLabels);
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
                  <Text style={[styles.recommendedText, { color: textOnPrimary }]}>{t('commonRecommended')}</Text>
                </View>
              ) : null}
              <Text style={[styles.cardEyebrow, { color: palette.primary }]}>{t(pathway.eyebrowKey)}</Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{t(pathway.titleKey)}</Text>
              <Text style={[styles.cardBody, { color: palette.textMuted }]}>{t(pathway.bodyKey)}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: palette.text }]}>{estimate.totalLabel}</Text>
                {needsProfession ? <Text style={[styles.priceMeta, { color: palette.textMuted }]}>{professionListLabel(selectedProfessions, billingDisplayLabels.professions, billingDisplayLabels.noProfessionSelected)}</Text> : null}
              </View>

              {needsProfession ? renderProfessionSelector() : null}

              <View style={styles.highlightList}>
                {pathway.highlightKeys.map((item) => (
                  <View key={item} style={styles.highlightRow}>
                    <Text style={[styles.check, { color: palette.accent }]}>✓</Text>
                    <Text style={[styles.highlightText, { color: palette.textMuted }]}>{t(item)}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={hasActiveSubscription}
                onPress={() => { void openCheckout(pathway.id); }}
                style={({ pressed }) => [styles.cta, { backgroundColor: palette.primary, opacity: hasActiveSubscription ? 0.65 : 1 }, pressed && !hasActiveSubscription && styles.pressed]}
              >
                <Text style={[styles.ctaText, { color: textOnPrimary }]}>{hasActiveSubscription ? t('billingTrialAlreadyActiveTitle') : t('billingStartFreeTrial')}</Text>
              </Pressable>
              <Text style={[styles.planFinePrint, { color: palette.textMuted }]}>{estimate.totalLabel} {t('billingPlanFinePrintSuffix')}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.infoTitle, { color: palette.text }]}>{t('billingFreePreviewCoversTitle')}</Text>
        {TRIAL_INCLUDES.map((item) => (
          <View key={item} style={styles.highlightRow}>
            <Text style={[styles.check, { color: palette.accent }]}>✓</Text>
            <Text style={[styles.highlightText, { color: palette.textMuted }]}>{t(item)}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => {
          Alert.alert(
            t('billingOrganisationAccessTitle'),
            t('billingOrganisationAccessBody'),
          );
        }}
        style={{ padding: spacing.sm }}
      >
        <Text style={{ color: palette.textMuted, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>
          {t('billingOrganisationAccessLinkLabel')}
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
  currentPlan: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  currentPlanLabel: { fontSize: 12, fontWeight: '700' },
  currentPlanTitle: { fontSize: 15, fontWeight: '800' },
  currentPlanMeta: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  cancelButton: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, minHeight: 38, paddingHorizontal: 14, justifyContent: 'center' },
  cancelButtonText: { fontSize: 13, fontWeight: '900' },
  reactivateButton: { alignSelf: 'flex-start', borderRadius: 999, minHeight: 38, paddingHorizontal: 14, justifyContent: 'center' },
  reactivateButtonText: { fontSize: 13, fontWeight: '900' },
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
