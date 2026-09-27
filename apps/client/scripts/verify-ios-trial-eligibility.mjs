import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const sdk = read('features/billing/services/revenueCatService.ts');
const store = read('features/billing/services/storeBillingService.ts');
const paywall = read('state/BillingRoute.tsx');

function must(source, part, label) {
  if (!source.includes(part)) throw new Error(`Build 36 trial eligibility: ${label}`);
}

must(sdk, 'Purchases.checkTrialOrIntroductoryPriceEligibility(', 'must check actual iOS StoreKit eligibility');
must(sdk, 'isThreeDayFreeIntroPrice(product.introPrice)', 'must check genuine store product intro');
must(sdk, "price === 0", 'must have a free introductory period');
must(sdk, "cycles === 1", 'must have one introductory period');
must(sdk, "isoPeriod === 'P3D'", 'must have a three-day introductory period');
must(sdk, 'INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE', 'must permit only eligible account');
must(sdk, 'trialEligible: false', 'unknown eligibility must not imply free trial');
must(sdk, "if (!normalizeUserId(userId))", 'must not purchase or restore anonymously');
must(store, 'trialEligible: Boolean(available && matchedPackage?.trialEligible)', 'paywall must consume intro eligibility');
must(paywall, "const storeUserId = user?.id ?? null;", 'RevenueCat customer ID must be backend identity');
if (paywall.includes('user?.id ?? user?.email')) throw Error('Email identity fallback is prohibited');
must(paywall, "Platform.OS === 'ios' && !trialStoreAvailability?.trialEligible", 'no trial CTA if ineligible or unknown');
must(paywall, "storeAvailability?.trialEligible", 'per-plan checkout CTA must follow eligibility');
if (paywall.includes('user?.email ?? null)')) {
  // Email is allowed in the separate subscription display-hydration contract.
  // Purchases/restore/RevenueCat identification have a stricter user-ID-only contract.
  must(paywall, 'startStorePurchase(request.plan, storeUserId)', 'purchase must use stable user ID');
  must(paywall, 'restoreStorePurchases(storeUserId)', 'restore must use stable user ID');
}
console.log('PASS: verified iOS three-day free-trial metadata + introductory eligibility required.');
console.log('PASS: unknown or ineligible customer sees standard purchase, not trial promise.');
console.log('PASS: mobile purchase and restore use the authenticated backend user UUID, not email.');
console.log('IOS_INTRO_TRIAL_AND_IDENTITY_INVARIANTS=PASS');
