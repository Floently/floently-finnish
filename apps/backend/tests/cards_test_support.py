from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.cards.publication.deck_publication_service import DeckPublicationService
from app.cards.publication.repository import PublishedDatasetRepository
from app.cards.publication.validated_source_repository import ValidatedCardSourceRepository
from app.db.models import (
    CardAdaptivePerformance,
    CardDatasetVersion,
    CardReviewQueueSnapshot,
    CardReviewState,
    CardRuntimeAnswer,
    CardRuntimeSession,
    PublishedCard,
    PublishedDeck,
    PublishedModule,
    User,
)


class _NoOpAudioPreparationService:
    async def prepare_cards_for_publication(self, cards):
        return list(cards)


class CardTestDatabase:
    def __init__(self) -> None:
        handle = tempfile.NamedTemporaryFile(prefix="cards-test-", suffix=".db", delete=False)
        handle.close()
        self.path = Path(handle.name)
        self.engine = create_async_engine(f"sqlite+aiosqlite:///{self.path}", future=True, echo=False)
        self.session_factory = async_sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    async def initialize(self) -> None:
        async with self.engine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: User.__table__.metadata.create_all(
                    sync_conn,
                    tables=[
                        User.__table__,
                        CardAdaptivePerformance.__table__,
                        CardReviewState.__table__,
                        CardReviewQueueSnapshot.__table__,
                        CardRuntimeSession.__table__,
                        CardRuntimeAnswer.__table__,
                        CardDatasetVersion.__table__,
                        PublishedCard.__table__,
                        PublishedDeck.__table__,
                        PublishedModule.__table__,
                    ],
                )
            )

    async def dispose(self) -> None:
        await self.engine.dispose()
        self.path.unlink(missing_ok=True)

    async def ensure_user(self, user_id: str, *, email: str) -> None:
        async with self.session_factory() as session:
            user = await session.get(User, user_id)
            if user is None:
                session.add(User(id=user_id, email=email))
            else:
                user.email = email
            await session.commit()

    async def publish_validated_source(self, *, accepted_path: Path) -> None:
        service = DeckPublicationService(
            source_repository=ValidatedCardSourceRepository(accepted_cards_path=accepted_path),
            published_repository=PublishedDatasetRepository(session_factory=self.session_factory),
            audio_preparation_service=_NoOpAudioPreparationService(),
        )
        await service.publish_validated_source(
            published_by_user_id="admin.test.001",
            version_label=f"dataset.cards.test.{uuid.uuid4().hex}",
        )
