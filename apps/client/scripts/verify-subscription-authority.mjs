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
console.log('SUBSCRIPTION_AUTHORITY_INVARIANTS=PASS');
