import { withFallback } from '@core/api/client';
import { getMockExamCycle as fetchMockExamCycle } from '@core/api/ykiExam';

export type MockExamCycleSummary = {
  pressureLevel: 'build' | 'steady' | 'full';
  nextMockDate: string;
  completionRate: number;
  weakestArea: string;
  nextAction: string;
};

const fallbackSummary: MockExamCycleSummary = {
  pressureLevel: 'build',
  nextMockDate: 'This weekend',
  completionRate: 63,
  weakestArea: 'Listening detail under time pressure',
  nextAction: 'Run a short timed listening set before the next full mock to reduce cognitive overload.',
};

function mapPressure(value: string): MockExamCycleSummary['pressureLevel'] {
  if (value === 'exam_simulation' || value === 'high') return 'full';
  if (value === 'rising') return 'steady';
  return 'build';
}

export async function getMockExamCycle(): Promise<MockExamCycleSummary> {
  return withFallback(
    async () => {
      const cycle = await fetchMockExamCycle();
      return {
        pressureLevel: mapPressure(cycle.overall_pressure),
        nextMockDate: cycle.segments?.[0]?.checkpoint ?? fallbackSummary.nextMockDate,
        completionRate: cycle.readiness_score,
        weakestArea: cycle.weak_sections?.[0] ?? fallbackSummary.weakestArea,
        nextAction: cycle.coaching_notes?.[0] ?? fallbackSummary.nextAction,
      };
    },
    () => fallbackSummary,
  );
}
