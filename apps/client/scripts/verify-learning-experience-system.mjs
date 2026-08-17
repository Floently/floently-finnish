import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const experienceRoot = path.join(root, 'packages/ui/learningExperience');

function read(name) {
  const file = path.join(experienceRoot, name);
  if (!fs.existsSync(file)) throw new Error(`Missing learning experience file: ${name}`);
  return fs.readFileSync(file, 'utf8');
}

function requireText(source, text, message) {
  if (!source.includes(text)) throw new Error(message);
}

function forbidText(source, text, message) {
  if (source.includes(text)) throw new Error(message);
}

const tokens = read('tokens.ts');
const motion = read('motion.tsx');
const haptics = read('haptics.ts');
const identity = read('identity.tsx');
const progress = read('progress.tsx');
const focus = read('focus.tsx');
const semanticState = read('semanticState.tsx');
const illustration = read('illustration.tsx');
const barrel = read('index.ts');

requireText(tokens, 'quick: 180', 'Typical quick transition must stay within the Wave-1 motion budget.');
requireText(tokens, 'standard: 240', 'Typical transition token missing.');
requireText(tokens, 'success: 480', 'Meaningful success duration must remain in the Wave-1 range.');
requireText(tokens, 'milestone: 800', 'Milestone duration must remain restrained.');
requireText(tokens, 'minimum: 44', 'Learning touch targets must keep the 44-point mobile minimum.');
requireText(tokens, "grammar: { label: 'Grammar review'", 'Grammar-review identity is required.');

requireText(motion, 'useReducedMotion()', 'Motion wrapper must read the system reduced-motion preference.');
requireText(motion, 'ReduceMotion.System', 'Reanimated builders must preserve system reduced-motion behavior.');
requireText(motion, 'testReduceMotionOverride', 'Reduced-motion behavior must have a deterministic test override.');
requireText(motion, "return { duration: 0, enter: false, exit: false, layout: false }", 'Reduced motion must suppress non-essential movement.');
forbidText(motion, 'withRepeat', 'Learning motion primitives must not expose looping animation.');
forbidText(motion, 'withSequence', 'Learning motion primitives should remain restrained rather than sequence effects.');

requireText(haptics, "options.enabled === false", 'Haptic helper must support an explicit safe no-op.');
requireText(haptics, 'catch {', 'Haptic helper must contain platform/API failures.');
requireText(haptics, 'return false;', 'Haptic failures/disabled states must resolve safely.');
forbidText(haptics, "'tap'", 'Routine tap haptics are forbidden in the learning semantic helper.');
forbidText(haptics, "'navigation'", 'Routine navigation haptics are forbidden in the learning semantic helper.');

requireText(identity, 'accessibilityLabel={`Pathway:', 'Pathway identity must have a screen-reader label.');
requireText(identity, 'accessibilityLabel={`Skill:', 'Skill identity must have a screen-reader label.');
requireText(identity, "pathway === 'yki'", 'YKI identity must have a restrained distinct treatment.');

requireText(progress, 'flexWrap:', 'Practice progress must wrap on small screens and long labels.');
requireText(progress, 'minHeight: learningTouchTarget.minimum', 'Interactive progress nodes must meet the touch-target contract.');
requireText(progress, 'accessibilityRole="progressbar"', 'Practice progress needs progress semantics.');
requireText(progress, 'accessibilityRole="button"', 'Interactive path nodes need button semantics.');
requireText(progress, 'accessibilityState={{ selected }}', 'Current/selected semantics must remain separate from keyboard focus.');
requireText(progress, 'onFocus={() => setFocused(true)}', 'Interactive path nodes need explicit keyboard-focus state.');
requireText(progress, 'onBlur={() => setFocused(false)}', 'Interactive path nodes must clear keyboard-focus state.');
requireText(progress, 'borderColor: focused ? palette.primary', 'Keyboard focus must have a strong primary-color perimeter.');
requireText(progress, 'borderWidth: focused ? 2 : 1', 'Keyboard focus must render a two-point perimeter.');
requireText(progress, 'backgroundColor: focused ? palette.primarySurface', 'Keyboard focus needs a second visible cue beyond border width alone.');
requireText(progress, 'flexShrink: 1', 'Progress labels must be able to wrap/shrink without fixed clipping.');
forbidText(progress, 'numberOfLines=', 'Progress labels must not be forcibly truncated.');
forbidText(progress, 'onFocus={() => onPress', 'Keyboard focus must not activate a practice step.');

forbidText(focus, 'react-native-reanimated', 'Focus surfaces must remain static and independent from animation runtime.');
forbidText(focus, 'withRepeat', 'Focus surfaces must never contain looping motion.');
forbidText(focus, 'setInterval', 'Focus surfaces must never start ambient timers.');
requireText(focus, "mode: LearningFocusMode", 'Focus surface must cover explicit learning focus modes.');
requireText(focus, "mode === 'yki'", 'Formal YKI focus needs intentionally restrained treatment.');
requireText(focus, "startsWith('A1')", 'A1 must support stronger visual scaffolding.');
requireText(focus, "startsWith('A2')", 'A2 must support moderate visual scaffolding.');

requireText(semanticState, "tone: SemanticFeedbackTone", 'Semantic feedback tone contract is required.');
requireText(semanticState, "tone === 'error' ? 'alert'", 'Errors must expose alert semantics.');
requireText(semanticState, "tone === 'error' ? 'assertive' : 'polite'", 'Dynamic non-error feedback must use a polite live region while errors remain assertive.');
requireText(semanticState, 'accessibilityLiveRegion={liveRegion}', 'Semantic feedback must expose the live-region contract.');
forbidText(semanticState, '.focus()', 'Semantic feedback must not steal focus when status changes.');
requireText(semanticState, "kind === 'loading'", 'Loading state is required.');
requireText(semanticState, "LearningStatePanelKind = 'loading' | 'empty' | 'error'", 'Loading/empty/error states must stay explicit.');

requireText(illustration, "{ decorative: true; accessibilityLabel?: never }", 'Decorative illustration contract must forbid redundant labels.');
requireText(illustration, "{ decorative?: false; accessibilityLabel: string }", 'Semantic illustrations must require a label at type level.');
requireText(illustration, "accessibilityRole={!decorative ? 'image'", 'Semantic illustrations need image semantics.');
requireText(illustration, 'transition={0}', 'Raster illustration convention must not add decorative image transition motion by default.');

for (const source of [tokens, motion, haptics, identity, progress, focus, semanticState, illustration]) {
  for (const forbidden of ['/composer', '/auth', '/cards', '/roleplay', '/exam', 'navigationModel', 'AppShell']) {
    forbidText(source, forbidden, `Experience presentation layer must not depend on business/protected surface: ${forbidden}`);
  }
}

for (const exported of ['./focus', './haptics', './identity', './illustration', './motion', './progress', './semanticState', './tokens']) {
  requireText(barrel, exported, `Missing learning experience export: ${exported}`);
}

const rootIndex = fs.readFileSync(path.join(root, 'packages/ui/index.ts'), 'utf8');
requireText(rootIndex, './learningExperience', 'packages/ui must export the learning experience system.');

console.log('LEARNING_EXPERIENCE_SYSTEM=PASS');
console.log('REDUCED_MOTION_GUARD=PASS');
console.log('FOCUS_LOOP_GUARD=PASS');
console.log('HAPTIC_SEMANTICS_GUARD=PASS');
console.log('SMALL_SCREEN_LABEL_GUARD=PASS');
console.log('ACCESSIBILITY_CONTRACT_GUARD=PASS');
console.log('KEYBOARD_FOCUS_APPEARANCE_GUARD=PASS');
console.log('LIVE_REGION_FEEDBACK_GUARD=PASS');
console.log('BUSINESS_LOGIC_BOUNDARY_GUARD=PASS');
