from __future__ import annotations

from collections.abc import Callable
from contextlib import asynccontextmanager

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cards.schemas import CardEnvelope, validate_card_payload
from app.db.database import AsyncSessionLocal
from app.db.models import CardDatasetVersion, PublishedCard, PublishedDeck, PublishedModule


class PublishedDatasetRepositoryError(RuntimeError):
    """Raised when published card datasets cannot be loaded or persisted safely."""


class PublishedDatasetRepository:
    def __init__(self, session_factory: Callable[[], AsyncSession] | None = None):
        self._session_factory = session_factory or AsyncSessionLocal

    @asynccontextmanager
    async def _session(self):
        session = self._session_factory()
        try:
            yield session
        finally:
            await session.close()

    async def list_datasets(self) -> list[CardDatasetVersion]:
        try:
            async with self._session() as session:
                result = await session.execute(
                    select(CardDatasetVersion).order_by(CardDatasetVersion.published_at.desc())
                )
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise PublishedDatasetRepositoryError("Failed to list published datasets") from exc
        return list(result.scalars().all())

    async def get_active_dataset(self, dataset_name: str | None = None) -> CardDatasetVersion:
        try:
            async with self._session() as session:
                stmt = select(CardDatasetVersion).where(CardDatasetVersion.state == "published")
                if dataset_name:
                    stmt = stmt.where(CardDatasetVersion.dataset_name == dataset_name)
                stmt = stmt.order_by(CardDatasetVersion.published_at.desc()).limit(1)
                result = await session.execute(stmt)
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise PublishedDatasetRepositoryError("Failed to load active dataset") from exc
        dataset = result.scalar_one_or_none()
        if dataset is None:
            raise PublishedDatasetRepositoryError("No published card dataset is currently available")
        return dataset

    async def get_cards_for_dataset(self, dataset_version_id: str) -> list[CardEnvelope]:
        try:
            async with self._session() as session:
                result = await session.execute(
                    select(PublishedCard)
                    .where(PublishedCard.dataset_version_id == dataset_version_id)
                    .order_by(PublishedCard.card_id.asc())
                )
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise PublishedDatasetRepositoryError(
                f"Failed to load published cards for dataset {dataset_version_id}"
            ) from exc
        return [validate_card_payload(row.card_payload) for row in result.scalars().all()]

    async def create_dataset(
        self,
        *,
        dataset_row: CardDatasetVersion,
        card_rows: list[PublishedCard],
        deck_rows: list[PublishedDeck],
        module_rows: list[PublishedModule],
    ) -> CardDatasetVersion:
        try:
            async with self._session() as session:
                existing = await session.get(CardDatasetVersion, dataset_row.dataset_version_id)
                if existing is not None:
                    raise PublishedDatasetRepositoryError(
                        f"Dataset version already exists: {dataset_row.dataset_version_id}"
                    )
                session.add(dataset_row)
                session.add_all(card_rows)
                session.add_all(deck_rows)
                session.add_all(module_rows)
                await session.commit()
        except PublishedDatasetRepositoryError:
            raise
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise PublishedDatasetRepositoryError(
                f"Failed to create published dataset {dataset_row.dataset_version_id}"
            ) from exc
        return dataset_row

    async def archive_dataset(self, dataset_version_id: str, *, archived_at) -> CardDatasetVersion:
        try:
            async with self._session() as session:
                dataset = await session.get(CardDatasetVersion, dataset_version_id)
                if dataset is None:
                    raise PublishedDatasetRepositoryError(f"Unknown dataset version: {dataset_version_id}")
                dataset.state = "archived"
                dataset.archived_at = archived_at
                deck_rows = await session.execute(
                    select(PublishedDeck).where(PublishedDeck.dataset_version_id == dataset_version_id)
                )
                module_rows = await session.execute(
                    select(PublishedModule).where(PublishedModule.dataset_version_id == dataset_version_id)
                )
                for row in deck_rows.scalars().all():
                    row.lifecycle_state = "archived"
                    row.archived_at = archived_at
                for row in module_rows.scalars().all():
                    row.lifecycle_state = "archived"
                    row.archived_at = archived_at
                await session.commit()
        except PublishedDatasetRepositoryError:
            raise
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise PublishedDatasetRepositoryError(
                f"Failed to archive dataset {dataset_version_id}"
            ) from exc
        return dataset
