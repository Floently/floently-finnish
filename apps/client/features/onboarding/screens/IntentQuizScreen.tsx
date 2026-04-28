import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingSession } from '../state/useOnboardingSession';
import { onboardingRoutes } from '../routes';
import { spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';

type IntentOption = {
  value: 'YKI' | 'PROFESSIONAL' | 'BOTH';
  label: string;
  audience: string;
  preview: string;
  popular?: boolean;
};

const INTENTS: IntentOption[] = [
  {
    value: 'YKI',
    label: 'Pass YKI',
    audience: 'For citizenship, residence, and exam readiness',
    preview: 'First lesson: a YKI-style listening + speaking warmup',
  },
  {
    value: 'PROFESSIONAL',
    label: 'Work in Finland',
    audience: 'For healthcare workers starting in Finnish workplaces',
    preview: 'First roleplay: a shift handover with a Finnish colleague',
  },
  {
    value: 'BOTH',
    label: 'YKI + Work',
    audience: 'Balanced: exam prep plus real workplace Finnish',
    preview: 'First lesson: YKI listening. First roleplay: a patient update',
    popular: true,
  },
];

export default function IntentQuizScreen() {
  const setIntentType = useOnboardingSession((s) => s.setIntentType);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: palette.primary, fontWeight: '800', letterSpacing: 0.8, fontSize: 11 }}>
          STEP 1 OF 3
        </Text>
        <Text style={{ color: palette.text, ...typography.h1 }}>
          What's your Finnish for?
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 15, lineHeight: 22 }}>
          Pick one. You can combine later.
        </Text>
      </View>

      {INTENTS.map((intent) => (
        <Pressable
          key={intent.value}
          onPress={() => {
            setIntentType(intent.value);
            router.push(intent.value === 'YKI' ? onboardingRoutes.frequency : onboardingRoutes.profession);
          }}
          style={({ pressed }) => ({
            padding: spacing.lg,
            borderRadius: 16,
            borderWidth: intent.popular ? 2 : 1,
            borderColor: intent.popular ? palette.primary : palette.border,
            backgroundColor: pressed ? palette.surfaceMuted : 'transparent',
            gap: spacing.xs,
            position: 'relative',
          })}
        >
          {intent.popular ? (
            <View
              style={{
                position: 'absolute',
                top: -10,
                left: spacing.lg,
                backgroundColor: palette.primary,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: textOnPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                MOST POPULAR
              </Text>
            </View>
          ) : null}
          <Text style={{ color: palette.text, fontWeight: '700', fontSize: 17 }}>{intent.label}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13 }}>{intent.audience}</Text>
          <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '600', marginTop: spacing.xs }}>
            {intent.preview}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
