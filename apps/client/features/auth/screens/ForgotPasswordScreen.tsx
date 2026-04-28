import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { requestPasswordReset } from '@core/api/auth';

const T = {
  bg: '#050811',
  surface: '#0A0F1C',
  border: '#182235',
  borderFocus: '#4F7FFF',
  text: '#F3F7FF',
  muted: '#95A7C6',
  soft: '#5D7092',
  primary: '#4F7FFF',
  primarySoft: 'rgba(79,127,255,0.14)',
  success: '#3EC58A',
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  async function onSubmit() {
    setError(null);
    setNotice(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(trimmed);
      setNotice(result.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to process request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>Enter your email and we’ll send reset instructions.</Text>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError(null);
              setNotice(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@email.com"
            placeholderTextColor={T.soft}
            style={[styles.input, focused && styles.inputFocused]}
          />

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={() => void onSubmit()} disabled={submitting} style={styles.primaryBtn}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Send reset instructions</Text>}
          </Pressable>

          <Pressable onPress={() => router.replace('/auth/login' as never)} style={styles.linkBtn}>
            <Text style={styles.linkText}>Back to sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  title: { color: T.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: T.muted, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    color: T.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: T.borderFocus,
    shadowColor: T.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  notice: { color: T.success, fontSize: 13, lineHeight: 18 },
  error: { color: '#FF6B6B', fontSize: 13, lineHeight: 18 },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: T.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  linkBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.primarySoft,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: { color: T.text, fontWeight: '600' },
});
