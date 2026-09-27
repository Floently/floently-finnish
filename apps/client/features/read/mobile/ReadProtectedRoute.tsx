import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { getAuthToken } from '@core/api/apiClient';
import { useAuthStore } from '../../../state/authStore';
import { useSubscriptionStore } from '../../../state/subscriptionStore';
import ReadAuthScreen from './ReadAuthScreen';

type Props = {
  children: ReactNode;
  requireReadAccess?: boolean;
};

export default function ReadProtectedRoute({
  children,
  requireReadAccess = true,
}: Props) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const subscriptionLoaded = useSubscriptionStore((state) => state.hasLoaded);
  const subscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const subscription = useSubscriptionStore((state) => state.status);
  const hydrateSubscription = useSubscriptionStore((state) => state.hydrate);
  const hasToken = Boolean(token || getAuthToken());

  useEffect(() => {
    if (!hasHydrated) {
      void hydrateSession();
    }
  }, [hasHydrated, hydrateSession]);

  useEffect(() => {
    if (
      hasHydrated &&
      hasToken &&
      user &&
      !subscriptionLoaded &&
      !subscriptionLoading
    ) {
      void hydrateSubscription(user);
    }
  }, [
    hasHydrated,
    hasToken,
    hydrateSubscription,
    subscriptionLoaded,
    subscriptionLoading,
    user,
  ]);

  if (!hasHydrated && !hasToken) {
    return <ReadLoadingScreen label="Opening Floently Read…" />;
  }

  if (!hasToken) {
    return <ReadAuthScreen />;
  }

  if (!requireReadAccess) {
    return <>{children}</>;
  }

  if (!subscriptionLoaded || subscriptionLoading) {
    return <ReadLoadingScreen label="Checking Read access…" />;
  }

  const readAccess = Boolean(
    subscription?.isInternalAllAccess ||
    subscription?.entitlements?.readAccess ||
    subscription?.readAccess ||
    user?.readAccess,
  );

  if (!readAccess) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedKicker}>Floently Read</Text>
        <Text style={styles.lockedTitle}>Read access is not active</Text>
        <Text style={styles.lockedBody}>
          Read is a separate product. Choose a Read plan or restore an existing purchase to continue.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/read/subscribe' as never)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>View Read plans</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/' as never)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Back to Floently</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

function ReadLoadingScreen({ label }: { label: string }) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color="#8FA8FF" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
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
  lockedScreen: {
    flex: 1,
    backgroundColor: '#0B0F24',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  lockedKicker: {
    color: '#8FA8FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  lockedTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '900',
  },
  lockedBody: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 430,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#BFC9DD',
    fontSize: 13,
    fontWeight: '800',
  },
});
