import { useCallback, useEffect, useState } from 'react';
import { listWorkplaceIncidents, type IncidentScenario } from '../services/workplaceIncidentService';

export function useWorkplaceIncident() {
  const [scenarios, setScenarios] = useState<IncidentScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setScenarios(await listWorkplaceIncidents());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load workplace incident lab.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { scenarios, loading, error, refresh };
}
