from __future__ import annotations

import re
import unicodedata

from app.cards.schemas.common import DifficultyBand, LevelBand
from app.cards.ingestion.errors import NormalizationError

_TOKEN_RE = re.compile(r"[A-Za-zÅÄÖåäö]+")
_WHITESPACE_RE = re.compile(r"\s+")
_NON_ID_RE = re.compile(r"[^a-z0-9]+")

_FINNISH_HINT_WORDS = {
    "ja",
    "on",
    "olen",
    "mina",
    "sinä",
    "sina",
    "hän",
    "han",
    "me",
    "te",
    "he",
    "koti",
    "koulu",
    "espoossa",
    "potilas",
    "lääkäri",
    "laakari",
    "hoitaja",
    "kirja",
    "luokassa",
    "vastaanotolla",
}

_ENGLISH_HINT_WORDS = {
    "the",
    "and",
    "you",
    "have",
    "requested",
    "subject",
    "course",
    "days",
    "during",
    "this",
}

_FINNISH_SUFFIXES = ("ssa", "ssä", "lla", "llä", "sta", "stä", "ksi", "lle", "tta", "tta", "inen")

_LEVEL_MAP = {
    "A1": LevelBand.a1,
    "A2": LevelBand.a2,
    "A1_A2": LevelBand.a1_a2,
    "B1": LevelBand.b1,
    "B2": LevelBand.b2,
    "B1_B2": LevelBand.b1_b2,
    "C1": LevelBand.c1,
    "C2": LevelBand.c2,
    "C1_C2": LevelBand.c1_c2,
}

_DERIVED_DIFFICULTY = {
    LevelBand.a1: DifficultyBand.intro,
    LevelBand.a2: DifficultyBand.intro,
    LevelBand.a1_a2: DifficultyBand.intro,
    LevelBand.b1: DifficultyBand.core,
    LevelBand.b2: DifficultyBand.core,
    LevelBand.b1_b2: DifficultyBand.core,
    LevelBand.c1: DifficultyBand.stretch,
    LevelBand.c2: DifficultyBand.stretch,
    LevelBand.c1_c2: DifficultyBand.stretch,
}


def normalize_whitespace(value: str) -> str:
    return _WHITESPACE_RE.sub(" ", value.strip())


def slugify_identifier(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    cleaned = _NON_ID_RE.sub(".", ascii_text).strip(".")
    if not cleaned:
        raise NormalizationError("Cannot build deterministic identifier slug from empty text")
    if len(cleaned) < 3:
        cleaned = f"{cleaned}.id"
    return cleaned[:64]


def looks_like_finnish(text: str) -> bool:
    candidate = normalize_whitespace(text)
    lowered = candidate.lower()
    if any(ch in lowered for ch in "äöå"):
        return True

    tokens = _TOKEN_RE.findall(lowered)
    if not tokens:
        return False

    finnish_score = 0
    english_score = 0

    for token in tokens:
        if token in _FINNISH_HINT_WORDS:
            finnish_score += 2
        if token in _ENGLISH_HINT_WORDS:
            english_score += 2
        if token.endswith(_FINNISH_SUFFIXES):
            finnish_score += 1

    return finnish_score > english_score and finnish_score > 0


def require_finnish_text(text: str, *, field_name: str) -> str:
    normalized = normalize_whitespace(text)
    if not looks_like_finnish(normalized):
        raise NormalizationError(f"{field_name} must be recognized as Finnish")
    return normalized


def normalize_level_band(raw_value: str | None, default: LevelBand | None) -> LevelBand:
    if raw_value is None:
        if default is None:
            raise NormalizationError("level_band/difficulty is missing and no default level_band was supplied")
        return default
    key = normalize_whitespace(str(raw_value)).upper()
    if key not in _LEVEL_MAP:
        raise NormalizationError(f"Unsupported level value: {raw_value}")
    return _LEVEL_MAP[key]


def normalize_difficulty_band(raw_value: str | None, level_band: LevelBand, default: DifficultyBand | None) -> DifficultyBand:
    if raw_value is not None:
        lowered = normalize_whitespace(str(raw_value)).lower()
        if lowered in {item.value for item in DifficultyBand}:
            return DifficultyBand(lowered)
    if default is not None:
        return default
    return _DERIVED_DIFFICULTY[level_band]


def choose_sentence_gap(sentence: str) -> tuple[str, str]:
    tokens = sentence.split()
    candidates: list[tuple[int, str, str]] = []
    for index, token in enumerate(tokens):
        stripped = token.strip(".,!?;:")
        if len(stripped) >= 4 and stripped.isalpha():
            candidates.append((index, token, stripped))
    if not candidates:
        raise NormalizationError("Sentence does not contain a suitable fill-in target")
    index, original_token, stripped = candidates[-1]
    replacement = original_token.replace(stripped, "___", 1)
    blank_tokens = list(tokens)
    blank_tokens[index] = replacement
    blank_template = " ".join(blank_tokens)
    if "___" not in blank_template:
        raise NormalizationError("Sentence fill-in template generation failed")
    return stripped, blank_template


def normalized_text_variants(value: str) -> list[str]:
    normalized = normalize_whitespace(value)
    variants: list[str] = []
    lowered = normalized.lower()
    if lowered != normalized:
        variants.append(lowered)
    titlecased = normalized.title()
    if titlecased != normalized and titlecased not in variants:
        variants.append(titlecased)
    if not variants:
        variants.append(normalized.upper())
    return variants[:3]
