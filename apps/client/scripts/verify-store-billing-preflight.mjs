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
    throw new Error(`Store billing preflight invariant failed: ${label}`);
  }
}

const storeService = read('features/billing/services/storeBillingService.ts');
const revenueCatService = read('features/billing/services/revenueCatService.ts');

const expectedMappings = [
  ["yki_monthly", "yki_monthly"],
  ["yki_3_months", "yki_3months"],
  ["yki_yearly", "yki_yearly"],
  ["professional_monthly", "prof_monthly"],
  ["professional_3_months", "prof_3months"],
  ["professional_yearly", "prof_yearly"],
  ["combined_monthly", "combo_monthly"],
  ["combined_3_months", "combo_3months"],
  ["combined_yearly", "combo_yearly"],
];

for (const [planId, packageId] of expectedMappings) {
  requireText(
    storeService,
    `${planId}: '${packageId}'`,
    `expected plan/package mapping ${planId} -> ${packageId} must remain explicit`,
  );
}

requireText(
  storeService,
  'export async function preflightStoreBillingPlans(',
  'paywall must have a store-product preflight API',
);
requireText(
  storeService,
  'const snapshot = await getRevenueCatOfferingSnapshot(userId);',
  'preflight must query the resolved RevenueCat offering before purchase',
);
requireText(
  storeService,
  'revenueCatPackageSnapshotMatches(item, packageId)',
  'preflight package matching must use the same alias strategy as purchase resolution',
);
requireText(
  storeService,
  'const available = Boolean(packageId && matchedPackage && productIdentifier && priceString);',
  'a plan must not be marked available without package, App Store product ID, and localized price',
);
requireText(
  storeService,
  'missingPlanIds',
  'preflight must expose missing plans so the paywall can fail closed',
);
requireText(
  revenueCatService,
  'priceString: string;',
  'RevenueCat package snapshots must carry localized store price text',
);
requireText(
  revenueCatService,
  'export function revenueCatPackageSnapshotMatches(',
  'package alias matching must be reusable by preflight and purchase code',
);

console.log('PASS: all nine core KieliValmis plans retain explicit RevenueCat package mappings.');
console.log('PASS: preflight requires offering package, product identifier, and localized store price.');
console.log('PASS: missing store plans are surfaced for fail-closed paywall behavior.');
console.log('STORE_BILLING_PREFLIGHT_INVARIANTS=PASS');
