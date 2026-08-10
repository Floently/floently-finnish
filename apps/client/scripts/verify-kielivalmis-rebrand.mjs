import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const files = {
  config: read('app.config.ts'),
  base: read('app.base.json'),
  landingRoute: read('state/LandingRoute.tsx'),
  landing: read('features/kielivalmis/KieliValmisLandingScreen.tsx'),
  copy: read('features/kielivalmis/kielivalmisCopy.ts'),
  auth: read('features/auth/screens/AuthScreen.tsx'),
  metro: read('metro.config.js'),
  packageJson: read('package.json'),
};

console.log('=== KIELIVALMIS NATIVE REBRAND VERIFIER ===');
console.log(`root=${root}`);
console.log('phase=identity');

const base = JSON.parse(files.base).expo;
const pkg = JSON.parse(files.packageJson);

if (base.name !== 'KieliValmis') throw new Error(`Expo base display name mismatch: ${base.name}`);
if (!files.config.includes("const KIELIVALMIS_APP_NAME = 'KieliValmis'")) throw new Error('Dynamic Expo config lost KieliValmis display name');
if (base.ios?.infoPlist?.CFBundleDisplayName !== 'KieliValmis') throw new Error('iOS CFBundleDisplayName is not KieliValmis');
if (!String(base.ios?.infoPlist?.NSMicrophoneUsageDescription || '').includes('KieliValmis')) throw new Error('Microphone permission copy lost KieliValmis');
if (!String(base.ios?.infoPlist?.NSSpeechRecognitionUsageDescription || '').includes('KieliValmis')) throw new Error('Speech-recognition permission copy lost KieliValmis');
console.log('KIELIVALMIS_NATIVE_DISPLAY_IDENTITY=PASS');

console.log('phase=compatibility-identifiers');
const compatibility = [
  ['slug', base.slug, 'client'],
  ['scheme', base.scheme, 'floently'],
  ['ios.bundleIdentifier', base.ios?.bundleIdentifier, 'com.vitusidi.floently'],
  ['android.package', base.android?.package, 'com.vitusidi.floently'],
  ['runtimeVersion', base.runtimeVersion, '1.0.2'],
  ['owner', base.owner, 'vitus-idi'],
  ['eas.projectId', base.extra?.eas?.projectId, 'fa02c141-0a3b-4dbc-9122-7c1cf31ba42c'],
];
for (const [label, actual, expected] of compatibility) {
  if (actual !== expected) throw new Error(`${label} changed: expected ${expected}, got ${actual}`);
}
if (!files.config.includes("'https://learn-api.floently.com'")) throw new Error('Compatibility API hostname changed');
if (!files.config.includes("const FLOENTLY_APP_SLUG = 'client'")) throw new Error('Compatibility Expo slug guard missing');
console.log('KIELIVALMIS_NATIVE_TECHNICAL_IDS_PRESERVED=PASS');

console.log('phase=landing-routing');
if (!files.landingRoute.includes('import KieliValmisLandingScreen')) throw new Error('LandingRoute does not import KieliValmis landing');
if (!files.landingRoute.includes('return <KieliValmisLandingScreen />')) throw new Error('KieliValmis is not the direct public app entry');
if (files.landingRoute.includes('NativeFloentlyProductGatewayScreen')) throw new Error('Old cross-product gateway is still the KieliValmis default landing route');
console.log('KIELIVALMIS_NATIVE_DIRECT_ENTRY=PASS');

console.log('phase=shared-20-language-copy');
const expectedCodes = ['en','fi','sv','et','es','tr','ru','uk','ar','zh','ku','vi','bn','sq','tl','th','so','ne','fa','ur'];
const declaredMatch = files.copy.match(/KIELIVALMIS_LANGUAGE_CODES\s*=\s*\[([\s\S]*?)\]\s*as const/);
if (!declaredMatch) throw new Error('KieliValmis language-code declaration missing');
const declared = [...declaredMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
if (JSON.stringify(declared) !== JSON.stringify(expectedCodes)) throw new Error(`KieliValmis language set/order mismatch: ${JSON.stringify(declared)}`);

let localeFilesChecked = 0;
for (const code of expectedCodes) {
  const requiredPath = `../../../kielivalmis-domain-static/r4m/locales/${code}.json`;
  if (!files.copy.includes(requiredPath)) throw new Error(`Shared website/app locale require missing: ${code}`);
  const repoRelativeLocale = `../kielivalmis-domain-static/r4m/locales/${code}.json`;
  if (!exists(repoRelativeLocale)) throw new Error(`Shared locale file missing on disk: ${repoRelativeLocale}`);
  const locale = JSON.parse(read(repoRelativeLocale));
  for (const key of ['chooseLanguage','heroKicker','heroTitleA','heroTitleB','heroTitleC','heroLead','start','transition','overlaySpeak','overlayFeedback','overlayReady','aiLabel','pathTitle','card1Title','card2Title','card3Title','ykiTitle','workTitle','langTitle','finalTitle','privacy','terms','support','deleteAccount','footerCopy']) {
    if (typeof locale[key] !== 'string' || !locale[key].trim()) throw new Error(`Shared locale missing ${code}.${key}`);
  }
  localeFilesChecked += 1;
  if (localeFilesChecked % 5 === 0 || localeFilesChecked === expectedCodes.length) {
    console.log(`locale_files_checked=${localeFilesChecked}/${expectedCodes.length}`);
  }
}
if (!files.copy.includes("['ar','fa','ur']")) throw new Error('Native RTL locale guard missing');
console.log('KIELIVALMIS_NATIVE_20_LANGUAGES=PASS');
console.log('KIELIVALMIS_NATIVE_SHARED_WEB_COPY=PASS');

console.log('phase=brand-assets-and-layout');
for (const marker of [
  'kielivalmis-domain-static/r4m/assets/kielivalmis-mark.png',
  'kielivalmis-domain-static/r4m/assets/kielivalmis-hero-ai.webp',
  'KieliValmis',
  'BY FLOENTLY',
  'getKieliValmisCopy',
  'isKieliValmisRtl',
  'usePreferencesStore',
  "router.push('/auth/register'",
  "router.push('/auth/login'",
  'copy.heroTitleA',
  'copy.heroTitleB',
  'copy.heroTitleC',
  'copy.aiLabel',
]) if (!files.landing.includes(marker)) throw new Error(`Native KieliValmis landing marker missing: ${marker}`);
if (!files.metro.includes('repoRoot') || !files.metro.includes('watchFolders')) throw new Error('Metro monorepo sibling-asset support missing');
console.log('KIELIVALMIS_NATIVE_R4N_LANDING=PASS');

console.log('phase=auth-brand');
for (const marker of [
  "kielivalmis-domain-static/r4m/assets/kielivalmis-mark.png",
  'KieliValmis by Floently',
  '<Text style={styles.authBrandName}>KieliValmis</Text>',
  '<Text style={styles.authBrandBy}>BY FLOENTLY</Text>',
  'useGoogleSignIn',
  'authService.login',
  'authService.register',
  'saveLoginEmail',
  'router.replace(returnToPath as never)',
]) if (!files.auth.includes(marker)) throw new Error(`Canonical auth/rebrand marker missing: ${marker}`);
if (files.auth.includes("components/public/logo.png")) throw new Error('Canonical auth screen still references the old Floently logo');
console.log('KIELIVALMIS_NATIVE_AUTH_BRAND=PASS');

console.log('phase=native-icon-gate');
const oldIcon = './assets/images/floently-finnish-icon.png';
const nativeIconPending = base.icon === oldIcon || files.config.includes(`CURRENT_NATIVE_APP_ICON = '${oldIcon}'`);
if (nativeIconPending) {
  console.log('KIELIVALMIS_NATIVE_ICON=PENDING_APPROVED_BINARY_INSTALL');
} else {
  console.log('KIELIVALMIS_NATIVE_ICON=CONFIGURED');
}

console.log('phase=release-safety');
if (base.ios?.buildNumber !== '11') throw new Error('Build number changed during source-only rebrand');
if (base.version !== '1.0.0') throw new Error('App version changed during source-only rebrand');
if (pkg.name !== 'client') throw new Error('Package workspace name unexpectedly changed');
console.log('KIELIVALMIS_NATIVE_RELEASE_VERSION_UNCHANGED=PASS');

console.log('RESULT: KIELIVALMIS NATIVE REBRAND SOURCE CONTRACT PASS');
console.log(`native_icon_gate=${nativeIconPending ? 'PENDING' : 'READY'}`);
