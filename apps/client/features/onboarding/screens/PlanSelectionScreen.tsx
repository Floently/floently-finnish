import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingSession } from '../state/useOnboardingSession';
import { onboardingRoutes } from '../routes';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { PLAN_CATALOG, resolveProfessionalDisplayName, type PlanId } from '@core/api/entitlements';

export default function PlanSelectionScreen() {
  const intent = useOnboardingSession((s) => s.intentType);
  const profession = useOnboardingSession((s) => s.profession);
  const setSelectedPlan = useOnboardingSession((s) => s.setSelectedPlan);
  const setPreferredBillingPeriod = useOnboardingSession((s) => s.setPreferredBillingPeriod);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);

  const plans = PLAN_CATALOG.filter((plan) => {
    if (intent === 'YKI') return plan.category === 'yki';
    if (intent === 'PROFESSIONAL') {
      return (plan.category === 'professional' || plan.category === 'bundle') && plan.profession === profession;
    }
    if (intent === 'BOTH') {
      return plan.category === 'bundle' && plan.profession === profession;
    }
    return false;
  });

  const heading = intent === 'YKI'
    ? 'YKI pathway pricing'
    : intent === 'PROFESSIONAL'
      ? `${resolveProfessionalDisplayName(profession)} pathway pricing`
      : `Combined YKI + ${resolveProfessionalDisplayName(profession)} pricing`;

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background }}>
      <Text style={{ color: palette.text, ...typography.h1 }}>{heading}</Text>
      <Text style={{ color: palette.textMuted }}>
        Pricing preview. You'll get a 3-day free trial on selected features before any charge.
      </Text>

      {plans.map((plan) => (
        <Pressable
          key={plan.id}
          onPress={() => {
            setSelectedPlan(plan.id as PlanId);
            setPreferredBillingPeriod(plan.billingPeriod === 'yearly' ? 'annual' : 'monthly');
            router.push(onboardingRoutes.frequency);
          }}
          style={{ padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: palette.border, gap: spacing.sm }}
        >
          <Text style={{ color: palette.text, fontWeight: '700' }}>{plan.title}</Text>
          <Text style={{ color: palette.textMuted }}>{plan.description}</Text>
          <Text style={{ color: palette.primary, fontWeight: '700' }}>{plan.checkoutLabel}</Text>
        </Pressable>
      ))}

      <View style={{ padding: spacing.md, borderRadius: 14, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: palette.accent, gap: spacing.xs }}>
        <Text style={{ color: palette.accent, fontWeight: '700' }}>
          What the 3-day trial covers
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20 }}>
          During the trial you can use the free preview mode: 1 roleplay session, 1 card session, and (for YKI) 1 YKI practice. Full Learning, Daily Practice, and YKI Exam unlock only with an active paid plan.
        </Text>
      </View>

      <View style={{ padding: spacing.md, borderRadius: 14, backgroundColor: palette.surfaceMuted, gap: spacing.xs }}>
        <Text style={{ color: palette.text, fontWeight: '700' }}>Need access for employees or programme participants?</Text>
        <Text style={{ color: palette.textMuted }}>Employer and city programme access can be added through organisation setup and guided onboarding.</Text>
      </View>
    </View>
  );
}
