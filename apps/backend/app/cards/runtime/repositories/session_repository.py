from __future__ import annotations

from collections.abc import Callable
from contextlib import asynccontextmanager
from datetime import UTC

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cards.adaptive.models import AdaptiveSelectionReason
from app.cards.runtime.models.session_state import RuntimeSessionRecord, SessionAnswerRecord
from app.cards.runtime.session_engine import CardSessionEngineError
from app.cards.schemas.session import CardSession, ServedVariantRecord, SessionTarget
from app.db.database import AsyncSessionLocal
from app.db.models import CardRuntimeAnswer, CardRuntimeSession


class CardSessionRepositoryError(RuntimeError):
    """Raised when card sessions cannot be read or persisted safely."""


def _ensure_utc(value):
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


class CardSessionRepository:
    def __init__(self, session_factory: Callable[[], AsyncSession] | None = None):
        self._session_factory = session_factory or AsyncSessionLocal

    @asynccontextmanager
    async def _session(self):
        session = self._session_factory()
        try:
            yield session
        finally:
            await session.close()

    async def create_session(self, record: RuntimeSessionRecord) -> RuntimeSessionRecord:
        _validate_runtime_record(record)
        try:
            async with self._session() as session:
                row = CardRuntimeSession(
                    session_id=record.session.session_id,
                    user_id=record.session.user_id,
                    target_kind=record.session.target.kind.value,
                    target_id=record.session.target.target_id,
                    target_version=record.session.target.target_version,
                    selected_card_ids=list(record.session.selected_card_ids),
                    current_card_index=record.session.current_card_index,
                    status=record.session.status.value,
                    served_variant_history=[
                        item.model_dump(mode="json") for item in record.session.served_variant_history
                    ],
                    served_variant_indices=dict(record.served_variant_indices),
                    selection_reasons={
                        key: value.model_dump(mode="json") for key, value in record.selection_reasons.items()
                    },
                    adaptive_session=record.adaptive_session,
                    created_at=record.session.created_at,
                    updated_at=record.session.updated_at,
                    completed_at=record.session.updated_at if record.session.status.value == "completed" else None,
                )
                session.add(row)
                await session.commit()
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise CardSessionRepositoryError(
                f"Failed to create runtime session {record.session.session_id}"
            ) from exc
        return record

    async def get_session(self, session_id: str) -> RuntimeSessionRecord:
        try:
            async with self._session() as session:
                row = await session.get(CardRuntimeSession, session_id)
                if row is None:
                    raise CardSessionRepositoryError(f"Unknown session_id: {session_id}")
                answers_result = await session.execute(
                    select(CardRuntimeAnswer)
                    .where(CardRuntimeAnswer.session_id == session_id)
                    .order_by(CardRuntimeAnswer.sequence_index.asc())
                )
        except CardSessionRepositoryError:
            raise
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise CardSessionRepositoryError(f"Failed to load runtime session {session_id}") from exc

        record = RuntimeSessionRecord(
            session=CardSession(
                session_id=row.session_id,
                user_id=row.user_id,
                target=SessionTarget(
                    kind=row.target_kind,
                    target_id=row.target_id,
                    target_version=row.target_version,
                ),
                selected_card_ids=list(row.selected_card_ids or []),
                current_card_index=row.current_card_index,
                status=row.status,
                served_variant_history=[
                    ServedVariantRecord.model_validate(item) for item in (row.served_variant_history or [])
                ],
                created_at=_ensure_utc(row.created_at),
                updated_at=_ensure_utc(row.updated_at),
            ),
            answers=[
                SessionAnswerRecord(
                    card_id=item.card_id,
                    sequence_index=item.sequence_index,
                    answered_at=_ensure_utc(item.answered_at),
                    user_answer=item.user_answer,
                    normalized_user_answer=item.normalized_user_answer,
                    correct=item.correct,
                    outcome=item.outcome,
                    variant_type=item.variant_type,
                )
                for item in answers_result.scalars().all()
            ],
            served_variant_indices={str(key): int(value) for key, value in (row.served_variant_indices or {}).items()},
            selection_reasons={
                str(key): AdaptiveSelectionReason.model_validate(value)
                for key, value in (row.selection_reasons or {}).items()
            },
            adaptive_session=bool(row.adaptive_session),
        )
        _validate_runtime_record(record)
        return record

    async def save_session(self, record: RuntimeSessionRecord) -> RuntimeSessionRecord:
        _validate_runtime_record(record)
        try:
            async with self._session() as session:
                row = await session.get(CardRuntimeSession, record.session.session_id)
                if row is None:
                    raise CardSessionRepositoryError(f"Unknown session_id: {record.session.session_id}")
                row.selected_card_ids = list(record.session.selected_card_ids)
                row.current_card_index = record.session.current_card_index
                row.status = record.session.status.value
                row.served_variant_history = [
                    item.model_dump(mode="json") for item in record.session.served_variant_history
                ]
                row.served_variant_indices = dict(record.served_variant_indices)
                row.selection_reasons = {
                    key: value.model_dump(mode="json") for key, value in record.selection_reasons.items()
                }
                row.updated_at = record.session.updated_at
                row.completed_at = record.session.updated_at if record.session.status.value == "completed" else None
                await session.commit()
        except CardSessionRepositoryError:
            raise
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise CardSessionRepositoryError(
                f"Failed to save runtime session {record.session.session_id}"
            ) from exc
        return record

    async def append_answer(self, session_id: str, answer: SessionAnswerRecord) -> None:
        try:
            async with self._session() as session:
                row = CardRuntimeAnswer(
                    session_id=session_id,
                    card_id=answer.card_id,
                    sequence_index=answer.sequence_index,
                    answered_at=answer.answered_at,
                    user_answer=answer.user_answer,
                    normalized_user_answer=answer.normalized_user_answer,
                    correct=answer.correct,
                    outcome=answer.outcome.value,
                    variant_type=answer.variant_type.value,
                )
                session.add(row)
                await session.commit()
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise CardSessionRepositoryError(
                f"Failed to append answer for runtime session {session_id}"
            ) from exc


def _validate_runtime_record(record: RuntimeSessionRecord) -> None:
    session = record.session
    if not session.selected_card_ids:
        raise CardSessionRepositoryError("Runtime session has no selected cards")
    if session.current_card_index < 0 or session.current_card_index >= len(session.selected_card_ids):
        raise CardSessionRepositoryError(
            "current_card_index must point to a selected card "
            f"(index={session.current_card_index}, selected_cards={len(session.selected_card_ids)})"
        )
    active_card_ids = set(session.selected_card_ids)
    for item in session.served_variant_history:
        if item.card_id not in active_card_ids:
            raise CardSessionRepositoryError(
                f"Served variant history references unknown card_id: {item.card_id}"
            )
