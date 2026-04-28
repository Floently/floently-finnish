from __future__ import annotations

from collections.abc import Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cards.observability import increment_metric, log_card_event
from app.core.config import get_settings
from app.db.database import AsyncSessionLocal
from app.db.models import CardReviewQueueSnapshot, CardRuntimeAnswer, CardRuntimeSession


@dataclass(slots=True)
class CardCleanupResult:
    deleted_answers: int
    deleted_sessions: int
    deleted_queue_snapshots: int


class CardCleanupService:
    def __init__(
        self,
        session_factory: Callable[[], AsyncSession] | None = None,
        *,
        session_retention_days: int | None = None,
        answer_retention_days: int | None = None,
        queue_retention_days: int | None = None,
    ):
        settings = get_settings()
        self._session_factory = session_factory or AsyncSessionLocal
        self.session_retention_days = session_retention_days or settings.card_runtime_session_retention_days
        self.answer_retention_days = answer_retention_days or settings.card_runtime_answer_retention_days
        self.queue_retention_days = queue_retention_days or settings.card_review_queue_retention_days

    @asynccontextmanager
    async def _session(self):
        session = self._session_factory()
        try:
            yield session
        finally:
            await session.close()

    async def run(self, *, now: datetime | None = None) -> CardCleanupResult:
        current_time = now or datetime.now(UTC)
        session_cutoff = current_time - timedelta(days=self.session_retention_days)
        answer_cutoff = current_time - timedelta(days=self.answer_retention_days)
        queue_cutoff = current_time - timedelta(days=self.queue_retention_days)

        async with self._session() as session:
            old_sessions_result = await session.execute(
                select(CardRuntimeSession.session_id).where(
                    CardRuntimeSession.status != "active",
                    CardRuntimeSession.updated_at < session_cutoff,
                )
            )
            old_session_ids = [item for item in old_sessions_result.scalars().all()]

            deleted_answers = 0
            if old_session_ids:
                result = await session.execute(
                    delete(CardRuntimeAnswer).where(CardRuntimeAnswer.session_id.in_(old_session_ids))
                )
                deleted_answers += int(result.rowcount or 0)

                result = await session.execute(
                    delete(CardRuntimeSession).where(CardRuntimeSession.session_id.in_(old_session_ids))
                )
                deleted_sessions = int(result.rowcount or 0)
            else:
                deleted_sessions = 0

            result = await session.execute(
                delete(CardRuntimeAnswer).where(
                    CardRuntimeAnswer.answered_at < answer_cutoff,
                    CardRuntimeAnswer.session_id.not_in(
                        select(CardRuntimeSession.session_id).where(CardRuntimeSession.status == "active")
                    ),
                )
            )
            deleted_answers += int(result.rowcount or 0)

            result = await session.execute(
                delete(CardReviewQueueSnapshot).where(CardReviewQueueSnapshot.created_at < queue_cutoff)
            )
            deleted_queue_snapshots = int(result.rowcount or 0)

            await session.commit()

        increment_metric("cards.cleanup_runs")
        log_card_event(
            "cards.cleanup_completed",
            deleted_answers=deleted_answers,
            deleted_sessions=deleted_sessions,
            deleted_queue_snapshots=deleted_queue_snapshots,
        )
        return CardCleanupResult(
            deleted_answers=deleted_answers,
            deleted_sessions=deleted_sessions,
            deleted_queue_snapshots=deleted_queue_snapshots,
        )
