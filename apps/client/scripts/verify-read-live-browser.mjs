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
  'app/products.tsx',
  'app/create/index.tsx',
  'app/learn/index.tsx',
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
const readReaderRoute = read('app/read/reader.tsx');
const readAppRoute = read('app/read/app.tsx');
const readWorkspace = read('features/read/mobile/ReadWebWorkspaceScreen.tsx');
const readLandingRoute = read('app/read/index.tsx');
const productsRoute = read('app/products.tsx');
const createRoute = read('app/create/index.tsx');
const learnRoute = read('app/learn/index.tsx');
const rootRoute = read('app/index.tsx');
const webParity = read('features/publicMarketing/screens/FloentlyWebParityScreens.tsx');
const canonicalGateway = read('../main-domain-static/index.html');
const canonicalReadLanding = read('../main-domain-static/read/index.html');
const canonicalCreate = read('../main-domain-static/create/index.html');
const readAuth = read('features/read/mobile/ReadAuthScreen.tsx');
const readStore = read('features/read/mobile/readMobileStore.ts');
const readTts = read('features/read/mobile/readTtsApi.ts');
const readAi = read('features/read/mobile/readAiApi.ts');
const readRender = read('features/read/mobile/readRenderApi.ts');
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
assert.ok(browser.includes('onContentProcessDidTerminate'),
  'iOS Read must distinguish a dead WebKit renderer from a transient network failure');
assert.ok(browser.includes('onRenderProcessGone'),
  'Android Read must distinguish a dead WebView renderer from a transient network failure');
assert.ok(browser.includes("DEFAULT_READ_WORKSPACE_URL = 'https://read.floently.com/app/reader?embed=react-native'"),
  'native signed-in Read must use the canonical web Reader workspace');
assert.ok(browser.includes("type ReadRemoteSurface = 'browser' | 'workspace'") &&
  browser.includes("surface === 'browser'"),
  'the audited Read WebView bridge must support browser and full workspace surfaces without duplicating auth');
assert.ok(readWorkspace.includes('surface="workspace"'),
  'Read workspace wrapper must select the canonical workspace surface');
assert.ok(readReaderRoute.includes('ReadWebWorkspaceScreen') && readAppRoute.includes('ReadWebWorkspaceScreen'),
  'both canonical and legacy signed-in Read entries must land in the same web-parity workspace');
assert.ok(browser.includes('style={styles.errorOverlay}'),
  'transient Browser V2 failures must overlay the mounted WebView instead of destroying its session');
assert.ok(!browser.includes('{loadError ? (\n          <View style={styles.centered}>'),
  'transient Browser V2 failures must not conditionally unmount the WebView');

assert.ok(rootRoute.includes('FloentlyGatewayScreen') && rootRoute.includes("Platform.OS !== 'web'"),
  'native root must render the Floently product gateway while leaving web-host routing intact');
assert.ok(learnRoute.includes('KieliValmisLandingScreen') && learnRoute.includes("Platform.OS === 'web'"),
  'native /learn must open the existing KieliValmis landing while preserving web Learn routing');
assert.ok(readLandingRoute.includes('FloentlyReadLandingScreen'),
  'native /read must render the canonical web-parity Read landing before authentication');
assert.ok(productsRoute.includes('FloentlyGatewayScreen'),
  'products route must use the same canonical Floently gateway as native root');
assert.ok(createRoute.includes('FloentlyCreateComingSoonScreen'),
  'native /create must render the dedicated Floently Create coming-soon page');
assert.ok(landingRoute.includes('return <KieliValmisLandingScreen />'),
  'KieliValmis web-host landing must remain untouched by Read work');
for (const marker of [
  "gateway: 'https://floently.com/'",
  "read: 'https://floently.com/read'",
  "create: 'https://floently.com/create/'",
  "if (path.startsWith('/auth')) return '/auth/login'",
  "if (host === 'create.floently.com') return '/create'",
  "if (path === '/learn') return '/learn'",
  "if (path === '/read') return '/read'",
  "if (path === '/create') return '/create'",
  "if (path.startsWith('/auth')) return '/read/auth'",
]) {
  assert.ok(webParity.includes(marker), `native public web surface missing routing marker: ${marker}`);
}
for (const marker of ['Floently product gateway', 'Floently Learn', 'Floently Read', 'Floently Create', 'Choose your Floently product']) {
  assert.ok(canonicalGateway.includes(marker), `canonical Floently gateway missing marker: ${marker}`);
}
for (const marker of ['AI-Powered Text to Speech', 'landing_page_picture_1.png', 'landing_page_picture_8.png', 'People are listening', 'Lifelike Voices', 'Easy Import', 'Customizable']) {
  assert.ok(canonicalReadLanding.includes(marker), `canonical Read landing missing marker: ${marker}`);
}
for (const marker of ['Coming soon', 'Floently Create', 'Explore Floently Learn', 'Back to Floently']) {
  assert.ok(canonicalCreate.includes(marker), `canonical Create landing missing marker: ${marker}`);
}
for (const marker of [
  "authService.login",
  "authService.register",
  "useGoogleSignIn",
  "secureTextEntry={!showPassword}",
  "accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}",
  "router.replace('/read/reader' as never)",
  "Continue with current Floently account",
]) {
  assert.ok(readAuth.includes(marker), `Read auth missing web-parity marker: ${marker}`);
}

assert.ok(home.includes("Math.min(3"),
  'native Read audio player must support rates through 3x');
assert.ok(readStore.includes("Math.min(3, speed)"),
  'native Read state must persist requested playback rates through 3x');
assert.ok(readStore.includes('setVoiceId: (id, voiceId) =>'),
  'native Read state must own persistent per-document voice selection');
assert.ok(readTts.includes("getReadApi('/api/voices/unified')"),
  'native Read must use the same unified voice catalog as the web Reader');
assert.ok(readTts.includes("azure:fi-FI-SelmaNeural"),
  'native Read must have a Finnish neural default when the document language is Finnish');
assert.ok(readRender.includes('voice_id: input.voiceId') && readRender.includes('voiceId: input.voiceId'),
  'native Read progress sync must persist voice selection to the backend');
assert.ok(home.includes('Voice · ${selectedVoice.name}') && home.includes('onPress={cycleVoice}'),
  'native Read player must expose real voice selection in the playback controller');
assert.ok(home.includes('function readerAudioChunks') && home.includes('playAudioChunk(nextIndex)'),
  'native Read must narrate long documents continuously in bounded TTS chunks');
assert.ok(!home.includes('generatedText.slice(0, 4000)'),
  'native Read must never silently truncate narration to the first 4000 characters');
assert.ok(home.includes('completedChars') && home.includes('displayedProgress'),
  'native Read playback progress must remain document-wide across TTS chunks');
for (const marker of ['Summary & AI', 'Summary', 'Key points', 'Explain', 'Flashcards', 'Quiz me', 'Exam coach', 'Glossary', 'Ask AI']) {
  assert.ok(home.includes(marker), `native Read player missing study/AI control: ${marker}`);
}
assert.ok(readAi.includes('/api/ai/generate'),
  'native Read study tools must use the canonical Read AI endpoint');
assert.ok(readAi.includes("action === 'summary'") && readAi.includes("'summarize'"),
  'native Read Summary must map to the canonical summarize backend action');
assert.ok(readAi.includes("action === 'key_points'"),
  'native Read Key points must map to the canonical key_points backend action');
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
