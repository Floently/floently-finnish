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

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Store billing preflight invariant failed: ${label}`);
  }
}

const storeService = read('features/billing/services/storeBillingService.ts');
const revenueCatService = read('features/billing/services/revenueCatService.ts');
const billingRoute = read('state/BillingRoute.tsx');

const expectedMappings = [
  ['yki_monthly', 'yki_monthly', 'floently_yki_monthly'],
  ['yki_3_months', 'yki_3months', 'floently_yki_3months'],
  ['yki_yearly', 'yki_yearly', 'floently_yki_yearly'],
  ['professional_monthly', 'prof_monthly', 'floently_prof_monthly'],
  ['professional_3_months', 'prof_3months', 'floently_prof_3months'],
  ['professional_yearly', 'prof_yearly', 'floently_prof_yearly'],
  ['combined_monthly', 'combo_monthly', 'floently_combo_monthly'],
  ['combined_3_months', 'combo_3months', 'floently_combo_3months'],
  ['combined_yearly', 'combo_yearly', 'floently_combo_yearly'],
];

for (const [planId, packageId, productId] of expectedMappings) {
  requireText(
    storeService,
    `${planId}: '${packageId}'`,
    `expected plan/package mapping ${planId} -> ${packageId} must remain explicit`,
  );
  requireText(
    storeService,
    `${packageId}: '${productId}'`,
    `expected iOS package/product mapping ${packageId} -> ${productId} must remain explicit`,
  );
}

const expectedReadProducts = [
  ['reader_monthly', 'floently_read_reader_monthly'],
  ['reader_yearly', 'floently_read_reader_yearly'],
  ['creator_monthly', 'floently_read_creator_monthly'],
  ['creator_yearly', 'floently_read_creator_yearly'],
];

for (const [packageId, productId] of expectedReadProducts) {
  requireText(
    storeService,
    `${packageId}: '${productId}'`,
    `expected Floently Read iOS package/product mapping ${packageId} -> ${productId} must remain explicit`,
  );
}

requireText(
  storeService,
  'export async function preflightStoreBillingPlans(',
  'paywall must have a store-product preflight API',
);
requireText(
  storeService,
  'const snapshot = await getRevenueCatOfferingSnapshot(userId, offeringIdentifier);',
  'preflight must query the explicitly resolved RevenueCat offering before purchase',
);
requireText(
  storeService,
  'export async function preflightReadStoreBillingPlans(',
  'Floently Read must have a dedicated offering-aware store preflight',
);
requireText(
  storeService,
  'return preflightStoreBillingPlansForOffering(planIds, userId, READ_OFFERING_ID);',
  'Floently Read preflight must resolve the read_default offering instead of the KieliValmis default offering',
);
requireText(
  storeService,
  'revenueCatPackageSnapshotMatches(item, packageId)',
  'preflight package matching must use the same alias strategy as purchase resolution',
);
requireText(
  storeService,
  "platform === 'ios' && packageId",
  'iOS preflight must resolve the exact expected Apple product identifier for the RevenueCat package',
);
requireText(
  storeService,
  'productIdentifier === expectedProductIdentifier',
  'iOS preflight must reject a RevenueCat package that resolves to a legacy or unexpected Apple product',
);
requireText(
  storeService,
  'productIdentifierMatches',
  'store availability must consume exact iOS product-identifier validation',
);
requireText(
  storeService,
  'const available = Boolean(',
  'a plan must not be marked available without the complete package/product/price contract',
);
requireText(
  storeService,
  'missingPlanIds',
  'preflight must expose missing plans so the paywall can fail closed',
);
requireText(
  storeService,
  'const catalog = await preflightStoreBillingPlans([planId], userId);',
  'purchase must re-check the exact requested plan before invoking the store purchase',
);
requireText(
  storeService,
  'const catalog = await preflightReadStoreBillingPlans([planId], userId);',
  'Floently Read purchase must re-check its exact plan in read_default before RevenueCat purchase execution',
);
requireText(
  storeService,
  'purchaseRevenueCatPackage(packageId, userId, READ_OFFERING_ID)',
  'Floently Read purchase must execute only against the read_default offering',
);

requireText(
  storeService,
  "export const STORE_BILLING_UNAVAILABLE_MESSAGE = 'Purchases are temporarily unavailable. Please try again later.';",
  'store configuration failures must have stable user-safe copy',
);
requireText(
  storeService,
  "actionType: 'STORE_BILLING_ERROR'",
  'technical RevenueCat/store failure details must remain in diagnostics rather than user copy',
);
requireText(
  storeService,
  "throwUserSafeStoreError('purchase', error);",
  'purchase errors from RevenueCat must be converted to a safe application error',
);
requireText(
  storeService,
  "throwUserSafeStoreError('restore', error);",
  'restore errors from RevenueCat must be converted to a safe application error',
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

requireText(
  billingRoute,
  'preflightStoreBillingPlans,',
  'BillingRoute must import the store-product preflight contract',
);
requireText(
  billingRoute,
  'const [storeCatalog, setStoreCatalog] = useState<StoreBillingCatalog | null>(null);',
  'BillingRoute must retain resolved store catalog state',
);
requireText(
  billingRoute,
  'const [storeCatalogLoading, setStoreCatalogLoading] = useState(false);',
  'BillingRoute must distinguish catalog loading from unavailable products',
);
requireText(
  billingRoute,
  'void preflightStoreBillingPlans(visibleStorePlanIds, storeUserId)',
  'BillingRoute must preflight every currently visible pathway before purchase presentation',
);
requireText(
  billingRoute,
  'isMobileStoreBilling && (storeCatalogLoading || !storePlanReady)',
  'mobile purchase CTA must remain disabled while store catalog is loading or selected product is unavailable',
);
requireText(
  billingRoute,
  'disabled={checkoutDisabled}',
  'paywall CTA must consume the fail-closed availability state',
);
requireText(
  billingRoute,
  'const availability = storeCatalog?.plans.find((item) => item.planId === request.plan);',
  'checkout handler must refuse a plan not present in the current preflight catalog',
);
requireText(
  billingRoute,
  'if (!availability?.available) {',
  'checkout handler must stop before purchase when store product is unavailable',
);
requireText(
  billingRoute,
  'const trialStoreUnavailable = Boolean(',
  'trial purchase CTA must also be governed by store preflight',
);
requireText(
  billingRoute,
  'const displayedPrice = isMobileStoreBilling',
  'mobile and non-store visible price sources must be separated explicitly',
);
requireText(
  billingRoute,
  '? storeAvailability?.priceString ??',
  'mobile visible price must prefer the localized RevenueCat/StoreKit price string',
);
requireText(
  billingRoute,
  ': estimate.totalLabel;',
  'static checkout estimate must be limited to the non-store price branch',
);
forbidText(
  billingRoute,
  '<Text style={[styles.priceText, { color: palette.text }]}>{estimate.totalLabel}</Text>',
  'iOS/mobile pricing cards must not render static EUR estimates directly after store preflight integration',
);

console.log('PASS: all nine core KieliValmis plans and Floently Read plans retain explicit RevenueCat/Apple product mappings.');
console.log('PASS: preflight requires offering package, product identifier, and localized store price.');
console.log('PASS: KieliValmis and Floently Read purchases recheck the selected offering/package before RevenueCat purchase execution.');
console.log('PASS: RevenueCat purchase/restore failures are converted to stable user-safe errors.');
console.log('PASS: BillingRoute preflights visible store plans before enabling purchase CTAs.');
console.log('PASS: unavailable store products disable the paywall purchase action and trial action.');
console.log('PASS: mobile paywall prices use RevenueCat/StoreKit localized price strings.');
console.log('STORE_BILLING_PREFLIGHT_INVARIANTS=PASS');
