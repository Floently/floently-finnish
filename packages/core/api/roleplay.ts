import { apiClient } from './client';

export type RoleplayProfession = 'general' | 'nurse' | 'doctor' | 'practical_nurse';
export type RoleplayLevelBand = 'A1-A2' | 'B1-B2' | 'C1-C2';
export type RoleplayTrack = 'general' | 'professional';

export type RoleplayScenarioSummary = {
  id: string;
  title: string;
  prompt: string;
  keyPhrases: string[];
  grammarTip: string;
  levelBand: RoleplayLevelBand;
  profession: RoleplayProfession;
  track: RoleplayTrack;
  personaName?: string;
  personaId?: string;
  personaGender?: 'male' | 'female';
  interviewMode?: boolean;
};

export type RoleplaySessionStart = {
  sessionId: string;
  profession: RoleplayProfession;
  levelBand: RoleplayLevelBand;
  track: RoleplayTrack;
  scenario: RoleplayScenarioSummary;
  introText: string;
  openingText: string;
  voiceProfile: string;
  personaName: string;
  personaId?: string;
  personaGender?: 'male' | 'female';
  maxUserTurns: number;
};

export type RoleplayTurnResponse = {
  sessionId: string;
  completed: boolean;
  currentUserTurn: number;
  aiText: string;
  personaName: string;
  personaId?: string;
  personaGender?: 'male' | 'female';
  voiceProfile: string;
  feedbackLine?: string;
  missingPhrases?: string[];
  score?: {
    coverage: number;
    clarity: number;
    repairLanguage: number;
    structure: number;
    wordCount: number;
    total: number;
  };
};

export type RoleplayFinishResponse = {
  sessionId: string;
  completed: boolean;
  personaName: string;
  personaId?: string;
  personaGender?: 'male' | 'female';
  track: RoleplayTrack;
  trackLabel: string;
  levelBand: string;
  scenario: RoleplayScenarioSummary;
  summary: string;
  scores: {
    avgPhrasesCoverage: number;
    avgWordCount: number;
    repairLanguageUsed: boolean;
    totalTurns: number;
  };
  transcriptAnnotated: Array<{
    speaker: string;
    text: string;
    comment: string | null;
  }>;
  strongPhrases: string[];
  difficultPhrases: string[];
  grammarObservations: string[];
  nextSteps: string[];
  nextAction: string;
};

export async function listRoleplayScenarios(
  profession: RoleplayProfession,
  levelBand: RoleplayLevelBand,
): Promise<RoleplayScenarioSummary[]> {
  const res = await apiClient.get<{ scenarios: RoleplayScenarioSummary[] }>(
    `/api/v1/roleplay/scenarios?profession=${encodeURIComponent(profession)}&level_band=${encodeURIComponent(levelBand)}`,
  );
  return res.data?.scenarios ?? [];
}

export async function startRoleplaySession(payload: {
  profession: RoleplayProfession;
  levelBand: RoleplayLevelBand;
  scenarioId?: string | null;
  contextLabel?: string | null;
}): Promise<RoleplaySessionStart> {
  const res = await apiClient.post<RoleplaySessionStart>('/api/v1/roleplay/session/start', {
    profession: payload.profession,
    level_band: payload.levelBand,
    scenario_id: payload.scenarioId ?? null,
    context_label: payload.contextLabel ?? null,
  });
  if (!res.ok || !res.data) throw new Error(res.error ?? 'ROLEPLAY_START_FAILED');
  return res.data;
}

export async function submitRoleplayTurn(payload: {
  sessionId: string;
  transcript: string;
}): Promise<RoleplayTurnResponse> {
  const res = await apiClient.post<RoleplayTurnResponse>(
    `/api/v1/roleplay/session/${encodeURIComponent(payload.sessionId)}/turn`,
    { transcript: payload.transcript },
  );
  if (!res.ok || !res.data) throw new Error(res.error ?? 'ROLEPLAY_TURN_FAILED');
  return res.data;
}

export async function finishRoleplaySession(sessionId: string): Promise<RoleplayFinishResponse> {
  const res = await apiClient.post<RoleplayFinishResponse>(
    `/api/v1/roleplay/session/${encodeURIComponent(sessionId)}/finish`,
    {},
  );
  if (!res.ok || !res.data) throw new Error(res.error ?? 'ROLEPLAY_FINISH_FAILED');
  return res.data;
}
