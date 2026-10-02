import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

async function importTypeScript(relative) {
  const source = read(relative);
  const javascript = ts.transpileModule(source, {
    fileName: relative,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

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
const deviceBrowser = read('features/read/mobile/ReadDeviceBrowserScreen.tsx');
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
const mediaSession = read('features/read/mobile/readDocumentMediaSession.ts');
const playbackRuntime = await importTypeScript('features/read/mobile/readingPlaybackManifest.ts');
const landingRoute = read('state/LandingRoute.tsx');
const pkg = JSON.parse(read('package.json'));
const appBase = JSON.parse(read('app.base.json'));

assert.equal(pkg.dependencies?.['react-native-webview'], '13.16.1',
  'Read device browser must use the Expo-compatible native WebView dependency');

for (const marker of [
  "source={{ uri: currentUrl }}",
  "originWhitelist={['http://*', 'https://*', 'about:*', 'data:*', 'blob:*']}",
  "setSupportMultipleWindows={false}",
  "domStorageEnabled",
  "sharedCookiesEnabled",
  "thirdPartyCookiesEnabled",
  "cacheEnabled",
  "allowsInlineMediaPlayback",
  "onShouldStartLoadWithRequest",
  "onOpenWindow",
  "onContentProcessDidTerminate",
  "onRenderProcessGone",
  "setReloadKey((value) => value + 1)",
]) {
  assert.ok(deviceBrowser.includes(marker), `Device browser missing native/runtime marker: ${marker}`);
}

assert.ok(deviceBrowser.includes("window.location.assign(WEB_BROWSER_URL)"),
  'Expo web may continue into Browser V2, while native must remain local');
assert.ok(deviceBrowser.includes("Platform.OS !== 'web'"),
  'native iOS/Android must retain the local WebView path');
assert.ok(browserRoute.includes('ReadDeviceBrowserScreen') &&
  !browserRoute.includes('ReadLiveBrowserScreen'),
  'native /read/browser must route to the local device browser, not the remote Browser V2 framebuffer');
assert.ok(!deviceBrowser.includes('flowReader.auth.apiKey') &&
  !deviceBrowser.includes('flowReader.auth.session') &&
  !deviceBrowser.includes('injectedJavaScriptObject'),
  'app authentication secrets must never be injected into arbitrary websites');
assert.ok(deviceBrowser.includes('PROTECTED_AUTH_HOSTS') &&
  deviceBrowser.includes("isProtectedAuthenticationUrl(currentUrl)") &&
  deviceBrowser.includes('Reader stays out of authentication') &&
  deviceBrowser.includes('input[autocomplete~="current-password"]') &&
  deviceBrowser.includes('input[autocomplete~="webauthn"]') &&
  deviceBrowser.includes('Finish signing in before starting Reader on this page.'),
  'Reader extraction must stay out of protected authentication hosts and visible password/passkey forms');
assert.ok(deviceBrowser.includes('WATCH_LIVE_AUTH_STATE') &&
  deviceBrowser.includes('FLOENTLY_DEVICE_BROWSER_AUTH_STATE') &&
  deviceBrowser.includes('MutationObserver') &&
  deviceBrowser.includes('setPageAuthActive(active)') &&
  deviceBrowser.includes("setStatus('Sign-in active · Reader paused')"),
  'Browser Reader must detect dynamically opened credential forms and yield the screen/audio session to sign-in');
assert.ok(deviceBrowser.includes('IOS_PASSKEY_PASSWORD_FALLBACK') &&
  deviceBrowser.includes('FLOENTLY_DEVICE_BROWSER_PASSKEY_DEFERRED') &&
  deviceBrowser.includes("options && options.publicKey") &&
  deviceBrowser.includes("'NotAllowedError'") &&
  deviceBrowser.includes("Platform.OS === 'ios' ? IOS_PASSKEY_PASSWORD_FALLBACK : undefined") &&
  deviceBrowser.includes('injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}') &&
  deviceBrowser.includes('accessibilityLabel="Open this sign-in in Safari"'),
  'iOS embedded browsing must prevent an unusable WebAuthn/passkey sheet from trapping the user and provide password/Safari fallback');
assert.ok(deviceBrowser.includes('Object.getPrototypeOf(credentials)'),
  'iOS passkey compatibility must also cover WebKit builds that expose CredentialsContainer methods on the prototype');
assert.ok(deviceBrowser.includes('accountSelector') &&
  deviceBrowser.includes('hasVisibleAuthAction') &&
  deviceBrowser.includes('passkey|login\\s*key|security\\s*key') &&
  deviceBrowser.includes('visibleAccount && hasVisibleAuthAction()'),
  'Browser Reader must also recognize username-first/passkey-first login surfaces before a password field exists');
assert.ok(deviceBrowser.includes('getClientRects().length > 0') &&
  deviceBrowser.includes("style.display !== 'none'") &&
  deviceBrowser.includes("style.visibility !== 'hidden'"),
  'hidden login drawers must not falsely disable Reader on otherwise readable pages');
assert.ok(deviceBrowser.includes('injectJavaScript(EXTRACT_READABLE_PAGE)') &&
  deviceBrowser.includes('createReadingPlaybackManifest(pageReading.text, speed, 1400, 220)') &&
  deviceBrowser.includes('readTtsApi.prerenderReading') &&
  deviceBrowser.includes('player.replace(result.audioUrl)'),
  'native website Read must narrate the extracted content while staying on the original webpage');
assert.ok(deviceBrowser.includes('downloadFirst: false') &&
  deviceBrowser.includes("setPlayerExpanded(false)"),
  'browser Read must stream the active voice promptly and auto-minimize the player when narration starts');
assert.ok(deviceBrowser.includes('prefetchGenerationRef') &&
  deviceBrowser.includes('await preloadSegment(nextIndex)') &&
  deviceBrowser.includes('Prioritize the immediately upcoming hidden segment'),
  'browser Read lookahead must prioritize the nearest hidden segment instead of stampeding TTS with parallel future requests');
assert.ok(deviceBrowser.includes('nextIndex === indexes[0]') &&
  deviceBrowser.includes('setTimeout(resolve, 450)'),
  'browser Read must give the immediately upcoming hidden handoff one bounded preload retry');
assert.ok(deviceBrowser.includes('audioPrepareCache') &&
  deviceBrowser.includes('const inFlight = audioPrepareCache.current.get(key)') &&
  deviceBrowser.includes('audioPrepareCache.current.set(key, request)'),
  'browser Read must deduplicate overlapping active/lookahead neural TTS requests for the same hidden segment');
assert.ok(deviceBrowser.includes('audioCache.current.size > 16') &&
  deviceBrowser.includes('preloadCache.current.size > 12') &&
  deviceBrowser.includes('clearPreloadedSource(oldestUrl)'),
  'browser Read must keep long-session prepared/preloaded audio caches bounded');
assert.ok(deviceBrowser.includes('audioGenerationRef') &&
  deviceBrowser.includes('if (audioGenerationRef.current !== generation) return;') &&
  home.includes('if (audioGenerationRef.current !== generation) return;'),
  'native Readers must ignore stale TTS completions/errors after navigation, document changes, stop, reload, or voice reset');
assert.ok(deviceBrowser.includes('activePlaybackKeyRef') &&
  deviceBrowser.includes('startedPlaybackKeyRef') &&
  deviceBrowser.includes('playbackStatus.didJustFinish') &&
  home.includes('activePlaybackKeyRef') &&
  home.includes('startedPlaybackKeyRef'),
  'native Readers must ignore stale didJustFinish ticks after replacing a hidden audio segment');
assert.ok(deviceBrowser.includes('BROWSER_READER_PREFS_KEY') &&
  deviceBrowser.includes('AsyncStorage.getItem(BROWSER_READER_PREFS_KEY)') &&
  deviceBrowser.includes('AsyncStorage.setItem('),
  'browser Read speed and voice must persist across page changes/reopens instead of resetting per page');
assert.ok(deviceBrowser.includes('BROWSER_LAST_URL_KEY') &&
  deviceBrowser.includes('AsyncStorage.getItem(BROWSER_LAST_URL_KEY)') &&
  deviceBrowser.includes("setStatus('Restoring your last page…')") &&
  deviceBrowser.includes('!isProtectedAuthenticationUrl(navigation.url)'),
  'closing/reopening Browser Reader must restore the last non-auth page instead of losing the working site after the first session');
assert.ok(deviceBrowser.includes('inferBrowserReadingLanguage') &&
  deviceBrowser.includes('document.querySelector(\'meta[http-equiv="content-language"]\')') &&
  !deviceBrowser.includes('navigator.language ||') &&
  deviceBrowser.includes('const browserVoices = useMemo(() =>') &&
  deviceBrowser.includes("language: reading?.language || 'auto'"),
  'browser Read must prefer declared/content-detected language instead of assuming the device locale for TTS');
assert.ok(deviceBrowser.includes('voiceChangeResumeRef.current = {') &&
  deviceBrowser.includes('autoplay: wasPlaying') &&
  deviceBrowser.includes('void playSegment(resume.index)') &&
  deviceBrowser.includes('void preloadSegment(resume.index).catch(() => {})'),
  'changing Browser Reader voice must preserve the logical cursor and continue automatically when it was already playing');
assert.ok(deviceBrowser.includes('BROWSER_READER_PROGRESS_PREFIX') &&
  deviceBrowser.includes('browserReadingProgressKey') &&
  deviceBrowser.includes("setStatus(savedProgress > 0 ? 'Resuming this page'"),
  'browser Read must resume the same page at its saved logical position without converting it to a library document');
assert.ok(deviceBrowser.includes('browserReadingFingerprint(reading.text)') &&
  deviceBrowser.includes('const playbackIdentity = reading'),
  'browser Read audio/playback identity must include page content so dynamic same-URL lessons cannot reuse stale narration');
assert.ok(deviceBrowser.includes('browserReadingFingerprint') &&
  deviceBrowser.includes('Math.imul(hash, 16777619)') &&
  deviceBrowser.includes('browserReadingFingerprint(reading.text)'),
  'browser progress/TTS cache identity must include page content so dynamic same-URL lessons cannot reuse stale narration');
assert.ok(deviceBrowser.includes('function browserPageIdentity(value: string)') &&
  deviceBrowser.includes("parsed.hash = '';") &&
  deviceBrowser.includes('isSameBrowserReadingPage(navigation.url, reading!.url)') &&
  deviceBrowser.includes('${browserPageIdentity(reading.url)}:${browserReadingFingerprint(reading.text)}:${activeSegment}') &&
  deviceBrowser.includes('const hashOnlyNavigation =') &&
  deviceBrowser.includes("setStatus(hashOnlyNavigation && reading ? 'Reading this page'"),
  'hash-only SPA navigation/load events must keep narration and hidden-segment playback guards on one canonical page identity');
assert.ok(deviceBrowser.includes('styles.compactBar') &&
  deviceBrowser.includes('accessibilityLabel="Expand reader controls"') &&
  deviceBrowser.includes('compactRemaining') &&
  deviceBrowser.includes('compactProgressTrack'),
  'browser Read must expose a single-row compact default player with optional expanded controls');
assert.ok(deviceBrowser.includes('accessibilityLabel="Seek through reading"') &&
  deviceBrowser.includes('progressTrackWidth') &&
  deviceBrowser.includes('event.nativeEvent.locationX / progressTrackWidth'),
  'expanded Browser Reader timeline must be tappable as a whole-document seek control');
assert.ok(deviceBrowser.includes("browserArea: { flex: 1, position: 'relative'") &&
  deviceBrowser.includes('zIndex: 100') &&
  deviceBrowser.includes('elevation: 20') &&
  deviceBrowser.includes('width: 44') &&
  deviceBrowser.includes('minHeight: 44'),
  'browser Reader transport must stay above the WebView hit-test surface with phone-sized touch targets');
assert.ok(home.includes('readerDock: { position: \'absolute\'') &&
  home.includes('zIndex: 100') &&
  home.includes('elevation: 20') &&
  home.includes('readerCompactExpand: { width: 44, height: 44'),
  'standalone Reader transport must stay above content with minimum 44-point expansion controls');
assert.ok(deviceBrowser.includes("!reading || loading || audioState === 'extracting' || loadError || pageAuthActive") &&
  deviceBrowser.includes('onPress={beginReadingExtraction}') &&
  !deviceBrowser.includes('onPress={reading ? togglePlayback : beginReadingExtraction}'),
  'once in-page reading exists, transport must live in one player surface, except the sign-in status surface while authentication owns the page');
assert.ok(deviceBrowser.includes('setControlsHidden(true)') &&
  deviceBrowser.includes('accessibilityLabel="Show reader controls"') &&
  deviceBrowser.includes('hiddenPlayerPill') &&
  deviceBrowser.includes('hiddenPlayerTime') &&
  deviceBrowser.includes('hiddenPlayerLiveDot') &&
  deviceBrowser.includes('const playbackHasStarted ='),
  'browser Read must auto-hide only after real playback starts and keep a small active-reading/time capsule');
assert.ok(deviceBrowser.includes('const stopReadingPage = () =>') &&
  deviceBrowser.includes('accessibilityLabel="Stop reading this page"'),
  'browser Read must let the user stop/remove narration without navigating away from the webpage');
assert.ok(deviceBrowser.includes('persistBrowserProgress(1)') &&
  deviceBrowser.includes('if (!isPlaying && displayedProgress >= 0.999)') &&
  deviceBrowser.includes('void playSegment(0)'),
  'completed browser readings must stay at 100% and restart the whole page from the beginning on Play');
assert.ok(!deviceBrowser.includes("router.push('/read/reader' as never)") &&
  !deviceBrowser.includes("sourceType: 'browser'"),
  'pressing Read in the native browser must not convert/navigate the webpage into a separate text Reader');
assert.ok(deviceBrowser.includes('buildReadingFocusScript') &&
  deviceBrowser.includes('data-floently-reading-focus') &&
  deviceBrowser.includes("scrollIntoView({ block: 'center', behavior: 'smooth' })"),
  'browser narration must follow/highlight the original webpage without replacing its content');
assert.ok(deviceBrowser.includes('score: text.length + semantic + wholePage - density * 7000') &&
  !deviceBrowser.includes('Math.min(text.length, 40000)'),
  'browser extraction must prefer the complete multi-section book/page instead of tying/truncating candidates at a fixed text-length cap');
assert.ok(deviceBrowser.includes('pageReadingGenerationRef') &&
  deviceBrowser.includes('latestUrlRef') &&
  deviceBrowser.includes('pageReadingGenerationRef.current !== generation') &&
  deviceBrowser.includes('isSameBrowserReadingPage(pageReading.url, currentLatestUrl)'),
  'late extraction/resume work from a previous page must never start narration after browser navigation');
assert.ok(deviceBrowser.includes('onLoadStart={(event) => {') &&
  deviceBrowser.includes('if (!hashOnlyNavigation) {') &&
  deviceBrowser.includes('if (reading) {') &&
  deviceBrowser.includes('clearPreparedAudio();'),
  'real top-level reload/navigation must stop old narration before the new rendered page becomes interactive while hash-only SPA moves stay continuous');
assert.ok(deviceBrowser.includes('browserVisualPhrase') &&
  deviceBrowser.includes('const bucketSize = 7') &&
  deviceBrowser.includes('audioResult?.wordTimings') &&
  deviceBrowser.includes('buildReadingFocusScript(activeVisualPhrase)'),
  'in-page focus must advance throughout a long hidden audio segment instead of blinking only at segment boundaries');
assert.ok(deviceBrowser.includes("const paragraphs = [];") &&
  deviceBrowser.includes("paragraphs.join('\\\\n\\\\n')") &&
  deviceBrowser.includes("replace(/([.!?])([A-ZÀ-ÖØ-Þ])/g, '$1 $2')"),
  'browser extraction must preserve semantic block boundaries and repair DOM-boundary joins for narration');
assert.ok(deviceBrowser.includes("Browse on this device") &&
  deviceBrowser.includes("Website rendering, touch, cookies and sign-in stay in the phone's native browser engine"),
  'native Browser UI must truthfully describe local device ownership');
assert.ok(deviceBrowser.includes("hardRestart('The website process stopped. Restoring it in a fresh browser…')"),
  'renderer death must replace the native browser surface rather than reattach a stale remote browser');
assert.ok(!deviceBrowser.includes('embed=react-native') &&
  !deviceBrowser.includes('Secure remote browser'),
  'the native browser must not depend on the remote Browser V2 embed topology');
assert.ok(!deviceBrowser.includes('Blocked an unsupported external-app link.'),
  'background custom-scheme probes must not appear as a false browser failure');

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
assert.ok(readTts.includes("20_000") &&
  readTts.includes("Voice generation took too long. Tap Play to retry."),
  'native Read TTS startup must fail visibly instead of leaving the player spinning indefinitely');
assert.ok(home.includes('monitorPlaybackStart') &&
  deviceBrowser.includes('monitorPlaybackStart') &&
  home.includes('Audio did not start. If a call or another app is using audio') &&
  deviceBrowser.includes('Audio did not start. If a call or another app is using audio'),
  'native Readers must surface blocked audio-session startup instead of leaving an endless loading state');
assert.ok(home.includes('clearReadDocumentMediaSession(player)') &&
  deviceBrowser.includes('clearReadDocumentMediaSession(player)') &&
  home.includes('playAttemptRef.current += 1;') &&
  deviceBrowser.includes('playAttemptRef.current += 1;'),
  'startup/buffering failures must stop stale OS media-session state before the user retries');
assert.ok(home.includes("Audio is still buffering. Check the connection") &&
  deviceBrowser.includes("Audio is still buffering. Check the connection") &&
  home.includes('12_000') &&
  deviceBrowser.includes('12_000'),
  'native Readers must bound prolonged media buffering and remain retryable');
assert.ok(readTts.includes("azure:fi-FI-SelmaNeural"),
  'native Read must have a Finnish neural default when the document language is Finnish');
assert.ok(readRender.includes('voice_id: input.voiceId') && readRender.includes('voiceId: input.voiceId'),
  'native Read progress sync must persist voice selection to the backend');
assert.ok(home.includes('Voice · ${selectedVoice.name}') && home.includes('onPress={cycleVoice}'),
  'native Read player must expose real voice selection in the playback controller');
assert.ok(home.includes('const progress = displayedProgress;') &&
  home.includes('resumeFractionRef.current = position.fraction;') &&
  home.includes('setVoiceId(document.id, nextVoice.id)'),
  'changing voice must preserve the exact logical reading cursor');
assert.ok(home.includes('audioGenerationRef.current += 1;') &&
  home.includes('prefetchGenerationRef.current += 1;'),
  'standalone voice changes must invalidate old active/lookahead audio before the new voice request can start');
assert.ok(home.includes('voiceChangeResumeRef') &&
  home.includes('autoplay: wasPlaying') &&
  home.includes('void playAudioChunk(resume.index)'),
  'standalone native Reader must continue narration after a voice change made during playback');
assert.ok(home.includes('clearReadDocumentMediaSession(player)') &&
  home.includes('voiceChangeResumeRef.current = { index: position.index, autoplay: wasPlaying }'),
  'voice replacement must clear the prior logical/physical OS media session before resuming at the same cursor');
assert.ok(deviceBrowser.includes('effectiveVoiceId') &&
  deviceBrowser.includes('catalog.voices.some((voice) => voice.id === current)') &&
  home.includes("selectedVoice?.id || defaultVoiceId || document.voiceId"),
  'native Readers must fall back to an available voice instead of sending a stale saved voice id to TTS');
assert.ok(deviceBrowser.includes('if (!browserVoices.length) return;') &&
  deviceBrowser.includes('browserVoices.findIndex((voice) => voice.id === effectiveVoiceId)'),
  'browser voice cycling must stay within voices compatible with the detected page language');
assert.ok(deviceBrowser.includes('voiceChangeResumeRef') &&
  deviceBrowser.includes('autoplay: wasPlaying') &&
  deviceBrowser.includes('if (resume.autoplay)') &&
  deviceBrowser.includes('void playSegment(resume.index)'),
  'changing Browser Reader voice during playback must preserve the logical cursor and continue automatically');
assert.ok(home.includes('createReadingPlaybackManifest') && home.includes('playAudioChunk(nextIndex)'),
  'native Read must narrate long documents through a document-wide logical playback manifest');
assert.ok(home.includes('styles.readerCompactBar') &&
  home.includes('accessibilityLabel="Expand player"') &&
  home.includes('readerCompactPlay') &&
  home.includes('readerCompactNow'),
  'standalone native Reader must start as a single-row compact player instead of covering the page');
assert.ok(home.includes('setControlsHidden(true)') &&
  home.includes('readerHiddenPill') &&
  home.includes('readerHiddenPillTime') &&
  home.includes('readerHiddenLiveDot') &&
  home.includes('accessibilityLabel="Show reader controls"') &&
  home.includes('const playbackHasStarted ='),
  'standalone Reader must auto-hide only after real playback begins and preserve a minimal active-reading/time capsule');
assert.ok(home.includes("readerHiddenPill: { position: 'absolute', right: 14, bottom: 12, zIndex: 100, elevation: 20"),
  'auto-hidden Reader capsule must remain above document content and keep receiving taps');
assert.ok(!home.includes('generatedText.slice(0, 4000)'),
  'native Read must never silently truncate narration to the first 4000 characters');
assert.ok(home.includes('readingProgressForSegment') && home.includes('displayedProgress'),
  'native Read playback progress must remain document-wide across hidden TTS segments');
assert.ok(home.includes('if (displayedProgress >= 0.999)') &&
  home.includes('setActiveAudioChunk(0)') &&
  home.includes('await playAudioChunk(0)'),
  'completed native readings must replay from document start instead of replaying only the final hidden clip');
assert.ok(home.includes('updateInterval: 100'),
  'native Read must use smooth high-frequency playback status updates');
assert.ok(home.includes('preload(result.audioUrl'),
  'native Read must preload upcoming narration audio before chunk handoff');
assert.ok(home.includes('preferredForwardBufferDuration: 30') &&
  home.includes('downloadFirst: false'),
  'native Read must stream the active clip immediately while keeping a forward buffer for future hidden segments');
assert.ok(home.includes('readingPrefetchIndexes(readingManifest, index, 120, 4)'),
  'native Read must preload by a time horizon instead of exposing a fixed chunk cadence');
assert.ok(deviceBrowser.indexOf('prefetchAhead(index);') <
    deviceBrowser.indexOf('player.replace(result.audioUrl)') &&
  home.indexOf('prefetchReadingHorizon(index);') <
    home.indexOf('player.replace(result.audioUrl)'),
  'both Reader surfaces must start future-audio preparation before active source startup/seek work');
assert.ok(home.includes('prefetchGenerationRef') &&
  home.includes('await preloadAudioChunk(nextIndex)') &&
  home.includes('Warm the next hidden segment before later lookahead'),
  'native Read lookahead must prepare the nearest hidden segment first and cancel stale speculative runs');
assert.ok(home.includes('staggerImmediateHandoffWarmup') &&
  deviceBrowser.includes('staggerImmediateHandoffWarmup') &&
  home.includes('}, 700);') &&
  deviceBrowser.includes('}, 700);'),
  'both Reader surfaces must give the next hidden segment a controlled head start while preserving active-start priority');
assert.ok(home.includes('prepareActiveAudioChunk') &&
  deviceBrowser.includes('prepareActiveSegment') &&
  home.includes('setTimeout(resolve, 350)') &&
  deviceBrowser.includes('setTimeout(resolve, 350)'),
  'active narration must recover once from a transient TTS/CDN failure instead of terminating a long reading immediately');
assert.ok(home.includes('const generation = audioGenerationRef.current;\n    const result = await prepareAudioChunk(index);\n    if (audioGenerationRef.current !== generation) return result;') &&
  deviceBrowser.includes('const generation = audioGenerationRef.current;\n    const result = await prepareSegment(index);\n    if (audioGenerationRef.current !== generation) return;'),
  'stale speculative TTS completions must not repopulate preloaded audio after a voice/page/document reset');
assert.ok(home.includes('nextIndex === indexes[0]') &&
  home.includes('setTimeout(resolve, 450)'),
  'native Read must give the immediately upcoming hidden handoff one bounded preload retry');
assert.ok(home.includes('audioChunkPrepareCache') &&
  home.includes('const inFlight = audioChunkPrepareCache.current.get(key)') &&
  home.includes('audioChunkPrepareCache.current.set(key, request)'),
  'native Read must reuse in-flight TTS preparation instead of issuing duplicate synthesis for one hidden segment');
assert.ok(home.includes('audioChunkCache.current.size > 16') &&
  home.includes('audioPreloadCache.current.size > 12') &&
  home.includes('clearPreloadedSource(oldestUrl)'),
  'native Read must bound long-session hidden audio memory instead of retaining an entire book worth of clips');
assert.ok(home.includes('audioGenerationRef') &&
  home.includes('if (audioGenerationRef.current !== generation) return;'),
  'native Read must ignore old TTS completions after the active document or voice changes');
assert.ok(playbackManifest.includes('estimatedPlaybackDurationSeconds') &&
  playbackManifest.includes('BASE_WORDS_PER_MINUTE = 170'),
  'native Read must estimate the complete reading duration immediately from the full document manifest');
assert.ok(playbackManifest.includes('startupMaxChars') &&
  playbackManifest.includes('The first narration request controls perceived start latency'),
  'native Read must use a small hidden startup segment without turning the whole document into tiny clips');
assert.ok(deviceBrowser.includes("createReadingPlaybackManifest(pageReading.text, speed, 1400, 220)"),
  'browser Read must use a fast startup segment followed by longer hidden narration segments');
assert.ok(home.includes('1800') && home.includes('240'),
  'standalone native Reader must use a fast startup segment followed by long-form hidden narration segments');
assert.ok(playbackManifest.includes('formatReadingClock') &&
  home.includes('formatReadingClock(totalSeconds)'),
  'native Read must display multi-hour whole-document time rather than current-clip duration');
assert.ok(playbackManifest.includes('readingPositionForProgress') &&
  playbackManifest.includes('readingProgressForSegment'),
  'logical document progress must map both directions across hidden media segments');

{
  const longBookText = 'database systems improve reliable decisions. '.repeat(60_000).trim();
  const oneX = playbackRuntime.createReadingPlaybackManifest(longBookText, 1, 1800, 240);
  const twoX = playbackRuntime.createReadingPlaybackManifest(longBookText, 2, 1800, 240);

  assert.ok(oneX.estimatedPlaybackDurationSeconds > 5 * 60 * 60,
    'full-book duration must be known immediately even when it spans multiple hours');
  assert.ok(Math.abs(twoX.estimatedPlaybackDurationSeconds * 2 - oneX.estimatedPlaybackDurationSeconds) < 1,
    'whole-document duration must respond deterministically to playback speed');
  assert.ok(oneX.segments.length > 20 &&
    oneX.segments[0].text.length <= 240 &&
    oneX.segments.slice(1).some((segment) => segment.text.length > 700),
    'manifest must use a fast startup segment without degrading the entire book into tiny clips');

  for (const progress of [0, 0.1, 0.5, 0.9, 0.99]) {
    const position = playbackRuntime.readingPositionForProgress(oneX, progress);
    const roundTrip = playbackRuntime.readingProgressForSegment(
      oneX,
      position.index,
      position.fraction,
    );
    assert.ok(Math.abs(roundTrip - progress) < 0.0001,
      `logical seek/progress round-trip drifted at ${progress}`);
  }

  const lookahead = playbackRuntime.readingPrefetchIndexes(oneX, 1, 120, 4);
  const lookaheadSeconds = lookahead.reduce(
    (total, index) => total + (oneX.segments[index]?.estimatedPlaybackDurationSeconds || 0),
    0,
  );
  assert.ok(lookahead.length >= 1 && lookahead.length <= 4 && lookaheadSeconds >= 120,
    'prefetch plan must cover the requested listening horizon without expanding without bound');
  assert.equal(playbackRuntime.formatReadingClock(3661), '1:01:01',
    'multi-hour readings must keep an hours-aware logical clock');
}
assert.ok(home.includes('readingPositionForProgress') && home.includes('resumeFractionRef') && home.includes('player.seekTo'),
  'native Read must map the saved logical document cursor back into its hidden audio segment');
assert.ok(home.includes('async function seekDocumentBySeconds(deltaSeconds: number)') &&
  home.includes('displayedProgress + deltaSeconds / totalSeconds') &&
  home.includes('accessibilityLabel="Back 10 seconds"') &&
  home.includes('accessibilityLabel="Forward 10 seconds"'),
  'native Read skip controls must seek on the logical document timeline across hidden segment boundaries');
assert.ok(home.includes('seekGenerationRef') &&
  deviceBrowser.includes('seekGenerationRef') &&
  home.includes('seekGenerationRef.current !== seekGeneration') &&
  deviceBrowser.includes('seekGenerationRef.current !== seekGeneration') &&
  home.includes('audioGenerationRef.current !== seekAudioGeneration') &&
  deviceBrowser.includes('audioGenerationRef.current !== seekAudioGeneration'),
  'rapid whole-document scrubbing must cancel stale seek/TTS completions instead of snapping back to an older hidden source');
assert.ok(home.includes('readerProgressTrackWidth') &&
  home.includes('accessibilityLabel="Seek through reading"') &&
  home.includes('event.nativeEvent.locationX / readerProgressTrackWidth'),
  'expanded native Reader timeline must be directly tappable for whole-document seeking');
assert.ok(home.includes('If the active AVPlayer item is not seekable yet') &&
  deviceBrowser.includes('the ±10 second control appear dead'),
  'native and browser Reader seek controls must recover if the active media item is temporarily unseekable');
assert.ok(deviceBrowser.includes('await prepareSegment(target.index)') &&
  deviceBrowser.includes('player.replace(result.audioUrl)') &&
  deviceBrowser.includes('enableLockScreen(totalSeconds * targetProgress)') &&
  home.includes('await prepareAudioChunk(target.index)') &&
  home.includes('enableLockScreenControls(totalSeconds * targetProgress)'),
  'paused cross-segment seeks must load the target hidden source so lock-screen Play resumes at the requested whole-document position');
assert.ok(deviceBrowser.includes('const clearPreparedAudio = () => {') &&
  deviceBrowser.includes('clearReadDocumentMediaSession(player)'),
  'stopping/reloading Browser Reader must remove the logical and physical OS media session');
assert.ok(!home.includes('playbackStatus.currentTime - 10'),
  'native Read must not implement back-10 as a current-clip-only seek');
assert.ok(home.includes('shouldPlayInBackground: true') &&
  home.includes('keepAudioSessionActive: true') &&
  deviceBrowser.includes('keepAudioSessionActive: true') &&
  mediaSession.includes('setActiveForLockScreen') &&
  mediaSession.includes('showSeekBackward: true') &&
  mediaSession.includes('showSeekForward: true'),
  'Reader surfaces must keep the native audio session resumable and expose document-level lock-screen transport');
assert.ok(home.includes("interruptionMode: 'doNotMix'") &&
  deviceBrowser.includes("interruptionMode: 'doNotMix'"),
  'both native Reader surfaces must request the audio focus mode required by Expo lock-screen controls');
assert.ok(home.includes('activateReadDocumentMediaSession') &&
  home.includes('syncReadDocumentMediaTimeline') &&
  home.includes('subscribeReadDocumentMediaSeek') &&
  deviceBrowser.includes('activateReadDocumentMediaSession') &&
  deviceBrowser.includes('syncReadDocumentMediaTimeline') &&
  deviceBrowser.includes('subscribeReadDocumentMediaSeek'),
  'both Reader surfaces must publish and consume the whole-document iOS media timeline');
assert.ok(mediaSession.includes('setLogicalLockScreenTimeline') &&
  mediaSession.includes("'logicalSeekRequested'") &&
  mediaSession.includes("Platform.OS === 'ios'"),
  'logical iOS Now Playing duration/elapsed/seek must be bridged explicitly instead of inheriting hidden clip metadata');
assert.ok(
  mediaSession.indexOf('nativePlayer.clearLockScreenControls()') <
    mediaSession.indexOf('nativePlayer.clearLogicalLockScreenTimeline?.()'),
  'clearing the media session must remove Now Playing before dropping the virtual timeline so the hidden clip duration can never flash through',
);
assert.ok(appBase.expo?.plugins?.some((plugin) =>
  Array.isArray(plugin) && plugin[0] === 'expo-audio' && plugin[1]?.enableBackgroundPlayback === true),
  'Expo native config must enable background playback for the final binary');
assert.ok(readStore.includes('progressSyncChains') && readStore.includes('queueProgressSync'),
  'native Read progress writes must be serialized to prevent stale resume overwrites');
assert.ok(home.includes('15 / Math.max(15, readingManifest.estimatedPlaybackDurationSeconds)') &&
  deviceBrowser.includes('15 / totalSeconds') &&
  deviceBrowser.includes("AppState.addEventListener('change'"),
  'long readings must save progress by listening time and on background instead of waiting for a one-percent jump');
assert.ok(home.includes('previousSystemPlayingRef') &&
  deviceBrowser.includes('previousSystemPlayingRef') &&
  home.includes('!wasPlaying || playbackStatus.playing') &&
  deviceBrowser.includes('!wasPlaying || playbackStatus.playing') &&
  home.includes('updateProgress(document.id, displayedProgress)') &&
  deviceBrowser.includes('persistBrowserProgress(displayedProgress)'),
  'lock-screen pause, route change and interruption transitions must persist the current logical cursor even when the in-app Pause handler is bypassed');
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
assert.ok(readStore.includes('Math.max(0.8, Math.min(2,'),
  'persisted/remote Reader speeds must be clamped to the same supported 0.8x–2x range exposed by the UI');
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
assert.ok(home.includes('FlatList') &&
  home.includes('initialNumToRender={14}') &&
  home.includes('maxToRenderPerBatch={10}') &&
  home.includes('windowSize={9}') &&
  home.includes('scrollToIndex({') &&
  home.includes('followActive={isPlaying}'),
  'very long books must virtualize paragraph rendering and keep the active narration in view without truncating document content');
assert.ok(home.includes("document.status !== 'processing'") &&
  home.includes('await refreshDocument(document.id)') &&
  home.includes('attempt < 5 ? 900') &&
  readStore.includes('refreshDocument: (id: string) => Promise<void>') &&
  readStore.includes('readRenderApi.getDocument(id)'),
  'fresh imports must poll their single processing document and become readable automatically when extraction completes');
assert.ok(home.includes('const canPlayDocument = !isProcessing && hasReadableDocument') &&
  home.includes('This reading is not ready yet') &&
  home.includes('label="Retry"') &&
  home.includes('{canPlayDocument ? (controlsHidden && isPlaying ? ('),
  'failed/empty imports must not expose dead playback controls and must offer an explicit targeted retry');
assert.ok(home.includes('buildReaderParagraphIndex') &&
  home.includes('while (low < high)') &&
  home.includes('Math.floor((low + high) / 2)'),
  'very long books must map high-frequency document progress to the active paragraph with a pre-indexed binary search instead of rescanning the book every status tick');

assert.ok(guard.includes('requireReadAccess = true'),
  'Read content guard must require Read access by default');
assert.ok(guard.includes('subscription?.entitlements?.readAccess'),
  'Read content guard must use subscription Read entitlement');
assert.ok(subscribeRoute.includes('requireReadAccess={false}'),
  'Read subscription route must remain reachable without existing Read entitlement');
assert.ok(browserRoute.includes('<ReadProtectedRoute>'),
  'Live browser route must be protected by the Read content gate');
assert.ok(home.includes("navigate('/read/browser')"),
  'Read home must expose the local Browser Reader');
assert.ok(home.includes('label="Open browser"') && !home.includes('Open live browser'),
  'Read home must describe the current local browser instead of the retired remote/live topology');
assert.ok(home.includes("{ key: 'browser', label: 'Browser', route: '/read/browser'"),
  'Read bottom navigation must expose the Browser');
assert.ok(drawer.includes("onPress: () => void navigateTo('read')"),
  'Signed-in Floently drawer must expose guarded Read navigation');
assert.ok(appShell.includes("if (screen === 'read')"),
  'AppShell must own the Read entitlement/navigation decision');

console.log('READ_LIVE_BROWSER_INVARIANTS=PASS');
