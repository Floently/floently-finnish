import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

const FLOENTLY_ICON = require('../../../components/public/logo_background.png');
const READ_LOGO = require('../../read/mobile/assets/floently_read.png');

type ProductKey = 'learn' | 'read' | 'create';

const PRODUCTS: Array<{
  key: ProductKey;
  label: string;
  title: string;
  summary: string;
  bullets: string[];
  cta: string;
  colors: [string, string];
  glow: string;
}> = [
  {
    key: 'learn',
    label: 'Floently Learn',
    title: 'Learn',
    summary: 'A Finnish progression system for adults building YKI readiness and workplace communication confidence.',
    bullets: [
      'Prepare for YKI and workplace Finnish',
      'Practice roleplay, flashcards, and placement',
      'Build language confidence for Finland',
    ],
    cta: 'Go to Learn',
    colors: ['#06143a', '#0b1f5a'],
    glow: '#587dff',
  },
  {
    key: 'read',
    label: 'Floently Read',
    title: 'Read',
    summary: 'A reading and comprehension workspace for turning long-form text into clear audio, notes, and saved study material.',
    bullets: [
      'Listen to text in natural AI voices',
      'Import from web pages, PDFs, and direct text',
      'Control voice, speed, and reading mode',
    ],
    cta: 'Go to Read',
    colors: ['#042033', '#073b5c'],
    glow: '#3ec6ff',
  },
  {
    key: 'create',
    label: 'Floently Create',
    title: 'Create',
    summary: 'A creator operations workspace for turning documents, ideas, audio, and video into finished digital content.',
    bullets: [
      'Repurpose one source into posts, captions, scripts, and newsletters',
      'Build creator, VA, client, and business-ready output packs',
      'Save reusable project assets for delivery and publishing',
    ],
    cta: 'Go to Create',
    colors: ['#030202', '#180e07'],
    glow: '#975b25',
  },
];

function go(path: string) {
  router.push(path as never);
}

function FullScreenGradient({ children, variant = 'gateway' }: { children: React.ReactNode; variant?: 'gateway' | 'read' | 'create' }) {
  const stops = variant === 'read'
    ? ['#0b0f24', '#0f1530', '#101838']
    : variant === 'create'
      ? ['#040b1f', '#071738', '#040b1f']
      : ['#020613', '#04101f', '#02050f'];

  return (
    <View style={styles.full}>
      <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="screen-bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={stops[0]} />
            <Stop offset="0.52" stopColor={stops[1]} />
            <Stop offset="1" stopColor={stops[2]} />
          </LinearGradient>
          <RadialGradient id="screen-glow" cx="50%" cy="22%" rx="54%" ry="42%">
            <Stop offset="0" stopColor={variant === 'read' ? '#4f6bff' : '#253a83'} stopOpacity={variant === 'read' ? 0.18 : 0.34} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#screen-bg)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#screen-glow)" />
      </Svg>
      {children}
    </View>
  );
}

function ProductCard({
  product,
  onPress,
  stacked,
}: {
  product: (typeof PRODUCTS)[number];
  onPress: () => void;
  stacked: boolean;
}) {
  const create = product.key === 'create';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.productCard, stacked ? styles.productCardStacked : styles.productCardWide]}
    >
      <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`card-${product.key}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={product.colors[0]} />
            <Stop offset="1" stopColor={product.colors[1]} />
          </LinearGradient>
          <RadialGradient id={`glow-${product.key}`} cx="88%" cy="5%" rx="45%" ry="48%">
            <Stop offset="0" stopColor={product.glow} stopOpacity={create ? 0.22 : 0.28} />
            <Stop offset="1" stopColor={product.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#card-${product.key})`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#glow-${product.key})`} />
      </Svg>

      <View style={[styles.productLabel, create && styles.productLabelCreate]}>
        <Text style={[styles.productLabelText, create && styles.productLabelTextCreate]}>{product.label}</Text>
      </View>
      <Text style={styles.productTitle}>{product.title}</Text>
      <Text style={[styles.productSummary, create && styles.productSummaryCreate]}>{product.summary}</Text>
      <View style={styles.bulletList}>
        {product.bullets.map((bullet) => (
          <Text key={bullet} style={[styles.bullet, create && styles.productSummaryCreate]}>• {bullet}</Text>
        ))}
      </View>
      <View style={[styles.cardCta, create && styles.cardCtaCreate]}>
        <Text style={[styles.cardCtaText, create && styles.cardCtaTextCreate]}>{product.cta}</Text>
      </View>
    </Pressable>
  );
}

export function FloentlyGatewayScreen() {
  const { width } = useWindowDimensions();
  const stacked = width < 960;

  return (
    <FullScreenGradient>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.gatewayScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.gatewayNav}>
            <Pressable onPress={() => go('/')} style={styles.brandRow}>
              <Image source={FLOENTLY_ICON} style={styles.gatewayLogo} resizeMode="contain" />
              <Text style={[styles.gatewayBrand, width < 620 && styles.gatewayBrandCompact]}>Floently</Text>
            </Pressable>
            <View style={styles.navActions}>
              <Pressable onPress={() => go('/auth/login')} style={styles.signInPill}>
                <Text style={styles.signInPillText}>Sign In</Text>
              </Pressable>
              {width >= 620 ? (
                <Pressable onPress={() => go('/create')} style={styles.createPill}>
                  <Text style={styles.createPillText}>Open Create</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.gatewayMain}>
            <View style={styles.gatewayHero}>
              <Text style={styles.gatewayEyebrow}>Floently product gateway</Text>
              <Text style={[styles.gatewayHeading, width < 620 && styles.gatewayHeadingCompact]}>Choose your Floently product</Text>
              <Text style={[styles.gatewayLead, width < 620 && styles.gatewayLeadCompact]}>
                Learn for Finnish progress. Read for understanding. Create for turning ideas, audio, video, and text into finished digital content.
              </Text>
            </View>

            <View style={[styles.products, stacked ? styles.productsStacked : styles.productsWide]}>
              {PRODUCTS.map((product) => (
                <View key={product.key} style={stacked ? styles.productColumnStacked : styles.productColumn}>
                  <ProductCard
                    product={product}
                    stacked={stacked}
                    onPress={() => go(product.key === 'learn' ? '/learn' : product.key === 'read' ? '/read' : '/create')}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.gatewayFooter}>
            <Text style={styles.gatewayFooterText}>© 2026 Floently</Text>
            <Pressable onPress={() => go('/privacy')}><Text style={styles.gatewayFooterLink}>Privacy</Text></Pressable>
            <Pressable onPress={() => go('/terms')}><Text style={styles.gatewayFooterLink}>Terms</Text></Pressable>
            <Pressable onPress={() => go('/support')}><Text style={styles.gatewayFooterLink}>Support</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FullScreenGradient>
  );
}

export function FloentlyCreateComingSoonScreen() {
  return (
    <FullScreenGradient variant="create">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.createPageWrap}>
          <View style={styles.createPanel}>
            <Pressable style={styles.createBrand} onPress={() => go('/')}>
              <Image source={FLOENTLY_ICON} style={styles.createBrandIcon} resizeMode="contain" />
              <Text style={styles.createBrandText}>Floently</Text>
            </Pressable>

            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming soon</Text>
            </View>
            <Text style={styles.createHeading}>Floently Create</Text>
            <Text style={styles.createLead}>
              Plan, draft and improve messages, documents and longer writing with structured guidance that helps you express the right meaning clearly.
            </Text>

            <View style={styles.createActions}>
              <Pressable onPress={() => go('/learn')} style={styles.createPrimary}>
                <Text style={styles.createPrimaryText}>Explore Floently Learn</Text>
              </Pressable>
              <Pressable onPress={() => go('/')} style={styles.createSecondary}>
                <Text style={styles.createSecondaryText}>Back to Floently</Text>
              </Pressable>
            </View>

            <View style={styles.createFooter}>
              <Pressable onPress={() => go('/privacy')}><Text style={styles.createFooterLink}>Privacy</Text></Pressable>
              <Pressable onPress={() => go('/terms')}><Text style={styles.createFooterLink}>Terms</Text></Pressable>
              <Pressable onPress={() => go('/support')}><Text style={styles.createFooterLink}>Support</Text></Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </FullScreenGradient>
  );
}

const READ_IMAGES = Array.from({ length: 8 }, (_, index) =>
  `https://read.floently.com/images/new_ui/landing_page_picture_${index + 1}.png`,
);

export function FloentlyReadLandingScreen() {
  const { width } = useWindowDimensions();
  const compact = width <= 900;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((value) => (value + 1) % READ_IMAGES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const navLinks = useMemo(() => (
    <View style={styles.readNavLinks}>
      {!compact ? (
        <>
          <Pressable onPress={() => go('/learn')}><Text style={styles.readNavLink}>Floently Finnish</Text></Pressable>
          <Pressable onPress={() => go('/')}><Text style={styles.readNavLink}>Floently Home</Text></Pressable>
          <Pressable onPress={() => go('/read/auth')}><Text style={styles.readNavLink}>Sign In</Text></Pressable>
        </>
      ) : null}
      <Pressable onPress={() => go('/read/auth')} style={styles.readPrimaryButton}>
        <Text style={styles.readPrimaryButtonText}>Get Started For Free</Text>
      </Pressable>
    </View>
  ), [compact]);

  return (
    <FullScreenGradient variant="read">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.readScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.readNav}>
            <Pressable onPress={() => go('/read')} style={styles.readBrandWrap}>
              <Image source={READ_LOGO} style={[styles.readBrandLogo, compact && styles.readBrandLogoCompact]} resizeMode="contain" />
            </Pressable>
            {navLinks}
          </View>

          <View style={[styles.readHero, compact ? styles.readHeroCompact : styles.readHeroWide]}>
            <View style={styles.readHeroCopy}>
              <View style={styles.readEyebrow}><Text style={styles.readEyebrowText}>✦ AI-Powered Text to Speech</Text></View>
              <Text style={[styles.readHeroTitle, compact && styles.readHeroTitleCompact]}>
                Listen to any text, <Text style={styles.readGradientText}>anytime, anywhere</Text>
              </Text>
              <Text style={styles.readLede}>
                Effortlessly transform your text into natural-sounding audio. Read articles, books, and notes — without reading a single word.
              </Text>
              <View style={styles.readActions}>
                <Pressable onPress={() => go('/read/auth')} style={styles.readPrimaryButtonLarge}>
                  <Text style={styles.readPrimaryButtonText}>Get Started For Free →</Text>
                </Pressable>
                <Pressable onPress={() => go('/read/subscribe')} style={styles.readGhostButton}>
                  <Text style={styles.readGhostText}>View Plans</Text>
                </Pressable>
              </View>
              <View style={styles.socialRow}>
                <View style={styles.avatarRow}>
                  {['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#f472b6'].map((color, index) => (
                    <View key={color} style={[styles.avatar, { backgroundColor: color, marginLeft: index ? -8 : 0 }]} />
                  ))}
                </View>
                <Text style={styles.socialText}>Join thousands already listening</Text>
              </View>
            </View>

            <View style={[styles.carousel, compact && styles.carouselCompact]}>
              <Image source={{ uri: READ_IMAGES[active] }} style={styles.carouselImage} resizeMode="cover" />
              <View style={styles.dots}>
                {READ_IMAGES.map((_, index) => (
                  <Pressable key={index} onPress={() => setActive(index)} style={[styles.dot, index === active && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.readSection}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionHeadTitle}>Transform text into lifelike speech</Text>
              <Text style={styles.sectionHeadBody}>Everything you need to listen smarter</Text>
            </View>
            <View style={[styles.threeGrid, compact && styles.threeGridCompact]}>
              {[
                ['🎙️', 'Lifelike Voices', 'Natural-sounding AI voices that read your content like a human would.'],
                ['📄', 'Easy Import', 'Paste text, drop a URL, or upload a PDF — Floently handles the rest.'],
                ['🎚️', 'Customizable', 'Control speed, voice, and reading mode to match how you learn.'],
              ].map(([icon, title, body]) => (
                <View key={title} style={styles.featureCard}>
                  <View style={styles.featureIcon}><Text style={styles.featureIconText}>{icon}</Text></View>
                  <Text style={styles.featureTitle}>{title}</Text>
                  <Text style={styles.featureBody}>{body}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.readSection, styles.testimonialSection]}>
            <Text style={styles.testimonialHeading}>People are listening</Text>
            <View style={[styles.threeGrid, compact && styles.threeGridCompact]}>
              {[
                ['Sarah K.', 'Medical student', '“I get through twice as many research papers now. Floently is part of my daily routine.”'],
                ['Marcus T.', 'Entrepreneur', '“I listen to articles on my commute. It feels like having a personal narrator.”'],
                ['Aisha N.', 'Language learner', '“Hearing text read aloud at the right pace helps me absorb so much more.”'],
              ].map(([name, role, quote]) => (
                <View key={name} style={styles.quoteCard}>
                  <Text style={styles.stars}>★★★★★</Text>
                  <Text style={styles.quoteText}>{quote}</Text>
                  <Text style={styles.quoteName}>{name}</Text>
                  <Text style={styles.quoteRole}>{role}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.finalSection}>
            <Text style={styles.finalHeading}>Start listening today</Text>
            <Text style={styles.finalBody}>Your text. Your voice. Your pace. For free.</Text>
            <Pressable onPress={() => go('/read/auth')} style={styles.readPrimaryButtonLarge}>
              <Text style={styles.readPrimaryButtonText}>Get Started For Free →</Text>
            </Pressable>
          </View>

          <View style={styles.readFooter}>
            <Text style={styles.readFooterBrand}>Floently Read</Text>
            <Text style={styles.readFooterCopy}>© 2025 Floently · All rights reserved</Text>
            <View style={styles.readFooterLinks}>
              <Pressable onPress={() => go('/learn')}><Text style={styles.readFooterLink}>Floently Finnish</Text></Pressable>
              <Pressable onPress={() => go('/read/subscribe')}><Text style={styles.readFooterLink}>Pricing</Text></Pressable>
              <Pressable onPress={() => go('/read/auth')}><Text style={styles.readFooterLink}>Sign In</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FullScreenGradient>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  safe: { flex: 1 },
  gatewayScroll: { flexGrow: 1, paddingBottom: 34 },
  gatewayNav: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 10,
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  gatewayLogo: { width: 46, height: 46 },
  gatewayBrand: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -1.4 },
  gatewayBrandCompact: { fontSize: 30 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signInPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  signInPillText: { color: 'rgba(255,255,255,0.84)', fontSize: 14, fontWeight: '800' },
  createPill: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#c17a35',
    borderWidth: 1,
    borderColor: 'rgba(255,216,168,0.32)',
  },
  createPillText: { color: '#120905', fontSize: 14, fontWeight: '900' },
  gatewayMain: { paddingHorizontal: 20, paddingTop: 18, gap: 42 },
  gatewayHero: { maxWidth: 870, alignSelf: 'center', alignItems: 'center' },
  gatewayEyebrow: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  gatewayHeading: {
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -2.4,
    textAlign: 'center',
    marginBottom: 18,
  },
  gatewayHeadingCompact: { fontSize: 40, lineHeight: 42, letterSpacing: -1.7 },
  gatewayLead: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'center',
    maxWidth: 820,
  },
  gatewayLeadCompact: { fontSize: 16, lineHeight: 26 },
  products: { width: '100%', maxWidth: 1340, alignSelf: 'center', gap: 22 },
  productsWide: { flexDirection: 'row' },
  productsStacked: { flexDirection: 'column' },
  productColumn: { flex: 1 },
  productColumnStacked: { width: '100%' },
  productCard: {
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 34,
    position: 'relative',
  },
  productCardWide: { minHeight: 390 },
  productCardStacked: { minHeight: 0 },
  productLabel: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  productLabelCreate: {
    backgroundColor: 'rgba(167,98,39,0.16)',
    borderColor: 'rgba(201,144,72,0.34)',
  },
  productLabelText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  productLabelTextCreate: { color: '#e0b47b' },
  productTitle: { color: '#FFFFFF', fontSize: 42, fontWeight: '900', letterSpacing: -1.7, marginTop: 20, marginBottom: 14 },
  productSummary: { color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 26, marginBottom: 22 },
  productSummaryCreate: { color: 'rgba(239,222,201,0.80)' },
  bulletList: { gap: 9, marginBottom: 24 },
  bullet: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20 },
  cardCta: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  cardCtaCreate: { backgroundColor: '#c17a35', borderColor: 'rgba(255,216,168,0.38)' },
  cardCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  cardCtaTextCreate: { color: '#120905' },
  gatewayFooter: {
    paddingTop: 30,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  gatewayFooterText: { color: 'rgba(255,255,255,0.36)', fontSize: 12 },
  gatewayFooterLink: { color: 'rgba(255,255,255,0.42)', fontSize: 12, textDecorationLine: 'underline' },

  createPageWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  createPanel: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 30,
    padding: 30,
    backgroundColor: 'rgba(7,23,56,0.78)',
  },
  createBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  createBrandIcon: { width: 46, height: 46 },
  createBrandText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    marginTop: 50,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: 'rgba(239,200,108,0.13)',
  },
  comingSoonText: { color: '#efc86c', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  createHeading: { color: '#f7f9ff', fontSize: 52, lineHeight: 55, letterSpacing: -2.3, fontWeight: '900', marginTop: 18, marginBottom: 18 },
  createLead: { color: '#c6d4ef', fontSize: 20, lineHeight: 32 },
  createActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 },
  createPrimary: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#527eff' },
  createPrimaryText: { color: '#FFFFFF', fontWeight: '900' },
  createSecondary: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  createSecondaryText: { color: '#FFFFFF', fontWeight: '900' },
  createFooter: { marginTop: 46, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  createFooterLink: { color: '#9eb1d3' },

  readScroll: { flexGrow: 1, paddingBottom: 0 },
  readNav: {
    minHeight: 96,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  readBrandWrap: { minHeight: 64, justifyContent: 'center' },
  readBrandLogo: { width: 300, height: 112 },
  readBrandLogoCompact: { width: 180, height: 78 },
  readNavLinks: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readNavLink: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 8 },
  readPrimaryButton: { borderRadius: 999, paddingHorizontal: 17, paddingVertical: 11, backgroundColor: '#685fff' },
  readPrimaryButtonLarge: {
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#685fff',
    shadowColor: '#4f6bff',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  readPrimaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  readHero: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 70, gap: 40 },
  readHeroWide: { flexDirection: 'row', alignItems: 'center' },
  readHeroCompact: { flexDirection: 'column' },
  readHeroCopy: { flex: 1, gap: 24 },
  readEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(79,107,255,0.15)',
    borderColor: 'rgba(79,107,255,0.30)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  readEyebrowText: { color: '#8fa8ff', fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  readHeroTitle: { color: '#FFFFFF', fontSize: 54, lineHeight: 59, fontWeight: '900', letterSpacing: -1.6 },
  readHeroTitleCompact: { fontSize: 36, lineHeight: 42 },
  readGradientText: { color: '#b07fff' },
  readLede: { color: 'rgba(255,255,255,0.58)', fontSize: 18, lineHeight: 31, maxWidth: 480 },
  readActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  readGhostButton: {
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  readGhostText: { color: 'rgba(255,255,255,0.80)', fontSize: 15, fontWeight: '700' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#0f1530' },
  socialText: { color: 'rgba(255,255,255,0.50)', fontSize: 13 },
  carousel: {
    flex: 1,
    height: 480,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111830',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  carouselCompact: { width: '100%', flex: 0, height: 390 },
  carouselImage: { width: '100%', height: '100%' },
  dots: { position: 'absolute', left: 0, right: 0, bottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 24, backgroundColor: '#FFFFFF' },
  readSection: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 90 },
  sectionHead: { alignItems: 'center', marginBottom: 42 },
  sectionHeadTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center', marginBottom: 12 },
  sectionHeadBody: { color: 'rgba(255,255,255,0.45)', fontSize: 16, textAlign: 'center' },
  threeGrid: { flexDirection: 'row', gap: 16 },
  threeGridCompact: { flexDirection: 'column' },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  featureIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79,107,255,0.15)', marginBottom: 16 },
  featureIconText: { fontSize: 22 },
  featureTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  featureBody: { color: 'rgba(255,255,255,0.50)', fontSize: 14, lineHeight: 23 },
  testimonialSection: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 70 },
  testimonialHeading: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 40 },
  quoteCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 24,
  },
  stars: { color: '#f59e0b', fontSize: 13, letterSpacing: 2, marginBottom: 16 },
  quoteText: { color: 'rgba(255,255,255,0.70)', fontSize: 14, lineHeight: 24, fontStyle: 'italic', marginBottom: 16 },
  quoteName: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  quoteRole: { color: 'rgba(255,255,255,0.40)', fontSize: 12, marginTop: 2 },
  finalSection: { alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 20, paddingTop: 70, paddingBottom: 90 },
  finalHeading: { color: '#FFFFFF', fontSize: 38, lineHeight: 44, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginBottom: 16 },
  finalBody: { color: 'rgba(255,255,255,0.50)', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  readFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  readFooterBrand: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  readFooterCopy: { color: 'rgba(255,255,255,0.28)', fontSize: 13 },
  readFooterLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  readFooterLink: { color: 'rgba(255,255,255,0.40)', fontSize: 13 },
});
