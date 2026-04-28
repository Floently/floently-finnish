import { create } from 'zustand';

import { getSubscriptionStatus } from '@core/api/billing';
import type { AuthUser } from '@core/api/auth';

type ProfessionCode = 'doctor' | 'nurse' | 'practical_nurse';
type LearningContext = 'none' | 'yki' | ProfessionCode;

type PreviewPath = 'yki' | ProfessionCode;

type AccessType = 'individual' | 'employer_programme' | 'city_programme' | 'internal';

type CompatSubscriptionStatus = {
  tier: string;
  billingTier: string;
  plan: {
    id: string;
    title: string;
    category: 'none' | 'yki' | 'professional' | 'bundle' | 'internal';
    profession?: ProfessionCode | null;
  };
  planLabel: string;
  accessSummary: string;
  accessType: AccessType;
  accessLabel: string;
  entitlements: {
    learnAccess: boolean;
    ykiAccess: boolean;
    professionalAccess: boolean;
    professions: ProfessionCode[];
    activeContext: LearningContext;
  };
  // Flat aliases for newer screens/patches
  ykiAccess: boolean;
  professionalAccess: boolean;
  professions: ProfessionCode[];
  hasAnySubscription: boolean;
  isActive: boolean;
  isInternalAllAccess: boolean;
  isPreview?: boolean;
  previewPath?: PreviewPath | null;
  previewLimits?: {
    roleplaySessions: number;
    cardSessions: number;
    ykiPracticeSessions: number;
    fullExamAvailable: boolean;
  };
};

type SubscriptionState = {
  hasLoaded: boolean;
  isLoading: boolean;
  status: CompatSubscriptionStatus | null;
  activeContext: LearningContext;
  previewPath: PreviewPath | null;
  hydrate: (input?: AuthUser | { email?: string | null; subscriptionTierHint?: string | null } | null) => Promise<void>;
  refresh: (input?: AuthUser | { email?: string | null; subscriptionTierHint?: string | null } | null) => Promise<void>;
  clear: () => void;
  setActiveContext: (context: LearningContext) => void;
  startPreview: (path: PreviewPath) => void;
  endPreview: () => void;
};

type UserLike = {
  email?: string | null;
  subscriptionTier?: string | null;
  subscriptionTierHint?: string | null;
};

const DEFAULT_ALL_ACCESS_EMAILS = ['ruka@ruka.com'];

function normalizeEmail(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function parseCsvList(value?: string | null) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function allAccessEmails() {
  const configured = typeof process !== 'undefined' ? parseCsvList(process.env?.EXPO_PUBLIC_ALL_ACCESS_TEST_EMAILS) : [];
  return Array.from(new Set([...DEFAULT_ALL_ACCESS_EMAILS, ...configured]));
}

function isAllAccessEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized && allAccessEmails().includes(normalized));
}

function normalizeProfession(value: unknown): ProfessionCode | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'doctor') return 'doctor';
  if (normalized === 'nurse') return 'nurse';
  if (normalized === 'practical_nurse' || normalized === 'practical-nurse' || normalized === 'lahioitaja') return 'practical_nurse';
  return null;
}

function dedupeProfessions(values: unknown[]): ProfessionCode[] {
  const result: ProfessionCode[] = [];
  values.forEach((value) => {
    const profession = normalizeProfession(value);
    if (profession && !result.includes(profession)) result.push(profession);
  });
  return result;
}

function extractProfessions(source: Record<string, unknown>): ProfessionCode[] {
  if (Array.isArray(source.entitlements) || Array.isArray(source.features)) return [];
  const direct = Array.isArray(source.professions) ? dedupeProfessions(source.professions) : [];
  if (direct.length) return direct;
  const accessible = Array.isArray(source.accessible_professions) ? dedupeProfessions(source.accessible_professions) : [];
  if (accessible.length) return accessible;
  const nestedEntitlements = source.entitlements && typeof source.entitlements === 'object'
    ? source.entitlements as Record<string, unknown>
    : null;
  if (nestedEntitlements && Array.isArray(nestedEntitlements.professions)) {
    return dedupeProfessions(nestedEntitlements.professions);
  }
  return [];
}

function planCategory(tier: string, ykiAccess: boolean, professionalAccess: boolean): CompatSubscriptionStatus['plan']['category'] {
  if (tier === 'internal_all_access') return 'internal';
  if (ykiAccess && professionalAccess) return 'bundle';
  if (ykiAccess) return 'yki';
  if (professionalAccess) return 'professional';
  return 'none';
}

function planLabel(tier: string, professions: ProfessionCode[]) {
  const first = professions[0];
  switch (tier) {
    case 'internal_all_access':
      return 'Internal All Access';
    case 'yki_monthly':
    case 'yki_yearly':
    case 'general_premium':
      return 'YKI Pathway';
    case 'bundle_nurse_monthly':
    case 'bundle_nurse_yearly':
      return 'Combined Pathway · YKI + Nurse';
    case 'bundle_doctor_monthly':
    case 'bundle_doctor_yearly':
      return 'Combined Pathway · YKI + Doctor';
    case 'bundle_practical_nurse_monthly':
    case 'bundle_practical_nurse_yearly':
      return 'Combined Pathway · YKI + Practical Nurse';
    case 'professional_nurse_monthly':
    case 'professional_nurse_yearly':
      return 'Professional Pathway · Nurse';
    case 'professional_doctor_monthly':
    case 'professional_doctor_yearly':
      return 'Professional Pathway · Doctor';
    case 'professional_practical_nurse_monthly':
    case 'professional_practical_nurse_yearly':
      return 'Professional Pathway · Practical Nurse';
    default:
      if (tier === 'free' || !tier) return 'No active subscription';
      if (first) return `Professional Pathway · ${first.replace('_', ' ')}`;
      return tier.replaceAll('_', ' ');
  }
}

function resolveAccessType(source: Record<string, unknown>, tier: string): AccessType {
  const raw = String(source.accessType ?? source.access_type ?? source.programmeType ?? source.programme_type ?? '').trim().toLowerCase();
  if (raw === 'employer_programme' || raw === 'employer' || raw === 'organisation' || raw === 'organization') return 'employer_programme';
  if (raw === 'city_programme' || raw === 'city' || raw === 'municipality' || raw === 'municipality_programme') return 'city_programme';
  if (tier === 'internal_all_access') return 'internal';
  return 'individual';
}

function accessLabelForType(accessType: AccessType) {
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

function previewLimitsFor(path: PreviewPath | null | undefined) {
  return {
    roleplaySessions: 1,
    cardSessions: 1,
    ykiPracticeSessions: path === 'yki' ? 1 : 0,
    fullExamAvailable: false,
  };
}

function buildPreviewStatus(path: PreviewPath): CompatSubscriptionStatus {
  const title = path === 'yki' ? 'Free Preview · YKI' : `Free Preview · ${path === 'doctor' ? 'Doctor' : path === 'nurse' ? 'Nurse' : 'Practical Nurse'}`;
  return {
    ...compatStatusFromValues({
      tier: `preview_${path}`,
      ykiAccess: path === 'yki',
      professionalAccess: path !== 'yki',
      professions: path === 'yki' ? [] : [path],
      accessSummary: path === 'yki'
        ? 'Preview mode: one YKI sampler, one guided conversation, and a limited vocabulary taste. Full exam remains locked.'
        : 'Preview mode: one professional pathway, one guided conversation, and limited access to workplace Finnish.',
      activeContext: path,
    }),
    plan: {
      id: `preview_${path}`,
      title,
      category: path === 'yki' ? 'yki' : 'professional',
      profession: path === 'yki' ? null : path,
    },
    planLabel: title,
    accessType: 'individual',
    accessLabel: accessLabelForType('individual'),
    hasAnySubscription: false,
    isActive: true,
    isPreview: true,
    previewPath: path,
    previewLimits: previewLimitsFor(path),
  };
}

function compatStatusFromValues(args: {
  email?: string | null;
  tier?: string | null;
  ykiAccess: boolean;
  professionalAccess: boolean;
  professions: ProfessionCode[];
  isInternalAllAccess?: boolean;
  isActive?: boolean;
  accessSummary?: string;
  activeContext?: LearningContext;
  raw?: unknown;
}): CompatSubscriptionStatus {
  const tier = String(args.tier || (args.isInternalAllAccess ? 'internal_all_access' : 'free'));
  const professions = args.professions;
  const ykiAccess = args.ykiAccess;
  const professionalAccess = args.professionalAccess;
  const activeContext = args.activeContext && (args.activeContext === 'yki' || professions.includes(args.activeContext as ProfessionCode))
    ? args.activeContext
    : ykiAccess ? 'yki' : (professions[0] ?? 'none');
  const category = planCategory(tier, ykiAccess, professionalAccess);
  const title = planLabel(tier, professions);
  const accessType = resolveAccessType((args.raw && typeof args.raw === 'object' ? args.raw as Record<string, unknown> : {}), tier);
  const learnAccess = ykiAccess || professionalAccess || category === 'internal';
  return {
    tier,
    billingTier: tier,
    plan: {
      id: tier,
      title,
      category,
      profession: professions[0] ?? null,
    },
    planLabel: title,
    accessSummary: args.accessSummary ?? (
      args.isInternalAllAccess
        ? 'YKI, workplace communication, and professional pathways are unlocked for testing.'
        : !learnAccess
          ? 'Choose a YKI, professional, or combined pathway to unlock guided support for work and life in Finland.'
          : ykiAccess && professionalAccess
            ? 'Combined pathway access is active.'
            : ykiAccess
              ? 'YKI pathway is active.'
              : 'Professional pathway is active.'
    ),
    accessType,
    accessLabel: accessLabelForType(accessType),
    entitlements: {
      learnAccess,
      ykiAccess,
      professionalAccess,
      professions,
      activeContext,
    },
    ykiAccess,
    professionalAccess,
    professions,
    hasAnySubscription: learnAccess || args.isInternalAllAccess === true,
    isActive: args.isActive ?? (learnAccess || args.isInternalAllAccess === true),
    isInternalAllAccess: Boolean(args.isInternalAllAccess),
    isPreview: String(tier).startsWith('preview_'),
    previewPath: String(tier).startsWith('preview_') ? (String(tier).replace('preview_', '') as PreviewPath) : null,
    previewLimits: String(tier).startsWith('preview_') ? previewLimitsFor(String(tier).replace('preview_', '') as PreviewPath) : undefined,
  };
}

function fallbackForUser(user?: UserLike | null): CompatSubscriptionStatus {
  const email = normalizeEmail(user?.email);
  if (isAllAccessEmail(email)) {
    return compatStatusFromValues({
      email,
      tier: 'internal_all_access',
      ykiAccess: true,
      professionalAccess: true,
      professions: ['doctor', 'nurse', 'practical_nurse'],
      isInternalAllAccess: true,
    });
  }

  const tier = String(user?.subscriptionTier ?? user?.subscriptionTierHint ?? 'free');
  const ykiAccess = tier.startsWith('yki_') || tier.startsWith('bundle_') || tier === 'general_premium';
  const professions = tier.includes('doctor')
    ? (['doctor'] as ProfessionCode[])
    : tier.includes('practical_nurse') || tier.includes('lahioitaja')
      ? (['practical_nurse'] as ProfessionCode[])
      : tier.includes('nurse')
        ? (['nurse'] as ProfessionCode[])
        : ([] as ProfessionCode[]);
  const professionalAccess = professions.length > 0 || tier.startsWith('professional_') || tier.startsWith('bundle_') || tier === 'professional_premium';
  if (tier.startsWith('preview_')) {
    const path = tier.replace('preview_', '') as PreviewPath;
    if (path === 'yki' || path === 'doctor' || path === 'nurse' || path === 'practical_nurse') {
      return buildPreviewStatus(path);
    }
  }
  return compatStatusFromValues({ email, tier, ykiAccess, professionalAccess, professions });
}

function normalizeRemoteStatus(payload: unknown, user?: UserLike | null): CompatSubscriptionStatus {
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const nestedData = source.data && typeof source.data === 'object' ? source.data as Record<string, unknown> : null;
  const current = nestedData ?? source;
  const email = normalizeEmail(user?.email);

  const explicitInternal = Boolean(
    current.is_internal_all_access ?? current.isInternalAllAccess ?? current.internal_all_access ?? current.internalAllAccess,
  ) || String(current.tier ?? current.billing_tier ?? current.billingTier ?? user?.subscriptionTier ?? user?.subscriptionTierHint ?? '') === 'internal_all_access';

  if (explicitInternal || isAllAccessEmail(email)) {
    return compatStatusFromValues({
      email,
      tier: 'internal_all_access',
      ykiAccess: true,
      professionalAccess: true,
      professions: ['doctor', 'nurse', 'practical_nurse'],
      isInternalAllAccess: true,
      accessSummary: typeof current.accessSummary === 'string' ? current.accessSummary : undefined,
    });
  }

  if (current.entitlements && typeof current.entitlements === 'object') {
    const entitlements = current.entitlements as Record<string, unknown>;
    const professions = Array.isArray(entitlements.professions) ? dedupeProfessions(entitlements.professions) : [];
    const ykiAccess = Boolean(entitlements.ykiAccess);
    const professionalAccess = Boolean(entitlements.professionalAccess);
    const activeContextRaw = entitlements.activeContext;
    const activeContext = activeContextRaw === 'yki' || normalizeProfession(activeContextRaw)
      ? (activeContextRaw as LearningContext)
      : undefined;
    const plan = current.plan && typeof current.plan === 'object' ? current.plan as Record<string, unknown> : null;
    const status = compatStatusFromValues({
      email,
      tier: String(current.tier ?? current.billingTier ?? current.billing_tier ?? plan?.id ?? user?.subscriptionTier ?? user?.subscriptionTierHint ?? 'free'),
      ykiAccess,
      professionalAccess,
      professions,
      isInternalAllAccess: false,
      accessSummary: typeof current.accessSummary === 'string' ? current.accessSummary : undefined,
      activeContext,
      raw: current,
    });
    if (plan) {
      status.plan = {
        id: String(plan.id ?? status.plan.id),
        title: String(plan.title ?? status.plan.title),
        category: (plan.category as CompatSubscriptionStatus['plan']['category']) ?? status.plan.category,
        profession: normalizeProfession(plan.profession) ?? status.plan.profession,
      };
      status.planLabel = status.plan.title;
    }
    status.accessType = resolveAccessType(current, status.tier);
    status.accessLabel = accessLabelForType(status.accessType);
    return status;
  }

  const professions = extractProfessions(current);
  const ykiAccess = typeof current.yki_access === 'boolean'
    ? current.yki_access
    : typeof current.ykiAccess === 'boolean'
      ? current.ykiAccess
      : String(current.tier ?? current.billing_tier ?? current.billingTier ?? '').startsWith('yki_') || String(current.tier ?? current.billing_tier ?? current.billingTier ?? '').startsWith('bundle_');
  const professionalAccess = typeof current.professional_access === 'boolean'
    ? current.professional_access
    : typeof current.professionalAccess === 'boolean'
      ? current.professionalAccess
      : typeof current.workplace_access === 'boolean'
        ? current.workplace_access
        : professions.length > 0 || String(current.tier ?? current.billing_tier ?? current.billingTier ?? '').startsWith('professional_') || String(current.tier ?? current.billing_tier ?? current.billingTier ?? '').startsWith('bundle_');
  return compatStatusFromValues({
    email,
    tier: String(current.billing_tier ?? current.billingTier ?? current.tier ?? user?.subscriptionTier ?? user?.subscriptionTierHint ?? 'free'),
    ykiAccess,
    professionalAccess,
    professions,
    isInternalAllAccess: false,
    accessSummary: typeof current.accessSummary === 'string' ? current.accessSummary : typeof current.access_summary === 'string' ? current.access_summary : undefined,
    activeContext: current.activeContext === 'yki' || normalizeProfession(current.activeContext) ? current.activeContext as LearningContext : undefined,
    isActive: typeof current.is_active === 'boolean' ? current.is_active : typeof current.isActive === 'boolean' ? current.isActive : undefined,
    raw: payload,
  });
}

function allowedContexts(status: CompatSubscriptionStatus | null): LearningContext[] {
  const entitlements = status?.entitlements;
  if (!entitlements) return ['none'];
  const contexts: LearningContext[] = ['none'];
  if (entitlements.ykiAccess) contexts.push('yki');
  for (const profession of entitlements.professions) {
    if (!contexts.includes(profession)) contexts.push(profession);
  }
  return contexts;
}

function resolveContext(status: CompatSubscriptionStatus, preferred: LearningContext): LearningContext {
  const contexts = allowedContexts(status);
  if (contexts.includes(preferred)) return preferred;
  if (contexts.includes(status.entitlements.activeContext)) return status.entitlements.activeContext;
  return contexts[0] ?? 'none';
}

function toUserLike(input?: AuthUser | { email?: string | null; subscriptionTierHint?: string | null } | null): UserLike | null {
  if (!input) return null;
  return {
    email: input.email ?? null,
    subscriptionTier: 'subscriptionTier' in input ? (input as AuthUser).subscriptionTier ?? null : null,
    subscriptionTierHint: 'subscriptionTierHint' in input ? input.subscriptionTierHint ?? null : null,
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  hasLoaded: false,
  isLoading: false,
  status: null,
  activeContext: 'none',
  previewPath: null,
  async hydrate(input) {
    const user = toUserLike(input);
    if (!user) {
      const previewPath = get().previewPath;
      const fallback = previewPath ? buildPreviewStatus(previewPath) : fallbackForUser(null);
      set({ hasLoaded: true, isLoading: false, status: fallback, activeContext: previewPath ?? 'none' });
      return;
    }
    await get().refresh(input);
  },
  async refresh(input) {
    const user = toUserLike(input);
    const previewPath = get().previewPath;
    const previewFallback = previewPath ? buildPreviewStatus(previewPath) : null;
    const fallback = previewFallback ?? fallbackForUser(user);
    const fallbackContext = resolveContext(fallback, get().activeContext);
    set({ isLoading: true, status: { ...fallback, entitlements: { ...fallback.entitlements, activeContext: fallbackContext } }, activeContext: fallbackContext });
    try {
      const remoteRaw = await getSubscriptionStatus();
      const remote = normalizeRemoteStatus(remoteRaw, user);
      const effectiveRemote = (!remote.hasAnySubscription && !remote.isInternalAllAccess && previewFallback) ? previewFallback : remote;
      const activeContext = resolveContext(effectiveRemote, get().activeContext);
      set({
        hasLoaded: true,
        isLoading: false,
        status: {
          ...effectiveRemote,
          entitlements: {
            ...effectiveRemote.entitlements,
            activeContext,
          },
        },
        activeContext,
      });
    } catch {
      set({
        hasLoaded: true,
        isLoading: false,
        status: {
          ...fallback,
          entitlements: {
            ...fallback.entitlements,
            activeContext: fallbackContext,
          },
        },
        activeContext: fallbackContext,
      });
    }
  },
  clear() {
    set({ hasLoaded: false, isLoading: false, status: null, activeContext: 'none', previewPath: null });
  },
  startPreview(path) {
    const status = buildPreviewStatus(path);
    set({
      previewPath: path,
      hasLoaded: true,
      isLoading: false,
      status,
      activeContext: path,
    });
  },
  endPreview() {
    set((state) => ({
      previewPath: null,
      status: state.status?.isPreview ? fallbackForUser(null) : state.status,
      activeContext: state.status?.isPreview ? 'none' : state.activeContext,
    }));
  },
  setActiveContext(context) {
    const status = get().status;
    if (!allowedContexts(status).includes(context)) return;
    set((state) => ({
      activeContext: context,
      status: state.status
        ? {
            ...state.status,
            entitlements: {
              ...state.status.entitlements,
              activeContext: context,
            },
          }
        : state.status,
    }));
  },
}));
