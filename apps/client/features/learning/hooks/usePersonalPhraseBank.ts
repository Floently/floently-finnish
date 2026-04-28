import { useCallback, useEffect, useState } from 'react';
import { listPersonalPhraseBank, savePhrase, type PhraseBankItem } from '../services/personalPhraseBankService';

export function usePersonalPhraseBank() {
  const [items, setItems] = useState<PhraseBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listPersonalPhraseBank());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load phrase bank.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addPhrase = useCallback(async (input: Omit<PhraseBankItem, 'id'>) => {
    const created = await savePhrase(input);
    setItems((current) => [created, ...current]);
    return created;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh, addPhrase };
}
