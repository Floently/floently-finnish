from __future__ import annotations

from copy import deepcopy
import random

from app.cards.fixtures.sample_payloads import (
    GENERAL_SENTENCE_CARD_PAYLOAD,
    GRAMMAR_CARD_PAYLOAD,
    PROFESSIONAL_VOCABULARY_CARD_PAYLOAD,
    VOCABULARY_CARD_PAYLOAD,
)
from app.cards.ingestion.normalizers.text_utils import normalized_text_variants, normalize_whitespace, slugify_identifier
from app.cards.schemas import validate_card_payload


_PROFESSION_SCOPE = {
    "none": {"track": "none", "slug": None, "label": None},
    "doctor": {"track": "doctor", "slug": "doctor", "label": "Doctor"},
    "nurse": {"track": "nurse", "slug": "nurse", "label": "Nurse"},
    "practical_nurse": {
        "track": "practical_nurse",
        "slug": "practical_nurse",
        "label": "Practical Nurse",
    },
}


def map_kielitaika_card(raw_item: dict, *, item_index: int, source_origin: str) -> dict:
    content_type = str(raw_item["content_type"])
    if content_type == "vocabulary_card":
        payload = _build_vocabulary_card(raw_item, item_index=item_index)
    elif content_type == "sentence_card":
        payload = _build_sentence_card(raw_item)
    elif content_type == "grammar_card":
        payload = _build_grammar_card(raw_item)
    else:
        raise ValueError(f"Unsupported content_type: {content_type}")

    _apply_common_fields(payload, raw_item, item_index=item_index, source_origin=source_origin)
    return validate_card_payload(payload).model_dump(mode="json")


def _build_vocabulary_card(raw_item: dict, *, item_index: int) -> dict:
    template = deepcopy(
        PROFESSIONAL_VOCABULARY_CARD_PAYLOAD
        if str(raw_item["path"]) == "professional"
        else VOCABULARY_CARD_PAYLOAD
    )
    answer_key = _normalized_answer_key(raw_item)
    accepted_variants = _accepted_variants(raw_item)
    template["content"]["front"] = {
        "term": _clean_text(raw_item["front_text"]),
        "lemma": _clean_text(raw_item["front_text"]),
        "part_of_speech": _infer_part_of_speech(raw_item),
    }
    template["content"]["back"] = {
        "recall_prompt": _clean_text(raw_item["back_prompt"]),
        "gloss": answer_key,
        "example_sentence": None,
    }
    recognition_options, recognition_answer_key = _mcq_options_and_answer_key(raw_item, item_index=item_index)
    template["content"]["follow_ups"] = [
        {
            "variant_type": "recognition_mcq",
            "prompt": _follow_up_prompt(raw_item),
            "options": recognition_options,
            "answer_key": recognition_answer_key,
            "accepted_variants": [],
            "evaluation_mode": "option_id",
        },
        {
            "variant_type": "typed_recall",
            "prompt": "Type the answer in Finnish or English, depending on the prompt.",
            "answer_key": answer_key,
            "accepted_variants": accepted_variants,
            "evaluation_mode": "normalized_text",
        },
    ]
    template["content"]["explanation"] = {
        "summary": f"Imported vocabulary card for '{_clean_text(raw_item['front_text'])}'.",
        "example": raw_item.get("word"),
    }
    return template


def _build_sentence_card(raw_item: dict) -> dict:
    template = deepcopy(GENERAL_SENTENCE_CARD_PAYLOAD)
    sentence = _clean_text(raw_item["front_text"])
    answer_key = _normalized_answer_key(raw_item)
    template["content"]["front"] = {
        "sentence": sentence,
        "translation_hint": _clean_text(raw_item["back_prompt"]),
    }
    template["content"]["back"] = {
        "recall_prompt": _follow_up_prompt(raw_item),
        "expected_sentence": answer_key,
        "grammar_focus": _sentence_grammar_focus(raw_item),
    }
    template["content"]["follow_ups"] = [
        {
            "variant_type": "typed_recall",
            "prompt": _follow_up_prompt(raw_item),
            "answer_key": answer_key,
            "accepted_variants": _accepted_variants(raw_item),
            "evaluation_mode": "normalized_text",
        }
    ]
    template["content"]["explanation"] = {
        "summary": "Imported sentence recall card from normalized donor material.",
        "example": _clean_text(raw_item["back_prompt"]),
    }
    return template


def _build_grammar_card(raw_item: dict) -> dict:
    template = deepcopy(GRAMMAR_CARD_PAYLOAD)
    pattern = _clean_text(raw_item["front_text"])
    target_form = _normalized_answer_key(raw_item)
    rule_label = _infer_rule_label(raw_item)
    rule_id = slugify_identifier(f"{raw_item['id']}.{rule_label}")
    template["content"]["front"] = {
        "rule_label": rule_label,
        "pattern": pattern,
        "example": pattern,
    }
    template["content"]["back"] = {
        "recall_prompt": _follow_up_prompt(raw_item),
        "rule_summary": _clean_text(raw_item["back_prompt"]),
        "target_form": target_form,
    }
    template["content"]["follow_ups"] = [
        {
            "variant_type": "grammar_application",
            "prompt": _follow_up_prompt(raw_item),
            "stimulus_text": _clean_text((raw_item.get("served_follow_up") or {}).get("blank_template") or raw_item["front_text"]),
            "evaluation_basis": {
                "rule_id": f"rule.{rule_id}",
                "expected_feature": rule_label,
                "evaluation_notes": _clean_text(raw_item["back_prompt"]),
            },
            "answer_key": target_form,
            "accepted_variants": _accepted_variants(raw_item),
            "evaluation_mode": "normalized_text",
        }
    ]
    template["content"]["explanation"] = {
        "summary": _clean_text(raw_item["back_prompt"]),
        "example": pattern,
    }
    return template


def _apply_common_fields(payload: dict, raw_item: dict, *, item_index: int, source_origin: str) -> None:
    payload["id"] = _card_id(raw_item, item_index=item_index)
    payload["version"] = 1
    payload["path"] = str(raw_item["path"])
    payload["domain"] = str(raw_item["domain"])
    payload["profession"] = _PROFESSION_SCOPE[str(raw_item["profession"])]
    payload["level_band"] = str(raw_item["level_band"])
    payload["difficulty"] = str(raw_item["difficulty"])
    payload["language"] = "fi"
    payload["source"] = {
        "source_id": "source.kielitaika.normalized.cards",
        "kind": "imported_workspace",
        "origin_path": source_origin,
        "authoring_note": str(raw_item.get("_source_id") or "kielitaika normalized card authority"),
    }
    payload["quality"] = {
        "status": "reviewed",
        "reviewer": "material-convergence",
        "validation_checks": [
            "normalized_precheck",
            "schema_validation",
            "import_mapping",
        ],
        "quality_score": raw_item.get("_quality_score"),
    }
    payload["tags"] = _dedupe_tags(raw_item.get("tags") or [])
    payload["publication"] = {
        "state": "validated",
        "version_tag": "cards_kielitaika_import_2026_04",
        "manifest_ref": "manifest.kielitaika.normalized.cards",
        "validation_passed": True,
        "published_at": None,
        "archived_at": None,
    }


def _card_id(raw_item: dict, *, item_index: int) -> str:
    profession = str(raw_item["profession"])
    scope = profession if profession != "none" else str(raw_item["path"])
    stem = slugify_identifier(str(raw_item.get("front_text") or raw_item["id"]))
    family = {
        "vocabulary_card": "vocab",
        "sentence_card": "sentence",
        "grammar_card": "grammar",
    }[str(raw_item["content_type"])]
    return f"card.{family}.{scope}.{stem}.{item_index:04d}"


def _clean_text(value: object) -> str:
    return normalize_whitespace(str(value or ""))


def _accepted_variants(raw_item: dict) -> list[str]:
    answer_key = _normalized_answer_key(raw_item)
    values = []
    for candidate in raw_item.get("_accepted_variants") or []:
        text = _clean_text(candidate)
        if text and text != answer_key:
            values.append(text)
    if not values:
        values = normalized_text_variants(answer_key)
    deduped = []
    seen = {answer_key}
    for value in values:
        lowered = value.casefold()
        if lowered in seen:
            continue
        seen.add(lowered)
        deduped.append(value)
    if not deduped:
        deduped = normalized_text_variants(answer_key)
    return deduped


def _normalized_answer_key(raw_item: dict) -> str:
    return _clean_text(raw_item.get("_answer_value") or raw_item["front_text"])


def _follow_up_prompt(raw_item: dict) -> str:
    follow_up = raw_item.get("served_follow_up") or {}
    return _clean_text(follow_up.get("prompt") or raw_item["back_prompt"])


def _mcq_options(raw_item: dict) -> list[dict]:
    options = []
    for item in (raw_item.get("served_follow_up") or {}).get("options") or []:
        if not isinstance(item, dict):
            continue
        option_id = _clean_text(item.get("option_id"))
        text = _clean_text(item.get("text"))
        if option_id and text:
            options.append({"option_id": option_id, "text": text})
    if len(options) < 2:
        raise ValueError(f"Recognition MCQ card is missing options: {raw_item['id']}")
    return options


def _mcq_answer_key(raw_item: dict) -> str:
    accepted = [str(item) for item in raw_item.get("_accepted_variants") or []]
    options = {item["text"]: item["option_id"] for item in _mcq_options(raw_item)}
    for candidate in accepted:
        if candidate in options:
            return options[candidate]
    raise ValueError(f"Recognition MCQ card is missing a valid option answer key: {raw_item['id']}")


def _mcq_options_and_answer_key(raw_item: dict, *, item_index: int) -> tuple[list[dict], str]:
    options = _mcq_options(raw_item)
    answer_key = _mcq_answer_key(raw_item)
    shuffled = list(options)
    if len(shuffled) > 1:
        random.Random(f"{raw_item.get('id')}|{item_index}").shuffle(shuffled)
    option_ids = {item["option_id"] for item in shuffled}
    if answer_key not in option_ids:
        raise ValueError(f"Recognition MCQ card lost answer key after shuffle: {raw_item['id']}")
    return shuffled, answer_key


def _infer_part_of_speech(raw_item: dict) -> str | None:
    tags = {str(tag).lower() for tag in raw_item.get("tags") or []}
    for candidate in ("noun", "verb", "adjective", "adverb", "pronoun"):
        if candidate in tags:
            return candidate
    return None


def _sentence_grammar_focus(raw_item: dict) -> list[str]:
    tags = [slugify_identifier(str(tag)) for tag in raw_item.get("tags") or [] if str(tag).strip()]
    return tags[:3]


def _infer_rule_label(raw_item: dict) -> str:
    tags = [str(tag) for tag in raw_item.get("tags") or [] if str(tag).strip()]
    if tags:
        return tags[0]
    return "grammar_pattern"


def _dedupe_tags(tags: list[object]) -> list[str]:
    values: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        text = slugify_identifier(str(tag))
        if text not in seen:
            seen.add(text)
            values.append(text)
    return values[:12]
