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
    throw new Error(`Guided speaking invariant failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Guided speaking invariant failed: ${label}`);
  }
}

const stages = read('features/speaking/guidedSpeakingStages.ts');
const screen = read('features/speaking/screens/GuidedSpeakingScreen.tsx');
const speakingRoute = read('state/SpeakingRoute.tsx');
const appShell = read('state/AppShell.tsx');
const drawer = read('config/navigation/AppShell_sidebar_sections.ts');
const types = read('features/speaking/types.ts');
const progressStore = read('state/guidedSpeakingProgressStore.ts');
const curriculum = read('features/speaking/guidedSpeakingCurriculum.ts');

const stageIds = [
  'basic_chunk',
  'listen_respond',
  'controlled_qa',
  'sentence_frame',
  'two_turn_exchange',
  'short_situation',
  'guided_conversation',
];

let previousIndex = -1;
for (const stageId of stageIds) {
  const index = stages.indexOf(`'${stageId}'`);
  if (index < 0) {
    throw new Error(`Guided speaking invariant failed: missing stage ${stageId}`);
  }
  if (index <= previousIndex) {
    throw new Error('Guided speaking invariant failed: stage order changed');
  }
  previousIndex = index;
}

requireText(curriculum, 'Array.from({ length: 300 }', 'curriculum bank must contain exactly 300 deterministic stage slots');
requireText(curriculum, "{ level: 'A1.1', count: 25 }", 'A1.1 must own its first 25 stages');
requireText(curriculum, "{ level: 'C2', count: 50 }", 'C2 must have an explicit deterministic stage allocation');
requireText(curriculum, 'retrievalStageIds: retrievalFor(number)', 'every curriculum stage must carry deterministic retrieval references');
requireText(curriculum, "['Tervehdi'", 'Stage 1 must be individually authored rather than generated at runtime');
requireText(curriculum, "['Ensimmäinen keskustelu'", 'A1.1 Stage 25 must be individually authored and cumulative');
forbidText(curriculum, 'Math.random', 'curriculum construction must never use random generation');

requireText(stages, 'export type GuidedSpeakingStageId = \`GS-\${string}\`;', 'curriculum stages need permanent deterministic IDs');
requireText(stages, 'curriculumId: GuidedSpeakingStageId;', 'stage records must carry permanent curriculum identity');
requireText(stages, 'version: 1;', 'stage records must be versioned');
for (const level of ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1', 'C2']) {
  requireText(stages, `'${level}'`, `missing explicit Guided Speaking level ${level}`);
}
requireText(stages, "curriculumId: \`GS-\${String(index + 1).padStart(3, '0')}\`", 'stage IDs must derive deterministically from stable order');

requireText(progressStore, 'highestUnlockedNumber: number;', 'progress must track furthest unlocked stage separately');
requireText(progressStore, 'attempts: GuidedSpeakingAttempt[];', 'repeat attempts must be historical records');
requireText(progressStore, 'if (stageNumber < 1 || stageNumber >= state.highestUnlockedNumber) return;', 'history navigation must allow passed stages only, never the current/future frontier');
requireText(progressStore, 'Math.max(state.highestUnlockedNumber, stageNumber + 1)', 'repeating an earlier stage must never roll progression backward');
requireText(progressStore, 'stageVersion', 'attempt history must retain curriculum version');

requireText(
  stages,
  'export const GUIDED_SPEAKING_STAGE_COUNT = STAGE_IDS.length;',
  'the stage count must derive from the canonical ordered stage list',
);

for (const band of ['A1-A2', 'B1-B2', 'C1-C2']) {
  requireText(
    stages,
    `'${band}'`,
    `missing level band ${band}`,
  );
}

requireText(
  stages,
  "if (levelBand === 'A1-A2') return 0.86;",
  'A1-A2 model audio must remain slower than higher bands',
);
requireText(
  stages,
  "if (levelBand === 'B1-B2') return 0.94;",
  'B1-B2 model audio must retain an intermediate speed',
);
requireText(
  stages,
  'expectedMinWords: 7,',
  'A1-A2 final Everyday guided response must remain short',
);
requireText(
  stages,
  'expectedMinWords: 24,',
  'B1-B2 final Everyday guided response must require materially more production',
);
requireText(
  stages,
  'expectedMinWords: 45,',
  'C1-C2 final Everyday guided response must require extended production',
);
requireText(
  stages,
  'expectedMinWords: 10,',
  'A1-A2 final Professional guided response must remain supported',
);
requireText(
  stages,
  'expectedMinWords: 26,',
  'B1-B2 final Professional guided response must require expanded production',
);
requireText(
  stages,
  'expectedMinWords: 48,',
  'C1-C2 final Professional guided response must require extended production',
);

requireText(screen, 'useGuidedSpeakingProgressStore', 'Guided Speaking screen must use persisted learner history');
requireText(screen, 'highestUnlockedNumber', 'stage navigation must use persisted furthest progress');
requireText(screen, '>History</Text>', 'passed stages must live behind a single History layer');
requireText(screen, 'highestUnlockedNumber - 1', 'History must exclude the current/future frontier');
forbidText(screen, '<View style={styles.progressRow}', 'practice UI must not splatter numbered stage navigation across the main flow');
requireText(screen, 'openPersistedStage(index + 1)', 'review navigation must persist selected unlocked stage');
requireText(screen, 'completePersistedStage(stage.curriculumId, stage.version, visibleStageNumber)', 'completion must record permanent stage identity and version');
requireText(screen, 'guidedSpeakingLevelForStage(visibleStageNumber)', 'UI must show explicit learner-visible sublevel');

requireText(
  screen,
  "useRoleplayRecorder('fi-FI')",
  'Guided Speaking must reuse the canonical Finnish recorder/STT path',
);
requireText(
  screen,
  'speakRoleplayText({',
  'Guided Speaking must reuse the canonical speaking TTS path',
);
requireText(
  screen,
  'if (recorder.isRecording) {\n      setAttempted(true);',
  'a genuine microphone start must record a speaking attempt',
);
requireText(
  screen,
  'stageIndex === stages.length - 1',
  'the final guided stage must have a distinct completion handoff',
);
requireText(
  screen,
  'onOpenRoleplay();',
  'guided completion must hand off to existing open Roleplay',
);
forbidText(
  screen,
  'startRoleplaySession',
  'Guided Speaking must not create a parallel Roleplay session engine',
);
forbidText(
  screen,
  'submitRoleplayTurn',
  'Guided Speaking must not duplicate Roleplay turn handling',
);

requireText(
  types,
  "'menu' | 'guided' | 'conversation' | 'recorded'",
  'guided must be a registered speaking surface',
);
requireText(
  speakingRoute,
  "if (surface === 'guided')",
  'SpeakingRoute must mount the guided surface',
);
requireText(
  speakingRoute,
  "setSurface('guided')",
  'the speaking menu must expose Guided Speaking',
);
requireText(
  speakingRoute,
  "setSurface('conversation');",
  'guided completion must return to the existing conversation surface',
);
requireText(
  speakingRoute,
  'current === "guided" || current === "conversation" || current === "recorded"',
  'parent refreshes must not throw a learner out of active guided practice',
);

requireText(
  drawer,
  "activity: 'everyday-guided'",
  'Everyday Guided Speaking must be reachable from the progressive drawer',
);
requireText(
  drawer,
  "activity: 'professional-guided'",
  'Professional Guided Speaking must be reachable from the progressive drawer',
);
requireText(
  appShell,
  "initialLevelBand: guided ? 'A1-A2' : 'B1-B2'",
  'drawer Guided Speaking entry must default beginners to A1-A2',
);

const entitlementGuardIndex = appShell.indexOf("if (!isEntitledForScreen(screen))");
const activityIndex = appShell.indexOf('if (options?.activity)');
if (
  entitlementGuardIndex < 0 ||
  activityIndex < 0 ||
  activityIndex < entitlementGuardIndex
) {
  throw new Error(
    'Guided speaking invariant failed: drawer activity routing must remain after entitlement validation',
  );
}

console.log('PASS: guided phase order remains deterministic during curriculum migration.');
console.log('PASS: permanent versioned curriculum IDs are present.');
console.log('PASS: persisted attempt history supports repeat without progression rollback.');
console.log('PASS: CEFR bands materially change support and production expectations.');
console.log('PASS: Everyday and Professional guided content remain distinct.');
console.log('PASS: Guided Speaking reuses canonical Finnish TTS/STT.');
console.log('PASS: Guided Speaking does not fork the Roleplay session engine.');
console.log('PASS: stage 7 hands off to the existing open Roleplay surface.');
console.log('PASS: Guided Speaking drawer leaves remain behind existing entitlement checks.');
console.log('GUIDED_SPEAKING_INVARIANTS=PASS');
