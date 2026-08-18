import { Platform } from 'react-native';

import {
  getRevenueCatOfferingSnapshot,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  revenueCatPackageSnapshotMatches,
  type RevenueCatPurchaseResult,
} from './revenueCatService';

type BillingPlatform = 'ios' | 'android';

const READ_OFFERING_ID = 'read_default';

const PACKAGE_MAPPING: Record<string, string> = {
  yki_monthly: 'yki_monthly',
  yki_3_months: 'yki_3months',
  yki_3months: 'yki_3months',
  yki_yearly: 'yki_yearly',

  professional_monthly: 'prof_monthly',
  professional_3_months: 'prof_3months',
  professional_3months: 'prof_3months',
  professional_yearly: 'prof_yearly',

  prof_monthly: 'prof_monthly',
  prof_3_months: 'prof_3months',
  prof_3months: 'prof_3months',
  prof_yearly: 'prof_yearly',

  combined_monthly: 'combo_monthly',
  combined_3_months: 'combo_3months',
  combined_3months: 'combo_3months',
  combined_yearly: 'combo_yearly',

  combo_monthly: 'combo_monthly',
  combo_3_months: 'combo_3months',
  combo_3months: 'combo_3months',
  combo_yearly: 'combo_yearly',

  combined_1_monthly: 'combo_monthly',
  combined_1_3_months: 'combo_3months',
  combined_1_3months: 'combo_3months',
  combined_1_yearly: 'combo_yearly',

  reader_monthly: 'reader_monthly',
  reader_yearly: 'reader_yearly',
  creator_monthly: 'creator_monthly',
  creator_yearly: 'creator_yearly',
  read_reader_monthly: 'reader_monthly',
  read_reader_yearly: 'reader_yearly',
  read_creator_monthly: 'creator_monthly',
  read_creator_yearly: 'creator_yearly',
};

export type StorePlanAvailability = {
  planId: string;
  packageId: string | null;
  available: boolean;
  productIdentifier: string | null;
  priceString: string | null;
};

export type StoreBillingCatalog = {
  platform: BillingPlatform;
  offeringIdentifier: string | null;
  ready: boolean;
  plans: StorePlanAvailability[];
  missingPlanIds: string[];
};

function mobilePlatform(): BillingPlatform | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
}

export function supportsStoreBilling(): boolean {
  return mobilePlatform() !== null;
}

export function revenueCatPackageForPlan(planId: string): string | null {
  return PACKAGE_MAPPING[planId] ?? null;
}

export async function preflightStoreBillingPlans(
  planIds: string[],
  userId?: string | null,
): Promise<StoreBillingCatalog> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error('Store billing is only available on iOS and Android.');
  }

  const uniquePlanIds = Array.from(new Set(planIds.map((item) => String(item || '').trim()).filter(Boolean)));
  const snapshot = await getRevenueCatOfferingSnapshot(userId);

  const plans = uniquePlanIds.map<StorePlanAvailability>((planId) => {
    const packageId = revenueCatPackageForPlan(planId);
    const matchedPackage = packageId && snapshot
      ? snapshot.packages.find((item) => revenueCatPackageSnapshotMatches(item, packageId))
      : null;
    const productIdentifier = matchedPackage?.productIdentifier?.trim() || null;
    const priceString = matchedPackage?.priceString?.trim() || null;

    // A plan is considered store-ready only when RevenueCat returned the
    // expected package, the underlying App Store product identifier, and the
    // localized store price. This prevents presenting an enabled purchase CTA
    // when the exact failure Apple saw (store product cannot be fetched) is
    // already observable before the reviewer taps Buy.
    const available = Boolean(packageId && matchedPackage && productIdentifier && priceString);

    return {
      planId,
      packageId,
      available,
      productIdentifier,
      priceString,
    };
  });

  const missingPlanIds = plans.filter((item) => !item.available).map((item) => item.planId);

  return {
    platform,
    offeringIdentifier: snapshot?.offeringIdentifier ?? null,
    ready: plans.length > 0 && missingPlanIds.length === 0,
    plans,
    missingPlanIds,
  };
}

export async function startStorePurchase(
  planId: string,
  userId?: string | null,
): Promise<RevenueCatPurchaseResult & { status: 'purchased'; packageId: string; platform: BillingPlatform }> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error('Store billing is only available on iOS and Android.');
  }

  const packageId = revenueCatPackageForPlan(planId);
  if (!packageId) {
    throw new Error(`This plan is not available for in-app purchase: ${planId}`);
  }

  const result = await purchaseRevenueCatPackage(packageId, userId);

  return {
    ...result,
    status: 'purchased',
    packageId,
    platform,
  };
}

export async function restoreStorePurchases(
  userId?: string | null,
): Promise<RevenueCatPurchaseResult & { status: 'restored'; platform: BillingPlatform }> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error('Store billing is only available on iOS and Android.');
  }

  const result = await restoreRevenueCatPurchases(userId);

  return {
    ...result,
    status: 'restored',
    platform,
  };
}

export type ReadStorePlanId = 'reader_monthly' | 'reader_yearly' | 'creator_monthly' | 'creator_yearly';

export function revenueCatPackageForReadPlan(planId: ReadStorePlanId): string {
  return planId;
}

function activeEntitlementSet(result: RevenueCatPurchaseResult): Set<string> {
  return new Set(result.activeEntitlements.map((item) => String(item).trim()).filter(Boolean));
}

export function readAccessFromRevenueCatResult(result: RevenueCatPurchaseResult) {
  const active = activeEntitlementSet(result);
  const creatorAccess = active.has('creator_access');
  const readAccess = creatorAccess || active.has('read_access');
  return { readAccess, creatorAccess };
}

export async function startReadStorePurchase(
  planId: ReadStorePlanId,
  userId?: string | null,
): Promise<RevenueCatPurchaseResult & {
  status: 'purchased';
  packageId: string;
  platform: BillingPlatform;
  readAccess: boolean;
  creatorAccess: boolean;
}> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error('Store billing is only available on iOS and Android.');
  }

  const packageId = revenueCatPackageForReadPlan(planId);
  const result = await purchaseRevenueCatPackage(packageId, userId, READ_OFFERING_ID);
  const access = readAccessFromRevenueCatResult(result);

  return {
    ...result,
    ...access,
    status: 'purchased',
    packageId,
    platform,
  };
}

export async function restoreReadStorePurchases(
  userId?: string | null,
): Promise<RevenueCatPurchaseResult & {
  status: 'restored';
  platform: BillingPlatform;
  readAccess: boolean;
  creatorAccess: boolean;
}> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error('Store billing is only available on iOS and Android.');
  }

  const result = await restoreRevenueCatPurchases(userId);
  const access = readAccessFromRevenueCatResult(result);

  return {
    ...result,
    ...access,
    status: 'restored',
    platform,
  };
}
