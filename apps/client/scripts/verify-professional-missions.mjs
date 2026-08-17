import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CANONICAL_PROFESSIONAL_ROUTES,
  INTERVIEW_SCENARIO_BY_PROFESSION,
  PROFESSIONAL_LISTENING_FEATURE_FLAG,
  PROFESSIONAL_MISSIONS,
  PROFESSIONAL_PROFESSIONS,
  PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG,
  PROFESSIONAL_WORK_DOMAINS,
  WORK_DOMAIN_COMMUNICATION_PROFILES,
  adaptIncidentScenarioToMissionSeed,
  adaptWorkTrackToMissionSeed,
  buildInterviewRoleplayDescriptor,
  getMissionById,
  getWorkDomainCommunicationProfile,
  listMissionsForProfession,
  validateProfessionalMission,
  validateProfessionalMissionCatalog,
} from '../../../packages/core/professional/missions.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '../../..');
const baseRef = process.env.WAVE1_BASE_REF || '69813b433838130d5afe4b052360dbfd12df3f40';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectRejected(label, mutate, pattern) {
  const malformed = clone(PROFESSIONAL_MISSIONS[0]);
  mutate(malformed);
  assert.throws(() => validateProfessionalMission(malformed), pattern, label);
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

// Catalog health and deterministic serialization.
validateProfessionalMissionCatalog();
assert.equal(
  JSON.stringify(validateProfessionalMissionCatalog()),
  JSON.stringify(validateProfessionalMissionCatalog()),
  'same catalog input must serialize deterministically',
);
assert.equal(PROFESSIONAL_MISSIONS.length, 3, 'one authored mission is required for every current entitled profession');
assert.deepEqual(
  [...PROFESSIONAL_MISSIONS.map((mission) => mission.profession)].sort(),
  [...PROFESSIONAL_PROFESSIONS].sort(),
  'current entitled professions must each have an authored mission',
);

// Profession leakage must fail closed at every descriptor boundary.
for (const profession of PROFESSIONAL_PROFESSIONS) {
  const missions = listMissionsForProfession(profession);
  assert.ok(missions.length > 0, `${profession} must have at least one mission`);
  for (const mission of missions) {
    assert.equal(mission.profession, profession);
    for (const step of mission.steps) {
      assert.equal(step.task.profession, profession);
      assert.equal(step.task.launch.params.profession, profession);
      assert.ok(step.task.requiredEntitlements.includes(`profession:${profession}`));
      for (const other of PROFESSIONAL_PROFESSIONS.filter((candidate) => candidate !== profession)) {
        assert.ok(!step.task.requiredEntitlements.includes(`profession:${other}`));
      }
    }
  }
}
assert.throws(() => listMissionsForProfession('construction'), /Unknown profession/);

// Mission order, continuity IDs and four-skill metadata are deterministic.
for (const mission of PROFESSIONAL_MISSIONS) {
  assert.deepEqual(mission.steps.map((step) => step.order), [1, 2, 3, 4, 5]);
  assert.equal(new Set(mission.steps.map((step) => step.contextId)).size, 1);
  assert.ok(mission.steps.every((step) => step.task.contextId === mission.contextId));
  assert.ok(mission.steps.every((step) => step.task.levelBand === mission.levelBand));
  const skills = new Set(mission.steps.flatMap((step) => step.task.skills));
  for (const skill of ['listening', 'speaking', 'reading', 'writing']) assert.ok(skills.has(skill), `${mission.missionId} missing ${skill}`);
}

// Canonical runtimes are referenced, never implemented or redirected into YKI.
for (const mission of PROFESSIONAL_MISSIONS) {
  const byRuntime = Object.fromEntries(mission.steps.map((step) => [step.task.runtime, step.task]));
  assert.equal(byRuntime.roleplay.launch.route, CANONICAL_PROFESSIONAL_ROUTES.roleplay);
  assert.equal(byRuntime.roleplay.featureFlag, PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG);
  assert.equal(byRuntime.roleplay.health, 'degraded');
  assert.equal(byRuntime.reading.launch.route, CANONICAL_PROFESSIONAL_ROUTES.reading);
  assert.equal(byRuntime.writing.launch.route, CANONICAL_PROFESSIONAL_ROUTES.writing);
  assert.equal(byRuntime.listening.launch.route, CANONICAL_PROFESSIONAL_ROUTES.listeningFallback);
  assert.equal(byRuntime.listening.featureFlag, PROFESSIONAL_LISTENING_FEATURE_FLAG);
  assert.equal(byRuntime.listening.health, 'unavailable');
  for (const step of mission.steps) {
    assert.notEqual(step.task.runtime, 'yki');
    assert.equal(step.task.ykiMode, undefined);
    assert.equal(step.task.pathway, 'professional');
  }
}

// Content provenance must exist and explicitly exclude YKI/proprietary source material.
for (const mission of PROFESSIONAL_MISSIONS) {
  assert.ok(mission.provenance.provenanceId);
  assert.equal(mission.provenance.origin, 'kielivalmis-original');
  assert.equal(mission.provenance.ykiOrigin, false);
  assert.equal(mission.provenance.proprietaryOrigin, false);
  assert.match(mission.safetyFrame.notice, /Finnish-language communication practice/);
  assert.match(mission.safetyFrame.authorityBoundary, /does not certify professional competence/);
  assert.ok(mission.steps.every((step) => step.content.finnish.trim().length > 20));
}

// Broader Work Path domains remain domain profiles, not invented paid professions.
assert.deepEqual(Object.keys(WORK_DOMAIN_COMMUNICATION_PROFILES).sort(), [...PROFESSIONAL_WORK_DOMAINS].sort());
assert.equal(new Set(PROFESSIONAL_WORK_DOMAINS.map((domain) => getWorkDomainCommunicationProfile(domain).goal)).size, PROFESSIONAL_WORK_DOMAINS.length);
assert.throws(() => getWorkDomainCommunicationProfile('legal'), /Unknown work domain/);

const workTrackSeed = adaptWorkTrackToMissionSeed({
  domain: 'office',
  title: 'Office and Admin Finnish',
  core_tasks: ['calendar coordination', 'status updates'],
  key_language_targets: ['formal requests', 'meeting language'],
});
assert.equal(workTrackSeed.workDomain, 'office');
assert.deepEqual(workTrackSeed.repositorySignals.coreTasks, ['calendar coordination', 'status updates']);
assert.ok(!('profession' in workTrackSeed), 'domain adapters must not manufacture subscription professions');
assert.throws(() => adaptWorkTrackToMissionSeed({ domain: 'law' }), /Unknown work-track domain/);

// Incident adapter intentionally strips operational answer choices/best-response guidance.
const incidentSeed = adaptIncidentScenarioToMissionSeed({
  track: 'construction',
  title: 'Unclear instruction',
  situation: 'A coworker did not understand a spoken instruction.',
  language_targets: ['asking for clarification', 'confirming understanding'],
  response_choices: ['unsafe operational answer', 'another operational answer'],
  best_response: 1,
  follow_up_task: 'Write a short communication note.',
  why: 'Operational rationale that must not leak into language configuration.',
});
assert.equal(incidentSeed.workDomain, 'construction');
assert.deepEqual(incidentSeed.languageTargets, ['asking for clarification', 'confirming understanding']);
assert.ok(!('response_choices' in incidentSeed));
assert.ok(!('best_response' in incidentSeed));
assert.ok(!('why' in incidentSeed));
assert.equal(incidentSeed.provenance.ykiOrigin, false);
assert.equal(incidentSeed.provenance.proprietaryOrigin, false);

// Interview adapter is deterministic and only describes protected Roleplay launch intent.
for (const profession of PROFESSIONAL_PROFESSIONS) {
  const first = buildInterviewRoleplayDescriptor(profession);
  const second = buildInterviewRoleplayDescriptor(profession);
  assert.deepEqual(first, second);
  assert.equal(first.runtime, 'roleplay');
  assert.equal(first.launch.route, '/speaking');
  assert.equal(first.launch.params.profession, profession);
  assert.equal(first.launch.params.scenarioId, INTERVIEW_SCENARIO_BY_PROFESSION[profession]);
  assert.equal(first.health, 'degraded');
}
assert.throws(() => buildInterviewRoleplayDescriptor('retail'), /Unknown profession/);
assert.throws(() => buildInterviewRoleplayDescriptor('nurse', { levelBand: 'B3' }), /Unsupported level band/);

// Malformed mission boundaries fail closed.
expectRejected('profession leakage rejected', (mission) => {
  mission.steps[0].task.profession = 'doctor';
}, /Profession leakage/);
expectRejected('launch profession leakage rejected', (mission) => {
  mission.steps[0].task.launch.params.profession = 'doctor';
}, /Launch profession leakage/);
expectRejected('context drift rejected', (mission) => {
  mission.steps[2].task.contextId = 'other-context';
}, /Context continuity mismatch/);
expectRejected('bad CEFR band rejected', (mission) => {
  mission.levelBand = 'B3';
}, /Unsupported level band/);
expectRejected('missing provenance rejected', (mission) => {
  delete mission.provenance;
}, /provenance is required/);
expectRejected('YKI provenance rejected', (mission) => {
  mission.provenance.ykiOrigin = true;
}, /must not use YKI-origin content/);
expectRejected('proprietary provenance rejected', (mission) => {
  mission.provenance.proprietaryOrigin = true;
}, /must not use proprietary instructional content/);
expectRejected('available unresolved listening rejected', (mission) => {
  mission.steps[0].task.health = 'available';
}, /Listening must remain unavailable/);
expectRejected('invented listening route rejected', (mission) => {
  mission.steps[0].task.launch.route = '/professional/listening';
}, /must fail back to the Professional hub/);
expectRejected('wrong runtime-skill metadata rejected', (mission) => {
  mission.steps[2].task.skills = ['speaking'];
}, /invalid skill metadata/);
expectRejected('non-sequential mission rejected', (mission) => {
  mission.steps[1].order = 7;
}, /step order must be sequential/);

// Stable lookup must return the same immutable source object.
for (const mission of PROFESSIONAL_MISSIONS) assert.equal(getMissionById(mission.missionId), mission);
assert.throws(() => getMissionById('missing-mission'), /Unknown mission/);

// Regression guard: Agent F must not touch protected Roleplay/navigation/runtime files.
let changedFiles = [];
try {
  changedFiles = git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').map((value) => value.trim()).filter(Boolean);
} catch (error) {
  throw new Error(`Unable to verify Agent F protected-file diff against ${baseRef}: ${error instanceof Error ? error.message : String(error)}`);
}
const protectedRoleplayOrNavigation = changedFiles.filter((file) =>
  file === 'apps/client/state/AppShell.tsx' ||
  file === 'apps/client/state/navigationModel.ts' ||
  file === 'apps/backend/app/routers/v1_roleplay.py' ||
  file.startsWith('apps/backend/app/runtime/roleplay') ||
  file.startsWith('apps/backend/app/services/roleplay_') ||
  file.startsWith('apps/client/features/roleplay/') ||
  file.startsWith('.github/workflows/roleplay-'),
);
assert.deepEqual(protectedRoleplayOrNavigation, [], `protected Roleplay/navigation files changed: ${protectedRoleplayOrNavigation.join(', ')}`);

// Static guard: professional mission implementation imports no canonical runtime engine internals.
const missionSource = fs.readFileSync(path.join(repoRoot, 'packages/core/professional/missions.mjs'), 'utf8');
for (const forbiddenImport of [
  'runtime/roleplay',
  'features/roleplay',
  'features/exam',
  'reading-engine',
  'writing-engine',
]) {
  assert.ok(!missionSource.includes(`from '${forbiddenImport}`), `mission model must not import ${forbiddenImport}`);
}

console.log('PROFESSIONAL_MISSION_FEATURE_TESTS=PASS');
console.log('PROFESSION_LEAKAGE_GUARD=PASS');
console.log('MISSION_ORDER_AND_CONTEXT=PASS');
console.log('CANONICAL_RUNTIME_REFERENCES=PASS');
console.log('LEVEL_AND_SKILL_METADATA=PASS');
console.log('MALFORMED_MISSION_REJECTION=PASS');
console.log('CONTENT_PROVENANCE=PASS');
console.log('YKI_CONTENT_SEPARATION=PASS');
console.log('PROTECTED_ROLEPLAY_FILES_UNTOUCHED=PASS');
