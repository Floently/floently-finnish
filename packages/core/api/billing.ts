import { apiClient } from './client';
import { normalizeSubscriptionStatus, type BillingPeriod, type CheckoutPathway, type ProfessionKey, type SubscriptionStatus } from './entitlements';

function unwrapPayload<T = unknown>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in (value as Record<string, unknown>)) {
    return ((value as { data: T }).data) ?? (value as T);
  }
  return value as T;
}

export type CheckoutSessionInput = string | {
  plan?: string;
  pathway?: CheckoutPathway;
  billingPeriod?: BillingPeriod;
  billing_period?: BillingPeriod;
  professions?: ProfessionKey[];
  professionCount?: number;
  profession_count?: number;
  trialDays?: number;
  trial_days?: number;
};

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await apiClient.get('/api/v1/subscription/status');
  return normalizeSubscriptionStatus(res.data);
}

export async function getSubscriptionPlans() {
  const res = await apiClient.get('/api/v1/subscription/plans');
  return unwrapPayload(res.data);
}

export async function createCheckoutSession(input: CheckoutSessionInput) {
  const payload = typeof input === 'string'
    ? { plan: input }
    : {
        ...input,
        billing_period: input.billing_period ?? input.billingPeriod,
        profession_count: input.profession_count ?? input.professionCount ?? input.professions?.length ?? 0,
        trial_days: input.trial_days ?? input.trialDays,
      };
  const res = await apiClient.post('/api/v1/subscription/checkout', payload);
  return unwrapPayload(res.data);
}

export async function startSubscriptionTrial(trialDays = 3) {
  const res = await apiClient.post('/api/v1/subscription/trial', { trial_days: trialDays });
  return unwrapPayload(res.data);
}

export async function cancelSubscriptionTrial() {
  const res = await apiClient.post('/api/v1/subscription/cancel-trial', {});
  return unwrapPayload(res.data);
}

export async function reactivateSubscription() {
  const res = await apiClient.post('/api/v1/subscription/reactivate', {});
  return unwrapPayload(res.data);
}

export async function trackUsageEvent(payload: {
  event_type?: string;
  eventType?: string;
  feature?: string;
  screen?: string;
  profession?: string;
  session_id?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await apiClient.post('/api/v1/tracking/event', payload);
  return unwrapPayload(res.data);
}

export async function createPortalSession() {
  const res = await apiClient.post('/api/v1/subscription/portal', {});
  return unwrapPayload(res.data);
}
