from __future__ import annotations

from collections.abc import Callable
from contextlib import asynccontextmanager
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.audio.models import AudioAsset
from app.db.database import AsyncSessionLocal
from app.db.models import AudioAssetRow


class AudioAssetRepositoryError(RuntimeError):
    """Raised when persisted audio asset metadata cannot be loaded or saved safely."""


class AudioAssetRepository:
    def __init__(self, session_factory: Callable[[], AsyncSession] | None = None):
        self._session_factory = session_factory or AsyncSessionLocal

    @asynccontextmanager
    async def _session(self):
        session = self._session_factory()
        try:
            yield session
        finally:
            await session.close()

    async def get_by_asset_id(self, asset_id: str) -> AudioAsset | None:
        try:
            async with self._session() as session:
                row = await session.get(AudioAssetRow, asset_id)
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise AudioAssetRepositoryError(f"Failed to load audio asset {asset_id}") from exc
        return row.to_domain_model() if row else None

    async def get_by_text_hash(self, text_hash: str) -> AudioAsset | None:
        try:
            async with self._session() as session:
                result = await session.execute(
                    select(AudioAssetRow).where(AudioAssetRow.text_hash == text_hash).limit(1)
                )
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise AudioAssetRepositoryError(f"Failed to look up audio asset hash {text_hash}") from exc
        row = result.scalar_one_or_none()
        return row.to_domain_model() if row else None

    async def save(self, asset: AudioAsset) -> AudioAsset:
        try:
            async with self._session() as session:
                existing = await session.get(AudioAssetRow, asset.id)
                if existing is None:
                    row = AudioAssetRow(
                        id=asset.id,
                        text_hash=asset.text_hash,
                        source_text=asset.source_text,
                        speaker_id=asset.speaker_id,
                        speaker_label=asset.speaker_label,
                        voice_profile=asset.voice_profile,
                        voice_id=asset.voice_id,
                        provider=asset.provider,
                        speaking_style=asset.speaking_style,
                        speed=asset.speed,
                        context_type=asset.context_type,
                        file_path=str(asset.file_path),
                        duration_seconds=asset.duration_seconds,
                        media_type=asset.media_type,
                        created_at=asset.created_at,
                    )
                    session.add(row)
                await session.commit()
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            raise AudioAssetRepositoryError(f"Failed to persist audio asset {asset.id}") from exc
        return asset
