from __future__ import annotations

import asyncio
import tempfile
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import User
from app.services.learning_platform import (
    AsyncLearnerEventService,
    LearnerEvent,
    LearnerIdentity,
    SqlAlchemyLearnerEventRepository,
)
from app.services.learning_platform.db_models import LearnerEventRecord
from app.services.learning_platform.errors import (
    IdempotencyConflict,
    LearnerOwnershipError,
)


def event(**overrides) -> LearnerEvent:
    payload = {
        "schemaVersion": "learning.v1",
        "eventId": "evt-1",
        "learnerId": "user-1",
        "occurredAt": "2026-10-03T00:00:00+00:00",
        "eventKind": "reading_completed",
        "taskId": "reading-a2-1",
        "contentVersion": "content-1",
        "attemptId": "attempt-1",
        "pathway": "everyday",
        "runtime": "reading",
        "skills": ["reading"],
        "levelBand": "A2",
        "score": 3,
        "maxScore": 4,
        "metadata": {"questionCount": 4},
    }
    payload.update(overrides)
    return LearnerEvent.from_mapping(payload)


class LearnerEventTestDatabase:
    def __init__(self) -> None:
        handle = tempfile.NamedTemporaryFile(
            prefix="learner-events-test-",
            suffix=".db",
            delete=False,
        )
        handle.close()
        self.path = Path(handle.name)
        self.engine = create_async_engine(
            f"sqlite+aiosqlite:///{self.path}",
            future=True,
            echo=False,
        )
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def initialize(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(
                lambda sync_connection: User.__table__.metadata.create_all(
                    sync_connection,
                    tables=[
                        User.__table__,
                        LearnerEventRecord.__table__,
                    ],
                )
            )
        async with self.session_factory() as session:
            session.add(
                User(
                    id="user-1",
                    email="user-1@example.com",
                )
            )
            session.add(
                User(
                    id="user-2",
                    email="user-2@example.com",
                )
            )
            await session.commit()

    async def dispose(self) -> None:
        await self.engine.dispose()
        self.path.unlink(missing_ok=True)


def test_sql_repository_persists_across_new_sessions():
    async def scenario():
        database = LearnerEventTestDatabase()
        await database.initialize()
        try:
            async with database.session_factory() as session:
                service = AsyncLearnerEventService(
                    SqlAlchemyLearnerEventRepository(session)
                )
                stored, inserted = await service.record_event(
                    LearnerIdentity("user-1"),
                    event(),
                )
                assert inserted is True
                assert stored.event_id == "evt-1"

            async with database.session_factory() as restarted_session:
                restarted = AsyncLearnerEventService(
                    SqlAlchemyLearnerEventRepository(restarted_session)
                )
                restored = await restarted.get_event(
                    LearnerIdentity("user-1"),
                    "evt-1",
                )
                assert restored is not None
                assert restored.to_mapping() == event().to_mapping()
        finally:
            await database.dispose()

    asyncio.run(scenario())


def test_sql_repository_is_idempotent_and_rejects_conflicting_reuse():
    async def scenario():
        database = LearnerEventTestDatabase()
        await database.initialize()
        try:
            async with database.session_factory() as session:
                service = AsyncLearnerEventService(
                    SqlAlchemyLearnerEventRepository(session)
                )
                _, first_inserted = await service.record_event(
                    LearnerIdentity("user-1"),
                    event(),
                )
                _, duplicate_inserted = await service.record_event(
                    LearnerIdentity("user-1"),
                    event(),
                )
                assert first_inserted is True
                assert duplicate_inserted is False

                with pytest.raises(IdempotencyConflict):
                    await service.record_event(
                        LearnerIdentity("user-1"),
                        event(contentVersion="content-2"),
                    )
        finally:
            await database.dispose()

    asyncio.run(scenario())


def test_sql_service_enforces_learner_ownership():
    async def scenario():
        database = LearnerEventTestDatabase()
        await database.initialize()
        try:
            async with database.session_factory() as session:
                service = AsyncLearnerEventService(
                    SqlAlchemyLearnerEventRepository(session)
                )
                with pytest.raises(LearnerOwnershipError):
                    await service.record_event(
                        LearnerIdentity("user-2"),
                        event(),
                    )
        finally:
            await database.dispose()

    asyncio.run(scenario())


def test_sql_event_queries_are_bounded_filterable_and_derive_evidence():
    async def scenario():
        database = LearnerEventTestDatabase()
        await database.initialize()
        try:
            async with database.session_factory() as session:
                service = AsyncLearnerEventService(
                    SqlAlchemyLearnerEventRepository(session)
                )
                identity = LearnerIdentity("user-1")

                await service.record_event(
                    identity,
                    event(
                        eventId="evt-read",
                        occurredAt="2026-10-03T00:00:00+00:00",
                    ),
                )
                await service.record_event(
                    identity,
                    event(
                        eventId="evt-write",
                        occurredAt="2026-10-03T00:10:00+00:00",
                        eventKind="writing_submitted",
                        taskId="writing-b1-1",
                        pathway="yki",
                        runtime="writing",
                        skills=["writing"],
                        levelBand="B1",
                    ),
                )

                yki_events = await service.list_events(
                    identity,
                    pathway="yki",
                    limit=20,
                )
                assert [item.event_id for item in yki_events] == ["evt-write"]

                reading_events = await service.list_events(
                    identity,
                    skill="reading",
                    limit=20,
                )
                assert [item.event_id for item in reading_events] == ["evt-read"]

                recent = await service.list_events(
                    identity,
                    since="2026-10-03T00:05:00Z",
                    limit=20,
                )
                assert [item.event_id for item in recent] == ["evt-write"]

                evidence = await service.list_evidence(
                    identity,
                    skill="writing",
                    limit=20,
                )
                assert [item.source_event_id for item in evidence] == ["evt-write"]
                assert [item.evidence_type for item in evidence] == ["production"]
        finally:
            await database.dispose()

    asyncio.run(scenario())
