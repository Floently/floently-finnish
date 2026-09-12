import * as Updates from 'expo-updates';
import { Slot } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function ImmediateUpdateGate() {
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const checkNow = async () => {
      if (!Updates.isEnabled || checkingRef.current) return;
      const now = Date.now();
      if (now - lastCheckRef.current < 30_000) return;
      checkingRef.current = true;
      lastCheckRef.current = now;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!mounted || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (mounted) await Updates.reloadAsync();
      } catch {
        // Keep the installed bundle usable if the update service is unavailable.
      } finally {
        checkingRef.current = false;
      }
    };

    void checkNow();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkNow();
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ImmediateUpdateGate />
      <View style={styles.root}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
