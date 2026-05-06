import { flagCardIssue, getDeckCards, requestCardCoachHint, skipCard, startCardSession, submitCardAnswer, type CardFilters, type RuntimeCard } from '@core/api/cards';
import { usePreferencesStore } from '../../../state/preferencesStore';
import type { CardBankBuckets, CardDeckScope, CardMode } from '../types';

function currentUiLanguage(): string {
  return usePreferencesStore.getState().language || 'en';
}

function toFilters(mode: CardMode, scope?: CardDeckScope): CardFilters {
  return {
    mode,
    domain: scope?.domain ?? 'general',
    profession: scope?.profession ?? null,
    level: scope?.level ?? null,
    adaptive: scope?.adaptive ?? true,
    source: scope?.source ?? undefined,
    language: currentUiLanguage(),
  };
}

function buildBanks(cards: RuntimeCard[]): CardBankBuckets {
  const learned = cards.filter((card) => card.state === 'mastered');
  const difficult = cards.filter((card) => card.state === 'difficult' || (card.seen_count >= 4 && card.correct_rate <= 0.45));
  const learning = cards.filter((card) => !learned.some((item) => item.id === card.id) && !difficult.some((item) => item.id === card.id));
  return { difficult, learned, learning };
}

export const cardsService = {
  async start(mode: CardMode, scope?: CardDeckScope) { return startCardSession(toFilters(mode, scope)); },
  async answer(sessionId: string, answer: string) { return submitCardAnswer({ sessionId, userAnswer: answer }); },
  async skip(sessionId: string) { return skipCard(sessionId); },
  async banks(mode: CardMode, scope?: CardDeckScope) { const cards = await getDeckCards(toFilters(mode, scope)); return buildBanks(cards); },
  async coachHint(card: RuntimeCard) { return requestCardCoachHint(card); },
  async flag(card: RuntimeCard, mode: CardMode, scope?: CardDeckScope, reason = 'malformed_card', note?: string | null) {
    return flagCardIssue({ cardId: card.id, mode, domain: scope?.domain ?? 'general', profession: scope?.profession ?? null, reason, note });
  },
};
