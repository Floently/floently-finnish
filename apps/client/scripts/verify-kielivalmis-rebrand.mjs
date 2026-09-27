import crypto from 'node:crypto';
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
  pageHeader: read('../../packages/ui/components/PageHeader.tsx'),
  i18n: read('features/i18n/index.ts'),
  errorBoundary: read('components/diagnostics/FloentlyErrorBoundary.tsx'),
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
  const requiredPath = `../../../kielivalmis-domain-static/locales/${code}.json`;
  if (!files.copy.includes(requiredPath)) throw new Error(`Shared website/app locale require missing: ${code}`);
  const repoRelativeLocale = `../kielivalmis-domain-static/locales/${code}.json`;
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
  'kielivalmis-domain-static/assets/kielivalmis-mark.png',
  'kielivalmis-domain-static/assets/kielivalmis-hero-ai.webp',
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

console.log('phase=react-native-style-types');

for (const unsupportedWeight of [
  "fontWeight:'620'",
  "fontWeight:'650'",
  "fontWeight:'750'",
  "fontWeight:'850'",
]) {
  if (files.landing.includes(unsupportedWeight)) {
    throw new Error(
      `Unsupported React Native font weight remains: ${unsupportedWeight}`
    );
  }
}

if (!files.landing.includes('styles.brandMark as ImageStyle')) {
  throw new Error(
    'KieliValmis brand image style is not explicitly typed as ImageStyle'
  );
}

if (!files.landing.includes('styles.heroImage as ImageStyle')) {
  throw new Error(
    'KieliValmis hero image style is not explicitly typed as ImageStyle'
  );
}

console.log(
  'KIELIVALMIS_NATIVE_REACT_NATIVE_STYLE_TYPES=PASS'
);

console.log('phase=auth-brand');
for (const marker of [
  "kielivalmis-domain-static/assets/kielivalmis-mark.png",
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

console.log('phase=signed-in-app-brand');

if (
  !files.pageHeader.includes(
    'kielivalmis-domain-static/assets/kielivalmis-mark.png'
  )
) {
  throw new Error(
    'Signed-in header does not use the approved KieliValmis mark'
  );
}

if (files.pageHeader.includes('components/public/logo.png')) {
  throw new Error(
    'Signed-in header still references the legacy Floently logo'
  );
}

if (files.pageHeader.includes('>Floently</Text>')) {
  throw new Error(
    'Signed-in header fallback still displays Floently'
  );
}

if (
  !/<Text[^>]*>\s*KieliValmis\s*<\/Text>/.test(
    files.pageHeader
  )
) {
  throw new Error(
    'Signed-in header is missing the KieliValmis name'
  );
}

const catalogLegacyMentions =
  files.i18n.match(/floently/gi) ?? [];

if (catalogLegacyMentions.length !== 0) {
  throw new Error(
    `Main translation catalog still has ${
      catalogLegacyMentions.length
    } Floently references`
  );
}

if (
  files.errorBoundary.includes(
    'Floently encountered an app error'
  )
) {
  throw new Error(
    'User-visible error boundary still displays Floently'
  );
}

if (
  !files.errorBoundary.includes(
    'KieliValmis encountered an app error'
  )
) {
  throw new Error(
    'KieliValmis error-boundary identity is missing'
  );
}

console.log(
  'KIELIVALMIS_SIGNED_IN_APP_BRAND=PASS'
);

console.log('phase=native-icon-gate');

const nativeAssetSpecs = {
  appIcon: {
    relative: 'assets/images/kielivalmis-app-icon.png',
    config: './assets/images/kielivalmis-app-icon.png',
    sha256: '44f807aa15544023ba7179bf7d4db7aeb8e981c70bd80bb2867d5f8a61a70a75',
    colorType: 2,
  },
  androidForeground: {
    relative: 'assets/images/kielivalmis-android-foreground.png',
    config: './assets/images/kielivalmis-android-foreground.png',
    sha256: 'd356ab8c45a24048ec369f061b27c1888a3b512a2df5af0fdeee825e3e126752',
    colorType: 6,
  },
  androidMonochrome: {
    relative: 'assets/images/kielivalmis-android-monochrome.png',
    config: './assets/images/kielivalmis-android-monochrome.png',
    sha256: 'fa95aac34c15ef2fe977a7106be48cbec8e8479c6dd6c715bf4ed7ac0ab6029b',
    colorType: 6,
  },
  splash: {
    relative: 'assets/images/kielivalmis-splash-icon.png',
    config: './assets/images/kielivalmis-splash-icon.png',
    sha256: '38e3b88ddebb450a6a3d24ef8c7a105c86ca92cf0ba247bab4b5af7a42bd34fc',
    colorType: 6,
  },
};

function verifyApprovedPng(label, spec) {
  const absolute = path.join(root, spec.relative);

  if (!fs.existsSync(absolute)) {
    throw new Error(
      `Approved native asset missing: ${label}`
    );
  }

  const data = fs.readFileSync(absolute);

  if (
    data.subarray(0, 8).toString('hex') !==
    '89504e470d0a1a0a'
  ) {
    throw new Error(
      `Approved native asset is not PNG: ${label}`
    );
  }

  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  const bitDepth = data[24];
  const colorType = data[25];

  const sha256 = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');

  if (width !== 1024 || height !== 1024) {
    throw new Error(
      `Approved native asset has wrong dimensions: ${label} ${width}x${height}`
    );
  }

  if (bitDepth !== 8) {
    throw new Error(
      `Approved native asset has wrong bit depth: ${label} ${bitDepth}`
    );
  }

  if (colorType !== spec.colorType) {
    throw new Error(
      `Approved native asset has wrong PNG color type: ${label} ${colorType}`
    );
  }

  if (sha256 !== spec.sha256) {
    throw new Error(
      `Approved native asset SHA mismatch: ${label}`
    );
  }

  console.log(
    `native_asset=${label} width=${width} height=${height} sha256=${sha256}`
  );
}

for (const [label, spec] of Object.entries(nativeAssetSpecs)) {
  verifyApprovedPng(label, spec);
}

if (base.icon !== nativeAssetSpecs.appIcon.config) {
  throw new Error(
    'Expo root icon is not the approved KieliValmis app icon'
  );
}

if (base.ios?.icon !== nativeAssetSpecs.appIcon.config) {
  throw new Error(
    'iOS icon is not the approved KieliValmis app icon'
  );
}

if (base.android?.icon !== nativeAssetSpecs.appIcon.config) {
  throw new Error(
    'Android icon is not the approved KieliValmis app icon'
  );
}

if (
  base.android?.adaptiveIcon?.foregroundImage !==
  nativeAssetSpecs.androidForeground.config
) {
  throw new Error(
    'Android adaptive foreground is not the approved asset'
  );
}

if (
  base.android?.adaptiveIcon?.monochromeImage !==
  nativeAssetSpecs.androidMonochrome.config
) {
  throw new Error(
    'Android monochrome icon is not the approved asset'
  );
}

if (
  base.android?.adaptiveIcon?.backgroundColor !==
  '#071832'
) {
  throw new Error(
    'Android adaptive background lost KieliValmis navy'
  );
}

const splashPlugin = (base.plugins ?? []).find(
  (plugin) =>
    Array.isArray(plugin) &&
    plugin[0] === 'expo-splash-screen'
);

if (!splashPlugin) {
  throw new Error(
    'expo-splash-screen configuration missing'
  );
}

const splashConfig = splashPlugin[1] ?? {};

if (
  splashConfig.image !==
  nativeAssetSpecs.splash.config
) {
  throw new Error(
    'Splash image is not the approved KieliValmis splash asset'
  );
}

if (
  splashConfig.backgroundColor !== '#071832' ||
  splashConfig.dark?.backgroundColor !== '#071832'
) {
  throw new Error(
    'Splash background lost KieliValmis navy'
  );
}

if (
  !files.config.includes(
    "const KIELIVALMIS_NATIVE_APP_ICON = './assets/images/kielivalmis-app-icon.png'"
  )
) {
  throw new Error(
    'Dynamic Expo config lost approved KieliValmis icon'
  );
}

if (files.config.includes('CURRENT_NATIVE_APP_ICON')) {
  throw new Error(
    'Legacy dynamic native icon constant remains'
  );
}

const legacyVisualRefs = [
  './assets/images/floently-finnish-icon.png',
  './assets/images/android-icon-foreground.png',
  './assets/images/android-icon-monochrome.png',
  './assets/images/splash-icon.png',
];

for (const legacyRef of legacyVisualRefs) {
  const quotedJson = `"${legacyRef}"`;
  const quotedTs = `'${legacyRef}'`;

  if (
    files.base.includes(quotedJson) ||
    files.config.includes(quotedTs)
  ) {
    throw new Error(
      `Legacy native visual asset reference remains: ${legacyRef}`
    );
  }
}

const nativeIconPending = false;

console.log(
  'KIELIVALMIS_NATIVE_ICON=APPROVED_BINARY_READY'
);

console.log(
  'KIELIVALMIS_NATIVE_ASSET_HASHES=PASS'
);

console.log('phase=release-safety');
if (base.ios?.buildNumber !== '11') throw new Error('Build number changed during source-only rebrand');
if (base.version !== '1.0.0') throw new Error('App version changed during source-only rebrand');
if (pkg.name !== 'client') throw new Error('Package workspace name unexpectedly changed');
console.log('KIELIVALMIS_NATIVE_RELEASE_VERSION_UNCHANGED=PASS');

console.log('RESULT: KIELIVALMIS NATIVE REBRAND SOURCE CONTRACT PASS');
console.log(`native_icon_gate=${nativeIconPending ? 'PENDING' : 'READY'}`);
