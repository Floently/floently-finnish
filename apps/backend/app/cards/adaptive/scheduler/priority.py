from __future__ import annotations

from datetime import datetime, timezone

from app.cards.adaptive.models import AdaptiveReasonCode, AdaptiveSelectionReason, AdaptiveSessionFilters, AdaptiveSessionPlan, CardPerformanceRecord, ReviewQueueSnapshot
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.follow_ups import FollowUpVariantType
from app.cards.schemas.session import CardReviewState


def build_adaptive_plan(
    *,
    user_id: str,
    filters: AdaptiveSessionFilters,
    cards: list[CardEnvelope],
    performance_by_card: dict[str, CardPerformanceRecord],
    review_state_by_card: dict[str, CardReviewState],
    now: datetime | None = None,
) -> AdaptiveSessionPlan:
    current_time = now or datetime.now(timezone.utc)
    ranked_rows: list[tuple[tuple[int, datetime, float, str], str, AdaptiveSelectionReason]] = []
    due_ids: list[str] = []
    new_ids: list[str] = []
    difficult_ids: list[str] = []

    for card in cards:
        performance = performance_by_card[card.id]
        review_state = review_state_by_card[card.id]
        variant_index = performance.total_attempts % len(card.content.follow_ups)
        variant_type = FollowUpVariantType(card.content.follow_ups[variant_index].variant_type)
        due_at = review_state.due_at
        is_new = performance.total_attempts == 0
        is_due = due_at is None or due_at <= current_time
        is_difficult = performance.difficulty_score >= 0.75
        reason_code, reason_message = _build_reason(is_new=is_new, is_due=is_due, is_difficult=is_difficult)
        if is_due:
            due_ids.append(card.id)
        if is_new:
            new_ids.append(card.id)
        if is_difficult:
            difficult_ids.append(card.id)

        due_rank = 0 if is_due else 1
        due_sort_value = due_at or current_time
        sort_key = (due_rank, due_sort_value, -performance.difficulty_score, card.id)
        reason = AdaptiveSelectionReason(
            card_id=card.id,
            reason_code=reason_code,
            reason_message=reason_message,
            due_at=due_at,
            difficulty_score=performance.difficulty_score,
            success_rate=performance.success_rate,
            total_attempts=performance.total_attempts,
            streak=performance.streak,
            variant_index=variant_index,
            variant_type=variant_type,
        )
        ranked_rows.append((sort_key, card.id, reason))

    ranked_rows.sort(key=lambda item: item[0])
    selected_rows = ranked_rows[: filters.limit]
    selected_card_ids = [card_id for _, card_id, _ in selected_rows]
    selected_reasons = [reason for _, _, reason in selected_rows]
    queue_id = _build_queue_id(user_id=user_id, filters=filters)
    queue_snapshot = ReviewQueueSnapshot(
        queue_id=queue_id,
        user_id=user_id,
        created_at=current_time,
        filters=filters,
        selected_card_ids=selected_card_ids,
        due_card_ids=sorted(set(due_ids)),
        new_card_ids=sorted(set(new_ids)),
        difficult_card_ids=sorted(set(difficult_ids)),
        selection_reasons=selected_reasons,
    )
    return AdaptiveSessionPlan(
        queue_snapshot=queue_snapshot,
        ordered_card_ids=selected_card_ids,
        variant_indices={reason.card_id: reason.variant_index for reason in selected_reasons},
        selection_reasons={reason.card_id: reason for reason in selected_reasons},
    )


def _build_reason(*, is_new: bool, is_due: bool, is_difficult: bool) -> tuple[AdaptiveReasonCode, str]:
    if is_new:
        return AdaptiveReasonCode.new_card, "card has not been seen before, so it was included as new work"
    if is_due and is_difficult:
        return AdaptiveReasonCode.difficult_card, "card is due and has a high difficulty score, so it was prioritized early"
    if is_due:
        return AdaptiveReasonCode.due_review, "card is due for review based on its previous scheduling state"
    return AdaptiveReasonCode.scheduled_review, "card is not yet due, but it was selected from the earliest scheduled items"


def _build_queue_id(*, user_id: str, filters: AdaptiveSessionFilters) -> str:
    parts = ["review_queue", user_id, filters.domain.value]
    if filters.content_type is not None:
        parts.append(filters.content_type.value)
    if filters.profession is not None:
        parts.append(filters.profession.value)
    if filters.level_band is not None:
        parts.append(filters.level_band.value.lower())
    return ".".join(parts)

