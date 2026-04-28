from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime

from app.audio.card_audio_preparation import CardAudioPreparationService
from app.cards.observability import increment_metric, log_card_event
from app.cards.publication.models import (
    DatasetVersionResponse,
    PublicationActionResponse,
    PublicationOverviewResponse,
    SourceLifecycleSummaryResponse,
)
from app.cards.publication.repository import PublishedDatasetRepository, PublishedDatasetRepositoryError
from app.cards.publication.validated_source_repository import (
    ValidatedCardSourceRepository,
    ValidatedCardSourceRepositoryError,
)
from app.cards.schemas.cards import CardEnvelope
from app.db.models import CardDatasetVersion, PublishedCard, PublishedDeck, PublishedModule


class DeckPublicationServiceError(RuntimeError):
    """Raised when card dataset publication or lifecycle work cannot complete safely."""


class DeckPublicationService:
    def __init__(
        self,
        *,
        source_repository: ValidatedCardSourceRepository | None = None,
        published_repository: PublishedDatasetRepository | None = None,
        audio_preparation_service: CardAudioPreparationService | None = None,
        default_dataset_name: str = "default",
    ):
        self.source_repository = source_repository or ValidatedCardSourceRepository()
        self.published_repository = published_repository or PublishedDatasetRepository()
        self.audio_preparation_service = audio_preparation_service or CardAudioPreparationService()
        self.default_dataset_name = default_dataset_name

    async def list_overview(self) -> PublicationOverviewResponse:
        cards = self.source_repository.load_validated_cards()
        modules, decks = _build_publication_rows(cards=cards, dataset_version_id="preview", published_at=datetime.now(UTC))
        datasets = await self.published_repository.list_datasets()
        return PublicationOverviewResponse(
            source=SourceLifecycleSummaryResponse(
                source_name="validated_ingestion_output",
                state="validated",
                card_count=len(cards),
                deck_count=len(decks),
                module_count=len(modules),
                version_tag=_resolve_source_version_tag(cards),
            ),
            datasets=[_map_dataset(dataset) for dataset in datasets],
        )

    async def publish_validated_source(
        self,
        *,
        published_by_user_id: str,
        dataset_name: str | None = None,
        version_label: str | None = None,
        notes: str | None = None,
    ) -> PublicationActionResponse:
        source_cards = self.source_repository.load_validated_cards()
        if not source_cards:
            raise DeckPublicationServiceError("No validated cards are available for publication")
        cards = await self.audio_preparation_service.prepare_cards_for_publication(source_cards)
        now = datetime.now(UTC)
        dataset_name = dataset_name or self.default_dataset_name
        dataset_version_id = version_label or _build_dataset_version_id(dataset_name=dataset_name, published_at=now)
        module_rows, deck_rows = _build_publication_rows(
            cards=cards,
            dataset_version_id=dataset_version_id,
            published_at=now,
        )
        dataset_row = CardDatasetVersion(
            dataset_version_id=dataset_version_id,
            dataset_name=dataset_name,
            state="published",
            source_version_tag=_resolve_source_version_tag(cards),
            source_manifest_ref=_resolve_manifest_ref(cards),
            card_count=len(cards),
            deck_count=len(deck_rows),
            module_count=len(module_rows),
            published_by_user_id=published_by_user_id,
            created_at=now,
            published_at=now,
            notes=notes,
        )
        card_rows = [
            PublishedCard(
                dataset_version_id=dataset_version_id,
                card_id=card.id,
                content_type=card.content_type.value,
                path=card.path.value,
                domain=card.domain.value,
                profession=card.profession.track.value,
                level_band=card.level_band.value,
                difficulty=card.difficulty.value,
                version=card.version,
                version_tag=card.publication.version_tag,
                card_payload=card.model_dump(mode="json"),
                created_at=now,
            )
            for card in cards
        ]
        try:
            created = await self.published_repository.create_dataset(
                dataset_row=dataset_row,
                card_rows=card_rows,
                deck_rows=deck_rows,
                module_rows=module_rows,
            )
        except (PublishedDatasetRepositoryError, ValidatedCardSourceRepositoryError) as exc:
            increment_metric("cards.dataset_publish_failed")
            raise DeckPublicationServiceError(str(exc)) from exc
        increment_metric("cards.dataset_published", dataset_name=dataset_name)
        log_card_event(
            "cards.dataset_published",
            dataset_version_id=created.dataset_version_id,
            dataset_name=created.dataset_name,
            card_count=created.card_count,
            deck_count=created.deck_count,
            module_count=created.module_count,
            published_by_user_id=published_by_user_id,
        )
        return PublicationActionResponse(dataset=_map_dataset(created))

    async def archive_dataset(self, dataset_version_id: str, *, archived_by_user_id: str) -> PublicationActionResponse:
        try:
            archived = await self.published_repository.archive_dataset(dataset_version_id, archived_at=datetime.now(UTC))
        except PublishedDatasetRepositoryError as exc:
            increment_metric("cards.dataset_archive_failed")
            raise DeckPublicationServiceError(str(exc)) from exc
        increment_metric("cards.dataset_archived")
        log_card_event(
            "cards.dataset_archived",
            dataset_version_id=archived.dataset_version_id,
            archived_by_user_id=archived_by_user_id,
        )
        return PublicationActionResponse(dataset=_map_dataset(archived))


def _build_dataset_version_id(*, dataset_name: str, published_at: datetime) -> str:
    return f"dataset.cards.{dataset_name}.{published_at.strftime('%Y%m%d%H%M%S')}"


def _resolve_source_version_tag(cards: list[CardEnvelope]) -> str:
    tags = sorted({card.publication.version_tag for card in cards})
    if len(tags) == 1:
        return tags[0]
    return f"mixed.{len(tags)}"


def _resolve_manifest_ref(cards: list[CardEnvelope]) -> str | None:
    manifests = sorted({card.publication.manifest_ref for card in cards if card.publication.manifest_ref})
    if len(manifests) == 1:
        return manifests[0]
    return None


def _build_publication_rows(
    *,
    cards: list[CardEnvelope],
    dataset_version_id: str,
    published_at: datetime,
) -> tuple[list[PublishedModule], list[PublishedDeck]]:
    grouped: dict[tuple[str, str, str, str, str], list[CardEnvelope]] = defaultdict(list)
    for card in cards:
        key = (
            card.path.value,
            card.domain.value,
            card.profession.track.value,
            card.level_band.value,
            card.content_type.value,
        )
        grouped[key].append(card)

    module_rows: list[PublishedModule] = []
    deck_rows: list[PublishedDeck] = []
    for path, domain, profession, level_band, content_type in sorted(grouped.keys()):
        grouped_cards = sorted(grouped[(path, domain, profession, level_band, content_type)], key=lambda item: item.id)
        module_id = f"module.cards.{path}.{profession}.{content_type}.{level_band.lower()}"
        deck_id = f"deck.cards.{path}.{profession}.{content_type}.{level_band.lower()}"
        module_rows.append(
            PublishedModule(
                dataset_version_id=dataset_version_id,
                module_id=module_id,
                title=_build_title(path, profession, content_type, level_band),
                description=f"Frozen published module for {content_type} cards.",
                path=path,
                domain=domain,
                profession=profession,
                level_band=level_band,
                content_type=content_type,
                lifecycle_state="published",
                card_ids=[card.id for card in grouped_cards],
                card_total=len(grouped_cards),
                created_at=published_at,
                published_at=published_at,
            )
        )
        deck_rows.append(
            PublishedDeck(
                dataset_version_id=dataset_version_id,
                deck_id=deck_id,
                title=_build_title(path, profession, content_type, level_band),
                description=f"Frozen published deck for {content_type} cards.",
                path=path,
                domain=domain,
                profession=profession,
                level_band=level_band,
                content_type=content_type,
                lifecycle_state="published",
                module_ids=[module_id],
                card_ids=[card.id for card in grouped_cards],
                card_total=len(grouped_cards),
                created_at=published_at,
                published_at=published_at,
            )
        )
    return module_rows, deck_rows


def _build_title(path: str, profession: str, content_type: str, level_band: str) -> str:
    label = "Professional" if path == "professional" else "General"
    if profession != "none":
        label = f"{label} {profession.replace('_', ' ').title()}"
    content = content_type.replace("_card", "").replace("_", " ").title()
    return f"{label} {content} {level_band}"


def _map_dataset(dataset: CardDatasetVersion) -> DatasetVersionResponse:
    return DatasetVersionResponse(
        dataset_version_id=dataset.dataset_version_id,
        dataset_name=dataset.dataset_name,
        state=dataset.state,
        source_version_tag=dataset.source_version_tag,
        card_count=dataset.card_count,
        deck_count=dataset.deck_count,
        module_count=dataset.module_count,
        created_at=dataset.created_at,
        published_at=dataset.published_at,
        archived_at=dataset.archived_at,
        notes=dataset.notes,
    )
