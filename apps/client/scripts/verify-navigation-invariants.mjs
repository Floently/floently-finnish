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
  "activity: 'everyday-recorded'",
  'existing Everyday recorded speaking must remain reachable from the Speaking branch',
);

requireText(
  sidebar,
  "activity: 'professional-recorded'",
  'existing Professional recorded speaking must remain reachable from the Speaking branch',
);

requireText(
  sidebar,
  "activity: 'professional-incident-lab'",
  'the existing Workplace Incident Lab must remain reachable from the Professional branch',
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

requireText(
  utilityDrawer,
  "accessibilityLabel={t('commonClose')}",
  'drawer close control must have a localized screen-reader label',
);

requireText(
  utilityDrawer,
  'accessibilityViewIsModal',
  'drawer must expose modal accessibility semantics while open',
);

requireText(
  utilityDrawer,
  'maxWidth: 420',
  'drawer must remain usable on wide tablet/web surfaces',
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

forbidText(
  appShell,
  'setDrawerOpen(false);\n      void navigateTo(route, options);',
  'AppShell must not duplicate the drawer component close before navigation',
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
  "initialExpandedPath={drawerInitialExpandedPath}",
  'drawer must receive the exact current branch path when it is known',
);

requireText(
  appShell,
  "origin?: 'everyday' | 'professional' | 'yki'",
  'speaking navigation must preserve origin without inferring it from translated copy',
);

requireText(
  appShell,
  "['professional', 'professional-speaking']",
  'Professional speaking context must reopen the nested Speaking branch',
);

requireText(
  appShell,
  "['everyday', 'everyday-speaking']",
  'Everyday speaking context must reopen the nested Speaking branch',
);

requireText(
  utilityDrawer,
  'initialExpandedPath?.length',
  'UtilityDrawer must restore nested expansion paths',
);

requireText(
  utilityDrawer,
  "const initialExpandedPathKey = initialExpandedPath?.length",
  'drawer expansion initialization must use a stable value key',
);

forbidText(
  utilityDrawer,
  '[initialExpandedItemId, initialExpandedPath, visible]',
  'drawer expansion must not reset merely because a parent recreated the same path array',
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
console.log('PASS: drawer leaf closes once before navigation.');
console.log('PASS: progressive drawer branches expose accessible expanded state.');
console.log('PASS: one sibling branch is open per hierarchy depth.');
console.log('PASS: branch presses expand without navigating.');
console.log('PASS: drawer leaf shortcuts execute only after entitlement checks.');
console.log('PASS: Practice and Help remain reachable from the drawer.');
console.log('PASS: Everyday and Professional Speaking are progressive branches.');
console.log('PASS: structured Professional interview remains reachable.');
console.log('PASS: existing recorded speaking remains reachable in Everyday and Professional branches.');
console.log('PASS: existing Workplace Incident Lab remains reachable through the guarded Professional branch.');
console.log('PASS: drawer controls preserve mobile-friendly touch targets and modal accessibility semantics.');
console.log('PASS: current route can reopen and identify its exact drawer branch when known.');
console.log('PASS: parent refreshes cannot reset the same user-expanded drawer path by array identity alone.');
console.log('PASS: localhost behavior is development-only.');
await import('./verify-guided-speaking-invariants.mjs');
await import('./verify-card-level-gate.mjs');
await import('./verify-practice-one-next-session.mjs');
console.log('NAVIGATION_INVARIANTS=PASS');
