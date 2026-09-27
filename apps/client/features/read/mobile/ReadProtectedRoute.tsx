import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getAuthToken } from '@core/api/apiClient';
import { useAuthStore } from '../../../state/authStore';
import ReadAuthScreen from './ReadAuthScreen';

type Props = {
  children: ReactNode;
};

export default function ReadProtectedRoute({ children }: Props) {
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
        <ActivityIndicator color="#8FA8FF" />
        <Text style={styles.loadingText}>Opening Floently Read...</Text>
      </View>
    );
  }

  if (!hasToken) {
    return <ReadAuthScreen />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0B0F24',
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
