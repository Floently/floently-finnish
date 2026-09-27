from __future__ import annotations

import asyncio
import json
import tempfile
import unittest
from pathlib import Path

from app.cards.fixtures import VOCABULARY_CARD_PAYLOAD
from app.cards.publication.deck_publication_service import DeckPublicationService, DeckPublicationServiceError
from app.cards.publication.repository import PublishedDatasetRepositoryError
from app.cards.publication.validated_source_repository import ValidatedCardSourceRepository
from app.cards.runtime.rate_limit import CardRateLimitError, CardRateLimiter


class _NoOpAudioPreparationService:
    async def prepare_cards_for_publication(self, cards):
        return list(cards)


class _InMemoryPublishedRepository:
    def __init__(self) -> None:
        self.datasets = {}
        self.cards_by_dataset = {}

    async def create_dataset(self, *, dataset_row, card_rows, deck_rows, module_rows):
        if dataset_row.dataset_version_id in self.datasets:
            raise PublishedDatasetRepositoryError(
                f"Dataset version already exists: {dataset_row.dataset_version_id}"
            )
        self.datasets[dataset_row.dataset_version_id] = dataset_row
        self.cards_by_dataset[dataset_row.dataset_version_id] = list(card_rows)
        return dataset_row

    async def archive_dataset(self, dataset_version_id: str, *, archived_at):
        dataset = self.datasets.get(dataset_version_id)
        if dataset is None:
            raise PublishedDatasetRepositoryError(f"Unknown dataset version: {dataset_version_id}")
        dataset.state = "archived"
        dataset.archived_at = archived_at
        return dataset


class PublicationLifecycleTests(unittest.TestCase):
    def setUp(self) -> None:
        self._canonical_tmp = tempfile.TemporaryDirectory(prefix="kielivalmis-publication-lifecycle-")
        self.addCleanup(self._canonical_tmp.cleanup)

        self.canonical_root = Path(self._canonical_tmp.name)
        validated_dir = self.canonical_root / "validated" / "general" / "vocabulary"
        validated_dir.mkdir(parents=True, exist_ok=True)
        (validated_dir / "a1_a2.json").write_text(
            json.dumps([VOCABULARY_CARD_PAYLOAD]),
            encoding="utf-8",
        )

        self.repository = _InMemoryPublishedRepository()
        self.service = DeckPublicationService(
            source_repository=ValidatedCardSourceRepository(canonical_root=self.canonical_root),
            published_repository=self.repository,
            audio_preparation_service=_NoOpAudioPreparationService(),
        )
        self.source_card_count = len(self.service.source_repository.load_validated_cards())

    def test_publish_flow_creates_published_dataset(self) -> None:
        result = asyncio.run(
            self.service.publish_validated_source(
                published_by_user_id="admin.test.001",
                version_label="dataset.cards.lifecycle.v1",
            )
        )
        self.assertEqual(result.dataset.state, "published")
        self.assertEqual(result.dataset.dataset_version_id, "dataset.cards.lifecycle.v1")
        self.assertEqual(result.dataset.card_count, self.source_card_count)
        self.assertGreaterEqual(result.dataset.deck_count, 1)
        self.assertEqual(
            len(self.repository.cards_by_dataset["dataset.cards.lifecycle.v1"]),
            self.source_card_count,
        )

    def test_duplicate_publish_version_is_rejected(self) -> None:
        asyncio.run(
            self.service.publish_validated_source(
                published_by_user_id="admin.test.001",
                version_label="dataset.cards.lifecycle.v2",
            )
        )
        with self.assertRaises(DeckPublicationServiceError):
            asyncio.run(
                self.service.publish_validated_source(
                    published_by_user_id="admin.test.001",
                    version_label="dataset.cards.lifecycle.v2",
                )
            )

    def test_archive_marks_dataset_archived(self) -> None:
        created = asyncio.run(
            self.service.publish_validated_source(
                published_by_user_id="admin.test.001",
                version_label="dataset.cards.lifecycle.v3",
            )
        )
        archived = asyncio.run(
            self.service.archive_dataset(
                created.dataset.dataset_version_id,
                archived_by_user_id="admin.test.001",
            )
        )
        self.assertEqual(archived.dataset.state, "archived")
        self.assertIsNotNone(archived.dataset.archived_at)

    def test_card_rate_limiter_rejects_second_session_start_inside_window(self) -> None:
        limiter = CardRateLimiter(window_seconds=3600, session_start_limit=1, adaptive_start_limit=10, answer_limit=10)
        limiter.check_session_start("user.test.001")
        with self.assertRaises(CardRateLimitError):
            limiter.check_session_start("user.test.001")
