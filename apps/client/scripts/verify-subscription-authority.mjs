import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

const source = fs.readFileSync(
  path.join(clientRoot, 'state/subscriptionStore.ts'),
  'utf8',
);
const readMobileSource = fs.readFileSync(
  path.join(clientRoot, 'features/read/mobile/ReadMobileScreens.tsx'),
  'utf8',
);
const appShellSource = fs.readFileSync(
  path.join(clientRoot, 'state/AppShell.tsx'),
  'utf8',
);
const readProtectedRouteSource = fs.readFileSync(
  path.join(clientRoot, 'features/read/mobile/ReadProtectedRoute.tsx'),
  'utf8',
);
const readRenderApiSource = fs.readFileSync(
  path.join(clientRoot, 'features/read/mobile/readRenderApi.ts'),
  'utf8',
);

function requireText(text, label) {
  if (!source.includes(text)) {
    throw new Error(`Subscription authority invariant failed: ${label}`);
  }
}

function forbidText(text, label) {
  if (source.includes(text)) {
    throw new Error(`Subscription authority invariant failed: ${label}`);
  }
}

requireText(
  "return typeof __DEV__ !== 'undefined' && __DEV__ === true;",
  'client email access overrides must be disabled in production/TestFlight builds',
);

for (const forbidden of [
  'DEFAULT_ALL_ACCESS_EMAILS',
  'DEFAULT_LEARN_ACCESS_EMAILS',
  'DEFAULT_READ_ACCESS_EMAILS',
  'DEFAULT_CREATE_ACCESS_EMAILS',
]) {
  forbidText(
    forbidden,
    'hard-coded client entitlement identities must not exist',
  );
}

for (const functionName of [
  'allAccessEmails',
  'learnAccessEmails',
  'readAccessEmails',
  'createAccessEmails',
]) {
  requireText(
    `function ${functionName}() {\n  if (!clientEmailAccessOverridesEnabled()) return [];`,
    `${functionName} must fail closed outside development`,
  );
}

requireText(
  'const remoteRaw = await getSubscriptionStatus();',
  'subscription refresh must continue to fetch authenticated backend truth',
);

requireText(
  'const remote = normalizeRemoteStatus(remoteRaw, user);',
  'remote backend status must continue to drive normalized client state',
);

console.log('PASS: client email access overrides are development-only.');
console.log('PASS: production subscription state remains backend-authoritative.');

function readFunctionBlock(startMarker, endMarker) {
  const start = readMobileSource.indexOf(startMarker);
  const end = readMobileSource.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(
      `Subscription authority invariant failed: could not isolate ${startMarker}`,
    );
  }
  return readMobileSource.slice(start, end);
}

function requireReadOrder(block, before, after, label) {
  const beforeIndex = block.indexOf(before);
  const afterIndex = block.indexOf(after);
  if (beforeIndex < 0 || afterIndex < 0 || beforeIndex >= afterIndex) {
    throw new Error(`Subscription authority invariant failed: ${label}`);
  }
}

const readPurchaseBlock = readFunctionBlock(
  '  async function purchase(planId: ReadStorePlanId) {',
  '  async function restore() {',
);
const readRestoreBlock = readFunctionBlock(
  '  async function restore() {',
  '  async function openReadLegal(',
);

for (const [label, block] of [
  ['Read purchase', readPurchaseBlock],
  ['Read restore', readRestoreBlock],
]) {
  requireReadOrder(
    block,
    'const syncResult = await syncReadPurchaseToBackend',
    'reconcileVerifiedReadAccess(verifiedSnapshot)',
    `${label} must verify with FlowReader before reconciling local access`,
  );
  if (block.includes('applyStoreReadAccess({\n          readAccess: Boolean(accessResult.readAccess)')) {
    throw new Error(
      `Subscription authority invariant failed: ${label} must not grant SDK-reported entitlements directly`,
    );
  }
}

if (!readMobileSource.includes(
  'function verifiedReadAccess(syncResult: SyncReadRevenueCatResult | null)',
)) {
  throw new Error(
    'Subscription authority invariant failed: Read access must be derived from the backend sync result',
  );
}

if (!readMobileSource.includes('if (syncResult?.readAccess !== true) return null;')) {
  throw new Error(
    'Subscription authority invariant failed: Read store access must fail closed unless backend readAccess is true',
  );
}

if (!readMobileSource.includes(
  "if (typeof syncResult?.readAccess !== 'boolean') return null;",
)) {
  throw new Error(
    'Subscription authority invariant failed: store reconciliation must ignore malformed/non-authoritative sync shapes',
  );
}

forbidText(
  'applyStoreReadAccess',
  'grant-only Read access mutation must not coexist with verified reconciliation',
);

if (readMobileSource.includes('applyStoreReadAccess')) {
  throw new Error(
    'Subscription authority invariant failed: Read purchase UI must not use a grant-only entitlement helper',
  );
}

requireText(
  'reconcileVerifiedReadAccess: (input: { readAccess?: boolean; creatorAccess?: boolean }) => void;',
  'subscription store must expose verified Read reconciliation',
);
requireText(
  'reconcileVerifiedReadAccess(input) {',
  'subscription store must implement verified Read reconciliation',
);
requireText(
  'readAccess,\n        createAccess,',
  'verified Read reconciliation must be able to write false as well as true',
);

const appHydrateIndex = appShellSource.indexOf('await hydrateSubscription(user);');
const appReadIndex = appShellSource.indexOf('await readRenderApi.getAccessStatus();');
if (appHydrateIndex < 0 || appReadIndex < 0 || appHydrateIndex >= appReadIndex) {
  throw new Error(
    'Subscription authority invariant failed: AppShell must hydrate KieliValmis first, then reconcile persisted FlowReader access',
  );
}
if (!appShellSource.includes('reconcileVerifiedReadAccess(verifiedRead);')) {
  throw new Error(
    'Subscription authority invariant failed: AppShell must reconcile the verified FlowReader snapshot',
  );
}

if (!readProtectedRouteSource.includes('await readRenderApi.getAccessStatus();')) {
  throw new Error(
    'Subscription authority invariant failed: direct Read routes must refresh persisted FlowReader access',
  );
}
if (!readProtectedRouteSource.includes('!readAccessCheckComplete')) {
  throw new Error(
    'Subscription authority invariant failed: protected Read routes must wait for the persisted-access check',
  );
}

if (!readRenderApiSource.includes("requestReadApi<unknown>('/api/v1/read/access')")) {
  throw new Error(
    'Subscription authority invariant failed: persisted Read access must come from the authenticated FlowReader access endpoint',
  );
}

console.log('PASS: Read purchase/restore reconciliation follows backend verification.');
console.log('PASS: persisted Read access is rehydrated from FlowReader on startup and direct route entry.');

console.log('SUBSCRIPTION_AUTHORITY_INVARIANTS=PASS');
