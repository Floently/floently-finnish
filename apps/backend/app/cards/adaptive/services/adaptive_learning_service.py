from __future__ import annotations

from datetime import datetime, timezone

from app.cards.adaptive.models import AdaptiveAnswerUpdate, AdaptiveSessionFilters, AdaptiveSessionPlan, CardPerformanceRecord
from app.cards.adaptive.performance import create_empty_performance, update_performance_record
from app.cards.adaptive.repetition import create_empty_review_state, update_review_state
from app.cards.adaptive.scheduler import build_adaptive_plan
from app.cards.adaptive.services.state_store import AdaptiveStateStore
from app.cards.observability import increment_metric, log_card_event
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.follow_ups import FollowUpVariantType
from app.cards.schemas.session import CardReviewState


class AdaptiveLearningService:
    def __init__(self, *, state_store: AdaptiveStateStore | None = None):
        self.state_store = state_store or AdaptiveStateStore()

    async def build_session_plan(
        self,
        *,
        user_id: str,
        cards: list[CardEnvelope],
        filters: AdaptiveSessionFilters,
        now: datetime | None = None,
    ) -> AdaptiveSessionPlan:
        user_state = await self.state_store.load_user_state(user_id)
        performance_by_card = {
            card.id: self._resolve_performance(user_id=user_id, card_id=card.id, user_state=user_state)
            for card in cards
        }
        review_state_by_card = {
            card.id: self._resolve_review_state(user_id=user_id, card_id=card.id, user_state=user_state)
            for card in cards
        }
        plan = build_adaptive_plan(
            user_id=user_id,
            filters=filters,
            cards=cards,
            performance_by_card=performance_by_card,
            review_state_by_card=review_state_by_card,
            now=now,
        )
        user_state.latest_review_queue = plan.queue_snapshot
        await self.state_store.save_user_state(user_id, user_state)
        increment_metric("cards.adaptive_queue_build", domain=filters.domain.value)
        log_card_event(
            "cards.adaptive_queue_built",
            user_id=user_id,
            queue_id=plan.queue_snapshot.queue_id,
            selected_count=len(plan.ordered_card_ids),
            due_count=len(plan.queue_snapshot.due_card_ids),
            new_count=len(plan.queue_snapshot.new_card_ids),
            difficult_count=len(plan.queue_snapshot.difficult_card_ids),
        )
        return plan

    async def record_answer(
        self,
        *,
        user_id: str,
        card: CardEnvelope,
        correct: bool,
        variant_index: int,
        variant_type: FollowUpVariantType,
        now: datetime | None = None,
    ) -> AdaptiveAnswerUpdate:
        current_time = now or datetime.now(timezone.utc)
        resolved_variant_type = FollowUpVariantType(variant_type)
        user_state = await self.state_store.load_user_state(user_id)
        performance = self._resolve_performance(user_id=user_id, card_id=card.id, user_state=user_state)
        review_state = self._resolve_review_state(user_id=user_id, card_id=card.id, user_state=user_state)
        performance = update_performance_record(performance, correct=correct, now=current_time)
        weak_area_tags = sorted(set(card.tags[:3])) if (not correct or performance.difficulty_score >= 0.75) else []
        review_state, explanation = update_review_state(
            review_state,
            performance=performance,
            correct=correct,
            variant_type=resolved_variant_type,
            weak_area_tags=weak_area_tags,
            now=current_time,
        )
        self._upsert_performance(user_state, performance)
        self._upsert_review_state(user_state, review_state)
        await self.state_store.save_user_state(user_id, user_state)
        update = AdaptiveAnswerUpdate(
            card_id=card.id,
            total_attempts=performance.total_attempts,
            correct_attempts=performance.correct_attempts,
            incorrect_attempts=performance.incorrect_attempts,
            success_rate=performance.success_rate,
            streak=performance.streak,
            difficulty_score=performance.difficulty_score,
            next_due_at=review_state.due_at,
            interval_days=review_state.interval_days,
            review_status=review_state.status.value,
            last_variant_type=resolved_variant_type,
            explanation=explanation,
        )
        increment_metric("cards.answer_recorded", outcome="correct" if correct else "incorrect")
        log_card_event(
            "cards.answer_adaptive_state_updated",
            user_id=user_id,
            card_id=card.id,
            correct=correct,
            difficulty_score=update.difficulty_score,
            interval_days=update.interval_days,
            next_due_at=update.next_due_at,
            review_status=update.review_status,
        )
        return update

    def _resolve_performance(self, *, user_id: str, card_id: str, user_state) -> CardPerformanceRecord:
        for record in user_state.performance_records:
            if record.card_id == card_id and record.user_id == user_id:
                return record
        return create_empty_performance(card_id=card_id, user_id=user_id)

    def _resolve_review_state(self, *, user_id: str, card_id: str, user_state) -> CardReviewState:
        for record in user_state.review_states:
            if record.card_id == card_id and record.user_id == user_id:
                return record
        return create_empty_review_state(card_id=card_id, user_id=user_id)

    def _upsert_performance(self, user_state, record: CardPerformanceRecord) -> None:
        for index, existing in enumerate(user_state.performance_records):
            if existing.card_id == record.card_id and existing.user_id == record.user_id:
                user_state.performance_records[index] = record
                break
        else:
            user_state.performance_records.append(record)
        user_state.performance_records.sort(key=lambda item: item.card_id)

    def _upsert_review_state(self, user_state, record: CardReviewState) -> None:
        for index, existing in enumerate(user_state.review_states):
            if existing.card_id == record.card_id and existing.user_id == record.user_id:
                user_state.review_states[index] = record
                break
        else:
            user_state.review_states.append(record)
        user_state.review_states.sort(key=lambda item: item.card_id)
