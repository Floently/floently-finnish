import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGO = require('../../components/public/logo.png');

type ProductCardProps = {
  accent: string;
  badge: string;
  body: string;
  bullets: string[];
  cta: string;
  onPress: () => void;
  title: string;
};

function ProductCard({ accent, badge, body, bullets, cta, onPress, title }: ProductCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.cardGlow, { backgroundColor: accent }]} />
      <View style={styles.cardTop}>
        <View style={[styles.productDot, { backgroundColor: accent }]} />
        <Text style={[styles.badge, { color: accent }]}>{badge}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
      <View style={styles.bulletWrap}>
        {bullets.map((bullet) => (
          <View key={bullet} style={styles.bulletRow}>
            <Text style={[styles.bulletMark, { color: accent }]}>•</Text>
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.ctaText, { color: accent }]}>{cta}</Text>
        <Text style={[styles.ctaArrow, { color: accent }]}>→</Text>
      </View>
    </Pressable>
  );
}

export default function SuiteLandingScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroOrbOne} />
          <View style={styles.heroOrbTwo} />
          <Image source={LOGO} resizeMode="contain" style={styles.logo} accessibilityLabel="Floently" />
          <Text style={styles.kicker}>LEARN · READ · CREATE</Text>
          <Text style={styles.title}>Choose your Floently product</Text>
          <Text style={styles.subtitle}>
            Learn for Finnish progress. Read for understanding. Create for turning ideas, audio, video, and text into finished digital content.
          </Text>
        </View>

        <View style={styles.cards}>
          <ProductCard
            accent="#6387FF"
            badge="LEARN"
            title="Floently Learn"
            body="A Finnish progression system for adults building YKI readiness and workplace communication confidence."
            bullets={['Prepare for YKI and workplace Finnish', 'Practice roleplay, flashcards, and placement', 'Build language confidence for Finland']}
            cta="Go to Learn"
            onPress={() => router.push('/learn-home' as never)}
          />
          <ProductCard
            accent="#5AA7FF"
            badge="READ"
            title="Floently Read"
            body="A reading and comprehension workspace for turning long-form text into clear audio, notes, and saved study material."
            bullets={['Listen to text while staying on the real website', 'Open web pages, PDFs, and direct text', 'Control reading speed and study flow']}
            cta="Go to Read"
            onPress={() => router.push('/read-home' as never)}
          />
          <ProductCard
            accent="#36D2B5"
            badge="CREATE"
            title="Floently Create"
            body="A creator workspace for turning documents, ideas, audio, and video into finished digital content."
            bullets={['Repurpose one source into multiple formats', 'Build reusable creator and business assets', 'Save output packs for publishing']}
            cta="Open Create"
            onPress={() => router.push('/create-home' as never)}
          />
        </View>

        <Text style={styles.footer}>Floently · One account, focused tools for learning, reading, and creating.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020613' },
  content: { padding: 18, paddingBottom: 42, gap: 18 },
  hero: { overflow: 'hidden', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: '#06112A', paddingHorizontal: 22, paddingVertical: 30, minHeight: 300, justifyContent: 'center' },
  heroOrbOne: { position: 'absolute', width: 280, height: 280, borderRadius: 999, right: -110, top: -120, backgroundColor: 'rgba(99,135,255,0.20)' },
  heroOrbTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 999, left: -120, bottom: -130, backgroundColor: 'rgba(54,210,181,0.12)' },
  logo: { width: 210, height: 110, alignSelf: 'center', marginBottom: 2 },
  kicker: { color: '#7EA0FF', fontSize: 11, letterSpacing: 1.8, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 34, lineHeight: 39, letterSpacing: -0.9, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 640, alignSelf: 'center', marginTop: 14 },
  cards: { gap: 14 },
  card: { minHeight: 250, overflow: 'hidden', borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: '#0B1730', padding: 22 },
  cardPressed: { transform: [{ scale: 0.992 }], opacity: 0.94 },
  cardGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 999, opacity: 0.08, right: -70, top: -70 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  productDot: { width: 8, height: 8, borderRadius: 999 },
  badge: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  cardTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginBottom: 8 },
  cardBody: { color: 'rgba(255,255,255,0.70)', fontSize: 14, lineHeight: 21, marginBottom: 14 },
  bulletWrap: { gap: 6, marginBottom: 18 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletMark: { fontSize: 17, lineHeight: 20, fontWeight: '900' },
  bulletText: { flex: 1, color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  cardFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7 },
  ctaText: { fontSize: 14, fontWeight: '900' },
  ctaArrow: { fontSize: 19, fontWeight: '900' },
  footer: { color: 'rgba(255,255,255,0.44)', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 18, paddingTop: 4 },
});
