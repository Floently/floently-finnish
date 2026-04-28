import AsyncStorage from '@react-native-async-storage/async-storage';
import { startYkiExamSession, type StartedExamSession } from '@core/api/ykiExam';

const YKI_EXAM_SESSION_KEY = 'floently:yki_exam_session_id';

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

export async function startExamSession(levelBand = 'B1-B2'): Promise<StartedExamSession> {
  await setStorageItem('floently:yki_exam_level_band', levelBand);
  const data = await startYkiExamSession(levelBand);
  const sessionId = data.session_id ?? data.id ?? null;

  if (sessionId) {
    await setStorageItem(YKI_EXAM_SESSION_KEY, sessionId);
  }

  return data;
}

export async function getStoredExamSessionId(): Promise<string | null> {
  return getStorageItem(YKI_EXAM_SESSION_KEY);
}

export async function clearExamSession(): Promise<void> {
  await setStorageItem(YKI_EXAM_SESSION_KEY, null);
}
