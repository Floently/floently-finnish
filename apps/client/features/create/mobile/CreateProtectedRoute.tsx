import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getAuthToken } from '@core/api/apiClient';
import { useAuthStore } from '../../../state/authStore';
import CreateAuthScreen from './CreateAuthScreen';

type Props = {
  children: ReactNode;
};

export default function CreateProtectedRoute({ children }: Props) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hasToken = Boolean(token || getAuthToken());

  useEffect(() => {
    if (!hasHydrated) {
      void hydrateSession();
    }
  }, [hasHydrated, hydrateSession]);

  if (!hasHydrated && !hasToken) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#38C9A8" />
        <Text style={styles.loadingText}>Opening Floently Create...</Text>
      </View>
    );
  }

  if (!hasToken) {
    return <CreateAuthScreen />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 14,
    fontWeight: '800',
  },
});
