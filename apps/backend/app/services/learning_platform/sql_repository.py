from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.learning_platform.db_models import LearnerEventRecord
from app.services.learning_platform.errors import IdempotencyConflict
from app.services.learning_platform.models import LearnerEvent, parse_aware_iso_datetime


class SqlAlchemyLearnerEventRepository:
    """Async SQLAlchemy persistence for canonical learning.v1 events.

    The repository is request/session scoped. It never owns a global AsyncSession.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def append(self, event: LearnerEvent) -> tuple[LearnerEvent, bool]:
        existing = await self.get(event.learner_id, event.event_id)
        if existing is not None:
            if existing != event:
                raise IdempotencyConflict(
                    f"Event {event.event_id!r} already exists with different content"
                )
            return existing, False

        record = LearnerEventRecord(
            learner_id=event.learner_id,
            event_id=event.event_id,
            occurred_at=parse_aware_iso_datetime(event.occurred_at, "occurredAt"),
            event_kind=event.event_kind,
            task_id=event.task_id,
            content_version=event.content_version,
            pathway=event.pathway,
            runtime=event.runtime,
            level_band=event.level_band,
            payload=event.to_mapping(),
        )
        self.session.add(record)

        try:
            await self.session.commit()
        except IntegrityError:
            # A concurrent retry may have won the unique owner/event key.
            await self.session.rollback()
            concurrent = await self.get(event.learner_id, event.event_id)
            if concurrent is not None:
                if concurrent != event:
                    raise IdempotencyConflict(
                        f"Event {event.event_id!r} already exists with different content"
                    )
                return concurrent, False
            raise

        return event, True

    async def get(
        self,
        learner_id: str,
        event_id: str,
    ) -> LearnerEvent | None:
        result = await self.session.execute(
            select(LearnerEventRecord).where(
                LearnerEventRecord.learner_id == learner_id,
                LearnerEventRecord.event_id == event_id,
            )
        )
        record = result.scalar_one_or_none()
        if record is None:
            return None
        return LearnerEvent.from_mapping(dict(record.payload or {}))

    async def list_for_learner(
        self,
        learner_id: str,
        *,
        pathway: str | None = None,
        since: str | None = None,
        limit: int = 200,
    ) -> list[LearnerEvent]:
        query = select(LearnerEventRecord).where(
            LearnerEventRecord.learner_id == learner_id
        )

        if pathway is not None:
            query = query.where(LearnerEventRecord.pathway == pathway)

        if since is not None:
            cutoff = parse_aware_iso_datetime(since, "since")
            query = query.where(LearnerEventRecord.occurred_at >= cutoff)

        query = query.order_by(
            LearnerEventRecord.occurred_at.asc(),
            LearnerEventRecord.event_id.asc(),
        ).limit(max(1, min(int(limit), 500)))

        result = await self.session.execute(query)
        return [
            LearnerEvent.from_mapping(dict(record.payload or {}))
            for record in result.scalars().all()
        ]
