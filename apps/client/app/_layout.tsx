import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  FloentlyErrorBoundary,
  installFloentlyGlobalErrorHandler,
} from '../components/diagnostics/FloentlyErrorBoundary';

installFloentlyGlobalErrorHandler();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FloentlyErrorBoundary>
        <View style={styles.root}>
          <Slot />
        </View>
      </FloentlyErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
