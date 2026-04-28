from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass

from app.cards.adaptive.models import CardPerformanceRecord
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.content import GrammarCardContent, SentenceCardContent, VocabularyCardContent
from app.cards.schemas.common import DifficultyBand, ReviewStateStatus
from app.cards.schemas.session import CardReviewState


_DIFFICULTY_RANK = {
    DifficultyBand.intro: 0,
    DifficultyBand.core: 1,
    DifficultyBand.stretch: 2,
}


@dataclass(frozen=True)
class SelectionContext:
    session_id: str
    user_id: str
    answered_count: int
    recent_card_ids: list[str]


class CardSelector:
    def __init__(self, *, recent_window: int = 10):
        self.recent_window = max(1, recent_window)

    def get_next(
        self,
        *,
        cards: list[CardEnvelope],
        performance_by_card: dict[str, CardPerformanceRecord],
        review_state_by_card: dict[str, CardReviewState],
        context: SelectionContext,
    ) -> CardEnvelope:
        if not cards:
            raise ValueError("Card selector requires at least one candidate")

        difficulty_cap = self._difficulty_cap(context.answered_count)
        ranked = sorted(
            cards,
            key=lambda card: (
                _DIFFICULTY_RANK.get(card.difficulty, 2),
                _content_complexity(card),
                card.id,
            ),
        )
        easy_pool = [card for card in ranked if _DIFFICULTY_RANK.get(card.difficulty, 2) <= difficulty_cap]
        if not easy_pool:
            easy_pool = ranked

        recent_ids = context.recent_card_ids[-self.recent_window :]
        non_recent = _remove_recent(easy_pool, recent_ids=recent_ids)
        if non_recent:
            candidate_pool = non_recent
        else:
            widened_non_recent = _remove_recent(ranked, recent_ids=recent_ids)
            candidate_pool = widened_non_recent or easy_pool

        rng = random.Random(self._seed(context))
        if context.answered_count == 0 and candidate_pool:
            return candidate_pool[0]

        # Keep selection stochastic but deterministic for a given session step.
        shortlist = sorted(
            candidate_pool,
            key=lambda card: self._priority(card, performance_by_card.get(card.id), review_state_by_card.get(card.id)),
            reverse=True,
        )[:20]
        if not shortlist:
            shortlist = candidate_pool
        weights = [
            self._weight(card, performance_by_card.get(card.id), review_state_by_card.get(card.id))
            for card in shortlist
        ]
        return rng.choices(shortlist, weights=weights, k=1)[0]

    @staticmethod
    def _difficulty_cap(answered_count: int) -> int:
        if answered_count < 6:
            return 0
        if answered_count < 15:
            return 1
        return 2

    @staticmethod
    def _priority(
        card: CardEnvelope,
        performance: CardPerformanceRecord | None,
        review_state: CardReviewState | None,
    ) -> float:
        return CardSelector._weight(card, performance, review_state)

    @staticmethod
    def _weight(
        card: CardEnvelope,
        performance: CardPerformanceRecord | None,
        review_state: CardReviewState | None,
    ) -> float:
        attempts = performance.total_attempts if performance else 0
        success_rate = performance.success_rate if performance else 0.0
        difficulty_score = performance.difficulty_score if performance else 0.45

        review_bonus = 1.0
        if review_state is None or review_state.status == ReviewStateStatus.unseen:
            review_bonus = 1.1
        elif review_state.status in {ReviewStateStatus.learning, ReviewStateStatus.review}:
            review_bonus = 1.35
        elif review_state.status == ReviewStateStatus.mastered:
            review_bonus = 0.45

        difficulty_bonus = 1.25 - (_DIFFICULTY_RANK.get(card.difficulty, 2) * 0.2)
        struggle_bonus = 1.0 + (1.0 - success_rate) * 0.9
        exposure_penalty = 1.0 / (1.0 + (attempts * 0.2))
        adaptive_bonus = 0.8 + difficulty_score
        simplicity_bonus = 1.2 - min(0.35, _content_complexity(card) * 0.12)
        return max(
            0.01,
            review_bonus * difficulty_bonus * struggle_bonus * exposure_penalty * adaptive_bonus * simplicity_bonus,
        )

    @staticmethod
    def _seed(context: SelectionContext) -> int:
        payload = f"{context.session_id}:{context.user_id}:{context.answered_count}:{','.join(context.recent_card_ids[-10:])}"
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return int(digest[:16], 16)


def _remove_recent(cards: list[CardEnvelope], *, recent_ids: list[str]) -> list[CardEnvelope]:
    recent = set(recent_ids)
    return [card for card in cards if card.id not in recent]


def _content_complexity(card: CardEnvelope) -> float:
    content = card.content
    if isinstance(content, VocabularyCardContent):
        text = content.front.term
    elif isinstance(content, SentenceCardContent):
        text = content.front.sentence
    elif isinstance(content, GrammarCardContent):
        text = content.front.example
    else:
        return 1.0

    normalized = " ".join(str(text or "").split()).strip()
    if not normalized:
        return 1.0
    token_count = len(normalized.split())
    char_count = len(normalized)
    return (min(token_count, 30) / 30.0) + (min(char_count, 240) / 240.0)
