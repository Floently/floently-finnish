import { withFallback } from '@core/api/client';
import { getProfessionalOverview } from '@core/api/professional';

export type WorkPathMission = {
  id: string;
  title: string;
  focus: string;
  status: 'next' | 'active' | 'done';
};

export type WorkFinnishPathSummary = {
  track: string;
  nextMission: string;
  missions: WorkPathMission[];
};

const fallbackSummary: WorkFinnishPathSummary = {
  track: 'Healthcare communication',
  nextMission: 'Practice safe clarification language for handover and escalation situations.',
  missions: [
    { id: 'wp-1', title: 'Polite clarification', focus: 'Ask for missing details without sounding abrupt', status: 'done' },
    { id: 'wp-2', title: 'Safety-first handover', focus: 'Summarize and verify critical information', status: 'active' },
  ],
};

export async function getWorkFinnishPath(): Promise<WorkFinnishPathSummary> {
  return withFallback(
    async () => {
      const payload = await getProfessionalOverview();
      const track = payload.tracks?.[0];
      return {
        track: track?.title ?? fallbackSummary.track,
        nextMission: payload.nextMission ?? fallbackSummary.nextMission,
        missions: (track?.core_tasks ?? []).slice(0, 3).map((task, index) => ({
          id: `wp-${index + 1}`,
          title: task,
          focus: track?.domain ?? 'work track',
          status: index === 0 ? 'active' : 'next',
        })),
      };
    },
    () => fallbackSummary,
  );
}
