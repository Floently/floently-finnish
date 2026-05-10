import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

type RevenueCatPlatform = 'android' | 'ios';

export type RevenueCatPurchaseResult = {
  customerInfo: unknown;
  activeEntitlements: string[];
};

let configured = false;
let configuredUserId: string | null = null;

function currentPlatform(): RevenueCatPlatform | null {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return null;
}

function revenueCatApiKey(): string {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || '';
  }
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || '';
  }
  return '';
}

function isPlaceholderKey(value: string): boolean {
  return !value || value.startsWith('placeholder_');
}

function activeEntitlementIds(customerInfo: unknown): string[] {
  const info = customerInfo && typeof customerInfo === 'object' ? customerInfo as Record<string, unknown> : {};
  const entitlements = info.entitlements && typeof info.entitlements === 'object'
    ? info.entitlements as Record<string, unknown>
    : {};
  const active = entitlements.active && typeof entitlements.active === 'object'
    ? entitlements.active as Record<string, unknown>
    : {};
  return Object.keys(active);
}

function normalizeUserId(userId?: string | null): string | null {
  const normalized = String(userId ?? '').trim();
  return normalized || null;
}

export function supportsRevenueCatBilling(): boolean {
  return currentPlatform() !== null && !isPlaceholderKey(revenueCatApiKey());
}

export function configureRevenueCatIfAvailable(userId?: string | null): boolean {
  const platform = currentPlatform();
  const apiKey = revenueCatApiKey();
  const appUserID = normalizeUserId(userId);

  if (!platform || isPlaceholderKey(apiKey)) {
    return false;
  }

  if (configured) {
    return true;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({
    apiKey: apiKey as string,
    appUserID: appUserID || undefined,
  });

  configured = true;
  configuredUserId = appUserID;
  return true;
}

async function ensureRevenueCatConfigured(userId?: string | null): Promise<boolean> {
  const appUserID = normalizeUserId(userId);

  if (!configureRevenueCatIfAvailable(appUserID)) {
    return false;
  }

  if (appUserID && configuredUserId && appUserID !== configuredUserId) {
    await Purchases.logIn(appUserID);
    configuredUserId = appUserID;
  }

  return true;
}

export async function getRevenueCatCustomerInfo(userId?: string | null) {
  if (!(await ensureRevenueCatConfigured(userId))) {
    return null;
  }
  return Purchases.getCustomerInfo();
}

export async function getRevenueCatOfferings(userId?: string | null) {
  if (!(await ensureRevenueCatConfigured(userId))) {
    return null;
  }
  return Purchases.getOfferings();
}

export async function purchaseRevenueCatPackage(
  packageIdentifier: string,
  userId?: string | null,
): Promise<RevenueCatPurchaseResult> {
  if (!(await ensureRevenueCatConfigured(userId))) {
    throw new Error('Store billing is not configured for this platform.');
  }

  const offerings = await Purchases.getOfferings();
  const currentOffering =
    offerings.current ??
    (offerings.all && typeof offerings.all === 'object' ? offerings.all.default : null);

  const availablePackages = Array.isArray(currentOffering?.availablePackages)
    ? currentOffering.availablePackages
    : [];

  const packageToPurchase = availablePackages.find((item: unknown) => {
    const pkg = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return pkg.identifier === packageIdentifier;
  });

  if (!packageToPurchase) {
    throw new Error(`RevenueCat package not found: ${packageIdentifier}`);
  }

  const purchaseResult = await Purchases.purchasePackage(packageToPurchase as never);
  const resultRecord = purchaseResult && typeof purchaseResult === 'object'
    ? purchaseResult as Record<string, unknown>
    : {};
  const customerInfo = resultRecord.customerInfo ?? purchaseResult;

  return {
    customerInfo,
    activeEntitlements: activeEntitlementIds(customerInfo),
  };
}

export async function restoreRevenueCatPurchases(userId?: string | null): Promise<RevenueCatPurchaseResult> {
  if (!(await ensureRevenueCatConfigured(userId))) {
    throw new Error('Store billing is not configured for this platform.');
  }

  const customerInfo = await Purchases.restorePurchases();

  return {
    customerInfo,
    activeEntitlements: activeEntitlementIds(customerInfo),
  };
}
