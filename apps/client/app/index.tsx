import { Platform } from 'react-native';
import AppShell from '../state/AppShell';
import { useAuthStore } from '../state/authStore';

export default function IndexRoute() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  const isLearnHost = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'learn.floently.com';

  if (isLearnHost) {
    return <AppShell requestedScreen={hasHydrated && user ? 'root' : 'landing'} />;
  }

  return <AppShell />;
}
