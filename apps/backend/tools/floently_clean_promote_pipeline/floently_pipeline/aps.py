from __future__ import annotations

from typing import Any

from .utils import deep_get, stable_hash


def build_aps_items(items: list[Any], manifest: dict[str, Any]) -> list[dict[str, Any]]:
    aps_items: list[dict[str, Any]] = []
    distractor_pool = _build_distractor_pool(items)
    for item in items:
        aps_items.append(_build_single_aps(item, manifest, distractor_pool))
    return aps_items


def _build_distractor_pool(items: list[Any]) -> dict[str, list[str]]:
    pool = {
        "vocabulary_card": [],
        "slang_card": [],
        "word_opposite_card": [],
        "word_similar_in_meaning_card": [],
        "phrase_card": [],
        "sentence_card": [],
        "idiom_card": [],
        "grammar_card": [],
    }
    for item in items:
        meaning = item.fields.get("meaning", "")
        if item.item_type in pool and meaning:
            pool[item.item_type].append(meaning)
    return pool


def _profession_block(profession: str | None) -> dict[str, Any]:
    if profession in (None, "none", "general"):
        return {"track": "none", "slug": None, "label": None}
    return {
        "track": "professional",
        "slug": profession,
        "label": profession.replace("_", " ").title(),
    }


def _build_single_aps(item: Any, manifest: dict[str, Any], pool: dict[str, list[str]]) -> dict[str, Any]:
    meta = getattr(item, "metadata", {}) or {}
    profession = meta.get("profession") or manifest.get("profession")
    path_value = meta.get("path") or manifest.get("path")
    domain = meta.get("domain") or manifest.get("domain")
    level_band = meta.get("level_band") or manifest.get("level_band")
    language = meta.get("language") or manifest.get("language")
    source_id = meta.get("source_id") or manifest.get("source_id")
    authoring_note = meta.get("authoring_note") or manifest.get("authoring_note") or source_id
    normalized_key = item.normalized_key
    id_suffix = stable_hash(item.item_type, path_value or "general", normalized_key, length=6)
    id_scope = profession if profession not in (None, "none", "general") else "general"
    card_id = f"card.{_short_type(item.item_type)}.{id_scope}.{normalized_key}.{id_suffix}"

    aps = {
        "id": card_id,
        "version": 1,
        "path": path_value,
        "domain": domain,
        "profession": _profession_block(profession),
        "level_band": level_band,
        "difficulty": _difficulty_from_level(level_band),
        "language": language,
        "source": {
            "source_id": source_id,
            "kind": "generated_or_recovered_batch",
            "origin_path": manifest.get("source_path"),
            "authoring_note": authoring_note,
        },
        "quality": {
            "status": "candidate" if item.needs_review else "prevalidated",
            "reviewer": None,
            "validation_checks": [
                "manifest_detection",
                "item_extraction",
                "normalization",
                "dedupe",
                "validation"
            ],
            "quality_score": round(float(item.score_seed), 3),
        },
        "tags": _tags_for_item(item, manifest),
        "publication": {
            "state": "candidate",
            "version_tag": None,
            "manifest_ref": source_id,
            "validation_passed": True,
            "published_at": None,
            "archived_at": None,
        },
        "content_type": item.item_type,
        "content": _content_for_item(item, pool),
    }
    return aps


def _short_type(item_type: str) -> str:
    return {
        "vocabulary_card": "vocab",
        "slang_card": "slang",
        "word_opposite_card": "opposite",
        "word_similar_in_meaning_card": "similar",
        "phrase_card": "phrase",
        "sentence_card": "sentence",
        "idiom_card": "idiom",
        "grammar_card": "grammar",
    }.get(item_type, "item")


def _difficulty_from_level(level_band: str | None) -> str:
    if level_band == "A1_A2":
        return "foundation"
    if level_band == "C1_C2":
        return "stretch"
    return "core"


def _tags_for_item(item: Any, manifest: dict[str, Any]) -> list[str]:
    meta = getattr(item, "metadata", {}) or {}
    tags = [str((meta.get("level_band") or manifest.get("level_band") or "B1_B2")).lower(), str(meta.get("domain") or manifest.get("domain") or "general")]
    profession = meta.get("profession") or manifest.get("profession")
    if profession and profession not in {"none", "general"}:
        tags.append(profession)
    if item.item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        tags.append("vocabulary_memory")
        if item.item_type == "slang_card":
            tags.append("slang")
    elif item.item_type in {"phrase_card", "sentence_card", "idiom_card"}:
        tags.append("communicative_sentence")
        if item.item_type == "idiom_card":
            tags.append("idiom")
    elif item.item_type == "grammar_card":
        tags.append("grammar_pattern")
    return tags


def _content_for_item(item: Any, pool: dict[str, list[str]]) -> dict[str, Any]:
    raw = item.raw_fragment if isinstance(item.raw_fragment, dict) else {}
    existing_follow = raw.get("served_follow_up")
    existing_prompt = raw.get("back_prompt")

    if item.item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        term = item.fields["term"]
        meaning = item.fields["meaning"]
        recall_prompt = existing_prompt or f"What does '{term}' mean?"
        follow_ups = []
        pool_key = item.item_type if item.item_type in pool else "vocabulary_card"
        if isinstance(existing_follow, dict):
            follow_ups.append(_normalize_existing_follow_up(existing_follow, meaning))
        else:
            follow_ups.append(_build_mcq(recall_prompt, meaning, pool.get(pool_key) or pool["vocabulary_card"]))
        follow_ups.append({
            "variant_type": "typed_recall",
            "prompt": "Type the meaning in English.",
            "answer_key": meaning,
            "accepted_variants": list(raw.get("_accepted_variants") or []),
            "evaluation_mode": "normalized_text",
        })
        return {
            "front": {"term": term, "lemma": term.lower(), "part_of_speech": None},
            "back": {
                "recall_prompt": recall_prompt,
                "gloss": meaning,
                "example_sentence": raw.get("example_fi"),
            },
            "prompt_family": raw.get("prompt_family") or ("slang_memory" if item.item_type == "slang_card" else "vocabulary_memory"),
            "follow_ups": follow_ups,
            "explanation": {"summary": f"Vocabulary card for '{term}'.", "example": term},
            "audio": raw.get("audio"),
            "validation": {"case_sensitive": False, "normalize_whitespace": True, "allow_partial_credit": False},
        }
    if item.item_type in {"phrase_card", "sentence_card", "idiom_card"}:
        sentence = item.fields["sentence"]
        meaning = item.fields["meaning"]
        return {
            "front": {"sentence": sentence},
            "back": {
                "recall_prompt": existing_prompt or "What does this Finnish sentence mean?",
                "gloss": meaning,
                "example_sentence": sentence,
            },
            "prompt_family": raw.get("prompt_family") or ("idiom_comprehension" if item.item_type == "idiom_card" else ("sentence_comprehension" if item.item_type == "sentence_card" else "phrase_comprehension")),
            "follow_ups": [
                _build_mcq("Choose the best meaning.", meaning, pool.get(item.item_type) or pool["phrase_card"]),
                {
                    "variant_type": "typed_recall",
                    "prompt": "Type the meaning in English.",
                    "answer_key": meaning,
                    "accepted_variants": list(raw.get("_accepted_variants") or []),
                    "evaluation_mode": "normalized_text",
                },
            ],
            "explanation": {"summary": "Communicative phrase card.", "example": sentence},
            "audio": raw.get("audio"),
            "validation": {"case_sensitive": False, "normalize_whitespace": True, "allow_partial_credit": False},
        }
    pattern = item.fields["pattern"]
    meaning = item.fields["meaning"]
    example_fi = item.fields["example_fi"]
    usage = item.fields["usage"]
    return {
        "front": {"pattern": pattern, "usage": usage},
        "back": {
            "recall_prompt": existing_prompt or f"What is the function of '{pattern}'?",
            "gloss": meaning,
            "example_sentence": example_fi,
        },
        "prompt_family": raw.get("prompt_family") or "grammar_pattern",
        "follow_ups": [
            _build_mcq(f"What does this example express? {example_fi}", meaning, pool["grammar_card"]),
            {
                "variant_type": "typed_recall",
                "prompt": "Describe the meaning or function in English.",
                "answer_key": meaning,
                "accepted_variants": list(raw.get("_accepted_variants") or []),
                "evaluation_mode": "normalized_text",
            },
        ],
        "explanation": {"summary": usage, "example": example_fi},
        "audio": raw.get("audio"),
        "validation": {"case_sensitive": False, "normalize_whitespace": True, "allow_partial_credit": False},
    }


def _normalize_existing_follow_up(existing_follow: dict[str, Any], answer: str) -> dict[str, Any]:
    options = []
    answer_key = None
    for idx, option in enumerate(existing_follow.get("options") or [], start=1):
        option_id = option.get("option_id") or f"o{idx}"
        text = option.get("text")
        options.append({"option_id": option_id, "text": text, "explanation": option.get("explanation")})
        if text == answer:
            answer_key = option_id
    if answer_key is None and options:
        for opt in options:
            if opt["text"] == answer:
                answer_key = opt["option_id"]
                break
    return {
        "variant_type": existing_follow.get("variant_type") or "recognition_mcq",
        "prompt": existing_follow.get("prompt") or "Choose the best answer.",
        "options": options,
        "answer_key": answer_key,
        "accepted_variants": [],
        "evaluation_mode": "option_id",
    }


def _build_mcq(prompt: str, answer: str, pool: list[str]) -> dict[str, Any]:
    distractors = []
    for candidate in pool:
        if candidate and candidate != answer and candidate not in distractors:
            distractors.append(candidate)
        if len(distractors) >= 3:
            break
    options_text = distractors[:]
    options_text.append(answer)
    options = []
    answer_key = None
    for idx, text in enumerate(options_text, start=1):
        option_id = f"o{idx}"
        if text == answer:
            answer_key = option_id
        options.append({"option_id": option_id, "text": text, "explanation": None})
    return {
        "variant_type": "recognition_mcq",
        "prompt": prompt,
        "options": options,
        "answer_key": answer_key,
        "accepted_variants": [],
        "evaluation_mode": "option_id",
    }
