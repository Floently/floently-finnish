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

console.log(`PASS: App Store release identity is ${identity.bundleIdentifier} / ASC ${identity.appStoreConnectAppId}.`);
console.log('PASS: apps/client + Expo prebuild is the only recorded iOS App Store release authority.');
console.log('IOS_RELEASE_IDENTITY_INVARIANTS=PASS');
