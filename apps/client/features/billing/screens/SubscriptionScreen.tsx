import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { paymentService } from '../services/paymentService';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { PLAN_CATALOG, type PlanCatalogEntry } from '@core/api/entitlements';
import { useOnboardingSession } from '../../onboarding/state/useOnboardingSession';

type BillingPeriod = 'monthly' | 'yearly';

/**
 * What's free / what's paid — sourced from route guards in AppShell.tsx (lines 235-258)
 * and preview limits from subscriptionStore.ts (line 188). Keep this list in sync with
 * the actual gates; misleading copy churns trials fast.
 */
const TRIAL_INCLUDES = [
  '1 roleplay session with a Finnish persona',
  '1 card practice session',
  'YKI preview: 1 YKI practice set (YKI path only)',
  'Home, Progress, Settings, Help',
];

const TRIAL_EXCLUDES = [
  'Full Learning library and Daily Practice',
  'Full YKI Exam mode',
  'Unlimited roleplay, cards, and YKI practice',
];

export default function SubscriptionScreen() {
  const [tier, setTier] = useState<string>('free');
  const [period, setPeriod] = useState<BillingPeriod>('yearly');

  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

  const onboardingIntent = useOnboardingSession((s) => s.intentType);
  const onboardingProfession = useOnboardingSession((s) => s.profession);

  useEffect(() => {
    void paymentService
      .getSubscriptionStatus()
      .then((s: unknown) => {
        const record = (s ?? {}) as { billingTier?: string; tier?: string };
        setTier(record.billingTier ?? record.tier ?? 'free');
      })
      .catch(() => undefined);
  }, []);

  const relevantPlans = useMemo(() => {
    if (!onboardingIntent) return PLAN_CATALOG;
    return PLAN_CATALOG.filter((plan) => {
      if (onboardingIntent === 'YKI') return plan.category === 'yki';
      if (onboardingIntent === 'PROFESSIONAL') {
        return (plan.category === 'professional' || plan.category === 'bundle') && plan.profession === onboardingProfession;
      }
      if (onboardingIntent === 'BOTH') {
        return plan.category === 'bundle' && plan.profession === onboardingProfession;
      }
      return true;
    });
  }, [onboardingIntent, onboardingProfession]);

  const plansForPeriod = useMemo(
    () => relevantPlans.filter((p) => (period === 'yearly' ? p.billingPeriod === 'yearly' : p.billingPeriod === 'monthly')),
    [relevantPlans, period],
  );

  const recommendedPlanId = useMemo(() => {
    if (onboardingIntent === 'BOTH') {
      return plansForPeriod.find((p) => p.category === 'bundle')?.id;
    }
    return plansForPeriod[0]?.id;
  }, [plansForPeriod, onboardingIntent]);

  async function handleStartTrial(plan: PlanCatalogEntry) {
    try {
      const session = (await paymentService.createCheckoutSession(plan.id)) as {
        url?: string;
        checkout_url?: string;
      } | null;
      const url = session?.url ?? session?.checkout_url;
      if (url) await Linking.openURL(url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not start trial. Please try again.';
      Alert.alert('Trial setup failed', message);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background, paddingBottom: spacing.xxxl }}
      style={{ backgroundColor: palette.background }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: palette.primary, fontWeight: '800', letterSpacing: 0.8, fontSize: 11 }}>
          START YOUR 3-DAY FREE TRIAL
        </Text>
        <Text style={{ color: palette.text, ...typography.h1 }}>Pick the plan that fits your path</Text>
        <Text style={{ color: palette.textMuted, fontSize: 15, lineHeight: 22 }}>
          3 days free on selected features, then your plan begins. Cancel anytime before day 3 and you won't be charged.
        </Text>
      </View>

      {/* Current tier notice */}
      {tier && tier !== 'free' && (
        <View style={{ padding: spacing.md, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border }}>
          <Text style={{ color: palette.textMuted, fontSize: 13 }}>Current plan</Text>
          <Text style={{ color: palette.text, fontWeight: '700', marginTop: 2 }}>{tier}</Text>
        </View>
      )}

      {/* Billing period toggle */}
      <View style={{ flexDirection: 'row', borderRadius: 999, backgroundColor: palette.surface, padding: 4, borderWidth: 1, borderColor: palette.border }}>
        {(['yearly', 'monthly'] as const).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: active ? palette.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: active ? textOnPrimary : palette.textMuted, fontWeight: '700', fontSize: 14 }}>
                {p === 'yearly' ? 'Yearly · save 16%' : 'Monthly'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Plans */}
      {plansForPeriod.map((plan) => {
        const isRecommended = plan.id === recommendedPlanId;
        return (
          <Pressable
            key={plan.id}
            onPress={() => void handleStartTrial(plan)}
            style={{
              padding: spacing.lg,
              borderRadius: 16,
              borderWidth: isRecommended ? 2 : 1,
              borderColor: isRecommended ? palette.primary : palette.border,
              gap: spacing.sm,
              position: 'relative',
              backgroundColor: isRecommended ? palette.primarySurface : 'transparent',
            }}
          >
            {isRecommended && (
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  right: spacing.lg,
                  backgroundColor: palette.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: textOnPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                  RECOMMENDED
                </Text>
              </View>
            )}
            <Text style={{ color: palette.text, fontWeight: '700', fontSize: 17 }}>{plan.title}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20 }}>{plan.description}</Text>
            <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 16, marginTop: spacing.xs }}>
              {plan.checkoutLabel}
            </Text>
            <View
              style={{
                minHeight: 48,
                borderRadius: 999,
                backgroundColor: isRecommended ? palette.primary : 'transparent',
                borderWidth: isRecommended ? 0 : 1,
                borderColor: palette.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: isRecommended ? textOnPrimary : palette.primary,
                  fontWeight: '800',
                  fontSize: 15,
                }}
              >
                Start 3-day free trial
              </Text>
            </View>
          </Pressable>
        );
      })}

      {/* Access split — now accent teal framed for "what you get" */}
      <View style={{ padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, gap: spacing.sm }}>
        <Text style={{ color: palette.text, fontWeight: '700', fontSize: 15 }}>
          What you get during the 3-day trial
        </Text>
        {TRIAL_INCLUDES.map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Text style={{ color: palette.accent, fontWeight: '800', marginTop: 1 }}>✓</Text>
            <Text style={{ color: palette.textMuted, flex: 1, fontSize: 13, lineHeight: 19 }}>{item}</Text>
          </View>
        ))}

        <Text style={{ color: palette.text, fontWeight: '700', fontSize: 15, marginTop: spacing.md }}>
          Unlocks with your paid plan
        </Text>
        {TRIAL_EXCLUDES.map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Text style={{ color: palette.primary, fontWeight: '800', marginTop: 1 }}>+</Text>
            <Text style={{ color: palette.textMuted, flex: 1, fontSize: 13, lineHeight: 19 }}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: palette.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
        Cancel before day 3 and you won't be charged. Manage your plan anytime in Settings.
      </Text>

      <Pressable
        onPress={() => {
          Alert.alert(
            'For organisations',
            'Employer and municipality pricing uses the same pathways with cohort visibility, assigned tracks, and reporting. Please contact us to set up.',
          );
        }}
        style={{ padding: spacing.sm, marginTop: spacing.sm }}
      >
        <Text style={{ color: palette.textMuted, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>
          For organisations and programme access →
        </Text>
      </Pressable>
    </ScrollView>
  );
}
