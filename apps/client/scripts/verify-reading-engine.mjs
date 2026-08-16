import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BASE_SHA = '69813b433838130d5afe4b052360dbfd12df3f40';

async function importTypeScript(relativePath) {
  const source = readFileSync(path.join(ROOT, relativePath), 'utf8');
  const javascript = stripTypeScriptTypes(source, { mode: 'transform' });
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

const engine = await importTypeScript('apps/client/features/reading/readingEngine.ts');
const content = await importTypeScript('apps/client/features/reading/readingTasks.ts');

let passed = 0;
function test(name, run) {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function correctResponse(question) {
  if (
    question.type === 'detail' ||
    question.type === 'main_idea' ||
    question.type === 'contextual_vocabulary' ||
    question.type === 'inference'
  ) {
    return { kind: 'choice', optionId: question.correctOptionId };
  }
  if (question.type === 'sequencing') {
    return { kind: 'sequence', order: [...question.correctOrder] };
  }
  return { kind: 'matching', pairs: { ...question.correctPairs } };
}

function incorrectResponse(question) {
  if (
    question.type === 'detail' ||
    question.type === 'main_idea' ||
    question.type === 'contextual_vocabulary' ||
    question.type === 'inference'
  ) {
    return {
      kind: 'choice',
      optionId: question.options.find((option) => option.id !== question.correctOptionId).id,
    };
  }
  if (question.type === 'sequencing') {
    return { kind: 'sequence', order: [...question.correctOrder].reverse() };
  }
  const entries = Object.entries(question.correctPairs);
  const matchIds = entries.map(([, matchId]) => matchId).reverse();
  return {
    kind: 'matching',
    pairs: Object.fromEntries(entries.map(([promptId], index) => [promptId, matchIds[index]])),
  };
}

function completeCorrectly(task, initialState = engine.createReadingSession(task)) {
  let state = initialState.phase === 'reading'
    ? engine.startReadingQuestions(initialState, task)
    : initialState;
  while (state.phase !== 'complete') {
    const question = task.questions[state.currentQuestionIndex];
    state = engine.submitReadingResponse({
      state,
      task,
      response: correctResponse(question),
      submittedAt: `2026-08-16T10:${String(state.currentQuestionIndex).padStart(2, '0')}:00.000Z`,
    });
    state = engine.continueReadingSession(state, task);
  }
  return state;
}

const everydayA1 = content.findReadingTaskById('reading.everyday.a1.library-hours');
const everydayA2 = content.findReadingTaskById('reading.everyday.a2.water-outage');
const everydayB2 = content.findReadingTaskById('reading.everyday.b2.energy-pilot');
const professional = content.findReadingTaskById('reading.professional.b2.shift-swap');
assert.ok(everydayA1 && everydayA2 && everydayB2 && professional);

test('all representative content validates and is original', () => {
  assert.equal(content.READING_TASKS.length, 5);
  const taskIds = new Set();
  const families = new Set();
  for (const task of content.READING_TASKS) {
    const validation = engine.validateReadingTask(task);
    assert.equal(validation.ok, true, validation.errors?.join('; '));
    assert.equal(task.provenance.license, 'KieliValmis-original');
    assert.match(task.provenance.sourceNote, /Not adapted from YKI/);
    assert.equal(taskIds.has(task.taskId), false);
    taskIds.add(task.taskId);
    task.questions.forEach((question) => families.add(question.type));
  }
  assert.deepEqual(
    [...families].sort(),
    ['contextual_vocabulary', 'detail', 'inference', 'main_idea', 'matching', 'sequencing'],
  );
});

test('correct answer produces correct feedback state', () => {
  const reading = engine.startReadingQuestions(engine.createReadingSession(everydayA1), everydayA1);
  const next = engine.submitReadingResponse({
    state: reading,
    task: everydayA1,
    response: correctResponse(everydayA1.questions[0]),
    submittedAt: '2026-08-16T10:00:00.000Z',
  });
  assert.equal(next.phase, 'feedback');
  assert.equal(next.lastAttempt.correct, true);
  assert.equal(next.lastAttempt.attemptNumber, 1);
});

test('incorrect answer requires correction and retry increments attempt', () => {
  let state = engine.startReadingQuestions(engine.createReadingSession(everydayA1), everydayA1);
  state = engine.submitReadingResponse({
    state,
    task: everydayA1,
    response: incorrectResponse(everydayA1.questions[0]),
    submittedAt: '2026-08-16T10:00:00.000Z',
  });
  assert.equal(state.lastAttempt.correct, false);
  assert.throws(() => engine.continueReadingSession(state, everydayA1), /correct answer/);
  state = engine.retryReadingQuestion(state, everydayA1);
  assert.equal(state.phase, 'question');
  state = engine.submitReadingResponse({
    state,
    task: everydayA1,
    response: correctResponse(everydayA1.questions[0]),
    submittedAt: '2026-08-16T10:01:00.000Z',
  });
  assert.equal(state.lastAttempt.correct, true);
  assert.equal(state.lastAttempt.attemptNumber, 2);
  assert.throws(() => engine.retryReadingQuestion(state, everydayA1), /incorrect answer/);
});

test('malformed tasks fail closed with useful validation errors', () => {
  const malformed = structuredClone(everydayA1);
  malformed.document.segments[0].text = '';
  malformed.questions[0].correctOptionId = 'missing-option';
  malformed.questions[0].options[0].label = '';
  malformed.provenance.license = 'unknown';
  const result = engine.validateReadingTask(malformed);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('document segment')));
  assert.ok(result.errors.some((error) => error.includes('correctOptionId')));
  assert.ok(result.errors.some((error) => error.includes('readable labels')));
  assert.ok(result.errors.some((error) => error.includes('provenance')));
  assert.equal(engine.validateReadingTask(null).ok, false);
});

test('result preserves task and content versions', () => {
  const state = completeCorrectly(everydayA1);
  const result = engine.toReadingTaskResult({
    task: everydayA1,
    state,
    attemptId: 'attempt-fixed',
    startedAt: '2026-08-16T10:00:00.000Z',
    completedAt: '2026-08-16T10:05:00.000Z',
  });
  assert.equal(result.schemaVersion, 'learning.v1');
  assert.equal(result.taskId, everydayA1.taskId);
  assert.equal(result.contentVersion, everydayA1.contentVersion);
  assert.equal(result.attemptId, 'attempt-fixed');
  assert.equal(result.score, everydayA1.questions.length);
  assert.throws(
    () => engine.toReadingTaskResult({
      task: everydayA1,
      state: engine.createReadingSession(everydayA1),
      attemptId: 'early',
      startedAt: '2026-08-16T10:00:00.000Z',
      completedAt: '2026-08-16T10:00:01.000Z',
    }),
    /completed reading session/,
  );
});

test('result adapter is deterministic for fixed inputs', () => {
  const args = {
    task: everydayA2,
    state: completeCorrectly(everydayA2),
    attemptId: 'deterministic-attempt',
    startedAt: '2026-08-16T11:00:00.000Z',
    completedAt: '2026-08-16T11:05:00.000Z',
  };
  const first = engine.toReadingTaskResult(args);
  const second = engine.toReadingTaskResult(args);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test('corrected answers are preserved without inflating first-try score', () => {
  let state = engine.startReadingQuestions(engine.createReadingSession(everydayA1), everydayA1);
  const firstQuestion = everydayA1.questions[0];
  state = engine.submitReadingResponse({
    state,
    task: everydayA1,
    response: incorrectResponse(firstQuestion),
    submittedAt: '2026-08-16T12:00:00.000Z',
  });
  state = engine.retryReadingQuestion(state, everydayA1);
  state = engine.submitReadingResponse({
    state,
    task: everydayA1,
    response: correctResponse(firstQuestion),
    submittedAt: '2026-08-16T12:01:00.000Z',
  });
  state = engine.continueReadingSession(state, everydayA1);
  state = completeCorrectly(everydayA1, state);
  const summary = engine.summarizeReadingSession(state, everydayA1);
  assert.equal(summary.correctedCount, 1);
  assert.equal(summary.firstTryCorrect, everydayA1.questions.length - 1);
});

test('Everyday and Professional task resolution remains scoped', () => {
  assert.equal(content.getReadingTasks('everyday').length, 4);
  assert.equal(content.getReadingTasks('professional').length, 1);
  assert.equal(
    content.resolveReadingTask({ scope: 'everyday', taskId: professional.taskId }).status,
    'not_found',
  );
  assert.equal(
    content.resolveReadingTask({ scope: 'professional', taskId: everydayA1.taskId }).status,
    'not_found',
  );
  assert.equal(content.resolveReadingTask({ scope: 'everyday', level: 'C1' }).status, 'invalid_level');
  assert.equal(content.resolveReadingTask({ scope: 'professional', level: 'A1' }).status, 'empty');
});

test('CEFR scaffolding fades monotonically by level', () => {
  const levels = ['A1', 'A2', 'B1', 'B2'];
  assert.deepEqual(levels.map((level) => engine.getReadingScaffolding(level).supportScore), [4, 3, 2, 1]);
  assert.equal(engine.getReadingScaffolding('A1').chunkDocument, true);
  assert.equal(engine.getReadingScaffolding('A1').showStrategyHints, true);
  assert.equal(engine.getReadingScaffolding('B2').chunkDocument, false);
  assert.equal(engine.getReadingScaffolding('B2').showStrategyHints, false);
  assert.equal(engine.getReadingScaffolding('B2').showReadingGoal, false);
});

test('matching and sequencing grading reject malformed responses', () => {
  const sequence = everydayA2.questions.find((question) => question.type === 'sequencing');
  const matching = everydayB2.questions.find((question) => question.type === 'matching');
  assert.ok(sequence && matching);
  assert.equal(engine.gradeReadingResponse(sequence, correctResponse(sequence)), true);
  assert.equal(engine.gradeReadingResponse(sequence, { kind: 'sequence', order: sequence.correctOrder.slice(0, 1) }), false);
  assert.equal(engine.gradeReadingResponse(matching, correctResponse(matching)), true);
  assert.equal(engine.gradeReadingResponse(matching, { kind: 'matching', pairs: {} }), false);
  assert.equal(
    engine.gradeReadingResponse(matching, {
      kind: 'matching',
      pairs: { ...matching.correctPairs, unexpected: 'extra' },
    }),
    false,
  );
  assert.equal(engine.gradeReadingResponse(matching, { kind: 'choice', optionId: 'anything' }), false);
  assert.equal(engine.gradeReadingResponse(matching, null), false);
});

test('TaskDescriptor adapter uses reserved routes and frozen contract shape', () => {
  const everydayDescriptor = engine.toReadingTaskDescriptor(everydayA1);
  const professionalDescriptor = engine.toReadingTaskDescriptor(professional);
  assert.equal(everydayDescriptor.runtime, 'reading');
  assert.equal(everydayDescriptor.launch.route, '/learn/reading');
  assert.deepEqual(everydayDescriptor.requiredEntitlements, ['learnAccess']);
  assert.equal(professionalDescriptor.launch.route, '/professional/reading');
  assert.deepEqual(professionalDescriptor.requiredEntitlements, ['professionalAccess']);
  assert.notEqual(everydayDescriptor.launch.route, '/read');
  assert.notEqual(professionalDescriptor.launch.route, '/read');
});

test('access decisions fail closed without auth or loaded entitlement state', () => {
  const base = {
    scope: 'everyday',
    authHydrated: true,
    userPresent: true,
    subscriptionLoaded: true,
    subscriptionLoading: false,
    isPreview: false,
    isInternalAllAccess: false,
    learnAccess: true,
    professionalAccess: false,
  };
  assert.equal(engine.resolveReadingAccess({ ...base, authHydrated: false }), 'loading');
  assert.equal(engine.resolveReadingAccess({ ...base, userPresent: false }), 'auth_required');
  assert.equal(engine.resolveReadingAccess({ ...base, subscriptionLoaded: false }), 'loading');
  assert.equal(engine.resolveReadingAccess({ ...base, subscriptionLoading: true }), 'loading');
  assert.equal(engine.resolveReadingAccess(base), 'allowed');
  assert.equal(engine.resolveReadingAccess({ ...base, learnAccess: false }), 'entitlement_required');
  assert.equal(engine.resolveReadingAccess({ ...base, isPreview: true }), 'entitlement_required');
  assert.equal(
    engine.resolveReadingAccess({ ...base, scope: 'professional', professionalAccess: false }),
    'entitlement_required',
  );
  assert.equal(
    engine.resolveReadingAccess({ ...base, scope: 'professional', professionalAccess: true }),
    'allowed',
  );
  assert.equal(
    engine.resolveReadingAccess({ ...base, learnAccess: false, isInternalAllAccess: true }),
    'allowed',
  );
});

test('accessibility and calm-reading regression guards are present', () => {
  const files = [
    'apps/client/features/reading/ReadingRuntimeScreen.tsx',
    'apps/client/features/reading/components/ReadingDocumentCard.tsx',
    'apps/client/features/reading/components/ReadingQuestionCard.tsx',
    'apps/client/features/reading/components/ReadingStatePanel.tsx',
  ];
  const source = files.map((file) => readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
  assert.match(source, /accessibilityRole="header"/);
  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /accessibilityState=\{\{/);
  assert.match(source, /minHeight: 48/);
  assert.doesNotMatch(source, /\bAnimated\b|setInterval|withRepeat|autoplay/);
  assert.doesNotMatch(source, /numberOfLines=/);
});

test('/read remains separate from the canonical Reading runtime', () => {
  const readingFiles = [
    'apps/client/app/learn/reading.tsx',
    'apps/client/app/professional/reading.tsx',
    'apps/client/features/reading/ReadingRoute.tsx',
    'apps/client/features/reading/ReadingRuntimeScreen.tsx',
    'apps/client/features/reading/readingEngine.ts',
    'apps/client/features/reading/readingTasks.ts',
  ];
  const source = readingFiles.map((file) => readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /features\/read(?:\/|')|app\/read(?:\/|')/);
  assert.equal(existsSync(path.join(ROOT, 'apps/client/app/learn/reading.tsx')), true);
  assert.equal(existsSync(path.join(ROOT, 'apps/client/app/professional/reading.tsx')), true);

  let hasBaseCommit = false;
  try {
    execFileSync('git', ['rev-parse', '--verify', `${BASE_SHA}^{commit}`], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    hasBaseCommit = true;
  } catch {
    // The standalone source-evidence runner may not have a local Git object database.
  }
  if (hasBaseCommit) {
    execFileSync(
      'git',
      ['diff', '--quiet', BASE_SHA, '--', 'apps/client/app/read', 'apps/client/features/read'],
      { cwd: ROOT },
    );
  }
});

console.log(`Reading engine verification passed: ${passed} tests.`);
