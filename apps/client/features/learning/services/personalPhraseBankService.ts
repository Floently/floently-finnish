import { withFallback } from '@core/api/client';
import { getPhraseBank, savePhraseToBank } from '@core/api/learning';

export type PhraseBankItem = {
  id: string;
  phrase: string;
  translation: string;
  context: string;
  tags: string[];
  strength: 'new' | 'learning' | 'ready';
  source: 'mistake' | 'successful_output' | 'saved';
  nextReviewLabel: string;
};

const fallbackItems: PhraseBankItem[] = [
  {
    id: 'pb-1',
    phrase: 'Voisitko tarkentaa vielä hieman?',
    translation: 'Could you clarify a little more?',
    context: 'Clarifying politely in spoken Finnish',
    tags: ['politeness', 'speaking'],
    strength: 'learning',
    source: 'saved',
    nextReviewLabel: 'Due today',
  },
];

function mapStatus(value: string): PhraseBankItem['strength'] {
  if (value === 'ready') return 'ready';
  if (value === 'practising') return 'learning';
  return 'new';
}

export async function listPersonalPhraseBank(): Promise<PhraseBankItem[]> {
  return withFallback(
    async () => {
      const payload = await getPhraseBank();
      return (payload.active_phrases ?? []).map((item, index) => ({
        id: `pb-${index + 1}`,
        phrase: item.phrase,
        translation: item.meaning,
        context: item.context,
        tags: [item.category],
        strength: mapStatus(item.status),
        source: 'saved',
        nextReviewLabel: item.status === 'ready' ? 'Ready' : 'Review soon',
      }));
    },
    () => fallbackItems,
  );
}

export async function savePhrase(input: Omit<PhraseBankItem, 'id'>): Promise<PhraseBankItem> {
  return withFallback(
    async () => {
      await savePhraseToBank({ finnish: input.phrase, english: input.translation, context: input.context, tags: input.tags });
      return { ...input, id: `saved-${Date.now()}` };
    },
    () => ({ ...input, id: `local-${Date.now()}` }),
  );
}
