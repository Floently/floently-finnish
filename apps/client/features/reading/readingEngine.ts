import type {
  LearningPathway,
  TaskDescriptor,
  TaskResult,
} from '@core/schemas/learning';

export const READING_ENGINE_VERSION = 'reading-engine.v1' as const;

export type ReadingScope = Extract<LearningPathway, 'everyday' | 'professional'>;
export type ReadingLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type ReadingDocumentType =
  | 'notice'
  | 'message'
  | 'announcement'
  | 'policy'
  | 'workplace_procedure';

export type ReadingQuestionFamily =
  | 'detail'
  | 'main_idea'
  | 'contextual_vocabulary'
  | 'inference'
  | 'sequencing'
  | 'matching';

export type ReadingProvenance = {
  author: string;
  authoredAt: string;
  license: 'KieliValmis-original';
  sourceNote: string;
};

export type ReadingSegment = {
  id: string;
  text: string;
  emphasis?: 'heading' | 'metadata' | 'body';
};

export type ReadingVocabularyItem = {
  id: string;
  term: string;
  meaning: string;
  contextNote: string;
};

export type ReadingChoiceOption = {
  id: string;
  label: string;
};

type ReadingQuestionBase = {
  id: string;
  prompt: string;
  strategyHint?: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
};

export type ReadingChoiceQuestion = ReadingQuestionBase & {
  type: Extract<
    ReadingQuestionFamily,
    'detail' | 'main_idea' | 'contextual_vocabulary' | 'inference'
  >;
  options: ReadingChoiceOption[];
  correctOptionId: string;
};

export type ReadingSequenceQuestion = ReadingQuestionBase & {
  type: 'sequencing';
  items: ReadingChoiceOption[];
  correctOrder: string[];
};

export type ReadingMatchingQuestion = ReadingQuestionBase & {
  type: 'matching';
  prompts: ReadingChoiceOption[];
  matches: ReadingChoiceOption[];
  correctPairs: Record<string, string>;
};

export type ReadingQuestion =
  | ReadingChoiceQuestion
  | ReadingSequenceQuestion
  | ReadingMatchingQuestion;

export type ReadingTask = {
  taskId: string;
  contentVersion: string;
  pathway: ReadingScope;
  level: ReadingLevel;
  title: string;
  context: string;
  readingGoal: string;
  estimatedMinutes: number;
  profession?: string;
  document: {
    type: ReadingDocumentType;
    title: string;
    metadata?: string;
    segments: ReadingSegment[];
  };
  vocabulary: ReadingVocabularyItem[];
  questions: ReadingQuestion[];
  tags: string[];
  provenance: ReadingProvenance;
};

export type ReadingResponse =
  | { kind: 'choice'; optionId: string }
  | { kind: 'sequence'; order: string[] }
  | { kind: 'matching'; pairs: Record<string, string> };

export type ReadingAnswerAttempt = {
  questionId: string;
  response: ReadingResponse;
  correct: boolean;
  submittedAt: string;
  attemptNumber: number;
};

export type ReadingSessionPhase = 'reading' | 'question' | 'feedback' | 'complete';

export type ReadingSessionState = {
  taskId: string;
  contentVersion: string;
  phase: ReadingSessionPhase;
  currentQuestionIndex: number;
  attempts: ReadingAnswerAttempt[];
  lastAttempt: ReadingAnswerAttempt | null;
  vocabularyOpen: boolean;
};

export type ReadingScaffolding = {
  supportScore: 1 | 2 | 3 | 4;
  showContext: boolean;
  showReadingGoal: boolean;
  chunkDocument: boolean;
  showStrategyHints: boolean;
  vocabularyLabel: string;
  presentation: 'highly_supported' | 'supported' | 'restrained' | 'independent';
};

const READING_SCAFFOLDING: Record<ReadingLevel, ReadingScaffolding> = {
  A1: {
    supportScore: 4,
    showContext: true,
    showReadingGoal: true,
    chunkDocument: true,
    showStrategyHints: true,
    vocabularyLabel: 'Näytä tärkeät sanat',
    presentation: 'highly_supported',
  },
  A2: {
    supportScore: 3,
    showContext: true,
    showReadingGoal: true,
    chunkDocument: true,
    showStrategyHints: true,
    vocabularyLabel: 'Hyödylliset sanat',
    presentation: 'supported',
  },
  B1: {
    supportScore: 2,
    showContext: false,
    showReadingGoal: true,
    chunkDocument: false,
    showStrategyHints: true,
    vocabularyLabel: 'Tarvitsetko sanan?',
    presentation: 'restrained',
  },
  B2: {
    supportScore: 1,
    showContext: false,
    showReadingGoal: false,
    chunkDocument: false,
    showStrategyHints: false,
    vocabularyLabel: 'Sanasto',
    presentation: 'independent',
  },
};

export function getReadingScaffolding(level: ReadingLevel): ReadingScaffolding {
  return READING_SCAFFOLDING[level];
}

export type ReadingTaskValidation =
  | { ok: true; task: ReadingTask }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasUniqueIds(
  values: unknown,
): values is Array<Record<string, unknown> & { id: string }> {
  if (!Array.isArray(values) || values.length === 0) return false;
  const ids = values.map((value) => (isRecord(value) ? value.id : null));
  return ids.every(isNonEmptyString) && new Set(ids).size === ids.length;
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function validateQuestion(value: unknown, index: number, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`questions[${index}] must be an object`);
    return;
  }

  const prefix = `questions[${index}]`;
  if (!isNonEmptyString(value.id)) errors.push(`${prefix}.id is required`);
  if (!isNonEmptyString(value.prompt)) errors.push(`${prefix}.prompt is required`);
  if (value.strategyHint !== undefined && !isNonEmptyString(value.strategyHint)) {
    errors.push(`${prefix}.strategyHint must be a non-empty string when provided`);
  }
  if (!isRecord(value.feedback)) {
    errors.push(`${prefix}.feedback is required`);
  } else if (
    !isNonEmptyString(value.feedback.correct) ||
    !isNonEmptyString(value.feedback.incorrect)
  ) {
    errors.push(`${prefix}.feedback must include correct and incorrect copy`);
  }

  if (
    value.type === 'detail' ||
    value.type === 'main_idea' ||
    value.type === 'contextual_vocabulary' ||
    value.type === 'inference'
  ) {
    if (!hasUniqueIds(value.options) || value.options.length < 2) {
      errors.push(`${prefix}.options must contain at least two unique options`);
      return;
    }
    if (value.options.some((option) => !isNonEmptyString(option.label))) {
      errors.push(`${prefix}.options must include readable labels`);
    }
    const optionIds = value.options.map((option) => option.id);
    if (!isNonEmptyString(value.correctOptionId) || !optionIds.includes(value.correctOptionId)) {
      errors.push(`${prefix}.correctOptionId must reference an option`);
    }
    return;
  }

  if (value.type === 'sequencing') {
    if (!hasUniqueIds(value.items) || value.items.length < 2) {
      errors.push(`${prefix}.items must contain at least two unique items`);
      return;
    }
    if (value.items.some((item) => !isNonEmptyString(item.label))) {
      errors.push(`${prefix}.items must include readable labels`);
    }
    const itemIds = value.items.map((item) => item.id);
    if (
      !Array.isArray(value.correctOrder) ||
      !value.correctOrder.every(isNonEmptyString) ||
      !sameIds(itemIds, value.correctOrder)
    ) {
      errors.push(`${prefix}.correctOrder must contain every item exactly once`);
    }
    return;
  }

  if (value.type === 'matching') {
    if (!hasUniqueIds(value.prompts) || !hasUniqueIds(value.matches)) {
      errors.push(`${prefix}.prompts and matches must be non-empty with unique IDs`);
      return;
    }
    if (
      value.prompts.some((prompt) => !isNonEmptyString(prompt.label)) ||
      value.matches.some((match) => !isNonEmptyString(match.label))
    ) {
      errors.push(`${prefix}.prompts and matches must include readable labels`);
    }
    if (value.prompts.length !== value.matches.length || !isRecord(value.correctPairs)) {
      errors.push(`${prefix}.correctPairs must provide one match per prompt`);
      return;
    }
    const promptIds = value.prompts.map((prompt) => prompt.id);
    const matchIds = value.matches.map((match) => match.id);
    const pairKeys = Object.keys(value.correctPairs);
    const pairValues = Object.values(value.correctPairs);
    if (
      !sameIds(promptIds, pairKeys) ||
      !pairValues.every(isNonEmptyString) ||
      !sameIds(matchIds, pairValues as string[])
    ) {
      errors.push(`${prefix}.correctPairs must reference every prompt and match exactly once`);
    }
    return;
  }

  errors.push(`${prefix}.type is unsupported`);
}

export function validateReadingTask(value: unknown): ReadingTaskValidation {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ['task must be an object'] };

  const requiredStrings = [
    'taskId',
    'contentVersion',
    'title',
    'context',
    'readingGoal',
  ] as const;
  requiredStrings.forEach((key) => {
    if (!isNonEmptyString(value[key])) errors.push(`${key} is required`);
  });

  if (value.pathway !== 'everyday' && value.pathway !== 'professional') {
    errors.push('pathway must be everyday or professional');
  }
  if (value.level !== 'A1' && value.level !== 'A2' && value.level !== 'B1' && value.level !== 'B2') {
    errors.push('level must be A1, A2, B1, or B2');
  }
  if (typeof value.estimatedMinutes !== 'number' || value.estimatedMinutes <= 0) {
    errors.push('estimatedMinutes must be positive');
  }

  if (!isRecord(value.document)) {
    errors.push('document is required');
  } else {
    if (
      value.document.type !== 'notice' &&
      value.document.type !== 'message' &&
      value.document.type !== 'announcement' &&
      value.document.type !== 'policy' &&
      value.document.type !== 'workplace_procedure'
    ) {
      errors.push('document.type is unsupported');
    }
    if (!isNonEmptyString(value.document.title)) errors.push('document.title is required');
    if (value.document.metadata !== undefined && !isNonEmptyString(value.document.metadata)) {
      errors.push('document.metadata must be a non-empty string when provided');
    }
    if (!hasUniqueIds(value.document.segments)) {
      errors.push('document.segments must be non-empty with unique IDs');
    } else if (value.document.segments.some((segment) => !isNonEmptyString(segment.text))) {
      errors.push('every document segment needs text');
    } else if (
      value.document.segments.some(
        (segment) =>
          segment.emphasis !== undefined &&
          segment.emphasis !== 'heading' &&
          segment.emphasis !== 'metadata' &&
          segment.emphasis !== 'body',
      )
    ) {
      errors.push('document segment emphasis is unsupported');
    }
  }

  if (!Array.isArray(value.vocabulary)) {
    errors.push('vocabulary must be an array');
  } else if (value.vocabulary.length > 0 && !hasUniqueIds(value.vocabulary)) {
    errors.push('vocabulary IDs must be unique');
  } else if (
    value.vocabulary.some(
      (item) =>
        !isRecord(item) ||
        !isNonEmptyString(item.term) ||
        !isNonEmptyString(item.meaning) ||
        !isNonEmptyString(item.contextNote),
    )
  ) {
    errors.push('every vocabulary item needs term, meaning, and contextNote');
  }

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    errors.push('questions must be non-empty');
  } else {
    value.questions.forEach((question, index) => validateQuestion(question, index, errors));
    const questionIds = value.questions
      .map((question) => (isRecord(question) ? question.id : null))
      .filter(isNonEmptyString);
    if (new Set(questionIds).size !== questionIds.length) errors.push('question IDs must be unique');
  }

  if (!Array.isArray(value.tags) || !value.tags.every(isNonEmptyString)) {
    errors.push('tags must be an array of strings');
  }

  if (
    !isRecord(value.provenance) ||
    !isNonEmptyString(value.provenance.author) ||
    !isNonEmptyString(value.provenance.authoredAt) ||
    value.provenance.license !== 'KieliValmis-original' ||
    !isNonEmptyString(value.provenance.sourceNote)
  ) {
    errors.push('original-content provenance is required');
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, task: value as ReadingTask };
}

export function gradeReadingResponse(
  question: ReadingQuestion,
  response: unknown,
): boolean {
  if (!isRecord(response)) return false;
  if (
    question.type === 'detail' ||
    question.type === 'main_idea' ||
    question.type === 'contextual_vocabulary' ||
    question.type === 'inference'
  ) {
    return response.kind === 'choice' && response.optionId === question.correctOptionId;
  }

  if (question.type === 'sequencing') {
    return (
      response.kind === 'sequence' &&
      Array.isArray(response.order) &&
      response.order.length === question.correctOrder.length &&
      response.order.every((id, index) => id === question.correctOrder[index])
    );
  }

  if (
    question.type === 'matching' &&
    response.kind === 'matching' &&
    isRecord(response.pairs) &&
    Object.keys(response.pairs).length === Object.keys(question.correctPairs).length
  ) {
    const pairs = response.pairs;
    return Object.entries(question.correctPairs).every(
      ([promptId, matchId]) => pairs[promptId] === matchId,
    );
  }
  return false;
}

export function createReadingSession(task: ReadingTask): ReadingSessionState {
  return {
    taskId: task.taskId,
    contentVersion: task.contentVersion,
    phase: 'reading',
    currentQuestionIndex: 0,
    attempts: [],
    lastAttempt: null,
    vocabularyOpen: false,
  };
}

function assertSessionMatchesTask(state: ReadingSessionState, task: ReadingTask) {
  if (state.taskId !== task.taskId || state.contentVersion !== task.contentVersion) {
    throw new Error('Reading session does not match task identity and content version.');
  }
}

export function startReadingQuestions(
  state: ReadingSessionState,
  task: ReadingTask,
): ReadingSessionState {
  assertSessionMatchesTask(state, task);
  if (state.phase !== 'reading') return state;
  return { ...state, phase: 'question', lastAttempt: null };
}

export function setReadingVocabularyOpen(
  state: ReadingSessionState,
  open: boolean,
): ReadingSessionState {
  return { ...state, vocabularyOpen: open };
}

export function submitReadingResponse(args: {
  state: ReadingSessionState;
  task: ReadingTask;
  response: ReadingResponse;
  submittedAt: string;
}): ReadingSessionState {
  const { state, task, response, submittedAt } = args;
  assertSessionMatchesTask(state, task);
  if (state.phase !== 'question') {
    throw new Error('Answers can only be submitted while a question is active.');
  }
  const question = task.questions[state.currentQuestionIndex];
  if (!question) throw new Error('The current reading question does not exist.');
  const previousForQuestion = state.attempts.filter(
    (attempt) => attempt.questionId === question.id,
  ).length;
  const attempt: ReadingAnswerAttempt = {
    questionId: question.id,
    response,
    correct: gradeReadingResponse(question, response),
    submittedAt,
    attemptNumber: previousForQuestion + 1,
  };
  return {
    ...state,
    phase: 'feedback',
    attempts: [...state.attempts, attempt],
    lastAttempt: attempt,
  };
}

export function retryReadingQuestion(
  state: ReadingSessionState,
  task: ReadingTask,
): ReadingSessionState {
  assertSessionMatchesTask(state, task);
  if (state.phase !== 'feedback' || !state.lastAttempt || state.lastAttempt.correct) {
    throw new Error('Retry is only available after an incorrect answer.');
  }
  return { ...state, phase: 'question', lastAttempt: null };
}

export function continueReadingSession(
  state: ReadingSessionState,
  task: ReadingTask,
): ReadingSessionState {
  assertSessionMatchesTask(state, task);
  if (state.phase !== 'feedback' || !state.lastAttempt?.correct) {
    throw new Error('Continue is only available after a correct answer.');
  }
  const nextIndex = state.currentQuestionIndex + 1;
  if (nextIndex >= task.questions.length) {
    return { ...state, phase: 'complete', lastAttempt: null };
  }
  return {
    ...state,
    phase: 'question',
    currentQuestionIndex: nextIndex,
    lastAttempt: null,
  };
}

function firstAttemptsByQuestion(state: ReadingSessionState) {
  const first = new Map<string, ReadingAnswerAttempt>();
  state.attempts.forEach((attempt) => {
    if (!first.has(attempt.questionId)) first.set(attempt.questionId, attempt);
  });
  return first;
}

export function summarizeReadingSession(state: ReadingSessionState, task: ReadingTask) {
  assertSessionMatchesTask(state, task);
  const first = firstAttemptsByQuestion(state);
  const firstTryCorrect = Array.from(first.values()).filter((attempt) => attempt.correct).length;
  const correctedCount = task.questions.filter((question) => {
    const attempts = state.attempts.filter((attempt) => attempt.questionId === question.id);
    return attempts.length > 1 && attempts.some((attempt) => attempt.correct);
  }).length;
  return {
    firstTryCorrect,
    correctedCount,
    totalSubmissions: state.attempts.length,
    questionCount: task.questions.length,
  };
}

const LEARNING_CONTRACT_VERSION: TaskDescriptor['schemaVersion'] = 'learning.v1';

export function toReadingTaskDescriptor(task: ReadingTask): TaskDescriptor {
  return {
    schemaVersion: LEARNING_CONTRACT_VERSION,
    taskId: task.taskId,
    contentVersion: task.contentVersion,
    runtime: 'reading',
    pathway: task.pathway,
    skills: ['reading'],
    levelBand: task.level,
    estimatedMinutes: task.estimatedMinutes,
    modality: { visual: true },
    requiredEntitlements: [
      task.pathway === 'professional' ? 'professionalAccess' : 'learnAccess',
    ],
    launch: {
      route:
        task.pathway === 'professional'
          ? '/professional/reading'
          : '/learn/reading',
      params: { taskId: task.taskId },
    },
    health: 'available',
    ...(task.profession ? { profession: task.profession } : {}),
    topic: task.tags[0],
    tags: [...task.tags, 'original-content'],
  };
}

export function toReadingTaskResult(args: {
  task: ReadingTask;
  state: ReadingSessionState;
  attemptId: string;
  startedAt: string;
  completedAt: string;
}): TaskResult {
  const { task, state, attemptId, startedAt, completedAt } = args;
  if (state.phase !== 'complete') {
    throw new Error('A completed TaskResult requires a completed reading session.');
  }
  const summary = summarizeReadingSession(state, task);
  return {
    schemaVersion: LEARNING_CONTRACT_VERSION,
    taskId: task.taskId,
    contentVersion: task.contentVersion,
    attemptId,
    completion: 'completed',
    startedAt,
    completedAt,
    score: summary.firstTryCorrect,
    maxScore: summary.questionCount,
    retrySuggested: false,
    metadata: {
      pathway: task.pathway,
      levelBand: task.level,
      questionCount: summary.questionCount,
      firstTryCorrect: summary.firstTryCorrect,
      correctedCount: summary.correctedCount,
      totalSubmissions: summary.totalSubmissions,
      readingEngineVersion: READING_ENGINE_VERSION,
    },
  };
}

export type ReadingRuntimeEvent = {
  eventVersion: typeof READING_ENGINE_VERSION;
  kind:
    | 'reading_started'
    | 'answer_submitted'
    | 'retry_started'
    | 'reading_completed';
  taskId: string;
  contentVersion: string;
  occurredAt: string;
  questionId?: string;
  correct?: boolean;
  attemptNumber?: number;
};

export type ReadingRuntimeHooks = {
  onEvent?: (event: ReadingRuntimeEvent) => void;
  onResult?: (result: TaskResult) => void;
};

export type ReadingAccessSnapshot = {
  scope: ReadingScope;
  authHydrated: boolean;
  userPresent: boolean;
  subscriptionLoaded: boolean;
  subscriptionLoading: boolean;
  isPreview: boolean;
  isInternalAllAccess: boolean;
  learnAccess: boolean;
  professionalAccess: boolean;
};

export type ReadingAccessDecision =
  | 'loading'
  | 'allowed'
  | 'auth_required'
  | 'entitlement_required';

export function resolveReadingAccess(snapshot: ReadingAccessSnapshot): ReadingAccessDecision {
  if (!snapshot.authHydrated) return 'loading';
  if (!snapshot.userPresent) return 'auth_required';
  if (!snapshot.subscriptionLoaded || snapshot.subscriptionLoading) return 'loading';
  if (snapshot.isInternalAllAccess) return 'allowed';
  if (snapshot.scope === 'professional') {
    return snapshot.professionalAccess ? 'allowed' : 'entitlement_required';
  }
  return snapshot.learnAccess && !snapshot.isPreview
    ? 'allowed'
    : 'entitlement_required';
}
