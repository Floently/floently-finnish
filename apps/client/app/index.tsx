import { useEffect } from 'react';
import { Platform } from 'react-native';
import AppShell from '../state/AppShell';
import KieliValmisLandingScreen from '../features/kielivalmis/KieliValmisLandingScreen';
import { isLearnHost } from '../state/learnRouting';
import { useAuthStore } from '../state/authStore';
import { completeGoogleOAuthResult } from '@core/api/auth';

export default function IndexRoute() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const oauthResultId = params.get('oauth_result_id');
    if (!oauthResultId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const session = await completeGoogleOAuthResult(oauthResultId);
        if (cancelled) return;
        await setAuth(session.user, session.token);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  const onKieliValmisWebHost = Platform.OS === 'web' && isLearnHost();

  if (onKieliValmisWebHost) {
    if (hasHydrated && user) {
      return <AppShell requestedScreen="root" />;
    }
    return <KieliValmisLandingScreen />;
  }

  return <AppShell />;
}
