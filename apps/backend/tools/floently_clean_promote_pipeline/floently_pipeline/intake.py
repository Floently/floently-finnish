from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .utils import list_input_files, sha256_text

ARRAY_KEYS = [
    "items", "cards", "sentences", "phrases", "entries", "records", "data",
    "words", "vocabulary", "sanasto", "grammar", "rules", "examples",
    "vocabulary_items", "grammar_items", "sentence_items", "phrase_items",
    "slang_items", "idiom_items", "word_pairs", "pairs"
]

METADATA_ONLY_SCHEMAS = {
    "kielitaika_speaking_study_index_v1",
    "kielitaika_speaking_rubrics_v1",
    "kielitaika_study_index_v1",
}


@dataclass
class RawBatch:
    source_path: str
    source_name: str
    manifest: dict[str, Any] | None
    items: list[Any]
    raw_format: str
    skip_reason: str | None = None
    auxiliary_kind: str | None = None
    file_fingerprint: dict[str, Any] | None = None
    batch_key: str | None = None
    batch_content_hash: str | None = None


def _is_manifest_like(obj: Any) -> bool:
    if not isinstance(obj, dict):
        return False
    keys = set(obj.keys())
    return bool(keys & {"content_type", "language", "path", "domain", "profession", "level_band", "source_id"})


def _extract_manifest(obj: Any) -> dict[str, Any] | None:
    if not isinstance(obj, dict):
        return None
    if _is_manifest_like(obj):
        return dict(obj)
    bm = obj.get("batch_manifest")
    if isinstance(bm, dict) and _is_manifest_like(bm):
        merged = dict(bm)
        for k in (
            "batch_id", "batch_number", "start_index", "end_index", "total_items_planned", "items_in_this_batch",
            "items_in_batch", "batch_items_count", "batch_size", "total_planned", "difficulty_curve",
            "difficulty_progression", "generation_order", "generator", "status", "notes", "authoring_note",
            "total_items_in_batch", "batch_items", "batch_item_count"
        ):
            if k in obj and k not in merged:
                merged[k] = obj[k]
            if k in bm:
                merged[k] = bm[k]
        return merged
    return None


def _flatten_section_items(sections: Any) -> list[Any]:
    out: list[Any] = []
    if not isinstance(sections, list):
        return out
    for sec in sections:
        if isinstance(sec, dict):
            for key in ARRAY_KEYS:
                val = sec.get(key)
                if isinstance(val, list):
                    out.extend(val)
            if isinstance(sec.get("section_items"), list):
                out.extend(sec.get("section_items") or [])
    return out


def _infer_manifest_hint_from_key(key: str) -> dict[str, Any] | None:
    key = key.lower()
    if key in {"sentences", "sentence_items"}:
        return {"content_type": "sentence_card"}
    if key in {"phrases", "examples", "phrase_items", "idiom_items"}:
        return {"content_type": "phrase_card"}
    if key in {"words", "vocabulary", "sanasto", "entries", "records", "data", "vocabulary_items", "slang_items", "word_pairs", "pairs"}:
        return {"content_type": "vocabulary_card"}
    if key in {"grammar", "rules", "grammar_items"}:
        return {"content_type": "grammar_card"}
    return None


def _merge_manifest(existing: dict[str, Any] | None, hint: dict[str, Any] | None) -> dict[str, Any] | None:
    if existing and hint:
        merged = dict(hint)
        merged.update(existing)
        return merged
    return existing or hint


def _compute_batch_key(manifest: dict[str, Any] | None, source_name: str, items: list[Any]) -> str:
    manifest = manifest or {}
    batch_id = manifest.get("batch_id") or manifest.get("batch_number") or manifest.get("start_index") or source_name
    start = manifest.get("start_index")
    end = manifest.get("end_index")
    parts = [
        str(manifest.get("source_id") or source_name),
        str(manifest.get("content_type") or "unknown"),
        str(manifest.get("profession") or "none"),
        str(manifest.get("level_band") or "unknown"),
        str(batch_id),
    ]
    if start is not None or end is not None:
        parts.extend([str(start or ""), str(end or "")])
    parts.append(str(len(items)))
    return "|".join(parts)


def _compute_batch_content_hash(manifest: dict[str, Any] | None, items: list[Any]) -> str:
    payload = {"manifest": manifest or {}, "items": items}
    return sha256_text(json.dumps(payload, ensure_ascii=False, sort_keys=True))


def _batch(path: Path, manifest: dict[str, Any] | None, items: list[Any], raw_format: str, *, skip_reason: str | None = None, auxiliary_kind: str | None = None, suffix: str | None = None) -> RawBatch:
    source_name = path.name if not suffix else f"{path.stem}__{suffix}{path.suffix}"
    batch_key = _compute_batch_key(manifest, source_name, items)
    batch_hash = _compute_batch_content_hash(manifest, items) if not skip_reason else None
    return RawBatch(str(path), source_name, manifest, items, raw_format, skip_reason, auxiliary_kind, None, batch_key, batch_hash)


def _schema_manifest(schema: str, payload: dict[str, Any], stream: str | None = None) -> dict[str, Any] | None:
    md = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
    if schema == "kielitaika_speaking_content_pack_v1":
        suffix = {"phrases": "phrases", "clauses": "clauses", "sentences": "sentences"}.get(stream or "phrases", stream or "phrases")
        ctype = "sentence_card" if suffix == "sentences" else "phrase_card"
        return {
            "content_type": ctype,
            "language": "fi",
            "path": f"speaking/{suffix}",
            "domain": md.get("domain", "nursing_workplace_finland"),
            "profession": "nurse",
            "level_band": "A1_A2",
            "source_id": f"source.kielitaika.speaking.content_pack.{suffix}",
            "authoring_note": schema,
        }
    if schema == "kielitaika_speaking_corpus_v1":
        suffix = stream or "phrases"
        ctype = "sentence_card" if suffix == "sentences" else "phrase_card"
        return {
            "content_type": ctype,
            "language": "fi",
            "path": f"speaking/{suffix}",
            "domain": md.get("domain", "nursing_workplace_finland"),
            "profession": "nurse",
            "level_band": "A1_A2",
            "source_id": f"source.kielitaika.speaking.corpus.{suffix}",
            "authoring_note": schema,
        }
    if schema == "kielitaika_nursing_vocab_content_pack_v1":
        return {
            "content_type": "vocabulary_card",
            "language": "fi",
            "path": "professional/nurse/words",
            "domain": "healthcare",
            "profession": "nurse",
            "level_band": "A1_A2",
            "source_id": "source.kielitaika.nursing_vocab.content_pack.units",
            "authoring_note": schema,
        }
    if schema == "kielitaika_nursing_vocab_corpus_v1":
        return {
            "content_type": "vocabulary_card",
            "language": "fi",
            "path": "professional/nurse/words",
            "domain": "healthcare",
            "profession": "nurse",
            "level_band": "A1_A2",
            "source_id": "source.kielitaika.nursing_vocab.corpus.items",
            "authoring_note": schema,
        }
    return None


def _schema_batches(payload: dict[str, Any], path: Path) -> list[RawBatch] | None:
    schema = payload.get("schema")
    if not isinstance(schema, str):
        return None

    if schema in METADATA_ONLY_SCHEMAS:
        return [_batch(path, {
            "content_type": "metadata_only",
            "language": "fi",
            "path": "metadata/runtime",
            "domain": "runtime_metadata",
            "profession": "none",
            "level_band": "none",
            "source_id": f"source.metadata.{schema}",
            "authoring_note": schema,
        }, [], f"{schema}_metadata_only_json", skip_reason="recognized metadata-only schema; not a canonical card-bank ingestion source", auxiliary_kind="metadata_only_schema")]

    if schema == "kielitaika_speaking_content_pack_v1":
        return [_batch(path, _schema_manifest(schema, payload, "phrases"), list(payload.get("units") or []), "speaking_content_pack_units_json")]

    if schema == "kielitaika_speaking_corpus_v1":
        out = []
        for key in ["phrases", "clauses", "sentences"]:
            val = payload.get(key)
            if isinstance(val, list):
                out.append(_batch(path, _schema_manifest(schema, payload, key), list(val or []), f"speaking_corpus_{key}_json", suffix=key))
        return out

    if schema == "kielitaika_nursing_vocab_content_pack_v1":
        out = []
        if isinstance(payload.get("units"), list):
            out.append(_batch(path, _schema_manifest(schema, payload, "units"), list(payload.get("units") or []), "nursing_vocab_content_pack_units_json", suffix="units"))
        if isinstance(payload.get("battles"), list):
            out.append(_batch(path, {
                "content_type": "metadata_only",
                "language": "fi",
                "path": "professional/nurse/words",
                "domain": "healthcare",
                "profession": "nurse",
                "level_band": "A1_A2",
                "source_id": "source.kielitaika.nursing_vocab.content_pack.battles",
                "authoring_note": schema,
            }, list(payload.get("battles") or []), "nursing_vocab_content_pack_battles_json", skip_reason="recognized contrast-battle runtime pack; not direct canonical MGI input", auxiliary_kind="runtime_contrast_battles", suffix="battles"))
        return out

    if schema == "kielitaika_nursing_vocab_corpus_v1":
        items = payload.get("items") or []
        words = [it for it in items if isinstance(it, dict) and str(it.get("type", "")).lower() == "word"]
        phrases = [it for it in items if isinstance(it, dict) and str(it.get("type", "")).lower() == "phrase"]
        others = [it for it in items if it not in words and it not in phrases]
        out = []
        if words:
            m = dict(_schema_manifest(schema, payload, "items") or {})
            m.update({"content_type": "vocabulary_card", "path": "professional/nurse/words", "source_id": "source.kielitaika.nursing_vocab.corpus.words"})
            out.append(_batch(path, m, words, "nursing_vocab_corpus_words_json", suffix="words"))
        if phrases:
            m = dict(_schema_manifest(schema, payload, "items") or {})
            m.update({"content_type": "phrase_card", "path": "professional/nurse/phrases", "source_id": "source.kielitaika.nursing_vocab.corpus.phrases"})
            out.append(_batch(path, m, phrases, "nursing_vocab_corpus_phrases_json", suffix="phrases"))
        if others:
            out.append(_batch(path, {
                "content_type": "metadata_only",
                "language": "fi",
                "path": "professional/nurse/mixed",
                "domain": "healthcare",
                "profession": "nurse",
                "level_band": "A1_A2",
                "source_id": "source.kielitaika.nursing_vocab.corpus.others",
                "authoring_note": schema,
            }, others, "nursing_vocab_corpus_mixed_json", skip_reason="recognized mixed corpus items outside word/phrase lanes; skipped pending a dedicated adapter", auxiliary_kind="mixed_vocab_corpus_items", suffix="mixed"))
        return out

    return None


def _first_array_key(payload: dict[str, Any]) -> tuple[str | None, list[Any] | None]:
    for key in ARRAY_KEYS:
        val = payload.get(key)
        if isinstance(val, list):
            return key, list(val or [])
    return None, None


def _batched_wrapper(payload: dict[str, Any], path: Path) -> list[RawBatch] | None:
    manifest = _extract_manifest(payload)
    key, arr = _first_array_key(payload)
    if manifest is not None and arr is not None:
        manifest = _merge_manifest(manifest, _infer_manifest_hint_from_key(key or ""))
        suffix = None
        if "batch_id" in manifest and isinstance(manifest.get("batch_id"), str):
            suffix = str(manifest["batch_id"])
        elif "batch_number" in manifest:
            suffix = f"batch_{manifest['batch_number']}"
        elif key and key not in {"items", "cards"}:
            suffix = key
        return [_batch(path, manifest, arr, f"batch_manifest_{key or 'items'}_json", suffix=suffix)]
    return None


def _parse_json_payload(payload: Any, path: Path) -> list[RawBatch]:
    if isinstance(payload, dict):
        sb = _schema_batches(payload, path)
        if sb is not None:
            return sb
        bw = _batched_wrapper(payload, path)
        if bw is not None:
            return bw
        if isinstance(payload.get("manifest"), dict) and isinstance(payload.get("items"), list):
            return [_batch(path, payload.get("manifest"), list(payload.get("items") or []), "manifest_wrapper_json")]
        if isinstance(payload.get("items"), list) and _is_manifest_like(payload):
            manifest = {k: v for k, v in payload.items() if k != "items"}
            return [_batch(path, manifest, list(payload.get("items") or []), "flat_manifest_with_items_json")]
        if isinstance(payload.get("cards"), list):
            return [_batch(path, payload.get("manifest"), list(payload.get("cards") or []), "compiled_cards_array_json")]
        if isinstance(payload.get("release_candidate"), dict):
            rc = payload.get("release_candidate") or {}
            if isinstance(rc.get("items"), list):
                return [_batch(path, rc.get("manifest"), list(rc.get("items") or []), "release_candidate_wrapper_json")]
        if isinstance(payload.get("content_pack"), dict):
            cp = payload.get("content_pack") or {}
            if isinstance(cp.get("items"), list):
                return [_batch(path, cp.get("manifest") if isinstance(cp.get("manifest"), dict) else None, list(cp.get("items") or []), "content_pack_items_json")]
            flat = _flatten_section_items(cp.get("sections"))
            if flat:
                return [_batch(path, cp.get("manifest") if isinstance(cp.get("manifest"), dict) else None, flat, "content_pack_sections_json")]
        if isinstance(payload.get("sections"), list):
            flat = _flatten_section_items(payload.get("sections"))
            if flat:
                return [_batch(path, payload.get("manifest") if isinstance(payload.get("manifest"), dict) else None, flat, "sections_items_json")]
        found = []
        for key in ARRAY_KEYS:
            val = payload.get(key)
            if isinstance(val, list):
                manifest = payload.get("manifest") if isinstance(payload.get("manifest"), dict) else None
                manifest = _merge_manifest(manifest, _infer_manifest_hint_from_key(key))
                found.append(_batch(path, manifest, list(val or []), f"top_level_{key}_array_json", suffix=key))
        if found:
            return found
    if isinstance(payload, list):
        if payload and isinstance(payload[0], dict):
            keys = set(payload[0].keys())
            if {"type", "question", "prompt", "answer"} <= keys:
                return [_batch(path, {
                    "content_type": "metadata_only",
                    "language": "fi",
                    "path": "runtime/tasks",
                    "domain": "runtime_tasks",
                    "profession": "none",
                    "level_band": "A1_A2",
                    "source_id": f"source.runtime_task_array.{path.stem}",
                    "authoring_note": "plain task array",
                }, list(payload), "runtime_task_array_json", skip_reason="recognized runtime task array; not direct canonical MGI input because items lack stable bilingual meaning fields", auxiliary_kind="runtime_task_array")]
            if {"word", "freq"} <= keys:
                return [_batch(path, {
                    "content_type": "metadata_only",
                    "language": "fi",
                    "path": "frequency/wordlist",
                    "domain": "word_frequency",
                    "profession": "none",
                    "level_band": "unknown",
                    "source_id": f"source.word_frequency_list.{path.stem}",
                    "authoring_note": "word frequency list",
                }, list(payload), "word_frequency_list_json", skip_reason="recognized word-frequency list; requires enrichment before canonical APS generation", auxiliary_kind="word_frequency_list")]
        return [_batch(path, None, list(payload), "items_array_json")]
    raise ValueError("Unsupported input structure")


def _parse_stream_values(values: list[Any], path: Path) -> list[RawBatch]:
    if not values:
        raise ValueError("Unsupported input structure")

    out: list[RawBatch] = []
    i = 0
    while i < len(values):
        current = values[i]
        manifest = _extract_manifest(current)

        if manifest is not None:
            if i + 1 < len(values) and isinstance(values[i + 1], list):
                arr = list(values[i + 1] or [])
                out.append(_batch(path, manifest, arr, "sequential_manifest_plus_items", suffix=str(manifest.get("batch_id") or manifest.get("batch_number") or f"part_{i+1}")))
                i += 2
                continue

            j = i + 1
            items: list[Any] = []
            while j < len(values):
                nxt = values[j]
                nxt_manifest = _extract_manifest(nxt)
                if nxt_manifest is not None:
                    break
                if isinstance(nxt, list):
                    if not items:
                        items.extend(list(nxt or []))
                        j += 1
                    break
                items.append(nxt)
                j += 1
            if items:
                out.append(_batch(path, manifest, items, "manifest_plus_object_stream_json", suffix=str(manifest.get("batch_id") or manifest.get("batch_number") or f"part_{i+1}")))
                i = j
                continue

        if isinstance(current, dict):
            parsed = _parse_json_payload(current, path)
            if parsed:
                out.extend(parsed)
                i += 1
                continue

        if isinstance(current, list):
            out.append(_batch(path, None, list(current or []), "items_array_stream_json", suffix=f"part_{i+1}"))
            i += 1
            continue

        raise ValueError("Unsupported input structure")

    if out:
        return out
    raise ValueError("Unsupported input structure")


def _repair_text(text: str) -> str:
    repaired = text.lstrip("\ufeff")
    repaired = re.sub(r',?\s*"\.\.\."\s*,?', '', repaired)
    repaired = re.sub(r'(^|\n)(\s*)"(term|pattern|idiom|sentence)"\s*:', r'\1\2{ "\3":', repaired)
    if '"batch_manifest"' in repaired:
        repaired = re.sub(r'\]\s*\n\s*\{', ']\n}\n\n{', repaired)
    else:
        repaired = re.sub(r'\]\s*\n\s*\{', ']\n\n{', repaired)
    repaired = re.sub(r'\}\s*\n\s*\[', '}\n\n[', repaired)
    repaired = re.sub(r'\}\s*\n\s*\{', '}\n\n{', repaired)
    return repaired


def _parse_json_text(text: str, path: Path) -> list[RawBatch]:
    candidate_texts = [text]
    repaired = _repair_text(text)
    if repaired != text:
        candidate_texts.append(repaired)

    last_error: Exception | None = None
    for candidate in candidate_texts:
        try:
            return _parse_json_payload(json.loads(candidate), path)
        except Exception as exc:
            last_error = exc

        decoder = json.JSONDecoder()
        idx = 0
        values: list[Any] = []
        text_len = len(candidate)
        while idx < text_len:
            while idx < text_len and candidate[idx].isspace():
                idx += 1
            if idx >= text_len:
                break
            try:
                obj, end = decoder.raw_decode(candidate, idx)
                values.append(obj)
                idx = end
                continue
            except json.JSONDecodeError:
                if values:
                    next_obj = candidate.find("{", idx + 1)
                    next_arr = candidate.find("[", idx + 1)
                    candidates = [p for p in [next_obj, next_arr] if p != -1]
                    if candidates:
                        idx = min(candidates)
                        continue
                break

        if values:
            try:
                return _parse_stream_values(values, path)
            except Exception as exc:
                last_error = exc

        lines = [line.strip() for line in candidate.splitlines() if line.strip()]
        if lines:
            try:
                first = json.loads(lines[0])
                rest = [json.loads(line) for line in lines[1:]]
                first_manifest = _extract_manifest(first)
                if first_manifest is not None:
                    return [_batch(path, first_manifest, rest, "jsonl_manifest_first")]
            except Exception as exc:
                last_error = exc

    raise ValueError(f"Unsupported input structure: {last_error}" if last_error else "Unsupported input structure")


def read_raw_batches(path: Path) -> list[RawBatch]:
    lower_name = path.name.lower()
    if any(token in lower_name for token in ["study_index", "rubrics"]):
        return [_batch(path, {
            "content_type": "metadata_only",
            "language": "fi",
            "path": "metadata/runtime",
            "domain": "runtime_metadata",
            "profession": "none",
            "level_band": "none",
            "source_id": f"source.metadata.filename.{path.stem}",
            "authoring_note": "filename-based metadata skip",
        }, [], "metadata_filename_skip_json", skip_reason="recognized metadata/index filename; not a canonical card-bank ingestion source", auxiliary_kind="metadata_only_schema")]
    return _parse_json_text(path.read_text(encoding="utf-8"), path)


def inventory_inputs(input_path: str) -> list[RawBatch]:
    root = Path(input_path)
    if not root.exists():
        raise FileNotFoundError(f"Input path not found: {input_path}")
    out: list[RawBatch] = []
    for path in list_input_files(root):
        try:
            out.extend(read_raw_batches(path))
        except Exception as exc:
            out.append(_batch(path, {
                "content_type": "metadata_only",
                "language": "fi",
                "path": "unsupported/source",
                "domain": "unsupported_input",
                "profession": "none",
                "level_band": "unknown",
                "source_id": f"source.unsupported.{path.stem}",
                "authoring_note": "unsupported source preserved as skipped batch",
            }, [], "unsupported_source_json", skip_reason=f"unsupported input structure: {exc}", auxiliary_kind="unsupported_source"))
    return out
