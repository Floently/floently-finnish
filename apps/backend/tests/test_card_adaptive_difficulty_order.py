from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone

from app.cards.adaptive.models import AdaptiveSessionFilters
from app.cards.adaptive.performance import create_empty_performance
from app.cards.adaptive.repetition import create_empty_review_state
from app.cards.adaptive.scheduler import build_adaptive_plan
from app.cards.fixtures.sample_payloads import VOCABULARY_CARD_PAYLOAD
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.common import CardContentType, DifficultyBand, LearningPath, LevelBand, ReviewStateStatus


def _card(card_id: str, difficulty: DifficultyBand) -> CardEnvelope:
    payload = deepcopy(VOCABULARY_CARD_PAYLOAD)
    payload["id"] = card_id
    payload["difficulty"] = difficulty.value
    return CardEnvelope.model_validate(payload)


def _maps(cards: list[CardEnvelope], user_id: str):
    performance = {
        card.id: create_empty_performance(card_id=card.id, user_id=user_id)
        for card in cards
    }
    review = {
        card.id: create_empty_review_state(card_id=card.id, user_id=user_id)
        for card in cards
    }
    return performance, review


def _filters(limit: int = 10) -> AdaptiveSessionFilters:
    return AdaptiveSessionFilters(
        domain=LearningPath.general,
        content_type=CardContentType.vocabulary_card,
        level_band=LevelBand.a1_a2,
        limit=limit,
    )


def test_new_cards_follow_authored_intro_core_stretch_order() -> None:
    user_id = "user.card-level.001"
    now = datetime(2026, 9, 27, 10, 0, tzinfo=timezone.utc)
    cards = [
        _card("card.vocab.zzz.stretch", DifficultyBand.stretch),
        _card("card.vocab.aaa.core", DifficultyBand.core),
        _card("card.vocab.mmm.intro", DifficultyBand.intro),
    ]
    performance, review = _maps(cards, user_id)

    plan = build_adaptive_plan(
        user_id=user_id,
        filters=_filters(limit=3),
        cards=cards,
        performance_by_card=performance,
        review_state_by_card=review,
        now=now,
    )

    assert plan.ordered_card_ids == [
        "card.vocab.mmm.intro",
        "card.vocab.aaa.core",
        "card.vocab.zzz.stretch",
    ]


def test_due_review_priority_is_preserved_ahead_of_new_intro_card() -> None:
    user_id = "user.card-level.002"
    now = datetime(2026, 9, 27, 10, 0, tzinfo=timezone.utc)
    intro = _card("card.vocab.intro.new", DifficultyBand.intro)
    stretch = _card("card.vocab.stretch.due", DifficultyBand.stretch)
    cards = [intro, stretch]
    performance, review = _maps(cards, user_id)

    performance[stretch.id].total_attempts = 4
    performance[stretch.id].incorrect_attempts = 3
    performance[stretch.id].success_rate = 0.25
    performance[stretch.id].difficulty_score = 0.9
    review[stretch.id].status = ReviewStateStatus.review
    review[stretch.id].due_at = now - timedelta(days=1)

    plan = build_adaptive_plan(
        user_id=user_id,
        filters=_filters(limit=2),
        cards=cards,
        performance_by_card=performance,
        review_state_by_card=review,
        now=now,
    )

    assert plan.ordered_card_ids[0] == stretch.id
    assert plan.ordered_card_ids[1] == intro.id
