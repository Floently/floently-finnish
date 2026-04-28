from __future__ import annotations

from app.cards.publication.repository import PublishedDatasetRepository, PublishedDatasetRepositoryError
from app.cards.publication.validated_source_repository import (
    ValidatedCardSourceRepository,
    ValidatedCardSourceRepositoryError,
)
from app.cards.schemas import CardEnvelope
from app.cards.schemas.content import DialogueAudioContent, SingleAudioContent
from app.cards.schemas.common import CardContentType, LearningPath, LevelBand, ProfessionTrack


class CardRepositoryError(RuntimeError):
    """Raised when runtime card storage is unreadable or unavailable."""


class CardRepository:
    def __init__(
        self,
        published_repository: PublishedDatasetRepository | None = None,
        dataset_name: str | None = None,
        validated_source_repository: ValidatedCardSourceRepository | None = None,
    ):
        self.published_repository = published_repository or PublishedDatasetRepository()
        self.dataset_name = dataset_name
        self.validated_source_repository = validated_source_repository or ValidatedCardSourceRepository()

    async def load_validated_cards(self, source: str | None = None) -> list[CardEnvelope]:
        # Source selection is intentionally ignored here. The file-backed card
        # authority is the canonical card bank, and DB-published datasets may
        # override it when an active dataset exists.
        cards: dict[str, CardEnvelope] = {}
        try:
            dataset = await self.published_repository.get_active_dataset(self.dataset_name)
            published_cards = await self.published_repository.get_cards_for_dataset(dataset.dataset_version_id)
        except PublishedDatasetRepositoryError as exc:
            published_cards = []
            published_error = exc
        else:
            published_error = None

        for card in published_cards:
            cards[card.id] = card

        try:
            for card in self.validated_source_repository.load_validated_cards():
                cards.setdefault(card.id, card)
        except ValidatedCardSourceRepositoryError as exc:
            if not cards:
                message = str(published_error or exc)
                raise CardRepositoryError(message) from (published_error or exc)

        if not cards and published_error is not None:
            raise CardRepositoryError(str(published_error)) from published_error
        return sorted(cards.values(), key=lambda card: card.id)

    async def get_cards(
        self,
        *,
        domain: LearningPath | None = None,
        content_type: CardContentType | None = None,
        profession: ProfessionTrack | None = None,
        level_band: LevelBand | None = None,
        source: str | None = None,
    ) -> list[CardEnvelope]:
        cards = await self.load_validated_cards(source=source)
        filtered = []
        for card in cards:
            if domain is not None and card.path != domain:
                continue
            if content_type is not None and card.content_type != content_type:
                continue
            if profession is not None and card.profession.track != profession:
                continue
            if level_band is not None and card.level_band != level_band:
                continue
            filtered.append(card)
        if filtered:
            return filtered
        if content_type == CardContentType.grammar_card and (
            profession is not None or domain == LearningPath.professional
        ):
            return await self.get_cards(
                domain=LearningPath.general if domain == LearningPath.professional else domain,
                content_type=content_type,
                profession=None,
                level_band=level_band,
                source=source,
            )
        return filtered

    async def get_card_by_id(self, card_id: str, *, source: str | None = None) -> CardEnvelope:
        for card in await self.load_validated_cards(source=source):
            if card.id == card_id:
                return card
        raise CardRepositoryError(f"Card not found: {card_id}")

    async def get_card_by_audio_asset_id(self, asset_id: str, *, source: str | None = None) -> CardEnvelope | None:
        for card in await self.load_validated_cards(source=source):
            audio = card.content.audio
            if isinstance(audio, SingleAudioContent) and asset_id in audio.asset_ids:
                return card
            if isinstance(audio, DialogueAudioContent) and asset_id in audio.asset_ids:
                return card
        return None
