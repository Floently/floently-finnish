import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../state/authStore';

const LOGO = require('../components/public/logo.png');

export default function ReadHomeScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.replace('/' as never)} style={styles.backButton}>
            <Text style={styles.backText}>‹ Floently</Text>
          </Pressable>
          <View style={styles.readBadge}><Text style={styles.readBadgeText}>READ</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.glow} />
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.eyebrow}>FLOENTLY READ</Text>
          <Text style={styles.title}>Read the real web. Listen without losing the page.</Text>
          <Text style={styles.subtitle}>
            Open Udacity or any supported website inside Floently, sign in on the real site, move through your lessons, and keep Read controls with you.
          </Text>

          <Pressable onPress={() => router.push('/read' as never)} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Open Read browser</Text>
            <Text style={styles.primaryArrow}>→</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/read-login' as never)} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{user ? `Signed in as ${user.email}` : 'Sign in to Floently Read'}</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoKicker}>TODAY'S STUDY FLOW</Text>
          <Text style={styles.infoTitle}>Udacity inside Floently</Text>
          {['Open the Read browser.', 'Go to Udacity and sign in normally.', 'Navigate to the lesson you want.', 'Tap Read page to listen to the main lesson text.'].map((item, index) => (
            <View key={item} style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text style={styles.stepText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Websites stay websites</Text>
          <Text style={styles.noteText}>Floently does not replace an interactive course with copied HTML. Your course runs in the in-app browser and Read is layered around it.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020613' },
  content: { padding: 18, paddingBottom: 42, gap: 16 },
  nav: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minHeight: 40, justifyContent: 'center', paddingRight: 12 },
  backText: { color: '#DCE6FF', fontSize: 14, fontWeight: '800' },
  readBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(90,167,255,0.14)', borderWidth: 1, borderColor: 'rgba(90,167,255,0.28)' },
  readBadgeText: { color: '#5AA7FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  hero: { overflow: 'hidden', borderRadius: 30, backgroundColor: '#07152E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 24, alignItems: 'center' },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 999, backgroundColor: 'rgba(90,167,255,0.15)', top: -190, right: -100 },
  logo: { width: 180, height: 90, marginBottom: -2 },
  eyebrow: { color: '#5AA7FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.6, marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.70)', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 14, marginBottom: 22 },
  primaryButton: { width: '100%', minHeight: 54, borderRadius: 18, backgroundColor: '#4E75FF', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  primaryArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  secondaryButton: { width: '100%', minHeight: 50, marginTop: 10, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryText: { color: '#DCE6FF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  infoCard: { borderRadius: 24, backgroundColor: '#0B1730', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', padding: 20 },
  infoKicker: { color: '#5AA7FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 7 },
  infoTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 11 },
  stepNumber: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(90,167,255,0.14)' },
  stepNumberText: { color: '#5AA7FF', fontSize: 12, fontWeight: '900' },
  stepText: { flex: 1, color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  noteCard: { borderRadius: 22, padding: 18, backgroundColor: 'rgba(54,210,181,0.07)', borderWidth: 1, borderColor: 'rgba(54,210,181,0.18)' },
  noteTitle: { color: '#5BE0C6', fontSize: 15, fontWeight: '900', marginBottom: 6 },
  noteText: { color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 20 },
});
