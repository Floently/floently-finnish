'use strict';

const LEARNING_SCHEMA_VERSION = 'learning.v1';
const FOCUSED_PRIORITY_LIMIT = 2;
const SESSION_ONLY_DRAFT_MESSAGE = 'Kept only in this open practice. Leaving or reloading can discard your draft.';
const SUBMITTED_DRAFT_MESSAGE = 'Submitted for focused feedback. Your editable text is still here.';
const EVALUATION_FAILED_DRAFT_MESSAGE = 'Feedback is unavailable. Your draft is still here and can be submitted again.';
const WRITING_PROFESSIONS = new Set(['doctor', 'nurse', 'practical_nurse']);

function assertNonEmpty(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
}

function wordCount(text) {
  const normalized = String(text || '').trim();
  return normalized ? normalized.split(/\s+/u).length : 0;
}

function sentenceCount(text) {
  return String(text || '')
    .split(/[.!?]+/u)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function normalizedText(text) {
  return String(text || '').toLocaleLowerCase('fi-FI').replace(/\s+/gu, ' ').trim();
}

function includesTerm(text, term) {
  return text.includes(normalizedText(term));
}

function passesCondition(text, condition) {
  const normalized = normalizedText(text);

  switch (condition.kind) {
    case 'includes_any':
      return condition.alternatives.some((term) => includesTerm(normalized, term));
    case 'includes_each_group':
      return condition.groups.every((group) => group.some((term) => includesTerm(normalized, term)));
    case 'excludes_all':
      return condition.terms.every((term) => !includesTerm(normalized, term));
    case 'minimum_words':
      return wordCount(text) >= condition.minimum;
    case 'minimum_sentences':
      return sentenceCount(text) >= condition.minimum;
    default:
      return false;
  }
}

function validateWritingTask(task) {
  if (!task || typeof task !== 'object') throw new Error('INVALID_WRITING_TASK');
  assertNonEmpty(task.taskId, 'task_id');
  assertNonEmpty(task.contentVersion, 'content_version');
  assertNonEmpty(task.title, 'task_title');
  assertNonEmpty(task.prompt, 'task_prompt');

  if (task.pathway !== 'everyday' && task.pathway !== 'professional') {
    throw new Error('INVALID_WRITING_PATHWAY');
  }
  if (!['A1', 'A2', 'B1', 'B2'].includes(task.level)) {
    throw new Error('INVALID_WRITING_LEVEL');
  }
  if (!Array.isArray(task.feedbackChecks) || task.feedbackChecks.length === 0) {
    throw new Error('MISSING_FEEDBACK_CHECKS');
  }
  if (!task.scaffolding || !Array.isArray(task.scaffolding.planPrompts)) {
    throw new Error('INVALID_WRITING_SCAFFOLDING');
  }

  const checkIds = new Set();
  for (const check of task.feedbackChecks) {
    assertNonEmpty(check.id, 'feedback_check_id');
    if (checkIds.has(check.id)) throw new Error('DUPLICATE_FEEDBACK_CHECK_ID');
    checkIds.add(check.id);
    if (!Number.isFinite(check.priority)) throw new Error('INVALID_FEEDBACK_PRIORITY');
    assertNonEmpty(check.title, 'feedback_title');
    assertNonEmpty(check.explanation, 'feedback_explanation');
    assertNonEmpty(check.retryInstruction, 'feedback_retry');
  }

  const promptIds = new Set();
  for (const prompt of task.scaffolding.planPrompts) {
    assertNonEmpty(prompt.id, 'plan_prompt_id');
    if (promptIds.has(prompt.id)) throw new Error('DUPLICATE_PLAN_PROMPT_ID');
    promptIds.add(prompt.id);
  }
}

function resolveEvidenceProfession(task, profession, required) {
  if (task.pathway === 'everyday') {
    if (profession !== undefined && profession !== null) {
      throw new Error('UNEXPECTED_WRITING_PROFESSION');
    }
    return undefined;
  }

  if (profession === undefined || profession === null || profession === '') {
    if (required) throw new Error('INVALID_PROFESSION');
    return undefined;
  }
  assertNonEmpty(profession, 'profession');
  if (!WRITING_PROFESSIONS.has(profession)) {
    throw new Error('INVALID_WRITING_PROFESSION');
  }
  if (Array.isArray(task.allowedProfessions) && !task.allowedProfessions.includes(profession)) {
    throw new Error('WRITING_PROFESSION_NOT_ALLOWED');
  }
  return profession;
}

function emptyPlan(task) {
  return Object.fromEntries(task.scaffolding.planPrompts.map((prompt) => [prompt.id, '']));
}

function createWritingSession(task, startedAt) {
  validateWritingTask(task);
  assertNonEmpty(startedAt, 'started_at');
  if (Number.isNaN(Date.parse(startedAt))) throw new Error('INVALID_STARTED_AT');

  return {
    task,
    startedAt,
    stage: 'understand',
    plan: emptyPlan(task),
    draft: {
      text: '',
      editVersion: 0,
      status: 'empty',
      statusMessage: SESSION_ONLY_DRAFT_MESSAGE,
    },
    attempts: [],
    latestFeedback: null,
    comparison: null,
    evaluationError: null,
  };
}

function moveToPlanning(session) {
  if (session.stage !== 'understand') throw new Error('INVALID_STAGE_FOR_PLANNING');
  return { ...session, stage: 'plan' };
}

function updateWritingPlan(session, promptId, value) {
  if (session.stage !== 'plan') throw new Error('INVALID_STAGE_FOR_PLAN_EDIT');
  if (!Object.prototype.hasOwnProperty.call(session.plan, promptId)) {
    throw new Error('UNKNOWN_PLAN_PROMPT');
  }
  return {
    ...session,
    plan: { ...session.plan, [promptId]: String(value) },
  };
}

function beginWriting(session) {
  if (session.stage !== 'plan') throw new Error('INVALID_STAGE_FOR_WRITING');
  return { ...session, stage: 'write' };
}

function updateWritingDraft(session, text) {
  if (session.stage !== 'write' && session.stage !== 'revise') {
    throw new Error('INVALID_STAGE_FOR_DRAFT_EDIT');
  }
  const nextText = String(text);
  return {
    ...session,
    draft: {
      text: nextText,
      editVersion: session.draft.editVersion + 1,
      status: nextText.trim() ? 'session_only' : 'empty',
      statusMessage: SESSION_ONLY_DRAFT_MESSAGE,
    },
    comparison: null,
    evaluationError: null,
  };
}

function beginRevision(session) {
  if (session.stage !== 'feedback' && session.stage !== 'compare') {
    throw new Error('INVALID_STAGE_FOR_REVISION');
  }
  return {
    ...session,
    stage: 'revise',
    comparison: null,
    evaluationError: null,
    draft: {
      ...session.draft,
      status: 'session_only',
      statusMessage: SESSION_ONLY_DRAFT_MESSAGE,
    },
  };
}

function latestAssessedAttempt(session) {
  for (let index = session.attempts.length - 1; index >= 0; index -= 1) {
    if (session.attempts[index].status === 'assessed') return session.attempts[index];
  }
  return null;
}

function uniqueById(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function validateFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') throw new Error('INVALID_FEEDBACK');
  assertNonEmpty(feedback.communicativeSuccess, 'communicative_success');
  if (!Array.isArray(feedback.acknowledgements)) throw new Error('INVALID_ACKNOWLEDGEMENTS');
  if (!Array.isArray(feedback.priorities)) throw new Error('INVALID_PRIORITIES');
  if (!Array.isArray(feedback.ruleOutcomes)) throw new Error('INVALID_RULE_OUTCOMES');

  const priorities = uniqueById(feedback.priorities)
    .filter((priority) => priority.title && priority.explanation && priority.retryInstruction)
    .slice(0, FOCUSED_PRIORITY_LIMIT);

  const outcomes = [];
  const outcomeIds = new Set();
  for (const outcome of feedback.ruleOutcomes) {
    if (!outcome || typeof outcome.checkId !== 'string' || outcomeIds.has(outcome.checkId)) continue;
    outcomeIds.add(outcome.checkId);
    outcomes.push({
      checkId: outcome.checkId,
      area: outcome.area,
      passed: outcome.passed === true,
    });
  }

  const score = Math.max(0, Math.min(Number(feedback.score) || 0, Number(feedback.maxScore) || 0));
  const maxScore = Math.max(0, Number(feedback.maxScore) || 0);

  return {
    evaluator: feedback.evaluator === 'remote_provider' ? 'remote_provider' : 'authored_rules',
    communicativeSuccess: feedback.communicativeSuccess.trim(),
    acknowledgements: [...new Set(feedback.acknowledgements.filter((item) => typeof item === 'string' && item.trim()))].slice(0, 2),
    priorities,
    ruleOutcomes: outcomes,
    score,
    maxScore,
  };
}

function createAuthoredWritingEvaluator() {
  return {
    async evaluate({ task, text }) {
      validateWritingTask(task);
      const orderedChecks = [...task.feedbackChecks].sort((left, right) => (
        left.priority - right.priority || left.id.localeCompare(right.id)
      ));
      const evaluated = orderedChecks.map((check) => ({
        check,
        passed: passesCondition(text, check.condition),
      }));
      const passedGoal = evaluated.some(({ check, passed }) => (
        check.area === 'communicative_goal' && passed
      ));
      const failed = evaluated.filter((item) => !item.passed);

      return validateFeedback({
        evaluator: 'authored_rules',
        communicativeSuccess: passedGoal ? task.successCopy : task.developingCopy,
        acknowledgements: evaluated
          .filter((item) => item.passed)
          .map((item) => item.check.successMessage),
        priorities: failed.map(({ check }) => ({
          id: check.id,
          area: check.area,
          title: check.title,
          explanation: check.explanation,
          retryInstruction: check.retryInstruction,
        })),
        ruleOutcomes: evaluated.map(({ check, passed }) => ({
          checkId: check.id,
          area: check.area,
          passed,
        })),
        score: evaluated.filter((item) => item.passed).length,
        maxScore: evaluated.length,
      });
    },
  };
}

function buildComparison(previous, current) {
  const outcomes = new Map(current.feedback.ruleOutcomes.map((outcome) => [outcome.checkId, outcome.passed]));
  return {
    beforeAttemptId: previous.attemptId,
    afterAttemptId: current.attemptId,
    beforeText: previous.text,
    afterText: current.text,
    wordDelta: wordCount(current.text) - wordCount(previous.text),
    addressedPriorityIds: previous.feedback.priorities
      .filter((priority) => outcomes.get(priority.id) === true)
      .map((priority) => priority.id),
    remainingPriorityIds: current.feedback.priorities.map((priority) => priority.id),
  };
}

async function submitWriting(session, evaluator, identity) {
  if (session.stage !== 'write' && session.stage !== 'revise') {
    throw new Error('INVALID_STAGE_FOR_SUBMISSION');
  }
  if (!session.draft.text.trim()) throw new Error('EMPTY_WRITING_DRAFT');
  if (!evaluator || typeof evaluator.evaluate !== 'function') throw new Error('INVALID_WRITING_EVALUATOR');
  assertNonEmpty(identity.attemptId, 'attempt_id');
  assertNonEmpty(identity.submittedAt, 'submitted_at');
  if (Number.isNaN(Date.parse(identity.submittedAt))) throw new Error('INVALID_SUBMITTED_AT');
  if (session.attempts.some((attempt) => attempt.attemptId === identity.attemptId)) {
    throw new Error('DUPLICATE_ATTEMPT_ID');
  }

  const previous = latestAssessedAttempt(session);
  const baseAttempt = {
    attemptId: identity.attemptId,
    sequence: session.attempts.length + 1,
    taskId: session.task.taskId,
    contentVersion: session.task.contentVersion,
    text: session.draft.text,
    submittedAt: identity.submittedAt,
    revisionOfAttemptId: previous ? previous.attemptId : null,
  };

  try {
    const feedback = validateFeedback(await evaluator.evaluate({
      task: session.task,
      text: session.draft.text,
      previousAssessedAttempt: previous,
    }));
    const attempt = { ...baseAttempt, status: 'assessed', feedback };
    const comparison = previous ? buildComparison(previous, attempt) : null;

    return {
      ...session,
      attempts: [...session.attempts, attempt],
      stage: comparison ? 'compare' : 'feedback',
      latestFeedback: feedback,
      comparison,
      evaluationError: null,
      draft: {
        ...session.draft,
        status: 'submitted',
        statusMessage: SUBMITTED_DRAFT_MESSAGE,
      },
    };
  } catch {
    const attempt = {
      ...baseAttempt,
      status: 'evaluation_failed',
      failureCode: 'evaluation_unavailable',
    };
    return {
      ...session,
      attempts: [...session.attempts, attempt],
      evaluationError: EVALUATION_FAILED_DRAFT_MESSAGE,
      draft: {
        ...session.draft,
        status: 'feedback_unavailable',
        statusMessage: EVALUATION_FAILED_DRAFT_MESSAGE,
      },
    };
  }
}

function routeForPathway(pathway) {
  return pathway === 'professional' ? '/professional/writing' : '/learn/writing';
}

function buildWritingTaskDescriptor(task, profession) {
  validateWritingTask(task);
  const evidenceProfession = resolveEvidenceProfession(task, profession, false);
  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    taskId: task.taskId,
    contentVersion: task.contentVersion,
    runtime: 'writing',
    pathway: task.pathway,
    skills: ['writing'],
    levelBand: task.level,
    estimatedMinutes: task.estimatedMinutes,
    modality: { keyboard: true },
    requiredEntitlements: [...task.requiredEntitlements],
    launch: { route: routeForPathway(task.pathway), params: { taskId: task.taskId } },
    health: 'available',
    profession: evidenceProfession,
    topic: task.topic,
    tags: [task.genre, task.register, 'revision_required'],
  };
}

function buildWritingTaskResult(session) {
  if (!session.comparison) return null;
  const attempt = latestAssessedAttempt(session);
  if (!attempt || !attempt.feedback) return null;

  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    taskId: attempt.taskId,
    contentVersion: attempt.contentVersion,
    attemptId: attempt.attemptId,
    completion: 'completed',
    startedAt: session.startedAt,
    completedAt: attempt.submittedAt,
    score: attempt.feedback.score,
    maxScore: attempt.feedback.maxScore,
    retrySuggested: attempt.feedback.priorities.length > 0,
    metadata: {
      pathway: session.task.pathway,
      level: session.task.level,
      assessedAttemptCount: session.attempts.filter((item) => item.status === 'assessed').length,
      addressedPriorityCount: session.comparison.addressedPriorityIds.length,
      remainingPriorityCount: session.comparison.remainingPriorityIds.length,
      evaluationMode: attempt.feedback.evaluator,
    },
  };
}

function buildWritingLearnerEvent(session, input) {
  assertNonEmpty(input.learnerId, 'learner_id');
  assertNonEmpty(input.eventId, 'event_id');
  assertNonEmpty(input.attemptId, 'attempt_id');
  const attempt = session.attempts.find((item) => item.attemptId === input.attemptId);
  if (!attempt || attempt.status !== 'assessed' || !attempt.feedback) {
    throw new Error('ASSESSED_ATTEMPT_REQUIRED');
  }
  validateWritingTask(session.task);
  const evidenceProfession = resolveEvidenceProfession(session.task, input.profession, true);

  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    eventId: input.eventId,
    learnerId: input.learnerId,
    occurredAt: attempt.submittedAt,
    eventKind: attempt.revisionOfAttemptId ? 'writing_retried' : 'writing_submitted',
    taskId: attempt.taskId,
    contentVersion: attempt.contentVersion,
    attemptId: attempt.attemptId,
    pathway: session.task.pathway,
    runtime: 'writing',
    skills: ['writing'],
    levelBand: session.task.level,
    profession: evidenceProfession,
    score: attempt.feedback.score,
    maxScore: attempt.feedback.maxScore,
    metadata: {
      revision: Boolean(attempt.revisionOfAttemptId),
      feedbackPriorityCount: attempt.feedback.priorities.length,
      evaluationMode: attempt.feedback.evaluator,
    },
  };
}

function resolveWritingAccess(input) {
  if (!input.authHydrated) {
    return { state: 'loading', reason: 'Checking your session.' };
  }
  if (!input.learnerId) {
    return { state: 'auth_required', reason: 'Sign in to start a Writing practice.' };
  }
  if (!input.subscriptionLoaded) {
    return { state: 'loading', reason: 'Checking your learning access.' };
  }
  if (input.pathway === 'professional' && !input.professionalAccess) {
    return { state: 'entitlement_required', reason: 'Professional Writing requires Professional pathway access.' };
  }
  if (input.pathway === 'everyday' && !input.learnAccess) {
    return { state: 'entitlement_required', reason: 'Everyday Writing requires Learn access.' };
  }
  return { state: 'ready', reason: 'Writing access confirmed.' };
}

module.exports = {
  EVALUATION_FAILED_DRAFT_MESSAGE,
  FOCUSED_PRIORITY_LIMIT,
  SESSION_ONLY_DRAFT_MESSAGE,
  SUBMITTED_DRAFT_MESSAGE,
  beginRevision,
  beginWriting,
  buildWritingLearnerEvent,
  buildWritingTaskDescriptor,
  buildWritingTaskResult,
  createAuthoredWritingEvaluator,
  createWritingSession,
  emptyPlan,
  latestAssessedAttempt,
  moveToPlanning,
  resolveWritingAccess,
  routeForPathway,
  submitWriting,
  updateWritingDraft,
  updateWritingPlan,
  validateFeedback,
  validateWritingTask,
  wordCount,
};
