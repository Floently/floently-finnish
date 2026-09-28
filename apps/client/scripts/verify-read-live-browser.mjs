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
const readLandingRoute = read('app/read/index.tsx');
const readAuth = read('features/read/mobile/ReadAuthScreen.tsx');
const landingRoute = read('state/LandingRoute.tsx');
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
  "domStorageEnabled",
  "sharedCookiesEnabled",
  "thirdPartyCookiesEnabled",
  "cacheEnabled",
  "allowsInlineMediaPlayback",
  "mediaPlaybackRequiresUserAction={false}",
  "injectedJavaScriptBeforeContentLoadedForMainFrameOnly",
  "onHttpError",
]) {
  assert.ok(browser.includes(marker), `Live browser missing security/runtime marker: ${marker}`);
}

assert.ok(!/READ_BROWSER_URL[^\n]*token|[?&](token|apiKey)=/i.test(browser),
  'Authentication secrets must never be placed in the live-browser URL');

assert.ok(browser.includes("window.location.assign(browserUrl)"),
  'Web builds must enter the canonical Browser V2 web route directly');

assert.ok(browser.includes("parsed.searchParams.delete('embed')"),
  'Expo web builds must not impersonate the React Native injected-auth bridge');
assert.ok(browser.includes('key={`${user.id}:${reloadKey}`}'),
  'React Native Read browser must remount when the signed-in account changes');
assert.ok(browser.includes("Platform.OS !== 'web'"),
  'native iOS/Android must retain the WebView path while Expo web redirects to Browser V2');
assert.ok(browser.includes("webViewRef.current?.reload()"),
  'native Read must retain in-place WebView reload so same-tab Browser V2 reattach can preserve Chromium');

assert.ok(readLandingRoute.includes('NativeReadPreviewScreen'),
  'native /read must render the public Read landing before authentication');
assert.ok(readLandingRoute.includes("onOpenLearn={() => router.push('/' as never)}"),
  'Read landing must integrate the existing KieliValmis entry without modifying it');
assert.ok(landingRoute.includes('return <KieliValmisLandingScreen />'),
  'KieliValmis direct entry must remain untouched by Read work');

for (const marker of [
  "authService.login",
  "authService.register",
  "useGoogleSignIn",
  "secureTextEntry={!showPassword}",
  "accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}",
  "router.replace('/read/app' as never)",
  "Continue with current Floently account",
]) {
  assert.ok(readAuth.includes(marker), `Read auth missing web-parity marker: ${marker}`);
}

assert.ok(home.includes("Math.min(3"),
  'native Read audio player must support rates through 3x');
assert.ok(home.includes("[0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.25, 2.5, 2.75, 3.0]"),
  'native Read settings must expose the full speed range through 3x');
assert.ok(home.includes('NOW READING'),
  'native Read player must keep the active reading text visible');
assert.ok(home.includes('activeParagraphIndex'),
  'native Read document must visually track the active paragraph');

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
