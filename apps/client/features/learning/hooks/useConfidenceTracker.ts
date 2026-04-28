import { useCallback, useEffect, useState } from 'react';
import { getConfidenceTracker, type ConfidenceTrackerSummary } from '../services/confidenceTrackerService';

export function useConfidenceTracker() {
  const [summary, setSummary] = useState<ConfidenceTrackerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getConfidenceTracker());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load confidence tracker.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
