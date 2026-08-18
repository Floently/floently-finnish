import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

type RevenueCatPlatform = 'android' | 'ios';

export type RevenueCatPurchaseResult = {
  customerInfo: unknown;
  activeEntitlements: string[];
};

export type RevenueCatPackageSnapshot = {
  packageIdentifier: string;
  productIdentifier: string;
  priceString: string;
};

export type RevenueCatOfferingSnapshot = {
  offeringIdentifier: string;
  packages: RevenueCatPackageSnapshot[];
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

  // RevenueCat supports configuring anonymously and identifying later with
  // logIn(). The previous guard required configuredUserId to already be non-null,
  // which left an anonymously configured SDK attached to the anonymous customer
  // after the application user signed in. Always identify whenever a concrete
  // app user differs from the SDK identity we last established.
  if (appUserID && appUserID !== configuredUserId) {
    await Purchases.logIn(appUserID);
    configuredUserId = appUserID;
  }

  return true;
}

export async function logOutRevenueCatUser(): Promise<void> {
  if (!configured) {
    configuredUserId = null;
    return;
  }

  // Only call RevenueCat logOut when this process has identified a concrete
  // application user. RevenueCat will create a fresh anonymous customer after
  // logout; the next authenticated store call will logIn the new application
  // user before querying/purchasing.
  if (configuredUserId) {
    await Purchases.logOut();
  }
  configuredUserId = null;
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

function offeringByIdentifier(offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>, offeringIdentifier?: string | null) {
  const wanted = String(offeringIdentifier ?? '').trim();
  if (wanted && offerings.all && typeof offerings.all === 'object') {
    const explicit = offerings.all[wanted];
    if (explicit) return explicit;
  }

  if (wanted === 'read_default') {
    return null;
  }

  return (
    offerings.current ??
    (offerings.all && typeof offerings.all === 'object' ? offerings.all.default : null)
  );
}

function packageIdentifierAliases(packageIdentifier: string): string[] {
  const raw = String(packageIdentifier || '').trim();
  const aliases = new Set<string>();

  function add(value: string | null | undefined) {
    const text = String(value || '').trim();
    if (text) aliases.add(text);
  }

  add(raw);

  const normalized = raw
    .replace(/-/g, '_')
    .replace(/three_months/g, '3months')
    .replace(/3_months/g, '3months');

  add(normalized);
  add(normalized.replace(/^professional_/, 'prof_'));
  add(normalized.replace(/^prof_/, 'professional_'));
  add(normalized.replace(/^combined_/, 'combo_'));
  add(normalized.replace(/^combo_/, 'combined_'));

  for (const item of Array.from(aliases)) {
    if (!item.startsWith('floently_')) {
      add(`floently_${item}`);
    }
  }

  return Array.from(aliases);
}

function packageCandidateIdentifiers(item: unknown): string[] {
  const pkg = item && typeof item === 'object' ? item as Record<string, unknown> : {};
  const values: string[] = [];

  function collect(value: unknown) {
    const text = String(value || '').trim();
    if (text) values.push(text);
  }

  collect(pkg.identifier);
  collect(pkg.packageIdentifier);

  for (const key of ['product', 'storeProduct']) {
    const product = pkg[key];
    if (product && typeof product === 'object') {
      const record = product as Record<string, unknown>;
      collect(record.identifier);
      collect(record.productIdentifier);
      collect(record.productId);
      collect(record.id);
    }
  }

  return Array.from(new Set(values));
}

function packageSnapshot(item: unknown): RevenueCatPackageSnapshot | null {
  const pkg = item && typeof item === 'object' ? item as Record<string, unknown> : {};
  const packageIdentifier = String(pkg.identifier ?? pkg.packageIdentifier ?? '').trim();

  const productValue = pkg.product ?? pkg.storeProduct;
  const product = productValue && typeof productValue === 'object'
    ? productValue as Record<string, unknown>
    : {};
  const productIdentifier = String(
    product.identifier ?? product.productIdentifier ?? product.productId ?? product.id ?? '',
  ).trim();
  const priceString = String(product.priceString ?? product.localizedPriceString ?? '').trim();

  if (!packageIdentifier && !productIdentifier) {
    return null;
  }

  return {
    packageIdentifier,
    productIdentifier,
    priceString,
  };
}

export async function getRevenueCatOfferingSnapshot(
  userId?: string | null,
  offeringIdentifier?: string | null,
): Promise<RevenueCatOfferingSnapshot | null> {
  if (!(await ensureRevenueCatConfigured(userId))) {
    return null;
  }

  const offerings = await Purchases.getOfferings();
  const offering = offeringByIdentifier(offerings, offeringIdentifier);
  if (!offering) {
    return null;
  }

  const availablePackages = Array.isArray(offering.availablePackages)
    ? offering.availablePackages
    : [];

  return {
    offeringIdentifier: String(offering.identifier || offeringIdentifier || 'current'),
    packages: availablePackages
      .map((item: unknown) => packageSnapshot(item))
      .filter((item): item is RevenueCatPackageSnapshot => Boolean(item)),
  };
}

export async function purchaseRevenueCatPackage(
  packageIdentifier: string,
  userId?: string | null,
  offeringIdentifier?: string | null,
): Promise<RevenueCatPurchaseResult> {
  if (!(await ensureRevenueCatConfigured(userId))) {
    throw new Error('Store billing is not configured for this platform.');
  }

  const offerings = await Purchases.getOfferings();
  const currentOffering = offeringByIdentifier(offerings, offeringIdentifier);

  const availablePackages = Array.isArray(currentOffering?.availablePackages)
    ? currentOffering.availablePackages
    : [];

  const wantedAliases = packageIdentifierAliases(packageIdentifier);

  const packageToPurchase = availablePackages.find((item: unknown) => {
    const candidates = packageCandidateIdentifiers(item);
    return candidates.some((candidate) => wantedAliases.includes(candidate));
  });

  if (!packageToPurchase) {
    const available = availablePackages
      .map((item: unknown) => packageCandidateIdentifiers(item).join(' / '))
      .filter(Boolean)
      .join(', ');

    throw new Error(
      `RevenueCat package not found: ${packageIdentifier} in offering ${offeringIdentifier || 'current'}. Tried: ${wantedAliases.join(', ')}. Available: ${available || 'none'}`,
    );
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
