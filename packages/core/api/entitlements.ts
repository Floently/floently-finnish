export type ProfessionKey = 'doctor' | 'nurse' | 'practical_nurse';

/** Alias kept for callers that import ProfessionCode */
export type ProfessionCode = ProfessionKey;

export type PreviewPlanId = 'preview_yki' | 'preview_doctor' | 'preview_nurse' | 'preview_practical_nurse';

export type BillingPeriod = 'monthly' | '3_months' | 'yearly';
export type CheckoutPathway = 'yki' | 'professional' | 'combined';

export type LegacyPlanId =
  | 'professional_doctor_monthly' | 'professional_doctor_yearly'
  | 'professional_nurse_monthly' | 'professional_nurse_yearly'
  | 'professional_practical_nurse_monthly' | 'professional_practical_nurse_yearly'
  | 'bundle_doctor_monthly' | 'bundle_doctor_yearly'
  | 'bundle_nurse_monthly' | 'bundle_nurse_yearly'
  | 'bundle_practical_nurse_monthly' | 'bundle_practical_nurse_yearly';

export type PlanId =
  | 'yki_monthly' | 'yki_3_months' | 'yki_yearly'
  | 'professional_monthly' | 'professional_3_months' | 'professional_yearly'
  | 'combined_monthly' | 'combined_3_months' | 'combined_yearly'
  | LegacyPlanId;

export type AccessType = 'individual' | 'employer_programme' | 'city_programme' | 'internal';

export type PlanCatalogEntry = {
  id: PlanId;
  category: 'yki' | 'professional' | 'bundle';
  pathway: CheckoutPathway;
  title: string;
  description: string;
  checkoutLabel: string;
  billingPeriod: BillingPeriod;
  audience?: 'learner' | 'employer' | 'city';
  includedProfessionSlots?: number;
  extraProfessionDiscountPercent?: number;
};

export type ProfessionOption = {
  key: ProfessionKey;
  label: string;
  labelKey?: string;
  shortLabel: string;
  shortLabelKey?: string;
  detail: string;
  detailKey?: string;
};

export type BillingPeriodOption = {
  key: BillingPeriod;
  label: string;
  labelKey?: string;
  shortLabel: string;
  shortLabelKey?: string;
  savingsLabel: string;
  savingsLabelKey?: string;
};

export type BillingDisplayLabels = {
  billingPeriods?: Partial<Record<BillingPeriod, string>>;
  professions?: Partial<Record<ProfessionKey, string>>;
  noProfessionSelected?: string;
  internalAllAccess?: string;
  ykiPathway?: string;
  professionalPathway?: string;
  combinedPathway?: string;
  previewYki?: string;
  previewDoctor?: string;
  previewNurse?: string;
  previewPracticalNurse?: string;
  accessTypes?: Partial<Record<AccessType, string>>;
  accessSummaryNoSubscription?: string;
  accessSummaryYki?: string;
  accessSummaryProfessional?: string;
  accessSummaryCombined?: string;
  accessSummaryInternal?: string;
};

export type CheckoutRequest = {
  plan: string;
  pathway: CheckoutPathway;
  billingPeriod: BillingPeriod;
  professions: ProfessionKey[];
  professionCount: number;
};

export const ADDITIONAL_PROFESSION_DISCOUNT_PERCENT = 15;

export const PROFESSION_OPTIONS: ProfessionOption[] = [
  {
    key: 'nurse',
    label: 'Nurse',
    labelKey: 'billingProfessionNurseLabel',
    shortLabel: 'Nurse',
    shortLabelKey: 'billingProfessionNurseShortLabel',
    detail: 'Patient care, handovers, reporting, medication communication, and teamwork.',
    detailKey: 'billingProfessionNurseDetail',
  },
  {
    key: 'doctor',
    label: 'Doctor',
    labelKey: 'billingProfessionDoctorLabel',
    shortLabel: 'Doctor',
    shortLabelKey: 'billingProfessionDoctorShortLabel',
    detail: 'Patient interaction, explanations, documentation, consultation, and medical teamwork.',
    detailKey: 'billingProfessionDoctorDetail',
  },
  {
    key: 'practical_nurse',
    label: 'Practical Nurse',
    labelKey: 'billingProfessionPracticalNurseLabel',
    shortLabel: 'Practical Nurse',
    shortLabelKey: 'billingProfessionPracticalNurseShortLabel',
    detail: 'Care routines, residents, relatives, daily support, and practical care communication.',
    detailKey: 'billingProfessionPracticalNurseDetail',
  },
];

export const BILLING_PERIOD_OPTIONS: BillingPeriodOption[] = [
  { key: 'monthly', label: 'Monthly', labelKey: 'billingPeriodMonthlyLabel', shortLabel: '1 month', shortLabelKey: 'billingPeriodMonthlyShortLabel', savingsLabel: 'Flexible', savingsLabelKey: 'billingPeriodMonthlySavings' },
  { key: '3_months', label: '3 months', labelKey: 'billingPeriodThreeMonthsLabel', shortLabel: '3 months', shortLabelKey: 'billingPeriodThreeMonthsShortLabel', savingsLabel: 'Focused sprint', savingsLabelKey: 'billingPeriodThreeMonthsSavings' },
  { key: 'yearly', label: 'Yearly', labelKey: 'billingPeriodYearlyLabel', shortLabel: '12 months', shortLabelKey: 'billingPeriodYearlyShortLabel', savingsLabel: 'Best value', savingsLabelKey: 'billingPeriodYearlySavings' },
];

const PLAN_PRICES_CENTS: Record<CheckoutPathway, Record<BillingPeriod, number>> = {
  yki: {
    monthly: 1990,
    '3_months': 4990,
    yearly: 17900,
  },
  professional: {
    monthly: 2490,
    '3_months': 6490,
    yearly: 24900,
  },
  combined: {
    monthly: 2990,
    '3_months': 7990,
    yearly: 29900,
  },
};

const MULTI_PROFESSION_PRICE_CENTS: Record<'professional' | 'combined', Record<1 | 2 | 3, Record<BillingPeriod, number>>> = {
  professional: {
    1: { monthly: 2490, '3_months': 6490, yearly: 24900 },
    2: { monthly: 2990, '3_months': 7990, yearly: 29990 },
    3: { monthly: 3490, '3_months': 9490, yearly: 34900 },
  },
  combined: {
    1: { monthly: 2990, '3_months': 7990, yearly: 29900 },
    2: { monthly: 3490, '3_months': 9490, yearly: 34900 },
    3: { monthly: 3990, '3_months': 10990, yearly: 39900 },
  },
};

function supportedProfessionCount(count: number): 1 | 2 | 3 {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  return 3;
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    id: 'yki_monthly',
    category: 'yki',
    pathway: 'yki',
    title: 'YKI Pathway',
    description: 'Focused YKI speaking, writing, reading, and listening practice for citizenship, permanent residence, study, and life in Finland.',
    checkoutLabel: 'EUR 19.90 / month',
    billingPeriod: 'monthly',
    audience: 'learner',
    includedProfessionSlots: 0,
  },
  {
    id: 'yki_3_months',
    category: 'yki',
    pathway: 'yki',
    title: 'YKI Pathway',
    description: 'Focused YKI speaking, writing, reading, and listening practice for citizenship, permanent residence, study, and life in Finland.',
    checkoutLabel: 'EUR 49.90 / 3 months',
    billingPeriod: '3_months',
    audience: 'learner',
    includedProfessionSlots: 0,
  },
  {
    id: 'yki_yearly',
    category: 'yki',
    pathway: 'yki',
    title: 'YKI Pathway',
    description: 'Focused YKI speaking, writing, reading, and listening practice for citizenship, permanent residence, study, and life in Finland.',
    checkoutLabel: 'EUR 179 / year',
    billingPeriod: 'yearly',
    audience: 'learner',
    includedProfessionSlots: 0,
  },
  {
    id: 'professional_monthly',
    category: 'professional',
    pathway: 'professional',
    title: 'Professional Pathway',
    description: 'Choose one or more professions and unlock role-specific Finnish for real workplace communication.',
    checkoutLabel: 'EUR 24.90 / month',
    billingPeriod: 'monthly',
    audience: 'learner',
    includedProfessionSlots: 1,
    extraProfessionDiscountPercent: ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  },
  {
    id: 'professional_3_months',
    category: 'professional',
    pathway: 'professional',
    title: 'Professional Pathway',
    description: 'Choose one or more professions and unlock role-specific Finnish for real workplace communication.',
    checkoutLabel: 'EUR 64.90 / 3 months',
    billingPeriod: '3_months',
    audience: 'learner',
    includedProfessionSlots: 1,
    extraProfessionDiscountPercent: ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  },
  {
    id: 'professional_yearly',
    category: 'professional',
    pathway: 'professional',
    title: 'Professional Pathway',
    description: 'Choose one or more professions and unlock role-specific Finnish for real workplace communication.',
    checkoutLabel: 'EUR 249 / year',
    billingPeriod: 'yearly',
    audience: 'learner',
    includedProfessionSlots: 1,
    extraProfessionDiscountPercent: ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  },
  {
    id: 'combined_monthly',
    category: 'bundle',
    pathway: 'combined',
    title: 'Combined Pathway',
    description: 'YKI preparation plus one professional pathway. Add more professions without creating a new plan.',
    checkoutLabel: 'EUR 29.90 / month',
    billingPeriod: 'monthly',
    audience: 'learner',
    includedProfessionSlots: 1,
    extraProfessionDiscountPercent: ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  },
  {
    id: 'combined_3_months',
    category: 'bundle',
    pathway: 'combined',
    title: 'Combined Pathway',
    description: 'YKI preparation plus one professional pathway. Add more professions without creating a new plan.',
    checkoutLabel: 'EUR 79.90 / 3 months',
    billingPeriod: '3_months',
    audience: 'learner',
    includedProfessionSlots: 1,
    extraProfessionDiscountPercent: ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  },
  {
    id: 'combined_yearly',
    category: 'bundle',
    pathway: 'combined',
    title: 'Combined Pathway',
    description: 'YKI preparation plus one professional pathway. Add more professions without creating a new plan.',
    checkoutLabel: 'EUR 299 / year',
    billingPeriod: 'yearly',
    audience: 'learner',
    includedProfessionSlots: 1,
    extraProfessionDiscountPercent: ADDITIONAL_PROFESSION_DISCOUNT_PERCENT,
  },
];

function formatCurrency(cents: number) {
  const euros = cents / 100;
  const display = Number.isInteger(euros) ? String(euros) : euros.toFixed(2);
  return `EUR ${display}`;
}

export function billingPeriodDisplay(period: BillingPeriod, labels?: BillingDisplayLabels['billingPeriods']) {
  if (labels?.[period]) return labels[period] as string;
  if (period === 'monthly') return 'month';
  if (period === '3_months') return '3 months';
  return 'year';
}

export function normalizeBillingPeriod(value: unknown): BillingPeriod {
  const raw = String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
  if (raw === '3_months' || raw === 'three_months' || raw === 'quarterly' || raw === 'quarter') return '3_months';
  if (raw === 'yearly' || raw === 'annual' || raw === 'annually' || raw === '12_months') return 'yearly';
  return 'monthly';
}

export function normalizeProfession(value: unknown): ProfessionKey | null {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
  if (normalized === 'doctor') return 'doctor';
  if (normalized === 'nurse') return 'nurse';
  if (normalized === 'practical_nurse' || normalized === 'lahioitaja' || normalized === 'laehihoitaja') return 'practical_nurse';
  return null;
}

export function dedupeProfessions(values: unknown[]): ProfessionKey[] {
  const result: ProfessionKey[] = [];
  values.forEach((value) => {
    const profession = normalizeProfession(value);
    if (profession && !result.includes(profession)) {
      result.push(profession);
    }
  });
  return result;
}

export function resolveProfessionalDisplayName(profession: string | null | undefined, labels?: BillingDisplayLabels['professions']): string {
  const normalized = normalizeProfession(profession);
  return (normalized ? labels?.[normalized] : undefined) ?? PROFESSION_OPTIONS.find((option) => option.key === normalized)?.label ?? 'Professional';
}

export function professionListLabel(
  professions: ProfessionKey[],
  labels?: BillingDisplayLabels['professions'],
  noProfessionSelectedLabel?: string,
) {
  if (!professions.length) return noProfessionSelectedLabel ?? 'No profession selected';
  return professions.map((profession) => resolveProfessionalDisplayName(profession, labels)).join(', ');
}

export function planIdFor(pathway: CheckoutPathway, billingPeriod: BillingPeriod): Exclude<PlanId, LegacyPlanId> {
  if (pathway === 'combined') return `combined_${billingPeriod}` as Exclude<PlanId, LegacyPlanId>;
  return `${pathway}_${billingPeriod}` as Exclude<PlanId, LegacyPlanId>;
}

export function getPlanByPathwayPeriod(pathway: CheckoutPathway, billingPeriod: BillingPeriod): PlanCatalogEntry {
  const id = planIdFor(pathway, billingPeriod);
  return PLAN_CATALOG.find((plan) => plan.id === id) ?? PLAN_CATALOG[0];
}

export function estimateCheckoutTotal(
  pathway: CheckoutPathway,
  billingPeriod: BillingPeriod,
  professions: ProfessionKey[],
  labels?: BillingDisplayLabels,
) {
  const professionCount = pathway === 'yki' ? 0 : Math.max(1, professions.length);
  const supportedCount = pathway === 'yki' ? 1 : supportedProfessionCount(professionCount);
  const baseCents = PLAN_PRICES_CENTS[pathway][billingPeriod];
  const totalCents = pathway === 'yki'
    ? baseCents
    : MULTI_PROFESSION_PRICE_CENTS[pathway][supportedCount][billingPeriod];
  const extraProfessionCount = pathway === 'yki' ? 0 : Math.max(0, supportedCount - 1);
  const billingPeriodLabel = billingPeriodDisplay(billingPeriod, labels?.billingPeriods);

  return {
    totalCents,
    totalLabel: `${formatCurrency(totalCents)} / ${billingPeriodLabel}`,
    baseLabel: `${formatCurrency(baseCents)} / ${billingPeriodLabel}`,
    professionCount: pathway === 'yki' ? 0 : supportedCount,
    extraProfessionCount,
    extraProfessionDiscountPercent: 0,
  };
}

export function formatSubscriptionPlanLabel(
  status: {
    planKey?: string;
    tier?: string;
    billingTier?: string;
    planLabel?: string;
    professions?: ProfessionKey[];
    isInternalAllAccess?: boolean;
    ykiAccess?: boolean;
    professionalAccess?: boolean;
  },
  labels?: BillingDisplayLabels,
) {
  const planKey = String(status.planKey ?? status.billingTier ?? status.tier ?? 'free');
  const professionLabel = professionListLabel(status.professions ?? [], labels?.professions, labels?.noProfessionSelected);

  switch (planKey) {
    case 'internal_all_access':
      return labels?.internalAllAccess ?? 'Internal All Access';
    case 'preview_yki':
      return labels?.previewYki ?? 'Free Preview - YKI Pathway';
    case 'preview_doctor':
      return labels?.previewDoctor ?? 'Free Preview - Doctor Pathway';
    case 'preview_nurse':
      return labels?.previewNurse ?? 'Free Preview - Nurse Pathway';
    case 'preview_practical_nurse':
      return labels?.previewPracticalNurse ?? 'Free Preview - Practical Nurse Pathway';
    default:
      break;
  }

  if (status.isInternalAllAccess) {
    return labels?.internalAllAccess ?? 'Internal All Access';
  }

  if (planKey === 'general_premium' || planKey.startsWith('yki_') || (status.ykiAccess && !status.professionalAccess)) {
    return labels?.ykiPathway ?? 'YKI Pathway';
  }

  if (planKey === 'professional_premium' || planKey.startsWith('professional_') || (status.professionalAccess && !status.ykiAccess)) {
    const title = labels?.professionalPathway ?? 'Professional Pathway';
    return professionLabel ? `${title} - ${professionLabel}` : title;
  }

  if (planKey.startsWith('combined_') || planKey.startsWith('bundle_') || (status.ykiAccess && status.professionalAccess)) {
    const title = labels?.combinedPathway ?? 'Combined Pathway';
    return professionLabel ? `${title} - ${professionLabel}` : title;
  }

  return status.planLabel ?? 'No active subscription';
}

export function formatSubscriptionAccessLabel(accessType: AccessType, labels?: BillingDisplayLabels) {
  return labels?.accessTypes?.[accessType] ?? accessLabelForType(accessType);
}

export function formatSubscriptionAccessSummary(
  status: Pick<NormalizedSubscriptionStatus, 'hasAnySubscription' | 'ykiAccess' | 'professionalAccess' | 'isInternalAllAccess' | 'professions'>,
  labels?: BillingDisplayLabels,
) {
  const professionLabel = professionListLabel(status.professions, labels?.professions, labels?.noProfessionSelected);

  if (!status.hasAnySubscription) {
    return labels?.accessSummaryNoSubscription ?? 'Choose a YKI, professional, or combined pathway to unlock guided support for work and life in Finland.';
  }

  if (status.isInternalAllAccess) {
    return labels?.accessSummaryInternal ?? 'YKI, workplace communication, and professional pathways are unlocked for testing.';
  }

  if (status.ykiAccess && status.professionalAccess) {
    const summary = labels?.accessSummaryCombined ?? 'Combined pathway active';
    return professionLabel ? `${summary} - ${professionLabel}` : summary;
  }

  if (status.ykiAccess) {
    return labels?.accessSummaryYki ?? 'YKI pathway is active for work, citizenship, and permanent residence goals.';
  }

  if (status.professionalAccess) {
    const summary = labels?.accessSummaryProfessional ?? 'Professional pathway is active';
    return professionLabel ? `${summary} - ${professionLabel}` : summary;
  }

  return labels?.accessSummaryNoSubscription ?? 'Subscription detected.';
}

export function buildCheckoutRequest(pathway: CheckoutPathway, billingPeriod: BillingPeriod, professions: ProfessionKey[]): CheckoutRequest {
  const selectedProfessions = pathway === 'yki' ? [] : dedupeProfessions(professions);
  return {
    plan: planIdFor(pathway, billingPeriod),
    pathway,
    billingPeriod,
    professions: selectedProfessions,
    professionCount: selectedProfessions.length,
  };
}

export type NormalizedSubscriptionStatus = {
  isPreview?: boolean;
  previewPath?: 'yki' | ProfessionKey | null;
  tier: string;
  billingTier: string;
  planKey: string;
  planLabel: string;
  planGroup: 'none' | 'yki' | 'professional' | 'bundle' | 'internal';
  professions: ProfessionKey[];
  ykiAccess: boolean;
  professionalAccess: boolean;
  hasAnySubscription: boolean;
  isActive: boolean;
  isInternalAllAccess: boolean;
  accessSummary: string;
  accessType: AccessType;
  accessLabel: string;
  raw: unknown;
};

export type SubscriptionStatus = NormalizedSubscriptionStatus;

function normalizeEmail(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function parseCsvList(value?: string | null) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function getAllAccessTestEmails() {
  const configured = typeof process !== 'undefined'
    ? parseCsvList(process.env?.EXPO_PUBLIC_ALL_ACCESS_TEST_EMAILS)
    : [];
  return Array.from(new Set(configured));
}

export function isAllAccessTestEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && getAllAccessTestEmails().includes(normalized);
}

function planLabelForTier(tier: string, professions: ProfessionKey[]) {
  const countLabel = professions.length > 1 ? `${professions.length} professions` : professions[0] ? resolveProfessionalDisplayName(professions[0]) : 'Professional';
  switch (tier) {
    case 'internal_all_access':
      return 'Internal All Access';
    case 'preview_yki':
      return 'Free Preview - YKI';
    case 'preview_doctor':
      return 'Free Preview - Doctor';
    case 'preview_nurse':
      return 'Free Preview - Nurse';
    case 'preview_practical_nurse':
      return 'Free Preview - Practical Nurse';
    case 'yki_monthly':
    case 'yki_3_months':
    case 'yki_yearly':
    case 'general_premium':
      return 'YKI Pathway';
    case 'professional_monthly':
    case 'professional_3_months':
    case 'professional_yearly':
    case 'professional_premium':
      return `Professional Pathway - ${countLabel}`;
    case 'combined_monthly':
    case 'combined_3_months':
    case 'combined_yearly':
      return `Combined Pathway - ${countLabel}`;
    case 'professional_doctor_monthly':
    case 'professional_doctor_yearly':
      return 'Professional Pathway - Doctor';
    case 'professional_nurse_monthly':
    case 'professional_nurse_yearly':
      return 'Professional Pathway - Nurse';
    case 'professional_practical_nurse_monthly':
    case 'professional_practical_nurse_yearly':
      return 'Professional Pathway - Practical Nurse';
    case 'bundle_doctor_monthly':
    case 'bundle_doctor_yearly':
      return 'Combined Pathway - YKI + Doctor';
    case 'bundle_nurse_monthly':
    case 'bundle_nurse_yearly':
      return 'Combined Pathway - YKI + Nurse';
    case 'bundle_practical_nurse_monthly':
    case 'bundle_practical_nurse_yearly':
      return 'Combined Pathway - YKI + Practical Nurse';
    default:
      return tier === 'free' ? 'No active subscription' : tier.replaceAll('_', ' ');
  }
}

function planGroupForTier(tier: string, ykiAccess: boolean, professionalAccess: boolean) {
  if (tier === 'internal_all_access') return 'internal';
  if (tier.startsWith('preview_')) return tier === 'preview_yki' ? 'yki' : 'professional';
  if (tier.startsWith('combined_') || tier.startsWith('bundle_') || (ykiAccess && professionalAccess)) return 'bundle';
  if (ykiAccess) return 'yki';
  if (professionalAccess) return 'professional';
  return 'none';
}

function deriveProfessions(tier: string, payload: Record<string, unknown>): ProfessionKey[] {
  const explicit = Array.isArray(payload.professions)
    ? dedupeProfessions(payload.professions)
    : Array.isArray(payload.selected_professions)
      ? dedupeProfessions(payload.selected_professions)
      : Array.isArray(payload.selectedProfessions)
        ? dedupeProfessions(payload.selectedProfessions)
        : Array.isArray(payload.accessible_professions)
          ? dedupeProfessions(payload.accessible_professions)
          : [];
  if (explicit.length) return explicit;

  if (tier.includes('practical_nurse') || tier.includes('lahioitaja')) return ['practical_nurse'];
  if (tier.includes('doctor')) return ['doctor'];
  if (tier.includes('nurse')) return ['nurse'];
  return [];
}

export function accessLabelForType(accessType: AccessType): string {
  switch (accessType) {
    case 'employer_programme':
      return 'Employer programme';
    case 'city_programme':
      return 'City programme';
    case 'internal':
      return 'Internal access';
    default:
      return 'Individual';
  }
}

export function inferAccessType(payload: Record<string, unknown>, tier: string, email?: string | null): AccessType {
  const raw = String(payload.access_type ?? payload.accessType ?? payload.programme_type ?? payload.programmeType ?? '').trim().toLowerCase();
  if (raw === 'employer_programme' || raw === 'employer' || raw === 'organisation' || raw === 'organization') return 'employer_programme';
  if (raw === 'city_programme' || raw === 'municipality' || raw === 'municipality_programme' || raw === 'city') return 'city_programme';
  if (tier === 'internal_all_access' || isAllAccessTestEmail(email)) return 'internal';
  return 'individual';
}

export function normalizeSubscriptionStatus(
  payload: unknown,
  options?: { email?: string | null; subscriptionTierHint?: string | null },
): NormalizedSubscriptionStatus {
  const email = normalizeEmail(options?.email);
  const data = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const hintedTier = String(options?.subscriptionTierHint ?? '').trim();
  const rawTier = String((data.billing_tier ?? data.billingTier ?? data.plan_key ?? data.planKey ?? data.tier ?? hintedTier) || 'free');

  if (isAllAccessTestEmail(email)) {
    return {
      tier: 'internal_all_access',
      billingTier: 'internal_all_access',
      planKey: 'internal_all_access',
      planLabel: 'Internal All Access',
      planGroup: 'internal',
      professions: ['doctor', 'nurse', 'practical_nurse'],
      ykiAccess: true,
      professionalAccess: true,
      hasAnySubscription: true,
      isActive: true,
      isInternalAllAccess: true,
      accessSummary: 'YKI, workplace communication, and professional pathways are unlocked for testing.',
      accessType: 'internal',
      accessLabel: accessLabelForType('internal'),
      raw: payload,
    };
  }

  const explicitInternalAllAccess = Boolean(data.is_internal_all_access ?? data.isInternalAllAccess) || rawTier === 'internal_all_access';
  if (explicitInternalAllAccess) {
    return {
      tier: 'internal_all_access',
      billingTier: 'internal_all_access',
      planKey: 'internal_all_access',
      planLabel: 'Internal All Access',
      planGroup: 'internal',
      professions: ['doctor', 'nurse', 'practical_nurse'],
      ykiAccess: true,
      professionalAccess: true,
      hasAnySubscription: true,
      isActive: true,
      isInternalAllAccess: true,
      accessSummary: 'YKI, workplace communication, and professional pathways are unlocked for testing.',
      accessType: 'internal',
      accessLabel: accessLabelForType('internal'),
      raw: payload,
    };
  }

  const professions = deriveProfessions(rawTier, data);
  const features = data.features && typeof data.features === 'object' ? (data.features as Record<string, Record<string, unknown>>) : {};
  const ykiAccess = typeof data.yki_access === 'boolean'
    ? data.yki_access
    : typeof data.ykiAccess === 'boolean'
      ? data.ykiAccess
      : typeof features.yki?.available === 'boolean'
        ? Boolean(features.yki.available)
        : rawTier.startsWith('yki_') || rawTier.startsWith('combined_') || rawTier.startsWith('bundle_') || rawTier === 'professional_premium';
  const professionalAccess = typeof data.professional_access === 'boolean'
    ? data.professional_access
    : typeof data.professionalAccess === 'boolean'
      ? data.professionalAccess
      : typeof data.workplace_access === 'boolean'
        ? data.workplace_access
        : typeof data.workplaceAccess === 'boolean'
          ? data.workplaceAccess
          : typeof features.workplace?.available === 'boolean'
            ? Boolean(features.workplace.available)
            : professions.length > 0 || rawTier.startsWith('professional_') || rawTier.startsWith('combined_') || rawTier.startsWith('bundle_') || rawTier === 'professional_premium';
  const hasAnySubscription = typeof data.has_any_subscription === 'boolean'
    ? data.has_any_subscription
    : typeof data.hasAnySubscription === 'boolean'
      ? data.hasAnySubscription
      : rawTier.length > 0 && rawTier !== 'free';
  const isActive = Boolean(data.is_active ?? data.isActive ?? hasAnySubscription);
  const planLabel = planLabelForTier(rawTier || 'free', professions);
  const accessType = inferAccessType(data, rawTier || 'free', email);
  const professionLabel = professionListLabel(professions);
  const accessSummary = !hasAnySubscription
    ? 'Choose a YKI, professional, or combined pathway to unlock guided support for work and life in Finland.'
    : ykiAccess && professionalAccess
      ? `Combined pathway active${professions.length ? ` - ${professionLabel}` : ''}`
      : ykiAccess
        ? 'YKI pathway is active for work, citizenship, and permanent residence goals.'
        : professionalAccess
          ? `Professional pathway is active${professions.length ? ` - ${professionLabel}` : ''}.`
          : 'Subscription detected.';

  return {
    tier: rawTier || 'free',
    billingTier: rawTier || 'free',
    planKey: String((data.plan_key ?? data.planKey ?? rawTier) || 'free'),
    planLabel,
    planGroup: planGroupForTier(rawTier || 'free', ykiAccess, professionalAccess),
    professions,
    ykiAccess,
    professionalAccess,
    hasAnySubscription,
    isActive,
    isInternalAllAccess: rawTier === 'internal_all_access',
    accessSummary,
    accessType,
    accessLabel: accessLabelForType(accessType),
    raw: payload,
  };
}
