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
const productsRoute = read('app/products.tsx');
const publicMarketing = read('features/publicMarketing/screens/FloentlyWebParityScreens.tsx');
const readAuth = read('features/read/mobile/ReadAuthScreen.tsx');
const readStore = read('features/read/mobile/readMobileStore.ts');
const readTts = read('features/read/mobile/readTtsApi.ts');
const readAi = read('features/read/mobile/readAiApi.ts');
const readRender = read('features/read/mobile/readRenderApi.ts');
const playbackManifest = read('features/read/mobile/readingPlaybackManifest.ts');
const landingRoute = read('state/LandingRoute.tsx');
const pkg = JSON.parse(read('package.json'));
const appBase = JSON.parse(read('app.base.json'));

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

assert.ok(browser.includes("parsed.searchParams.set('embed', 'react-native')"),
  'native Browser V2 URL overrides must preserve the React Native compatibility contract');
assert.ok(browser.includes("parsed.searchParams.delete('embed')"),
  'Expo web builds must not impersonate the React Native injected-auth bridge');
assert.ok(browser.includes('key={`${user.id}:${reloadKey}`}'),
  'React Native Read browser must remount when the signed-in account changes');
assert.ok(browser.includes("Platform.OS !== 'web'"),
  'native iOS/Android must retain the WebView path while Expo web redirects to Browser V2');
assert.ok(browser.includes('const restartBrowserView = () =>') &&
  browser.includes('setReloadKey((value) => value + 1)'),
  'native Read reconnect must hard-remount the outer WebView while preserving the server-side Chromium profile');
assert.ok(browser.includes('onContentProcessDidTerminate'),
  'iOS Read must distinguish a dead WebKit renderer from a transient network failure');
assert.ok(browser.includes('onRenderProcessGone'),
  'Android Read must distinguish a dead WebView renderer from a transient network failure');
assert.ok(browser.includes('style={styles.errorOverlay}'),
  'transient Browser V2 failures must overlay the mounted WebView instead of destroying its session');
assert.ok(!browser.includes('{loadError ? (\n          <View style={styles.centered}>'),
  'transient Browser V2 failures must not conditionally unmount the WebView');

assert.ok(readLandingRoute.includes('FloentlyReadLandingScreen') &&
  readLandingRoute.includes('return <FloentlyReadLandingScreen />'),
  'native /read must render the current public Floently Read landing before authentication');
assert.ok(productsRoute.includes('FloentlyGatewayScreen') &&
  productsRoute.includes('return <FloentlyGatewayScreen />'),
  'product gateway must render the current Floently cross-product gateway');
assert.ok(landingRoute.includes('return <KieliValmisLandingScreen />'),
  'KieliValmis direct entry must remain untouched by Read work');
for (const marker of [
  "read: 'https://floently.com/read'",
  "gateway: 'https://floently.com/'",
  "surface === 'read' && path === '/read'",
  "if (host === 'learn.floently.com')",
  "if (host === 'read.floently.com')",
  "Platform.OS !== 'web'",
  "originWhitelist={['https://*']}",
  "setSupportMultipleWindows={false}",
  "sharedCookiesEnabled",
  "thirdPartyCookiesEnabled",
  "allowsInlineMediaPlayback",
  "mediaPlaybackRequiresUserAction={false}",
]) {
  assert.ok(publicMarketing.includes(marker), `public Floently surface missing web-parity marker: ${marker}`);
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

assert.ok(home.includes("Math.min(2"),
  'native Read audio player must clamp playback to the Expo-supported mobile 2x maximum');
assert.ok(readStore.includes("Math.min(2, speed)"),
  'native Read state must persist only playback rates supported by native iOS/Android');
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
assert.ok(home.includes('createReadingPlaybackManifest') && home.includes('playAudioChunk(nextIndex)'),
  'native Read must narrate long documents through a document-wide logical playback manifest');
assert.ok(!home.includes('generatedText.slice(0, 4000)'),
  'native Read must never silently truncate narration to the first 4000 characters');
assert.ok(home.includes('readingProgressForSegment') && home.includes('displayedProgress'),
  'native Read playback progress must remain document-wide across hidden TTS segments');
assert.ok(home.includes('updateInterval: 100'),
  'native Read must use smooth high-frequency playback status updates');
assert.ok(home.includes('preload(result.audioUrl'),
  'native Read must preload upcoming narration audio before chunk handoff');
assert.ok(home.includes('preferredForwardBufferDuration: 30'),
  'native Read must keep a forward buffer for stable long-form playback');
assert.ok(home.includes('readingPrefetchIndexes(readingManifest, index, 120, 4)'),
  'native Read must preload by a time horizon instead of exposing a fixed chunk cadence');
assert.ok(playbackManifest.includes('estimatedPlaybackDurationSeconds') &&
  playbackManifest.includes('BASE_WORDS_PER_MINUTE = 170'),
  'native Read must estimate the complete reading duration immediately from the full document manifest');
assert.ok(playbackManifest.includes('formatReadingClock') &&
  home.includes('formatReadingClock(totalSeconds)'),
  'native Read must display multi-hour whole-document time rather than current-clip duration');
assert.ok(playbackManifest.includes('readingPositionForProgress') &&
  playbackManifest.includes('readingProgressForSegment'),
  'logical document progress must map both directions across hidden media segments');
assert.ok(home.includes('readingPositionForProgress') && home.includes('resumeFractionRef') && home.includes('player.seekTo'),
  'native Read must map the saved logical document cursor back into its hidden audio segment');
assert.ok(home.includes('async function seekDocumentBySeconds(deltaSeconds: number)') &&
  home.includes('displayedProgress + deltaSeconds / totalSeconds') &&
  home.includes('accessibilityLabel="Back 10 seconds"') &&
  home.includes('accessibilityLabel="Forward 10 seconds"'),
  'native Read skip controls must seek on the logical document timeline across hidden segment boundaries');
assert.ok(!home.includes('playbackStatus.currentTime - 10'),
  'native Read must not implement back-10 as a current-clip-only seek');
assert.ok(home.includes('shouldPlayInBackground: true') && home.includes('setActiveForLockScreen'),
  'native Read must configure sustained background and lock-screen playback');
assert.ok(appBase.expo?.plugins?.some((plugin) =>
  Array.isArray(plugin) && plugin[0] === 'expo-audio' && plugin[1]?.enableBackgroundPlayback === true),
  'Expo native config must enable background playback for the final binary');
assert.ok(readStore.includes('progressSyncChains') && readStore.includes('queueProgressSync'),
  'native Read progress writes must be serialized to prevent stale resume overwrites');
for (const marker of ['Summary & AI', 'Summary', 'Key points', 'Explain', 'Flashcards', 'Quiz me', 'Exam coach', 'Glossary', 'Ask AI']) {
  assert.ok(home.includes(marker), `native Read player missing study/AI control: ${marker}`);
}
assert.ok(readAi.includes('/api/ai/generate'),
  'native Read study tools must use the canonical Read AI endpoint');
assert.ok(readAi.includes("action === 'summary'") && readAi.includes("'summarize'"),
  'native Read Summary must map to the canonical summarize backend action');
assert.ok(readAi.includes("action === 'key_points'"),
  'native Read Key points must map to the canonical key_points backend action');
assert.ok(home.includes("[0.8, 1.0, 1.2, 1.5, 1.8, 2.0]"),
  'native Read settings must expose the supported mobile speed range through 2x');
assert.ok(!home.includes("2.25,2.5,2.75,3") && !home.includes("2.25, 2.5, 2.75, 3.0"),
  'native Read must not advertise unsupported playback rates above 2x');
assert.ok(home.includes('NOW READING'),
  'native Read player must keep the active reading text visible');
assert.ok(home.includes('activeParagraphIndex'),
  'native Read document must visually track the active paragraph');
assert.ok(readTts.includes('normalizeWordTimings') && home.includes('timedChunkProgress'),
  'native Read must use TTS timing metadata for smoother visual progress');
assert.ok(!home.includes('paragraphs.slice(0, 24)'),
  'native Read must render the complete document instead of truncating after 24 paragraphs');

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
