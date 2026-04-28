import { withFallback } from '@core/api/client';
import { getYkiPlanner as fetchYkiPlanner } from '@core/api/learning';

export type PlannerMilestone = {
  id: string;
  title: string;
  week: string;
  status: 'next' | 'active' | 'done';
};

export type YkiPlannerSummary = {
  targetLevel: string;
  nextBestAction: string;
  weeklyFocus: string;
  milestones: PlannerMilestone[];
};

const fallbackSummary: YkiPlannerSummary = {
  targetLevel: 'B1/B2',
  weeklyFocus: 'Listening detail + speaking repair phrases',
  nextBestAction: 'Complete one full listening block, then save 3 reusable phrases into your bank.',
  milestones: [
    { id: 'pl-1', title: 'Diagnostic calibration', week: 'Week 1', status: 'done' },
    { id: 'pl-2', title: 'Weak-skill repair sprint', week: 'Week 2', status: 'active' },
    { id: 'pl-3', title: 'Timed mixed set', week: 'Week 3', status: 'next' },
    { id: 'pl-4', title: 'Mock exam cycle', week: 'Week 4', status: 'next' },
  ],
};

export async function getYkiPlanner(): Promise<YkiPlannerSummary> {
  return withFallback(
    async () => {
      const payload = await fetchYkiPlanner();
      const blocks = payload.focus_blocks ?? [];
      return {
        targetLevel: (payload.readiness?.band ?? 'developing').toUpperCase(),
        weeklyFocus: blocks[0]?.activity ?? fallbackSummary.weeklyFocus,
        nextBestAction: payload.checkpoint_tasks?.[0] ?? fallbackSummary.nextBestAction,
        milestones: blocks.slice(0, 4).map((block, index) => ({
          id: `pl-${index + 1}`,
          title: `${block.section} focus`,
          week: block.day_label,
          status: index === 0 ? 'active' : index === 1 ? 'next' : 'done',
        })),
      };
    },
    () => fallbackSummary,
  );
}
