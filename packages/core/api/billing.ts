import { apiClient } from './client';
import { normalizeSubscriptionStatus, type SubscriptionStatus } from './entitlements';

function unwrapPayload<T = unknown>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in (value as Record<string, unknown>)) {
    return ((value as { data: T }).data) ?? (value as T);
  }
  return value as T;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await apiClient.get('/api/v1/subscription/status');
  return normalizeSubscriptionStatus(res.data);
}

export async function getSubscriptionPlans() {
  const res = await apiClient.get('/api/v1/subscription/plans');
  return unwrapPayload(res.data);
}

export async function createCheckoutSession(plan: string) {
  const res = await apiClient.post('/api/v1/subscription/checkout', { plan });
  return unwrapPayload(res.data);
}

export async function startSubscriptionTrial(trialDays = 3) {
  const res = await apiClient.post('/api/v1/subscription/trial', { trial_days: trialDays });
  return unwrapPayload(res.data);
}

export async function createPortalSession() {
  const res = await apiClient.post('/api/v1/subscription/portal', {});
  return unwrapPayload(res.data);
}
