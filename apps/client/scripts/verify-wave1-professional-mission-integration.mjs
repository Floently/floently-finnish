import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PROFESSIONAL_LISTENING_FEATURE_FLAG,
  PROFESSIONAL_MISSIONS,
  PROFESSIONAL_PROFESSIONS,
} from '../../../packages/core/professional/missions.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, '..');
const read = (relative) => fs.readFileSync(path.join(clientRoot, relative), 'utf8');

const adapter = read('features/professional/missionRuntimeAdapters.ts');
const registry = read('features/practice/integratedRegistry.ts');
const practiceRoute = read('features/practice/IntegratedPracticeRoute.tsx');
const readingRoute = read('features/reading/ReadingRoute.tsx');
const writingRoute = read('features/writing/WritingRouteScreen.tsx');
const writingScreen = read('features/writing/WritingPracticeScreen.tsx');

assert.equal(PROFESSIONAL_MISSIONS.length, PROFESSIONAL_PROFESSIONS.length);
for (const mission of PROFESSIONAL_MISSIONS) {
  assert.match(adapter, new RegExp(mission.missionId.replaceAll('-', '\\-')),
    `${mission.missionId} must have authored adapter coverage`);
  assert.ok(mission.steps.some((step) => step.stage === 'produce'));
  assert.ok(mission.steps.some((step) => step.stage === 'interpret'));
  assert.ok(mission.steps.some((step) => step.stage === 'document'));
}

assert.match(adapter, /buildProfessionalMissionRoleplayDescriptor/);
assert.match(adapter, /buildProfessionalMissionReadingTask/);
assert.match(adapter, /buildProfessionalMissionWritingTask/);
assert.match(adapter, /health:\s*'available'/,
  'integration adapter must make only the resolved protected Roleplay launch available');
assert.ok(!adapter.includes(PROFESSIONAL_LISTENING_FEATURE_FLAG),
  'integration adapter must not manufacture a Professional Listening runtime');
assert.ok(!adapter.includes("runtime: 'listening'"),
  'integration adapter must not create a listening task');

assert.match(registry, /getProfessionalMissionRuntimeEntries/);
assert.match(registry, /descriptor\.pathway === 'professional' && descriptor\.runtime === 'roleplay'/,
  'generic Professional Roleplay fixture must be removed when a mission profession is active');
assert.ok(!registry.includes('WRITING_TASKS.push'));
assert.ok(!registry.includes('READING_TASKS.push'));

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
  assert.match(adapter, /requiredEntitlements:\s*\['professionalAccess', `profession:\$\{mission\.profession\}`\]/,
    `${profession} mission tasks must preserve profession-specific entitlement declarations`);
}

console.log('PROFESSIONAL_MISSION_RUNTIME_ADAPTER=PASS');
console.log('PROFESSIONAL_MISSION_PROFESSION_GATE=PASS');
console.log('PROFESSIONAL_MISSION_PRACTICE_SEAM=PASS');
console.log('PROFESSIONAL_MISSION_READING_SEAM=PASS');
console.log('PROFESSIONAL_MISSION_WRITING_SEAM=PASS');
console.log('PROFESSIONAL_LISTENING_REMAINS_UNAVAILABLE=PASS');
