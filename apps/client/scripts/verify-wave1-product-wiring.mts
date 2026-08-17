import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { getIntegratedPracticeEntries } from '../features/practice/integratedRegistry.ts';
import { PRACTICE_FIXTURES } from '../features/practice/fixtureRegistry.ts';
import { READING_TASKS } from '../features/reading/readingTasks.ts';
import { toReadingTaskDescriptor } from '../features/reading/readingEngine.ts';

const require = createRequire(import.meta.url);
const { WRITING_TASKS } = require('../features/writing/tasks.js');
const writingEngine = require('../features/writing/engine.js');

const text = (path: string) => readFileSync(path, 'utf8');
const entries = getIntegratedPracticeEntries('nurse');
const ids = new Set(entries.map((entry) => entry.descriptor.taskId));

for (const task of READING_TASKS) {
  const descriptor = toReadingTaskDescriptor(task);
  assert.ok(ids.has(descriptor.taskId), `Integrated Practice must include real Reading ${descriptor.taskId}`);
}
for (const task of WRITING_TASKS) {
  const descriptor = writingEngine.buildWritingTaskDescriptor(task, task.pathway === 'professional' ? 'nurse' : undefined);
  if (task.pathway !== 'professional' || !task.allowedProfessions || task.allowedProfessions.includes('nurse')) {
    assert.ok(ids.has(descriptor.taskId), `Integrated Practice must include eligible real Writing ${descriptor.taskId}`);
  }
}
for (const fixture of PRACTICE_FIXTURES.filter((item) => ['reading', 'writing'].includes(item.descriptor.runtime))) {
  assert.ok(!ids.has(fixture.descriptor.taskId), `Fixture-only ${fixture.descriptor.runtime} identity must not survive integrated registry`);
}

const practiceRoute = text('apps/client/features/practice/IntegratedPracticeRoute.tsx');
assert.match(practiceRoute, /PracticeProgressPath/);
assert.match(practiceRoute, /ReducedMotionAwareMotion/);
assert.match(practiceRoute, /SemanticFeedback/);
assert.match(practiceRoute, /evidence:\s*\[\]/, 'Practice must remain truthful curriculum-mode until durable client evidence bridge exists');
assert.doesNotMatch(practiceRoute, /saved progress|progress is saved|history is connected/i);

const featureEntry = text('apps/client/state/FeatureEntryRoute.tsx');
assert.match(featureEntry, /IntegratedPracticeRoute/);
assert.match(featureEntry, /route === ['"]daily-practice['"]/);

const learningRoute = text('apps/client/state/LearningRoute.tsx');
assert.match(learningRoute, /\/learn\/reading/);
assert.match(learningRoute, /\/learn\/writing/);
assert.match(learningRoute, /PathwayBadge/);
assert.match(learningRoute, /ReducedMotionAwareMotion/);

const appShell = text('apps/client/state/AppShell.tsx');
assert.match(appShell, /onOpenDailyPractice=\{\(\) => void navigateTo\(['"]daily-practice['"]\)\}/);
assert.doesNotMatch(appShell, /onOpenDailyPractice=\{\(\) => void navigateTo\(['"]learning['"]\)\}/);

const professionalRoute = text('apps/client/state/ProfessionalRoute.tsx');
assert.match(professionalRoute, /\/professional\/reading/);
assert.match(professionalRoute, /\/professional\/writing/);
assert.match(professionalRoute, /PathwayBadge/);
assert.match(professionalRoute, /SkillBadge/);

const readingRuntime = text('apps/client/features/reading/ReadingRuntimeScreen.tsx');
assert.match(readingRuntime, /LearningFocusSurface/);
assert.match(readingRuntime, /mode=['"]reading['"]/);
assert.match(readingRuntime, /SkillBadge skill=['"]reading['"]/);

const writingRuntime = text('apps/client/features/writing/WritingPracticeScreen.tsx');
assert.match(writingRuntime, /LearningFocusSurface/);
assert.match(writingRuntime, /mode=['"]writing['"]/);
assert.match(writingRuntime, /SkillBadge skill=['"]writing['"]/);

console.log(`INTEGRATED_PRACTICE_ENTRIES=${entries.length}`);
console.log('REAL_READING_WRITING_REGISTRY=PASS');
console.log('FIXTURE_REPLACEMENT=PASS');
console.log('HOME_PRACTICE_NAVIGATION=PASS');
console.log('PROFESSIONAL_READING_WRITING_SURFACING=PASS');
console.log('GRAPHICS_AND_FOCUS_WIRING=PASS');
console.log('CURRICULUM_TRUTH=PASS');
