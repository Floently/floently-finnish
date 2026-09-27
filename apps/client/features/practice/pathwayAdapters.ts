import type { LearningPathway, PracticeScope } from '@core/schemas/learning';

import type { PracticeTargetMinutes } from './composer';

export type PracticeEntrySource =
  | 'practice-hub'
  | 'daily-everyday'
  | 'daily-professional'
  | 'daily-yki';

export type PracticeEntryPreset = {
  source: PracticeEntrySource;
  scope: PracticeScope;
  targetMinutes: PracticeTargetMinutes;
};

const DEFAULT_DAILY_MINUTES: PracticeTargetMinutes = 10;

/**
 * Safe local entry presets for integration-owned navigation surfaces.
 *
 * Ten minutes is a product default, not a claim that ten minutes is an
 * empirically optimal learning duration. Users remain able to choose 5/10/20.
 */
export function getPracticeEntryPreset(source: PracticeEntrySource): PracticeEntryPreset {
  switch (source) {
    case 'daily-everyday':
      return { source, scope: 'everyday', targetMinutes: DEFAULT_DAILY_MINUTES };
    case 'daily-professional':
      return { source, scope: 'professional', targetMinutes: DEFAULT_DAILY_MINUTES };
    case 'daily-yki':
      return { source, scope: 'yki', targetMinutes: DEFAULT_DAILY_MINUTES };
    case 'practice-hub':
      return { source, scope: 'all', targetMinutes: DEFAULT_DAILY_MINUTES };
  }
}

export function getPathwayDailyPracticePreset(pathway: LearningPathway): PracticeEntryPreset {
  if (pathway === 'professional') return getPracticeEntryPreset('daily-professional');
  if (pathway === 'yki') return getPracticeEntryPreset('daily-yki');
  return getPracticeEntryPreset('daily-everyday');
}
