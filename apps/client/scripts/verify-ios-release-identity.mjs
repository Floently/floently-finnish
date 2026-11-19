import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');
const repoRoot = path.resolve(clientRoot, '..', '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(clientRoot, relativePath), 'utf8'));
}

function readText(absolutePath) {
  return fs.readFileSync(absolutePath, 'utf8');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`iOS release identity invariant failed: ${label}: expected ${expected}, got ${String(actual)}`);
  }
}

function assertTrue(condition, label) {
  if (!condition) {
    throw new Error(`iOS release identity invariant failed: ${label}`);
  }
}

const identity = readJson('release/ios-release-identity.json');
const appBase = readJson('app.base.json');
const eas = readJson('eas.json');
const appConfigSource = readText(path.join(clientRoot, 'app.config.ts'));
const legacyProjectPath = path.join(repoRoot, 'ios', 'floentlyfinnish.xcodeproj', 'project.pbxproj');
const legacyProjectSource = fs.existsSync(legacyProjectPath) ? readText(legacyProjectPath) : '';

assertEqual(identity.appName, 'KieliValmis', 'authoritative app name must remain KieliValmis');
assertEqual(identity.bundleIdentifier, 'com.vitusidi.floently', 'authoritative bundle identifier must match Apple evidence');
assertEqual(identity.appStoreConnectAppId, '6767821805', 'authoritative App Store Connect app ID must match Apple evidence');
assertEqual(identity.easProjectId, 'fa02c141-0a3b-4dbc-9122-7c1cf31ba42c', 'authoritative EAS project ID must match rejected-build evidence');
assertEqual(identity.easBuildProfile, 'production', 'App Store release profile must be production');
assertEqual(identity.releaseProjectPath, 'apps/client', 'App Store release project path must remain apps/client');
assertEqual(identity.nativeGeneration, 'expo-prebuild', 'native iOS project must be generated from Expo config for release');
assertEqual(identity.legacyRootIosProjectIsReleaseAuthority, false, 'legacy root iOS project must never be release authority');

assertEqual(appBase?.expo?.name, identity.appName, 'app.base.json app name');
assertEqual(appBase?.expo?.ios?.bundleIdentifier, identity.bundleIdentifier, 'app.base.json iOS bundle identifier');
assertEqual(appBase?.expo?.extra?.eas?.projectId, identity.easProjectId, 'app.base.json EAS project ID');
assertEqual(eas?.submit?.production?.ios?.ascAppId, identity.appStoreConnectAppId, 'eas.json production ASC app ID');
assertTrue(Boolean(eas?.build?.production?.autoIncrement), 'production iOS release build must keep remote auto-increment enabled');
assertEqual(eas?.build?.production?.channel, 'production', 'production release channel');

assertTrue(
  appConfigSource.includes(`const easProjectId = '${identity.easProjectId}';`),
  'app.config.ts must resolve the authoritative EAS project ID',
);
assertTrue(
  !/bundleIdentifier\s*:/.test(appConfigSource),
  'app.config.ts must not override the authoritative bundle identifier from app.base.json',
);

assertTrue(/^[0-9a-f]{40}$/.test(identity?.evidence?.rejectedBuildGitSha ?? ''), 'rejected build Git SHA evidence must remain immutable');
assertEqual(identity?.evidence?.rejectedBuildNumber, '34', 'rejected build number evidence');
assertEqual(identity?.evidence?.rejectedBuildEasId, 'b192f8f3-74ec-42c6-9dda-f3e569f13a3c', 'rejected EAS build ID evidence');

if (legacyProjectSource.includes('PRODUCT_BUNDLE_IDENTIFIER = "com.vitusidi.floentlyfinnish";')) {
  console.log('INFO: legacy root iOS project still carries its historical bundle ID and is explicitly non-authoritative for App Store releases.');
}

// KieliValmis remains the App Store identity while Floently Read is an explicitly
// routed product inside the same React Native application. Build 48 may expose
// Floently Create only as a non-product "Coming soon" surface; activating a real
// Create workspace remains a separate release decision.
assertTrue(
  fs.existsSync(path.join(clientRoot, 'app', 'read', 'browser.tsx')),
  'React Native release must include the protected Floently Read browser route',
);
assertTrue(
  fs.existsSync(path.join(clientRoot, 'app', 'read', 'app.tsx')),
  'React Native release must include the Floently Read app route',
);
const createRoutePath = path.join(clientRoot, 'app', 'create', 'index.tsx');
assertTrue(
  fs.existsSync(createRoutePath),
  'Build 48 candidate must include the Floently Create route',
);
const createRouteSource = readText(createRoutePath);
assertTrue(
  createRouteSource.includes('FloentlyCreateComingSoonScreen') &&
    !/CreateWorkspace|CreateDashboard|CreateEditor/.test(createRouteSource),
  'Floently Create must remain a Coming soon surface until Create is deliberately released',
);
for (const [profileName, profile] of Object.entries(eas.build ?? {})) {
  assertTrue(
    profile?.env?.EXPO_PUBLIC_READ_BROWSER_URL === 'https://read.floently.com/app/browser-v2/live?embed=react-native',
    `React Native EAS ${profileName} must pin the canonical Browser V2 Read URL`,
  );
}
const nativeRootSource = readText(path.join(clientRoot, 'app', 'index.tsx'));
assertTrue(nativeRootSource.includes('KieliValmisLandingScreen'), 'mobile app must retain the existing KieliValmis entry');
assertTrue(
  nativeRootSource.includes('FloentlyGatewayScreen') && nativeRootSource.includes("Platform.OS !== 'web'"),
  'Build 48 candidate must expose the Floently product gateway only in the native root path without replacing existing web-host routing',
);
console.log('PASS: KieliValmis release identity is preserved while Floently Read and the gated Create coming-soon surface are enabled.');

console.log(`PASS: App Store release identity is ${identity.bundleIdentifier} / ASC ${identity.appStoreConnectAppId}.`);
console.log('PASS: apps/client + Expo prebuild is the only recorded iOS App Store release authority.');
console.log('IOS_RELEASE_IDENTITY_INVARIANTS=PASS');
