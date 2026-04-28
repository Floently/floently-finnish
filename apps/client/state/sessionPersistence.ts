import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GuardedScreen, RequestedScreen } from "./navigationModel";

const STORAGE_VERSION = "2026-04-11.session.v2";

type PersistedLearningSession = {
  decisionVersion: string;
  governanceStatus: "governed" | "legacy_uncontrolled";
  governanceVersion: string;
  policyVersion: string;
  _version: string;
};

type PersistedNavState = {
  activeScreen: GuardedScreen;
  navigationStack: GuardedScreen[];
  requestedScreen: RequestedScreen;
  ykiSessionId: string | null;
  _version: string;
};

type PersistedYkiSession = {
  sessionId: string;
  currentTaskIndex: number;
  isComplete: boolean;
  sessionHash: string;
  taskSequenceHash: string;
  decisionVersion: string;
  policyVersion: string;
  governanceVersion: string;
  _version: string;
};

type PersistedResult<T> =
  | { status: "missing"; value?: undefined; reason?: undefined }
  | { status: "invalid"; value?: undefined; reason: "corrupted" | "outdated" }
  | { status: "valid"; value: T; reason?: undefined };

const memoryStore = new Map<string, string>();

async function getItem(key: string) {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(key);
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function setItem(key: string, value: string) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(key, value);
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function removeItem(key: string) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(key);
    return;
  }

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    memoryStore.delete(key);
  }
}

async function readJson<T>(key: string, version: string): Promise<PersistedResult<T>> {
  const raw = await getItem(key);
  if (!raw) return { status: "missing" };

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed._version !== version) {
      return { status: "invalid", reason: "outdated" };
    }
    return { status: "valid", value: parsed as T };
  } catch {
    return { status: "invalid", reason: "corrupted" };
  }
}

export async function loadPersistedLearningSession(): Promise<PersistedResult<PersistedLearningSession>> {
  return readJson<PersistedLearningSession>("floently:learning_session", STORAGE_VERSION);
}

export async function clearPersistedLearningSession(): Promise<void> {
  await removeItem("floently:learning_session");
}

export async function loadPersistedNavigationState(): Promise<PersistedResult<PersistedNavState>> {
  return readJson<PersistedNavState>("floently:nav_state", STORAGE_VERSION);
}

export async function clearPersistedNavigationState(): Promise<void> {
  await removeItem("floently:nav_state");
}

export async function clearPersistedYkiPracticeSession(): Promise<void> {
  await removeItem("floently:yki_practice_session_id");
}

export async function clearPersistedYkiExamSession(): Promise<void> {
  await removeItem("floently:yki_exam_session_id");
}

export async function persistNavigationState(state: {
  activeScreen: GuardedScreen;
  navigationStack: GuardedScreen[];
  requestedScreen: RequestedScreen;
  ykiSessionId: string | null;
}): Promise<void> {
  await setItem("floently:nav_state", JSON.stringify({ ...state, _version: STORAGE_VERSION }));
}

export async function loadPersistedYkiSession(): Promise<PersistedResult<PersistedYkiSession>> {
  return readJson<PersistedYkiSession>("floently:yki_session", STORAGE_VERSION);
}
