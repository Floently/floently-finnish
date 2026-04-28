import { useCallback, useEffect, useState } from 'react';
import { getMockExamCycle, type MockExamCycleSummary } from '../services/mockExamCycleService';

export function useMockExamCycle() {
  const [summary, setSummary] = useState<MockExamCycleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getMockExamCycle());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load mock exam cycle.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
