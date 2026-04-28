from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable
from uuid import uuid4

from app.cards.adaptive.models import AdaptiveSelectionReason
from app.cards.runtime.models.session_state import RuntimeSessionRecord, SessionAnswerRecord
from app.cards.schemas.common import AnswerOutcome, CollectionKind, SessionStatus
from app.cards.schemas.follow_ups import EvaluationMode, FollowUpVariantType
from app.cards.schemas.session import CardSession, ServedVariantRecord, SessionTarget


class CardSessionEngineError(RuntimeError):
    """Raised when a session operation cannot be completed safely."""


class CardSessionEngine:
    def create_session(
        self,
        *,
        user_id: str,
        target_id: str,
        card_ids: Iterable[str],
        initial_variant_type: FollowUpVariantType,
        initial_variant_index: int = 0,
        variant_indices: dict[str, int] | None = None,
        selection_reasons: dict[str, AdaptiveSelectionReason] | None = None,
        adaptive_session: bool = False,
    ) -> RuntimeSessionRecord:
        ordered_card_ids = list(card_ids)
        if not ordered_card_ids:
            raise CardSessionEngineError("Cannot create a session without cards")
        now = datetime.now(timezone.utc)
        session = CardSession(
            session_id=f"session.cards.{uuid4().hex}",
            user_id=user_id,
            target=SessionTarget(kind=CollectionKind.review_queue, target_id=target_id, target_version=1),
            selected_card_ids=ordered_card_ids,
            current_card_index=0,
            status=SessionStatus.active,
            served_variant_history=[
                ServedVariantRecord(
                    card_id=ordered_card_ids[0],
                    variant_type=initial_variant_type,
                    sequence_index=0,
                    served_at=now,
                )
            ],
            created_at=now,
            updated_at=now,
        )
        record = RuntimeSessionRecord(
            session=session,
            served_variant_indices={ordered_card_ids[0]: initial_variant_index, **(variant_indices or {})},
            selection_reasons=selection_reasons or {},
            adaptive_session=adaptive_session,
        )
        return record

    def record_answer(
        self,
        *,
        record: RuntimeSessionRecord,
        user_answer: str,
        normalized_user_answer: str,
        correct: bool,
        variant_type: FollowUpVariantType,
    ) -> RuntimeSessionRecord:
        session = record.session
        if session.status != SessionStatus.active:
            raise CardSessionEngineError("Cannot answer a completed or abandoned session")
        now = datetime.now(timezone.utc)
        current_card_id = session.selected_card_ids[session.current_card_index]
        record.answers.append(
            SessionAnswerRecord(
                card_id=current_card_id,
                sequence_index=len(record.answers),
                answered_at=now,
                user_answer=user_answer,
                normalized_user_answer=normalized_user_answer,
                correct=correct,
                outcome=AnswerOutcome.correct if correct else AnswerOutcome.incorrect,
                variant_type=variant_type,
            )
        )
        session.updated_at = now
        return record

    def advance(
        self,
        *,
        record: RuntimeSessionRecord,
        next_variant_type: FollowUpVariantType | None,
        next_variant_index: int = 0,
    ) -> RuntimeSessionRecord:
        session = record.session
        if session.status != SessionStatus.active:
            raise CardSessionEngineError("Session is not active")
        if session.current_card_index >= len(session.selected_card_ids) - 1:
            raise CardSessionEngineError("No next card has been selected")

        session.current_card_index += 1
        session.updated_at = datetime.now(timezone.utc)
        if next_variant_type is not None:
            next_card_id = session.selected_card_ids[session.current_card_index]
            record.served_variant_indices[next_card_id] = next_variant_index
            session.served_variant_history.append(
                ServedVariantRecord(
                    card_id=next_card_id,
                    variant_type=next_variant_type,
                    sequence_index=len(session.served_variant_history),
                    served_at=session.updated_at,
                )
            )
        return record
