import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { useAuthStore } from '../../state/authStore';
import { usePreferencesStore } from '../../state/preferencesStore';
import { useSubscriptionStore } from '../../state/subscriptionStore';
import { ReadingRuntimeScreen } from './ReadingRuntimeScreen';
import {
  resolveReadingAccess,
  type ReadingRuntimeHooks,
  type ReadingScope,
} from './readingEngine';
import { getReadingTasks, resolveReadingTask } from './readingTasks';

type ReadingRouteProps = ReadingRuntimeHooks & {
  scope: ReadingScope;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function ReadingRoute({ scope, onEvent, onResult }: ReadingRouteProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string | string[]; level?: string | string[] }>();
  const routeTaskId = firstParam(params.taskId);
  const routeLevel = firstParam(params.level);
  const [selectedTaskId, setSelectedTaskId] = useState(routeTaskId);

  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const preferencesHydrated = usePreferencesStore((state) => state.hasHydrated);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const subscriptionLoaded = useSubscriptionStore((state) => state.hasLoaded);
  const subscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const subscription = useSubscriptionStore((state) => state.status);
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const palette = getFloentlyPalette(themeMode);

  useEffect(() => {
    if (!authHydrated) void hydrateSession();
    if (!preferencesHydrated) void hydratePreferences();
  }, [authHydrated, hydratePreferences, hydrateSession, preferencesHydrated]);

  useEffect(() => {
    if (authHydrated && user && !subscriptionLoaded && !subscriptionLoading) {
      void hydrateSubscription(user);
    }
  }, [
    authHydrated,
    hydrateSubscription,
    subscriptionLoaded,
    subscriptionLoading,
    user,
  ]);

  useEffect(() => {
    setSelectedTaskId(routeTaskId);
  }, [routeTaskId]);

  const access = resolveReadingAccess({
    scope,
    authHydrated,
    userPresent: Boolean(user),
    subscriptionLoaded,
    subscriptionLoading,
    isPreview: Boolean(subscription?.isPreview),
    isInternalAllAccess: Boolean(subscription?.isInternalAllAccess),
    learnAccess: Boolean(subscription?.entitlements.learnAccess),
    professionalAccess: Boolean(subscription?.entitlements.professionalAccess),
  });

  const resolution = useMemo(
    () =>
      resolveReadingTask({
        scope,
        taskId: selectedTaskId,
        level: selectedTaskId ? undefined : routeLevel,
      }),
    [routeLevel, scope, selectedTaskId],
  );
  const taskOptions = useMemo(() => getReadingTasks(scope), [scope]);
  const backRoute = scope === 'professional' ? '/professional' : '/learn?branch=everyday';
  const onBack = () => router.replace(backRoute as never);

  if (access === 'loading') {
    return (
      <ReadingRuntimeScreen
        palette={palette}
        scope={scope}
        status="loading"
        onBack={onBack}
      />
    );
  }

  if (access === 'auth_required') {
    return (
      <ReadingRuntimeScreen
        palette={palette}
        scope={scope}
        status="error"
        errorEyebrow="Kirjautuminen tarvitaan"
        errorTitle="Kirjaudu sisään jatkaaksesi"
        errorMessage="Lukutehtävät tallentavat edistymisesi omaan oppimispolkuusi."
        errorActionLabel="Kirjaudu sisään"
        onRetryLoad={() => router.push('/auth/login' as never)}
        onBack={onBack}
      />
    );
  }

  if (access === 'entitlement_required') {
    return (
      <ReadingRuntimeScreen
        palette={palette}
        scope={scope}
        status="error"
        errorEyebrow="Tilaus tarvitaan"
        errorTitle="Tämä lukupolku ei sisälly nykyiseen käyttöoikeuteesi"
        errorMessage={
          scope === 'professional'
            ? 'Työelämän lukutehtävät kuuluvat Professional Finnish -käyttöoikeuteen.'
            : 'Arjen lukutehtävät kuuluvat KieliValmis-oppimispolkuun.'
        }
        errorActionLabel="Tutustu tilauksiin"
        onRetryLoad={() => router.push('/billing/subscription' as never)}
        onBack={onBack}
      />
    );
  }

  if (resolution.status !== 'ready') {
    const copy =
      resolution.status === 'not_found'
        ? 'Pyydettyä tehtävää ei löydy tästä lukupolusta.'
        : resolution.status === 'invalid_level'
          ? 'Tasoksi voi valita A1, A2, B1 tai B2.'
          : 'Tälle tasolle ei ole vielä tehtävää tässä lukupolussa.';
    return (
      <ReadingRuntimeScreen
        palette={palette}
        scope={scope}
        status="error"
        errorEyebrow="Tehtävää ei löytynyt"
        errorTitle="Valitse saatavilla oleva lukutehtävä"
        errorMessage={copy}
        errorActionLabel="Avaa ensimmäinen tehtävä"
        onRetryLoad={() => setSelectedTaskId(taskOptions[0]?.taskId)}
        onBack={onBack}
      />
    );
  }

  return (
    <ReadingRuntimeScreen
      palette={palette}
      scope={scope}
      status="ready"
      task={resolution.task}
      taskOptions={taskOptions}
      onSelectTask={setSelectedTaskId}
      onBack={onBack}
      onEvent={onEvent}
      onResult={onResult}
    />
  );
}
