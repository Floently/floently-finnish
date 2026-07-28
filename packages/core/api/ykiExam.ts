import { getData, postData } from './client';

export type PressureBand = 'low' | 'rising' | 'high' | 'exam_simulation';
export type YkiLevelBand = 'A1-A2' | 'B1-B2' | 'C1-C2';

export type MockSegment = {
  week_index: number;
  focus: string;
  pressure_band: PressureBand;
  timed_minutes: number;
  section_mix: string[];
  checkpoint: string;
  why: string;
};

export type MockExamCycleState = {
  target_level: string;
  overall_pressure: PressureBand;
  readiness_score: number;
  weak_sections: string[];
  strong_sections: string[];
  segments: MockSegment[];
  coaching_notes: string[];
};

export type YkiExamOverview = {
  level_band: string;
  display_level_band: string;
  bank_kind: string;
  total_tasks: number;
  certified_total: number;
  sections: Array<{ key: string; title: string; task_count: number; recommended_minutes: number }>;
  task_types: Record<string, number>;
  material_authority: string;
  pool_sections: string[];
  exam_identity: { kind: string; why: string };
};

export type StartedExamSession = {
  session_id?: string;
  id?: string;
  runtime?: {
    session_id?: string;
    id?: string;
    [key: string]: unknown;
  } | null;
};

export function resolveStartedYkiSessionId(
  data: StartedExamSession,
): string | null {
  const candidate =
    data.session_id
    ?? data.id
    ?? data.runtime?.session_id
    ?? data.runtime?.id
    ?? null;

  return (
    typeof candidate === 'string'
    && candidate.trim()
      ? candidate.trim()
      : null
  );
}

export type YkiExamAnswerPayload = {
  task_id?: string;
  taskId?: string;
  item_id?: string | null;
  itemId?: string | null;
  answer?: unknown;
  value?: unknown;
};

export type SubmitYkiExamPayload = {
  confirm_incomplete?: boolean;
};

export type YkiEvaluationCriterion = {
  name: string;
  score: number;
  rationale: string;
  evidence: string[];
};

export type YkiEvaluationSection = {
  status: 'assessed' | 'limited' | 'insufficient_evidence';
  estimatedLevel: string;
  scoreAvailable: boolean;
  score: number;
  summary: string;
  evidence: string[];
  criteria: YkiEvaluationCriterion[];
  improvements: string[];
};

export type YkiEvaluationReport = {
  reportVersion: string;
  evaluationKind: 'yki_practice';
  status: 'ready' | 'fallback';
  provider: 'openai' | 'deterministic_fallback';
  model?: string | null;
  promptVersion: string;
  rubricVersion: string;
  disclaimer: string;
  officialResult: false;
  pronunciationAssessed: false;
  audioEvidenceAvailable: boolean;
  overallEstimatedLevel: string;
  confidence: number;
  overallSummary: string;
  sections: Record<
    'reading' | 'listening' | 'writing' | 'speaking',
    YkiEvaluationSection
  >;
  strengths: string[];
  improvements: string[];
  actionPlan: string[];
  objectiveScores: Record<
    'reading' | 'listening',
    {
      score: number | null;
      maximum: number | null;
      percentage: number | null;
    }
  >;
};

export type SubmitYkiExamResult = {
  status?: string;
  score?: Record<string, number | null>;
  total_score?: number;
  cefr_level?: string;
  level_estimate?: string;
  feedback?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  evaluation?: YkiEvaluationReport;
  evaluationReport?: YkiEvaluationReport;
  disclaimer?: string;
};

function normalizeLevelBand(value: YkiLevelBand | string) {
  return value.trim().toUpperCase().replace(/-/g, '_');
}

function normalizeAnswerPayload(payload: YkiExamAnswerPayload) {
  const taskId = payload.task_id ?? payload.taskId;
  if (!taskId) {
    throw new Error('YKI_ANSWER_TASK_ID_REQUIRED');
  }
  return {
    task_id: taskId,
    item_id: payload.item_id ?? payload.itemId ?? null,
    answer: payload.answer ?? payload.value ?? null,
  };
}

export async function getMockExamCycle(levelBand: YkiLevelBand | string = 'B1-B2'): Promise<MockExamCycleState> {
  const query = new URLSearchParams({ level_band: String(levelBand) });
  return getData(`/api/v1/yki-exam/mock-cycle?${query.toString()}`);
}

export async function getYkiExamOverview(levelBand: YkiLevelBand | string = 'B1-B2'): Promise<YkiExamOverview> {
  const query = new URLSearchParams({ level_band: String(levelBand) });
  return getData(`/api/v1/yki-exam/overview?${query.toString()}`);
}

export async function startYkiExamSession(levelBand: YkiLevelBand | string = 'B1-B2'): Promise<StartedExamSession> {
  return postData('/api/v1/yki/sessions', { level_band: normalizeLevelBand(levelBand) });
}

export async function getYkiExamSession<T = { runtime?: unknown }>(sessionId: string): Promise<T> {
  return getData(`/api/v1/yki/sessions/${encodeURIComponent(sessionId)}`);
}

export async function submitYkiExamAnswer<T = unknown>(sessionId: string, payload: YkiExamAnswerPayload): Promise<T> {
  return postData(`/api/v1/yki/sessions/${encodeURIComponent(sessionId)}/answers`, normalizeAnswerPayload(payload));
}

export async function submitYkiExamSession<T = unknown>(sessionId: string, payload: SubmitYkiExamPayload = {}): Promise<T> {
  return postData(`/api/v1/yki/sessions/${encodeURIComponent(sessionId)}/submit`, {
    confirm_incomplete: payload.confirm_incomplete ?? false,
  });
}

export async function submitYkiExamWriting<T = unknown>(
  sessionId: string,
  payload: {
    taskId: string;
    text: string;
  },
): Promise<T> {
  return postData(
    `/api/v1/yki/sessions/${encodeURIComponent(sessionId)}/writing`,
    {
      task_id: payload.taskId,
      text: payload.text,
    },
  );
}

export async function submitYkiExamSpeaking<T = unknown>(
  sessionId: string,
  payload: {
    itemId: string;
    audioRef: string;
    durationSec: number;
  },
): Promise<T> {
  return postData(
    `/api/v1/yki/sessions/${encodeURIComponent(sessionId)}/speaking`,
    {
      item_id: payload.itemId,
      audio_ref: payload.audioRef,
      duration_sec: payload.durationSec,
    },
  );
}

export function pressureLabel(value: PressureBand) {
  switch (value) {
    case 'exam_simulation':
      return 'Exam simulation';
    case 'high':
      return 'High pressure';
    case 'rising':
      return 'Rising pressure';
    default:
      return 'Low pressure';
  }
}
