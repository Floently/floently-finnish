from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

from .utils import deep_get, looks_like_sentence, normalize_space


VOCAB_LIKE_TYPES = {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}
PHRASE_LIKE_TYPES = {"phrase_card", "sentence_card", "idiom_card"}


def _compiled_prompt_gloss(prompt: str | None) -> str | None:
    prompt = normalize_space(str(prompt or ""))
    if not prompt:
        return None
    m = re.search(r"English:\s*[\"'](.+?)[\"']\s*->", prompt, flags=re.I)
    if m:
        return normalize_space(m.group(1))
    if "->" in prompt:
        left = normalize_space(prompt.split("->", 1)[0])
        left = re.sub(r"^(english:|meaning:|translation:)\s*", "", left, flags=re.I).strip(" '")
        if left and not left.lower().startswith("what does "):
            return left
    return None


def _fill_blank_template(template: str | None, answer: str | None) -> str | None:
    template = normalize_space(str(template or ""))
    answer = normalize_space(str(answer or ""))
    if not template:
        return None
    if answer and "___" in template:
        return normalize_space(template.replace("___", answer, 1))
    return template


def _first_text(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value
    return None


def _looks_like_vocab_term(text: str) -> bool:
    text = normalize_space(text)
    if not text:
        return False
    if text.endswith(("?", ".", "!")):
        return False
    words = text.split()
    return 1 <= len(words) <= 8


def _term_confidence(term: str, meaning: str) -> float:
    words = normalize_space(term).split()
    if len(words) == 1:
        return 0.95
    if len(words) <= 4:
        return 0.93
    return 0.88


@dataclass
class ExtractedItem:
    item_type: str
    core_fields: dict[str, Any]
    confidence: float
    notes: list[str]
    raw_fragment: Any
    needs_ai_help: bool = False


def extract_items(items: list[Any], manifest: dict[str, Any]) -> list[ExtractedItem]:
    extracted: list[ExtractedItem] = []
    batch_content_type = str(manifest.get("content_type") or "")
    for item in items:
        item_content_type = item.get("content_type") if isinstance(item, dict) else None
        content_type = str(item_content_type or batch_content_type or "")
        if content_type in VOCAB_LIKE_TYPES:
            extracted.append(_extract_vocab(item, content_type))
        elif content_type in PHRASE_LIKE_TYPES:
            extracted.append(_extract_phrase(item, content_type))
        elif content_type == "grammar_card":
            extracted.append(_extract_grammar(item))
        else:
            extracted.append(_extract_by_guess(item))
    return extracted


def _find_card(cards: list[Any], card_type: str) -> dict[str, Any] | None:
    for card in cards:
        if isinstance(card, dict) and card.get("type") == card_type:
            return card
    return None


def _extract_vocab(item: Any, item_type: str = "vocabulary_card") -> ExtractedItem:
    notes: list[str] = []
    if isinstance(item, str):
        if " - " in item:
            left, right = item.split(" - ", 1)
            term = normalize_space(left)
            meaning = normalize_space(right)
            return ExtractedItem(item_type, {"term": term, "meaning": meaning}, _term_confidence(term, meaning), ["parsed from delimited string"], item)
        return ExtractedItem(item_type, {}, 0.1, ["string item unsupported"], item, True)
    if not isinstance(item, dict):
        return ExtractedItem(item_type, {}, 0.1, ["non-dict item unsupported"], item, True)
    if isinstance(item.get("cards"), list):
        teach = _find_card(item.get("cards") or [], "teach_flip")
        if isinstance(teach, dict):
            term = deep_get(teach, "front", "fi")
            meaning = deep_get(teach, "front", "en")
            if term and meaning and _looks_like_vocab_term(str(term)):
                term_n = normalize_space(str(term))
                meaning_n = normalize_space(str(meaning))
                return ExtractedItem(item_type, {"term": term_n, "meaning": meaning_n}, 0.9, ["recovered from content-pack teach_flip card"], item)
    term = _first_text(item.get("term"), item.get("word"), item.get("front"), item.get("front_text"), item.get("text"), item.get("source_text"), item.get("finnish"), item.get("fi"), deep_get(item, "content", "front", "term"))
    meaning = _first_text(item.get("meaning"), item.get("gloss"), item.get("back"), item.get("translation"), item.get("english"), item.get("en"), item.get("target"), item.get("target_text"), item.get("_answer_value"), deep_get(item, "content", "back", "gloss"), deep_get(item, "content", "back", "meaning"))
    if term and meaning and _looks_like_vocab_term(str(term)):
        term_n = normalize_space(str(term))
        meaning_n = normalize_space(str(meaning))
        conf = _term_confidence(term_n, meaning_n)
        if {"term", "meaning"} <= set(item.keys()):
            conf = max(conf, 0.95)
        if "word" in item or "gloss" in item:
            notes.append("mapped word/gloss to term/meaning")
            conf = max(conf, 0.9)
        if "front" in item or "back" in item:
            notes.append("mapped front/back to term/meaning")
        if "_answer_value" in item or "front_text" in item:
            notes.append("mapped compiled card fields to term/meaning")
            conf = max(conf, 0.9)
        if "fi" in item or "en" in item:
            notes.append("mapped fi/en to term/meaning")
        if len(term_n.split()) > 1:
            notes.append("accepted multiword terminology item")
        return ExtractedItem(item_type, {"term": term_n, "meaning": meaning_n}, conf, notes, item)
    return ExtractedItem(item_type, {}, 0.25, ["could not recover vocabulary fields"], item, True)


def _extract_phrase(item: Any, item_type: str = "phrase_card") -> ExtractedItem:
    if isinstance(item, str):
        if " - " in item:
            left, right = item.split(" - ", 1)
            return ExtractedItem(item_type, {"sentence": normalize_space(left), "meaning": normalize_space(right)}, 0.7, ["parsed from delimited string"], item)
        return ExtractedItem(item_type, {}, 0.1, ["string item unsupported"], item, True)
    if not isinstance(item, dict):
        return ExtractedItem(item_type, {}, 0.1, ["non-dict item unsupported"], item, True)
    if isinstance(item.get("cards"), list):
        teach = _find_card(item.get("cards") or [], "teach_flip")
        if isinstance(teach, dict):
            sentence = deep_get(teach, "front", "fi")
            meaning = deep_get(teach, "front", "en")
            if sentence and meaning:
                return ExtractedItem(item_type, {"sentence": normalize_space(str(sentence)), "meaning": normalize_space(str(meaning))}, 0.9, ["recovered from content-pack teach_flip card"], item)
    sentence = _first_text(item.get("sentence"), item.get("phrase"), item.get("idiom"), item.get("fi"), item.get("front_text"), item.get("text"), item.get("source_text"), item.get("finnish"), item.get("template"), item.get("word"), deep_get(item, "content", "front", "sentence"))
    compiled_gloss = _compiled_prompt_gloss(item.get("back_prompt") or deep_get(item, "served_follow_up", "prompt") or deep_get(item, "content", "back", "recall_prompt"))
    meaning = _first_text(item.get("meaning"), item.get("translation"), item.get("en"), item.get("english"), item.get("target"), item.get("target_text"), compiled_gloss, deep_get(item, "content", "back", "gloss"), item.get("_answer_value"))
    if sentence and meaning:
        notes: list[str] = []
        conf = 0.95 if ({"sentence", "meaning"} <= set(item.keys()) or {"idiom", "meaning"} <= set(item.keys())) else 0.88
        if "phrase" in item or "translation" in item:
            notes.append("mapped phrase/translation to sentence/meaning")
        if "idiom" in item:
            notes.append("mapped idiom to sentence field")
        if "fi" in item or "en" in item:
            notes.append("mapped fi/en to sentence/meaning")
        if "template" in item:
            notes.append("mapped clause template to sentence field")
        if "_answer_value" in item or "back_prompt" in item:
            notes.append("mapped compiled card fields to sentence/meaning")
            conf = max(conf, 0.9)
        return ExtractedItem(item_type, {"sentence": normalize_space(str(sentence)), "meaning": normalize_space(str(meaning))}, conf, notes, item)
    return ExtractedItem(item_type, {}, 0.25, ["could not recover phrase fields"], item, True)


def _extract_grammar(item: Any) -> ExtractedItem:
    if not isinstance(item, dict):
        return ExtractedItem("grammar_card", {}, 0.1, ["non-dict item unsupported"], item, True)
    pattern = _first_text(item.get("pattern"), item.get("topic"), item.get("title"), item.get("front_text"), item.get("word"), deep_get(item, "content", "front", "pattern"))
    usage = _first_text(item.get("usage"), item.get("rule"), item.get("description"), deep_get(item, "served_follow_up", "prompt"), item.get("back_prompt"), deep_get(item, "content", "front", "usage"))
    blank_template = deep_get(item, "served_follow_up", "blank_template")
    example = _first_text(item.get("example_fi"), item.get("example"), item.get("sentence"), item.get("text"), _fill_blank_template(blank_template, item.get("_answer_value")), deep_get(item, "content", "back", "example_sentence"))
    meaning = _first_text(item.get("meaning"), item.get("translation"), item.get("english"), _compiled_prompt_gloss(item.get("back_prompt")), _compiled_prompt_gloss(deep_get(item, "served_follow_up", "prompt")), item.get("back_prompt"), deep_get(item, "served_follow_up", "prompt"), deep_get(item, "content", "back", "gloss"))
    if pattern and usage and example and meaning:
        notes: list[str] = []
        conf = 0.95 if {"pattern", "usage", "example_fi", "meaning"} <= set(item.keys()) else 0.8
        if "front_text" in item or "back_prompt" in item or "served_follow_up" in item:
            notes.append("mapped compiled card fields to grammar fields")
            conf = max(conf, 0.82)
        if blank_template:
            notes.append("filled blank_template into example_fi")
        return ExtractedItem("grammar_card", {"pattern": normalize_space(str(pattern)), "usage": normalize_space(str(usage)), "example_fi": normalize_space(str(example)), "meaning": normalize_space(str(meaning))}, conf, notes, item)
    return ExtractedItem("grammar_card", {}, 0.28, ["could not recover grammar fields"], item, True)


def _extract_by_guess(item: Any) -> ExtractedItem:
    if isinstance(item, dict):
        keys = set(item.keys())
        ctype = item.get("content_type")
        if ctype in VOCAB_LIKE_TYPES or {"word", "_answer_value"} <= keys or {"term", "meaning"} <= keys:
            return _extract_vocab(item, ctype or "vocabulary_card")
        if ctype in PHRASE_LIKE_TYPES or {"sentence", "meaning"} <= keys or {"idiom", "meaning"} <= keys:
            return _extract_phrase(item, ctype or ("idiom_card" if "idiom" in keys else "phrase_card"))
        if ctype == "grammar_card" or {"pattern", "usage", "example_fi", "meaning"} <= keys or {"front_text", "back_prompt", "_answer_value"} <= keys:
            return _extract_grammar(item)
        if "cards" in keys and isinstance(item.get("cards"), list):
            unit_type = str(item.get("type", "")).lower()
            item_ref = str(item.get("item_ref", "")).lower()
            ref = str(item.get("ref", "")).lower()
            if unit_type in {"phrase", "clause", "sentence"} or ref.startswith(("phrase__", "clause__", "sentence__")):
                inferred = "sentence_card" if unit_type == "sentence" or ref.startswith("sentence__") else "phrase_card"
                return _extract_phrase(item, inferred)
            if unit_type in {"slang", "word"} or item_ref.startswith("vocab__"):
                inferred = "slang_card" if unit_type == "slang" else "vocabulary_card"
                return _extract_vocab(item, inferred)
        if {"fi", "en"} <= keys or {"finnish", "english"} <= keys:
            probe = item.get("fi") or item.get("finnish")
            if looks_like_sentence(str(probe)) and len(normalize_space(str(probe)).split()) > 4:
                return _extract_phrase(item)
            return _extract_vocab(item)
        if any(k in keys for k in {"sentence", "phrase", "text", "source_text", "target_text", "template"}):
            probe = item.get("sentence") or item.get("phrase") or item.get("text") or item.get("source_text") or item.get("template")
            meaning_probe = item.get("meaning") or item.get("translation") or item.get("english") or item.get("target_text") or item.get("en")
            if probe and meaning_probe and looks_like_sentence(str(probe)):
                return _extract_phrase(item)
        if item.get("type") == "word" and item.get("fi") and item.get("en"):
            return _extract_vocab(item)
    return ExtractedItem("unknown", {}, 0.1, ["could not classify item"], item, True)
