import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

import {
  PROFESSIONAL_MISSIONS,
  PROFESSIONAL_PROFESSIONS,
} from '../../../packages/core/professional/missions.mjs';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

async function loadListeningModule() {
  let source = read('features/professional/professionalListening.ts');
  source = source.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*'@core\/professional\/missions\.mjs';/,
    'const PROFESSIONAL_MISSIONS = globalThis.__professionalListeningMissionCatalog;',
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  globalThis.__professionalListeningMissionCatalog = PROFESSIONAL_MISSIONS;
  try {
    return await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
  } finally {
    delete globalThis.__professionalListeningMissionCatalog;
  }
}

const listening = await loadListeningModule();
const audio = read('features/professional/professionalListeningAudio.ts');
const screen = read('features/professional/ProfessionalListeningScreen.tsx');
const route = read('features/professional/ProfessionalListeningRoute.tsx');
const routeEntry = read('app/professional/listening.tsx');
const chain = read('features/professional/professionalMissionChain.ts');
const professionalRoute = read('state/ProfessionalRoute.tsx');

assert.equal(listening.PROFESSIONAL_LISTENING_TASKS.length, PROFESSIONAL_PROFESSIONS.length);
assert.equal(new Set(listening.PROFESSIONAL_LISTENING_TASKS.map((task) => task.taskId)).size, 3);

for (const profession of PROFESSIONAL_PROFESSIONS) {
  const task = listening.getProfessionalMissionListeningTasks(profession)[0];
  const mission = PROFESSIONAL_MISSIONS.find((candidate) => candidate.profession === profession);
  assert.ok(task, `${profession} must have one Professional listening task`);
  assert.ok(mission, `${profession} mission must exist`);
  assert.equal(listening.getProfessionalMissionListeningTasks(profession).length, 1);
  assert.equal(task.profession, profession);
  assert.equal(task.missionId, mission.missionId);
  assert.equal(task.contextId, mission.contextId);
  assert.equal(task.taskId, `mission.${mission.missionId}.listening`);
  assert.equal(task.questions.length, 2);
  assert.equal(task.originalContent, true);

  const receive = mission.steps.find((step) => step.stage === 'receive');
  assert.ok(receive);
  assert.equal(receive.content.kind, 'audio-script');
  assert.equal(task.scriptFi, receive.content.finnish);
  assert.equal(task.objective, receive.objective);

  for (const question of task.questions) {
    assert.ok(question.options.some((option) => option.id === question.correctOptionId));
    assert.equal(new Set(question.options.map((option) => option.id)).size, question.options.length);
  }

  const otherProfession = PROFESSIONAL_PROFESSIONS.find((candidate) => candidate !== profession);
  assert.equal(
    listening.findProfessionalMissionListeningTask(task.taskId, otherProfession),
    undefined,
    'a mission listening task must fail closed across professions',
  );

  let session = listening.createProfessionalListeningSession(task);
  assert.equal(session.phase, 'listen');
  assert.equal(
    listening.beginProfessionalListeningQuestions(session).phase,
    'listen',
    'questions must not start before audio or explicit transcript support',
  );

  session = listening.markProfessionalAudioCompleted(session);
  assert.equal(session.deliveryMode, 'audio');
  session = listening.beginProfessionalListeningQuestions(session);
  assert.equal(session.phase, 'question');

  for (let index = 0; index < task.questions.length; index += 1) {
    const question = task.questions[index];
    session = listening.submitProfessionalListeningAnswer(
      session,
      task,
      question.correctOptionId,
    );
    assert.equal(session.phase, 'feedback');
    session = listening.continueProfessionalListening(session, task);
  }

  assert.equal(session.phase, 'complete');
  const audioResult = listening.toProfessionalListeningResult(session, task);
  assert.ok(audioResult);
  assert.equal(audioResult.deliveryMode, 'audio');
  assert.equal(audioResult.audioListeningCompleted, true);
  assert.equal(audioResult.correctCount, 2);

  let fallback = listening.createProfessionalListeningSession(task);
  fallback = listening.useProfessionalTranscriptFallback(fallback);
  assert.equal(fallback.transcriptVisible, true);
  assert.equal(fallback.deliveryMode, 'transcript-fallback');
  fallback = listening.beginProfessionalListeningQuestions(fallback);
  for (let index = 0; index < task.questions.length; index += 1) {
    fallback = listening.submitProfessionalListeningAnswer(
      fallback,
      task,
      task.questions[index].correctOptionId,
    );
    fallback = listening.continueProfessionalListening(fallback, task);
  }
  const fallbackResult = listening.toProfessionalListeningResult(fallback, task);
  assert.ok(fallbackResult);
  assert.equal(fallbackResult.deliveryMode, 'transcript-fallback');
  assert.equal(fallbackResult.audioListeningCompleted, false);
}

assert.ok(audio.includes("mode: 'speaking_practice'"));
assert.ok(audio.includes("requestVoiceTts"));
assert.ok(audio.includes("audioSession.playManaged"));
assert.ok(!audio.includes('yki'));
assert.ok(!audio.includes('roleplay'));

assert.ok(screen.includes('Generated Finnish practice audio'));
assert.ok(screen.includes('This does not count as audio listening completion.'));
assert.ok(screen.includes("next.deliveryMode === 'audio'"));
assert.ok(screen.includes("performLearningHaptic('completion')"));
assert.ok(screen.includes('Continue mission · Speak'));
assert.ok(screen.includes('task.safetyNotice'));
assert.ok(screen.includes('task.authorityBoundary'));

assert.ok(route.includes("findProfessionalMissionListeningTask(requestedTaskId, profession)"));
assert.ok(route.includes("!subscriptionStatus?.isInternalAllAccess && !entitlements?.professionalAccess"));
assert.ok(
  route.includes("(Boolean(user) && (!subscriptionLoaded || subscriptionLoading))"),
  'signed-out Professional Listening must not wait forever for subscription hydration',
);
assert.ok(
  route.indexOf("if (!user)") > route.indexOf("(Boolean(user) && (!subscriptionLoaded || subscriptionLoading))"),
  'Professional Listening must resolve auth hydration before rendering its signed-out access message',
);
assert.ok(route.includes("const speakingStep = chain.steps.find((step) => step.id === 'speak')"));
assert.ok(routeEntry.includes("ProfessionalListeningRoute"));

assert.ok(chain.includes("pathname: '/professional/listening'"));
assert.ok(chain.includes("taskId: `mission.${mission.missionId}.listening`"));
assert.ok(!chain.includes("Listening is not available yet"));
assert.ok(professionalRoute.includes('<SkillBadge skill="listening"'));
assert.ok(
  professionalRoute.includes('Start by listening to the workplace message'),
  'Professional hero must explain the real mission start',
);
assert.ok(!professionalRoute.includes('Listening is not available yet'));

for (const forbidden of [
  "features/exam",
  "audioPlayer",
  "ykiRoute",
  "RoleplayConversationScreen",
  "startRoleplay",
]) {
  assert.ok(!route.includes(forbidden), `Professional Listening route must not depend on ${forbidden}`);
  assert.ok(!screen.includes(forbidden), `Professional Listening screen must not depend on ${forbidden}`);
}

console.log('PROFESSIONAL_LISTENING_TASKS=PASS');
console.log('PROFESSIONAL_LISTENING_PROFESSION_ISOLATION=PASS');
console.log('PROFESSIONAL_LISTENING_AUDIO_RESULT_TRUTH=PASS');
console.log('PROFESSIONAL_LISTENING_FALLBACK_TRUTH=PASS');
console.log('PROFESSIONAL_LISTENING_YKI_BOUNDARY=PASS');
console.log('PROFESSIONAL_LISTENING_ROUTE=PASS');
