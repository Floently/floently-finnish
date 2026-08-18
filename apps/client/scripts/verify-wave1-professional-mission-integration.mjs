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
const speakingParams = read('state/professionalMissionSpeakingParams.ts');
const appShell = read('state/AppShell.tsx');

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
}

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
assert.match(speakingParams, /canonicalEntryMode !== entryMode/,
  'route parser must reject non-canonical entry modes');
assert.match(speakingParams, /canonicalMissionId !== missionId/,
  'route parser must validate mission identity end-to-end');
assert.match(speakingParams, /status\.isPreview/,
  'mission deep launch must fail closed for preview access');
assert.match(speakingParams, /professionalAccess/,
  'mission deep launch must require Professional access');
assert.match(speakingParams, /professions\?\.includes\(preset\.initialProfession\)/,
  'mission deep launch must require the exact profession entitlement');
assert.match(speakingParams, /initialSurface:\s*'conversation'/,
  'valid mission launch must enter the conversation surface');
assert.match(speakingParams, /lockProfession:\s*true/,
  'valid mission launch must lock profession isolation');

assert.match(appShell, /parseProfessionalMissionSpeakingParams/,
  'AppShell must consume the validated mission URL adapter');
assert.match(appShell, /canUseProfessionalMissionSpeakingPreset/,
  'AppShell must apply entitlement gating after parsing');
assert.match(appShell, /speakingSearchParams\.missionId === undefined/,
  'ordinary /speaking entry must remain untouched when no mission launch is present');
assert.match(appShell, /requestedScreen !== 'speaking-practice'/,
  'mission URL preset must only apply on the speaking route boundary');
assert.match(appShell, /setSpeakingPreset\(missionPreset\)/,
  'authorized canonical mission tuple must seed the existing protected SpeakingRoute preset');

assert.match(speakingEntry, /<AppShell requestedScreen="speaking-practice" \/>/,
  '/speaking must remain behind AppShell rather than bypassing protected auth/navigation');

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
