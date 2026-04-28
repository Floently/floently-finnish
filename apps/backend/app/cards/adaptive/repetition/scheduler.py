from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.cards.adaptive.models import CardPerformanceRecord
from app.cards.schemas.common import AnswerOutcome, ReviewStateStatus
from app.cards.schemas.follow_ups import FollowUpVariantType
from app.cards.schemas.session import CardReviewState


def create_empty_review_state(*, card_id: str, user_id: str) -> CardReviewState:
    return CardReviewState(card_id=card_id, user_id=user_id, status=ReviewStateStatus.unseen)


def update_review_state(
    review_state: CardReviewState,
    *,
    performance: CardPerformanceRecord,
    correct: bool,
    variant_type: FollowUpVariantType,
    weak_area_tags: list[str],
    now: datetime | None = None,
) -> tuple[CardReviewState, str]:
    current_time = now or datetime.now(timezone.utc)
    review_state.last_seen_at = current_time
    review_state.last_answered_at = current_time
    review_state.last_variant_type = variant_type
    review_state.last_outcome = AnswerOutcome.correct if correct else AnswerOutcome.incorrect
    review_state.streak = performance.streak
    review_state.ease_score = round(max(1.0, min(5.0, 5.0 - (performance.difficulty_score * 4.0))), 2)
    if correct:
        review_state.interval_days = _compute_correct_interval_days(performance)
        review_state.due_at = current_time + timedelta(days=review_state.interval_days)
        if performance.streak >= 5 and performance.difficulty_score <= 0.2:
            review_state.status = ReviewStateStatus.mastered
            explanation = "card answered correctly with a strong streak, so it was scheduled into a long review interval"
        elif performance.total_attempts >= 2:
            review_state.status = ReviewStateStatus.review
            explanation = "card answered correctly, so it moved into review with a longer interval"
        else:
            review_state.status = ReviewStateStatus.learning
            explanation = "card answered correctly for the first rounds, so it stays in learning with a short interval"
    else:
        review_state.error_count += 1
        review_state.interval_days = 0
        review_state.due_at = current_time + timedelta(hours=_compute_incorrect_hours(performance))
        review_state.status = ReviewStateStatus.learning
        explanation = "card answered incorrectly, so it was moved earlier in the review queue"
    review_state.weak_area_tags = list(weak_area_tags)
    return review_state, explanation


def _compute_correct_interval_days(performance: CardPerformanceRecord) -> int:
    difficulty = performance.difficulty_score
    if difficulty >= 0.8:
        base_days = 1
    elif difficulty >= 0.6:
        base_days = 2
    elif difficulty >= 0.35:
        base_days = 4
    else:
        base_days = 7
    multiplier = 1.0 + (min(performance.streak, 5) * 0.5)
    return max(1, int(round(base_days * multiplier)))


def _compute_incorrect_hours(performance: CardPerformanceRecord) -> int:
    difficulty = performance.difficulty_score
    if difficulty >= 0.8:
        return 4
    if difficulty >= 0.6:
        return 8
    if difficulty >= 0.35:
        return 12
    return 18

