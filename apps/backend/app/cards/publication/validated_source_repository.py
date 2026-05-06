from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from app.cards.schemas import CardEnvelope, validate_card_payload
from app.cards.schemas.publication import PublicationState


class ValidatedCardSourceRepositoryError(RuntimeError):
    """Raised when canonical card-bank data is unreadable or not publishable."""


class ValidatedCardSourceRepository:
    """Loads validated cards from the user-owned card_bank authority.

    The card bank is the only file-backed authority for card material. Older
    generated/source folders are not read here.
    """

    def __init__(self, canonical_root: Path | None = None):
        from app.core.paths import CARD_BANK_CANONICAL_DIR

        self.canonical_root = canonical_root or CARD_BANK_CANONICAL_DIR

    def load_validated_cards(self) -> list[CardEnvelope]:
        cards: dict[str, CardEnvelope] = {}
        for source_path, payload in _iter_canonical_payloads(self.canonical_root):
            for card in _load_card_payloads(source_path, payload):
                cards[card.id] = card
        return sorted(cards.values(), key=lambda card: card.id)

    def get_cards(
        self,
        *,
        domain=None,
        content_type=None,
        profession=None,
        level_band=None,
    ) -> list[CardEnvelope]:
        filtered: list[CardEnvelope] = []
        for card in self.load_validated_cards():
            if domain is not None and card.path != domain:
                continue
            if content_type is not None and card.content_type != content_type:
                continue
            if profession is not None and card.profession.track != profession:
                continue
            if level_band is not None and card.level_band != level_band:
                continue
            filtered.append(card)
        return filtered


def _payload_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict) and isinstance(payload.get("cards"), list):
        return [item for item in payload["cards"] if isinstance(item, dict)]
    if isinstance(payload, dict):
        return [payload]
    return []


def _iter_canonical_payloads(canonical_root: Path) -> Iterable[tuple[Path, Any]]:
    published_root = canonical_root / "validated"
    if published_root.exists():
        for source_path in sorted(published_root.rglob("*.json")):
            try:
                yield source_path, json.loads(source_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                raise ValidatedCardSourceRepositoryError(
                    f"Canonical card source is not valid JSON: {source_path}: {exc}"
                ) from exc

    accepted_items_path = canonical_root / "reports" / "accepted_items.jsonl"
    if accepted_items_path.exists():
        try:
            with accepted_items_path.open("r", encoding="utf-8") as handle:
                for index, line in enumerate(handle, start=1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        yield accepted_items_path, json.loads(line)
                    except json.JSONDecodeError as exc:
                        raise ValidatedCardSourceRepositoryError(
                            f"Canonical accepted item is not valid JSONL at line {index}: {accepted_items_path}: {exc}"
                        ) from exc
        except OSError as exc:
            raise ValidatedCardSourceRepositoryError(
                f"Canonical accepted-items source is unreadable: {accepted_items_path}: {exc}"
            ) from exc


def _load_card_payloads(source_path: Path, payload: Any) -> tuple[CardEnvelope, ...]:
    cards: list[CardEnvelope] = []
    for index, item in enumerate(_payload_items(payload)):
        try:
            card = validate_card_payload(item)
        except Exception as exc:
            raise ValidatedCardSourceRepositoryError(
                f"Canonical card at index {index} is not valid APS: {source_path}: {exc}"
            ) from exc
        if card.publication.validation_passed is not True:
            continue
        if card.publication.state not in {PublicationState.validated, PublicationState.published}:
            continue
        cards.append(card)
    return tuple(cards)
