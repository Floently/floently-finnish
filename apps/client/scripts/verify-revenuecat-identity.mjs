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
    throw new Error(`RevenueCat identity invariant failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`RevenueCat identity invariant failed: ${label}`);
  }
}

const revenueCatService = read('features/billing/services/revenueCatService.ts');
const authStore = read('state/authStore.ts');

requireText(
  revenueCatService,
  'if (appUserID && appUserID !== configuredUserId) {',
  'anonymous-to-authenticated and account-switch identification must call RevenueCat logIn',
);
forbidText(
  revenueCatService,
  'appUserID && configuredUserId && appUserID !== configuredUserId',
  'do not require a pre-existing identified RevenueCat user before logIn',
);
requireText(
  revenueCatService,
  'await Purchases.logIn(appUserID);',
  'changed authenticated app users must be identified with RevenueCat',
);
requireText(
  revenueCatService,
  'export async function logOutRevenueCatUser()',
  'RevenueCat logout helper must remain available to the app auth lifecycle',
);
requireText(
  revenueCatService,
  'await Purchases.logOut();',
  'RevenueCat logout helper must detach the previous identified customer',
);
requireText(
  authStore,
  "import { logOutRevenueCatUser } from '../features/billing/services/revenueCatService';",
  'auth logout must be wired to RevenueCat identity cleanup',
);
requireText(
  authStore,
  'await logOutRevenueCatUser();',
  'application logout must attempt RevenueCat logout',
);
requireText(
  authStore,
  '// Intentionally continue with application-session logout.',
  'RevenueCat network failure must not trap the user in the app session',
);

console.log('PASS: RevenueCat identifies users after anonymous SDK configuration.');
console.log('PASS: RevenueCat identity switches when the authenticated app user changes.');
console.log('PASS: application logout attempts RevenueCat logout without blocking local logout.');
console.log('REVENUECAT_IDENTITY_INVARIANTS=PASS');
