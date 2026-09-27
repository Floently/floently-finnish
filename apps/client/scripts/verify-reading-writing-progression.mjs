import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

// Re-run the accepted engine suites first. These now assert the expanded
// catalog counts and C1/C2 runtime validity rather than only the launch banks.
await import('./verify-reading-engine.mjs');
await import('./verify-agent-d-writing.mjs');

const readingEngine = read('features/reading/readingEngine.ts');
const readingTasks = read('features/reading/readingTasks.ts');
const readingExpansion = read('features/reading/readingExpansionTasks.ts');
const readingScreen = read('features/reading/ReadingRuntimeScreen.tsx');
const writingModel = read('features/writing/model.ts');
const writingTasks = read('features/writing/tasks.js');
const writingExpansion = read('features/writing/writingExpansionTasks.js');
const writingScreen = read('features/writing/WritingPracticeScreen.tsx');

assert.ok(
  readingEngine.includes("'C1' | 'C2'"),
  'ReadingLevel must extend through C2',
);
assert.ok(
  writingModel.includes("'C1' | 'C2'"),
  'WritingLevel must extend through C2',
);
assert.ok(
  readingTasks.includes('getNextReadingTask'),
  'Reading must expose deterministic next-task navigation',
);
assert.ok(
  writingTasks.includes('getNextWritingTask'),
  'Writing must expose deterministic next-task navigation',
);
assert.ok(
  readingScreen.includes('Seuraava · {nextTask.level} · {nextTask.title}'),
  'Reading completion must present one explicit next task',
);
assert.ok(
  writingScreen.includes('Next writing task · {nextCanonicalTask.level} · {nextCanonicalTask.title}'),
  'Writing comparison must present one explicit next task',
);
assert.ok(
  readingScreen.includes('{option.level} · {option.title}'),
  'Reading task picker must distinguish same-level tasks by title',
);
assert.ok(
  !/Math\.random|crypto\.randomUUID|shuffle\(/.test(readingTasks + readingExpansion),
  'Reading curriculum order must not use runtime randomness',
);
assert.ok(
  !/Math\.random|crypto\.randomUUID|shuffle\(/.test(writingTasks + writingExpansion),
  'Writing curriculum order must not use runtime randomness',
);

const require = createRequire(import.meta.url);
const {
  WRITING_TASKS,
  tasksForPathway,
  getNextWritingTask,
} = require(path.join(clientRoot, 'features', 'writing', 'tasks.js'));

assert.equal(WRITING_TASKS.length, 20);
assert.equal(tasksForPathway('everyday').length, 12);
assert.equal(tasksForPathway('professional', 'nurse').length, 8);

const everydayWritingLevels = tasksForPathway('everyday').map((task) => task.level);
assert.deepEqual(
  everydayWritingLevels,
  ['A1', 'A1', 'A2', 'A2', 'B1', 'B1', 'B2', 'B2', 'C1', 'C1', 'C2', 'C2'],
);
assert.equal(
  getNextWritingTask('writing.everyday.formal-response.c2'),
  null,
  'Writing must not leak from Everyday C2 into Professional',
);

for (const source of [readingExpansion, writingExpansion]) {
  assert.doesNotMatch(source, /YKI-origin|official YKI|textbook exercise|paid course/i);
}

console.log('PASS: Reading and Writing extend through C1/C2.');
console.log('PASS: canonical banks are expanded and deterministic.');
console.log('PASS: same-level Reading tasks are distinguishable.');
console.log('PASS: Next actions remain inside canonical pathway order.');
console.log('PASS: original engine regression suites remain authoritative.');
console.log('READING_WRITING_PROGRESSION=PASS');
