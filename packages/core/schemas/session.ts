export type ModeId = 'learn' | 'yki_practice' | 'yki_exam' | 'professional' | 'speaking_lab';

export type ModeSummary = {
  mode: ModeId;
  title: string;
  next_action: string;
  due_count: number;
  streak_days: number;
  completion_percent: number;
};
