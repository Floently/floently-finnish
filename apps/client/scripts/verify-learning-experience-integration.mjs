import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

function requireText(source, text, label) {
  if (!source.includes(text)) {
    throw new Error(`Learning experience integration failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Learning experience integration failed: ${label}`);
  }
}

const guided = read('features/speaking/screens/GuidedSpeakingScreen.tsx');

requireText(
  guided,
  "import { ReducedMotionAwareMotion, performLearningHaptic } from '@ui/learningExperience';",
  'Guided Speaking must consume the shared experience primitives',
);
requireText(guided, 'kind="task-enter"', 'recall must use a restrained task-enter transition');
requireText(guided, 'kind="next-task"', 'listen/speak progression must use semantic next-task transitions');
requireText(guided, 'kind="feedback-reveal"', 'transcript feedback must use the feedback-reveal transition');
requireText(guided, "isReviewing ? 'retry-success'", 'review completion must not present as a new frontier milestone');
requireText(guided, "visibleStageNumber === levelEnd ? 'milestone' : 'completion'", 'frontier level boundaries must use milestone semantics');

const persistenceIndex = guided.indexOf(
  'await completePersistedStage(curriculumLesson.id, curriculumLesson.version, visibleStageNumber);',
);
const hapticIndex = guided.indexOf('void performLearningHaptic(');
if (persistenceIndex < 0 || hapticIndex < 0 || hapticIndex < persistenceIndex) {
  throw new Error(
    'Learning experience integration failed: haptic feedback must occur only after persisted Guided Speaking completion',
  );
}

const hapticCalls = guided.match(/performLearningHaptic\(/g) ?? [];
if (hapticCalls.length !== 1) {
  throw new Error(
    `Learning experience integration failed: Guided Speaking must have exactly one semantic haptic call, found ${hapticCalls.length}`,
  );
}

for (const routine of [
  'onBack',
  'setHistoryOpen',
  'playModel',
  'toggleRecording',
  'setRecallOpen',
  "setLessonStep('listen')",
  "setLessonStep('speak')",
]) {
  const anchor = guided.indexOf(routine);
  if (anchor < 0) {
    throw new Error(`Learning experience integration failed: missing protected routine anchor ${routine}`);
  }
}

forbidText(guided, 'withRepeat', 'Guided Speaking must not introduce looping motion');
forbidText(guided, 'withSequence', 'Guided Speaking must not introduce choreographed motion sequences');
forbidText(guided, 'Haptics.', 'Guided Speaking must not bypass the semantic shared haptic helper');
requireText(guided, 'await resumePersistedFrontier()', 'review completion must still return to the persisted frontier');
requireText(guided, 'stageNumber >= highestUnlockedNumber', 'future-stage lock must remain in the source contract verifier target');
requireText(guided, 'visibleStageNumber === GUIDED_SPEAKING_MAX_STAGE', 'Stage 300 handoff guard must remain intact');

console.log('GUIDED_EXPERIENCE_INTEGRATION=PASS');
console.log('GUIDED_REDUCED_MOTION_INTEGRATION=PASS');
console.log('GUIDED_HAPTIC_SEMANTICS=PASS');
console.log('GUIDED_PROGRESSION_AUTHORITY_UNCHANGED=PASS');
