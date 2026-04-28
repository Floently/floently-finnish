import { getData, postData } from './client';

export type LearningLoopStep = 'Diagnose' | 'Learn' | 'Retrieve' | 'Produce' | 'Correct' | 'Schedule' | 'Review';
export type DailyFocusBlock = { day_label: string; minutes: number; section: string; activity: string; why: string };
export type ReadinessSummary = { overall_score: number; band: 'not_ready' | 'developing' | 'nearly_ready' | 'exam_ready'; strengths: string[]; risks: string[]; countdown_days: number | null; next_focus: string[] };
export type WeeklyStudyPlan = { readiness: ReadinessSummary; weekly_minutes: number; focus_blocks: DailyFocusBlock[]; checkpoint_tasks: string[] };
export type ConfidenceInsight = { area: string; knowledge_score: number; confidence_score: number; band: 'fragile' | 'uneven' | 'solid' | 'confident'; interpretation: string; action: string };
export type ConfidenceTrackerState = { overall_band: 'fragile' | 'uneven' | 'solid' | 'confident'; insights: ConfidenceInsight[]; notes: string[] };
export type PhraseEntry = { phrase: string; meaning: string; category: string; context: string; status: string; reuse_count?: number };
export type PhraseBankState = { active_phrases: PhraseEntry[]; review_queue?: PhraseEntry[]; suggested_prompts?: string[]; coaching_notes?: string[] };
export type RevisionQueueItem = { entry_id?: string; priority_score?: number; bucket: 'urgent' | 'soon' | 'light' | string; repair_action?: string; section?: string; prompt?: string; explanation?: string };
export type RevisionVaultState = { queue: RevisionQueueItem[]; principles: string[] };
export type LearningSystemState = { readiness: ReadinessSummary; weeklyPlan: WeeklyStudyPlan; todayAction: string; learningLoop: LearningLoopStep[] };

export type SavePhraseInput = {
  finnish: string;
  english: string;
  context: string;
  tags: string[];
};

export async function getLearningSystem(): Promise<LearningSystemState> {
  return getData('/api/v1/learning/system');
}

export async function getYkiPlanner(): Promise<WeeklyStudyPlan> {
  return getData('/api/v1/learning/planner');
}

export async function getConfidenceTracker(): Promise<ConfidenceTrackerState> {
  return getData('/api/v1/learning/confidence');
}

export async function getPhraseBank(): Promise<PhraseBankState> {
  return getData('/api/v1/learning/phrase-bank');
}

export async function savePhraseToBank(input: SavePhraseInput): Promise<unknown> {
  return postData('/api/v1/learning/phrase-bank', input);
}

export async function getRevisionVault(): Promise<RevisionVaultState> {
  return getData('/api/v1/learning/revision-vault');
}
