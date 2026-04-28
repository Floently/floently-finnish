import { useCallback, useEffect, useState } from 'react';
import { getYkiPlanner, type YkiPlannerSummary } from '../services/ykiPlannerService';

export function useYkiPlanner() {
  const [summary, setSummary] = useState<YkiPlannerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getYkiPlanner());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load YKI planner.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
