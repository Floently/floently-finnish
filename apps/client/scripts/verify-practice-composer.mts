import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  composePracticeSession,
  recomposePracticeSession,
  summarizePracticeSession,
  type DurablePracticeEvidence,
  type PracticeComposerInput,
} from '../features/practice/composer.ts';
import {
  getPathwayDailyPracticePreset,
  getPracticeEntryPreset,
} from '../features/practice/pathwayAdapters.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

const baseTask = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 'learning.v1',
  taskId: 'task-base',
  contentVersion: 'v1',
  runtime: 'cards',
  pathway: 'everyday',
  skills: ['vocabulary'],
  levelBand: 'B1-B2',
  estimatedMinutes: 5,
  modality: { visual: true },
  requiredEntitlements: ['learn'],
  launch: { route: '/cards' },
  health: 'available',
  ...overrides,
}) as any;

const baseInput = (overrides: Partial<PracticeComposerInput> = {}): PracticeComposerInput => ({
  learnerId: 'learner-1',
  createdAt: '2026-08-16T17:00:00.000Z',
  scope: 'all',
  targetMinutes: 10,
  candidates: [
    baseTask({ taskId: 'task-a', skills: ['reading'], estimatedMinutes: 5 }),
    baseTask({ taskId: 'task-b', skills: ['speaking'], estimatedMinutes: 5 }),
  ],
  entitlements: ['learn'],
  profession: 'nurse',
  modalities: { audio: true, microphone: true, keyboard: true },
  ...overrides,
});

function taskIds(input: PracticeComposerInput) {
  return composePracticeSession(input).manifest.tasks.map((item) => item.task.taskId);
}

// Determinism: complete manifest identity and order must repeat exactly.
{
  const input = baseInput();
  const first = composePracticeSession(input);
  const second = composePracticeSession(input);
  assert.deepEqual(second, first);
  console.log('PRACTICE_DETERMINISTIC_MANIFEST=PASS');
}

// Hard filters: unavailable and degraded-by-default.
{
  const unavailable = baseTask({ taskId: 'off', health: 'unavailable' });
  const degraded = baseTask({ taskId: 'degraded', health: 'degraded' });
  const result = composePracticeSession(baseInput({ candidates: [unavailable, degraded] }));
  assert.equal(result.manifest.tasks.length, 0);
  assert.ok(result.diagnostics.some((item) => item.taskId === 'off' && item.code === 'unavailable'));
  assert.ok(result.diagnostics.some((item) => item.taskId === 'degraded' && item.code === 'degraded_excluded'));
  assert.deepEqual(taskIds(baseInput({ candidates: [degraded], allowDegraded: true })), ['degraded']);
  console.log('PRACTICE_HEALTH_FILTERS=PASS');
}

// Descriptor product truth fails closed on malformed launch/entitlement data.
{
  const missingRoute = baseTask({ taskId: 'missing-route', launch: { route: ' ' } });
  const blankEntitlement = baseTask({ taskId: 'blank-entitlement', requiredEntitlements: [' '] });
  const result = composePracticeSession(baseInput({ candidates: [missingRoute, blankEntitlement] }));
  assert.equal(result.manifest.tasks.length, 0);
  assert.ok(result.diagnostics.every((item) => item.code === 'invalid_descriptor'));
  console.log('PRACTICE_MALFORMED_DESCRIPTOR=PASS');
}

// Entitlement declarations are scheduling filters, never substitutes for runtime auth.
{
  const paid = baseTask({ taskId: 'paid', requiredEntitlements: ['professional'] });
  const result = composePracticeSession(baseInput({ candidates: [paid], entitlements: ['learn'] }));
  assert.equal(result.manifest.tasks.length, 0);
  assert.equal(result.diagnostics[0]?.code, 'missing_entitlement');
  console.log('PRACTICE_ENTITLEMENT_DECLARATION_FILTER=PASS');
}

// Scope, profession, level, prerequisites, and feature availability.
{
  const scopeMismatch = baseTask({ taskId: 'professional-scope', pathway: 'professional' });
  const wrongProfession = baseTask({ taskId: 'doctor-only', pathway: 'professional', profession: 'doctor' });
  const wrongLevel = baseTask({ taskId: 'c1', levelBand: 'C1-C2' });
  const prerequisite = baseTask({ taskId: 'prereq', prerequisites: ['unit-7'] });
  const flagged = baseTask({ taskId: 'flagged', featureFlag: 'new-runtime' });
  const scopeResult = composePracticeSession(baseInput({ candidates: [scopeMismatch], scope: 'everyday' }));
  assert.equal(scopeResult.diagnostics[0]?.code, 'scope_mismatch');

  const result = composePracticeSession(baseInput({
    candidates: [wrongProfession, wrongLevel, prerequisite, flagged],
    allowedLevelBands: ['B1-B2'],
  }));
  const codes = new Map(result.diagnostics.map((item) => [item.taskId, item.code]));
  assert.equal(codes.get('doctor-only'), 'profession_mismatch');
  assert.equal(codes.get('c1'), 'level_mismatch');
  assert.equal(codes.get('prereq'), 'missing_prerequisite');
  assert.equal(codes.get('flagged'), 'feature_disabled');
  console.log('PRACTICE_SCOPE_PROFESSION_LEVEL_PREREQUISITE_FEATURE_FILTERS=PASS');
}

// Modality filters: microphone, audio, keyboard.
{
  const microphone = baseTask({ taskId: 'mic', modality: { microphone: true } });
  const audio = baseTask({ taskId: 'audio', modality: { audio: true } });
  const keyboard = baseTask({ taskId: 'keyboard', modality: { keyboard: true } });
  const result = composePracticeSession(baseInput({
    candidates: [microphone, audio, keyboard],
    modalities: { microphone: false, audio: false, keyboard: false },
  }));
  const codes = new Map(result.diagnostics.map((item) => [item.taskId, item.code]));
  assert.equal(codes.get('mic'), 'microphone_unavailable');
  assert.equal(codes.get('audio'), 'audio_unavailable');
  assert.equal(codes.get('keyboard'), 'keyboard_unavailable');
  console.log('PRACTICE_MODALITY_FILTERS=PASS');
}

// Time is a hard upper budget and is not padded.
{
  const tooLong = baseTask({ taskId: 'long', estimatedMinutes: 10 });
  const short = baseTask({ taskId: 'short', estimatedMinutes: 5 });
  const result = composePracticeSession(baseInput({
    targetMinutes: 10,
    availableMinutes: 5,
    candidates: [tooLong, short],
  }));
  assert.deepEqual(result.manifest.tasks.map((item) => item.task.taskId), ['short']);
  assert.equal(result.totalMinutes, 5);
  assert.ok(result.totalMinutes <= 5);
  assert.ok(result.diagnostics.some((item) => item.taskId === 'long' && item.code === 'time_budget'));
  console.log('PRACTICE_TIME_BUDGET=PASS');
}

// YKI practice/mock/full-exam boundary.
{
  const practice = baseTask({ taskId: 'yki-practice', runtime: 'yki', pathway: 'yki', ykiMode: 'practice', requiredEntitlements: ['yki'] });
  const mock = baseTask({ taskId: 'yki-mock', runtime: 'yki', pathway: 'yki', ykiMode: 'mock', requiredEntitlements: ['yki'] });
  const exam = baseTask({ taskId: 'yki-exam', runtime: 'yki', pathway: 'yki', ykiMode: 'full_exam', requiredEntitlements: ['yki'] });
  const result = composePracticeSession(baseInput({ candidates: [practice, mock, exam], entitlements: ['yki'], scope: 'yki' }));
  assert.deepEqual(result.manifest.tasks.map((item) => item.task.taskId), ['yki-practice']);
  assert.ok(result.diagnostics.some((item) => item.taskId === 'yki-mock' && item.code === 'yki_mode_boundary'));
  assert.ok(result.diagnostics.some((item) => item.taskId === 'yki-exam' && item.code === 'yki_mode_boundary'));
  console.log('PRACTICE_YKI_BOUNDARY=PASS');
}

// Curriculum mode cannot invent learner-specific need language.
{
  const result = composePracticeSession(baseInput({ evidence: [] }));
  const reasons = result.manifest.tasks.flatMap((item) => item.reasons);
  assert.ok(reasons.length > 0);
  assert.ok(reasons.every((reason) => reason.evidenceMode === 'curriculum'));
  const copy = reasons.map((reason) => reason.message.toLowerCase()).join(' ');
  assert.equal(copy.includes('weak at'), false);
  assert.equal(copy.includes('missed this'), false);
  assert.equal(copy.includes('overdue'), false);
  assert.equal(copy.includes('saved practice evidence'), false);
  console.log('PRACTICE_CURRICULUM_TRUTH=PASS');
}

// Learner mode uses only valid, matching durable evidence.
{
  const durable: DurablePracticeEvidence = {
    durable: true,
    learnerId: 'learner-1',
    sourceEvidenceId: 'evidence-1',
    observedAt: '2026-08-15T10:00:00.000Z',
    taskId: 'task-b',
    overdueNeed: 1,
    weaknessNeed: 1,
  };
  const personalized = composePracticeSession(baseInput({ evidence: [durable] }));
  assert.equal(personalized.manifest.tasks[0]?.task.taskId, 'task-b');
  assert.ok(personalized.manifest.tasks[0]?.reasons.some((reason) => reason.evidenceMode === 'learner'));

  const wrongLearner = composePracticeSession(baseInput({
    evidence: [{ ...durable, learnerId: 'learner-2', sourceEvidenceId: 'wrong-user' }],
  }));
  assert.ok(wrongLearner.manifest.tasks.flatMap((item) => item.reasons).every((reason) => reason.evidenceMode === 'curriculum'));

  const malformedDate = composePracticeSession(baseInput({
    evidence: [{ ...durable, observedAt: 'not-a-date', sourceEvidenceId: 'bad-date' }],
  }));
  assert.ok(malformedDate.manifest.tasks.flatMap((item) => item.reasons).every((reason) => reason.evidenceMode === 'curriculum'));

  const malformedDurability = composePracticeSession(baseInput({
    evidence: [{ ...durable, durable: false, sourceEvidenceId: 'not-durable' } as any],
  }));
  assert.ok(malformedDurability.manifest.tasks.flatMap((item) => item.reasons).every((reason) => reason.evidenceMode === 'curriculum'));
  console.log('PRACTICE_DURABLE_EVIDENCE_BOUNDARY=PASS');
}

// Repetition requires matching durable task history. Skill history must not suppress every same-skill task.
{
  const recent: DurablePracticeEvidence = {
    durable: true,
    learnerId: 'learner-1',
    sourceEvidenceId: 'recent-1',
    observedAt: '2026-08-16T16:00:00.000Z',
    taskId: 'task-a',
    recentlyPracticed: true,
  };
  const result = composePracticeSession(baseInput({ evidence: [recent] }));
  assert.equal(result.manifest.tasks.some((item) => item.task.taskId === 'task-a'), false);
  assert.ok(result.diagnostics.some((item) => item.taskId === 'task-a' && item.code === 'recent_repetition'));

  const sharedSkillTasks = [
    baseTask({ taskId: 'vocab-a', skills: ['vocabulary'] }),
    baseTask({ taskId: 'vocab-b', skills: ['vocabulary'] }),
  ];
  const skillOnlyRecent: DurablePracticeEvidence = {
    durable: true,
    learnerId: 'learner-1',
    sourceEvidenceId: 'skill-recent',
    observedAt: '2026-08-16T16:00:00.000Z',
    skill: 'vocabulary',
    recentlyPracticed: true,
  };
  const skillResult = composePracticeSession(baseInput({ candidates: sharedSkillTasks, evidence: [skillOnlyRecent] }));
  assert.equal(skillResult.manifest.tasks.length, 2);
  assert.equal(skillResult.diagnostics.some((item) => item.code === 'recent_repetition'), false);
  console.log('PRACTICE_REPETITION_EVIDENCE=PASS');
}

// Context coherence is explainable and can deterministically resolve an otherwise close choice.
{
  const contextA = baseTask({ taskId: 'context-a', contextId: 'mission-a', estimatedMinutes: 5 });
  const contextB = baseTask({ taskId: 'context-b', contextId: 'mission-b', estimatedMinutes: 5 });
  const result = composePracticeSession(baseInput({ candidates: [contextA, contextB], preferredContextId: 'mission-b', targetMinutes: 5 }));
  assert.equal(result.manifest.tasks[0]?.task.taskId, 'context-b');
  assert.ok(result.manifest.tasks[0]?.reasons.some((reason) => reason.code === 'context_coherence'));
  console.log('PRACTICE_CONTEXT_COHERENCE=PASS');
}

// Skip/another/no-microphone/shorter remain deterministic and explicit.
{
  const micTask = baseTask({ taskId: 'mic-task', modality: { microphone: true }, estimatedMinutes: 5 });
  const visualTask = baseTask({ taskId: 'visual-task', modality: { visual: true }, estimatedMinutes: 5 });
  const input = baseInput({ candidates: [micTask, visualTask], targetMinutes: 10 });
  const current = composePracticeSession(input).manifest.tasks[0]?.task.taskId;
  assert.ok(current);

  const skipA = recomposePracticeSession(input, 'skip', current);
  const skipB = recomposePracticeSession(input, 'skip', current);
  assert.deepEqual(skipA, skipB);
  assert.equal(skipA.manifest.tasks.some((item) => item.task.taskId === current), false);
  assert.ok(skipA.diagnostics.some((item) => item.taskId === current && item.code === 'explicitly_excluded'));

  const another = recomposePracticeSession(input, 'another', current);
  assert.equal(another.manifest.tasks.some((item) => item.task.taskId === current), false);

  const noMic = recomposePracticeSession(input, 'no_microphone');
  assert.equal(noMic.manifest.tasks.some((item) => item.task.modality.microphone), false);
  assert.ok(noMic.diagnostics.some((item) => item.taskId === 'mic-task' && item.code === 'microphone_unavailable'));

  const shorter = recomposePracticeSession(baseInput({ targetMinutes: 20 }), 'shorter');
  assert.equal(shorter.manifest.targetMinutes, 10);
  assert.ok(shorter.totalMinutes <= 10);
  console.log('PRACTICE_RECOMPOSITION_CONTROLS=PASS');
}

// Empty pool must be explicit and non-throwing.
{
  const result = composePracticeSession(baseInput({ candidates: [] }));
  assert.equal(result.manifest.tasks.length, 0);
  assert.equal(result.totalMinutes, 0);
  console.log('PRACTICE_EMPTY_POOL=PASS');
}

// Truthful summary includes only explicitly completed IDs present in the manifest.
{
  const result = composePracticeSession(baseInput());
  const first = result.manifest.tasks[0]?.task.taskId;
  assert.ok(first);
  const summary = summarizePracticeSession(result.manifest, [first], ['not-in-manifest']);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.skippedCount, 0);
  assert.equal(summary.message.includes('mastered'), false);
  console.log('PRACTICE_TRUTHFUL_SUMMARY=PASS');
}

// Pathway Daily Practice adapters remain narrow deterministic presets.
{
  assert.deepEqual(getPracticeEntryPreset('practice-hub'), {
    source: 'practice-hub', scope: 'all', targetMinutes: 10,
  });
  assert.equal(getPathwayDailyPracticePreset('everyday').scope, 'everyday');
  assert.equal(getPathwayDailyPracticePreset('professional').scope, 'professional');
  assert.equal(getPathwayDailyPracticePreset('yki').scope, 'yki');
  assert.equal(getPathwayDailyPracticePreset('yki').targetMinutes, 10);
  console.log('PRACTICE_PATHWAY_ADAPTERS=PASS');
}

// Composer contains orchestration only; accessibility/state cues are static and explicit.
{
  const composerSource = fs.readFileSync(path.resolve(here, '../features/practice/composer.ts'), 'utf8');
  const controlsSource = fs.readFileSync(path.resolve(here, '../features/practice/PracticeControls.tsx'), 'utf8');
  const routeSource = fs.readFileSync(path.resolve(here, '../features/practice/PracticeRoute.tsx'), 'utf8');
  const runtimeImport = /from\s+['"][^'"]*(cards|roleplay|yki|reading|writing)[^'"]*['"]/i;
  assert.equal(runtimeImport.test(composerSource), false);
  assert.equal(composerSource.includes('Math.random'), false);
  assert.ok(controlsSource.includes('accessibilityState={{ selected }}'));
  assert.ok(controlsSource.includes('minHeight: 44'));
  assert.ok(routeSource.includes('accessibilityLiveRegion="polite"'));
  assert.equal(/withRepeat|Animated\.loop|Math\.random/.test(`${controlsSource}\n${routeSource}`), false);
  console.log('PRACTICE_ACCESSIBILITY_AND_NO_ENGINE_LOGIC=PASS');
}

console.log('PRACTICE_COMPOSER_VERIFIER=PASS');
