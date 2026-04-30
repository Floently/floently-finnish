import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingSession } from '../state/useOnboardingSession';
import { onboardingRoutes } from '../routes';
import { colors, spacing, typography } from '@ui/theme';
import { useTranslator } from '../../i18n';

const professions = [
  ['doctor', 'professionalNameDoctor', 'onboardingProfessionDoctorDetail'],
  ['nurse', 'professionalNameNurse', 'onboardingProfessionNurseDetail'],
  ['practical_nurse', 'professionalNamePracticalNurse', 'onboardingProfessionPracticalNurseDetail'],
] as const;

export default function ProfessionSelectionScreen() {
  const { t } = useTranslator();
  const setProfession = useOnboardingSession((s) => s.setProfession);

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text, ...typography.h1 }}>{t('onboardingProfessionSelectionTitle')}</Text>
      <Text style={{ color: colors.textMuted }}>{t('onboardingProfessionSelectionSubtitle')}</Text>
      {professions.map(([profession, label, detail]) => (
        <Pressable
          key={profession}
          onPress={() => {
            setProfession(profession);
            // Value-first onboarding: plan selection is deferred until after placement.
            router.push(onboardingRoutes.frequency);
          }}
          style={{ padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: spacing.xs }}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>{t(label)}</Text>
          <Text style={{ color: colors.textMuted }}>{t(detail)}</Text>
        </Pressable>
      ))}
    </View>
  );
}
