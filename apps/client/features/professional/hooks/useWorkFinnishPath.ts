import { useCallback, useEffect, useState } from 'react';
import { getWorkFinnishPath, type WorkFinnishPathSummary } from '../services/workFinnishPathService';

export function useWorkFinnishPath() {
  const [summary, setSummary] = useState<WorkFinnishPathSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getWorkFinnishPath());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load work Finnish path.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
