import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlacementResult } from '@core/schemas/onboarding';

const STORAGE_KEY = 'floently.learn.placement';
const memoryStore = new Map<string, string>();

type PersistedPlacement = { status: 'pending' | 'completed' | 'skipped'; result: PlacementResult | null; dismissedAt: string | null };

type PlacementState = PersistedPlacement & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  complete: (result: PlacementResult) => Promise<void>;
  skip: () => Promise<void>;
  reset: () => Promise<void>;
  shouldPrompt: () => boolean;
};

const DEFAULTS: PersistedPlacement = { status: 'pending', result: null, dismissedAt: null };

async function readStorage(): Promise<PersistedPlacement | null> {
  let raw: string | null = null;
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    raw = local ? local.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = memoryStore.get(STORAGE_KEY) ?? null;
  }
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
async function writeStorage(state: PersistedPlacement) {
  const serialized = JSON.stringify(state);
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    if (local) { local.setItem(STORAGE_KEY, serialized); return; }
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    memoryStore.set(STORAGE_KEY, serialized);
  }
}

export const usePlacementStore = create<PlacementState>((set, get) => ({
  hasHydrated: false,
  ...DEFAULTS,
  async hydrate() {
    const stored = (await readStorage()) ?? DEFAULTS;
    set({ hasHydrated: true, ...stored });
  },
  async complete(result) {
    const next = { status: 'completed' as const, result, dismissedAt: new Date().toISOString() };
    await writeStorage(next);
    set(next);
  },
  async skip() {
    const next = { status: 'skipped' as const, result: null, dismissedAt: new Date().toISOString() };
    await writeStorage(next);
    set(next);
  },
  async reset() {
    await writeStorage(DEFAULTS);
    set({ ...DEFAULTS, hasHydrated: true });
  },
  shouldPrompt() {
    return get().status === 'pending';
  },
}));
