import { Platform } from 'react-native';

type BillingPlatform = 'ios' | 'android';

const PRODUCT_MAPPING: Record<string, string> = {
  yki_monthly: 'com.vitusidi.floentlyfinnish.yki.monthly',
  yki_3_months: 'com.vitusidi.floentlyfinnish.yki.3months',
  yki_yearly: 'com.vitusidi.floentlyfinnish.yki.yearly',
  professional_monthly: 'com.vitusidi.floentlyfinnish.professional.monthly',
  professional_3_months: 'com.vitusidi.floentlyfinnish.professional.3months',
  professional_yearly: 'com.vitusidi.floentlyfinnish.professional.yearly',
  combined_monthly: 'com.vitusidi.floentlyfinnish.combined.monthly',
  combined_3_months: 'com.vitusidi.floentlyfinnish.combined.3months',
  combined_yearly: 'com.vitusidi.floentlyfinnish.combined.yearly',
};

function mobilePlatform(): BillingPlatform | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
}

export function supportsStoreBilling(): boolean {
  return mobilePlatform() !== null;
}

export async function startStorePurchase(planId: string): Promise<{ status: 'pending_configuration'; productId: string; platform: BillingPlatform }> {
  const platform = mobilePlatform();
  if (!platform) {
    throw new Error('Store billing is only available on iOS and Android.');
  }
  const productId = PRODUCT_MAPPING[planId];
  if (!productId) {
    throw new Error('This plan is not available for in-app purchase.');
  }
  return {
    status: 'pending_configuration',
    productId,
    platform,
  };
}
