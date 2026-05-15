from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.runtime.cards_material_bank import CARD_BANK_CANONICAL_DIR


def _card_bank_root() -> Path:
    candidates = [
        CARD_BANK_CANONICAL_DIR,
        CARD_BANK_CANONICAL_DIR.parent,
        CARD_BANK_CANONICAL_DIR.parent.parent,
    ]

    for base in candidates:
        if (base / "overlays").exists() or (base / "option_translations").exists():
            return base

    # Common shape: apps/backend/card_bank/canonical_bank/published
    if CARD_BANK_CANONICAL_DIR.name == "published":
        return CARD_BANK_CANONICAL_DIR.parent.parent

    # Common shape: apps/backend/card_bank/canonical_bank
    if CARD_BANK_CANONICAL_DIR.name == "canonical_bank":
        return CARD_BANK_CANONICAL_DIR.parent

    return CARD_BANK_CANONICAL_DIR.parent


CARD_BANK_ROOT = _card_bank_root()
OVERLAY_ROOT = CARD_BANK_ROOT / "overlays"


def normalize_ui_language(value: Any) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""

    low = raw.replace("_", "-").lower()

    aliases = {
        "eng": "en",
        "english": "en",
        "zh": "zh-Hans",
        "zh-cn": "zh-Hans",
        "zh-hans": "zh-Hans",
        "zh-hans-cn": "zh-Hans",
        "filipino": "fil",
        "tl": "fil",
    }

    return aliases.get(low, low)


def _bucket_for(card: dict[str, Any]) -> str:
    ctype = str(card.get("content_type") or card.get("mode") or "").strip().lower()

    if "vocab" in ctype or ctype == "vocabulary":
        return "vocabulary"

    if "grammar" in ctype:
        return "grammar"

    if "sentence" in ctype or "phrase" in ctype:
        return "sentences"

    return "vocabulary"


def _level_for(card: dict[str, Any]) -> str:
    value = str(card.get("level_band") or card.get("level") or "a1_a2").strip().lower()
    value = value.replace("-", "_")
    return value or "a1_a2"


def _profession_for(card: dict[str, Any]) -> str:
    profession = str(card.get("profession") or "").strip().lower()
    domain = str(card.get("domain") or "").strip().lower()

    if not profession or profession in {"none", "general", "null"}:
        if domain.startswith("professional/"):
            profession = domain.split("/", 1)[1].strip()

    return profession


def _overlay_file_for(card: dict[str, Any], language: str) -> Path:
    bucket = _bucket_for(card)
    level = _level_for(card)
    profession = _profession_for(card)

    if profession and profession not in {"none", "general", "null"}:
        return OVERLAY_ROOT / "professional" / profession / bucket / level / f"{language}.json"

    return OVERLAY_ROOT / "general" / bucket / level / f"{language}.json"


def _iter_overlay_rows(value: Any, inherited_card_id: str | None = None):
    if isinstance(value, list):
        for item in value:
            yield from _iter_overlay_rows(item, inherited_card_id=inherited_card_id)
        return

    if not isinstance(value, dict):
        return

    # Direct row.
    if any(k in value for k in ("localized_text", "field_path", "field_role", "source_text")):
        row = dict(value)
        if inherited_card_id and not row.get("card_id"):
            row["card_id"] = inherited_card_id
        yield row
        return

    # Common wrapper shapes.
    for key in ("items", "rows", "entries", "translations"):
        inner = value.get(key)
        if isinstance(inner, list):
            for item in inner:
                yield from _iter_overlay_rows(item, inherited_card_id=inherited_card_id)
            return

    # Dict keyed by card_id.
    for key, inner in value.items():
        if isinstance(inner, (list, dict)):
            yield from _iter_overlay_rows(inner, inherited_card_id=str(key))


@lru_cache(maxsize=512)
def _load_overlay_by_file(path_str: str) -> dict[str, list[dict[str, Any]]]:
    path = Path(path_str)

    if not path.exists():
        return {}

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

    grouped: dict[str, list[dict[str, Any]]] = {}

    for item in _iter_overlay_rows(raw):
        if not isinstance(item, dict):
            continue

        card_id = str(item.get("card_id") or item.get("id") or "").strip()
        localized_text = str(item.get("localized_text") or "").strip()

        if not card_id or not localized_text:
            continue

        grouped.setdefault(card_id, []).append(item)

    return grouped


def _set_follow_up_prompt(card: dict[str, Any], text: str) -> None:
    card["prompt"] = text
    card["follow_up_prompt"] = text

    served = card.get("served_follow_up")
    if isinstance(served, dict):
        served["prompt"] = text

    follow_up = card.get("follow_up")
    if isinstance(follow_up, dict):
        follow_up["prompt"] = text


def _set_simple_field(card: dict[str, Any], field_role: str, field_path: str, text: str) -> bool:
    role = field_role.lower()
    path = field_path.lower()

    if "prompt" in role or "prompt" in path or "question" in role:
        _set_follow_up_prompt(card, text)
        return True

    if "hint" in role or path.endswith(".hint"):
        card["hint"] = text
        return True

    if "explanation" in role or "explanation" in path:
        card["explanation"] = text
        return True

    # Do not patch options here. Options are handled by the final shared
    # source_hash option cache so incomplete/stale overlay option rows cannot
    # override the complete final option bank.
    return False


def apply_runtime_card_overlay(card: dict[str, Any], *, ui_language: Any) -> dict[str, Any]:
    language = normalize_ui_language(ui_language)

    card["ui_language"] = language or None
    card["overlay_applied"] = False
    card["overlay_language"] = None
    card["overlay_item_count"] = 0
    card["overlay_localized_option_count"] = 0
    card["overlay_incomplete"] = False

    if not language:
        return card

    overlay_path = _overlay_file_for(card, language)

    try:
        card["overlay_catalog_path"] = str(overlay_path.relative_to(CARD_BANK_ROOT))
    except ValueError:
        card["overlay_catalog_path"] = str(overlay_path)

    entries = _load_overlay_by_file(str(overlay_path)).get(str(card.get("id") or "").strip(), [])
    if not entries:
        return card

    applied = 0

    for entry in entries:
        text = str(entry.get("localized_text") or "").strip()
        if not text:
            continue

        field_path = str(entry.get("field_path") or "").strip()
        field_role = str(entry.get("field_role") or "").strip()

        if _set_simple_field(card, field_role, field_path, text):
            applied += 1

    card["overlay_item_count"] = len(entries)
    card["overlay_applied"] = applied > 0
    card["overlay_language"] = language if applied else None

    return card
