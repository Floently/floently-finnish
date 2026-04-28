import { getApiBaseUrl } from './apiConfig';

export type SpeakingLabOverview = {
  recordingState: 'ready' | 'recording' | 'processing';
  fluencyScore: number;
  repairLanguageScore: number;
  tasks: string[];
  feedback: string[];
};

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function formatRecordingState(value: SpeakingLabOverview['recordingState']) {
  switch (value) {
    case 'recording':
      return 'Recording';
    case 'processing':
      return 'Processing';
    default:
      return 'Ready';
  }
}

export async function getSpeakingLabOverview(): Promise<SpeakingLabOverview> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/speaking-lab/overview`);
  if (!response.ok) throw new Error(`REQUEST_FAILED_${response.status}`);
  const payload = (await response.json()) as SpeakingLabOverview | { data?: SpeakingLabOverview };
  return ((payload as { data?: SpeakingLabOverview }).data ?? payload) as SpeakingLabOverview;
}
