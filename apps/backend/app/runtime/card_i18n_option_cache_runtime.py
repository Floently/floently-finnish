from __future__ import annotations

import hashlib
import gzip
import json
from functools import lru_cache
from typing import Any

from app.runtime.cards_material_bank import CARD_BANK_CANONICAL_DIR
from app.runtime.card_i18n_overlay_runtime import normalize_ui_language

def _option_translation_root():
    candidates = [
        CARD_BANK_CANONICAL_DIR,
        CARD_BANK_CANONICAL_DIR.parent,
        CARD_BANK_CANONICAL_DIR.parent.parent,
    ]

    for base in candidates:
        path = base / "option_translations"
        if path.exists():
            return path

    if CARD_BANK_CANONICAL_DIR.name == "published":
        return CARD_BANK_CANONICAL_DIR.parent.parent / "option_translations"

    if CARD_BANK_CANONICAL_DIR.name == "canonical_bank":
        return CARD_BANK_CANONICAL_DIR.parent / "option_translations"

    return CARD_BANK_CANONICAL_DIR.parent / "option_translations"


OPTION_TRANSLATION_ROOT = _option_translation_root()


def _source_hash(text: Any) -> str:
    return hashlib.sha256(str(text or "").strip().encode("utf-8")).hexdigest()


@lru_cache(maxsize=64)
def _load_option_translation_cache(language: str) -> dict[str, str]:
    json_path = OPTION_TRANSLATION_ROOT / f"{language}.json"
    gzip_path = OPTION_TRANSLATION_ROOT / f"{language}.json.gz"

    try:
        if json_path.exists():
            data = json.loads(json_path.read_text(encoding="utf-8"))
        elif gzip_path.exists():
            with gzip.open(gzip_path, "rt", encoding="utf-8") as f:
                data = json.load(f)
        else:
            return {}
    except Exception:
        return {}

    items = data.get("items")
    if not isinstance(items, dict):
        return {}

    out: dict[str, str] = {}

    for source_hash, value in items.items():
        if not isinstance(source_hash, str):
            continue

        if isinstance(value, dict):
            localized = value.get("localized_text")
        else:
            localized = value

        if isinstance(localized, str) and localized.strip():
            out[source_hash.strip()] = localized.strip()

    return out


def _patch_options(options: Any, cache: dict[str, str], answer_key: Any = None) -> tuple[int, str | None]:
    if not isinstance(options, list):
        return 0, None

    changed = 0
    answer_text: str | None = None
    answer_key_str = str(answer_key or "").strip()

    for option in options:
        if not isinstance(option, dict):
            continue

        current_text = str(option.get("text") or "").strip()
        if not current_text:
            continue

        translated = cache.get(_source_hash(current_text))
        if not translated:
            continue

        option["text"] = translated
        changed += 1

        option_id = str(option.get("option_id") or option.get("id") or "").strip()
        if answer_key_str and option_id == answer_key_str:
            answer_text = translated

    return changed, answer_text


def apply_runtime_option_translations(card: dict[str, Any], *, ui_language: Any) -> dict[str, Any]:
    """Translate MCQ option labels from the shared source_hash option cache.

    Prompt/gloss overlays are handled by card_i18n_overlay_runtime.
    This layer only patches option text, answer_text, and choices.
    Missing cache entries safely fall back to canonical option text.
    """
    language = normalize_ui_language(ui_language)

    card["option_translation_language"] = language or None
    card["option_translation_applied_count"] = 0
    card["option_translation_applied"] = False

    if not language:
        return card

    cache = _load_option_translation_cache(language)
    if not cache:
        return card

    applied = 0

    served = card.get("served_follow_up")
    if isinstance(served, dict):
        changed, answer_text = _patch_options(
            served.get("options"),
            cache,
            served.get("answer_key"),
        )
        applied += changed

        if answer_text:
            served["answer_text"] = answer_text

        served_options = served.get("options")
        if isinstance(served_options, list):
            card["choices"] = [
                str(option.get("text") or "").strip()
                for option in served_options
                if isinstance(option, dict) and str(option.get("text") or "").strip()
            ]

    follow_up = card.get("follow_up")
    if isinstance(follow_up, dict):
        changed, answer_text = _patch_options(
            follow_up.get("options"),
            cache,
            follow_up.get("answer_key"),
        )
        applied += changed

        if answer_text:
            follow_up["answer_text"] = answer_text

    card["option_translation_applied_count"] = applied
    card["option_translation_applied"] = applied > 0

    return card
