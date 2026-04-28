import { useEffect } from 'react';
import { Platform } from 'react-native';
import AppShell from '../state/AppShell';
import LearnLandingPage from '../web/LearnLandingPage';
import { useAuthStore } from '../state/authStore';

export default function IndexRoute() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  const isLearnHost = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'learn.floently.com';

  useEffect(() => {
    if (isLearnHost) {
      void hydrateSession();
    }
  }, [hydrateSession, isLearnHost]);

  if (isLearnHost) {
    if (!hasHydrated) {
      return null;
    }
    return user ? <AppShell /> : <LearnLandingPage />;
  }

  return <AppShell />;
}
