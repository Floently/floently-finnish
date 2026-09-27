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
    throw new Error(`Card level gate invariant failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Card level gate invariant failed: ${label}`);
  }
}

const screen = read('features/cards/screens/CardPracticeScreen.tsx');
const session = read('features/cards/components/CardPracticeSession.tsx');
const gate = read('features/cards/components/CardLevelGate.tsx');
const hook = read('features/cards/hooks/useCardPractice.ts');
const service = read('features/cards/services/cardsService.ts');
const store = read('state/cardLevelPreferenceStore.ts');
const appShell = read('state/AppShell.tsx');
const ykiPractice = read('state/YkiPracticeRoute.tsx');


requireText(
  screen,
  'if (!preferencesHydrated) void hydratePreferences();',
  'Cards direct entry must hydrate the persisted theme preference',
);
requireText(
  screen,
  "position: 'relative'",
  'Cards top navigation must establish an explicit stacking context',
);
requireText(
  screen,
  'zIndex: 100',
  'Cards top navigation must remain above later decorative content',
);
requireText(
  screen,
  'elevation: 12',
  'Cards top navigation must preserve overlap priority on Android',
);
requireText(
  screen,
  "backgroundColor: '#FFFFFF'",
  'light-mode Back control must use an opaque readable surface',
);
requireText(
  screen,
  "color: isDark ? palette.primary : '#2D4FA5'",
  'Back label must keep strong light-mode contrast and canonical dark color',
);

for (const level of ['A1_A2', 'B1_B2', 'C1_C2']) {
  requireText(gate, `value: '${level}'`, `level choice ${level} must be visible`);
  requireText(store, `value === '${level}'`, `persisted level validation must accept ${level}`);
}

requireText(
  session,
  'const [confirmedLevel, setConfirmedLevel] = useState<CardLevelBand | null>(null);',
  'card sessions must begin unconfirmed',
);
requireText(
  session,
  'level: confirmedLevel,',
  'only the explicitly confirmed level may enter the card scope',
);
requireText(
  session,
  'useCardPractice(mode, scope, confirmedLevel !== null)',
  'card practice must stay disabled until level confirmation',
);
requireText(
  hook,
  'if (!enabled || !scope?.level)',
  'the hook must fail closed when level confirmation is absent',
);
requireText(
  service,
  "if (!scope?.level) throw new Error('Choose a level before starting card practice.');",
  'the service boundary must reject unscoped card session starts',
);
requireText(
  session,
  'setConfirmedLevel(null);',
  'mode/restart transitions must be able to invalidate confirmation',
);
requireText(
  session,
  'onPress={sessionCompleted ? () => setConfirmedLevel(null) : () => router.back()}',
  'restart must return to level confirmation rather than silently start another session',
);
requireText(
  session,
  'void rememberCardLevel(levelContextKey, selectedLevel);',
  'confirmed level must be remembered for later preselection',
);
requireText(
  gate,
  'onPress={onConfirm}',
  'level selection must have a separate explicit confirmation action',
);
requireText(
  gate,
  '>Which level do you want to practise?</Text>',
  'learner must see an explicit level question',
);
forbidText(
  appShell,
  'everyday-cards-vocabulary&level=',
  'drawer must not silently bypass the level gate with a hidden level',
);

forbidText(
  ykiPractice,
  "router.push('/cards?mode=vocabulary&domain=general'",
  'YKI practice must not present general cards as YKI-specific material before suitability certification',
);
forbidText(
  ykiPractice,
  "t('ykiRouteCardsTitle')",
  'YKI practice must not advertise uncertified YKI Cards',
);
requireText(
  ykiPractice,
  'onStartRoleplay(roleplayConfig)',
  'removing the idle YKI shortcut must preserve speaking-task handoff to roleplay',
);

console.log('PASS: card practice starts only after explicit level confirmation.');
console.log('PASS: A1-A2, B1-B2 and C1-C2 are the supported learner choices.');
console.log('PASS: remembered levels preselect without auto-starting.');
console.log('PASS: mode changes and restarts return to level confirmation.');
console.log('PASS: the service boundary rejects unscoped card session starts.');
console.log('PASS: uncertified general cards are not advertised as YKI-specific material.');
console.log('CARD_LEVEL_GATE_INVARIANTS=PASS');
