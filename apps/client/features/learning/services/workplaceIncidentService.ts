import { withFallback } from '@core/api/client';
import { getWorkplaceIncidentLab } from '@core/api/professional';

export type IncidentScenario = {
  id: string;
  title: string;
  profession: string;
  urgency: 'low' | 'medium' | 'high';
  prompt: string;
  bestActionHint: string;
};

const fallbackScenarios: IncidentScenario[] = [
  {
    id: 'wi-1',
    title: 'Patient information mismatch',
    profession: 'Healthcare',
    urgency: 'high',
    prompt: 'You notice a mismatch between the spoken handover and the record. What do you say first in Finnish?',
    bestActionHint: 'Prioritize safety, verify details, and state the discrepancy clearly.',
  },
  {
    id: 'wi-2',
    title: 'Customer escalation at the counter',
    profession: 'Service',
    urgency: 'medium',
    prompt: 'A customer becomes frustrated because of a delay. What is your first calming response?',
    bestActionHint: 'Acknowledge, clarify, and offer the next concrete step.',
  },
];

export async function listWorkplaceIncidents(track = 'office'): Promise<IncidentScenario[]> {
  return withFallback(
    async () => {
      const payload = await getWorkplaceIncidentLab(track);
      return (payload.scenarios ?? []).map((item, index) => ({
        id: `wi-${index + 1}`,
        title: item.title,
        profession: item.track,
        urgency: item.difficulty === 'pressured' ? 'high' : item.difficulty === 'standard' ? 'medium' : 'low',
        prompt: item.situation,
        bestActionHint: item.why,
      }));
    },
    () => fallbackScenarios,
  );
}
