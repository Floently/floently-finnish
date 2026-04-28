import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'floently_session';
const AUTH_SESSION_KEY = 'auth_session_v2';
const LOGIN_EMAIL_KEY = 'floently_login_email';

async function readLocalStorage(key: string): Promise<string | null> {
  const local = (globalThis as { localStorage?: Storage }).localStorage;
  return local ? local.getItem(key) : null;
}

async function writeLocalStorage(key: string, value: string): Promise<void> {
  const local = (globalThis as { localStorage?: Storage }).localStorage;
  local?.setItem(key, value);
}

async function removeLocalStorage(key: string): Promise<void> {
  const local = (globalThis as { localStorage?: Storage }).localStorage;
  local?.removeItem(key);
}

async function writeProtectedValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await writeLocalStorage(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function readProtectedValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return readLocalStorage(key);
  }

  const secureValue = await SecureStore.getItemAsync(key);
  if (secureValue) {
    return secureValue;
  }

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue) {
    await SecureStore.setItemAsync(key, legacyValue);
    await AsyncStorage.removeItem(key);
  }
  return legacyValue;
}

async function removeProtectedValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await removeLocalStorage(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
  await AsyncStorage.removeItem(key);
}

export async function clearLegacyAuthStorage() {
  await Promise.all([
    AsyncStorage.removeItem(SESSION_KEY),
    AsyncStorage.removeItem(AUTH_SESSION_KEY),
    AsyncStorage.removeItem(LOGIN_EMAIL_KEY),
  ]);
}

export const saveSession = async (session: string) => {
  try {
    await writeProtectedValue(SESSION_KEY, session);
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSession = async (): Promise<string | null> => {
  try {
    return await readProtectedValue(SESSION_KEY);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    await removeProtectedValue(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const saveAuthSession = async (session: string) => {
  try {
    await writeProtectedValue(AUTH_SESSION_KEY, session);
  } catch (error) {
    console.error('Error saving auth session:', error);
  }
};

export const getAuthSession = async (): Promise<string | null> => {
  try {
    return await readProtectedValue(AUTH_SESSION_KEY);
  } catch (error) {
    console.error('Error getting auth session:', error);
    return null;
  }
};

export const clearAuthSession = async () => {
  try {
    await removeProtectedValue(AUTH_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing auth session:', error);
  }
};

export const saveLoginEmail = async (email: string) => {
  const normalized = email.trim();
  if (!normalized) {
    await clearLoginEmail();
    return;
  }
  try {
    await writeProtectedValue(LOGIN_EMAIL_KEY, normalized);
  } catch (error) {
    console.error('Error saving login email:', error);
  }
};

export const getLoginEmail = async (): Promise<string | null> => {
  try {
    const value = await readProtectedValue(LOGIN_EMAIL_KEY);
    return value?.trim() || null;
  } catch (error) {
    console.error('Error getting login email:', error);
    return null;
  }
};

export const clearLoginEmail = async () => {
  try {
    await removeProtectedValue(LOGIN_EMAIL_KEY);
  } catch (error) {
    console.error('Error clearing login email:', error);
  }
};
