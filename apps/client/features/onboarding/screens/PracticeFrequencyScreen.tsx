import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingSession } from '../state/useOnboardingSession';
import { onboardingRoutes } from '../routes';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useAuthStore } from '../../../state/authStore';

type FrequencyOption = {
  key: 'light' | 'steady' | 'intensive';
  label: string;
  detail: string;
  minutes: string;
};

const FREQUENCIES: FrequencyOption[] = [
  { key: 'light',     label: 'A few times a week',    detail: 'Flexible pace, still real progress',   minutes: '~10 min / session' },
  { key: 'steady',    label: 'A little every day',    detail: 'Most common pick — steady habit',     minutes: '~10 min / day'     },
  { key: 'intensive', label: 'Daily intensive',       detail: 'Fastest path, deeper practice',       minutes: '~25 min / day'     },
];

export default function PracticeFrequencyScreen() {
  const setPracticeFrequency = useOnboardingSession((s) => s.setPracticeFrequency);
  const user = useAuthStore((state) => state.user);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: palette.primary, fontWeight: '800', letterSpacing: 0.8, fontSize: 11 }}>
          STEP 3 OF 3
        </Text>
        <Text style={{ color: palette.text, ...typography.h1 }}>
          How much time can you commit?
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 15, lineHeight: 22 }}>
          Pick what's realistic. We'll shape your practice mix around it.
        </Text>
      </View>

      {FREQUENCIES.map((f) => (
        <Pressable
          key={f.key}
          onPress={() => {
            setPracticeFrequency(f.key);
            router.push((user ? onboardingRoutes.subscription : onboardingRoutes.register) as never);
          }}
          style={({ pressed }) => ({
            padding: spacing.lg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: pressed ? palette.surfaceMuted : 'transparent',
            gap: spacing.xs,
          })}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: palette.text, fontWeight: '700', fontSize: 17 }}>{f.label}</Text>
            <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>{f.minutes}</Text>
          </View>
          <Text style={{ color: palette.textMuted, fontSize: 13 }}>{f.detail}</Text>
        </Pressable>
      ))}

      <Text style={{ color: palette.textMuted, textAlign: 'center', fontSize: 12, marginTop: spacing.md }}>
        No commitment yet — you'll see your Finnish level first.
      </Text>
    </View>
  );
}
