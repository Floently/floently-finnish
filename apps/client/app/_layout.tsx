import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GlobalChrome from '../components/GlobalChrome';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Slot />
        <GlobalChrome />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
