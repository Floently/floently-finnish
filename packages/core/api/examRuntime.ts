import { apiClient } from './client';

type ExamSessionResponse = {
  sessionId: string;
  level: string;
  section: string;
  tasks: unknown[];
  elapsedSeconds: number;
};

export async function startExamSession(level: string): Promise<ExamSessionResponse | undefined> {
  const res = await apiClient.post<ExamSessionResponse>('/yki/exam/start', { level });
  return res.data;
}

export async function getExamSession(sessionId: string): Promise<ExamSessionResponse | undefined> {
  const res = await apiClient.get<ExamSessionResponse>(`/yki/exam/${sessionId}`);
  return res.data;
}

export async function submitExamAnswer(sessionId: string, payload: unknown): Promise<ExamSessionResponse | undefined> {
  const res = await apiClient.post<ExamSessionResponse>(`/yki/exam/${sessionId}/answer`, payload);
  return res.data;
}

export async function submitExam(sessionId: string): Promise<unknown> {
  const res = await apiClient.post<unknown>(`/yki/exam/${sessionId}/submit`, {});
  return res.data;
}
