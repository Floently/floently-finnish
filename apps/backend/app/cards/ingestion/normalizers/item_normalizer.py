from __future__ import annotations

from typing import Any

from app.cards.schemas.common import CardContentType
from app.cards.ingestion.errors import NormalizationError
from app.cards.ingestion.normalizers.models import (
    IngestionSourceProfile,
    NormalizedGrammarItem,
    NormalizedSentenceItem,
    NormalizedVocabularyItem,
)
from app.cards.ingestion.normalizers.text_utils import (
    choose_sentence_gap,
    normalize_difficulty_band,
    normalize_level_band,
    normalize_whitespace,
    require_finnish_text,
    slugify_identifier,
)

_GRAMMAR_FOCUS_RULES: dict[str, dict[str, str]] = {
    "gen": {
        "rule_label": "Genitive form",
        "pattern": "talon, koulun, potilaan",
        "rule_summary": "Use the genitive to show ownership or relation.",
        "expected_feature": "genitive_case",
    },
    "inessive": {
        "rule_label": "Missa-form",
        "pattern": "talossa, koulussa, kaupungissa",
        "rule_summary": "Use the inessive form when something is inside a place.",
        "expected_feature": "inessive_case",
    },
    "missa": {
        "rule_label": "Missa-form",
        "pattern": "talossa, koulussa, kaupungissa",
        "rule_summary": "Use the inessive form when something is inside a place.",
        "expected_feature": "inessive_case",
    },
}


def normalize_raw_item(raw_item: dict[str, Any], *, item_index: int, profile: IngestionSourceProfile):
    if not isinstance(raw_item, dict):
        raise NormalizationError("Raw item must be a dict")

    _validate_scope_overrides(raw_item, profile)
    content_type = _detect_content_type(raw_item)

    if content_type == CardContentType.vocabulary_card:
        return _normalize_vocabulary_item(raw_item, item_index=item_index, profile=profile)
    if content_type == CardContentType.sentence_card:
        return _normalize_sentence_item(raw_item, item_index=item_index, profile=profile)
    if content_type == CardContentType.grammar_card:
        return _normalize_grammar_item(raw_item, item_index=item_index, profile=profile)

    raise NormalizationError("Unsupported content type")


def _validate_scope_overrides(raw_item: dict[str, Any], profile: IngestionSourceProfile) -> None:
    raw_path = raw_item.get("path")
    if raw_path is not None and str(raw_path) != profile.path.value:
        raise NormalizationError("Raw item path conflicts with the ingestion profile")
    raw_domain = raw_item.get("domain")
    if raw_domain is not None and str(raw_domain) != profile.domain.value:
        raise NormalizationError("Raw item domain conflicts with the ingestion profile")
    raw_profession = raw_item.get("profession")
    if raw_profession is not None:
        if not isinstance(raw_profession, str) or raw_profession != profile.profession.track.value:
            raise NormalizationError("Raw item profession conflicts with the ingestion profile")


def _detect_content_type(raw_item: dict[str, Any]) -> CardContentType:
    raw_type = normalize_whitespace(str(raw_item.get("type") or "")).lower()
    if "focus" in raw_item and "example" in raw_item:
        return CardContentType.grammar_card
    if raw_type == "recognition":
        return CardContentType.vocabulary_card
    if raw_type in {"completion", "context_mcq"} and raw_item.get("full_sentence"):
        return CardContentType.sentence_card
    if "text" in raw_item:
        return CardContentType.sentence_card
    if "full_sentence" in raw_item:
        return CardContentType.sentence_card
    if any(key in raw_item for key in ("prompt", "term", "word")):
        return CardContentType.vocabulary_card
    raise NormalizationError("Unable to classify raw item as vocabulary, sentence, or grammar")


def _normalize_vocabulary_item(raw_item: dict[str, Any], *, item_index: int, profile: IngestionSourceProfile) -> NormalizedVocabularyItem:
    term_raw = raw_item.get("term") or raw_item.get("word") or raw_item.get("prompt")
    if not isinstance(term_raw, str) or not term_raw.strip():
        raise NormalizationError("Vocabulary item requires prompt/term/word")
    term = normalize_whitespace(term_raw)

    options = raw_item.get("options")
    if not isinstance(options, list) or len(options) < 2:
        raise NormalizationError("Vocabulary item requires at least two options for recognition_mcq")
    normalized_options = [normalize_whitespace(str(option)) for option in options if str(option).strip()]
    if len(normalized_options) < 2:
        raise NormalizationError("Vocabulary item options must contain at least two non-empty values")

    correct_answer_raw = raw_item.get("answer") or term
    if not isinstance(correct_answer_raw, str) or not correct_answer_raw.strip():
        raise NormalizationError("Vocabulary item requires a non-empty answer")
    correct_answer = normalize_whitespace(correct_answer_raw)
    if correct_answer not in normalized_options:
        raise NormalizationError("Vocabulary answer must be present in options")

    level_band = normalize_level_band(raw_item.get("level_band") or raw_item.get("difficulty"), profile.default_level_band)
    difficulty = normalize_difficulty_band(raw_item.get("difficulty_band"), level_band, profile.default_difficulty)

    tags = _normalize_tags(raw_item.get("tags"), fallback=[profile.domain.value, "vocabulary"])

    return NormalizedVocabularyItem(
        item_index=item_index,
        profile=profile,
        raw_input=raw_item,
        level_band=level_band,
        difficulty=difficulty,
        tags=tags,
        slug=slugify_identifier(term),
        term=term,
        lemma=normalize_whitespace(raw_item.get("lemma")) if isinstance(raw_item.get("lemma"), str) else term,
        part_of_speech=normalize_whitespace(raw_item.get("part_of_speech")) if isinstance(raw_item.get("part_of_speech"), str) else None,
        gloss=normalize_whitespace(raw_item.get("gloss")) if isinstance(raw_item.get("gloss"), str) else None,
        example_sentence=require_finnish_text(raw_item["example_sentence"], field_name="vocabulary.example_sentence")
        if isinstance(raw_item.get("example_sentence"), str)
        else None,
        recognition_options=normalized_options,
        correct_answer=correct_answer,
    )


def _normalize_sentence_item(raw_item: dict[str, Any], *, item_index: int, profile: IngestionSourceProfile) -> NormalizedSentenceItem:
    sentence_raw = raw_item.get("text") or raw_item.get("full_sentence")
    if not isinstance(sentence_raw, str) or not sentence_raw.strip():
        raise NormalizationError("Sentence item requires text or full_sentence")
    sentence = normalize_whitespace(sentence_raw)
    fill_target, blank_template = choose_sentence_gap(sentence)

    level_band = normalize_level_band(raw_item.get("level_band") or raw_item.get("difficulty"), profile.default_level_band)
    difficulty = normalize_difficulty_band(raw_item.get("difficulty_band"), level_band, profile.default_difficulty)
    tags = _normalize_tags(raw_item.get("tags"), fallback=[profile.domain.value, "sentence"])

    translation_hint = normalize_whitespace(raw_item.get("translation_hint")) if isinstance(raw_item.get("translation_hint"), str) else None

    return NormalizedSentenceItem(
        item_index=item_index,
        profile=profile,
        raw_input=raw_item,
        level_band=level_band,
        difficulty=difficulty,
        tags=tags,
        slug=slugify_identifier(sentence),
        sentence=sentence,
        translation_hint=translation_hint,
        grammar_focus=tags,
        fill_target=fill_target,
        blank_template=blank_template,
    )


def _normalize_grammar_item(raw_item: dict[str, Any], *, item_index: int, profile: IngestionSourceProfile) -> NormalizedGrammarItem:
    focus_raw = raw_item.get("focus")
    example_raw = raw_item.get("example")
    target_form_raw = raw_item.get("target_form") or raw_item.get("answer")
    stimulus_text_raw = raw_item.get("stimulus_text") or raw_item.get("prompt")

    if not isinstance(focus_raw, str) or not focus_raw.strip():
        raise NormalizationError("Grammar item requires focus")
    focus = normalize_whitespace(focus_raw).lower()
    if focus not in _GRAMMAR_FOCUS_RULES:
        raise NormalizationError(f"Unsupported grammar focus: {focus_raw}")
    if not isinstance(example_raw, str) or not example_raw.strip():
        raise NormalizationError("Grammar item requires example")
    example = require_finnish_text(example_raw, field_name="grammar.example")
    if not isinstance(target_form_raw, str) or not target_form_raw.strip():
        raise NormalizationError("Grammar item requires target_form or answer")
    target_form = require_finnish_text(target_form_raw, field_name="grammar.target_form")
    if not isinstance(stimulus_text_raw, str) or "___" not in str(stimulus_text_raw):
        raise NormalizationError("Grammar item requires stimulus_text containing '___'")
    stimulus_text = require_finnish_text(str(stimulus_text_raw), field_name="grammar.stimulus_text")

    level_band = normalize_level_band(raw_item.get("level_band") or raw_item.get("difficulty"), profile.default_level_band)
    difficulty = normalize_difficulty_band(raw_item.get("difficulty_band"), level_band, profile.default_difficulty)
    tags = _normalize_tags(raw_item.get("tags"), fallback=[profile.domain.value, focus, "grammar"])

    rule = _GRAMMAR_FOCUS_RULES[focus]

    return NormalizedGrammarItem(
        item_index=item_index,
        profile=profile,
        raw_input=raw_item,
        level_band=level_band,
        difficulty=difficulty,
        tags=tags,
        slug=slugify_identifier(f"{focus}.{target_form}"),
        focus=focus,
        rule_label=rule["rule_label"],
        pattern=normalize_whitespace(raw_item.get("pattern")) if isinstance(raw_item.get("pattern"), str) else rule["pattern"],
        rule_summary=normalize_whitespace(raw_item.get("rule_summary")) if isinstance(raw_item.get("rule_summary"), str) else rule["rule_summary"],
        example=example,
        target_form=target_form,
        stimulus_text=stimulus_text,
        expected_feature=rule["expected_feature"],
    )


def _normalize_tags(raw_tags: Any, *, fallback: list[str]) -> list[str]:
    if raw_tags is None:
        return fallback
    if not isinstance(raw_tags, list):
        raise NormalizationError("tags must be a list when provided")
    tags = [normalize_whitespace(str(tag)).lower().replace(" ", "_") for tag in raw_tags if str(tag).strip()]
    return tags or fallback
