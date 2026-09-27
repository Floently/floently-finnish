import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const requiredRoutes = [
  'app/read/index.tsx',
  'app/read/app.tsx',
  'app/read/auth.tsx',
  'app/read/import.tsx',
  'app/read/library.tsx',
  'app/read/reader.tsx',
  'app/read/settings.tsx',
  'app/read/analytics.tsx',
  'app/read/subscribe.tsx',
  'app/read/browser.tsx',
];

for (const route of requiredRoutes) {
  assert.ok(exists(route), `Missing canonical Read route: ${route}`);
}

const browser = read('features/read/mobile/ReadLiveBrowserScreen.tsx');
const guard = read('features/read/mobile/ReadProtectedRoute.tsx');
const home = read('features/read/mobile/ReadMobileScreens.tsx');
const drawer = read('config/navigation/AppShell_sidebar_sections.ts');
const appShell = read('state/AppShell.tsx');
const subscribeRoute = read('app/read/subscribe.tsx');
const browserRoute = read('app/read/browser.tsx');
const pkg = JSON.parse(read('package.json'));

assert.equal(pkg.dependencies?.['react-native-webview'], '13.16.1',
  'Read live browser must use the Expo-compatible WebView dependency');

for (const marker of [
  "https://read.floently.com/app/browser-v2/live?embed=react-native",
  "flowReader.auth.apiKey",
  "flowReader.auth.session",
  "injectedJavaScriptObject={",
  "flowReaderAuth: embeddedAuth",
  "injectedJavaScriptBeforeContentLoaded={authBootstrap}",
  "originWhitelist={['https://read.floently.com']}",
  "hostname === READ_BROWSER_HOST",
  "setSupportMultipleWindows={false}",
]) {
  assert.ok(browser.includes(marker), `Live browser missing security/runtime marker: ${marker}`);
}

assert.ok(!/READ_BROWSER_URL[^\n]*token|[?&](token|apiKey)=/i.test(browser),
  'Authentication secrets must never be placed in the live-browser URL');

assert.ok(browser.includes("window.location.assign(browserUrl)"),
  'Web builds must enter the canonical Browser V2 web route directly');

assert.ok(guard.includes('requireReadAccess = true'),
  'Read content guard must require Read access by default');
assert.ok(guard.includes('subscription?.entitlements?.readAccess'),
  'Read content guard must use subscription Read entitlement');
assert.ok(subscribeRoute.includes('requireReadAccess={false}'),
  'Read subscription route must remain reachable without existing Read entitlement');
assert.ok(browserRoute.includes('<ReadProtectedRoute>'),
  'Live browser route must be protected by the Read content gate');
assert.ok(home.includes("navigate('/read/browser')"),
  'Read home must expose the live web Reader');
assert.ok(home.includes("{ key: 'browser', label: 'Browser', route: '/read/browser'"),
  'Read bottom navigation must expose the live Browser');
assert.ok(drawer.includes("onPress: () => void navigateTo('read')"),
  'Signed-in Floently drawer must expose guarded Read navigation');
assert.ok(appShell.includes("if (screen === 'read')"),
  'AppShell must own the Read entitlement/navigation decision');

console.log('READ_LIVE_BROWSER_INVARIANTS=PASS');
