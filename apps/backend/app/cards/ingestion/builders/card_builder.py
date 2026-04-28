from __future__ import annotations

from copy import deepcopy
import random

from app.cards.fixtures.sample_payloads import (
    GENERAL_SENTENCE_CARD_PAYLOAD,
    GRAMMAR_CARD_PAYLOAD,
    PROFESSIONAL_VOCABULARY_CARD_PAYLOAD,
    VOCABULARY_CARD_PAYLOAD,
)
from app.cards.ingestion.errors import BuilderError
from app.cards.ingestion.normalizers.models import (
    IngestionSourceProfile,
    NormalizedGrammarItem,
    NormalizedSentenceItem,
    NormalizedVocabularyItem,
)
from app.cards.ingestion.normalizers.text_utils import normalized_text_variants, normalize_whitespace
from app.cards.schemas.common import LearningPath


def build_card_payload(normalized_item) -> dict:
    if isinstance(normalized_item, NormalizedVocabularyItem):
        return _build_vocabulary_card(normalized_item)
    if isinstance(normalized_item, NormalizedSentenceItem):
        return _build_sentence_card(normalized_item)
    if isinstance(normalized_item, NormalizedGrammarItem):
        return _build_grammar_card(normalized_item)
    raise BuilderError("Unsupported normalized item type")


def _build_vocabulary_card(item: NormalizedVocabularyItem) -> dict:
    template = deepcopy(
        PROFESSIONAL_VOCABULARY_CARD_PAYLOAD if item.profile.path == LearningPath.professional else VOCABULARY_CARD_PAYLOAD
    )
    _apply_common_fields(template, item.profile, item.slug, item.item_index, item.level_band.value, item.difficulty.value, item.tags)
    template["content"]["front"] = {
        "term": item.term,
        "lemma": item.lemma,
        "part_of_speech": item.part_of_speech,
    }
    template["content"]["back"] = {
        "recall_prompt": "Which word did you just see?",
        "gloss": item.gloss,
        "example_sentence": item.example_sentence,
    }
    recognition_options, recognition_answer_key = _shuffled_recognition_options(
        item.recognition_options,
        item.correct_answer,
        seed=f"{item.profile.source_id}|{item.slug}|{item.item_index}",
    )
    template["content"]["follow_ups"] = [
        {
            "variant_type": "recognition_mcq",
            "prompt": "Which word did you just see?",
            "options": recognition_options,
            "answer_key": recognition_answer_key,
            "accepted_variants": [],
            "evaluation_mode": "option_id",
        },
        {
            "variant_type": "typed_recall",
            "prompt": "Type the word you just saw.",
            "answer_key": item.correct_answer,
            "accepted_variants": normalized_text_variants(item.correct_answer),
            "evaluation_mode": "normalized_text",
        },
    ]
    template["content"]["explanation"] = {
        "summary": f"Recognition and recall practice for '{item.term}'.",
        "example": item.example_sentence,
    }
    return template


def _build_sentence_card(item: NormalizedSentenceItem) -> dict:
    template = deepcopy(GENERAL_SENTENCE_CARD_PAYLOAD)
    _apply_common_fields(template, item.profile, item.slug, item.item_index, item.level_band.value, item.difficulty.value, item.tags)
    template["content"]["front"] = {
        "sentence": item.sentence,
        "translation_hint": item.translation_hint,
    }
    template["content"]["back"] = {
        "recall_prompt": "Type the sentence you just saw.",
        "expected_sentence": item.sentence,
        "grammar_focus": item.grammar_focus,
    }
    template["content"]["follow_ups"] = [
        {
            "variant_type": "fill_in",
            "prompt": "Complete the missing part of the sentence.",
            "blank_template": item.blank_template,
            "answer_key": item.fill_target,
            "accepted_variants": normalized_text_variants(item.fill_target),
            "evaluation_mode": "normalized_text",
        }
    ]
    if len(item.sentence) <= 200:
        template["content"]["follow_ups"].append(
            {
                "variant_type": "typed_recall",
                "prompt": "Type the sentence you just saw.",
                "answer_key": item.sentence,
                "accepted_variants": normalized_text_variants(item.sentence),
                "evaluation_mode": "normalized_text",
            }
        )
    template["content"]["explanation"] = {
        "summary": "Sentence recall card generated from normalized Finnish source material.",
        "example": item.translation_hint or item.sentence,
    }
    return template


def _build_grammar_card(item: NormalizedGrammarItem) -> dict:
    template = deepcopy(GRAMMAR_CARD_PAYLOAD)
    _apply_common_fields(template, item.profile, item.slug, item.item_index, item.level_band.value, item.difficulty.value, item.tags)
    template["content"]["front"] = {
        "rule_label": item.rule_label,
        "pattern": item.pattern,
        "example": item.example,
    }
    template["content"]["back"] = {
        "recall_prompt": "Apply the grammar pattern to the gap.",
        "rule_summary": item.rule_summary,
        "target_form": item.target_form,
    }
    template["content"]["follow_ups"] = [
        {
            "variant_type": "grammar_application",
            "prompt": "Write the correct form.",
            "stimulus_text": item.stimulus_text,
            "evaluation_basis": {
                "rule_id": f"rule.{item.focus}",
                "expected_feature": item.expected_feature,
                "evaluation_notes": normalize_whitespace(item.rule_summary),
            },
            "answer_key": item.target_form,
            "accepted_variants": normalized_text_variants(item.target_form),
            "evaluation_mode": "normalized_text",
        }
    ]
    template["content"]["explanation"] = {
        "summary": item.rule_summary,
        "example": item.example,
    }
    return template


def _apply_common_fields(
    payload: dict,
    profile: IngestionSourceProfile,
    slug: str,
    item_index: int,
    level_band: str,
    difficulty: str,
    tags: list[str],
) -> None:
    payload["id"] = _build_card_id(payload["content_type"], profile, slug, item_index)
    payload["version"] = profile.card_version
    payload["path"] = profile.path.value
    payload["domain"] = profile.domain.value
    payload["profession"] = profile.profession.model_dump(mode="json")
    payload["level_band"] = level_band
    payload["difficulty"] = difficulty
    payload["language"] = "fi"
    payload["source"] = {
        "source_id": profile.source_id,
        "kind": profile.source_kind.value,
        "origin_path": profile.origin_path,
        "authoring_note": profile.authoring_note,
    }
    payload["quality"] = {
        "status": profile.quality_status.value,
        "reviewer": profile.reviewer,
        "validation_checks": sorted(set(profile.validation_checks + ["schema_validation"])),
        "quality_score": profile.quality_score,
    }
    payload["tags"] = tags
    payload["publication"] = {
        "state": "validated",
        "version_tag": profile.version_tag,
        "manifest_ref": profile.manifest_ref,
        "validation_passed": True,
        "published_at": None,
        "archived_at": None,
    }


def _build_card_id(content_type: str, profile: IngestionSourceProfile, slug: str, item_index: int) -> str:
    family = {
        "vocabulary_card": "vocab",
        "sentence_card": "sentence",
        "grammar_card": "grammar",
    }[content_type]
    scope = profile.profession.slug or profile.path.value
    return f"card.{family}.{scope}.{slug}.{item_index:04d}"


def _answer_option_id(options: list[str], answer: str) -> str:
    for index, option in enumerate(options):
        if option == answer:
            return f"opt{index+1}"
    raise BuilderError("Recognition options do not contain the correct answer")


def _shuffled_recognition_options(options: list[str], correct_answer: str, *, seed: str) -> tuple[list[dict[str, str]], str]:
    option_rows = [{"option_id": f"opt{i+1}", "text": option} for i, option in enumerate(options)]
    answer_key = _answer_option_id(options, correct_answer)
    if len(option_rows) > 1:
        random.Random(seed).shuffle(option_rows)
    for option in option_rows:
        if option["option_id"] == answer_key:
            return option_rows, answer_key
    raise BuilderError("Recognition options lost the correct answer during shuffle")
