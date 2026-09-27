import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const text = (path: string) => readFileSync(path, 'utf8');

const registry = text('apps/client/features/practice/integratedRegistry.ts');
assert.match(registry, /toReadingTaskDescriptor/);
assert.match(registry, /READING_TASKS/);
assert.match(registry, /buildWritingTaskDescriptor/);
assert.match(registry, /WRITING_TASKS/);
assert.match(
  registry,
  /descriptor\.runtime !== ['"]reading['"] && descriptor\.runtime !== ['"]writing['"]/,
  'Integrated Practice must exclude fixture-only Reading/Writing descriptors',
);
assert.match(registry, /source: ['"]reading['"]/);
assert.match(registry, /source: ['"]writing['"]/);
assert.match(registry, /task\.allowedProfessions\.includes\(canonicalProfession\)/);
assert.doesNotMatch(
  registry,
  /practice\.reading\.|practice\.writing\./,
  'Integrated registry must not reintroduce reserved fixture-only Reading/Writing task IDs',
);

const practiceRoute = text('apps/client/features/practice/IntegratedPracticeRoute.tsx');
assert.match(practiceRoute, /getIntegratedPracticeEntries/);
assert.match(practiceRoute, /composePracticeSession/);
assert.match(practiceRoute, /PracticeProgressPath/);
assert.match(practiceRoute, /ReducedMotionAwareMotion/);
assert.match(practiceRoute, /SemanticFeedback/);
assert.match(
  practiceRoute,
  /evidence:\s*\[\]/,
  'Practice must remain truthful curriculum-mode until durable client evidence bridge exists',
);
assert.doesNotMatch(practiceRoute, /saved progress|progress is saved|history is connected/i);

const featureEntry = text('apps/client/state/FeatureEntryRoute.tsx');
assert.match(featureEntry, /IntegratedPracticeRoute/);
assert.match(featureEntry, /screen === ['"]daily-practice['"]/);

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

console.log('REAL_READING_WRITING_REGISTRY=PASS');
console.log('FIXTURE_REPLACEMENT=PASS');
console.log('HOME_PRACTICE_NAVIGATION=PASS');
console.log('PROFESSIONAL_READING_WRITING_SURFACING=PASS');
console.log('GRAPHICS_AND_FOCUS_WIRING=PASS');
console.log('CURRICULUM_TRUTH=PASS');
