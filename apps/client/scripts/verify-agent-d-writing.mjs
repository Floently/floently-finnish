import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const clientRoot = join(scriptDirectory, '..');
const writingRoot = join(clientRoot, 'features', 'writing');

const engine = require(join(writingRoot, 'engine.js'));
const { WRITING_TASKS, tasksForPathway, writingTaskById } = require(join(writingRoot, 'tasks.js'));
const { describeHealthcareWritingMigration } = require(join(writingRoot, 'healthcareMigration.js'));

let assertionCount = 0;

function check(value, message) {
  assert.ok(value, message);
  assertionCount += 1;
}

function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertionCount += 1;
}

function deepEqual(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertionCount += 1;
}

function throws(action, expected, message) {
  assert.throws(action, expected, message);
  assertionCount += 1;
}

async function rejects(action, expected, message) {
  await assert.rejects(action, expected, message);
  assertionCount += 1;
}

function startDraft(task, text) {
  let session = engine.createWritingSession(task, '2026-08-16T10:00:00.000Z');
  session = engine.moveToPlanning(session);
  const firstPrompt = task.scaffolding.planPrompts[0];
  session = engine.updateWritingPlan(session, firstPrompt.id, 'Omat lyhyet muistiinpanot');
  session = engine.beginWriting(session);
  return engine.updateWritingDraft(session, text);
}

async function testCanonicalRevisionLoop() {
  const task = writingTaskById('writing.everyday.library-reply.a1');
  check(task, 'Everyday A1 task exists');

  let session = startDraft(task, 'Hei. En tiedä.');
  session = await engine.submitWriting(session, engine.createAuthoredWritingEvaluator(), {
    attemptId: 'attempt-1',
    submittedAt: '2026-08-16T10:02:00.000Z',
  });

  equal(session.stage, 'feedback', 'First submission moves to focused feedback');
  equal(session.attempts.length, 1, 'First submission appends one attempt');
  equal(session.attempts[0].status, 'assessed', 'First submission is assessed');
  check(session.latestFeedback.communicativeSuccess.length > 0, 'Communicative success is always explained');
  check(session.latestFeedback.priorities.length <= 2, 'Feedback contains no more than two priorities');
  equal(session.comparison, null, 'A first draft is not falsely described as a comparison');
  equal(engine.buildWritingTaskResult(session), null, 'A task is not complete before revision evidence exists');

  session = engine.beginRevision(session);
  session = engine.updateWritingDraft(session, 'Hei! Kyllä, tulen kirjastoon kello 17. Nähdään huomenna!');
  session = await engine.submitWriting(session, engine.createAuthoredWritingEvaluator(), {
    attemptId: 'attempt-2',
    submittedAt: '2026-08-16T10:05:00.000Z',
  });

  equal(session.stage, 'compare', 'Successful resubmission moves to comparison');
  equal(session.attempts.length, 2, 'Revision appends instead of replacing attempt history');
  deepEqual(session.attempts.map((attempt) => attempt.sequence), [1, 2], 'Attempt ordering is stable');
  equal(session.attempts[1].revisionOfAttemptId, 'attempt-1', 'Revision links to the prior assessed attempt');
  equal(session.comparison.beforeText, 'Hei. En tiedä.', 'Comparison preserves the original text');
  equal(session.comparison.afterText, 'Hei! Kyllä, tulen kirjastoon kello 17. Nähdään huomenna!', 'Comparison shows the learner revision');
  deepEqual(session.comparison.addressedPriorityIds, ['answer_invitation', 'confirm_time'], 'Comparison identifies addressed focused priorities');

  const result = engine.buildWritingTaskResult(session);
  check(result, 'A revised and compared session emits a TaskResult');
  equal(result.taskId, task.taskId, 'TaskResult preserves task identity');
  equal(result.contentVersion, task.contentVersion, 'TaskResult preserves content version');
  equal(result.attemptId, 'attempt-2', 'TaskResult points to the revision attempt');
  equal(result.completion, 'completed', 'Revision completes the canonical task loop');

  const submittedEvent = engine.buildWritingLearnerEvent(session, {
    learnerId: 'learner-1', eventId: 'event-1', attemptId: 'attempt-1',
  });
  const retriedEvent = engine.buildWritingLearnerEvent(session, {
    learnerId: 'learner-1', eventId: 'event-2', attemptId: 'attempt-2',
  });
  equal(submittedEvent.eventKind, 'writing_submitted', 'First evidence event is a writing submission');
  equal(retriedEvent.eventKind, 'writing_retried', 'Revision evidence event is a writing retry');
  equal(retriedEvent.contentVersion, task.contentVersion, 'Learner event preserves content version');
}

async function testFocusedFeedbackBoundary() {
  const normalized = engine.validateFeedback({
    evaluator: 'remote_provider',
    communicativeSuccess: 'The reader can identify the topic.',
    acknowledgements: ['One', 'Two', 'Three'],
    priorities: [1, 2, 3, 4].map((number) => ({
      id: `priority-${number}`,
      area: 'content',
      title: `Point ${number}`,
      explanation: 'A concise explanation.',
      retryInstruction: 'Make a targeted change.',
    })),
    ruleOutcomes: [],
    score: 0,
    maxScore: 4,
  });

  equal(engine.FOCUSED_PRIORITY_LIMIT, 2, 'The focused correction limit is explicit');
  equal(normalized.priorities.length, 2, 'Provider feedback is normalized to two priorities');
  deepEqual(normalized.priorities.map((priority) => priority.id), ['priority-1', 'priority-2'], 'Priority order is deterministic');
  equal(normalized.acknowledgements.length, 2, 'Positive acknowledgements are concise too');
}

async function testEvaluationFailurePreservesDraft() {
  const task = writingTaskById('writing.professional.shift-update.b1');
  const originalDraft = 'Toimitus myöhästyy 30 minuuttia. Asiakkaalle on ilmoitettu. Seuraavan vuoron pitää vahvistaa uusi aika.';
  let session = startDraft(task, originalDraft);
  const unavailableEvaluator = { async evaluate() { throw new Error('provider unavailable'); } };

  session = await engine.submitWriting(session, unavailableEvaluator, {
    attemptId: 'failed-1', submittedAt: '2026-08-16T11:00:00.000Z',
  });

  equal(session.stage, 'write', 'Evaluation failure keeps the learner in the editable stage');
  equal(session.draft.text, originalDraft, 'Evaluation failure preserves the exact learner draft');
  equal(session.draft.status, 'feedback_unavailable', 'Draft state reports unavailable feedback truthfully');
  equal(session.draft.statusMessage, engine.EVALUATION_FAILED_DRAFT_MESSAGE, 'Failure status does not claim a save');
  equal(session.attempts[0].status, 'evaluation_failed', 'Failure is retained in attempt history');
  equal(session.attempts[0].sequence, 1, 'Failed attempts keep their chronological position');
  equal(engine.buildWritingTaskResult(session), null, 'Failed evaluation cannot emit completion evidence');
  throws(
    () => engine.buildWritingLearnerEvent(session, { learnerId: 'learner-1', eventId: 'failed-event', attemptId: 'failed-1' }),
    /ASSESSED_ATTEMPT_REQUIRED/,
    'Failed evaluation cannot emit assessed learner evidence',
  );

  session = await engine.submitWriting(session, engine.createAuthoredWritingEvaluator(), {
    attemptId: 'retry-after-failure', submittedAt: '2026-08-16T11:01:00.000Z',
  });
  deepEqual(session.attempts.map((attempt) => attempt.sequence), [1, 2], 'Retry follows the failed attempt without overwriting it');
  equal(session.attempts[1].revisionOfAttemptId, null, 'An evaluation retry is not falsely labelled as text revision');
}

async function testFailedRevisionOrdering() {
  const task = writingTaskById('writing.everyday.appointment-change.a2');
  let session = startDraft(task, 'Hei. Tarvitsen uuden ajan torstaina.');
  session = await engine.submitWriting(session, engine.createAuthoredWritingEvaluator(), {
    attemptId: 'ordered-1', submittedAt: '2026-08-16T12:00:00.000Z',
  });
  session = engine.beginRevision(session);
  session = engine.updateWritingDraft(session, 'Hei. Minulla on aika tiistaina kello 10. Voisinko saada uuden ajan torstai-iltapäivälle? Kiitos.');
  session = await engine.submitWriting(session, { async evaluate() { throw new Error('temporary'); } }, {
    attemptId: 'ordered-2', submittedAt: '2026-08-16T12:01:00.000Z',
  });
  session = await engine.submitWriting(session, engine.createAuthoredWritingEvaluator(), {
    attemptId: 'ordered-3', submittedAt: '2026-08-16T12:02:00.000Z',
  });

  deepEqual(session.attempts.map((attempt) => attempt.sequence), [1, 2, 3], 'Assessed and failed attempts retain append order');
  deepEqual(session.attempts.map((attempt) => attempt.status), ['assessed', 'evaluation_failed', 'assessed'], 'History exposes failure between assessed attempts');
  equal(session.attempts[2].revisionOfAttemptId, 'ordered-1', 'Successful revision links to the prior assessed text');
  equal(session.comparison.beforeAttemptId, 'ordered-1', 'Comparison skips failed evaluation as a comparison baseline');
  equal(session.comparison.afterAttemptId, 'ordered-3', 'Comparison uses the successful revision');
}

function testTaskFamiliesAndVersions() {
  equal(WRITING_TASKS.length, 5, 'The initial authored task library has five bounded tasks');
  equal(tasksForPathway('everyday').length, 3, 'Everyday pathway has A1, A2, and B1 tasks');
  equal(tasksForPathway('professional', 'nurse').length, 2, 'Professional pathway shares B1 and B2 configurations');
  check(WRITING_TASKS.every((task) => task.originalContent === true), 'Every task is marked as original content');
  check(WRITING_TASKS.every((task) => /^2026-08-16\.1$/.test(task.contentVersion)), 'Every authored task has an explicit content version');

  const everydayA1 = writingTaskById('writing.everyday.library-reply.a1');
  const everydayA2 = writingTaskById('writing.everyday.appointment-change.a2');
  const everydayB1 = writingTaskById('writing.everyday.repair-email.b1');
  const professionalB1 = writingTaskById('writing.professional.shift-update.b1');
  const professionalB2 = writingTaskById('writing.professional.incident-summary.b2');

  equal(everydayA1.register, 'informal', 'Everyday A1 task uses an informal register');
  equal(everydayA2.register, 'neutral', 'Everyday service writing uses a neutral register');
  equal(professionalB1.register, 'professional_neutral', 'Professional B1 task uses workplace-neutral register');
  equal(professionalB2.register, 'formal', 'Professional B2 task uses a formal register');
  check(everydayA1.scaffolding.showPhraseBank && everydayA2.scaffolding.showPhraseBank, 'A1/A2 tasks provide optional phrase scaffolding');
  check(!everydayB1.scaffolding.showPhraseBank && !professionalB1.scaffolding.showPhraseBank && !professionalB2.scaffolding.showPhraseBank, 'B1/B2 tasks reduce phrase scaffolding');
  deepEqual(everydayA1.requiredEntitlements, ['learnAccess'], 'Everyday Writing consumes the existing Learn entitlement');
  deepEqual(professionalB1.requiredEntitlements, ['professionalAccess'], 'Professional Writing consumes the existing Professional entitlement');
  check(professionalB1.privacyNotice.includes('fiktiivisiä'), 'Professional task warns learners to use fictional details');

  for (const task of WRITING_TASKS) {
    const descriptor = engine.buildWritingTaskDescriptor(task);
    equal(descriptor.taskId, task.taskId, `Descriptor preserves ${task.taskId}`);
    equal(descriptor.contentVersion, task.contentVersion, `Descriptor versions ${task.taskId}`);
    equal(descriptor.launch.route, task.pathway === 'professional' ? '/professional/writing' : '/learn/writing', `Descriptor routes ${task.taskId}`);
    equal(descriptor.health, 'available', `Descriptor marks ${task.taskId} available`);
  }
}

function testTruthfulDraftStateAndMalformedInput() {
  check(engine.SESSION_ONLY_DRAFT_MESSAGE.includes('only in this open practice'), 'Draft status states the real session-only boundary');
  check(engine.SESSION_ONLY_DRAFT_MESSAGE.includes('discard'), 'Draft status warns about loss on leave or reload');
  check(!/saved|autosav/iu.test(engine.SESSION_ONLY_DRAFT_MESSAGE), 'Session-only status does not claim durable saving');

  const runtimeSources = [
    'engine.js',
    'WritingPracticeScreen.tsx',
    'WritingRouteScreen.tsx',
    join('components', 'WritingFeedbackPanel.tsx'),
  ].map((path) => readFileSync(join(writingRoot, path), 'utf8')).join('\n');
  check(!/AsyncStorage|localStorage|sessionStorage/iu.test(runtimeSources), 'Writing runtime has no hidden persistence mechanism');
  check(!/\bautosav(e|ed|ing)\b/iu.test(runtimeSources), 'Writing runtime makes no autosave claim');
  check(!/fetch\(|apiClient|axios/iu.test(runtimeSources), 'The authored evaluator has no undeclared network boundary');
  check(!/Animated|Reanimated|setInterval|requestAnimationFrame/iu.test(runtimeSources), 'Writing focus state has no looping animation machinery');

  const task = writingTaskById('writing.everyday.library-reply.a1');
  const newSession = engine.createWritingSession(task, '2026-08-16T13:00:00.000Z');
  equal(newSession.draft.status, 'empty', 'New draft starts empty');
  equal(newSession.draft.statusMessage, engine.SESSION_ONLY_DRAFT_MESSAGE, 'New draft immediately states its storage boundary');
  throws(() => engine.createWritingSession({ ...task, feedbackChecks: [] }, '2026-08-16T13:00:00.000Z'), /MISSING_FEEDBACK_CHECKS/, 'Malformed task is rejected');
  throws(() => engine.moveToPlanning({ ...newSession, stage: 'write' }), /INVALID_STAGE_FOR_PLANNING/, 'Invalid stage transition is rejected');
  throws(() => engine.updateWritingPlan(engine.moveToPlanning(newSession), 'unknown', 'x'), /UNKNOWN_PLAN_PROMPT/, 'Unknown planning field is rejected');
  rejects(
    () => engine.submitWriting({ ...newSession, stage: 'write' }, engine.createAuthoredWritingEvaluator(), { attemptId: 'empty', submittedAt: '2026-08-16T13:01:00.000Z' }),
    /EMPTY_WRITING_DRAFT/,
    'Empty draft submission is rejected',
  );
}

function testAccessDecisionsAndStaticGuards() {
  equal(engine.resolveWritingAccess({ pathway: 'everyday', authHydrated: false, learnerId: null, subscriptionLoaded: false, learnAccess: false, professionalAccess: false }).state, 'loading', 'Auth hydration blocks renderer');
  equal(engine.resolveWritingAccess({ pathway: 'everyday', authHydrated: true, learnerId: null, subscriptionLoaded: true, learnAccess: true, professionalAccess: true }).state, 'auth_required', 'Missing learner blocks renderer');
  equal(engine.resolveWritingAccess({ pathway: 'everyday', authHydrated: true, learnerId: 'learner', subscriptionLoaded: false, learnAccess: false, professionalAccess: false }).state, 'loading', 'Subscription hydration blocks renderer');
  equal(engine.resolveWritingAccess({ pathway: 'everyday', authHydrated: true, learnerId: 'learner', subscriptionLoaded: true, learnAccess: false, professionalAccess: true }).state, 'entitlement_required', 'Learn denial remains enforced');
  equal(engine.resolveWritingAccess({ pathway: 'professional', authHydrated: true, learnerId: 'learner', subscriptionLoaded: true, learnAccess: true, professionalAccess: false }).state, 'entitlement_required', 'Professional denial remains enforced');
  equal(engine.resolveWritingAccess({ pathway: 'everyday', authHydrated: true, learnerId: 'learner', subscriptionLoaded: true, learnAccess: true, professionalAccess: false }).state, 'ready', 'Learn entitlement allows Everyday Writing');
  equal(engine.resolveWritingAccess({ pathway: 'professional', authHydrated: true, learnerId: 'learner', subscriptionLoaded: true, learnAccess: true, professionalAccess: true }).state, 'ready', 'Professional entitlement allows Professional Writing');

  const routeSource = readFileSync(join(writingRoot, 'WritingRouteScreen.tsx'), 'utf8');
  check(routeSource.includes("../../state/authStore"), 'Route consumes the canonical auth store');
  check(routeSource.includes("../../state/subscriptionStore"), 'Route consumes the canonical subscription store');
  check(routeSource.includes('entitlements?.learnAccess'), 'Route checks Learn entitlement without inventing access');
  check(routeSource.includes('entitlements?.professionalAccess'), 'Route checks Professional entitlement without inventing access');
  check(!routeSource.includes('setActiveContext'), 'Writing route does not mutate the selected Professional context');

  const rendererSource = readFileSync(join(writingRoot, 'WritingPracticeScreen.tsx'), 'utf8');
  check(rendererSource.includes('KeyboardAvoidingView'), 'Shared renderer is keyboard safe');
  check(rendererSource.includes('keyboardDismissMode="on-drag"'), 'Keyboard dismissal is explicit');
  check(rendererSource.includes('keyboardShouldPersistTaps="handled"'), 'Keyboard tap behavior is explicit');
  check(rendererSource.includes('accessibilityLiveRegion="polite"'), 'Draft status is announced accessibly');

  const everydayRoute = readFileSync(join(clientRoot, 'app', 'learn', 'writing.tsx'), 'utf8');
  const professionalRoute = readFileSync(join(clientRoot, 'app', 'professional', 'writing.tsx'), 'utf8');
  check(everydayRoute.includes('WritingRouteScreen pathway="everyday"'), 'Everyday route uses the shared renderer boundary');
  check(professionalRoute.includes('WritingRouteScreen pathway="professional"'), 'Professional route uses the same renderer boundary');
}

function testHealthcareMigrationSafety() {
  const scenario = {
    id: 'legacy-example',
    profession: 'nurse',
    title: 'Legacy report example',
    workplaceContext: 'Fictional context',
    taskInstruction: 'Write a short report.',
    reportType: 'shift_note',
    keyFacts: ['Fact one'],
    checklist: ['Check one'],
    usefulPhrases: ['Phrase one'],
    modelAnswer: 'A legacy model answer must never be migrated as learner feedback.',
  };
  const migration = describeHealthcareWritingMigration(scenario);
  equal(migration.activation, 'integration_required', 'Healthcare migration is explicitly inactive');
  equal(migration.descriptor.health, 'degraded', 'Inactive Healthcare adapter is not advertised as available');
  equal(migration.descriptor.featureFlag, 'writing_healthcare_task_family', 'Healthcare activation requires an explicit feature flag');
  check(migration.excludedLegacyFields.includes('modelAnswer'), 'Healthcare strategy explicitly excludes model-answer copying');
  check(!JSON.stringify(migration.taskSeed).includes(scenario.modelAnswer), 'Legacy model answer is absent from the task seed');
  equal(migration.legacyOwnerPath, 'apps/client/features/professional/screens/HealthcareReportWritingScreen.tsx', 'Adapter documents current legacy ownership');

  const legacyScreen = join(clientRoot, 'features', 'professional', 'screens', 'HealthcareReportWritingScreen.tsx');
  const legacyRoute = join(clientRoot, 'state', 'ProfessionalRoute.tsx');
  if (existsSync(legacyScreen) && existsSync(legacyRoute)) {
    const screenSource = readFileSync(legacyScreen, 'utf8');
    const routeSource = readFileSync(legacyRoute, 'utf8');
    check(screenSource.includes('modelAnswer'), 'Existing Healthcare screen remains its legacy implementation');
    check(routeSource.includes('HealthcareReportWritingScreen'), 'Existing Professional route still owns Healthcare Report Writing');
    check(!routeSource.includes('features/writing'), 'Legacy Healthcare route is not silently redirected to the new engine');
  } else {
    console.info('LEGACY_SOURCE_CHECK=EXTERNAL_DIFF_REQUIRED (source bundle contains only Agent D additions)');
  }
}

await testCanonicalRevisionLoop();
await testFocusedFeedbackBoundary();
await testEvaluationFailurePreservesDraft();
await testFailedRevisionOrdering();
testTaskFamiliesAndVersions();
await testTruthfulDraftStateAndMalformedInput();
testAccessDecisionsAndStaticGuards();
testHealthcareMigrationSafety();

console.info(`AGENT_D_WRITING_ASSERTIONS=${assertionCount}`);
console.info('FEATURE_TESTS=PASS');
console.info('NEGATIVE_PATH_TESTS=PASS');
console.info('REGRESSION_GUARDS=PASS');
