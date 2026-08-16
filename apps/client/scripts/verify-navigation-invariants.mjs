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
const navigationModel = read('state/navigationModel.ts');
const helpRoute = read('app/help/index.tsx');
const utilityDrawer = read('../../packages/ui/components/UtilityDrawer.tsx');
const helpSurface = read('state/HelpRoute.tsx');
const settingsRoute = read('state/SettingsRoute.tsx');
const billingRoute = read('state/BillingRoute.tsx');
const progressRoute = read('state/ProgressRoute.tsx');
const featureEntryRoute = read('state/FeatureEntryRoute.tsx');
const ykiExamScreen = read('features/yki-exam/screens/YkiExamScreen.tsx');
const ykiPracticeScreen = read('features/yki-practice/screens/YkiPracticeScreen.tsx');

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
  navigationModel,
  'help: "/help"',
  'Help must remain mapped to the canonical /help path',
);

requireText(
  helpRoute,
  '<AppShell requestedScreen="help" />',
  'the /help Expo entry must delegate to the canonical AppShell Help surface',
);

requireText(
  appShell,
  'screen === "help"',
  'AppShell must retain Help as a guarded secondary destination',
);

requireText(
  sidebar,
  "| 'help'",
  'Help must remain an allowed drawer destination',
);

const drawerHelpTargets = sidebar.match(/navigateTo\('help'\)/g) ?? [];
if (drawerHelpTargets.length < 2) {
  throw new Error(
    'Navigation invariant failed: Help must remain discoverable in preview and normal authenticated drawers',
  );
}

requireText(
  sidebar,
  "translate(language, 'settingsHelpAndSupport')",
  'Help drawer labeling must reuse the localized Help and support label',
);

const myPathwaySectionDefinitions =
  sidebar.match(/label: translate\(language, 'drawerMyPathway'\)/g) ?? [];

if (myPathwaySectionDefinitions.length !== 2) {
  throw new Error(
    'Navigation invariant failed: preview and normal flows must each define only one My learning path section',
  );
}

const entitlementAnchor = appShell.indexOf(
  'function isEntitledForScreen',
);

if (entitlementAnchor < 0) {
  throw new Error(
    'Navigation invariant failed: entitlement guard is missing',
  );
}

const entitlementGuard = appShell.slice(
  entitlementAnchor,
  entitlementAnchor + 5000,
);

requireText(
  entitlementGuard,
  'const isAuthenticatedUtilityScreen =',
  'authenticated account utilities must have an explicit entitlement rule',
);

requireText(
  entitlementGuard,
  "screen === 'help' || screen === 'settings'",
  'Help and Settings must remain authenticated account utilities',
);

const authenticatedUtilityAllowances =
  entitlementGuard.match(/isAuthenticatedUtilityScreen \|\|/g) ?? [];

if (authenticatedUtilityAllowances.length !== 2) {
  throw new Error(
    'Navigation invariant failed: authenticated utility allowance must cover both missing-entitlement and no-subscription states',
  );
}

forbidText(
  utilityDrawer,
  'key={section.label}',
  'drawer section identity must not depend on a translated label alone',
);

requireText(
  utilityDrawer,
  "section.items.map((item) => item.label).join('|')",
  'drawer section keys must disambiguate same-label sections',
);


requireText(
  appShell,
  'function pushIfNeeded(screen: GuardedScreen)',
  'user navigation must have an explicit push-history helper',
);

requireText(
  appShell,
  'router.push(path as any);',
  'user navigation must create Expo Router history entries',
);

const navigateToAnchor = appShell.indexOf(
  'async function navigateTo',
);

const handleLogoutAnchor = appShell.indexOf(
  'async function handleLogout',
  navigateToAnchor,
);

if (navigateToAnchor < 0 || handleLogoutAnchor < 0) {
  throw new Error(
    'Navigation invariant failed: navigateTo boundaries are missing',
  );
}

const navigateToBody = appShell.slice(
  navigateToAnchor,
  handleLogoutAnchor,
);

const navigateReplaceCalls =
  navigateToBody.match(/replaceIfNeeded\(/g) ?? [];

if (navigateReplaceCalls.length !== 1) {
  throw new Error(
    'Navigation invariant failed: user navigation may only replace history for entitlement denial',
  );
}

requireText(
  navigateToBody,
  "replaceIfNeeded('billing')",
  'entitlement denial must remain a replace redirect',
);

requireText(
  navigateToBody,
  "router.push(\n            '/learn?branch=everyday' as never,",
  'Everyday native navigation must preserve Back history',
);

const backAnchor = appShell.indexOf(
  'function navigateBack()',
);

if (backAnchor < 0) {
  throw new Error(
    'Navigation invariant failed: navigateBack is missing',
  );
}

const backBody = appShell.slice(
  backAnchor,
  backAnchor + 1400,
);

requireText(
  backBody,
  'router.canGoBack()',
  'Back must check Expo Router history',
);

requireText(
  backBody,
  'router.back();',
  'Back must use Expo Router history when available',
);

forbidText(
  backBody,
  'navigationStack',
  'Back must not use the synthetic persisted navigation stack as interaction history',
);

forbidText(
  appShell,
  'const navigationStack = useAppFlowStore((state) => state.navigationStack);',
  'AppShell must not subscribe to synthetic persisted history once Expo Router owns interaction history',
);

requireText(
  appShell,
  "Platform.OS !== 'web' &&\n      requestedScreen === \"root\"",
  'web root navigation must not be trapped by persisted protected-screen state',
);

requireText(
  appShell,
  "if (Platform.OS === 'web') {\n        replaceIfNeeded(\"home\");\n        await resolveAndPersist(\"home\", \"root\");",
  'web root URL must resolve canonically to Home when allowed',
);

forbidText(
  appShell,
  'onBack={() => void navigateTo("home")}',
  'secondary screens must not hardwire Back to Home',
);

forbidText(
  appShell,
  'onExit={() => void navigateTo("home")}',
  'YKI Exam exit must not hardwire Back to Home',
);

requireText(
  helpSurface,
  "actionLabel={t('commonBack')}",
  'Help must expose a localized Back action',
);

requireText(
  settingsRoute,
  "actionLabel={t('commonBack')}",
  'Settings must expose a localized Back action',
);

requireText(
  billingRoute,
  "actionLabel={t('commonBack')}",
  'Billing must expose a localized Back action',
);

requireText(
  progressRoute,
  "actionLabel={t('commonBack')}",
  'Progress must expose a localized Back action',
);

requireText(
  learningRoute,
  "actionLabel={translate(language, 'commonBack')}",
  'Learning hub must expose a localized Back action',
);

requireText(
  ykiExamScreen,
  "actionLabel={t('commonBack')}",
  'YKI Exam must expose a localized Back action',
);

requireText(
  ykiPracticeScreen,
  "actionLabel={t('commonBack')}",
  'YKI Practice must expose a localized Back action',
);

requireText(
  featureEntryRoute,
  'actionLabel="Back"',
  'legacy FeatureEntry header must identify its previous-page action as Back',
);

requireText(
  featureEntryRoute,
  'backLabel="Back"',
  'legacy FeatureEntry dock must identify its previous-page action as Back',
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
  "branch?: string | string[];",
  'AppShell must observe the Learning branch query parameter',
);

requireText(
  appShell,
  "rawLearningBranch === 'everyday'",
  '/?branch=everyday must be recognized as the Everyday Finnish root alias',
);

requireText(
  appShell,
  "await resolveAndPersist('learning', 'learning');",
  'Everyday Finnish root alias must resolve the Learning surface',
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

requireText(
  dependencyMatch[1],
  'rawLearningBranch',
  'Learning branch query changes must drive route reconciliation',
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
console.log('PASS: /?branch=everyday resolves to Everyday Finnish instead of Home.');
console.log('PASS: Everyday branch query participates in route reconciliation.');
console.log('PASS: Progress is exposed as a drawer destination.');
console.log('PASS: route reconciliation cannot depend on activeScreen.');
console.log('PASS: duplicate global learning-branch state is absent.');
console.log('PASS: LearningRoute remains URL-driven.');
console.log('PASS: drawer closes once before navigation.');
console.log('PASS: localhost behavior is development-only.');
console.log('PASS: Help has a canonical Expo route entry.');
console.log('PASS: Help is discoverable from authenticated drawer states.');
console.log('PASS: My learning path has one section per runtime flow.');
console.log('PASS: Help and Settings remain available without a paid learning entitlement.');
console.log('PASS: drawer section keys cannot collide on section label alone.');
console.log('PASS: user navigation creates Expo Router history entries.');
console.log('PASS: Back uses Expo Router history instead of the synthetic persisted stack.');
console.log('PASS: AppShell no longer subscribes to synthetic persisted navigation history.');
console.log('PASS: web root URL resolves canonically instead of restoring the page just left.');
console.log('PASS: active secondary headers identify previous-page navigation as Back.');
console.log('NAVIGATION_INVARIANTS=PASS');
