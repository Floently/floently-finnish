import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import Text from '@ui/primitives/Text';

import SpeakingRoute from '../../state/SpeakingRoute';
import { useAuthStore } from '../../state/authStore';
import {
  canUseProfessionalMissionSpeakingPreset,
  parseProfessionalMissionSpeakingParams,
  type ProfessionalMissionSpeakingSearchParams,
} from '../../state/professionalMissionSpeakingParams';
import { useSubscriptionStore } from '../../state/subscriptionStore';
import { audioSession } from '../../features/shared/services/audioSession';
import AppShell from '../../state/AppShell';

/**
 * Integration-owned bridge for Agent F Professional Mission Roleplay launches.
 *
 * Ordinary `/speaking` remains unchanged behind AppShell. This route accepts
 * only a complete canonical mission tuple, waits for authenticated subscription
 * state, verifies exact Professional/profession entitlement, and then feeds the
 * already-protected SpeakingRoute preset contract. Invalid or unauthorized
 * tuples fall back to the ordinary AppShell speaking entry with no mission
 * preset applied.
 */
export default function ProfessionalMissionSpeakingEntry() {
  const params = useLocalSearchParams<ProfessionalMissionSpeakingSearchParams>();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasLoadedSubscription = useSubscriptionStore((state) => state.hasLoaded);
  const isLoadingSubscription = useSubscriptionStore((state) => state.isLoading);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const setActiveContext = useSubscriptionStore((state) => state.setActiveContext);

  const missionPreset = useMemo(
    () => parseProfessionalMissionSpeakingParams(params),
    [params.contextId, params.entryMode, params.missionId, params.profession, params.scenarioId],
  );

  const authorized = canUseProfessionalMissionSpeakingPreset(
    missionPreset,
    subscriptionStatus,
  );

  useEffect(() => {
    if (!hasHydrated) void hydrateSession();
  }, [hasHydrated, hydrateSession]);

  useEffect(() => {
    if (!hasHydrated || !user || hasLoadedSubscription || isLoadingSubscription) return;
    void hydrateSubscription(user);
  }, [
    hasHydrated,
    hasLoadedSubscription,
    hydrateSubscription,
    isLoadingSubscription,
    user,
  ]);

  useEffect(() => {
    if (!authorized || !missionPreset) return;
    setActiveContext(missionPreset.initialProfession);
  }, [authorized, missionPreset, setActiveContext]);

  // Preserve the AppShell voice-cleanup invariant even though this narrow
  // validated launch route renders SpeakingRoute directly after access checks.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void audioSession.releaseAll('background');
      }
    });
    return () => subscription.remove();
  }, []);

  const checkingAccess = !hasHydrated
    || Boolean(user && (!hasLoadedSubscription || isLoadingSubscription));

  if (checkingAccess) {
    return (
      <View style={styles.loading} accessibilityRole="progressbar">
        <ActivityIndicator accessibilityLabel="Checking Professional Finnish access" />
        <Text tone="muted">Checking access…</Text>
      </View>
    );
  }

  if (!user || !authorized || !missionPreset) {
    return <AppShell requestedScreen="speaking-practice" />;
  }

  return (
    <SpeakingRoute
      onBack={() => router.back()}
      onOpenMenu={() => router.replace('/?openMenu=1' as never)}
      initialLevelBand={missionPreset.initialLevelBand}
      initialSurface={missionPreset.initialSurface}
      initialProfession={missionPreset.initialProfession}
      initialScenarioId={missionPreset.initialScenarioId}
      lockProfession={missionPreset.lockProfession}
      entryMode={missionPreset.entryMode}
      contextLabel={missionPreset.contextLabel}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
