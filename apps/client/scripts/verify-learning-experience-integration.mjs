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
const cards = read('features/cards/components/CardPracticeSession.tsx');
const reading = read('features/reading/ReadingRuntimeScreen.tsx');
const writing = read('features/writing/WritingPracticeScreen.tsx');

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

requireText(
  cards,
  "import { ReducedMotionAwareMotion, performLearningHaptic } from '@ui/learningExperience';",
  'Cards must consume the shared experience primitives',
);
requireText(cards, 'kind="feedback-reveal"', 'Cards feedback reveal must use the shared reduced-motion wrapper');
requireText(cards, "void performLearningHaptic('completion');", 'Cards may haptically confirm only completed sessions');
requireText(cards, 'if (!sessionCompleted)', 'Cards completion haptic must be gated by the confirmed session state');
requireText(cards, 'completionHapticDelivered.current', 'Cards completion haptic must be de-duplicated');
forbidText(cards, 'Haptics.', 'Cards must not bypass the semantic shared haptic helper');
forbidText(cards, "performLearningHaptic('submit-success')", 'Cards must not haptic every answer submission');
forbidText(cards, "performLearningHaptic('important-transition')", 'Cards must not haptic routine navigation');

requireText(
  reading,
  'ReducedMotionAwareMotion,',
  'Reading must consume the shared reduced-motion wrapper',
);
requireText(reading, 'performLearningHaptic,', 'Reading must consume the shared semantic haptic helper');
requireText(reading, "kind=\"success\"", 'Reading completion must use semantic success motion');
requireText(reading, "void performLearningHaptic('completion');", 'Reading completion must use semantic completion haptics');
const readingDeliveredIndex = reading.indexOf('deliveredResult.current = resultKey;');
const readingHapticIndex = reading.indexOf("void performLearningHaptic('completion');");
if (readingDeliveredIndex < 0 || readingHapticIndex < readingDeliveredIndex) {
  throw new Error(
    'Learning experience integration failed: Reading haptic must occur only after the completion result has been de-duplicated',
  );
}
forbidText(reading, 'Haptics.', 'Reading must not bypass the semantic shared haptic helper');

requireText(
  writing,
  'ReducedMotionAwareMotion,',
  'Writing must consume the shared reduced-motion wrapper',
);
requireText(writing, 'performLearningHaptic,', 'Writing must consume the shared semantic haptic helper');
requireText(
  writing,
  "next.stage === 'feedback' || next.stage === 'compare'",
  'Writing haptic feedback must be gated by evaluator-confirmed feedback/compare stages',
);
requireText(
  writing,
  "next.stage === 'compare' ? 'completion' : 'submit-success'",
  'Writing must distinguish successful feedback delivery from completed revision',
);
requireText(
  writing,
  "kind={session.stage === 'compare' ? 'success' : 'feedback-reveal'}",
  'Writing feedback/compare states must use semantic reduced-motion transitions',
);
forbidText(writing, 'Haptics.', 'Writing must not bypass the semantic shared haptic helper');

for (const source of [guided, cards, reading, writing]) {
  forbidText(source, 'withRepeat', 'learning screens must not introduce looping animation');
  forbidText(source, 'withSequence', 'learning screens must not introduce choreographed animation sequences');
}

console.log('CARDS_EXPERIENCE_INTEGRATION=PASS');
console.log('READING_EXPERIENCE_INTEGRATION=PASS');
console.log('WRITING_EXPERIENCE_INTEGRATION=PASS');
console.log('ROUTINE_HAPTIC_GUARD=PASS');
