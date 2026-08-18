import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const clientRoot = join(scriptDirectory, '..');
const writingRoot = join(clientRoot, 'features', 'writing');
const engine = require(join(writingRoot, 'engine.js'));
const { writingTaskById } = require(join(writingRoot, 'tasks.js'));

let assertionCount = 0;

function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertionCount += 1;
}

function throws(action, expected, message) {
  assert.throws(action, expected, message);
  assertionCount += 1;
}

function check(value, message) {
  assert.ok(value, message);
  assertionCount += 1;
}

function startDraft(task, text) {
  let session = engine.createWritingSession(task, '2026-08-17T14:00:00.000Z');
  session = engine.moveToPlanning(session);
  const firstPrompt = task.scaffolding.planPrompts[0];
  session = engine.updateWritingPlan(session, firstPrompt.id, 'Lyhyet muistiinpanot');
  session = engine.beginWriting(session);
  return engine.updateWritingDraft(session, text);
}

const professionalTask = writingTaskById('writing.professional.shift-update.b1');
const everydayTask = writingTaskById('writing.everyday.library-reply.a1');
check(professionalTask, 'Professional Writing task fixture exists');
check(everydayTask, 'Everyday Writing task fixture exists');

const genericDescriptor = engine.buildWritingTaskDescriptor(professionalTask);
equal(genericDescriptor.profession, undefined, 'Generic Professional descriptor does not invent profession provenance');

const nurseDescriptor = engine.buildWritingTaskDescriptor(professionalTask, 'nurse');
equal(nurseDescriptor.profession, 'nurse', 'Profession-scoped descriptor carries the actual profession');

throws(
  () => engine.buildWritingTaskDescriptor(professionalTask, 'teacher'),
  /INVALID_WRITING_PROFESSION/,
  'Unknown descriptor profession fails closed',
);

const doctorOnlyTask = { ...professionalTask, allowedProfessions: ['doctor'] };
throws(
  () => engine.buildWritingTaskDescriptor(doctorOnlyTask, 'nurse'),
  /WRITING_PROFESSION_NOT_ALLOWED/,
  'Task-incompatible descriptor profession fails closed',
);

throws(
  () => engine.buildWritingTaskDescriptor(everydayTask, 'nurse'),
  /UNEXPECTED_WRITING_PROFESSION/,
  'Everyday descriptor rejects fabricated profession scope',
);

let professionalSession = startDraft(
  professionalTask,
  'Toimitus myöhästyy 30 minuuttia. Asiakkaalle on ilmoitettu. Seuraava vuoro vahvistaa uuden ajan.',
);
professionalSession = await engine.submitWriting(
  professionalSession,
  engine.createAuthoredWritingEvaluator(),
  { attemptId: 'profession-attempt-1', submittedAt: '2026-08-17T14:02:00.000Z' },
);

equal(professionalSession.attempts[0].status, 'assessed', 'Professional fixture produces assessed evidence');

const nurseEvent = engine.buildWritingLearnerEvent(professionalSession, {
  learnerId: 'learner-profession-test',
  eventId: 'event-profession-nurse',
  attemptId: 'profession-attempt-1',
  profession: 'nurse',
});
equal(nurseEvent.profession, 'nurse', 'Professional learner event carries the actual profession');

throws(
  () => engine.buildWritingLearnerEvent(professionalSession, {
    learnerId: 'learner-profession-test',
    eventId: 'event-profession-missing',
    attemptId: 'profession-attempt-1',
  }),
  /INVALID_PROFESSION/,
  'Profession-scoped learner evidence requires an actual profession',
);

throws(
  () => engine.buildWritingLearnerEvent(professionalSession, {
    learnerId: 'learner-profession-test',
    eventId: 'event-profession-invalid',
    attemptId: 'profession-attempt-1',
    profession: 'teacher',
  }),
  /INVALID_WRITING_PROFESSION/,
  'Unknown learner-event profession fails closed',
);

throws(
  () => engine.buildWritingLearnerEvent(
    { ...professionalSession, task: doctorOnlyTask },
    {
      learnerId: 'learner-profession-test',
      eventId: 'event-profession-disallowed',
      attemptId: 'profession-attempt-1',
      profession: 'nurse',
    },
  ),
  /WRITING_PROFESSION_NOT_ALLOWED/,
  'Task-incompatible learner-event profession fails closed',
);

let everydaySession = startDraft(everydayTask, 'Hei! Kyllä, tulen kirjastoon kello 17. Nähdään!');
everydaySession = await engine.submitWriting(
  everydaySession,
  engine.createAuthoredWritingEvaluator(),
  { attemptId: 'everyday-attempt-1', submittedAt: '2026-08-17T14:04:00.000Z' },
);
throws(
  () => engine.buildWritingLearnerEvent(everydaySession, {
    learnerId: 'learner-profession-test',
    eventId: 'event-everyday-profession',
    attemptId: 'everyday-attempt-1',
    profession: 'nurse',
  }),
  /UNEXPECTED_WRITING_PROFESSION/,
  'Everyday learner evidence rejects profession scope',
);

const engineSource = readFileSync(join(writingRoot, 'engine.js'), 'utf8');
check(!engineSource.includes('configured-at-launch'), 'Fabricated configured-at-launch provenance is permanently absent');

console.info(`AGENT_D_WRITING_PROFESSION_ASSERTIONS=${assertionCount}`);
console.info('PROFESSION_PROVENANCE_TESTS=PASS');
console.info('NEGATIVE_PATH_TESTS=PASS');
console.info('REGRESSION_GUARDS=PASS');
