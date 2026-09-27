import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlacementResult } from '@core/schemas/onboarding';

const STORAGE_KEY = 'floently.learn.placement';
const memoryStore = new Map<string, string>();

type PersistedPlacement = { status: 'pending' | 'completed' | 'skipped'; result: PlacementResult | null; dismissedAt: string | null };

type PlacementState = PersistedPlacement & {
  hasHydrated: boolean;
  storageKey: string;
  hydrate: (userKey?: string | null) => Promise<void>;
  complete: (result: PlacementResult) => Promise<void>;
  skip: () => Promise<void>;
  reset: () => Promise<void>;
  shouldPrompt: () => boolean;
};

const DEFAULTS: PersistedPlacement = { status: 'pending', result: null, dismissedAt: null };

function normalizeUserKey(userKey?: string | null): string | null {
  const raw = typeof userKey === 'string' ? userKey.trim().toLowerCase() : '';
  if (!raw) return null;
  return encodeURIComponent(raw);
}

function storageKeyFor(userKey?: string | null): string {
  const normalized = normalizeUserKey(userKey);
  return normalized ? `${STORAGE_KEY}.${normalized}` : STORAGE_KEY;
}

async function readRaw(key: string): Promise<string | null> {
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    return local ? local.getItem(key) : await AsyncStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function readStorage(key: string): Promise<PersistedPlacement | null> {
  const raw = await readRaw(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedPlacement>;
    return {
      status: parsed.status === 'completed' || parsed.status === 'skipped' ? parsed.status : 'pending',
      result: parsed.result ?? null,
      dismissedAt: typeof parsed.dismissedAt === 'string' ? parsed.dismissedAt : null,
    };
  } catch {
    return null;
  }
}

async function writeStorage(key: string, state: PersistedPlacement) {
  const serialized = JSON.stringify(state);
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    if (local) { local.setItem(key, serialized); return; }
    await AsyncStorage.setItem(key, serialized);
  } catch {
    memoryStore.set(key, serialized);
  }
}

async function readWithLegacyMigration(key: string): Promise<PersistedPlacement | null> {
  const direct = await readStorage(key);
  if (direct) return direct;

  if (key === STORAGE_KEY) return null;

  const legacy = await readStorage(STORAGE_KEY);
  if (legacy && legacy.status !== 'pending') {
    await writeStorage(key, legacy);
    return legacy;
  }

  return null;
}

export const usePlacementStore = create<PlacementState>((set, get) => ({
  hasHydrated: false,
  storageKey: STORAGE_KEY,
  ...DEFAULTS,

  async hydrate(userKey) {
    const nextKey = storageKeyFor(userKey);
    set({ hasHydrated: false, storageKey: nextKey });
    const stored = (await readWithLegacyMigration(nextKey)) ?? DEFAULTS;
    set({ storageKey: nextKey, hasHydrated: true, ...stored });
  },

  async complete(result) {
    const next = { status: 'completed' as const, result, dismissedAt: new Date().toISOString() };
    await writeStorage(get().storageKey || STORAGE_KEY, next);
    set(next);
  },

  async skip() {
    const next = { status: 'skipped' as const, result: null, dismissedAt: new Date().toISOString() };
    await writeStorage(get().storageKey || STORAGE_KEY, next);
    set(next);
  },

  async reset() {
    await writeStorage(get().storageKey || STORAGE_KEY, DEFAULTS);
    set({ ...DEFAULTS, hasHydrated: true });
  },

  shouldPrompt() {
    return get().status === 'pending';
  },
}));
