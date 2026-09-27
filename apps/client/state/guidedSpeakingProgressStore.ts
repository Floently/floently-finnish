import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { GuidedSpeakingStageId } from '../features/speaking/guidedSpeakingStages';

const STORAGE_KEY = 'floently.guided-speaking.progress.v1';
const memoryStore = new Map<string, string>();

export type GuidedSpeakingAttempt = {
  stageId: GuidedSpeakingStageId;
  stageVersion: number;
  completedAt: string;
};

type PersistedProgress = {
  highestUnlockedNumber: number;
  currentStageNumber: number;
  attempts: GuidedSpeakingAttempt[];
};

type GuidedSpeakingProgressState = PersistedProgress & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  openStage: (stageNumber: number) => void;
  completeStage: (stageId: GuidedSpeakingStageId, stageVersion: number, stageNumber: number) => Promise<void>;
  reset: () => Promise<void>;
};

const DEFAULTS: PersistedProgress = {
  highestUnlockedNumber: 1,
  currentStageNumber: 1,
  attempts: [],
};

function normalize(raw: Partial<PersistedProgress>): PersistedProgress {
  const highest = Math.max(1, Number.isFinite(raw.highestUnlockedNumber) ? Number(raw.highestUnlockedNumber) : 1);
  const current = Math.min(
    highest,
    Math.max(1, Number.isFinite(raw.currentStageNumber) ? Number(raw.currentStageNumber) : highest),
  );
  return {
    highestUnlockedNumber: highest,
    currentStageNumber: current,
    attempts: Array.isArray(raw.attempts)
      ? raw.attempts.filter((attempt): attempt is GuidedSpeakingAttempt =>
          Boolean(
            attempt &&
            typeof attempt.stageId === 'string' &&
            typeof attempt.stageVersion === 'number' &&
            typeof attempt.completedAt === 'string',
          ),
        )
      : [],
  };
}

async function readStorage(): Promise<PersistedProgress> {
  let raw: string | null = null;
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    raw = local ? local.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = memoryStore.get(STORAGE_KEY) ?? null;
  }
  if (!raw) return DEFAULTS;
  try {
    return normalize(JSON.parse(raw) as Partial<PersistedProgress>);
  } catch {
    return DEFAULTS;
  }
}

async function writeStorage(progress: PersistedProgress): Promise<void> {
  const serialized = JSON.stringify(progress);
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

export const useGuidedSpeakingProgressStore = create<GuidedSpeakingProgressState>((set, get) => ({
  ...DEFAULTS,
  hasHydrated: false,

  async hydrate() {
    const stored = await readStorage();
    set({ ...stored, hasHydrated: true });
  },

  openStage(stageNumber) {
    const state = get();
    if (stageNumber < 1 || stageNumber >= state.highestUnlockedNumber) return;
    // History exposes passed stages only. The current/future frontier is not opened through review navigation.
    // Reviewing Stage 20 while Stage 40 is unlocked changes only the viewed stage.
    // It never reduces highestUnlockedNumber.
    set({ currentStageNumber: stageNumber });
  },

  async completeStage(stageId, stageVersion, stageNumber) {
    const state = get();
    const nextHighest = Math.max(state.highestUnlockedNumber, stageNumber + 1);
    const next: PersistedProgress = {
      highestUnlockedNumber: nextHighest,
      currentStageNumber: Math.min(stageNumber + 1, nextHighest),
      attempts: [
        ...state.attempts,
        { stageId, stageVersion, completedAt: new Date().toISOString() },
      ].slice(-500),
    };
    await writeStorage(next);
    set(next);
  },

  async reset() {
    await writeStorage(DEFAULTS);
    set({ ...DEFAULTS, hasHydrated: true });
  },
}));
