import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import type { ProfessionalProfession } from '@core/professional/missions.mjs';

import { useAuthStore } from '../../state/authStore';
import { usePreferencesStore } from '../../state/preferencesStore';
import { useSubscriptionStore } from '../../state/subscriptionStore';
import { buildProfessionalMissionChain } from './professionalMissionChain';
import {
  findProfessionalMissionListeningTask,
  getProfessionalMissionListeningTasks,
} from './professionalListening';
import ProfessionalListeningScreen from './ProfessionalListeningScreen';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isProfessionalProfession(value: unknown): value is ProfessionalProfession {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function AccessMessage({
  title,
  detail,
  actionLabel,
  onAction,
  onBack,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}>
        <View accessibilityRole="alert" style={styles.accessCard}>
          <Text accessibilityRole="header" style={styles.accessTitle}>{title}</Text>
          <Text style={styles.accessDetail}>{detail}</Text>
          <Pressable accessibilityRole="button" onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backAction}>
            <Text style={styles.backActionText}>Back to Professional Finnish</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function ProfessionalListeningRoute() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string | string[] }>();
  const requestedTaskId = firstParam(taskId);

  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const hydrateAuth = useAuthStore((state) => state.hydrateSession);
  const preferencesHydrated = usePreferencesStore((state) => state.hasHydrated);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const subscriptionLoaded = useSubscriptionStore((state) => state.hasLoaded);
  const subscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const activeContext = useSubscriptionStore((state) => state.activeContext);
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const palette = getFloentlyPalette(themeMode);

  useEffect(() => {
    if (!authHydrated) void hydrateAuth();
    if (!preferencesHydrated) void hydratePreferences();
  }, [authHydrated, hydrateAuth, hydratePreferences, preferencesHydrated]);

  useEffect(() => {
    if (authHydrated && user && !subscriptionLoaded && !subscriptionLoading) {
      void hydrateSubscription(user);
    }
  }, [authHydrated, hydrateSubscription, subscriptionLoaded, subscriptionLoading, user]);

  const entitlements = subscriptionStatus?.entitlements;
  const profession = useMemo<ProfessionalProfession | null>(() => {
    if (isProfessionalProfession(activeContext)) return activeContext;
    const entitled = entitlements?.professions.find(isProfessionalProfession);
    if (entitled) return entitled;
    return subscriptionStatus?.isInternalAllAccess ? 'nurse' : null;
  }, [activeContext, entitlements?.professions, subscriptionStatus?.isInternalAllAccess]);

  const task = useMemo(() => {
    if (!profession) return undefined;
    if (requestedTaskId) {
      return findProfessionalMissionListeningTask(requestedTaskId, profession);
    }
    return getProfessionalMissionListeningTasks(profession)[0];
  }, [profession, requestedTaskId]);

  const onBack = () => router.replace('/professional' as never);

  if (!authHydrated || !preferencesHydrated || !subscriptionLoaded || subscriptionLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <View accessibilityRole="progressbar" style={styles.centered}>
          <ActivityIndicator color={palette.primary} size="large" />
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: palette.textMuted }]}>
            Loading Professional Listening…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <AccessMessage
        title="Sign in for Professional Listening"
        detail="Sign in so KieliValmis can verify your Professional Finnish access."
        actionLabel="Sign in"
        onAction={() => router.replace('/auth/login' as never)}
        onBack={onBack}
      />
    );
  }

  if (!subscriptionStatus?.isInternalAllAccess && !entitlements?.professionalAccess) {
    return (
      <AccessMessage
        title="Professional Listening is not in your current access"
        detail="This mission step belongs to Professional Finnish."
        actionLabel="View subscriptions"
        onAction={() => router.push('/billing/subscription' as never)}
        onBack={onBack}
      />
    );
  }

  if (!profession || !task) {
    return (
      <AccessMessage
        title="Listening mission not found"
        detail="The requested listening task does not belong to your active Professional profession."
        actionLabel="Open Professional Finnish"
        onAction={onBack}
        onBack={onBack}
      />
    );
  }

  const chain = buildProfessionalMissionChain(profession);
  const speakingStep = chain.steps.find((step) => step.id === 'speak');
  if (!speakingStep?.launch) {
    return (
      <AccessMessage
        title="Speaking step unavailable"
        detail="This mission cannot continue because its speaking step is not available."
        actionLabel="Open Professional Finnish"
        onAction={onBack}
        onBack={onBack}
      />
    );
  }

  return (
    <ProfessionalListeningScreen
      palette={palette}
      task={task}
      onBack={onBack}
      onContinueToSpeaking={() =>
        router.replace({
          pathname: speakingStep.launch!.pathname,
          params: speakingStep.launch!.params,
        } as never)
      }
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  loadingText: { fontSize: 14, lineHeight: 21 },
  accessCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E1EE',
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 14,
  },
  accessTitle: { color: '#243552', fontSize: 22, lineHeight: 29, fontWeight: '800' },
  accessDetail: { color: '#6E82A4', fontSize: 15, lineHeight: 23 },
  actionButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#345EC3',
    paddingHorizontal: 18,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  backAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  backActionText: { color: '#345EC3', fontSize: 14, fontWeight: '750' },
});
