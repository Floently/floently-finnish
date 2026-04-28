
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from .config import PipelineConfig


ENGLISH_STOPWORDS = {
    "a","an","and","are","as","at","be","because","by","can","for","from","get","give","go","has","have","if","in",
    "into","is","it","like","of","on","or","patient","should","so","the","their","there","this","to","up","was","what",
    "when","where","which","with","would","you","your","someone","something","do","did","done","during","after","before"
}
FINNISH_HINTS = {"ää", "ö", "ä", "ssa", "ssä", "sta", "stä", "lla", "llä", "ksi", "tta", "ttä", "inen", "minen", "vat", "vät", "nut", "nyt", "ko", "kö"}


@dataclass
class ValidationResult:
    accepted: list[Any]
    rejected: list[dict[str, Any]]
    report: dict[str, Any]


def validate_items(items: list[Any], manifest: dict[str, Any], config: PipelineConfig) -> ValidationResult:
    accepted: list[Any] = []
    rejected: list[dict[str, Any]] = []
    thresholds = config.thresholds
    max_term_length = int(thresholds.get("max_term_length", 80))
    max_sentence_length = int(thresholds.get("max_sentence_length", 320))
    max_pattern_length = int(thresholds.get("max_pattern_length", 120))
    min_quality_score = float(thresholds.get("min_quality_score", 0.6))

    for item in items:
        score = float(item.score_seed)
        reasons: list[str] = []
        fields = item.fields
        joined = " ".join(str(v) for v in fields.values())
        if "..." in joined or joined.strip() in {"", "unknown"}:
            reasons.append("placeholder_or_unknown_content")
        if item.item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
            term = fields.get("term", "")
            meaning = fields.get("meaning", "")
            if not term or not meaning:
                reasons.append("missing_term_or_meaning")
            if len(term) > max_term_length:
                reasons.append("term_too_long")
            if len(term.split()) > 10:
                score -= 0.2
                reasons.append("term_excessively_long")
            if term and meaning and term.lower() == meaning.lower():
                reasons.append("term_equals_meaning")
            if is_probably_english_source(term, item.item_type):
                score -= 0.2
                reasons.append("term_looks_english_or_not_finnish")
            if is_probably_finnish_gloss(meaning):
                score -= 0.15
                reasons.append("meaning_looks_finnish_not_english")
        elif item.item_type in {"phrase_card", "sentence_card", "idiom_card"}:
            sentence = fields.get("sentence", "")
            meaning = fields.get("meaning", "")
            if not sentence or not meaning:
                reasons.append("missing_sentence_or_meaning")
            if len(sentence) > max_sentence_length:
                reasons.append("sentence_too_long")
            if len(sentence.split()) < 2:
                score -= 0.2
                reasons.append("sentence_too_short")
            if sentence and meaning and sentence.lower() == meaning.lower():
                reasons.append("sentence_equals_meaning")
            if is_probably_english_source(sentence, item.item_type):
                score -= 0.25
                reasons.append("sentence_looks_english_or_not_finnish")
            if is_probably_finnish_gloss(meaning):
                score -= 0.15
                reasons.append("meaning_looks_finnish_not_english")
        elif item.item_type == "grammar_card":
            pattern = fields.get("pattern", "")
            usage = fields.get("usage", "")
            example_fi = fields.get("example_fi", "")
            meaning = fields.get("meaning", "")
            if not all(fields.get(k) for k in ["pattern", "usage", "example_fi", "meaning"]):
                reasons.append("missing_grammar_core_field")
            if len(pattern) > max_pattern_length:
                reasons.append("pattern_too_long")
            if is_probably_english_source(example_fi, "sentence_card"):
                score -= 0.25
                reasons.append("grammar_example_looks_english_or_not_finnish")
            if is_probably_finnish_gloss(meaning):
                score -= 0.15
                reasons.append("grammar_meaning_looks_finnish_not_english")
            if meaning and len(meaning.split()) < 2:
                score -= 0.1
                reasons.append("grammar_meaning_too_short")
            if not usage.strip():
                reasons.append("missing_usage")
        else:
            reasons.append("unknown_item_type")

        if manifest.get("language") != "fi":
            score -= 0.05
            reasons.append("non_default_language")

        if score < min_quality_score:
            reasons.append("quality_below_threshold")

        hard_fail_markers = {
            "missing_term_or_meaning","missing_sentence_or_meaning","missing_grammar_core_field","term_too_long",
            "sentence_too_long","pattern_too_long","unknown_item_type","term_equals_meaning","sentence_equals_meaning",
            "term_looks_english_or_not_finnish","sentence_looks_english_or_not_finnish","grammar_example_looks_english_or_not_finnish"
        }
        if reasons and any(reason in hard_fail_markers for reason in reasons):
            rejected.append({
                "reason": "validation_failure",
                "item_type": item.item_type,
                "fields": fields,
                "quality_score": round(score, 3),
                "reasons": reasons,
            })
            continue

        item.score_seed = round(score, 3)
        item.needs_review = bool(item.needs_review or score < 0.8)
        accepted.append(item)

    report = {
        "input_count": len(items),
        "accepted_count": len(accepted),
        "rejected_count": len(rejected),
    }
    return ValidationResult(accepted=accepted, rejected=rejected, report=report)


def is_probably_english_source(text: str, item_type: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    tokens = re.findall(r"[a-zA-ZåäöÅÄÖ]+", lower)
    if not tokens:
        return False
    english_hits = sum(1 for t in tokens if t in ENGLISH_STOPWORDS)
    finnish_hits = sum(1 for hint in FINNISH_HINTS if hint in lower)
    if item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        return False if finnish_hits > 0 else (english_hits >= 2 and len(tokens) >= 2)
    return english_hits >= 2 and finnish_hits == 0


def is_probably_finnish_gloss(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    finnish_hits = sum(1 for hint in FINNISH_HINTS if hint in lower)
    english_hits = sum(1 for t in re.findall(r"[a-zA-ZåäöÅÄÖ]+", lower) if t in ENGLISH_STOPWORDS)
    return finnish_hits >= 2 and english_hits == 0
