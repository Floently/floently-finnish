import { useCallback, useEffect, useState } from 'react';
import { examRuntimeApi } from '../services/examRuntimeApi';
import { saveRuntimeSession, loadRuntimeSession } from '../state/runtimeSessionPersistence';
import type { ExamSession } from '../schema/runtimeExamSchema';

export function useExamSession(level = 'B1') {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);

  const start = useCallback(async () => {
    setLoading(true);
    const next = await examRuntimeApi.startExamSession(level);
    setSession((next as ExamSession | null) ?? null);
    await saveRuntimeSession(next);
    setLoading(false);
  }, [level]);

  useEffect(() => {
    void (async () => {
      const persisted = await loadRuntimeSession<ExamSession>();
      if (persisted) setSession(persisted);
      setLoading(false);
    })();
  }, []);

  const answer = useCallback(async (taskId: string, answerValue: unknown) => {
    if (!session) return null;
    const updated = await examRuntimeApi.submitExamAnswer(session.sessionId, { taskId, answer: answerValue });
    setSession((updated as ExamSession | null) ?? null);
    await saveRuntimeSession(updated);
    return updated;
  }, [session]);

  return { session, loading, start, answer };
}
