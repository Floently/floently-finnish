import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateHomeRoute() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.kicker}>FLOENTLY CREATE</Text>
        <Text style={styles.title}>Create is staying separate for now.</Text>
        <Text style={styles.body}>This TestFlight build is focused on Read. You can still open the current Create web experience without adding Create code to this build.</Text>
        <Pressable style={styles.primary} onPress={() => void Linking.openURL('https://create.floently.com/')}><Text style={styles.primaryText}>Open Create web</Text></Pressable>
        <Pressable style={styles.secondary} onPress={() => router.replace('/' as never)}><Text style={styles.secondaryText}>Back to Floently</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020613' }, wrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  kicker: { color: '#36D2B5', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: '#FFFFFF', fontSize: 34, lineHeight: 39, fontWeight: '900' },
  body: { color: 'rgba(255,255,255,0.70)', fontSize: 15, lineHeight: 23, marginBottom: 8 },
  primary: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25BFA4' },
  primaryText: { color: '#03120F', fontWeight: '900', fontSize: 15 },
  secondary: { minHeight: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  secondaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
