import React, { useMemo, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { resetPasswordWithToken } from '@core/api/auth';
import { useTranslator } from '../../i18n';

const T = {
  bg: '#050811',
  surface: '#0A0F1C',
  border: '#182235',
  borderFocus: '#4F7FFF',
  text: '#F3F7FF',
  muted: '#95A7C6',
  soft: '#5D7092',
  primary: '#4F7FFF',
  success: '#3EC58A',
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : (value ?? '');
}

export default function ResetPasswordScreen() {
  const { t } = useTranslator();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const routeToken = useMemo(() => firstParam(params.token).trim(), [params.token]);
  const [tokenInput, setTokenInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setNotice(null);
    const token = (routeToken || tokenInput).trim();
    if (!token) {
      setError(t('resetPasswordMissingToken'));
      return;
    }
    if (!password || !confirmPassword) {
      setError(t('resetPasswordEnterConfirm'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await resetPasswordWithToken({ token, password, confirmPassword });
      setNotice(result.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('resetPasswordFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('resetPasswordTitle')}</Text>
          <Text style={styles.subtitle}>{t('resetPasswordSubtitle')}</Text>

          {!routeToken ? (
            <TextInput
              value={tokenInput}
              onChangeText={(value) => {
                setTokenInput(value);
                setError(null);
              }}
              placeholder={t('resetPasswordTokenPlaceholder')}
              placeholderTextColor={T.soft}
              style={styles.input}
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.tokenHint}>{t('resetPasswordTokenLoaded')}</Text>
          )}

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password-new"
            placeholder={t('resetPasswordNewPlaceholder')}
            placeholderTextColor={T.soft}
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password-new"
            placeholder={t('resetPasswordConfirmPlaceholder')}
            placeholderTextColor={T.soft}
            style={styles.input}
          />

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={() => void onSubmit()} disabled={submitting} style={styles.primaryBtn}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{t('resetPasswordSubmit')}</Text>}
          </Pressable>

          <Pressable onPress={() => router.replace('/auth/login' as never)} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('resetPasswordBackToSignIn')}</Text>
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
  tokenHint: { color: T.muted, fontSize: 13 },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    color: T.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: { color: T.text, fontWeight: '600' },
});
