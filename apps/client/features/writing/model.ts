import type {
  LearnerEvent,
  LearningPathway,
  TaskDescriptor,
  TaskResult,
} from '@core/schemas/learning';

export type WritingPathway = Extract<LearningPathway, 'everyday' | 'professional'>;
export type WritingLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type WritingRegister = 'informal' | 'neutral' | 'formal' | 'professional_neutral';
export type WritingFeedbackArea = 'communicative_goal' | 'content' | 'organization' | 'language' | 'register';
export type WritingStage = 'understand' | 'plan' | 'write' | 'feedback' | 'revise' | 'compare';
export type WritingProfession = 'doctor' | 'nurse' | 'practical_nurse';

export type WritingPlanPrompt = {
  id: string;
  prompt: string;
  placeholder: string;
};

export type WritingScaffolding = {
  planPrompts: WritingPlanPrompt[];
  phraseStarters: string[];
  showPhraseBank: boolean;
};

export type WritingCheckCondition =
  | { kind: 'includes_any'; alternatives: string[] }
  | { kind: 'includes_each_group'; groups: string[][] }
  | { kind: 'excludes_all'; terms: string[] }
  | { kind: 'minimum_words'; minimum: number }
  | { kind: 'minimum_sentences'; minimum: number };

export type WritingFeedbackCheck = {
  id: string;
  area: WritingFeedbackArea;
  priority: number;
  condition: WritingCheckCondition;
  successMessage: string;
  title: string;
  explanation: string;
  retryInstruction: string;
};

export type WritingTask = {
  taskId: string;
  contentVersion: string;
  pathway: WritingPathway;
  level: WritingLevel;
  title: string;
  genre: string;
  register: WritingRegister;
  audience: string;
  situation: string;
  communicativeGoal: string;
  prompt: string;
  estimatedMinutes: number;
  wordTarget: { min: number; max: number };
  requiredEntitlements: string[];
  allowedProfessions?: WritingProfession[];
  topic: string;
  scaffolding: WritingScaffolding;
  feedbackChecks: WritingFeedbackCheck[];
  successCopy: string;
  developingCopy: string;
  privacyNotice?: string;
  originalContent: true;
};

export type WritingPlan = Record<string, string>;

export type WritingDraftStatus = 'empty' | 'session_only' | 'submitted' | 'feedback_unavailable';

export type WritingDraft = {
  text: string;
  editVersion: number;
  status: WritingDraftStatus;
  statusMessage: string;
};

export type WritingRuleOutcome = {
  checkId: string;
  area: WritingFeedbackArea;
  passed: boolean;
};

export type WritingPriority = {
  id: string;
  area: WritingFeedbackArea;
  title: string;
  explanation: string;
  retryInstruction: string;
};

export type WritingFeedback = {
  evaluator: 'authored_rules' | 'remote_provider';
  communicativeSuccess: string;
  acknowledgements: string[];
  priorities: WritingPriority[];
  ruleOutcomes: WritingRuleOutcome[];
  score: number;
  maxScore: number;
};

export type WritingAttemptStatus = 'assessed' | 'evaluation_failed';

export type WritingAttempt = {
  attemptId: string;
  sequence: number;
  taskId: string;
  contentVersion: string;
  text: string;
  submittedAt: string;
  revisionOfAttemptId: string | null;
  status: WritingAttemptStatus;
  feedback?: WritingFeedback;
  failureCode?: 'evaluation_unavailable';
};

export type WritingComparison = {
  beforeAttemptId: string;
  afterAttemptId: string;
  beforeText: string;
  afterText: string;
  wordDelta: number;
  addressedPriorityIds: string[];
  remainingPriorityIds: string[];
};

export type WritingSession = {
  task: WritingTask;
  startedAt: string;
  stage: WritingStage;
  plan: WritingPlan;
  draft: WritingDraft;
  attempts: WritingAttempt[];
  latestFeedback: WritingFeedback | null;
  comparison: WritingComparison | null;
  evaluationError: string | null;
};

export type WritingEvaluationInput = {
  task: WritingTask;
  text: string;
  previousAssessedAttempt: WritingAttempt | null;
};

export type WritingEvaluator = {
  evaluate(input: WritingEvaluationInput): Promise<WritingFeedback>;
};

export type WritingSubmissionIdentity = {
  attemptId: string;
  submittedAt: string;
};

export type WritingAccessInput = {
  pathway: WritingPathway;
  authHydrated: boolean;
  learnerId: string | null;
  subscriptionLoaded: boolean;
  learnAccess: boolean;
  professionalAccess: boolean;
};

export type WritingAccessDecision =
  | { state: 'loading'; reason: string }
  | { state: 'auth_required'; reason: string }
  | { state: 'entitlement_required'; reason: string }
  | { state: 'ready'; reason: string };

export type WritingLearnerEventInput = {
  learnerId: string;
  eventId: string;
  attemptId: string;
};

export type WritingTaskDescriptor = TaskDescriptor;
export type WritingTaskResult = TaskResult;
export type WritingLearnerEvent = LearnerEvent;

