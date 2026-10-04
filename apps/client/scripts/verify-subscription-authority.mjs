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
    'applyStoreReadAccess(verifiedAccess)',
    `${label} must verify with FlowReader before elevating local access`,
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

console.log('PASS: Read purchase/restore elevation follows backend verification.');

console.log('SUBSCRIPTION_AUTHORITY_INVARIANTS=PASS');
