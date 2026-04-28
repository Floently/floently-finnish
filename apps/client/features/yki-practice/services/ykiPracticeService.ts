import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getYkiPracticeSession,
  startYkiPracticeSession,
  type YkiLevelBand,
  type YkiPracticeFocus,
  type YkiPracticeSession,
} from '@core/api/ykiPractice';

const YKI_PRACTICE_SESSION_KEY = 'floently:yki_practice_session_id';

async function getStorageItem(key: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function setStorageItem(key: string, value: string | null) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
    return;
  }

  if (value === null) {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

function assertSessionHasTasks(session: YkiPracticeSession): YkiPracticeSession {
  if (!Array.isArray(session.tasks) || session.tasks.length === 0) {
    throw new Error('PRACTICE_SESSION_EMPTY');
  }
  return session;
}

export async function startPracticeSession(levelBand: YkiLevelBand | string, focus: YkiPracticeFocus = 'mixed'): Promise<YkiPracticeSession> {
  const result = assertSessionHasTasks(await startYkiPracticeSession(levelBand, focus));
  await setStorageItem(YKI_PRACTICE_SESSION_KEY, result.session_id);
  return result;
}

export async function resumePracticeSession(): Promise<YkiPracticeSession | null> {
  const sessionId = await getStorageItem(YKI_PRACTICE_SESSION_KEY);
  if (!sessionId) return null;
  return assertSessionHasTasks(await getYkiPracticeSession(sessionId));
}

export async function clearPracticeSession(): Promise<void> {
  await setStorageItem(YKI_PRACTICE_SESSION_KEY, null);
}
