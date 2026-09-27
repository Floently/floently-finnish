from __future__ import annotations

import gzip
import hashlib
import json
import re
import copy
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
QUALITY_GATE_ROOT = OPTION_TRANSLATION_ROOT.parent / "quality_gates"
OPTION_QUARANTINE_HASHES_PATH = QUALITY_GATE_ROOT / "option_cache_quarantine_hashes.json.gz"

ENGLISH_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "when", "while", "because",
    "before", "after", "with", "without", "from", "into", "out", "this",
    "that", "these", "those", "he", "she", "they", "them", "his", "her",
    "their", "your", "our", "my", "should", "would", "could", "cannot",
    "be", "been", "being", "was", "were", "which", "where", "why", "how",
    "what", "right", "needs", "needed", "required", "recover", "recovery",
    "referral", "wheelchair", "walker", "treatment", "medication",
    "medicine", "surgery", "doctor", "nurse", "patient", "discharged",
    "emergency", "painkiller", "headache", "standing", "quickly", "slowly",
    "called", "explained", "thought", "implemented", "prepared", "failure",
    "monitoring", "screening", "training", "learning", "working", "booking",
    "dressing", "breathing", "washing", "feeding", "walking", "imaging",
    "testing", "coaching", "counseling", "cleaning", "examining", "matching",
    "finding", "calling", "rising", "flying", "shopping", "living", "making",
    "taking", "giving", "using", "covering", "rinsing", "go", "get", "take",
    "make", "use", "see", "come", "help", "safe", "ready", "decision",
    "capacity", "quality", "interest", "support", "care", "careful", "home",
    "work", "workplace", "team", "meeting", "study", "research", "advice",
    "payment", "contract", "investment", "strategy", "budget", "project",
}

ALLOWLIST_UPPER = {
    "ECG", "EKG", "MRI", "CT", "HIV", "INR", "MRSA", "ESBL", "SSRI",
    "CVC", "CPAP", "COPD", "ADHD", "DBS", "JIT", "SPIKES", "M2",
}

MIXED_PATTERNS = [
    re.compile(r"\btill\s+(recover|avoid|do|get|take|see|make|use|help|come|go)\b", re.I),
    re.compile(r"\bcan be\b", re.I),
    re.compile(r"\bmust be\b", re.I),
    re.compile(r"\bmåste be\b", re.I),
    re.compile(r"\b(discharge|discharged)\b", re.I),
    re.compile(r"\bpatientenen\b", re.I),
    re.compile(r"\bfölja-upp\b", re.I),
    re.compile(r"\b[A-Za-zÅÄÖåäö]+ttu\b"),
    re.compile(r"\b[A-Za-z]+ing\b"),
    re.compile(r"\b[A-Za-z]+(?:'s|’s)\b"),
]

TOKEN_RE = re.compile(r"[A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö'’\-]*")


def _source_hash(text: Any) -> str:
    return hashlib.sha256(str(text or "").strip().encode("utf-8")).hexdigest()


@lru_cache(maxsize=1)
def _load_option_quarantine_hashes() -> dict[str, set[str]]:
    if not OPTION_QUARANTINE_HASHES_PATH.exists():
        return {}

    try:
        with gzip.open(OPTION_QUARANTINE_HASHES_PATH, "rt", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return {}

    raw_languages = data.get("languages") if isinstance(data, dict) else None
    if not isinstance(raw_languages, dict):
        return {}

    out: dict[str, set[str]] = {}
    for language, hashes in raw_languages.items():
        if not isinstance(language, str) or not isinstance(hashes, list):
            continue
        out[language.strip()] = {
            str(value).strip()
            for value in hashes
            if str(value).strip()
        }

    return out


def _looks_contaminated(language: str, source_text: str, localized_text: str) -> bool:
    if language == "en":
        return False

    text = str(localized_text or "")
    if not text.strip():
        return False

    raw_tokens = [m.group(0) for m in TOKEN_RE.finditer(text)]
    lower_tokens = [t.lower().strip("'’") for t in raw_tokens]

    for raw, token in zip(raw_tokens, lower_tokens):
        if raw.isupper() and raw in ALLOWLIST_UPPER:
            continue
        if token in ENGLISH_WORDS:
            return True

    for pattern in MIXED_PATTERNS:
        if pattern.search(text):
            return True

    source_tokens = {
        m.group(0).lower().strip("'’")
        for m in TOKEN_RE.finditer(str(source_text or ""))
        if len(m.group(0)) >= 4
    }
    target_tokens = {
        m.group(0).lower().strip("'’")
        for m in TOKEN_RE.finditer(text)
        if len(m.group(0)) >= 4
    }

    for token in source_tokens & target_tokens:
        if (
            token in ENGLISH_WORDS
            or token.endswith("ing")
            or token.endswith("tion")
            or token.endswith("ment")
            or token.endswith("ness")
            or token.endswith("able")
            or token.endswith("ible")
        ):
            return True

    return False


def _is_quarantined_option(language: str, source_hash: str, source_text: str, localized_text: str) -> bool:
    if language == "en":
        return False

    quarantine = _load_option_quarantine_hashes()
    if source_hash in quarantine.get(language, set()):
        return True

    return _looks_contaminated(language, source_text, localized_text)


@lru_cache(maxsize=64)
def _load_option_translation_cache(language: str) -> dict[str, dict[str, str]]:
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

    out: dict[str, dict[str, str]] = {}

    for source_hash, value in items.items():
        if not isinstance(source_hash, str):
            continue

        localized = None
        source_text = None

        if isinstance(value, dict):
            localized = value.get("localized_text")
            source_text = value.get("source_text")
        else:
            localized = value

        if isinstance(localized, str) and localized.strip():
            out[source_hash.strip()] = {
                "localized_text": localized.strip(),
                "source_text": str(source_text or "").strip(),
            }

    return out


def _patch_options(
    options: Any,
    cache: dict[str, dict[str, str]],
    *,
    language: str,
    answer_key: Any = None,
) -> tuple[int, int, str | None]:
    if not isinstance(options, list):
        return 0, 0, None

    changed = 0
    quarantine_fallbacks = 0
    answer_text: str | None = None
    answer_key_str = str(answer_key or "").strip()

    for option in options:
        if not isinstance(option, dict):
            continue

        current_text = str(option.get("text") or "").strip()
        if not current_text:
            continue

        current_hash = _source_hash(current_text)
        entry = cache.get(current_hash)
        if not entry:
            continue

        localized_text = str(entry.get("localized_text") or "").strip()
        source_text = str(entry.get("source_text") or "").strip() or current_text

        if not localized_text:
            continue

        if _is_quarantined_option(language, current_hash, source_text, localized_text):
            translated = source_text
            quarantine_fallbacks += 1
        else:
            translated = localized_text

        if option.get("text") != translated:
            option["text"] = translated
            changed += 1

        option_id = str(option.get("option_id") or option.get("id") or "").strip()
        if answer_key_str and option_id == answer_key_str:
            answer_text = translated

    return changed, quarantine_fallbacks, answer_text


def apply_runtime_option_translations(card: dict[str, Any], *, ui_language: Any) -> dict[str, Any]:
    """Translate MCQ option labels from the shared source_hash option cache.

    Safety rule:
    - Clean localized option text may be served.
    - Quarantined/suspicious localized option text is not served.
    - Quarantined rows fall back to the full English source_text.
    """
    language = normalize_ui_language(ui_language)

    card["option_translation_language"] = language or None
    card["option_translation_applied_count"] = 0
    card["option_translation_applied"] = False
    card["option_translation_quarantine_fallback_count"] = 0
    card["option_translation_quarantine_fallback"] = False

    if not language:
        return card

    cache = _load_option_translation_cache(language)
    if not cache:
        return card

    applied = 0
    fallback_count = 0

    served = card.get("served_follow_up")
    if isinstance(served, dict):
        # Never mutate the cached/runtime follow-up object in place.
        # A shallow card copy can share served_follow_up/options across requests;
        # mutating it can leak one UI language's options into another language.
        served = copy.deepcopy(served)
        card["served_follow_up"] = served

        changed, fallbacks, answer_text = _patch_options(
            served.get("options"),
            cache,
            language=language,
            answer_key=served.get("answer_key"),
        )
        applied += changed
        fallback_count += fallbacks

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
        # Same safety rule for authored follow_up options.
        follow_up = copy.deepcopy(follow_up)
        card["follow_up"] = follow_up

        changed, fallbacks, answer_text = _patch_options(
            follow_up.get("options"),
            cache,
            language=language,
            answer_key=follow_up.get("answer_key"),
        )
        applied += changed
        fallback_count += fallbacks

        if answer_text:
            follow_up["answer_text"] = answer_text

    card["option_translation_applied_count"] = applied
    card["option_translation_applied"] = applied > 0
    card["option_translation_quarantine_fallback_count"] = fallback_count
    card["option_translation_quarantine_fallback"] = fallback_count > 0

    return card
