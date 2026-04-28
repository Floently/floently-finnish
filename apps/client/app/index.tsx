import { useEffect } from 'react';
import { Platform } from 'react-native';
import AppShell from '../state/AppShell';
import LearnLandingPage from '../web/LearnLandingPage';
import { useAuthStore } from '../state/authStore';

export default function IndexRoute() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  const isLearnHost = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'learn.floently.com';

  if (isLearnHost) {
    if (hasHydrated && user) {
      return <AppShell requestedScreen="root" />;
    }
    return <LearnLandingPage />;
  }

  return <AppShell />;
}
