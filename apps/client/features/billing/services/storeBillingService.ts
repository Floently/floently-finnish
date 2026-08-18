import { Platform } from 'react-native';

import { logger } from '@core/logging/logger';
import {
  getRevenueCatOfferingSnapshot,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  revenueCatPackageSnapshotMatches,
  type RevenueCatPurchaseResult,
} from './revenueCatService';

type BillingPlatform = 'ios' | 'android';

const READ_OFFERING_ID = 'read_default';
export const STORE_BILLING_UNAVAILABLE_MESSAGE = 'Purchases are temporarily unavailable. Please try again later.';
export const STORE_PURCHASE_CANCELLED_MESSAGE = 'Purchase cancelled.';

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

export class StoreBillingUnavailableError extends Error {
  readonly code = 'STORE_BILLING_UNAVAILABLE';

  constructor() {
    super(STORE_BILLING_UNAVAILABLE_MESSAGE);
    this.name = 'StoreBillingUnavailableError';
  }
}

export class StorePurchaseCancelledError extends Error {
  readonly code = 'STORE_PURCHASE_CANCELLED';

  constructor() {
    super(STORE_PURCHASE_CANCELLED_MESSAGE);
    this.name = 'StorePurchaseCancelledError';
  }
}

function mobilePlatform(): BillingPlatform | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
}

function technicalErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'Unknown store billing error');
}

function isPurchaseCancellation(error: unknown): boolean {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  if (record.userCancelled === true || record.userCanceled === true) return true;
  const code = String(record.code ?? '').toLowerCase();
  const message = technicalErrorMessage(error).toLowerCase();
  return code.includes('purchase_cancelled') || code.includes('purchase_canceled') || /purchase (was )?cancelled|purchase (was )?canceled/.test(message);
}

function throwUserSafeStoreError(operation: string, error: unknown): never {
  if (isPurchaseCancellation(error)) {
    throw new StorePurchaseCancelledError();
  }

  logger.error('Mobile store billing operation failed.', {
    actionType: 'STORE_BILLING_ERROR',
    operation,
    technicalMessage: technicalErrorMessage(error),
  });
  throw new StoreBillingUnavailableError();
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
    throw new StoreBillingUnavailableError();
  }

  try {
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
  } catch (error) {
    throwUserSafeStoreError('preflight', error);
  }
}

export async function startStorePurchase(
  planId: string,
  userId?: string | null,
): Promise<RevenueCatPurchaseResult & { status: 'purchased'; packageId: string; platform: BillingPlatform }> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new StoreBillingUnavailableError();
  }

  const packageId = revenueCatPackageForPlan(planId);
  if (!packageId) {
    logger.error('Store purchase attempted for an unmapped plan.', {
      actionType: 'STORE_BILLING_ERROR',
      operation: 'purchase',
      planId,
    });
    throw new StoreBillingUnavailableError();
  }

  try {
    // Re-check the exact requested plan immediately before purchase. The paywall
    // will also use preflight for presentation, but this purchase-time check
    // prevents a stale UI from calling RevenueCat after the store catalog changes.
    const catalog = await preflightStoreBillingPlans([planId], userId);
    if (!catalog.ready) {
      logger.error('Store purchase blocked by package preflight.', {
        actionType: 'STORE_BILLING_PREFLIGHT_BLOCKED',
        operation: 'purchase',
        planId,
        missingPlanIds: catalog.missingPlanIds,
        offeringIdentifier: catalog.offeringIdentifier,
      });
      throw new StoreBillingUnavailableError();
    }

    const result = await purchaseRevenueCatPackage(packageId, userId);

    return {
      ...result,
      status: 'purchased',
      packageId,
      platform,
    };
  } catch (error) {
    if (error instanceof StoreBillingUnavailableError || error instanceof StorePurchaseCancelledError) {
      throw error;
    }
    throwUserSafeStoreError('purchase', error);
  }
}

export async function restoreStorePurchases(
  userId?: string | null,
): Promise<RevenueCatPurchaseResult & { status: 'restored'; platform: BillingPlatform }> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new StoreBillingUnavailableError();
  }

  try {
    const result = await restoreRevenueCatPurchases(userId);

    return {
      ...result,
      status: 'restored',
      platform,
    };
  } catch (error) {
    throwUserSafeStoreError('restore', error);
  }
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
    throw new StoreBillingUnavailableError();
  }

  const packageId = revenueCatPackageForReadPlan(planId);
  try {
    const result = await purchaseRevenueCatPackage(packageId, userId, READ_OFFERING_ID);
    const access = readAccessFromRevenueCatResult(result);

    return {
      ...result,
      ...access,
      status: 'purchased',
      packageId,
      platform,
    };
  } catch (error) {
    throwUserSafeStoreError('read_purchase', error);
  }
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
    throw new StoreBillingUnavailableError();
  }

  try {
    const result = await restoreRevenueCatPurchases(userId);
    const access = readAccessFromRevenueCatResult(result);

    return {
      ...result,
      ...access,
      status: 'restored',
      platform,
      readAccess: access.readAccess,
      creatorAccess: access.creatorAccess,
    };
  } catch (error) {
    throwUserSafeStoreError('read_restore', error);
  }
}
