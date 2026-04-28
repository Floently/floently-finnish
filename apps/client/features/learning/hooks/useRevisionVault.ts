import { useCallback, useEffect, useState } from 'react';
import { getRevisionVault, type RevisionVaultSummary } from '../services/revisionVaultService';

export function useRevisionVault() {
  const [summary, setSummary] = useState<RevisionVaultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getRevisionVault());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load revision vault.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}
