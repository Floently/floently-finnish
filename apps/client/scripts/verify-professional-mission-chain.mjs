import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  PROFESSIONAL_MISSIONS,
  PROFESSIONAL_PROFESSIONS,
  listMissionsForProfession,
} from '../../../packages/core/professional/missions.mjs';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

const professionalRoute = read('state/ProfessionalRoute.tsx');
const missionChain = read('features/professional/professionalMissionChain.ts');
const readingRoute = read('features/reading/ReadingRoute.tsx');
const writingRoute = read('features/writing/WritingRouteScreen.tsx');
const speakingParams = read('state/professionalMissionSpeakingParams.mjs');
const speakingMissionRoute = read('app/speaking/mission.tsx');
const appShell = read('state/AppShell.tsx');

assert.equal(PROFESSIONAL_MISSIONS.length, PROFESSIONAL_PROFESSIONS.length);
for (const profession of PROFESSIONAL_PROFESSIONS) {
  const missions = listMissionsForProfession(profession);
  assert.equal(missions.length, 1, `${profession} must foreground exactly one current mission`);
  assert.equal(missions[0].profession, profession);
  assert.equal(new Set(missions[0].steps.map((step) => step.task.contextId)).size, 1);
}

assert.ok(
  professionalRoute.includes('buildProfessionalMissionChain(selectedProfession)'),
  'ProfessionalRoute must foreground the canonical mission chain for the active profession',
);
assert.ok(
  professionalRoute.includes('Start mission · {missionStepLabel(missionChain.primaryStep)}'),
  'ProfessionalRoute must expose one obvious mission start action',
);
assert.ok(
  professionalRoute.includes('missionChain.steps.map'),
  'ProfessionalRoute must render the ordered mission path',
);
assert.ok(
  professionalRoute.includes('More professional practice'),
  'standalone tools must remain available behind progressive disclosure',
);
assert.ok(
  professionalRoute.includes('mission.safetyFrame.authorityBoundary'),
  'regulated-context safety boundary must remain visible',
);
assert.ok(
  !professionalRoute.includes('function buildMissions('),
  'old static mission-goal list must not remain the primary Professional model',
);

assert.ok(
  missionChain.includes("id: 'listen'") &&
  missionChain.includes("available: false") &&
  missionChain.includes("launch: null"),
  'Professional Listening must fail closed until a canonical runtime exists',
);
assert.ok(
  !missionChain.includes("pathname: '/professional/listening'"),
  'integration must not invent a Professional Listening route',
);

for (const route of ["'/speaking/mission'", "'/professional/reading'", "'/professional/writing'"]) {
  assert.ok(missionChain.includes(`pathname: ${route}`), `mission chain must use canonical route ${route}`);
}

assert.ok(
  missionChain.includes("taskId: `mission.${mission.missionId}.reading`"),
  'Reading must launch the exact mission reading adapter task',
);
assert.ok(
  missionChain.includes("taskId: `mission.${mission.missionId}.writing`"),
  'Writing must launch the exact mission writing adapter task',
);
assert.ok(
  readingRoute.includes('findProfessionalMissionReadingTask'),
  'Professional Reading must resolve mission-specific tasks through the canonical Reading runtime',
);
assert.ok(
  writingRoute.includes('getProfessionalMissionWritingTasks'),
  'Professional Writing must expose mission-specific tasks through the canonical Writing runtime',
);

assert.ok(
  speakingParams.includes("roleplayMode: 'professional'"),
  'validated mission speaking preset must declare Professional roleplay mode explicitly',
);
assert.ok(
  speakingMissionRoute.includes('roleplayMode={missionPreset.roleplayMode}'),
  'mission speaking bridge must pass explicit mode into SpeakingRoute',
);
assert.ok(
  appShell.includes("roleplayMode: entryMode === 'interview' ? 'interview' : 'professional'"),
  'standalone Professional speaking launches must also avoid the legacy mode fallback',
);

for (const preservedTool of [
  "professionalFlashcardsTitle",
  "professionalRoleplayTitle",
  "professionalInterviewTitle",
  "professionalReportWritingTitle",
]) {
  assert.ok(
    professionalRoute.includes(preservedTool),
    `existing Professional tool ${preservedTool} must remain reachable`,
  );
}

console.log('PASS: one profession-correct mission is foregrounded.');
console.log('PASS: Professional mission chain is ordered and context-stable.');
console.log('PASS: Listening fails closed without inventing a runtime.');
console.log('PASS: Speaking, Reading and Writing reuse canonical runtimes.');
console.log('PASS: mission speaking declares explicit Phase-5 Professional mode.');
console.log('PASS: existing Professional tools remain reachable under progressive disclosure.');
console.log('PROFESSIONAL_MISSION_CHAIN=PASS');
