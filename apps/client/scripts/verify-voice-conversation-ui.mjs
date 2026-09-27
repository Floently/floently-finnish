import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

const screen = read('features/speaking/screens/RoleplayConversationScreen.tsx');
const experience = read('features/speaking/components/VoiceConversationExperience.tsx');
const recorder = read('features/speaking/hooks/useRoleplayRecorder.ts');
const packageJson = JSON.parse(read('package.json'));

assert.ok(
  screen.includes('<VoiceConversationExperience'),
  'Roleplay conversation must render the minimal voice conversation surface',
);
assert.ok(
  !screen.includes('<RoleplayTranscriptList'),
  'live Roleplay UI must not render the old vertically accumulating transcript list',
);
assert.ok(
  !screen.includes('<WaveformMicRing'),
  'live Roleplay UI must not render the old permanent microphone ring',
);
assert.ok(
  !screen.includes('style={[styles.sessionCard'),
  'live Roleplay UI must not render the old conversation card shell',
);
assert.ok(
  !screen.includes('placeholder="Kirjoita vastaus tarvittaessa…"'),
  'live Roleplay UI must not keep the old permanent manual input visible',
);

for (const required of [
  "type VoiceConversationUiState",
  "'aiSpeaking'",
  "'userListening'",
  "'userSpeaking'",
  "'processing'",
  "'completed'",
  "onStart: () => setConversationUiState('aiSpeaking')",
  "onFinish: () => setConversationUiState('userListening')",
  "amplitude={recorder.amplitude}",
  "textMode={textMode}",
  "setTextMode(true)",
]) {
  assert.ok(screen.includes(required), `Roleplay voice state is missing: ${required}`);
}

for (const required of [
  'function AmbientBackground',
  'function VoiceOrb',
  'function TranscriptStage',
  'useReducedMotion()',
  'PanResponder.create',
  'Swipe up to speak or type',
  "state === 'completed'",
  "!textMode ? (",
  "presentationStyle="pageSheet"",
  'Conversation complete',
  'Review or continue',
  'Previous',
  'Next',
]) {
  assert.ok(experience.includes(required), `Voice conversation experience is missing: ${required}`);
}

assert.ok(
  experience.includes('translateY: interpolate(progress, [0, 1], [0, -112])') &&
    experience.includes('translateX: interpolate(progress, [0, 1], [0, -74])') &&
    experience.includes('rotateY:'),
  'previous transcript must recede toward the upper-left with perspective when motion is allowed',
);

assert.ok(
  experience.includes('if (reduceMotion)') &&
    experience.includes('opacity: 1 - progress'),
  'Reduce Motion must fall back to a simpler crossfade/translation',
);

assert.ok(
  recorder.includes('setAmplitude(normalized)'),
  'orb energy must continue to derive from the canonical microphone amplitude meter',
);

assert.equal(
  packageJson.dependencies?.['@shopify/react-native-skia'],
  undefined,
  'voice UI must not add a new Skia native dependency',
);

assert.ok(
  experience.includes("turn.speaker !== 'assistant' || state !== 'aiSpeaking'"),
  'only known AI text may use progressive visual word reveal',
);
assert.ok(
  !experience.includes('fakePartialTranscript') &&
    !experience.includes('simulatedUserTranscript'),
  'UI must not fabricate live user speech-recognition results',
);

console.log('VOICE_UI_MINIMAL_SURFACE=PASS');
console.log('VOICE_UI_ROTATING_TRANSCRIPT=PASS');
console.log('VOICE_UI_CONTEXTUAL_INPUT_TRAY=PASS');
console.log('VOICE_UI_TEXT_MODE_NO_ORB=PASS');
console.log('VOICE_UI_REDUCED_MOTION=PASS');
console.log('VOICE_UI_CANONICAL_AUDIO_PATH=PASS');
console.log('VOICE_CONVERSATION_UI_INVARIANTS=PASS');
