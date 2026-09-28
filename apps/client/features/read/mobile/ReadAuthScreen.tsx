import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { authService } from '@core/api/auth';
import { getAuthToken } from '@core/api/apiClient';
import { useAuthStore } from '../../../state/authStore';
import { getLoginEmail, saveLoginEmail } from '../../../services/authStorage';
import { useGoogleSignIn } from '../../auth/services/useGoogleSignIn';

const READ_LOGO = require('./assets/floently_read.png');

type AuthMode = 'signin' | 'create';

function go(path: string) {
  router.push(path as never);
}

export default function ReadAuthScreen() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const google = useGoogleSignIn();
  const hasToken = Boolean(getAuthToken());

  useEffect(() => {
    let cancelled = false;
    void getLoginEmail().then((remembered) => {
      if (!cancelled && remembered) setEmail((current) => current || remembered);
    });
    return () => { cancelled = true; };
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const session = mode === 'signin'
        ? await authService.login(normalizedEmail, password)
        : await authService.register({
            email: normalizedEmail,
            password,
            name: name.trim() || undefined,
          });
      await setAuth(session.user, session.token);
      await saveLoginEmail(normalizedEmail);
      router.replace('/read/app' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in could not be completed.');
    } finally {
      setBusy(false);
    }
  }, [email, mode, name, password, setAuth]);

  const googleBusy =
    google.state.status === 'launching' || google.state.status === 'configuring';

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const session = await google.signIn();
    if (!session) return;
    await setAuth(session.user, session.token);
    await saveLoginEmail(session.user.email);
    router.replace('/read/app' as never);
  }, [google, setAuth]);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.nav}>
          <Pressable onPress={() => go('/read')} accessibilityRole="button">
            <Image source={READ_LOGO} style={styles.logo} resizeMode="contain" />
          </Pressable>
          <View style={styles.navLinks}>
            <Pressable onPress={() => go('/')} style={styles.navButton}>
              <Text style={styles.navButtonText}>KieliValmis</Text>
            </Pressable>
            <Pressable onPress={() => go('/read')} style={styles.navButton}>
              <Text style={styles.navButtonText}>Read</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.eyebrow}>Floently Read</Text>
          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome back' : 'Create your Read account'}
          </Text>
          <Text style={styles.subtitle}>
            Sign in once and continue directly to your Read library, live browser and Reader.
          </Text>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => { setMode('signin'); setError(null); }}
              style={[styles.tab, mode === 'signin' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign in</Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('create'); setError(null); }}
              style={[styles.tab, mode === 'create' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>Create account</Text>
            </Pressable>
          </View>

          {mode === 'create' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.34)"
                autoCapitalize="words"
                editable={!busy}
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
              placeholderTextColor="rgba(255,255,255,0.34)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              importantForAutofill="yes"
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.34)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                textContentType={mode === 'signin' ? 'password' : 'newPassword'}
                importantForAutofill="yes"
                editable={!busy}
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={[styles.primaryButton, busy && styles.disabled]}
          >
            {busy
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>

          {mode === 'signin' ? (
            <Pressable onPress={() => go('/auth/forgot-password')} style={styles.linkButton}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          ) : null}

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <Pressable
            onPress={signInWithGoogle}
            disabled={googleBusy || busy}
            style={[styles.googleButton, (googleBusy || busy) && styles.disabled]}
          >
            {googleBusy
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.googleText}>Continue with Google</Text>}
          </Pressable>

          {google.state.status === 'failed' || google.state.status === 'unavailable' ? (
            <Text style={styles.googleError}>
              {google.state.status === 'failed' ? google.state.error : google.state.reason}
            </Text>
          ) : null}

          {hasToken ? (
            <Pressable onPress={() => router.replace('/read/app' as never)} style={styles.continueButton}>
              <Text style={styles.continueText}>Continue with current Floently account</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Floently Read · Your text, your voice, your pace.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070A1D' },
  screen: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 22,
    backgroundColor: '#070A1D',
    overflow: 'hidden',
  },
  glowOne: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    top: 80, left: -130, backgroundColor: 'rgba(79,107,255,0.15)',
  },
  glowTwo: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    top: 10, right: -110, backgroundColor: 'rgba(139,92,246,0.16)',
  },
  nav: {
    minHeight: 64, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  logo: { width: 150, height: 70 },
  navLinks: { flexDirection: 'row', gap: 8 },
  navButton: {
    minHeight: 36, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  navButtonText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '800' },
  authCard: {
    width: '100%', maxWidth: 540, alignSelf: 'center',
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(167,139,250,0.20)',
    backgroundColor: '#0E1532', padding: 22, gap: 14,
  },
  eyebrow: {
    alignSelf: 'flex-start', color: '#C4B5FD', fontSize: 11, fontWeight: '900',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  title: { color: '#FFFFFF', fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: 'rgba(255,255,255,0.58)', fontSize: 14, lineHeight: 21 },
  tabs: {
    flexDirection: 'row', padding: 4, gap: 4, borderRadius: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tab: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(139,92,246,0.24)' },
  tabText: { color: 'rgba(255,255,255,0.48)', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#FFFFFF' },
  field: { gap: 6 },
  label: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '800' },
  input: {
    minHeight: 50, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.055)',
    color: '#FFFFFF', paddingHorizontal: 14, fontSize: 16,
  },
  passwordRow: {
    minHeight: 50, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row', alignItems: 'center',
  },
  passwordInput: { flex: 1, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 16 },
  eyeButton: { minHeight: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  eyeText: { color: '#C4B5FD', fontSize: 12, fontWeight: '900' },
  errorBox: {
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.34)',
    backgroundColor: 'rgba(127,29,29,0.22)', padding: 11,
  },
  errorText: { color: '#FECACA', fontSize: 13, lineHeight: 18 },
  primaryButton: {
    minHeight: 52, borderRadius: 999, backgroundColor: '#8B5CF6',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.56 },
  linkButton: { alignSelf: 'center', paddingVertical: 4 },
  linkText: { color: '#C4B5FD', fontSize: 13, fontWeight: '800' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  separatorLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  separatorText: { color: 'rgba(255,255,255,0.36)', fontSize: 10, fontWeight: '800' },
  googleButton: {
    minHeight: 50, borderRadius: 999, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  googleText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  googleError: { color: '#FECACA', fontSize: 12, textAlign: 'center' },
  continueButton: { alignSelf: 'center', paddingVertical: 6 },
  continueText: { color: '#9CC7FF', fontSize: 12, fontWeight: '800' },
  footer: { color: 'rgba(255,255,255,0.32)', fontSize: 12, textAlign: 'center' },
});
