export type LearningLoopStage =
  | 'diagnose'
  | 'learn'
  | 'retrieve'
  | 'produce'
  | 'correct'
  | 'schedule'
  | 'review';

export type LearningUnit = {
  id: string;
  kind: string;
  level: string;
  title: string;
  summary: string;
  example: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
};
