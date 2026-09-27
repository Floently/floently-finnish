import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { GuidedSpeakingStageId } from '../features/speaking/guidedSpeakingStages';

const STORAGE_KEY = 'floently.guided-speaking.progress.v1';
const GUIDED_SPEAKING_MAX_STAGE = 300;
const GUIDED_SPEAKING_COMPLETE_SENTINEL = GUIDED_SPEAKING_MAX_STAGE + 1;
const memoryStore = new Map<string, string>();

export type GuidedSpeakingAttempt = {
  stageId: GuidedSpeakingStageId;
  stageVersion: number;
  completedAt: string;
};

type PersistedProgress = {
  /**
   * 1..300 points at the current frontier. 301 means all 300 stages have
   * been passed. Keeping the completion sentinel lets History expose Stage
   * 300 after the curriculum is complete without inventing a Stage 301.
   */
  highestUnlockedNumber: number;
  currentStageNumber: number;
  attempts: GuidedSpeakingAttempt[];
};

type GuidedSpeakingProgressState = PersistedProgress & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  openStage: (stageNumber: number) => Promise<void>;
  resumeFrontier: () => Promise<void>;
  completeStage: (stageId: GuidedSpeakingStageId, stageVersion: number, stageNumber: number) => Promise<void>;
  reset: () => Promise<void>;
};

const DEFAULTS: PersistedProgress = {
  highestUnlockedNumber: 1,
  currentStageNumber: 1,
  attempts: [],
};

function normalize(raw: Partial<PersistedProgress>): PersistedProgress {
  const highest = Math.min(
    GUIDED_SPEAKING_COMPLETE_SENTINEL,
    Math.max(1, Number.isFinite(raw.highestUnlockedNumber) ? Number(raw.highestUnlockedNumber) : 1),
  );
  const current = Math.min(
    GUIDED_SPEAKING_MAX_STAGE,
    highest,
    Math.max(1, Number.isFinite(raw.currentStageNumber) ? Number(raw.currentStageNumber) : Math.min(highest, GUIDED_SPEAKING_MAX_STAGE)),
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

  async openStage(stageNumber) {
    const state = get();
    if (stageNumber < 1 || stageNumber >= state.highestUnlockedNumber || stageNumber > GUIDED_SPEAKING_MAX_STAGE) return;
    // History exposes passed stages only. The current/future frontier is not opened through review navigation.
    // Reviewing Stage 20 while Stage 40 is unlocked changes only the viewed stage.
    // It never reduces highestUnlockedNumber.
    const next: PersistedProgress = {
      highestUnlockedNumber: state.highestUnlockedNumber,
      currentStageNumber: stageNumber,
      attempts: state.attempts,
    };
    await writeStorage(next);
    set(next);
  },

  async resumeFrontier() {
    const state = get();
    const next: PersistedProgress = {
      highestUnlockedNumber: state.highestUnlockedNumber,
      currentStageNumber: Math.min(GUIDED_SPEAKING_MAX_STAGE, state.highestUnlockedNumber),
      attempts: state.attempts,
    };
    await writeStorage(next);
    set(next);
  },

  async completeStage(stageId, stageVersion, stageNumber) {
    const state = get();
    const safeStageNumber = Math.min(GUIDED_SPEAKING_MAX_STAGE, Math.max(1, stageNumber));
    const frontierNumber = Math.min(GUIDED_SPEAKING_MAX_STAGE, state.highestUnlockedNumber);
    const isFrontierAttempt = safeStageNumber >= frontierNumber;
    const nextHighest = isFrontierAttempt
      ? Math.min(
          GUIDED_SPEAKING_COMPLETE_SENTINEL,
          Math.max(state.highestUnlockedNumber, safeStageNumber + 1),
        )
      : state.highestUnlockedNumber;
    const next: PersistedProgress = {
      highestUnlockedNumber: nextHighest,
      currentStageNumber: isFrontierAttempt
        ? Math.min(GUIDED_SPEAKING_MAX_STAGE, safeStageNumber + 1)
        : safeStageNumber,
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
