from __future__ import annotations

from collections.abc import Callable
from contextlib import asynccontextmanager

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cards.adaptive.models import ReviewQueueSnapshot, UserAdaptiveState
from app.cards.observability import increment_metric, log_card_event
from app.cards.schemas.session import CardReviewState
from app.db.database import AsyncSessionLocal
from app.db.models import CardAdaptivePerformance, CardReviewQueueSnapshot, CardReviewState as CardReviewStateRow


class AdaptiveStateStoreError(RuntimeError):
    """Raised when adaptive state cannot be loaded or persisted safely."""


class AdaptiveStateStore:
    def __init__(self, session_factory: Callable[[], AsyncSession] | None = None):
        self._session_factory = session_factory or AsyncSessionLocal

    @asynccontextmanager
    async def _session(self):
        session = self._session_factory()
        try:
            yield session
        finally:
            await session.close()

    async def load_user_state(self, user_id: str) -> UserAdaptiveState:
        try:
            async with self._session() as session:
                performance_rows = await session.execute(
                    select(CardAdaptivePerformance)
                    .where(CardAdaptivePerformance.user_id == user_id)
                    .order_by(CardAdaptivePerformance.card_id.asc())
                )
                review_rows = await session.execute(
                    select(CardReviewStateRow)
                    .where(CardReviewStateRow.user_id == user_id)
                    .order_by(CardReviewStateRow.card_id.asc())
                )
                queue_row = await session.execute(
                    select(CardReviewQueueSnapshot)
                    .where(CardReviewQueueSnapshot.user_id == user_id)
                    .order_by(CardReviewQueueSnapshot.created_at.desc())
                    .limit(1)
                )
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            increment_metric("cards.persistence_failure", operation="load_user_state")
            log_card_event("cards.persistence_failure", operation="load_user_state", user_id=user_id)
            raise AdaptiveStateStoreError(f"Failed to load adaptive state for user {user_id}") from exc

        latest_queue = queue_row.scalar_one_or_none()
        return UserAdaptiveState(
            performance_records=[
                row.to_domain_model() for row in performance_rows.scalars().all()
            ],
            review_states=[
                row.to_domain_model() for row in review_rows.scalars().all()
            ],
            latest_review_queue=latest_queue.to_domain_model() if latest_queue else None,
        )

    async def save_user_state(self, user_id: str, user_state: UserAdaptiveState) -> None:
        try:
            async with self._session() as session:
                for performance in user_state.performance_records:
                    row = await session.get(
                        CardAdaptivePerformance,
                        {"user_id": user_id, "card_id": performance.card_id},
                    )
                    if row is None:
                        row = CardAdaptivePerformance(user_id=user_id, card_id=performance.card_id)
                        session.add(row)
                    row.apply_domain_model(performance)

                for review_state in user_state.review_states:
                    row = await session.get(
                        CardReviewStateRow,
                        {"user_id": user_id, "card_id": review_state.card_id},
                    )
                    if row is None:
                        row = CardReviewStateRow(user_id=user_id, card_id=review_state.card_id)
                        session.add(row)
                    row.apply_domain_model(review_state)

                if user_state.latest_review_queue is not None:
                    queue_row = await session.get(CardReviewQueueSnapshot, user_state.latest_review_queue.queue_id)
                    if queue_row is None:
                        queue_row = CardReviewQueueSnapshot(
                            queue_id=user_state.latest_review_queue.queue_id,
                            user_id=user_id,
                        )
                        session.add(queue_row)
                    queue_row.apply_domain_model(user_state.latest_review_queue)

                await session.commit()
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            increment_metric("cards.persistence_failure", operation="save_user_state")
            log_card_event("cards.persistence_failure", operation="save_user_state", user_id=user_id)
            raise AdaptiveStateStoreError(f"Failed to save adaptive state for user {user_id}") from exc

    async def load_review_state(self, user_id: str, card_id: str) -> CardReviewState | None:
        try:
            async with self._session() as session:
                row = await session.get(CardReviewStateRow, {"user_id": user_id, "card_id": card_id})
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            increment_metric("cards.persistence_failure", operation="load_review_state")
            log_card_event(
                "cards.persistence_failure",
                operation="load_review_state",
                user_id=user_id,
                card_id=card_id,
            )
            raise AdaptiveStateStoreError(
                f"Failed to load review state for user {user_id} card {card_id}"
            ) from exc
        return row.to_domain_model() if row else None

    async def load_latest_queue(self, user_id: str) -> ReviewQueueSnapshot | None:
        try:
            async with self._session() as session:
                result = await session.execute(
                    select(CardReviewQueueSnapshot)
                    .where(CardReviewQueueSnapshot.user_id == user_id)
                    .order_by(CardReviewQueueSnapshot.created_at.desc())
                    .limit(1)
                )
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            increment_metric("cards.persistence_failure", operation="load_latest_queue")
            log_card_event("cards.persistence_failure", operation="load_latest_queue", user_id=user_id)
            raise AdaptiveStateStoreError(f"Failed to load latest queue for user {user_id}") from exc
        row = result.scalar_one_or_none()
        return row.to_domain_model() if row else None
