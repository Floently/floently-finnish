import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PROFESSIONAL_LISTENING_FEATURE_FLAG,
  PROFESSIONAL_MISSIONS,
  PROFESSIONAL_PROFESSIONS,
  PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG,
} from '../../../packages/core/professional/missions.mjs';
import {
  canUseProfessionalMissionSpeakingPreset,
  parseProfessionalMissionSpeakingParams,
} from '../state/professionalMissionSpeakingParams.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, '..');
const read = (relative) => fs.readFileSync(path.join(clientRoot, relative), 'utf8');

const adapter = read('features/professional/missionRuntimeAdapters.ts');
const practiceAdapter = read('features/professional/missionPracticeEntries.ts');
const registry = read('features/practice/integratedRegistry.ts');
const practiceRoute = read('features/practice/IntegratedPracticeRoute.tsx');
const readingRoute = read('features/reading/ReadingRoute.tsx');
const writingRoute = read('features/writing/WritingRouteScreen.tsx');
const writingScreen = read('features/writing/WritingPracticeScreen.tsx');
const speakingEntry = read('app/speaking/index.tsx');
const missionSpeakingEntry = read('app/speaking/mission.tsx');
const speakingParams = read('state/professionalMissionSpeakingParams.mjs');

assert.equal(PROFESSIONAL_MISSIONS.length, PROFESSIONAL_PROFESSIONS.length);

for (const mission of PROFESSIONAL_MISSIONS) {
  assert.match(adapter, new RegExp(mission.missionId.replaceAll('-', '\\-')),
    `${mission.missionId} must have authored adapter coverage`);
  assert.ok(mission.steps.some((step) => step.stage === 'produce'));
  assert.ok(mission.steps.some((step) => step.stage === 'interpret'));
  assert.ok(mission.steps.some((step) => step.stage === 'document'));

  const roleplayStep = mission.steps.find(
    (step) => step.stage === 'produce' && step.task.runtime === 'roleplay',
  );
  assert.ok(roleplayStep, `${mission.missionId} must preserve its accepted Roleplay step`);
  assert.equal(roleplayStep.task.health, 'degraded',
    'Agent F source Roleplay descriptor must remain degraded and byte-identical');
  assert.equal(roleplayStep.task.featureFlag, PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG,
    'Agent F source must keep its original deferred bridge feature flag');
  assert.equal(roleplayStep.task.launch.route, '/speaking');
  assert.equal(roleplayStep.task.launch.params.profession, mission.profession);
  assert.equal(roleplayStep.task.launch.params.missionId, mission.missionId);
  assert.equal(roleplayStep.task.launch.params.contextId, mission.contextId);
  assert.equal(roleplayStep.task.launch.params.entryMode, 'workplace');
  assert.equal(typeof roleplayStep.task.launch.params.scenarioId, 'string');
  assert.ok(roleplayStep.task.launch.params.scenarioId.length > 0);

  const canonicalParams = { ...roleplayStep.task.launch.params };
  const preset = parseProfessionalMissionSpeakingParams(canonicalParams);
  assert.ok(preset, `${mission.missionId} canonical Roleplay tuple must parse`);
  assert.equal(preset.initialProfession, mission.profession);
  assert.equal(preset.initialScenarioId, roleplayStep.task.launch.params.scenarioId);
  assert.equal(preset.initialLevelBand, mission.levelBand);
  assert.equal(preset.initialSurface, 'conversation');
  assert.equal(preset.lockProfession, true);
  assert.equal(preset.entryMode, 'workplace');
  assert.equal(preset.contextLabel, mission.title);
  assert.equal(Object.isFrozen(preset), true, 'validated launch preset must be immutable');

  const entitledStatus = {
    isInternalAllAccess: false,
    isPreview: false,
    entitlements: {
      professionalAccess: true,
      professions: [mission.profession],
    },
  };
  assert.equal(canUseProfessionalMissionSpeakingPreset(preset, entitledStatus), true,
    `${mission.missionId} exact profession entitlement must authorize`);
  assert.equal(canUseProfessionalMissionSpeakingPreset(preset, {
    ...entitledStatus,
    isPreview: true,
  }), false, 'preview access must never authorize mission deep launch');
  assert.equal(canUseProfessionalMissionSpeakingPreset(preset, {
    ...entitledStatus,
    entitlements: { professionalAccess: false, professions: [mission.profession] },
  }), false, 'profession alone must not replace Professional access');
  assert.equal(canUseProfessionalMissionSpeakingPreset(preset, {
    ...entitledStatus,
    entitlements: { professionalAccess: true, professions: [] },
  }), false, 'Professional access must not replace exact profession entitlement');

  const otherMission = PROFESSIONAL_MISSIONS.find(
    (candidate) => candidate.profession !== mission.profession,
  );
  assert.ok(otherMission);
  const otherRoleplay = otherMission.steps.find(
    (step) => step.stage === 'produce' && step.task.runtime === 'roleplay',
  );
  assert.ok(otherRoleplay);

  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    profession: otherMission.profession,
  }), null, 'cross-profession tuple must fail closed');
  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    contextId: otherMission.contextId,
  }), null, 'cross-context tuple must fail closed');
  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    scenarioId: otherRoleplay.task.launch.params.scenarioId,
  }), null, 'cross-scenario tuple must fail closed');
  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    entryMode: 'interview',
  }), null, 'non-canonical entry mode must fail closed');
  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    missionId: 'unknown-mission',
  }), null, 'unknown mission must fail closed');
  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    missionId: [mission.missionId],
  }), null, 'ambiguous array URL params must fail closed');
  assert.equal(parseProfessionalMissionSpeakingParams({
    ...canonicalParams,
    contextId: `${mission.contextId}/unsafe`,
  }), null, 'unsafe identifier characters must fail closed');
}

assert.equal(parseProfessionalMissionSpeakingParams({
  missionId: 'x'.repeat(161),
  contextId: 'x',
  profession: 'doctor',
  scenarioId: 'x',
  entryMode: 'workplace',
}), null, 'overlong URL identifiers must fail closed');
assert.equal(canUseProfessionalMissionSpeakingPreset(null, {
  isInternalAllAccess: true,
}), false, 'internal access cannot authorize an invalid or missing mission tuple');

assert.match(adapter, /buildProfessionalMissionReadingTask/);
assert.match(adapter, /buildProfessionalMissionWritingTask/);
assert.ok(!adapter.includes('buildProfessionalMissionRoleplayDescriptor'),
  'Agent F runtime adapter remains unchanged; Agent A owns the route bridge');
assert.ok(!adapter.includes('getProfessionalMissionRuntimeEntries'));

assert.ok(!practiceAdapter.includes(PROFESSIONAL_LISTENING_FEATURE_FLAG),
  'Practice mission adapter must not manufacture a Professional Listening runtime');
assert.ok(!practiceAdapter.includes("runtime: 'listening'"),
  'Practice mission adapter must not create a listening task');
assert.match(practiceAdapter, /professional-mission-roleplay/,
  'Mission Roleplay must now be represented in the Practice-facing adapter');
assert.match(practiceAdapter, /route:\s*'\/speaking\/mission'/,
  'Practice-facing mission Roleplay clone must use the guarded adapter route');
assert.match(practiceAdapter, /health:\s*'available'/,
  'Practice-facing Roleplay clone must become available only after the bridge');
assert.match(practiceAdapter, /featureFlag:\s*undefined/,
  'Practice-facing Roleplay clone must not require F’s deferred feature flag');
assert.match(practiceAdapter, /step\.stage === 'produce' && step\.task\.runtime === 'roleplay'/,
  'Practice must select the accepted produce/Roleplay step rather than inventing one');

assert.match(registry, /getProfessionalMissionPracticeEntries/);
assert.match(registry, /PROTECTED_LAUNCH_ENTRIES/,
  'existing protected launch candidates must remain available');
assert.match(registry, /professional-mission-roleplay/,
  'integrated registry must retain the Roleplay source identity');
assert.ok(!registry.includes('WRITING_TASKS.push'));
assert.ok(!registry.includes('READING_TASKS.push'));

assert.match(speakingParams, /PROFESSIONAL_MISSIONS/,
  'route parser must validate against Agent F canonical mission catalog');
assert.match(speakingParams, /profession !== mission\.profession/,
  'route parser must reject cross-profession tuples');
assert.match(speakingParams, /contextId !== mission\.contextId/,
  'route parser must reject cross-context tuples');
assert.match(speakingParams, /canonicalScenarioId !== scenarioId/,
  'route parser must reject non-canonical scenarios');
assert.match(speakingParams, /status\.isPreview/,
  'mission deep launch must fail closed for preview access');

assert.match(speakingEntry, /<AppShell requestedScreen="speaking-practice" \/>/,
  'ordinary /speaking must remain exactly behind AppShell');
assert.ok(!speakingEntry.includes('professionalMissionSpeakingParams'),
  'ordinary /speaking must not gain mission parsing behavior');

assert.match(missionSpeakingEntry, /parseProfessionalMissionSpeakingParams/,
  'mission adapter route must parse the canonical tuple');
assert.match(missionSpeakingEntry, /canUseProfessionalMissionSpeakingPreset/,
  'mission adapter route must independently gate entitlement');
assert.match(missionSpeakingEntry, /hasHydrated/,
  'mission adapter must wait for auth hydration');
assert.match(missionSpeakingEntry, /hasLoadedSubscription/,
  'mission adapter must wait for subscription hydration');
assert.match(missionSpeakingEntry, /isLoadingSubscription/,
  'mission adapter must not render mission content while subscription refresh is in flight');
assert.match(missionSpeakingEntry, /setActiveContext\(missionPreset\.initialProfession\)/,
  'authorized mission launch must align only an already-entitled profession context');
assert.match(missionSpeakingEntry, /audioSession\.releaseAll\('background'\)/,
  'mission adapter must preserve protected background audio cleanup');
assert.match(missionSpeakingEntry, /return <AppShell requestedScreen="speaking-practice" \/>/,
  'invalid or unauthorized tuples must fall back to ordinary protected Speaking');
assert.match(missionSpeakingEntry, /<SpeakingRoute/,
  'authorized mission launch must reuse the existing protected SpeakingRoute');
assert.match(missionSpeakingEntry, /initialProfession=\{missionPreset\.initialProfession\}/,
  'mission route must pass the validated profession');
assert.match(missionSpeakingEntry, /initialScenarioId=\{missionPreset\.initialScenarioId\}/,
  'mission route must pass the validated scenario');
assert.match(missionSpeakingEntry, /lockProfession=\{missionPreset\.lockProfession\}/,
  'mission route must preserve profession isolation');
assert.ok(!missionSpeakingEntry.includes('RoleplayConversationScreen'),
  'mission adapter must not bypass SpeakingRoute into Roleplay internals');

assert.match(readingRoute, /getProfessionalMissionReadingTasks/);
assert.match(readingRoute, /findProfessionalMissionReadingTask/);
assert.match(readingRoute, /activeContext/);
assert.match(readingRoute, /subscription\?\.entitlements\.professions\.find/,
  'Reading must resolve mission profession from canonical active/subscription context');

assert.match(writingRoute, /getProfessionalMissionWritingTasks/);
assert.match(writingRoute, /additionalTasks=\{missionTasks\}/);
assert.match(writingScreen, /DUPLICATE_WRITING_TASK_ID/,
  'Writing task extensions must fail closed on duplicate IDs');
assert.ok(!writingScreen.includes('WRITING_TASKS.push'));
assert.ok(!writingScreen.includes('WRITING_TASKS.splice'));

assert.match(practiceRoute, /pathname:\s*current\.task\.launch\.route,\s*params:\s*current\.task\.launch\.params/,
  'Practice must preserve canonical launch params instead of flattening or dropping them');

for (const profession of PROFESSIONAL_PROFESSIONS) {
  assert.match(practiceAdapter, /requiredEntitlements:\s*\['professionalAccess', `profession:\$\{mission\.profession\}`\]/,
    `${profession} mission Reading tasks must preserve profession-specific entitlement declarations`);
}

console.log('PROFESSIONAL_MISSION_READING_ADAPTER=PASS');
console.log('PROFESSIONAL_MISSION_WRITING_ADAPTER=PASS');
console.log('PROFESSIONAL_MISSION_ROLEPLAY_SOURCE_IDENTITY=PASS');
console.log('PROFESSIONAL_MISSION_ROLEPLAY_URL_TUPLE_GUARD=PASS');
console.log('PROFESSIONAL_MISSION_ROLEPLAY_ENTITLEMENT_GATE=PASS');
console.log('PROFESSIONAL_MISSION_ROLEPLAY_PRACTICE_SEAM=PASS');
console.log('PROFESSIONAL_MISSION_PROFESSION_GATE=PASS');
console.log('PROFESSIONAL_MISSION_READING_SEAM=PASS');
console.log('PROFESSIONAL_MISSION_WRITING_SEAM=PASS');
console.log('PROFESSIONAL_LISTENING_REMAINS_UNAVAILABLE=PASS');
