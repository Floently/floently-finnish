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
    throw new Error(`Practice one-next-session invariant failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Practice one-next-session invariant failed: ${label}`);
  }
}

const route = read('features/practice/IntegratedPracticeRoute.tsx');
const composer = read('features/practice/composer.ts');
const featureEntry = read('state/FeatureEntryRoute.tsx');

requireText(
  featureEntry,
  'return <IntegratedPracticeRoute onBack={onBack} onOpenMenu={onOpenMenu} />;',
  'daily-practice must continue mounting the integrated Practice Hub',
);
requireText(
  route,
  "const [scope, setScope] = useState<PracticeScope>('all');",
  'default Practice scope must remain the curriculum-safe all-pathway preset',
);
requireText(
  route,
  'const [targetMinutes, setTargetMinutes] = useState<PracticeTargetMinutes>(10);',
  'default Practice time budget must remain 10 minutes',
);
requireText(
  route,
  'const [customizeOpen, setCustomizeOpen] = useState(false);',
  'customization must be collapsed by default',
);
requireText(
  route,
  'title={`Practice for up to ${targetMinutes} minutes`}',
  'setup must present one ready session card',
);
requireText(
  route,
  'actionLabel="Start practice"',
  'ready session must expose one obvious Start action',
);
requireText(
  route,
  'onPress={preview.length ? startSession : undefined}',
  'Practice must not start when the deterministic composer has no compatible tasks',
);
requireText(
  route,
  "label={customizeOpen ? 'Close customization' : 'Customize session'}",
  'secondary controls must be behind one Customize action',
);
requireText(
  route,
  '{customizeOpen ? (',
  'duration, scope and plan controls must render only inside the customization layer',
);

for (const minutes of [5, 10, 20]) {
  requireText(
    route,
    String(minutes),
    `${minutes}-minute budget must remain available`,
  );
}
for (const scope of ["'all'", "'everyday'", "'professional'", "'yki'"]) {
  requireText(route, scope, `Practice scope ${scope} must remain available`);
}

requireText(
  route,
  'subtitle={`${remainingMinutes} minutes available · one task at a time`}',
  'active Practice must remain one task at a time',
);
requireText(
  route,
  'Why these tasks?',
  'composer-derived explanation must remain available',
);
forbidText(
  route,
  'Choose a time budget and pathway scope. Practice mixes',
  'the old choice-heavy setup instruction must not return',
);
forbidText(
  composer,
  'Math.random',
  'Practice composition must remain deterministic',
);
forbidText(
  route,
  'best for you',
  'curriculum-only Practice must not invent personalized recommendation claims',
);
forbidText(
  route,
  'weak area',
  'curriculum-only Practice must not invent weakness claims',
);

console.log('PASS: Practice opens with one ready 10-minute session and one Start action.');
console.log('PASS: 5/10/20-minute and pathway controls remain available behind Customize.');
console.log('PASS: active Practice remains one task at a time.');
console.log('PASS: composer truth/explanations remain intact and deterministic.');
console.log('PRACTICE_ONE_NEXT_SESSION_INVARIANTS=PASS');
