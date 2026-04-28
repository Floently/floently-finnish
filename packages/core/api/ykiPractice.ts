import { getData, postData } from './client';

export type YkiLevelBand = 'A1-A2' | 'B1-B2' | 'C1-C2';
export type YkiPracticeFocus = 'reading' | 'listening' | 'writing' | 'speaking' | 'mixed';

export type YkiPracticeOverview = {
  level_band: string;
  display_level_band: string;
  bank_kind: string;
  total_tasks: number;
  recommendedSections: string[];
  nextFocus: YkiPracticeFocus;
  nextTask: string;
  countsBySkill: Record<'reading' | 'listening' | 'writing' | 'speaking', number>;
  dailyPractice: {
    status: string;
    focus: string;
    minutes: number;
  };
};

export type YkiPracticeTask = {
  task_id?: string;
  id?: string;
  skill: string;
  task_type: string;
  title: string;
  guidance: string;
  prompt?: string;
  question?: string;
  options?: string[];
  correct_index?: number;
  passage?: string;
  audio_script?: string;
  word_count_target?: number;
  roleplay_config?: Record<string, unknown>;
  file_path?: string | null;
};

export type YkiPracticeSession = {
  session_id: string;
  level_band: string;
  display_level_band: string;
  focus: YkiPracticeFocus;
  mode: 'guided_practice';
  bank_kind: string;
  current_task_index: number;
  isComplete: boolean;
  tasks: YkiPracticeTask[];
  task_count: number;
  decisionVersion: string;
  policyVersion: string;
  governanceVersion: string;
  session_hash: string;
  task_sequence_hash: string;
};

function normalizeLevelBand(value: YkiLevelBand | string) {
  return value.trim().toUpperCase().replace(/-/g, '_');
}

export async function getYkiPracticeOverview(levelBand: YkiLevelBand | string = 'B1-B2'): Promise<YkiPracticeOverview> {
  const query = new URLSearchParams({ level_band: String(levelBand) });
  return getData(`/api/v1/yki-practice/overview?${query.toString()}`);
}

export async function startYkiPracticeSession(levelBand: YkiLevelBand | string, focus: YkiPracticeFocus = 'mixed'): Promise<YkiPracticeSession> {
  return postData('/api/v1/yki-practice/start', {
    level_band: normalizeLevelBand(levelBand),
    focus,
  });
}

export async function getYkiPracticeSession(sessionId: string): Promise<YkiPracticeSession> {
  return getData(`/api/v1/yki-practice/${encodeURIComponent(sessionId)}`);
}
