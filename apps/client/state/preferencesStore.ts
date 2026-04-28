import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FloentlyThemeMode } from '@ui/theme/floentlyPalette';

const STORAGE_KEY = 'floently.learn.preferences';

type AvatarMode = 'logo' | 'initials' | 'photo';

type PreferencesState = {
  hasHydrated: boolean;
  themeMode: FloentlyThemeMode;
  speechRate: number;
  clockFormat: '12h' | '24h';
  hintsEnabled: boolean;
  profilePhotoUri: string | null;
  avatarMode: AvatarMode;
  hydrate: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: FloentlyThemeMode) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
  setClockFormat: (format: '12h' | '24h') => Promise<void>;
  setHintsEnabled: (value: boolean) => Promise<void>;
  setProfilePhotoUri: (uri: string | null) => Promise<void>;
  setAvatarMode: (mode: AvatarMode) => Promise<void>;
  resetAvatar: () => Promise<void>;
};

type PersistedPreferences = {
  themeMode: FloentlyThemeMode;
  speechRate: number;
  clockFormat: '12h' | '24h';
  hintsEnabled: boolean;
  profilePhotoUri: string | null;
  avatarMode: AvatarMode;
};

const memoryStore = new Map<string, string>();

const DEFAULTS: PersistedPreferences = {
  themeMode: 'light',
  speechRate: 1,
  clockFormat: '24h',
  hintsEnabled: true,
  profilePhotoUri: null,
  avatarMode: 'logo',
};

async function readStorage(): Promise<PersistedPreferences | null> {
  let raw: string | null = null;
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    raw = local ? local.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = memoryStore.get(STORAGE_KEY) ?? null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedPreferences>;
    return {
      themeMode: parsed.themeMode === 'dark' ? 'dark' : 'light',
      speechRate: typeof parsed.speechRate === 'number' ? parsed.speechRate : DEFAULTS.speechRate,
      clockFormat: parsed.clockFormat === '12h' ? '12h' : '24h',
      hintsEnabled: typeof parsed.hintsEnabled === 'boolean' ? parsed.hintsEnabled : DEFAULTS.hintsEnabled,
      profilePhotoUri: typeof parsed.profilePhotoUri === 'string' && parsed.profilePhotoUri.trim().length ? parsed.profilePhotoUri : null,
      avatarMode:
        parsed.avatarMode === 'initials' || parsed.avatarMode === 'photo' || parsed.avatarMode === 'logo'
          ? parsed.avatarMode
          : DEFAULTS.avatarMode,
    };
  } catch {
    return null;
  }
}

async function writeStorage(state: PersistedPreferences) {
  const serialized = JSON.stringify(state);
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    if (local) {
      local.setItem(STORAGE_KEY, serialized);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    memoryStore.set(STORAGE_KEY, serialized);
  }
}

async function updatePersisted(partial: Partial<PersistedPreferences>) {
  const current = (await readStorage()) ?? DEFAULTS;
  await writeStorage({ ...current, ...partial });
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hasHydrated: false,
  ...DEFAULTS,
  async hydrate() {
    const stored = (await readStorage()) ?? DEFAULTS;
    set({ hasHydrated: true, ...stored });
  },
  async toggleTheme() {
    const nextMode = get().themeMode === 'light' ? 'dark' : 'light';
    await updatePersisted({ themeMode: nextMode });
    set({ themeMode: nextMode });
  },
  async setTheme(mode) {
    await updatePersisted({ themeMode: mode });
    set({ themeMode: mode });
  },
  async setSpeechRate(rate) {
    await updatePersisted({ speechRate: rate });
    set({ speechRate: rate });
  },
  async setClockFormat(format) {
    await updatePersisted({ clockFormat: format });
    set({ clockFormat: format });
  },
  async setHintsEnabled(value) {
    await updatePersisted({ hintsEnabled: value });
    set({ hintsEnabled: value });
  },
  async setProfilePhotoUri(uri) {
    const nextMode: AvatarMode = uri ? 'photo' : get().avatarMode === 'photo' ? 'logo' : get().avatarMode;
    await updatePersisted({ profilePhotoUri: uri, avatarMode: nextMode });
    set({ profilePhotoUri: uri, avatarMode: nextMode });
  },
  async setAvatarMode(mode) {
    const currentUri = get().profilePhotoUri;
    const nextMode: AvatarMode = mode === 'photo' && !currentUri ? 'logo' : mode;
    await updatePersisted({ avatarMode: nextMode });
    set({ avatarMode: nextMode });
  },
  async resetAvatar() {
    await updatePersisted({ profilePhotoUri: null, avatarMode: 'logo' });
    set({ profilePhotoUri: null, avatarMode: 'logo' });
  },
}));
