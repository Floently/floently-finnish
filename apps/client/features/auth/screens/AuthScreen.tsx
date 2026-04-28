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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { spacing } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { getApiBaseUrl } from '@core/api/apiConfig';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useAuthStore } from '../../../state/authStore';
import { authService, type StoredAuthSession } from '@core/api/auth';
import { useGoogleSignIn } from '../services/useGoogleSignIn';
import { getLoginEmail, saveLoginEmail } from '../../../services/authStorage';

type AuthTab = 'signin' | 'create';

type Props = {
  initialTab?: AuthTab;
};

export default function AuthScreen({ initialTab = 'signin' }: Props) {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const google = useGoogleSignIn();

  // Translate the union state into a flat boolean for UI loading.
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

  const validateEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    if (!validateEmail(email)) {
      setFormError('Anna kelvollinen sähköpostiosoite.');
      return;
    }
    if (password.length < 8) {
      setFormError('Salasanan on oltava vähintään 8 merkkiä.');
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
      router.replace('/');
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
          router.replace('/');
          return;
        } catch {
          // Fall through to the original error below.
        }
      }
      const message = err instanceof Error ? err.message : 'Tuntematon virhe. Yritä uudelleen.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, name, tab, setAuth]);

  const handleGoogle = useCallback(async () => {
    setFormError(null);
    const session = await google.signIn();
    if (session) {
      await setAuth(session.user, session.token);
      void saveLoginEmail(session.user.email);
      router.replace('/');
    }
    // If signIn returns null, useGoogleSignIn has already populated its state
    // with the appropriate cancelled/failed/unavailable status. We surface
    // failure messages via googleErrorMessage above, not as form errors.
  }, [google, setAuth]);

  const styles = useMemo(() => buildStyles(palette, isDark), [palette, isDark]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>FLOENTLY</Text>
            <Text style={styles.title}>{tab === 'signin' ? 'Tervetuloa takaisin' : 'Luo tili'}</Text>
            <Text style={styles.subtitle}>
              {tab === 'signin'
                ? 'Kirjaudu sisään jatkaaksesi YKI- ja työpaikan suomen harjoittelua.'
                : 'Aloita YKI- ja työpaikan suomen harjoittelu Floentlyn kanssa.'}
            </Text>
          </View>

          {/* Segmented control */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => onSwitchTab('signin')}
              style={[styles.tab, tab === 'signin' && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'signin' }}
            >
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>Sign in</Text>
            </Pressable>
            <Pressable
              onPress={() => onSwitchTab('create')}
              style={[styles.tab, tab === 'create' && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'create' }}
            >
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Create account</Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {tab === 'create' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Name (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Etunimi"
                  placeholderTextColor={palette.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!submitting}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
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
                <Text style={styles.primaryBtnText}>{tab === 'signin' ? 'Sign in' : 'Create account'}</Text>
              )}
            </Pressable>

            {tab === 'signin' ? (
              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={styles.linkRow}
                accessibilityRole="link"
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            ) : null}
          </View>

          {/* OR separator */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Google Sign-In */}
          <Pressable
            onPress={handleGoogle}
            disabled={googleLoading || submitting}
            style={[styles.googleBtn, (googleLoading || submitting) && styles.btnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            {googleLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {googleErrorMessage ? (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{googleErrorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.terms}>
            By continuing, you agree to Floently's Terms and acknowledge our Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function buildStyles(palette: ReturnType<typeof getFloentlyPalette>, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    scroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
    header: { gap: 6, marginBottom: spacing.sm },
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: isDark ? palette.surface : '#FFFFFF',
    },
    googleG: {
      fontSize: 18,
      fontWeight: '900',
      color: '#4285F4',
      // Approximation of the Google G — the official asset is a 4-color SVG.
      // For a launch-quality implementation, drop in @react-native-vector-icons
      // or an SVG component. This text fallback is acceptable pre-launch.
    },
    googleBtnText: { fontSize: 15, fontWeight: '700', color: palette.text },
    terms: {
      fontSize: 11,
      lineHeight: 16,
      color: palette.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
}
