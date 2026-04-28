import { withFallback } from '@core/api/client';
import { getRevisionVault as fetchRevisionVault } from '@core/api/learning';

export type RevisionVaultBucket = {
  label: string;
  count: number;
  focus: string;
};

export type RevisionVaultSummary = {
  dueNow: number;
  protectedItems: number;
  buckets: RevisionVaultBucket[];
  nextAction: string;
};

const fallbackSummary: RevisionVaultSummary = {
  dueNow: 19,
  protectedItems: 42,
  nextAction: 'Start with the due-now set, then review one protected phrase cluster to strengthen transfer.',
  buckets: [
    { label: 'Due now', count: 19, focus: 'High forgetting risk' },
    { label: 'Protected phrases', count: 12, focus: 'Keep fluent chunks active' },
  ],
};

export async function getRevisionVault(): Promise<RevisionVaultSummary> {
  return withFallback(
    async () => {
      const payload = await fetchRevisionVault();
      const buckets = ['urgent', 'soon', 'light'].map((bucket) => ({
        label: bucket === 'urgent' ? 'Due now' : bucket === 'soon' ? 'Soon' : 'Light',
        count: (payload.queue ?? []).filter((item) => item.bucket === bucket).length,
        focus: payload.principles?.[0] ?? fallbackSummary.buckets[0].focus,
      }));
      return {
        dueNow: buckets[0].count,
        protectedItems: (payload.queue ?? []).length,
        buckets,
        nextAction: payload.principles?.[1] ?? fallbackSummary.nextAction,
      };
    },
    () => fallbackSummary,
  );
}
