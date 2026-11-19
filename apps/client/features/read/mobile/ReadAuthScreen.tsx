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

export default function ReadAuthScreen() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState<'name' | 'email' | 'password' | null>(null);
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

  const enterReader = useCallback(() => {
    router.replace('/read/reader' as never);
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
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
      enterReader();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : mode === 'signin' ? 'Sign in failed.' : 'Account creation failed.');
    } finally {
      setBusy(false);
    }
  }, [email, enterReader, mode, name, password, setAuth]);

  const googleBusy =
    google.state.status === 'launching' || google.state.status === 'configuring';

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const session = await google.signIn();
    if (!session) return;

    await setAuth(session.user, session.token);
    await saveLoginEmail(session.user.email);
    enterReader();
  }, [enterReader, google, setAuth]);

  const switchMode = useCallback((next: AuthMode) => {
    setMode(next);
    setError(null);
    setPassword('');
    setShowPassword(false);
  }, []);

  const isSignIn = mode === 'signin';

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
        <View pointerEvents="none" style={styles.glow} />

        <View style={styles.brandBlock}>
          <Pressable onPress={() => router.push('/read' as never)} accessibilityRole="button">
            <Image source={READ_LOGO} style={styles.logo} resizeMode="contain" />
          </Pressable>
          <Text style={styles.title}>{isSignIn ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>
            {isSignIn ? 'Sign in to continue listening' : 'Create a free account to start listening'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isSignIn ? (
            <TextInput
              autoCapitalize="words"
              editable={!busy}
              onBlur={() => setFocused(null)}
              onChangeText={setName}
              onFocus={() => setFocused('name')}
              placeholder="Name"
              placeholderTextColor="rgba(255,255,255,0.36)"
              style={[styles.input, focused === 'name' && styles.inputFocused]}
              value={name}
            />
          ) : null}

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!busy}
            importantForAutofill="yes"
            keyboardType="email-address"
            onBlur={() => setFocused(null)}
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            placeholder="Email address"
            placeholderTextColor="rgba(255,255,255,0.36)"
            style={[styles.input, focused === 'email' && styles.inputFocused]}
            textContentType="username"
            value={email}
          />

          <View style={[styles.passwordRow, focused === 'password' && styles.inputFocused]}>
            <TextInput
              autoCapitalize="none"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              autoCorrect={false}
              editable={!busy}
              importantForAutofill="yes"
              onBlur={() => setFocused(null)}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onSubmitEditing={() => void submit()}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.36)"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              textContentType={isSignIn ? 'password' : 'newPassword'}
              value={password}
            />
            <Pressable
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowPassword((current) => !current)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={busy}
            onPress={() => void submit()}
            style={[styles.signInButton, busy && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInButtonText}>{isSignIn ? 'Sign In' : 'Create account'}</Text>
            )}
          </Pressable>

          {isSignIn ? (
            <Pressable onPress={() => router.push('/auth/forgot-password' as never)} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          ) : null}

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          <Pressable
            disabled={googleBusy || busy}
            onPress={() => void signInWithGoogle()}
            style={[styles.googleButton, (googleBusy || busy) && styles.disabled]}
          >
            {googleBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.googleText}>{isSignIn ? 'Sign in with Google' : 'Continue with Google'}</Text>
            )}
          </Pressable>

          {google.state.status === 'failed' || google.state.status === 'unavailable' ? (
            <View style={styles.googleNotice}>
              <Text style={styles.googleNoticeText}>
                {google.state.status === 'failed' ? google.state.error : google.state.reason}
              </Text>
            </View>
          ) : null}

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Pressable onPress={() => switchMode(isSignIn ? 'create' : 'signin')}>
              <Text style={styles.switchLink}>{isSignIn ? 'Create one free →' : 'Sign in →'}</Text>
            </Pressable>
          </View>

          {hasToken ? (
            <Pressable onPress={enterReader} style={styles.currentAccountButton}>
              <Text style={styles.currentAccountText}>Continue with current Floently account</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={() => router.push('/read' as never)} style={styles.backButton}>
            <Text style={styles.backText}>← Back to home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080B1A',
  },
  screen: {
    flexGrow: 1,
    minHeight: '100%',
    backgroundColor: '#080B1A',
    paddingBottom: 36,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    top: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(124,107,255,0.10)',
  },
  brandBlock: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    width: 174,
    height: 74,
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 16,
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 18,
  },
  inputFocused: {
    borderColor: 'rgba(124,107,255,0.50)',
    backgroundColor: 'rgba(124,107,255,0.08)',
  },
  passwordRow: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    color: '#FFFFFF',
    fontSize: 15,
    paddingLeft: 18,
    paddingRight: 8,
  },
  eyeButton: {
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  eyeText: {
    color: '#8FA8FF',
    fontSize: 12,
    fontWeight: '900',
  },
  signInButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#685FFF',
    shadowColor: '#9B6BFF',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.72,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: -4,
  },
  forgotText: {
    color: '#8FA8FF',
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  separatorText: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  googleButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    backgroundColor: 'rgba(248,113,113,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  googleNotice: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  googleNoticeText: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 14,
  },
  switchLink: {
    color: '#8FA8FF',
    fontSize: 14,
    fontWeight: '800',
  },
  currentAccountButton: {
    alignSelf: 'center',
    paddingVertical: 3,
  },
  currentAccountText: {
    color: '#8FA8FF',
    fontSize: 12,
    fontWeight: '800',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 3,
  },
  backText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 13,
  },
});
