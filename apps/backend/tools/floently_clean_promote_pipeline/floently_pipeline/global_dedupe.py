
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .utils import deep_get, list_input_files, load_json_file, normalize_space, read_jsonl, slugify, stable_hash


@dataclass
class GlobalDedupeIndex:
    signatures: dict[str, list[dict[str, Any]]]

    @property
    def size(self) -> int:
        return len(self.signatures)


@dataclass
class GlobalDedupeResult:
    kept: list[Any]
    rejected: list[dict[str, Any]]
    report: dict[str, Any]


def build_global_index(paths: list[str]) -> GlobalDedupeIndex:
    signatures: dict[str, list[dict[str, Any]]] = {}
    for raw_path in paths:
        path = Path(raw_path)
        sig_index = None
        if path.is_dir():
            candidate = path / "index" / "signature_index.jsonl"
            if candidate.exists():
                sig_index = candidate
        elif path.name == "signature_index.jsonl" and path.exists():
            sig_index = path
        if sig_index is not None:
            try:
                for row in read_jsonl(sig_index):
                    signature = row.get("dedupe_signature")
                    refs = row.get("refs") or []
                    if signature:
                        signatures.setdefault(signature, []).extend(refs if isinstance(refs, list) else [])
                continue
            except Exception:
                pass
        for file_path in _expand_input_path(path):
            for occurrence in _extract_occurrences_from_file(file_path):
                signatures.setdefault(occurrence["dedupe_signature"], []).append(occurrence)
    return GlobalDedupeIndex(signatures=signatures)


def dedupe_against_global_index(items: list[Any], global_index: GlobalDedupeIndex, run_seen: dict[str, list[dict[str, Any]]] | None = None) -> GlobalDedupeResult:
    run_seen = run_seen if run_seen is not None else {}
    kept: list[Any] = []
    rejected: list[dict[str, Any]] = []
    actual_duplicates: list[str] = []

    for item in items:
        refs = []
        if item.dedupe_signature in run_seen:
            refs.extend(run_seen[item.dedupe_signature])
        if item.dedupe_signature in global_index.signatures:
            refs.extend(global_index.signatures[item.dedupe_signature])

        if refs:
            actual_duplicates.append(item.dedupe_signature)
            rejected.append({
                "reason": "global_or_cross_batch_duplicate",
                "dedupe_signature": item.dedupe_signature,
                "normalized_key": item.normalized_key,
                "raw_fragment": item.raw_fragment,
                "matched_refs": refs[:10],
            })
            continue

        run_seen.setdefault(item.dedupe_signature, []).append({
            "source_path": "current_run",
            "item_type": item.item_type,
            "normalized_key": item.normalized_key,
        })
        kept.append(item)

    report = {
        "input_count": len(items),
        "kept_count": len(kept),
        "rejected_count": len(rejected),
        "actual_duplicate_signatures": sorted(set(actual_duplicates)),
        "reference_signature_count": global_index.size,
    }
    return GlobalDedupeResult(kept=kept, rejected=rejected, report=report)


def audit_bank(paths: list[str]) -> dict[str, Any]:
    index = build_global_index(paths)
    clusters = []
    total_occurrences = 0
    for signature, refs in sorted(index.signatures.items()):
        total_occurrences += len(refs)
        if len(refs) > 1:
            clusters.append({
                "dedupe_signature": signature,
                "count": len(refs),
                "refs": refs,
            })
    return {
        "paths": paths,
        "unique_signature_count": len(index.signatures),
        "total_occurrence_count": total_occurrences,
        "duplicate_cluster_count": len(clusters),
        "duplicate_clusters": clusters,
    }


def _expand_input_path(path: Path) -> list[Path]:
    return list_input_files(path)


def _extract_occurrences_from_file(path: Path) -> list[dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".jsonl":
        rows = read_jsonl(path)
        return [occ for row in rows for occ in _occurrences_from_payload(row, path)]
    try:
        payload = load_json_file(path)
    except Exception:
        return []
    return _occurrences_from_payload(payload, path)


def _occurrences_from_payload(payload: Any, path: Path) -> list[dict[str, Any]]:
    occurrences: list[dict[str, Any]] = []

    if isinstance(payload, dict):
        if isinstance(payload.get("items"), list):
            manifest = payload.get("manifest") if isinstance(payload.get("manifest"), dict) else {}
            for row in payload.get("items", []):
                occ = _occurrence_from_item(row, path, manifest)
                if occ:
                    occurrences.append(occ)
            return occurrences
        if isinstance(payload.get("cards"), list):
            for row in payload.get("cards", []):
                occ = _occurrence_from_item(row, path, {})
                if occ:
                    occurrences.append(occ)
            return occurrences
        if "content_type" in payload:
            occ = _occurrence_from_item(payload, path, {})
            return [occ] if occ else []
        if isinstance(payload.get("release_candidate"), dict):
            rc = payload["release_candidate"]
            if isinstance(rc.get("items"), list):
                manifest = rc.get("manifest") if isinstance(rc.get("manifest"), dict) else {}
                for row in rc["items"]:
                    occ = _occurrence_from_item(row, path, manifest)
                    if occ:
                        occurrences.append(occ)
                return occurrences

    if isinstance(payload, list):
        for row in payload:
            occ = _occurrence_from_item(row, path, {})
            if occ:
                occurrences.append(occ)
    return occurrences


def _occurrence_from_item(item: Any, path: Path, manifest: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None

    item_type = item.get("content_type") or manifest.get("content_type") or _guess_item_type(item)
    if not item_type:
        return None

    profession = _profession_from_item(item, manifest)
    domain = item.get("domain") or manifest.get("domain") or "general"
    fields = _fields_from_item(item_type, item)
    if not fields:
        return None

    normalized_key = _normalized_key(item_type, fields)
    if not normalized_key:
        return None

    dedupe_signature = stable_hash(item_type, profession, domain, normalized_key, length=14)
    return {
        "source_path": str(path),
        "item_type": item_type,
        "profession": profession,
        "domain": domain,
        "normalized_key": normalized_key,
        "dedupe_signature": dedupe_signature,
        "id": item.get("id"),
    }


def _profession_from_item(item: dict[str, Any], manifest: dict[str, Any]) -> str:
    profession_block = item.get("profession")
    if isinstance(profession_block, dict):
        slug = profession_block.get("slug")
        if slug:
            return str(slug)
        track = profession_block.get("track")
        if track == "none":
            return "none"
    profession = item.get("profession")
    if isinstance(profession, str):
        return profession
    return str(manifest.get("profession", "none"))


def _guess_item_type(item: dict[str, Any]) -> str | None:
    if item.get("content_type") in {"slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        return item.get("content_type")
    if any(k in item for k in ("term", "word", "_answer_value")) or deep_get(item, "content", "front", "term"):
        return item.get("content_type") or "vocabulary_card"
    if item.get("content_type") == "idiom_card":
        return "idiom_card"
    if any(k in item for k in ("sentence", "phrase", "idiom")) or deep_get(item, "content", "front", "sentence"):
        return item.get("content_type") or ("idiom_card" if "idiom" in item else "phrase_card")
    if any(k in item for k in ("pattern", "usage", "example_fi")) or deep_get(item, "content", "front", "pattern"):
        return "grammar_card"
    return None


def _fields_from_item(item_type: str, item: dict[str, Any]) -> dict[str, str] | None:
    if item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        term = item.get("term") or item.get("word") or item.get("front_text") or deep_get(item, "content", "front", "term")
        meaning = item.get("meaning") or item.get("gloss") or item.get("_answer_value") or deep_get(item, "content", "back", "gloss")
        if term and meaning:
            return {"term": normalize_space(str(term)), "meaning": normalize_space(str(meaning))}
        return None

    if item_type in {"phrase_card", "sentence_card", "idiom_card"}:
        sentence = item.get("sentence") or item.get("phrase") or item.get("front_text") or item.get("word") or deep_get(item, "content", "front", "sentence")
        meaning = item.get("meaning") or item.get("translation") or item.get("_answer_value") or deep_get(item, "content", "back", "gloss")
        if sentence and meaning:
            return {"sentence": normalize_space(str(sentence)), "meaning": normalize_space(str(meaning))}
        return None

    if item_type == "grammar_card":
        pattern = item.get("pattern") or deep_get(item, "content", "front", "pattern")
        usage = (
            item.get("usage")
            or deep_get(item, "content", "front", "usage")
            or deep_get(item, "content", "back", "usage")
            or deep_get(item, "explanation", "summary")
        )
        example_fi = (
            item.get("example_fi")
            or item.get("example")
            or deep_get(item, "content", "front", "example_fi")
            or deep_get(item, "content", "back", "example_sentence")
            or deep_get(item, "explanation", "example")
        )
        meaning = item.get("meaning") or item.get("_answer_value") or deep_get(item, "content", "back", "gloss")
        if pattern and usage and example_fi and meaning:
            return {
                "pattern": normalize_space(str(pattern)),
                "usage": normalize_space(str(usage)),
                "example_fi": normalize_space(str(example_fi)),
                "meaning": normalize_space(str(meaning)),
            }
        return None

    return None


def _normalized_key(item_type: str, fields: dict[str, str]) -> str:
    if item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        return slugify(f"{fields.get('term', 'unknown')}::{fields.get('meaning', '')}", max_len=140)
    if item_type in {"phrase_card", "sentence_card", "idiom_card"}:
        return slugify(f"{fields.get('sentence', 'unknown')}::{fields.get('meaning', '')}", max_len=180)
    if item_type == "grammar_card":
        return slugify(f"{fields.get('pattern', 'unknown')}::{fields.get('example_fi', '')}::{fields.get('meaning', '')}", max_len=180)
    return slugify("unknown")
