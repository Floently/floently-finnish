import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FloentlyThemeMode } from '@ui/theme/floentlyPalette';
import { isAppLanguage, type AppLanguage } from '../features/i18n/languages';

const STORAGE_KEY = 'floently.learn.preferences';

type AvatarMode = 'logo' | 'initials' | 'photo';

export type SpeechRatePresetId = 'very_slow' | 'slow' | 'normal' | 'natural';

export type SpeechRatePreset = {
  id: SpeechRatePresetId;
  value: number;
};

export const SPEECH_RATE_PRESETS: SpeechRatePreset[] = [
  { id: 'very_slow', value: 0.55 },
  { id: 'slow', value: 0.7 },
  { id: 'normal', value: 0.8 },
  { id: 'natural', value: 1.15 },
];

export function normalizeSpeechRate(value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  let closest = SPEECH_RATE_PRESETS[2];
  for (const preset of SPEECH_RATE_PRESETS) {
    if (Math.abs(preset.value - numeric) < Math.abs(closest.value - numeric)) {
      closest = preset;
    }
  }
  return closest.value;
}

type PreferencesState = {
  hasHydrated: boolean;
  themeMode: FloentlyThemeMode;
  language: AppLanguage;
  speechRate: number;
  clockFormat: '12h' | '24h';
  hintsEnabled: boolean;
  profilePhotoUri: string | null;
  avatarMode: AvatarMode;
  hydrate: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: FloentlyThemeMode) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setSpeechRate: (rate: number) => Promise<void>;
  setClockFormat: (format: '12h' | '24h') => Promise<void>;
  setHintsEnabled: (value: boolean) => Promise<void>;
  setProfilePhotoUri: (uri: string | null) => Promise<void>;
  setAvatarMode: (mode: AvatarMode) => Promise<void>;
  resetAvatar: () => Promise<void>;
};

type PersistedPreferences = {
  themeMode: FloentlyThemeMode;
  language: AppLanguage;
  speechRate: number;
  clockFormat: '12h' | '24h';
  hintsEnabled: boolean;
  profilePhotoUri: string | null;
  avatarMode: AvatarMode;
};

const memoryStore = new Map<string, string>();

const DEFAULTS: PersistedPreferences = {
  themeMode: 'light',
  language: 'en',
  speechRate: 0.8,
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
      language: isAppLanguage(parsed.language) ? parsed.language : 'en',
      speechRate: normalizeSpeechRate(parsed.speechRate),
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
  async setLanguage(language) {
    await updatePersisted({ language });
    set({ language });
  },
  async setSpeechRate(rate) {
    const nextRate = normalizeSpeechRate(rate);
    await updatePersisted({ speechRate: nextRate });
    set({ speechRate: nextRate });
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
