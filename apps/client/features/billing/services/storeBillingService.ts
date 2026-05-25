import { Platform } from 'react-native';

import {
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  type RevenueCatPurchaseResult,
} from './revenueCatService';

type BillingPlatform = 'ios' | 'android';

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
