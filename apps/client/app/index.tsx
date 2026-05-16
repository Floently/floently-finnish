import { useEffect } from 'react';
import { Platform } from 'react-native';
import AppShell from '../state/AppShell';
import LearnLandingPage from '../web/LearnLandingPage';
import LegalPage from '../features/legal/LegalPage';
import { useAuthStore } from '../state/authStore';
import { completeGoogleOAuthResult } from '@core/api/auth';
import { resolveLegalPageFromPath } from '../config/legalRoutes';

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

  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
  const hostname = isWeb ? window.location.hostname : '';
  const pathname = isWeb ? window.location.pathname.replace(/\/+$/, '') || '/' : '/';
  const isLearnHost = isWeb && hostname === 'learn.floently.com';
  const isReadHost = isWeb && hostname === 'read.floently.com';
  const legalRoute = isWeb ? resolveLegalPageFromPath(pathname) : null;

  useEffect(() => {
    if (!isWeb || !legalRoute || legalRoute.isCanonical) {
      return;
    }
    window.history.replaceState({}, document.title, legalRoute.canonicalPath);
  }, [isWeb, legalRoute]);

  if (legalRoute) {
    return <LegalPage page={legalRoute.page} />;
  }

  if (isLearnHost) {
    if (hasHydrated && user) {
      return <AppShell requestedScreen="root" />;
    }
    return <LearnLandingPage />;
  }

  if (isReadHost) {
    return <AppShell />;
  }

  return <AppShell />;
}
