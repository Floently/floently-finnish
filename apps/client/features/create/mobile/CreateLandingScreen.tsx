import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const CREATE_LOGO = require('./assets/floently_create_word_logo_no_shadow.png');

function go(path: string) {
  router.push(path as never);
}

function MovingCreateAtmosphere() {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(motion, {
        toValue: 1,
        duration: 8200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [motion]);

  const lift = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -18, 0] });
  const drift = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 16, 0] });
  const scale = motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.08, 0.9] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.orbOne, { transform: [{ translateY: lift }, { scale }] }]} />
      <Animated.View style={[styles.orbTwo, { transform: [{ translateX: drift }, { scale }] }]} />
      <Animated.View style={[styles.lineGlow, { transform: [{ translateX: drift }] }]} />
    </View>
  );
}

function Nav() {
  return (
    <View style={styles.nav}>
      <Pressable accessibilityRole="button" onPress={() => go('/')} style={styles.logoButton}>
        <Image source={CREATE_LOGO} resizeMode="contain" style={styles.logo} />
      </Pressable>
      <View style={styles.navActions}>
        <Pressable accessibilityRole="button" onPress={() => go('/')} style={styles.navLink}>
          <Text style={styles.navLinkText}>Floently Home</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => go('/read')} style={styles.navLink}>
          <Text style={styles.navLinkText}>Read</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => go('/create/auth')} style={styles.navLinkPrimary}>
          <Text style={styles.navLinkPrimaryText}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProductSwitcher() {
  return (
    <View style={styles.productSwitcher}>
      <Pressable accessibilityRole="button" onPress={() => go('/read')} style={styles.productTab}>
        <View style={[styles.productDot, styles.blueDot]} />
        <Text style={styles.productTabText}>Floently Read</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => go('/create')} style={[styles.productTab, styles.productTabActive]}>
        <View style={[styles.productDot, styles.tealDot]} />
        <Text style={styles.productTabTextActive}>Floently Create</Text>
      </Pressable>
    </View>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export default function CreateLandingScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <MovingCreateAtmosphere />
      <Nav />
      <ProductSwitcher />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Floently Create</Text>
        <Text style={styles.title}>Create Studio is being prepared for the mobile app</Text>
        <Text style={styles.subtitle}>
          Create is visible in the native product suite, has its own auth entry, and opens a coming-soon studio gate after sign-in until the full creator tools are ready.
        </Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => go('/create/auth')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in to Create</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => go('/create/studio')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Open Create Studio</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.featureGrid}>
        <FeatureCard
          title="Landing before auth"
          body="Users first see the Create product landing page, then Create auth, then the studio coming-soon screen after login."
        />
        <FeatureCard
          title="Separate from Read"
          body="Create remains a separate product path from Read while sharing the same Floently account system."
        />
        <FeatureCard
          title="Native app flow"
          body="This screen is built with native React Native components for the iOS and Android app."
        />
      </View>

      <View style={styles.workflowCard}>
        <Text style={styles.eyebrow}>Create studio</Text>
        <Text style={styles.cardTitle}>Source to Outcome to Generate to Export</Text>
        <Text style={styles.body}>
          The full creator workflow stays locked behind the coming-soon studio gate until it is ready. No fake live dashboard data is shown.
        </Text>
        <View style={styles.stepRow}>
          {['Source', 'Outcome', 'Generate', 'Export'].map((step, index) => (
            <View key={step} style={[styles.stepPill, index === 0 && styles.stepPillActive]}>
              <Text style={[styles.stepText, index === 0 && styles.stepTextActive]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, backgroundColor: '#07111F', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 42, gap: 16, overflow: 'hidden' },
  orbOne: { position: 'absolute', width: 300, height: 300, borderRadius: 150, left: -120, top: 120, backgroundColor: 'rgba(56,201,168,0.16)' },
  orbTwo: { position: 'absolute', width: 250, height: 250, borderRadius: 125, right: -100, top: 20, backgroundColor: 'rgba(155,114,255,0.12)' },
  lineGlow: { position: 'absolute', width: 180, height: 1, right: 34, top: 185, backgroundColor: 'rgba(255,255,255,0.10)' },
  nav: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' },
  logoButton: { minHeight: 64, justifyContent: 'center' },
  logo: { width: 178, height: 76 },
  navActions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  navLink: { minHeight: 36, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  navLinkText: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '800' },
  navLinkPrimary: { minHeight: 36, borderRadius: 999, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#38C9A8' },
  navLinkPrimaryText: { color: '#07111F', fontSize: 12, fontWeight: '900' },
  productSwitcher: { flexDirection: 'row', gap: 8, padding: 5, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  productTab: { flex: 1, minHeight: 42, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  productTabActive: { backgroundColor: 'rgba(255,255,255,0.09)' },
  productDot: { width: 8, height: 8, borderRadius: 4 },
  blueDot: { backgroundColor: '#4F83FF' },
  tealDot: { backgroundColor: '#38C9A8' },
  productTabText: { color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: '800' },
  productTabTextActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  hero: { borderRadius: 30, padding: 22, gap: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  eyebrow: { alignSelf: 'flex-start', color: '#38C9A8', backgroundColor: 'rgba(56,201,168,0.13)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: '#FFFFFF', fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.1 },
  subtitle: { color: 'rgba(255,255,255,0.64)', fontSize: 16, lineHeight: 25 },
  actions: { gap: 10 },
  primaryButton: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#38C9A8', paddingHorizontal: 18 },
  primaryButtonText: { color: '#07111F', fontSize: 16, fontWeight: '900' },
  secondaryButton: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 18 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  featureGrid: { gap: 12 },
  featureCard: { borderRadius: 22, padding: 17, gap: 8, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  workflowCard: { borderRadius: 26, padding: 19, gap: 12, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  body: { color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 22 },
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  stepPillActive: { backgroundColor: '#38C9A8' },
  stepText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '800' },
  stepTextActive: { color: '#07111F', fontWeight: '900' },
});
