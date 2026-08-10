/**
 * AuthScreen — canonical email/password + Google sign-in flow.
 *
 * Replaces the previously corrupted AuthScreen.tsx (which exported
 * WelcomeScreen and contained no auth form). Provides the email/password
 * flow promised by the auth-collapse shipment plus the missing Google
 * sign-in integration.
 *
 * Design:
 *   • Segmented control top — Sign in / Create account
 *   • Email + password inputs with inline validation
 *   • Forgot password link beneath sign-in mode
 *   • Google sign-in button beneath the form, separator above it
 *   • All errors surfaced inline (not modal alerts) so users can fix and retry
 *   • Loading states on every async action
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { spacing } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { getApiBaseUrl } from '@core/api/apiConfig';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useAuthStore } from '../../../state/authStore';
import { authService, type StoredAuthSession } from '@core/api/auth';
import { useGoogleSignIn } from '../services/useGoogleSignIn';
import { getLoginEmail, saveLoginEmail } from '../../../services/authStorage';
import { useTranslator } from '../../i18n';

const KIELIVALMIS_MARK = require('../../../../kielivalmis-domain-static/r4m/assets/kielivalmis-mark.png');

type AuthTab = 'signin' | 'create';

type Props = {
  initialTab?: AuthTab;
};

const GOOGLE_BUTTONS = {
  web: {
    signin: require('../../../components/public/google/web/signin.png'),
    signup: require('../../../components/public/google/web/signup.png'),
  },
  ios: {
    signin: require('../../../components/public/google/iOS/signin.png'),
    signup: require('../../../components/public/google/iOS/signup.png'),
  },
  android: {
    signin: require('../../../components/public/google/android/signin.png'),
    signup: require('../../../components/public/google/android/signup.png'),
  },
} as const;

function getGoogleButtonSource(tab: AuthTab) {
  if (Platform.OS === 'ios') {
    return GOOGLE_BUTTONS.ios[tab === 'create' ? 'signup' : tab];
  }
  if (Platform.OS === 'web') {
    return GOOGLE_BUTTONS.web[tab === 'create' ? 'signup' : tab];
  }
  return GOOGLE_BUTTONS.android[tab === 'create' ? 'signup' : tab];
}

export default function AuthScreen({ initialTab = 'signin' }: Props) {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslator();

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const google = useGoogleSignIn();
  const logoFloat = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();

  const returnToPath = useMemo(() => {
    const raw = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
    const value = String(raw ?? '').trim();
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('://')) {
      return '/';
    }
    return value;
  }, [params.returnTo]);

  const googleLoading = google.state.status === 'launching' || google.state.status === 'configuring';
  const googleErrorMessage =
    google.state.status === 'failed' ? google.state.error
    : google.state.status === 'unavailable' ? google.state.reason
    : null;

  const onSwitchTab = useCallback((next: AuthTab) => {
    setTab(next);
    setFormError(null);
  }, []);

  const isLocalApi = /(^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$)/.test(getApiBaseUrl());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rememberedEmail = await getLoginEmail();
      if (cancelled || !rememberedEmail) {
        return;
      }
      setEmail((current) => current || rememberedEmail);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void saveLoginEmail(email);
  }, [email]);

  useEffect(() => {
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    logoLoop.start();
    return () => {
      logoLoop.stop();
    };
  }, [logoFloat]);

  const validateEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    if (!validateEmail(email)) {
      setFormError(t('authInvalidEmail'));
      return;
    }
    if (tab === 'create' && password.length < 8) {
      setFormError(t('authShortPassword'));
      return;
    }
    setSubmitting(true);
    try {
      let session: StoredAuthSession;
      if (tab === 'signin') {
        session = await authService.login(email.trim(), password);
      } else {
        session = await authService.register({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        });
      }
      await setAuth(session.user, session.token);
      void saveLoginEmail(email.trim());
      router.replace(returnToPath as never);
    } catch (err) {
      if (tab === 'signin' && isLocalApi) {
        try {
          const fallbackSession = await authService.register({
            email: email.trim(),
            password,
            name: name.trim() || undefined,
          });
          await setAuth(fallbackSession.user, fallbackSession.token);
          void saveLoginEmail(email.trim());
          router.replace(returnToPath as never);
          return;
        } catch {
          // Fall through to the original error below.
        }
      }
      const message = err instanceof Error ? err.message : t('authUnknownError');
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, name, tab, setAuth, returnToPath]);

  const handleGoogle = useCallback(async () => {
    setFormError(null);
    const session = await google.signIn();
    if (session) {
      await setAuth(session.user, session.token);
      void saveLoginEmail(session.user.email);
      router.replace(returnToPath as never);
    }
  }, [google, setAuth, returnToPath]);

  const styles = useMemo(() => buildStyles(palette, isDark), [palette, isDark]);
  const googleButtonSource = getGoogleButtonSource(tab);
  const googleButtonLabel = tab === 'signin' ? t('authSignInGoogleLabel') : t('authCreateGoogleLabel');
  const markSize = Math.min(Math.max(width * 0.14, 54), 72);
  const logoAnimatedStyle = {
    transform: [
      {
        translateY: logoFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
      {
        scale: logoFloat.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.012, 1],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Animated.View style={[styles.authBrand, logoAnimatedStyle]} accessibilityLabel="KieliValmis by Floently">
                <Animated.Image
                  source={KIELIVALMIS_MARK}
                  style={[styles.logo, { width: markSize, height: markSize * 0.94 }]}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.authBrandName}>KieliValmis</Text>
                  <Text style={styles.authBrandBy}>BY FLOENTLY</Text>
                </View>
              </Animated.View>
            </View>
            <Text style={styles.eyebrow}>{t('authEyebrow')}</Text>
            <Text style={styles.title}>{tab === 'signin' ? t('authSignInTitle') : t('authCreateTitle')}</Text>
            <Text style={styles.subtitle}>
              {tab === 'signin'
                ? t('authSignInSubtitle')
                : t('authCreateSubtitle')}
            </Text>
          </View>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => onSwitchTab('signin')}
              style={[styles.tab, tab === 'signin' && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'signin' }}
            >
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>{t('authSwitchSignIn')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onSwitchTab('create')}
              style={[styles.tab, tab === 'create' && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'create' }}
            >
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>{t('authSwitchCreate')}</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            {tab === 'create' ? (
              <View style={styles.field}>
                <Text style={styles.label}>{t('authNameOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('authNamePlaceholder')}
                  placeholderTextColor={palette.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>{t('authEmail')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('authEmailPlaceholder')}
                placeholderTextColor={palette.textMuted}
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                keyboardType="email-address"
                autoCorrect={false}
                importantForAutofill="yes"
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('authPassword')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('authPasswordPlaceholder')}
                placeholderTextColor={palette.textMuted}
                secureTextEntry
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                textContentType={tab === 'signin' ? 'password' : 'newPassword'}
                importantForAutofill="yes"
                editable={!submitting}
              />
            </View>

            {formError ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.primaryBtn, submitting && styles.btnDisabled]}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{tab === 'signin' ? t('authSignIn') : t('authCreateAccount')}</Text>
              )}
            </Pressable>

            {tab === 'signin' ? (
              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={styles.linkRow}
                accessibilityRole="link"
              >
                <Text style={styles.linkText}>{t('authForgotPassword')}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <Pressable
            onPress={handleGoogle}
            disabled={googleLoading || submitting}
            style={[styles.googleBtn, (googleLoading || submitting) && styles.btnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={googleButtonLabel}
          >
            {googleLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <Animated.Image
                source={googleButtonSource}
                style={styles.googleButtonImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            )}
          </Pressable>

          {googleErrorMessage ? (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{googleErrorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.terms}>
            {t('authTerms')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function buildStyles(palette: ReturnType<typeof getFloentlyPalette>, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    scroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md, flexGrow: 1 },
    header: { gap: 6, marginBottom: spacing.sm },
    logoRow: { alignItems: 'center', marginBottom: 7 },
    authBrand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    logo: { alignSelf: 'center' },
    authBrandName: { color: palette.text, fontSize: 18, lineHeight: 20, fontWeight: '800', letterSpacing: -0.35 },
    authBrandBy: { marginTop: 4, color: palette.primary, fontSize: 7, lineHeight: 9, fontWeight: '900', letterSpacing: 1.3 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.6,
      color: palette.primary,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: palette.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.textMuted,
    },
    tabs: {
      flexDirection: 'row',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: isDark ? palette.surface : palette.surfaceMuted,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      minHeight: 40,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: isDark ? palette.surfaceRaised : '#FFFFFF',
    },
    tabText: { fontSize: 14, fontWeight: '700', color: palette.textMuted },
    tabTextActive: { color: palette.text },
    form: { gap: spacing.sm },
    field: { gap: 6 },
    label: { fontSize: 12, fontWeight: '700', color: palette.textSoft, letterSpacing: 0.3 },
    input: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 14,
      fontSize: 16,
      color: palette.text,
      backgroundColor: isDark ? palette.surface : '#FFFFFF',
    },
    errorBox: {
      borderRadius: 10,
      backgroundColor: '#FFE5E5',
      borderWidth: 1,
      borderColor: '#FFB3B3',
      padding: 12,
    },
    errorText: { fontSize: 13, color: '#A02020', lineHeight: 19 },
    primaryBtn: {
      minHeight: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.primary,
      marginTop: 4,
    },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    btnDisabled: { opacity: 0.6 },
    linkRow: { alignSelf: 'center', paddingVertical: 6 },
    linkText: { fontSize: 13, fontWeight: '600', color: palette.primary },
    separator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
    separatorLine: { flex: 1, height: 1, backgroundColor: palette.border },
    separatorText: { fontSize: 11, fontWeight: '700', color: palette.textMuted, letterSpacing: 1 },
    googleBtn: {
      minHeight: 50,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: 'transparent',
      justifyContent: 'center',
    },
    googleButtonImage: { width: '100%', height: 50 },
    terms: {
      fontSize: 11,
      lineHeight: 16,
      color: palette.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
}
