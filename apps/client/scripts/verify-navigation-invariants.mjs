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
const utilityDrawer = read('../../packages/ui/components/UtilityDrawer.tsx');

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
  sidebar,
  "id: 'everyday'",
  'progressive drawer must expose an Everyday top-level branch',
);

requireText(
  sidebar,
  "id: 'professional'",
  'progressive drawer must expose a Professional top-level branch',
);

requireText(
  sidebar,
  "id: 'yki'",
  'progressive drawer must expose a YKI top-level branch when entitled',
);

requireText(
  sidebar,
  "activity: 'everyday-cards-vocabulary'",
  'Everyday vocabulary must be reachable as a guarded drawer leaf',
);

requireText(
  sidebar,
  "activity: 'professional-reading'",
  'Professional reading must be reachable as a guarded drawer leaf',
);

requireText(
  sidebar,
  "id: 'everyday-speaking'",
  'Everyday speaking must be a progressive drawer branch ready for staged speaking children',
);

requireText(
  sidebar,
  "id: 'professional-speaking'",
  'Professional speaking must be a progressive drawer branch',
);

requireText(
  sidebar,
  "activity: 'professional-interview'",
  'Structured professional interview practice must remain reachable from the drawer',
);

requireText(
  sidebar,
  "navigateTo('daily-practice')",
  'the existing Practice hub must be reachable from the drawer',
);

requireText(
  sidebar,
  "navigateTo('help')",
  'Help and support must remain reachable from the drawer',
);

requireText(
  appShell,
  "activeScreen === 'daily-practice'",
  'the current Practice location must be identified when the drawer opens',
);

requireText(
  appShell,
  "activeScreen === 'help'",
  'the current Help location must be identified when the drawer opens',
);

requireText(
  utilityDrawer,
  'minHeight: 52',
  'drawer navigation rows must keep a mobile-friendly touch target',
);

requireText(
  utilityDrawer,
  'width: 44,\n    height: 44',
  'drawer close control must keep a mobile-friendly touch target',
);

forbidText(
  sidebar,
  'router.',
  'drawer configuration must not become a second routing authority',
);

requireText(
  utilityDrawer,
  'accessibilityState={hasChildren ? { expanded }',
  'expandable drawer controls must publish expanded/collapsed accessibility state',
);

requireText(
  utilityDrawer,
  'return [...current.slice(0, depth), itemId];',
  'opening a drawer branch must collapse any sibling at the same depth',
);

requireText(
  utilityDrawer,
  'if (hasChildren) {\n              toggleBranch(itemId, depth);\n              return;',
  'drawer branches must expand without navigating',
);

requireText(
  utilityDrawer,
  'onClose();\n            item.onPress?.();',
  'drawer leaves must close once immediately before navigation',
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
  'drawer navigation callback must close once before guarded navigation',
);

const entitlementGuardIndex = appShell.indexOf(
  "if (!isEntitledForScreen(screen))",
);
const drawerActivityIndex = appShell.indexOf(
  "if (options?.activity)",
);

if (
  entitlementGuardIndex < 0 ||
  drawerActivityIndex < 0 ||
  drawerActivityIndex < entitlementGuardIndex
) {
  throw new Error(
    'Navigation invariant failed: drawer leaf routing must execute only after the existing entitlement guard',
  );
}

requireText(
  appShell,
  "initialExpandedItemId={drawerInitialExpandedItemId}",
  'drawer must receive the current unambiguous pathway as its initial expanded branch',
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
console.log('PASS: progressive drawer branches expose accessible expanded state.');
console.log('PASS: one sibling branch is open per hierarchy depth.');
console.log('PASS: branch presses expand without navigating.');
console.log('PASS: drawer leaf shortcuts execute only after entitlement checks.');
console.log('PASS: Practice and Help remain reachable from the drawer.');
console.log('PASS: Everyday and Professional Speaking are progressive branches.');
console.log('PASS: structured Professional interview remains reachable.');
console.log('PASS: drawer controls preserve mobile-friendly touch targets.');
console.log('PASS: current pathway can reopen its drawer branch.');
console.log('PASS: localhost behavior is development-only.');
console.log('NAVIGATION_INVARIANTS=PASS');
