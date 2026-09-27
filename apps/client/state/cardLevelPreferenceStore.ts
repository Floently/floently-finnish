import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { CardLevelBand } from '../features/cards/types';

const STORAGE_KEY = 'floently.cards.level-preferences.v1';
const memoryStore = new Map<string, string>();

type PersistedCardLevelPreferences = {
  byContext: Record<string, CardLevelBand>;
};

type CardLevelPreferenceState = PersistedCardLevelPreferences & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  rememberLevel: (contextKey: string, level: CardLevelBand) => Promise<void>;
};

const DEFAULTS: PersistedCardLevelPreferences = {
  byContext: {},
};

function isCardLevelBand(value: unknown): value is CardLevelBand {
  return value === 'A1_A2' || value === 'B1_B2' || value === 'C1_C2';
}

function normalize(raw: Partial<PersistedCardLevelPreferences>): PersistedCardLevelPreferences {
  const source = raw.byContext && typeof raw.byContext === 'object' ? raw.byContext : {};
  const byContext: Record<string, CardLevelBand> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key && isCardLevelBand(value)) byContext[key] = value;
  }
  return { byContext };
}

async function readStorage(): Promise<PersistedCardLevelPreferences> {
  let raw: string | null = null;
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    raw = local ? local.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = memoryStore.get(STORAGE_KEY) ?? null;
  }
  if (!raw) return DEFAULTS;
  try {
    return normalize(JSON.parse(raw) as Partial<PersistedCardLevelPreferences>);
  } catch {
    return DEFAULTS;
  }
}

async function writeStorage(value: PersistedCardLevelPreferences): Promise<void> {
  const serialized = JSON.stringify(value);
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

export const useCardLevelPreferenceStore = create<CardLevelPreferenceState>((set, get) => ({
  ...DEFAULTS,
  hasHydrated: false,

  async hydrate() {
    const stored = await readStorage();
    set({ ...stored, hasHydrated: true });
  },

  async rememberLevel(contextKey, level) {
    const next: PersistedCardLevelPreferences = {
      byContext: {
        ...get().byContext,
        [contextKey]: level,
      },
    };
    await writeStorage(next);
    set(next);
  },
}));
