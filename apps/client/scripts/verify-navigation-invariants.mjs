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
    throw new Error(`Navigation invariant failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Navigation invariant failed: ${label}`);
  }
}

const appShell = read('state/AppShell.tsx');
const sidebar = read('config/navigation/AppShell_sidebar_sections.ts');
const learningRoute = read('state/LearningRoute.tsx');
const appFlowStore = read('state/appFlowStore.ts');
const learnRouting = read('state/learnRouting.ts');

requireText(
  sidebar,
  "learningBranch: 'everyday'",
  'Everyday Finnish drawer item must explicitly request the everyday branch',
);

requireText(
  sidebar,
  "| 'progress'",
  'Progress must remain an allowed drawer destination',
);

requireText(
  sidebar,
  "navigateTo('progress')",
  'Progress must remain exposed in the user drawer',
);

requireText(
  appShell,
  "options?: DrawerNavigationOptions",
  'AppShell must accept the shared drawer navigation options type',
);

requireText(
  appShell,
  "goToLearn('/?branch=everyday')",
  'web Everyday Finnish navigation must preserve the branch in the URL',
);

requireText(
  appShell,
  'const activeScreenRef = useRef(activeScreen);',
  'route reconciliation must keep a non-reactive active-screen reference',
);

requireText(
  appShell,
  'const currentActiveScreen = activeScreenRef.current;',
  'route reconciliation must read activeScreen through the ref',
);

const reconciliationAnchor = appShell.indexOf(
  'void resolveRequestedRoute(requestedScreen);',
);

if (reconciliationAnchor < 0) {
  throw new Error(
    'Navigation invariant failed: route reconciliation anchor is missing',
  );
}

const reconciliationTail = appShell.slice(
  reconciliationAnchor,
  reconciliationAnchor + 1800,
);

const dependencyMatch = reconciliationTail.match(
  /\}, \[([^\]]*)\]\);/,
);

if (!dependencyMatch) {
  throw new Error(
    'Navigation invariant failed: route reconciliation dependency list is missing',
  );
}

if (dependencyMatch[1].includes('activeScreen')) {
  throw new Error(
    'Navigation invariant failed: activeScreen must not be a route-reconciliation dependency',
  );
}

requireText(
  dependencyMatch[1],
  'requestedScreen',
  'requestedScreen must drive route reconciliation',
);

requireText(
  dependencyMatch[1],
  'subscriptionGuardKey',
  'entitlement changes must drive route reconciliation',
);

forbidText(
  appFlowStore,
  'learningBranch:',
  'diagnostic global learningBranch state must not be reintroduced',
);

forbidText(
  appShell,
  'setLearningBranch(',
  'AppShell must not recreate duplicate learning-branch state',
);

forbidText(
  learningRoute,
  'useAppFlowStore',
  'LearningRoute branch state must remain local and URL-driven',
);

requireText(
  learningRoute,
  "rawBranch === 'everyday' ? 'everyday' : 'hub'",
  'LearningRoute must derive its initial branch from the URL',
);

requireText(
  appShell,
  'setDrawerOpen(false);\n      void navigateTo(route, options);',
  'drawer navigation must close once before navigation',
);

requireText(
  learnRouting,
  "__DEV__",
  'localhost routing support must remain development-only',
);

requireText(
  learnRouting,
  "hostname === 'localhost'",
  'localhost development must stay on the local origin',
);

console.log('PASS: Everyday Finnish drawer destination is explicit.');
console.log('PASS: Progress is exposed as a drawer destination.');
console.log('PASS: route reconciliation cannot depend on activeScreen.');
console.log('PASS: duplicate global learning-branch state is absent.');
console.log('PASS: LearningRoute remains URL-driven.');
console.log('PASS: drawer closes once before navigation.');
console.log('PASS: localhost behavior is development-only.');
console.log('NAVIGATION_INVARIANTS=PASS');
