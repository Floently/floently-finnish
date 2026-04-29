import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingSession } from '../state/useOnboardingSession';
import { onboardingRoutes } from '../routes';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import {
  BILLING_PERIOD_OPTIONS,
  buildCheckoutRequest,
  estimateCheckoutTotal,
  normalizeProfession,
  professionListLabel,
  resolveProfessionalDisplayName,
  type BillingPeriod,
  type CheckoutPathway,
  type ProfessionKey,
} from '@core/api/entitlements';

function pathwayFromIntent(intent?: string): CheckoutPathway {
  if (intent === 'PROFESSIONAL') return 'professional';
  if (intent === 'BOTH') return 'combined';
  return 'yki';
}

export default function PlanSelectionScreen() {
  const intent = useOnboardingSession((s) => s.intentType);
  const profession = useOnboardingSession((s) => s.profession);
  const setSelectedPlan = useOnboardingSession((s) => s.setSelectedPlan);
  const setPreferredBillingPeriod = useOnboardingSession((s) => s.setPreferredBillingPeriod);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';
  const pathway = useMemo(() => pathwayFromIntent(intent), [intent]);
  const selectedProfession = normalizeProfession(profession) ?? 'nurse';
  const selectedProfessions: ProfessionKey[] = pathway === 'yki' ? [] : [selectedProfession];
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  const estimate = estimateCheckoutTotal(pathway, period, selectedProfessions);
  const checkoutRequest = {
    ...buildCheckoutRequest(pathway, period, selectedProfessions),
    trial_days: 3,
  };

  const heading = intent === 'YKI'
    ? 'YKI pathway pricing'
    : intent === 'PROFESSIONAL'
      ? `${resolveProfessionalDisplayName(profession)} pathway pricing`
      : `Combined YKI + ${resolveProfessionalDisplayName(profession)} pricing`;

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background }}>
      <Text style={{ color: palette.text, ...typography.h1 }}>{heading}</Text>
      <Text style={{ color: palette.textMuted, lineHeight: 21 }}>
        The final payment screen always shows three simple individual plans. This step only saves your first billing preference.
      </Text>

      <View style={{ flexDirection: 'row', borderRadius: 999, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, padding: 4, gap: 4 }}>
        {BILLING_PERIOD_OPTIONS.map((option) => {
          const active = period === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setPeriod(option.key)}
              style={{ flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', backgroundColor: active ? palette.primary : 'transparent' }}
            >
              <Text style={{ color: active ? textOnPrimary : palette.text, fontWeight: '800', fontSize: 12 }}>{option.label}</Text>
              <Text style={{ color: active ? textOnPrimary : palette.textMuted, fontWeight: '700', fontSize: 10 }}>{option.savingsLabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ padding: spacing.lg, borderRadius: 20, borderWidth: 1, borderColor: palette.primary, backgroundColor: palette.primarySurface, gap: spacing.sm }}>
        <Text style={{ color: palette.primary, fontWeight: '900', fontSize: 11, letterSpacing: 0.6 }}>SELECTED PREVIEW</Text>
        <Text style={{ color: palette.text, fontWeight: '900', fontSize: 22 }}>{estimate.totalLabel}</Text>
        <Text style={{ color: palette.textMuted, lineHeight: 20 }}>
          {pathway === 'yki' ? 'YKI access only.' : `${professionListLabel(selectedProfessions)} selected. You can add more professions at checkout.`}
        </Text>
        <Pressable
          onPress={() => {
            setSelectedPlan(checkoutRequest.plan);
            setPreferredBillingPeriod(period);
            router.push(onboardingRoutes.frequency);
          }}
          style={{ minHeight: 46, borderRadius: 999, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}
        >
          <Text style={{ color: textOnPrimary, fontWeight: '900' }}>Continue</Text>
        </Pressable>
      </View>

      <View style={{ padding: spacing.md, borderRadius: 14, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: palette.accent, gap: spacing.xs }}>
        <Text style={{ color: palette.accent, fontWeight: '700' }}>Multi-profession rule</Text>
        <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20 }}>
          The first professional slot is included in Professional or Combined. Extra profession slots receive a small discount and are attached to the same subscription.
        </Text>
      </View>

      <View style={{ padding: spacing.md, borderRadius: 14, backgroundColor: palette.surfaceMuted, gap: spacing.xs }}>
        <Text style={{ color: palette.text, fontWeight: '700' }}>Employer and city access</Text>
        <Text style={{ color: palette.textMuted }}>Organisation programmes remain separate from individual subscriptions and can be configured through programme setup.</Text>
      </View>
    </View>
  );
}
