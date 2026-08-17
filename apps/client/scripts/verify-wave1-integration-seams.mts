import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { READING_TASKS } from '../features/reading/readingTasks.ts';
import { toReadingTaskDescriptor } from '../features/reading/readingEngine.ts';
import { composePracticeSession } from '../features/practice/composer.ts';
import { PROFESSIONAL_MISSIONS } from '../../../packages/core/professional/missions.mjs';

const require = createRequire(import.meta.url);
const writingEngine = require('../features/writing/engine.js');
const { WRITING_TASKS } = require('../features/writing/tasks.js');
const allModalities = { audio: true, microphone: true, keyboard: true };

function entitlementsFor(task: any) {
  const result = new Set<string>(task.requiredEntitlements ?? []);
  if (task.pathway === 'everyday') result.add('learnAccess');
  if (task.pathway === 'professional') result.add('professionalAccess');
  if (task.pathway === 'yki') result.add('ykiAccess');
  if (task.profession) result.add(`profession:${task.profession}`);
  return [...result];
}
function composeOne(task: any, profession = 'nurse') {
  return composePracticeSession({ learnerId: 'integration-learner', createdAt: '2026-08-18T00:00:00.000Z', scope: task.pathway, targetMinutes: 20, candidates: [task], entitlements: entitlementsFor(task), profession, modalities: allModalities, enabledFeatureFlags: task.featureFlag ? [task.featureFlag] : [], evidence: [] });
}
const readingDescriptors = READING_TASKS.map(toReadingTaskDescriptor);
for (const descriptor of readingDescriptors) assert.deepEqual(composeOne(descriptor, descriptor.profession ?? 'nurse').manifest.tasks.map((item) => item.task.taskId), [descriptor.taskId]);
const professionalReading = readingDescriptors.find((task) => task.pathway === 'professional');
assert.ok(professionalReading);
assert.equal(professionalReading.profession, undefined);
assert.deepEqual(composeOne(professionalReading, 'doctor').manifest.tasks.map((item) => item.task.taskId), [professionalReading.taskId]);
const writingDescriptors = WRITING_TASKS.map((task: any) => writingEngine.buildWritingTaskDescriptor(task));
for (const descriptor of writingDescriptors) assert.deepEqual(composeOne(descriptor, 'nurse').manifest.tasks.map((item) => item.task.taskId), [descriptor.taskId]);
for (const descriptor of writingDescriptors.filter((task: any) => task.pathway === 'professional')) assert.equal(descriptor.profession, undefined);
const missionDescriptors = PROFESSIONAL_MISSIONS.flatMap((mission: any) => mission.steps.map((step: any) => step.task));
for (const descriptor of missionDescriptors) {
  const result = composeOne(descriptor, descriptor.profession);
  assert.equal(result.manifest.tasks.length, 0);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.taskId === descriptor.taskId && ['unavailable', 'degraded_excluded'].includes(diagnostic.code)));
  const wrongProfession = descriptor.profession === 'doctor' ? 'nurse' : 'doctor';
  const mismatch = composePracticeSession({ learnerId: 'integration-learner', createdAt: '2026-08-18T00:00:00.000Z', scope: 'professional', targetMinutes: 20, candidates: [descriptor], entitlements: ['professionalAccess', `profession:${descriptor.profession}`], profession: wrongProfession, modalities: allModalities, enabledFeatureFlags: descriptor.featureFlag ? [descriptor.featureFlag] : [], evidence: [] });
  assert.equal(mismatch.manifest.tasks.length, 0);
  assert.ok(mismatch.diagnostics.some((diagnostic) => diagnostic.taskId === descriptor.taskId && diagnostic.code === 'profession_mismatch'));
}
const allDescriptors = [...readingDescriptors, ...writingDescriptors, ...missionDescriptors];
const taskIds = allDescriptors.map((task: any) => task.taskId);
assert.equal(new Set(taskIds).size, taskIds.length);
console.log('C_D_F_TO_PRACTICE_SEAMS=PASS');
console.log('GENERIC_PROFESSIONAL_SCOPE=PASS');
console.log('RAW_MISSION_DESCRIPTORS_FAIL_CLOSED=PASS');
console.log('PROFESSION_ISOLATION=PASS');
console.log('INTEGRATED_DESCRIPTOR_IDENTITY=PASS');
