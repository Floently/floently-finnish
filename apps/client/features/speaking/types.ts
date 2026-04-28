import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';
export type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';

export type SpeakingSurface = 'menu' | 'conversation' | 'recorded';

export type SpeakingTrack = {
  id: RoleplayProfession;
  title: string;
  summary: string;
  scenarios: string[];
  voiceProfile: string;
};

export type TranscriptMessage = {
  id: string;
  speaker: 'assistant' | 'user' | 'system';
  text: string;
  timeLabel?: string;
};

export type RecorderPhase = 'idle' | 'recording' | 'uploading' | 'error';

export const LEVEL_BANDS: RoleplayLevelBand[] = ['A1-A2', 'B1-B2', 'C1-C2'];

export const SPEAKING_TRACKS: SpeakingTrack[] = [
  {
    id: 'general',
    title: 'General Finnish',
    summary: 'Short everyday conversation prompts to build confidence before higher-pressure tasks.',
    scenarios: ['appointment', 'clarification', 'service encounter'],
    voiceProfile: 'yki_standard_female',
  },
  {
    id: 'nurse',
    title: 'Nurse',
    summary: 'Shift handovers, patient updates, symptom questions, and calm repair language.',
    scenarios: ['handover', 'patient_check', 'medication'],
    voiceProfile: 'yki_standard_female',
  },
  {
    id: 'doctor',
    title: 'Doctor',
    summary: 'Patient interviews, diagnosis framing, instructions, and follow-up explanation.',
    scenarios: ['interview', 'explanation', 'follow_up'],
    voiceProfile: 'yki_standard_male',
  },
  {
    id: 'practical_nurse',
    title: 'Practical nurse',
    summary: 'Daily-care updates, mobility support, hygiene routines, and reporting observations.',
    scenarios: ['daily_care', 'mobility', 'reporting'],
    voiceProfile: 'yki_standard_female',
  },
];
