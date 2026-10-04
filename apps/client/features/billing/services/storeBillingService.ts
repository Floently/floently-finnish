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

const IOS_PRODUCT_IDENTIFIER_BY_PACKAGE: Record<string, string> = {
  yki_monthly: 'floently_yki_monthly',
  yki_3months: 'floently_yki_3months',
  yki_yearly: 'floently_yki_yearly',
  prof_monthly: 'floently_prof_monthly',
  prof_3months: 'floently_prof_3months',
  prof_yearly: 'floently_prof_yearly',
  combo_monthly: 'floently_combo_monthly',
  combo_3months: 'floently_combo_3months',
  combo_yearly: 'floently_combo_yearly',
  reader_monthly: 'floently_read_reader_monthly',
  reader_yearly: 'floently_read_reader_yearly',
  creator_monthly: 'floently_read_creator_monthly',
  creator_yearly: 'floently_read_creator_yearly',
};

export type StorePlanAvailability = {
  planId: string;
  packageId: string | null;
  available: boolean;
  productIdentifier: string | null;
  expectedProductIdentifier: string | null;
  priceString: string | null;
  trialEligible: boolean;
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

async function preflightStoreBillingPlansForOffering(
  planIds: string[],
  userId?: string | null,
  offeringIdentifier?: string | null,
): Promise<StoreBillingCatalog> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new StoreBillingUnavailableError();
  }

  try {
    const uniquePlanIds = Array.from(new Set(planIds.map((item) => String(item || '').trim()).filter(Boolean)));
    const snapshot = await getRevenueCatOfferingSnapshot(userId, offeringIdentifier);

    const plans = uniquePlanIds.map<StorePlanAvailability>((planId) => {
      const packageId = revenueCatPackageForPlan(planId);
      const matchedPackage = packageId && snapshot
        ? snapshot.packages.find((item) => revenueCatPackageSnapshotMatches(item, packageId))
        : null;
      const productIdentifier = matchedPackage?.productIdentifier?.trim() || null;
      const expectedProductIdentifier =
        platform === 'ios' && packageId
          ? IOS_PRODUCT_IDENTIFIER_BY_PACKAGE[packageId] ?? null
          : null;
      const priceString = matchedPackage?.priceString?.trim() || null;
      const productIdentifierMatches =
        platform !== 'ios' ||
        !expectedProductIdentifier ||
        productIdentifier === expectedProductIdentifier;

      // A plan is considered store-ready only when RevenueCat returned the
      // expected package, the underlying store product, and localized price.
      // For the nine KieliValmis iOS subscriptions, the package must also point
      // to the exact Apple Product ID submitted with the app. A legacy/wrong
      // product behind the correct RevenueCat alias therefore fails closed.
      const available = Boolean(
        packageId &&
        matchedPackage &&
        productIdentifier &&
        priceString &&
        productIdentifierMatches
      );

      return {
        planId,
        packageId,
        available,
        productIdentifier,
        expectedProductIdentifier,
        priceString,
        trialEligible: Boolean(available && matchedPackage?.trialEligible),
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
    if (error instanceof StoreBillingUnavailableError || error instanceof StorePurchaseCancelledError) {
      throw error;
    }
    throwUserSafeStoreError(offeringIdentifier === READ_OFFERING_ID ? 'read_preflight' : 'preflight', error);
  }
}

export async function preflightStoreBillingPlans(
  planIds: string[],
  userId?: string | null,
): Promise<StoreBillingCatalog> {
  return preflightStoreBillingPlansForOffering(planIds, userId);
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

export async function preflightReadStoreBillingPlans(
  planIds: ReadStorePlanId[],
  userId?: string | null,
): Promise<StoreBillingCatalog> {
  return preflightStoreBillingPlansForOffering(planIds, userId, READ_OFFERING_ID);
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
    // Read uses a separate RevenueCat offering. Re-resolve the exact package,
    // underlying store product and localized price immediately before purchase
    // so a stale/misconfigured read_default offering can never reach checkout.
    const catalog = await preflightReadStoreBillingPlans([planId], userId);
    if (!catalog.ready) {
      logger.error('Floently Read purchase blocked by package preflight.', {
        actionType: 'STORE_BILLING_PREFLIGHT_BLOCKED',
        operation: 'read_purchase',
        planId,
        missingPlanIds: catalog.missingPlanIds,
        offeringIdentifier: catalog.offeringIdentifier,
      });
      throw new StoreBillingUnavailableError();
    }

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
    if (error instanceof StoreBillingUnavailableError || error instanceof StorePurchaseCancelledError) {
      throw error;
    }
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
