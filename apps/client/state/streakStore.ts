/**
 * Streak tracking store.
 *
 * Client-side only. Tracks a per-user practice streak (consecutive days where the user
 * completed at least one roleplay or learning session). Streak is the single highest-
 * evidence retention mechanic in consumer learning apps — see Duolingo, Babbel, Tandem
 * research. We keep the logic simple and local:
 *
 *   • First session of a new day increments the streak (if yesterday also had a session
 *     OR this is the very first session ever).
 *   • Any session later the same day does nothing to the streak.
 *   • A day skipped entirely resets the streak to 1 on the next session.
 *   • Longest streak is tracked separately so users see both "current" and "best".
 *
 * We do NOT persist this to a backend yet. When you ship server-side trial/account sync
 * later, migrate these three fields into the user record and read from there; the API
 * surface (`recordPractice()`, `useStreak()`) stays the same so consumers don't change.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'floently.practice.streak';
const memoryStore = new Map<string, string>();

type StreakData = {
  /** ISO date (YYYY-MM-DD) of the most recent practice session, or null if no sessions yet. */
  lastPracticeDate: string | null;
  /** Current consecutive-day streak. 0 if no practice ever, 1 after first session. */
  currentStreak: number;
  /** Best streak the user has ever achieved. */
  longestStreak: number;
};

type StreakState = StreakData & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  /**
   * Call on successful session completion. Returns details about what happened so the
   * UI can show "Day 3!" or "You just started a new streak!" etc.
   */
  recordPractice: () => Promise<StreakUpdateResult>;
  reset: () => Promise<void>;
};

export type StreakUpdateResult = {
  /** Current streak AFTER this update. */
  currentStreak: number;
  /** Longest streak AFTER this update. */
  longestStreak: number;
  /** What kind of change happened, for UI purposes. */
  change:
    | 'first_ever'        // very first practice session
    | 'extended'          // streak went up by 1 (new consecutive day)
    | 'same_day'          // second+ session of the same day — no change
    | 'resumed_after_gap' // at least one day was skipped; streak reset to 1
    | 'new_record';       // extended AND this is the new longest streak
};

const DEFAULTS: StreakData = {
  lastPracticeDate: null,
  currentStreak: 0,
  longestStreak: 0,
};

function todayISO(): string {
  // YYYY-MM-DD in local time. Using local time (not UTC) is deliberate: people perceive
  // streaks in their own day boundaries. UTC causes "I practiced at 11pm, why didn't it
  // count?" bug reports.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(iso1: string, iso2: string): number {
  const [y1, m1, d1] = iso1.split('-').map(Number);
  const [y2, m2, d2] = iso2.split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

async function readStorage(): Promise<StreakData | null> {
  let raw: string | null = null;
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    raw = local ? local.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = memoryStore.get(STORAGE_KEY) ?? null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StreakData>;
    return {
      lastPracticeDate: typeof parsed.lastPracticeDate === 'string' ? parsed.lastPracticeDate : null,
      currentStreak: typeof parsed.currentStreak === 'number' ? Math.max(0, parsed.currentStreak) : 0,
      longestStreak: typeof parsed.longestStreak === 'number' ? Math.max(0, parsed.longestStreak) : 0,
    };
  } catch {
    return null;
  }
}

async function writeStorage(state: StreakData): Promise<void> {
  const serialized = JSON.stringify(state);
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    if (local) { local.setItem(STORAGE_KEY, serialized); return; }
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    memoryStore.set(STORAGE_KEY, serialized);
  }
}

export const useStreakStore = create<StreakState>((set, get) => ({
  hasHydrated: false,
  ...DEFAULTS,

  async hydrate() {
    const stored = (await readStorage()) ?? DEFAULTS;
    set({ ...stored, hasHydrated: true });
  },

  async recordPractice() {
    const current = get();
    const today = todayISO();

    // Same day — no streak change, just return current state.
    if (current.lastPracticeDate === today) {
      return {
        currentStreak: current.currentStreak,
        longestStreak: current.longestStreak,
        change: 'same_day' as const,
      };
    }

    // Decide how the streak updates.
    let nextStreak: number;
    let change: StreakUpdateResult['change'];

    if (current.lastPracticeDate == null) {
      nextStreak = 1;
      change = 'first_ever';
    } else {
      const gap = daysBetween(current.lastPracticeDate, today);
      if (gap === 1) {
        nextStreak = current.currentStreak + 1;
        change = 'extended';
      } else if (gap <= 0) {
        // Clock oddity (timezone change or user changed device clock); treat as same day.
        return {
          currentStreak: current.currentStreak,
          longestStreak: current.longestStreak,
          change: 'same_day',
        };
      } else {
        // gap > 1 means at least one day was skipped.
        nextStreak = 1;
        change = 'resumed_after_gap';
      }
    }

    const nextLongest = Math.max(current.longestStreak, nextStreak);
    const beatRecord = nextStreak > current.longestStreak && change === 'extended';
    const finalChange: StreakUpdateResult['change'] = beatRecord ? 'new_record' : change;

    const next: StreakData = {
      lastPracticeDate: today,
      currentStreak: nextStreak,
      longestStreak: nextLongest,
    };
    await writeStorage(next);
    set({ ...next });

    return {
      currentStreak: nextStreak,
      longestStreak: nextLongest,
      change: finalChange,
    };
  },

  async reset() {
    await writeStorage(DEFAULTS);
    set({ ...DEFAULTS, hasHydrated: true });
  },
}));
