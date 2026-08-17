import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@ui/theme';

import { useAuthStore } from '../../state/authStore';
import { useSubscriptionStore } from '../../state/subscriptionStore';
import { getProfessionalMissionWritingTasks } from '../professional/missionRuntimeAdapters';
import { resolveWritingAccess } from './engine';
import WritingPracticeScreen from './WritingPracticeScreen';
import type { WritingPathway, WritingProfession } from './model';

type Props = {
  pathway: WritingPathway;
  initialTaskId?: string | null;
};

function isWritingProfession(value: string): value is WritingProfession {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function AccessMessage({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}>
        <View accessibilityRole="alert" style={styles.accessCard}>
          <Text accessibilityRole="header" style={styles.accessTitle}>{title}</Text>
          <Text style={styles.accessDetail}>{detail}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function WritingRouteScreen({ pathway, initialTaskId }: Props) {
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const hydrateAuth = useAuthStore((state) => state.hydrateSession);
  const subscriptionLoaded = useSubscriptionStore((state) => state.hasLoaded);
  const subscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const activeContext = useSubscriptionStore((state) => state.activeContext);
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);

  useEffect(() => {
    if (!authHydrated) void hydrateAuth();
  }, [authHydrated, hydrateAuth]);

  useEffect(() => {
    if (authHydrated && user && !subscriptionLoaded && !subscriptionLoading) {
      void hydrateSubscription(user);
    }
  }, [authHydrated, hydrateSubscription, subscriptionLoaded, subscriptionLoading, user]);

  const entitlements = subscriptionStatus?.entitlements;
  const access = resolveWritingAccess({
    pathway,
    authHydrated,
    learnerId: user?.id ?? null,
    subscriptionLoaded,
    learnAccess: Boolean(entitlements?.learnAccess),
    professionalAccess: Boolean(entitlements?.professionalAccess),
  });

  const profession = useMemo<WritingProfession | null>(() => {
    if (isWritingProfession(activeContext)) return activeContext;
    const first = entitlements?.professions.find(isWritingProfession);
    return first ?? null;
  }, [activeContext, entitlements?.professions]);

  const missionTasks = useMemo(
    () => pathway === 'professional' ? getProfessionalMissionWritingTasks(profession ?? undefined) : [],
    [pathway, profession],
  );

  if (access.state === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View accessibilityLabel={access.reason} accessibilityRole="progressbar" style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text accessibilityLiveRegion="polite" style={styles.loadingText}>{access.reason}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (access.state === 'auth_required') {
    return (
      <AccessMessage
        title="Sign in for Writing"
        detail={access.reason}
        actionLabel="Sign in"
        onAction={() => router.replace('/auth/login')}
      />
    );
  }

  if (access.state === 'entitlement_required') {
    const returnRoute = pathway === 'professional' ? '/professional' : '/learn';
    return (
      <AccessMessage
        title="Writing is not in your current access"
        detail={access.reason}
        actionLabel="Return to pathway"
        onAction={() => router.replace(returnRoute)}
      />
    );
  }

  return (
    <WritingPracticeScreen
      pathway={pathway}
      profession={profession}
      initialTaskId={initialTaskId}
      additionalTasks={missionTasks}
      onExit={() => router.replace(pathway === 'professional' ? '/professional' : '/learn')}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  loadingText: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  accessCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.lg,
    gap: spacing.md,
  },
  accessTitle: { color: colors.text, fontSize: 22, lineHeight: 29, fontWeight: '800' },
  accessDetail: { color: colors.textMuted, fontSize: 15, lineHeight: 23 },
  actionButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
