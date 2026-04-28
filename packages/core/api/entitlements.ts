export type ProfessionKey = 'doctor' | 'nurse' | 'practical_nurse';

/** Alias kept for callers that import ProfessionCode */
export type ProfessionCode = ProfessionKey;

export type PreviewPlanId = 'preview_yki' | 'preview_doctor' | 'preview_nurse' | 'preview_practical_nurse';

export type PlanId =
  | 'yki_monthly' | 'yki_yearly'
  | 'professional_doctor_monthly' | 'professional_doctor_yearly'
  | 'professional_nurse_monthly' | 'professional_nurse_yearly'
  | 'professional_practical_nurse_monthly' | 'professional_practical_nurse_yearly'
  | 'bundle_doctor_monthly' | 'bundle_doctor_yearly'
  | 'bundle_nurse_monthly' | 'bundle_nurse_yearly'
  | 'bundle_practical_nurse_monthly' | 'bundle_practical_nurse_yearly';

export type AccessType = 'individual' | 'employer_programme' | 'city_programme' | 'internal';

export type PlanCatalogEntry = {
  id: PlanId;
  category: 'yki' | 'professional' | 'bundle';
  profession?: ProfessionKey;
  title: string;
  description: string;
  checkoutLabel: string;
  billingPeriod: 'monthly' | 'yearly';
  audience?: 'learner' | 'employer' | 'city';
};

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  { id: 'yki_monthly', category: 'yki', title: 'YKI Pathway', description: 'Prepare for YKI speaking, writing, reading, and listening with guided practice that also supports citizenship and permanent residence language goals.', checkoutLabel: '€14.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'yki_yearly', category: 'yki', title: 'YKI Pathway', description: 'Prepare for YKI speaking, writing, reading, and listening with guided practice that also supports citizenship and permanent residence language goals.', checkoutLabel: '€149 / year', billingPeriod: 'yearly', audience: 'learner' },
  { id: 'professional_doctor_monthly', category: 'professional', profession: 'doctor', title: 'Professional Pathway · Doctor', description: 'Build Finnish for patient interaction, explanations, documentation, teamwork, and real medical communication in Finland.', checkoutLabel: '€24.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'professional_doctor_yearly', category: 'professional', profession: 'doctor', title: 'Professional Pathway · Doctor', description: 'Build Finnish for patient interaction, explanations, documentation, teamwork, and real medical communication in Finland.', checkoutLabel: '€249 / year', billingPeriod: 'yearly', audience: 'learner' },
  { id: 'professional_nurse_monthly', category: 'professional', profession: 'nurse', title: 'Professional Pathway · Nurse', description: 'Build Finnish for patient care, reporting, handovers, medication communication, and everyday workplace interaction.', checkoutLabel: '€24.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'professional_nurse_yearly', category: 'professional', profession: 'nurse', title: 'Professional Pathway · Nurse', description: 'Build Finnish for patient care, reporting, handovers, medication communication, and everyday workplace interaction.', checkoutLabel: '€249 / year', billingPeriod: 'yearly', audience: 'learner' },
  { id: 'professional_practical_nurse_monthly', category: 'professional', profession: 'practical_nurse', title: 'Professional Pathway · Practical Nurse', description: 'Build Finnish for care work, routines, residents, relatives, teamwork, and practical communication in real care settings.', checkoutLabel: '€24.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'professional_practical_nurse_yearly', category: 'professional', profession: 'practical_nurse', title: 'Professional Pathway · Practical Nurse', description: 'Build Finnish for care work, routines, residents, relatives, teamwork, and practical communication in real care settings.', checkoutLabel: '€249 / year', billingPeriod: 'yearly', audience: 'learner' },
  { id: 'bundle_doctor_monthly', category: 'bundle', profession: 'doctor', title: 'Combined Pathway · YKI + Doctor', description: 'Prepare for YKI while building doctor-specific Finnish for work, services, and long-term life in Finland.', checkoutLabel: '€29.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'bundle_doctor_yearly', category: 'bundle', profession: 'doctor', title: 'Combined Pathway · YKI + Doctor', description: 'Prepare for YKI while building doctor-specific Finnish for work, services, and long-term life in Finland.', checkoutLabel: '€299 / year', billingPeriod: 'yearly', audience: 'learner' },
  { id: 'bundle_nurse_monthly', category: 'bundle', profession: 'nurse', title: 'Combined Pathway · YKI + Nurse', description: 'Prepare for YKI while building nurse-specific Finnish for work, services, and long-term life in Finland.', checkoutLabel: '€29.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'bundle_nurse_yearly', category: 'bundle', profession: 'nurse', title: 'Combined Pathway · YKI + Nurse', description: 'Prepare for YKI while building nurse-specific Finnish for work, services, and long-term life in Finland.', checkoutLabel: '€299 / year', billingPeriod: 'yearly', audience: 'learner' },
  { id: 'bundle_practical_nurse_monthly', category: 'bundle', profession: 'practical_nurse', title: 'Combined Pathway · YKI + Practical Nurse', description: 'Prepare for YKI while building practical nurse Finnish for work, services, and long-term life in Finland.', checkoutLabel: '€29.90 / month', billingPeriod: 'monthly', audience: 'learner' },
  { id: 'bundle_practical_nurse_yearly', category: 'bundle', profession: 'practical_nurse', title: 'Combined Pathway · YKI + Practical Nurse', description: 'Prepare for YKI while building practical nurse Finnish for work, services, and long-term life in Finland.', checkoutLabel: '€299 / year', billingPeriod: 'yearly', audience: 'learner' },
];

export function resolveProfessionalDisplayName(profession: string | null | undefined): string {
  const normalized = String(profession ?? '').trim().toLowerCase();
  if (normalized === 'doctor') return 'Doctor';
  if (normalized === 'nurse') return 'Nurse';
  if (normalized === 'practical_nurse' || normalized === 'practical-nurse' || normalized === 'lahioitaja') return 'Practical Nurse';
  return 'Professional';
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

function normalizeProfession(value: unknown): ProfessionKey | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'doctor') return 'doctor';
  if (normalized === 'nurse') return 'nurse';
  if (normalized === 'practical_nurse' || normalized === 'lahioitaja' || normalized === 'practical-nurse') {
    return 'practical_nurse';
  }
  return null;
}

function dedupeProfessions(values: unknown[]): ProfessionKey[] {
  const result: ProfessionKey[] = [];
  values.forEach((value) => {
    const profession = normalizeProfession(value);
    if (profession && !result.includes(profession)) {
      result.push(profession);
    }
  });
  return result;
}

function planLabelForTier(tier: string, professions: ProfessionKey[]) {
  const primaryProfession = professions[0];
  switch (tier) {
    case 'internal_all_access':
      return 'Internal All Access';
    case 'preview_yki':
      return 'Free Preview · YKI';
    case 'preview_doctor':
      return 'Free Preview · Doctor';
    case 'preview_nurse':
      return 'Free Preview · Nurse';
    case 'preview_practical_nurse':
      return 'Free Preview · Practical Nurse';
    case 'yki_monthly':
    case 'yki_yearly':
    case 'general_premium':
      return 'YKI Pathway';
    case 'professional_doctor_monthly':
    case 'professional_doctor_yearly':
      return 'Professional Pathway · Doctor';
    case 'professional_nurse_monthly':
    case 'professional_nurse_yearly':
      return 'Professional Pathway · Nurse';
    case 'professional_practical_nurse_monthly':
    case 'professional_practical_nurse_yearly':
      return 'Professional Pathway · Practical Nurse';
    case 'bundle_doctor_monthly':
    case 'bundle_doctor_yearly':
      return 'Combined Pathway · YKI + Doctor';
    case 'bundle_nurse_monthly':
    case 'bundle_nurse_yearly':
      return 'Combined Pathway · YKI + Nurse';
    case 'bundle_practical_nurse_monthly':
    case 'bundle_practical_nurse_yearly':
      return 'Combined Pathway · YKI + Practical Nurse';
    case 'professional_premium':
      return primaryProfession ? `Professional Pathway · ${primaryProfession.replace('_', ' ')}` : 'Professional Pathway Premium';
    default:
      return tier === 'free' ? 'No active subscription' : tier.replaceAll('_', ' ');
  }
}

function planGroupForTier(tier: string, ykiAccess: boolean, professionalAccess: boolean) {
  if (tier === 'internal_all_access') return 'internal';
  if (tier.startsWith('preview_')) return tier === 'preview_yki' ? 'yki' : 'professional';
  if (ykiAccess && professionalAccess) return 'bundle';
  if (ykiAccess) return 'yki';
  if (professionalAccess) return 'professional';
  return 'none';
}

function deriveProfessions(tier: string, payload: Record<string, unknown>): ProfessionKey[] {
  const explicit = Array.isArray(payload.professions)
    ? dedupeProfessions(payload.professions)
    : Array.isArray(payload.accessible_professions)
      ? dedupeProfessions(payload.accessible_professions)
      : [];
  if (explicit.length) return explicit;

  if (tier.includes('doctor')) return ['doctor'];
  if (tier.includes('practical_nurse') || tier.includes('lahioitaja')) return ['practical_nurse'];
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

  const explicitInternalAllAccess = Boolean(data.is_internal_all_access ?? data.isInternalAllAccess) || rawTier === "internal_all_access";

  if (explicitInternalAllAccess) {
    return {
      tier: "internal_all_access",
      billingTier: "internal_all_access",
      planKey: "internal_all_access",
      planLabel: "Internal All Access",
      planGroup: "internal",
      professions: ["doctor", "nurse", "practical_nurse"],
      ykiAccess: true,
      professionalAccess: true,
      hasAnySubscription: true,
      isActive: true,
      isInternalAllAccess: true,
      accessSummary: "YKI, workplace communication, and professional pathways are unlocked for testing.",
      accessType: "internal",
      accessLabel: accessLabelForType("internal"),
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
        : rawTier.startsWith('yki_') || rawTier.startsWith('bundle_') || rawTier === 'professional_premium';
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
            : professions.length > 0 || rawTier.startsWith('professional_') || rawTier.startsWith('bundle_') || rawTier === 'professional_premium';
  const hasAnySubscription = typeof data.has_any_subscription === 'boolean'
    ? data.has_any_subscription
    : typeof data.hasAnySubscription === 'boolean'
      ? data.hasAnySubscription
      : rawTier.length > 0 && rawTier !== 'free';
  const isActive = Boolean(data.is_active ?? data.isActive ?? hasAnySubscription);
  const planLabel = planLabelForTier(rawTier || 'free', professions);
  const accessType = inferAccessType(data, rawTier || 'free', email);
  const accessSummary = !hasAnySubscription
    ? 'Choose a YKI, professional, or combined pathway to unlock guided support for work and life in Finland.'
    : ykiAccess && professionalAccess
      ? `Combined pathway active${professions.length ? ` · ${professions.join(', ').replaceAll('_', ' ')}` : ''}`
      : ykiAccess
        ? 'YKI pathway is active for work, citizenship, and permanent residence goals.'
        : professionalAccess
          ? `Professional pathway is active${professions.length ? ` · ${professions.join(', ').replaceAll('_', ' ')}` : ''}.`
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
