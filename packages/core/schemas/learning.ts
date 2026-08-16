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

/**
 * Wave-1 cross-feature learning contracts.
 *
 * These types deliberately stay runtime-neutral so Practice, Reading, Writing,
 * Professional Missions and learner-evidence services can evolve in parallel.
 * Shared-contract changes are owned by Agent A during Wave 1.
 */

export const LEARNING_CONTRACT_VERSION = 'learning.v1' as const;

export type LearningPathway = 'everyday' | 'professional' | 'yki';

export type LearningSkill =
  | 'vocabulary'
  | 'grammar'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing';

export type LearningRuntime =
  | 'cards'
  | 'roleplay'
  | 'reading'
  | 'writing'
  | 'listening'
  | 'yki'
  | 'professional_mission'
  | 'grammar';

export type TaskHealth = 'available' | 'degraded' | 'unavailable';

export type YkiTaskMode = 'practice' | 'mock' | 'full_exam';

export type LearningEvidenceMode = 'learner' | 'curriculum';

export type TaskModality = {
  audio?: boolean;
  microphone?: boolean;
  keyboard?: boolean;
  visual?: boolean;
};

export type TaskLaunchTarget = {
  route: string;
  params?: Record<string, string>;
};

export type TaskDescriptor = {
  schemaVersion: typeof LEARNING_CONTRACT_VERSION;
  taskId: string;
  contentVersion: string;
  runtime: LearningRuntime;
  pathway: LearningPathway;
  skills: LearningSkill[];
  levelBand: string;
  estimatedMinutes: number;
  modality: TaskModality;
  requiredEntitlements: string[];
  launch: TaskLaunchTarget;
  health: TaskHealth;
  featureFlag?: string;
  profession?: string;
  topic?: string;
  contextId?: string;
  prerequisites?: string[];
  tags?: string[];
  ykiMode?: YkiTaskMode;
};

export type TaskCapability = {
  capabilityId: string;
  runtime: LearningRuntime;
  supportedPathways: LearningPathway[];
  supportedSkills: LearningSkill[];
  health: TaskHealth;
  featureFlag?: string;
};

export type TaskCompletion = 'completed' | 'skipped' | 'abandoned' | 'failed';

export type TaskResult = {
  schemaVersion: typeof LEARNING_CONTRACT_VERSION;
  taskId: string;
  contentVersion: string;
  attemptId: string;
  completion: TaskCompletion;
  startedAt: string;
  completedAt?: string;
  score?: number;
  maxScore?: number;
  retrySuggested?: boolean;
  metadata?: Record<string, string | number | boolean>;
};

export type LearnerEventKind =
  | 'task_started'
  | 'task_completed'
  | 'task_skipped'
  | 'task_abandoned'
  | 'answer_submitted'
  | 'answer_corrected'
  | 'retry_completed'
  | 'writing_submitted'
  | 'writing_retried'
  | 'speaking_submitted'
  | 'reading_completed'
  | 'listening_completed';

export type LearnerEvent = {
  schemaVersion: typeof LEARNING_CONTRACT_VERSION;
  eventId: string;
  learnerId: string;
  occurredAt: string;
  eventKind: LearnerEventKind;
  taskId: string;
  contentVersion: string;
  attemptId?: string;
  pathway: LearningPathway;
  runtime: LearningRuntime;
  skills: LearningSkill[];
  levelBand: string;
  profession?: string;
  contextId?: string;
  score?: number;
  maxScore?: number;
  metadata?: Record<string, string | number | boolean>;
};

export type SkillEvidence = {
  schemaVersion: typeof LEARNING_CONTRACT_VERSION;
  evidenceId: string;
  learnerId: string;
  sourceEventId: string;
  observedAt: string;
  skill: LearningSkill;
  levelBand: string;
  evidenceType: 'exposure' | 'retrieval' | 'production' | 'correction' | 'retry';
  score?: number;
  maxScore?: number;
  pathway: LearningPathway;
  profession?: string;
};

export type PracticeScope = 'all' | LearningPathway;

export type PracticeSelectionReason = {
  code: string;
  message: string;
  evidenceMode: LearningEvidenceMode;
};

export type PracticeSessionTask = {
  order: number;
  task: TaskDescriptor;
  reasons: PracticeSelectionReason[];
};

export type PracticeSessionManifest = {
  schemaVersion: typeof LEARNING_CONTRACT_VERSION;
  sessionId: string;
  learnerId: string;
  createdAt: string;
  scope: PracticeScope;
  targetMinutes: 5 | 10 | 20;
  tasks: PracticeSessionTask[];
  composerVersion: string;
};
