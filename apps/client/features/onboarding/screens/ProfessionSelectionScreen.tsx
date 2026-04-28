import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingSession } from '../state/useOnboardingSession';
import { onboardingRoutes } from '../routes';
import { colors, spacing, typography } from '@ui/theme';

const professions = [
  ['doctor', 'Doctor', 'Patient interaction, explanations, documentation, and workplace communication in healthcare settings.'],
  ['nurse', 'Nurse', 'Patient care, handovers, reporting, teamwork, and practical language for everyday nursing work.'],
  ['practical_nurse', 'Practical Nurse', 'Care work, routines, residents, relatives, and practical communication in real care environments.'],
] as const;

export default function ProfessionSelectionScreen() {
  const setProfession = useOnboardingSession((s) => s.setProfession);

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text, ...typography.h1 }}>Choose your professional pathway</Text>
      <Text style={{ color: colors.textMuted }}>
        Select the profession that best matches your first work goal in Finland. You can add more professions later during checkout if you need more than one role track.
      </Text>
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
          <Text style={{ color: colors.text, fontWeight: '700' }}>{label}</Text>
          <Text style={{ color: colors.textMuted }}>{detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}
