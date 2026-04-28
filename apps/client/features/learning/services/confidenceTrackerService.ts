import { withFallback } from '@core/api/client';
import { getConfidenceTracker as fetchConfidenceTracker } from '@core/api/learning';

export type ConfidenceEntry = {
  id: string;
  skill: string;
  confidence: number;
  accuracy: number;
  note: string;
};

export type ConfidenceTrackerSummary = {
  calibrationScore: number;
  overconfidenceRate: number;
  underconfidenceRate: number;
  entries: ConfidenceEntry[];
  nextAction: string;
};

const fallbackSummary: ConfidenceTrackerSummary = {
  calibrationScore: 74,
  overconfidenceRate: 18,
  underconfidenceRate: 11,
  nextAction: 'Add a brief confidence check before longer speaking tasks to reduce hesitation loops.',
  entries: [
    { id: 'ct-1', skill: 'Listening details', confidence: 80, accuracy: 62, note: 'Slow down before committing to the first option.' },
    { id: 'ct-2', skill: 'Speaking repair', confidence: 55, accuracy: 78, note: 'You perform better than you predict. Keep retrying.' },
    { id: 'ct-3', skill: 'Grammar endings', confidence: 72, accuracy: 70, note: 'Good calibration. Keep current review rhythm.' },
  ],
};

export async function getConfidenceTracker(): Promise<ConfidenceTrackerSummary> {
  return withFallback(
    async () => {
      const payload = await fetchConfidenceTracker();
      const entries = (payload.insights ?? []).map((item, index) => ({
        id: `ct-${index + 1}`,
        skill: item.area,
        confidence: item.confidence_score,
        accuracy: item.knowledge_score,
        note: item.action,
      }));
      return {
        calibrationScore: entries.length ? Math.round(entries.reduce((sum, item) => sum + Math.abs(item.accuracy - item.confidence), 0) / entries.length) : fallbackSummary.calibrationScore,
        overconfidenceRate: entries.filter((item) => item.confidence > item.accuracy).length * 10,
        underconfidenceRate: entries.filter((item) => item.accuracy > item.confidence).length * 10,
        entries,
        nextAction: payload.notes?.[0] ?? fallbackSummary.nextAction,
      };
    },
    () => fallbackSummary,
  );
}
