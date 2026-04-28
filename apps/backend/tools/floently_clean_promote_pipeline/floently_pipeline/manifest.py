from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import PipelineConfig
from .utils import normalize_content_path, normalize_profession_alias


KNOWN_PROFESSIONS = ["doctor", "nurse", "practical_nurse", "practical nurse", "lähihoitaja", "lahihoitaja", "sairaanhoitaja", "lääkäri", "laakari", "yki", "yki_exam", "general", "none"]
KNOWN_CONTENT_TYPES = ["vocabulary_card", "phrase_card", "sentence_card", "grammar_card", "slang_card", "idiom_card", "word_opposite_card", "word_similar_in_meaning_card"]
KNOWN_LEVELS = ["A1", "A2", "A1_A2", "B1", "B2", "B1_B2", "C1", "C2", "C1_C2"]


@dataclass
class AidResult:
    manifest: dict[str, Any]
    confidence: float
    origin: str
    notes: list[str]


def infer_manifest(source_path: str, explicit_manifest: dict[str, Any] | None, items: list[Any], config: PipelineConfig) -> AidResult:
    notes: list[str] = []
    manifest = dict(explicit_manifest or {})
    origin = "explicit" if explicit_manifest else "inferred"
    confidence = 0.95 if explicit_manifest else 0.55

    lower_path = source_path.lower().replace("\\", "/")
    common = _common_item_metadata(items)

    profession = manifest.get("profession") or common.get("profession")
    if not profession:
        for candidate in KNOWN_PROFESSIONS:
            if candidate != "none" and candidate in lower_path:
                profession = candidate
                notes.append(f"profession inferred from path: {candidate}")
                confidence += 0.08
                break
    profession = profession or config.defaults.get("profession", "none")
    normalized_profession = normalize_profession_alias(profession) or profession
    if normalized_profession != profession:
        notes.append(f"profession normalized to {normalized_profession}")
    profession = normalized_profession
    if common.get("profession") and not explicit_manifest:
        notes.append(f"profession inferred from items: {common['profession']}")
        confidence += 0.06

    content_type = manifest.get("content_type") or common.get("content_type")
    if not content_type:
        if "/words" in lower_path or "vocab" in lower_path or "sanasto" in lower_path:
            content_type = "vocabulary_card"
            notes.append("content_type inferred from path as vocabulary_card")
            confidence += 0.08
        elif "/sentences" in lower_path or "sentence" in lower_path or "lause" in lower_path:
            content_type = "sentence_card"
            notes.append("content_type inferred from path as sentence_card")
            confidence += 0.08
        elif "/phrases" in lower_path or "phrase" in lower_path or "fraasi" in lower_path:
            content_type = "phrase_card"
            notes.append("content_type inferred from path as phrase_card")
            confidence += 0.08
        elif "/grammar" in lower_path or "kielioppi" in lower_path:
            content_type = "grammar_card"
            notes.append("content_type inferred from path as grammar_card")
            confidence += 0.08
        else:
            content_type = _infer_content_type_from_items(items)
            notes.append(f"content_type inferred from items as {content_type}")
            confidence += 0.05
    elif common.get("content_type") and not explicit_manifest:
        notes.append(f"content_type inferred from items: {common['content_type']}")
        confidence += 0.05

    domain = manifest.get("domain") or common.get("domain")
    if not domain:
        if profession == "doctor":
            domain = "medical_work_finnish"
        elif profession in {"nurse", "practical_nurse"}:
            domain = "healthcare"
        else:
            domain = config.defaults.get("domain", "general_finnish")
        notes.append(f"domain inferred as {domain}")
        confidence += 0.04
    elif common.get("domain") and not explicit_manifest:
        notes.append(f"domain inferred from items: {common['domain']}")
        confidence += 0.04

    level_band = manifest.get("level_band") or common.get("level_band")
    if not level_band:
        for level in KNOWN_LEVELS:
            if level.lower() in lower_path:
                level_band = level
                notes.append(f"level_band inferred from path as {level}")
                confidence += 0.05
                break
    level_band = level_band or config.defaults.get("level_band", "B1_B2")
    if common.get("level_band") and not explicit_manifest:
        notes.append(f"level_band inferred from items: {common['level_band']}")
        confidence += 0.03

    language = manifest.get("language") or common.get("language") or config.defaults.get("language", "fi")

    path_value = manifest.get("path") or common.get("path")
    if not path_value:
        if profession in {"doctor", "nurse", "practical_nurse"}:
            suffix = {
                "vocabulary_card": "vocabulary",
                "slang_card": "vocabulary",
                "word_opposite_card": "vocabulary",
                "word_similar_in_meaning_card": "vocabulary",
                "phrase_card": "sentences",
                "sentence_card": "sentences",
                "idiom_card": "sentences",
                "grammar_card": "grammar",
            }.get(content_type, "items")
            path_value = f"professional/{profession}/{suffix}"
        elif profession == "general":
            suffix = {
                "vocabulary_card": "vocabulary",
                "slang_card": "vocabulary",
                "word_opposite_card": "vocabulary",
                "word_similar_in_meaning_card": "vocabulary",
                "phrase_card": "sentences",
                "sentence_card": "sentences",
                "idiom_card": "sentences",
                "grammar_card": "grammar",
            }.get(content_type, "items")
            path_value = f"general/{suffix}"
        else:
            path_value = config.defaults.get("path", "general")
        notes.append(f"path inferred as {path_value}")
        confidence += 0.04
    path_value = normalize_content_path(path_value, content_type=content_type, profession=profession) or path_value

    source_id = manifest.get("source_id") or common.get("source_id") or f"source.recovered.{Path(source_path).stem}"
    if common.get("source_id") and not explicit_manifest:
        confidence += 0.03

    merged = {
        "content_type": content_type,
        "language": language,
        "path": path_value,
        "domain": domain,
        "profession": profession,
        "level_band": level_band,
        "source_id": source_id,
        "authoring_note": manifest.get("authoring_note") or common.get("authoring_note"),
        "manifest_origin": origin,
        "manifest_confidence": round(min(confidence, 0.99), 3),
        "source_path": source_path,
    }
    return AidResult(manifest=merged, confidence=round(min(confidence, 0.99), 3), origin=origin, notes=notes)


def _common_item_metadata(items: list[Any]) -> dict[str, Any]:
    counters: dict[str, Counter[str]] = {
        "content_type": Counter(),
        "profession": Counter(),
        "domain": Counter(),
        "level_band": Counter(),
        "path": Counter(),
        "source_id": Counter(),
        "authoring_note": Counter(),
        "language": Counter(),
    }
    for item in items[:200]:
        if not isinstance(item, dict):
            continue
        for key in counters:
            value = item.get(key)
            if isinstance(value, str) and value.strip():
                counters[key][value.strip()] += 1
        if "_source_id" in item and isinstance(item["_source_id"], str):
            counters["source_id"][item["_source_id"].strip()] += 1
        if item.get("content") and isinstance(item.get("content"), dict):
            counters["language"]["fi"] += 1
    resolved: dict[str, Any] = {}
    for key, counter in counters.items():
        if counter:
            resolved[key] = counter.most_common(1)[0][0]
    return resolved


def _infer_content_type_from_items(items: list[Any]) -> str:
    score = {"vocabulary_card": 0, "phrase_card": 0, "grammar_card": 0}
    for item in items[:50]:
        if not isinstance(item, dict):
            continue
        keys = set(item.keys())
        if {"term", "meaning"} <= keys or {"word", "gloss"} <= keys or {"word", "_answer_value"} <= keys:
            score["vocabulary_card"] += 2
        if {"sentence", "meaning"} <= keys or {"phrase", "translation"} <= keys or {"sentence", "_answer_value"} <= keys:
            score["phrase_card"] += 2
        if {"pattern", "usage", "example_fi", "meaning"} <= keys or {"topic", "example", "translation"} <= keys:
            score["grammar_card"] += 2
        if item.get("content_type") in score:
            score[item["content_type"]] += 2
        if {"fi", "en"} <= keys:
            if any(" " in str(item.get(k, "")) for k in ["fi", "en"]):
                score["phrase_card"] += 1
            else:
                score["vocabulary_card"] += 1
    best = max(score, key=score.get)
    return best if score[best] > 0 else "vocabulary_card"
