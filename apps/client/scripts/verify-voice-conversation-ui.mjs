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
const speakingRoute = read('state/SpeakingRoute.tsx');
const packageJson = JSON.parse(read('package.json'));
const designSpec = fs.readFileSync(
  path.join(clientRoot, '..', '..', 'docs', 'design', 'KLYMIS_SPEAKING_VOICE_CONVERSATION_UI.md'),
  'utf8',
);

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

assert.ok(
  speakingRoute.includes('onOpenMenu={onOpenMenu}') &&
    screen.includes('onMenu={onOpenMenu}') &&
    experience.includes('accessibilityLabel="Menu"') &&
    experience.includes('onPress={onMenu}'),
  'the circular header menu control must open the real app menu rather than masquerade as Back',
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
  'Tap the orb to speak',
  'Tap the orb again to finish',
  'Swipe up to type',
  "state === 'completed'",
  "!textMode ? (",
  'presentationStyle="pageSheet"',
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

assert.ok(
  experience.includes('testID="voice-orb"') &&
    experience.includes('onPress={onPress}') &&
    experience.includes('onMicPress();') &&
    experience.includes("state === 'userSpeaking'") &&
    experience.includes("state === 'userListening'"),
  'the voice orb must be the direct start/stop microphone control during the learner turn',
);

assert.ok(
  !experience.includes('Swipe up to speak or type'),
  'swipe-up must not be taught as a prerequisite for voice response',
);

assert.ok(
  speakingRoute.includes('const preferencesHydrated = usePreferencesStore') &&
    speakingRoute.includes('const hydratePreferences = usePreferencesStore') &&
    speakingRoute.includes('if (!preferencesHydrated) void hydratePreferences();'),
  'Speaking route must hydrate persisted preferences before relying on the canonical theme',
);

assert.ok(
  screen.includes('const themeMode = usePreferencesStore') &&
    screen.includes('dark={!isLight}') &&
    screen.includes("{ backgroundColor: isLight ? '#F8FBFF' : '#09101F' }") &&
    experience.includes('dark: boolean;') &&
    !experience.includes('const dark = false') &&
    experience.includes("const textColor = dark ? '#F3F6FF' : '#14213A';"),
  'voice conversation must follow the canonical app theme instead of forcing the light palette',
);

assert.ok(
  experience.includes('const trayMicEnabled =') &&
    experience.includes('disabled={!trayMicEnabled}') &&
    experience.includes('if (!trayMicEnabled) return;') &&
    experience.includes("state === 'userListening'") &&
    experience.includes("state === 'userSpeaking'") &&
    experience.includes("state === 'error'"),
  'alternate tray microphone must preserve the learner-turn gate and must not bypass AI/processing states',
);

assert.ok(
  experience.includes('Swipe up to type') &&
    experience.includes('accessibilityLabel=') &&
    experience.includes("'Stop speaking'") &&
    experience.includes("'Start speaking'"),
  'orb and typing interactions must expose clear start/stop and swipe-to-type semantics',
);

console.log('VOICE_UI_MINIMAL_SURFACE=PASS');
console.log('VOICE_UI_ROTATING_TRANSCRIPT=PASS');
console.log('VOICE_UI_ORB_TAP_MIC_CONTROL=PASS');
console.log('VOICE_UI_SWIPE_TO_TYPE_ONLY=PASS');
console.log('VOICE_UI_CONTEXTUAL_INPUT_TRAY=PASS');
console.log('VOICE_UI_TEXT_MODE_NO_ORB=PASS');
console.log('VOICE_UI_REDUCED_MOTION=PASS');
console.log('VOICE_UI_CANONICAL_AUDIO_PATH=PASS');
console.log('VOICE_CONVERSATION_UI_INVARIANTS=PASS');


for (const requiredDesignRule of [
  'Main live Roleplay surface contains no chat bubbles.',
  'Text-only mode removes the orb.',
  'Tapping the orb starts recording when the learner\'s turn is ready.',
  'Tapping the orb again stops recording and submits through the canonical STT path.',
  'Swipe-up is not required for voice response; it reveals typing and secondary controls.',
  'Reduce Motion removes perspective/large movement.',
  'Existing recorder/STT/TTS authority remains unchanged.',
]) {
  assert.ok(
    designSpec.includes(requiredDesignRule),
    `voice UI design authority is missing rule: ${requiredDesignRule}`,
  );
}

console.log('VOICE_UI_DESIGN_AUTHORITY=PASS');
