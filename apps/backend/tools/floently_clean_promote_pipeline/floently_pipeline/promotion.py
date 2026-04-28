
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .global_dedupe import _occurrence_from_item
from .utils import dump_json, read_jsonl, sha256_file, stable_hash, write_jsonl


@dataclass
class Destination:
    track: str
    profession: str | None
    bucket: str
    level_file: str


PROMOTABLE_FILENAMES = {"release_candidate.json", "aps_items.jsonl"}
AUXILIARY_DIR_NAMES = {"published", "validated", "candidate", "manifests", "sidecars", "reports", "index", "quarantine", "imports", "normalized", "raw_inventory"}

CONTENT_TYPE_BUCKETS = {
    "vocabulary_card": "vocabulary",
    "slang_card": "vocabulary",
    "word_opposite_card": "vocabulary",
    "word_similar_in_meaning_card": "vocabulary",
    "grammar_card": "grammar",
    "phrase_card": "sentences",
    "sentence_card": "sentences",
    "idiom_card": "sentences",
}

ENGLISH_STOPWORDS = {
    "a","an","and","are","as","at","be","because","by","can","for","from","get","give","go","has","have","if","in",
    "into","is","it","like","of","on","or","patient","should","so","the","their","there","this","to","up","was","what",
    "when","where","which","with","would","you","your","someone","something","do","did","done","during","after","before"
}
FINNISH_HINTS = {"ää", "ö", "ä", "ssa", "ssä", "sta", "stä", "lla", "llä", "ksi", "tta", "ttä", "inen", "minen", "vat", "vät", "nut", "nyt", "ko", "kö"}

LEVEL_PATTERNS = [
    (re.compile(r"(?<![a-z0-9])a1[_\- ]?a2(?![a-z0-9])", re.I), "A1_A2"),
    (re.compile(r"(?<![a-z0-9])b1[_\- ]?b2(?![a-z0-9])", re.I), "B1_B2"),
    (re.compile(r"(?<![a-z0-9])c1[_\- ]?c2(?![a-z0-9])", re.I), "C1_C2"),
    (re.compile(r"(?<![a-z0-9])a2(?![a-z0-9])", re.I), "A2"),
    (re.compile(r"(?<![a-z0-9])a1(?![a-z0-9])", re.I), "A1"),
    (re.compile(r"(?<![a-z0-9])b2(?![a-z0-9])", re.I), "B2"),
    (re.compile(r"(?<![a-z0-9])b1(?![a-z0-9])", re.I), "B1"),
    (re.compile(r"(?<![a-z0-9])c2(?![a-z0-9])", re.I), "C2"),
    (re.compile(r"(?<![a-z0-9])c1(?![a-z0-9])", re.I), "C1"),
]

PROFESSION_PATTERNS = [
    ("practical_nurse", ["lähihoitaja", "lahihoitaja", "practical_nurse", "practical nurse"]),
    ("nurse", ["sairaanhoitaja", "nurse", "nursing_vocab", "nursing_"]),
    ("doctor", ["lääkäri", "laakari", "doctor"]),
    ("occupational_therapy", ["occupational_therapy", "occupational therapy", "occupational therapist"]),
]

DIFFICULTY_LEVEL_HINTS = {
    "intro": "A1_A2",
    "foundation": "A1_A2",
    "core": None,
    "intermediate": "B1_B2",
    "advanced": "C1_C2",
    "expert": "C1_C2",
}


def _progress(message: str) -> None:
    print(message, file=sys.stderr, flush=True)

def load_promotion_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
def compute_batch_hash(batch_dir: Path) -> str:
    parts: list[str] = []
    for name in ("release_candidate.json", "aps_items.jsonl", "aid.json"):
        p = batch_dir / name
        if p.exists():
            try:
                parts.append(name + ":" + sha256_file(p))
            except Exception:
                parts.append(name + ":" + str(p.stat().st_mtime_ns))
    if not parts:
        return ""
    return stable_hash(*parts, length=16)
def discover_ready_batches(root: Path) -> list[Path]:
    if not root.exists():
        raise FileNotFoundError(f"Ready pool path not found: {root}")
    batch_dirs: set[Path] = set()
    if root.is_file():
        raise ValueError("Ready pool must be a directory")
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.name not in PROMOTABLE_FILENAMES:
            continue
        parent = path.parent
        batch_dirs.add(parent)
    result = []
    for batch_dir in sorted(batch_dirs):
        if (batch_dir / "release_candidate.json").exists() or (batch_dir / "aps_items.jsonl").exists():
            result.append(batch_dir)
    return result
def load_batch_payload(batch_dir: Path) -> tuple[dict[str, Any] | None, list[dict[str, Any]], str]:
    release_candidate = batch_dir / "release_candidate.json"
    aps_items = batch_dir / "aps_items.jsonl"
    aid = batch_dir / "aid.json"

    manifest: dict[str, Any] | None = None
    items: list[dict[str, Any]] = []

    if release_candidate.exists():
        payload = json.loads(release_candidate.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            if isinstance(payload.get("manifest"), dict):
                manifest = payload.get("manifest")
            if isinstance(payload.get("items"), list):
                items = [row for row in payload["items"] if isinstance(row, dict)]
            elif isinstance(payload.get("cards"), list):
                items = [row for row in payload["cards"] if isinstance(row, dict)]
    if not manifest and aid.exists():
        aid_payload = json.loads(aid.read_text(encoding="utf-8"))
        if isinstance(aid_payload, dict) and isinstance(aid_payload.get("manifest"), dict):
            manifest = aid_payload.get("manifest")
    if not items and aps_items.exists():
        items = [row for row in read_jsonl(aps_items) if isinstance(row, dict)]
    source_ref = str(release_candidate if release_candidate.exists() else aps_items if aps_items.exists() else batch_dir)
    return manifest, items, source_ref


def load_promotion_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"promoted_batch_hashes": {}}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            payload.setdefault("promoted_batch_hashes", {})
            return payload
    except Exception:
        pass
    return {"promoted_batch_hashes": {}}


def promote_ready_pool(ready_root: str, canonical_root: str) -> dict[str, Any]:
    ready_path = Path(ready_root)
    canonical_path = Path(canonical_root)
    canonical_path.mkdir(parents=True, exist_ok=True)

    reports_dir = canonical_path / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    index_dir = canonical_path / "index"
    index_dir.mkdir(parents=True, exist_ok=True)
    quarantine_dir = canonical_path / "quarantine"
    quarantine_dir.mkdir(parents=True, exist_ok=True)

    status_path = reports_dir / "promotion_status.json"
    history_path = reports_dir / "promotion_history.jsonl"
    state_path = index_dir / "promotion_state.json"

    state = load_promotion_state(state_path)
    batch_dirs = discover_ready_batches(ready_path)
    _progress(f"[promote] discovered {len(batch_dirs)} promotable batch directories under {ready_path}")

    promotion_log_rows: list[dict[str, Any]] = []
    history_rows: list[dict[str, Any]] = []
    rejected_ready_duplicates: list[dict[str, Any]] = []
    rejected_canonical_duplicates: list[dict[str, Any]] = []
    rejected_conflicts: list[dict[str, Any]] = []
    rejected_quality: list[dict[str, Any]] = []
    quarantined_unknown_content: list[dict[str, Any]] = []
    accepted_rows: list[dict[str, Any]] = []
    created_destinations: set[str] = set()

    canonical_index = load_canonical_index(canonical_path)
    ready_seen: dict[str, list[dict[str, Any]]] = {}
    seen_anchor_to_meaning: dict[str, dict[str, Any]] = {}
    seen_batch_hashes = dict(state.get("promoted_batch_hashes") or {})
    seen_run_batch_hashes: dict[str, dict[str, Any]] = {}

    data_cache: dict[tuple[str, str], dict[str, Any]] = {}
    manifest_cache: dict[str, dict[str, Any]] = {}
    sidecar_cache: dict[str, dict[str, Any]] = {}

    batch_summaries: list[dict[str, Any]] = []
    accepted_total = 0

    def checkpoint(current_batch: str | None = None, status: str = "running") -> None:
        dump_json(status_path, {
            "status": status,
            "ready_root": str(ready_path),
            "canonical_root": str(canonical_path),
            "discovered_batch_count": len(batch_dirs),
            "processed_batch_count": len(batch_summaries),
            "accepted_count": accepted_total,
            "rejected_ready_duplicates": len(rejected_ready_duplicates),
            "rejected_canonical_duplicates": len(rejected_canonical_duplicates),
            "rejected_conflicts": len(rejected_conflicts),
            "rejected_quality": len(rejected_quality),
            "quarantined_unknown_content": len(quarantined_unknown_content),
            "current_batch": current_batch,
            "batches": batch_summaries[-20:],
        })
        write_jsonl(history_path, history_rows)

    checkpoint(None, "running")

    for idx, batch_dir in enumerate(batch_dirs, start=1):
        batch_id = batch_dir.name
        batch_hash = compute_batch_hash(batch_dir)
        batch_resolved = str(batch_dir.resolve())

        if batch_hash and seen_batch_hashes.get(batch_resolved) == batch_hash:
            batch_summary = {
                "batch_id": batch_id,
                "status": "cached_skip",
                "reason": "unchanged_already_promoted",
                "batch_hash": batch_hash,
            }
            batch_summaries.append(batch_summary)
            history_rows.append({"event": "batch_cached_skip", "batch_id": batch_id, "batch_hash": batch_hash})
            _progress(f"[promote] batch {idx}/{len(batch_dirs)} '{batch_id}' skipped: unchanged_already_promoted")
            checkpoint(batch_id, "running")
            continue

        if batch_hash and batch_hash in seen_run_batch_hashes:
            prior = seen_run_batch_hashes[batch_hash]
            batch_summary = {
                "batch_id": batch_id,
                "status": "cached_skip",
                "reason": "duplicate_ready_batch_hash",
                "batch_hash": batch_hash,
                "duplicate_of": prior.get("batch_id"),
            }
            batch_summaries.append(batch_summary)
            history_rows.append({"event": "batch_cached_skip", "batch_id": batch_id, "batch_hash": batch_hash, "duplicate_of": prior.get("batch_id")})
            _progress(f"[promote] batch {idx}/{len(batch_dirs)} '{batch_id}' skipped: duplicate_ready_batch_hash={prior.get('batch_id')}")
            checkpoint(batch_id, "running")
            continue

        manifest, items, source_ref = load_batch_payload(batch_dir)
        batch_meta = derive_batch_resolution(manifest or {}, batch_id=batch_id, source_ref=source_ref)
        history_rows.append({"event": "batch_start", "batch_id": batch_id, "source_ref": source_ref, "input_count": len(items)})
        _progress(f"[promote] batch {idx}/{len(batch_dirs)} '{batch_id}' start: input_count={len(items)} source={source_ref}")
        if not items:
            batch_summaries.append({
                "batch_id": batch_id,
                "status": "skipped",
                "reason": "no_items",
                "source_ref": source_ref,
                "resolved_level_band": batch_meta.get("level_band"),
                "resolved_profession": batch_meta.get("profession"),
            })
            history_rows.append({"event": "batch_skipped", "batch_id": batch_id, "reason": "no_items", "resolved_profession": batch_meta.get("profession"), "resolved_level_band": batch_meta.get("level_band")})
            checkpoint(batch_id, "running")
            continue

        accepted_for_batch = 0
        rejected_ready_for_batch = 0
        rejected_canonical_for_batch = 0
        rejected_conflict_for_batch = 0
        rejected_quality_for_batch = 0
        quarantined_unknown_for_batch = 0
        destination_counter: dict[str, int] = {}
        destination_buffers: dict[str, dict[str, Any]] = {}

        for item in items:
            item_id = str(item.get("id") or stable_hash(batch_id, json.dumps(item, ensure_ascii=False), length=10))
            content_type = str(item.get("content_type") or (manifest or {}).get("content_type") or "")
            if content_type not in CONTENT_TYPE_BUCKETS:
                quarantined_unknown_content.append({
                    "batch_id": batch_id,
                    "item_id": item_id,
                    "reason": "unknown_or_unroutable_content_type",
                    "content_type": content_type,
                    "item": item,
                })
                quarantined_unknown_for_batch += 1
                continue

            quality_reasons = promotion_quality_reasons(item, manifest or {})
            if quality_reasons:
                rejected_quality.append({
                    "batch_id": batch_id,
                    "item_id": item_id,
                    "reason": "promotion_quality_gate_failed",
                    "reasons": quality_reasons,
                    "content_type": content_type,
                    "item": item,
                })
                rejected_quality_for_batch += 1
                continue

            occurrence = _occurrence_from_item(item, batch_dir, manifest or {})
            if not occurrence:
                rejected_conflicts.append({
                    "batch_id": batch_id,
                    "item_id": item_id,
                    "reason": "unpromotable_item_shape",
                    "item": item,
                })
                rejected_conflict_for_batch += 1
                continue

            signature = occurrence["dedupe_signature"]
            anchor = semantic_anchor(item, manifest or {})
            meaning_sig = meaning_signature(item)

            if anchor:
                existing_anchor = seen_anchor_to_meaning.get(anchor)
                if existing_anchor and existing_anchor["meaning_signature"] != meaning_sig:
                    rejected_conflicts.append({
                        "batch_id": batch_id,
                        "item_id": item_id,
                        "reason": "same_source_text_conflicting_meaning_in_ready_or_canonical",
                        "anchor": anchor,
                        "existing": existing_anchor,
                        "item": item,
                    })
                    rejected_conflict_for_batch += 1
                    continue
                if anchor in canonical_index["anchors"] and canonical_index["anchors"][anchor]["meaning_signature"] != meaning_sig:
                    rejected_conflicts.append({
                        "batch_id": batch_id,
                        "item_id": item_id,
                        "reason": "same_source_text_conflicting_meaning_in_canonical_bank",
                        "anchor": anchor,
                        "existing": canonical_index["anchors"][anchor],
                        "item": item,
                    })
                    rejected_conflict_for_batch += 1
                    continue

            if signature in ready_seen:
                rejected_ready_duplicates.append({
                    "batch_id": batch_id,
                    "item_id": item_id,
                    "reason": "duplicate_in_ready_pool",
                    "dedupe_signature": signature,
                    "matched_refs": ready_seen[signature][:10],
                })
                rejected_ready_for_batch += 1
                continue

            if signature in canonical_index["signatures"]:
                rejected_canonical_duplicates.append({
                    "batch_id": batch_id,
                    "item_id": item_id,
                    "reason": "duplicate_in_canonical_bank",
                    "dedupe_signature": signature,
                    "matched_refs": canonical_index["signatures"][signature][:10],
                })
                rejected_canonical_for_batch += 1
                continue

            destination, routed_item, repair_meta = destination_for_item(item, manifest or {}, batch_id=batch_id, source_ref=source_ref)
            destination_key = destination_key_string(destination)
            ensure_destination_structure(canonical_path, destination, created_destinations)

            buffer = destination_buffers.setdefault(destination_key, {
                "destination": destination,
                "items": [],
                "item_ids": [],
                "source_ids": set(),
            })
            buffer["items"].append(routed_item)
            buffer["item_ids"].append(routed_item.get("id") or item_id)
            if (manifest or {}).get("source_id"):
                buffer["source_ids"].add(str((manifest or {}).get("source_id")))

            ref = {
                "batch_id": batch_id,
                "item_id": routed_item.get("id") or item_id,
                "destination": destination_key,
                "source_ref": source_ref,
            }
            ready_seen.setdefault(signature, []).append(ref)
            canonical_index["signatures"].setdefault(signature, []).append(ref)
            if anchor:
                anchor_ref = {
                    "batch_id": batch_id,
                    "item_id": routed_item.get("id") or item_id,
                    "destination": destination_key,
                    "meaning_signature": meaning_sig,
                    "source_ref": source_ref,
                }
                seen_anchor_to_meaning[anchor] = anchor_ref
                canonical_index["anchors"][anchor] = anchor_ref

            accepted_rows.append({
                "batch_id": batch_id,
                "item_id": routed_item.get("id") or item_id,
                "dedupe_signature": signature,
                "destination": destination_key,
                "source_ref": source_ref,
                "resolved_level_band": repair_meta.get("level_band"),
                "resolved_profession": repair_meta.get("profession"),
            })
            promotion_log_rows.append({
                "event": "promoted",
                "batch_id": batch_id,
                "item_id": routed_item.get("id") or item_id,
                "destination": destination_key,
                "dedupe_signature": signature,
                "source_ref": source_ref,
                "resolved_level_band": repair_meta.get("level_band"),
                "resolved_profession": repair_meta.get("profession"),
            })
            destination_counter[destination_key] = destination_counter.get(destination_key, 0) + 1
            accepted_for_batch += 1
            accepted_total += 1

        if destination_buffers:
            touched_keys = set()
            touched_meta = set()
            for destination_key, buffer in destination_buffers.items():
                append_items_to_destination_batch(
                    canonical_path,
                    buffer["destination"],
                    buffer["items"],
                    manifest or {},
                    data_cache,
                    touched_keys,
                )
                update_sidecar_and_manifest_batch(
                    canonical_path,
                    buffer["destination"],
                    buffer["item_ids"],
                    buffer["source_ids"],
                    manifest or {},
                    manifest_cache,
                    sidecar_cache,
                    touched_meta,
                )
            flush_cached_destination_payloads(data_cache, touched_keys)
            flush_cached_meta_payloads(manifest_cache, sidecar_cache, touched_meta)
            _progress(
                f"[promote] batch {idx}/{len(batch_dirs)} '{batch_id}' wrote destinations={len(destination_buffers)} "
                f"accepted={accepted_for_batch}"
            )

        batch_summary = {
            "batch_id": batch_id,
            "status": "promoted",
            "source_ref": source_ref,
            "input_count": len(items),
            "accepted_count": accepted_for_batch,
            "rejected_ready_duplicates": rejected_ready_for_batch,
            "rejected_canonical_duplicates": rejected_canonical_for_batch,
            "rejected_conflicts": rejected_conflict_for_batch,
            "rejected_quality": rejected_quality_for_batch,
            "quarantined_unknown_content": quarantined_unknown_for_batch,
            "destinations": destination_counter,
            "batch_hash": batch_hash,
        }
        batch_summaries.append(batch_summary)
        history_rows.append({"event": "batch_complete", **batch_summary})
        _progress(
            f"[promote] batch {idx}/{len(batch_dirs)} '{batch_id}' complete: "
            f"accepted={accepted_for_batch} ready_dup={rejected_ready_for_batch} canonical_dup={rejected_canonical_for_batch} "
            f"conflict={rejected_conflict_for_batch} quality={rejected_quality_for_batch} quarantine={quarantined_unknown_for_batch}"
        )
        checkpoint(batch_id, "running")
        if batch_hash:
            seen_batch_hashes[batch_resolved] = batch_hash
            seen_run_batch_hashes[batch_hash] = {"batch_id": batch_id, "source_ref": source_ref}

    save_canonical_index(index_dir, canonical_index)
    write_jsonl(index_dir / "promotion_log.jsonl", promotion_log_rows)

    write_jsonl(reports_dir / "accepted_items.jsonl", accepted_rows)
    write_jsonl(reports_dir / "rejected_duplicates_ready_pool.jsonl", rejected_ready_duplicates)
    write_jsonl(reports_dir / "rejected_duplicates_canonical_bank.jsonl", rejected_canonical_duplicates)
    write_jsonl(reports_dir / "rejected_conflicts.jsonl", rejected_conflicts)
    write_jsonl(reports_dir / "rejected_quality.jsonl", rejected_quality)
    write_jsonl(quarantine_dir / "unknown_content_type.jsonl", quarantined_unknown_content)

    state = {
        "promoted_batch_hashes": seen_batch_hashes,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "ready_root": str(ready_path),
        "canonical_root": str(canonical_path),
    }
    dump_json(state_path, state)

    coverage = build_coverage_report(batch_summaries)
    dump_json(reports_dir / "promotion_coverage.json", coverage)

    summary = {
        "ready_root": str(ready_path),
        "canonical_root": str(canonical_path),
        "discovered_batch_count": len(batch_dirs),
        "accepted_count": len(accepted_rows),
        "rejected_ready_duplicates": len(rejected_ready_duplicates),
        "rejected_canonical_duplicates": len(rejected_canonical_duplicates),
        "rejected_conflicts": len(rejected_conflicts),
        "rejected_quality": len(rejected_quality),
        "quarantined_unknown_content": len(quarantined_unknown_content),
        "destination_count": len(created_destinations),
        "coverage": coverage,
        "batches": batch_summaries,
    }
    dump_json(reports_dir / "promotion_summary.json", summary)
    checkpoint(None, "completed")
    _progress(
        f"[promote] complete: discovered_batches={len(batch_dirs)} accepted={len(accepted_rows)} "
        f"ready_dup={len(rejected_ready_duplicates)} canonical_dup={len(rejected_canonical_duplicates)} "
        f"conflict={len(rejected_conflicts)} quality={len(rejected_quality)} quarantine={len(quarantined_unknown_content)}"
    )
    return summary

def build_coverage_report(batch_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    by_destination: dict[str, int] = {}
    by_track: dict[str, int] = {}
    by_profession: dict[str, int] = {}
    by_bucket: dict[str, int] = {}
    by_level: dict[str, int] = {}
    by_profession_level: dict[str, int] = {}
    by_bucket_level: dict[str, int] = {}
    for batch in batch_summaries:
        destinations = batch.get("destinations") or {}
        for dest, count in destinations.items():
            count_i = int(count)
            by_destination[dest] = by_destination.get(dest, 0) + count_i
            parts = str(dest).split("/")
            if not parts:
                continue
            track = parts[0]
            by_track[track] = by_track.get(track, 0) + count_i
            if track == "professional" and len(parts) >= 4:
                profession = parts[1]
                bucket = parts[2]
                level = parts[3].replace('.json','')
            elif track == "general" and len(parts) >= 3:
                profession = "general"
                bucket = parts[1]
                level = parts[2].replace('.json','')
            else:
                continue
            by_profession[profession] = by_profession.get(profession, 0) + count_i
            by_bucket[bucket] = by_bucket.get(bucket, 0) + count_i
            by_level[level] = by_level.get(level, 0) + count_i
            by_profession_level[f"{profession}/{level}"] = by_profession_level.get(f"{profession}/{level}", 0) + count_i
            by_bucket_level[f"{bucket}/{level}"] = by_bucket_level.get(f"{bucket}/{level}", 0) + count_i
    return {
        "by_destination": dict(sorted(by_destination.items())),
        "by_track": dict(sorted(by_track.items())),
        "by_profession": dict(sorted(by_profession.items())),
        "by_bucket": dict(sorted(by_bucket.items())),
        "by_level": dict(sorted(by_level.items())),
        "by_profession_level": dict(sorted(by_profession_level.items())),
        "by_bucket_level": dict(sorted(by_bucket_level.items())),
    }


def _ascii_probe(text: str) -> str:
    text = text.lower().replace("ä", "a").replace("ö", "o").replace("å", "a")
    text = re.sub(r"[^a-z0-9_./ -]+", " ", text)
    return text


def _contains_alias(probe: str, alias: str) -> bool:
    alias_a = _ascii_probe(alias)
    if not alias_a:
        return False
    if any(ch in alias_a for ch in [' ', '_', '/']):
        return alias_a in probe
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(alias_a)}(?![a-z0-9])", probe))


def detect_profession_from_text(text: str | None) -> str | None:
    probe = _ascii_probe(str(text or ""))
    if not probe:
        return None
    for slug, aliases in PROFESSION_PATTERNS:
        if any(_contains_alias(probe, alias) for alias in aliases):
            return slug
    return None


def detect_level_from_tags_and_difficulty(item: dict[str, Any], manifest: dict[str, Any]) -> str | None:
    tags: list[str] = []
    for raw in list(item.get("tags") or []) + list((manifest.get("tags") or []) if isinstance(manifest.get("tags"), list) else []):
        if isinstance(raw, str):
            tags.append(raw.lower())
    tag_text = " ".join(tags)
    if re.search(r"(?<![a-z0-9])c1(?![a-z0-9])|(?<![a-z0-9])c2(?![a-z0-9])", tag_text):
        return "C1_C2"
    if re.search(r"(?<![a-z0-9])b1(?![a-z0-9])|(?<![a-z0-9])b2(?![a-z0-9])", tag_text):
        return "B1_B2"
    if re.search(r"(?<![a-z0-9])a2(?![a-z0-9])", tag_text):
        return "A2"
    if re.search(r"(?<![a-z0-9])a1(?![a-z0-9])", tag_text):
        return "A1_A2"
    difficulty = str(item.get("difficulty") or manifest.get("difficulty") or "").lower().strip()
    return DIFFICULTY_LEVEL_HINTS.get(difficulty)


def derive_batch_resolution(manifest: dict[str, Any], *, batch_id: str | None = None, source_ref: str | None = None) -> dict[str, Any]:
    return {
        "profession": resolve_profession_slug({}, manifest, batch_id=batch_id, source_ref=source_ref),
        "level_band": resolve_level_band({}, manifest, batch_id=batch_id, source_ref=source_ref)[0],
    }


def destination_for_item(item: dict[str, Any], manifest: dict[str, Any], *, batch_id: str | None = None, source_ref: str | None = None) -> tuple[Destination, dict[str, Any], dict[str, Any]]:
    profession_slug = resolve_profession_slug(item, manifest, batch_id=batch_id, source_ref=source_ref)
    if profession_slug in {"none", "general", None}:
        track = "general"
        profession_slug = None
    elif profession_slug not in {"doctor", "nurse", "practical_nurse", "occupational_therapy"}:
        track = "general"
        profession_slug = None
    else:
        track = "professional"

    content_type = str(item.get("content_type") or manifest.get("content_type") or "")
    if content_type not in CONTENT_TYPE_BUCKETS:
        raise ValueError(f"Unknown content_type for promotion: {content_type}")
    bucket = CONTENT_TYPE_BUCKETS[content_type]
    level_band, level_origin = resolve_level_band(item, manifest, batch_id=batch_id, source_ref=source_ref)
    level_file = level_band.lower()
    destination = Destination(track=track, profession=profession_slug, bucket=bucket, level_file=f"{level_file}.json")
    routed_item = rewrite_item_for_destination(item, manifest, destination, level_band)
    return destination, routed_item, {"profession": profession_slug or "general", "level_band": level_band, "level_origin": level_origin}


def resolve_profession_slug(item: dict[str, Any], manifest: dict[str, Any], *, batch_id: str | None = None, source_ref: str | None = None) -> str:
    profession_value = item.get("profession")
    explicit_none = False
    profession_slug = None
    if isinstance(profession_value, dict):
        profession_slug = profession_value.get("slug")
        explicit_none = profession_value.get("track") == "none" or profession_value.get("slug") in {None, "none", "general"}
    elif isinstance(profession_value, str):
        profession_slug = profession_value
    if not profession_slug and not explicit_none:
        profession_slug = manifest.get("profession")
    profession_slug = normalize_profession_slug(profession_slug)

    context_bits = [
        str(batch_id or ""),
        str(source_ref or ""),
        str(manifest.get("source_id") or ""),
        str(manifest.get("path") or ""),
        str(item.get("path") or ""),
        str(item.get("_source_path") or ""),
    ]
    context_prof = detect_profession_from_text(" ".join(context_bits))
    if context_prof:
        if context_prof == "practical_nurse":
            return "practical_nurse"
        if profession_slug in {None, "none", "general"}:
            return context_prof
    if profession_slug in {"none", "general", None}:
        return "general"
    return profession_slug




def coarsen_level_band(value: str | None) -> str | None:
    if value in {None, "UNKNOWN", "NONE"}:
        return None
    mapping = {
        "A1": "A1_A2",
        "A1_A2": "A1_A2",
        "A2": "A2",
        "B1": "B1_B2",
        "B2": "B1_B2",
        "B1_B2": "B1_B2",
        "C1": "C1_C2",
        "C2": "C1_C2",
        "C1_C2": "C1_C2",
    }
    return mapping.get(value, value)

def resolve_level_band(item: dict[str, Any], manifest: dict[str, Any], *, batch_id: str | None = None, source_ref: str | None = None) -> tuple[str, str]:
    explicit = coarsen_level_band(normalize_level_band(item.get("level_band") or manifest.get("level_band")))
    tag_hint = coarsen_level_band(detect_level_from_tags_and_difficulty(item, manifest))
    context_text = " ".join([
        str(batch_id or ""),
        str(source_ref or ""),
        str(item.get("id") or ""),
        str(item.get("path") or ""),
        str(manifest.get("path") or ""),
        str(item.get("source_id") or item.get("_source_id") or ""),
        str(manifest.get("source_id") or ""),
        " ".join([str(t) for t in (item.get("tags") or []) if isinstance(t, str)]),
        str(item.get("difficulty") or manifest.get("difficulty") or ""),
        str(item.get("authoring_note") or manifest.get("authoring_note") or ""),
    ])
    hinted = coarsen_level_band(detect_level_from_text(context_text)) or tag_hint
    if explicit and hinted and explicit == "B1_B2" and hinted != explicit:
        return hinted, "context_override"
    if explicit and tag_hint and explicit in {"A1", "A2", "B1", "B2", "C1", "C2"}:
        return explicit, "explicit"
    if hinted and explicit in {None, "UNKNOWN", "NONE"}:
        return hinted, "context_inferred"
    if explicit:
        return explicit, "explicit"
    if hinted:
        return hinted, "context_inferred"
    return "B1_B2", "default"


def detect_level_from_text(text: str) -> str | None:
    probe = str(text or "")
    for pattern, label in LEVEL_PATTERNS:
        if pattern.search(probe):
            return label
    return None


def normalize_level_band(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip().upper().replace("-", "_").replace(" ", "_")
    text = re.sub(r"_+", "_", text)
    aliases = {
        "A1A2": "A1_A2",
        "A1_A2": "A1_A2",
        "A1": "A1",
        "A2": "A2",
        "B1B2": "B1_B2",
        "B1_B2": "B1_B2",
        "B1": "B1",
        "B2": "B2",
        "C1C2": "C1_C2",
        "C1_C2": "C1_C2",
        "C1": "C1",
        "C2": "C2",
    }
    return aliases.get(text, None)


def rewrite_item_for_destination(item: dict[str, Any], manifest: dict[str, Any], destination: Destination, level_band: str) -> dict[str, Any]:
    routed = json.loads(json.dumps(item, ensure_ascii=False))
    routed["level_band"] = level_band
    bucket_path = destination.bucket
    if destination.track == "general":
        routed["path"] = f"general/{bucket_path}"
        routed["profession"] = {"track": "none", "slug": "general", "label": "General"}
    else:
        routed["path"] = f"professional/{destination.profession}/{bucket_path}"
        label = str(destination.profession or "").replace("_", " ").title()
        routed["profession"] = {"track": "professional", "slug": destination.profession, "label": label}
    routed.setdefault("promotion", {})
    routed["promotion"]["bucket"] = destination.bucket
    routed["promotion"]["level_file"] = destination.level_file
    return routed


def normalize_profession_slug(value: Any) -> str:
    if value is None:
        return "none"
    text = str(value).strip().lower().replace("/", "_").replace("-", "_").replace(" ", "_")
    aliases = {
        "practical_nurse": "practical_nurse",
        "lahihoitaja": "practical_nurse",
        "lähihoitaja": "practical_nurse",
        "sairaanhoitaja": "nurse",
        "laakari": "doctor",
        "lääkäri": "doctor",
        "occupational_therapy": "occupational_therapy",
        "occupational therapist": "occupational_therapy",
        "yki": "general",
        "yki_exam": "general",
    }
    return aliases.get(text, text)


def destination_key_string(destination: Destination) -> str:
    if destination.track == "general":
        return f"general/{destination.bucket}/{destination.level_file}"
    return f"professional/{destination.profession}/{destination.bucket}/{destination.level_file}"


def destination_root(canonical_root: Path, lane: str, destination: Destination) -> Path:
    if destination.track == "general":
        return canonical_root / lane / "general" / destination.bucket
    return canonical_root / lane / "professional" / str(destination.profession) / destination.bucket


def ensure_destination_structure(canonical_root: Path, destination: Destination, created_destinations: set[str]) -> None:
    key = destination_key_string(destination)
    if key in created_destinations:
        return
    created_destinations.add(key)
    for lane in ["candidate", "validated", "manifests", "sidecars"]:
        lane_root = destination_root(canonical_root, lane, destination)
        lane_root.mkdir(parents=True, exist_ok=True)
        if lane == "manifests":
            manifest_path = lane_root / destination.level_file.replace(".json", ".manifest.json")
            if not manifest_path.exists():
                dump_json(manifest_path, default_manifest_payload(destination))
        elif lane == "sidecars":
            sidecar_path = lane_root / destination.level_file.replace(".json", ".sidecar.json")
            if not sidecar_path.exists():
                dump_json(sidecar_path, default_sidecar_payload(destination))
        else:
            data_path = lane_root / destination.level_file
            if not data_path.exists():
                dump_json(data_path, {"cards": []})
    for lane in ["published", "reports", "index", "quarantine", "imports", "normalized", "raw_inventory"]:
        (canonical_root / lane).mkdir(parents=True, exist_ok=True)


def default_manifest_payload(destination: Destination) -> dict[str, Any]:
    return {
        "track": destination.track,
        "profession": destination.profession or "none",
        "bucket": destination.bucket,
        "level_band": destination.level_file.replace(".json", "").upper(),
        "card_count": 0,
        "source_ids": [],
    }


def default_sidecar_payload(destination: Destination) -> dict[str, Any]:
    return {
        "track": destination.track,
        "profession": destination.profession or "none",
        "bucket": destination.bucket,
        "level_band": destination.level_file.replace(".json", "").upper(),
        "card_count": 0,
        "item_ids": [],
        "source_ids": [],
    }


def append_item_to_destination(canonical_root: Path, destination: Destination, item: dict[str, Any], manifest: dict[str, Any]) -> None:
    data_cache: dict[tuple[str, str], dict[str, Any]] = {}
    touched: set[tuple[str, str]] = set()
    append_items_to_destination_batch(canonical_root, destination, [item], manifest, data_cache, touched)
    flush_cached_destination_payloads(data_cache, touched)

def update_sidecar_and_manifest(canonical_root: Path, destination: Destination, item: dict[str, Any], manifest: dict[str, Any]) -> None:
    manifest_cache: dict[str, dict[str, Any]] = {}
    sidecar_cache: dict[str, dict[str, Any]] = {}
    touched: set[str] = set()
    update_sidecar_and_manifest_batch(
        canonical_root,
        destination,
        [str(item.get("id"))] if item.get("id") else [],
        {str(manifest.get("source_id"))} if manifest.get("source_id") else set(),
        manifest,
        manifest_cache,
        sidecar_cache,
        touched,
    )
    flush_cached_meta_payloads(manifest_cache, sidecar_cache, touched)



def _load_json_payload(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if path.exists():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(payload, dict):
                return payload
        except Exception:
            pass
    return dict(fallback)


def append_items_to_destination_batch(
    canonical_root: Path,
    destination: Destination,
    items: list[dict[str, Any]],
    manifest: dict[str, Any],
    data_cache: dict[tuple[str, str], dict[str, Any]],
    touched_keys: set[tuple[str, str]],
) -> None:
    destination_key = destination_key_string(destination)
    for lane in ["candidate", "validated"]:
        cache_key = (lane, destination_key)
        if cache_key not in data_cache:
            lane_root = destination_root(canonical_root, lane, destination)
            data_path = lane_root / destination.level_file
            payload = _load_json_payload(data_path, {"cards": []})
            cards = payload.get("cards")
            if not isinstance(cards, list):
                payload["cards"] = []
            data_cache[cache_key] = {"path": data_path, "payload": payload}
        payload = data_cache[cache_key]["payload"]
        cards = payload.setdefault("cards", [])
        cards.extend(items)
        payload["manifest"] = {
            "track": destination.track,
            "profession": destination.profession or "none",
            "bucket": destination.bucket,
            "level_band": destination.level_file.replace(".json", "").upper(),
            "last_promoted_source_id": manifest.get("source_id"),
        }
        touched_keys.add(cache_key)


def flush_cached_destination_payloads(
    data_cache: dict[tuple[str, str], dict[str, Any]],
    touched_keys: set[tuple[str, str]],
) -> None:
    for cache_key in sorted(touched_keys):
        entry = data_cache.get(cache_key)
        if not entry:
            continue
        dump_json(entry["path"], entry["payload"])


def update_sidecar_and_manifest_batch(
    canonical_root: Path,
    destination: Destination,
    item_ids: list[str],
    source_ids: set[str],
    manifest: dict[str, Any],
    manifest_cache: dict[str, dict[str, Any]],
    sidecar_cache: dict[str, dict[str, Any]],
    touched_keys: set[str],
) -> None:
    destination_key = destination_key_string(destination)
    manifest_key = f"manifest::{destination_key}"
    sidecar_key = f"sidecar::{destination_key}"

    if manifest_key not in manifest_cache:
        manifest_path = destination_root(canonical_root, "manifests", destination) / destination.level_file.replace(".json", ".manifest.json")
        manifest_cache[manifest_key] = {
            "path": manifest_path,
            "payload": _load_json_payload(manifest_path, default_manifest_payload(destination)),
        }
    if sidecar_key not in sidecar_cache:
        sidecar_path = destination_root(canonical_root, "sidecars", destination) / destination.level_file.replace(".json", ".sidecar.json")
        sidecar_cache[sidecar_key] = {
            "path": sidecar_path,
            "payload": _load_json_payload(sidecar_path, default_sidecar_payload(destination)),
        }

    manifest_payload = manifest_cache[manifest_key]["payload"]
    manifest_payload["card_count"] = int(manifest_payload.get("card_count", 0)) + len(item_ids)
    existing_source_ids = set(manifest_payload.get("source_ids") or [])
    existing_source_ids.update(source_ids)
    if manifest.get("source_id"):
        existing_source_ids.add(str(manifest.get("source_id")))
    manifest_payload["source_ids"] = sorted(existing_source_ids)

    sidecar_payload = sidecar_cache[sidecar_key]["payload"]
    sidecar_payload["card_count"] = int(sidecar_payload.get("card_count", 0)) + len(item_ids)
    existing_item_ids = list(sidecar_payload.get("item_ids") or [])
    existing_item_ids.extend([str(i) for i in item_ids if i])
    sidecar_payload["item_ids"] = existing_item_ids
    existing_sidecar_sources = set(sidecar_payload.get("source_ids") or [])
    existing_sidecar_sources.update(source_ids)
    if manifest.get("source_id"):
        existing_sidecar_sources.add(str(manifest.get("source_id")))
    sidecar_payload["source_ids"] = sorted(existing_sidecar_sources)

    touched_keys.add(manifest_key)
    touched_keys.add(sidecar_key)


def flush_cached_meta_payloads(
    manifest_cache: dict[str, dict[str, Any]],
    sidecar_cache: dict[str, dict[str, Any]],
    touched_keys: set[str],
) -> None:
    for key in sorted(touched_keys):
        if key.startswith("manifest::"):
            entry = manifest_cache.get(key)
        else:
            entry = sidecar_cache.get(key)
        if not entry:
            continue
        dump_json(entry["path"], entry["payload"])


def save_canonical_index(index_dir: Path, canonical_index: dict[str, Any]) -> None:
    index_dir.mkdir(parents=True, exist_ok=True)
    write_jsonl(index_dir / "signature_index.jsonl", [
        {"dedupe_signature": signature, "refs": refs}
        for signature, refs in sorted(canonical_index.get("signatures", {}).items())
    ])
    write_jsonl(index_dir / "anchor_index.jsonl", [
        {"anchor": anchor, "ref": ref}
        for anchor, ref in sorted(canonical_index.get("anchors", {}).items())
    ])

def load_canonical_index(canonical_root: Path) -> dict[str, Any]:
    index_dir = canonical_root / "index"
    sig_path = index_dir / "signature_index.jsonl"
    anchor_path = index_dir / "anchor_index.jsonl"
    if sig_path.exists():
        try:
            signatures: dict[str, list[dict[str, Any]]] = {}
            for row in read_jsonl(sig_path):
                if isinstance(row, dict) and row.get("dedupe_signature"):
                    signatures[str(row["dedupe_signature"])] = list(row.get("refs") or [])
            anchors: dict[str, dict[str, Any]] = {}
            if anchor_path.exists():
                for row in read_jsonl(anchor_path):
                    if isinstance(row, dict) and row.get("anchor"):
                        anchors[str(row["anchor"])] = dict(row.get("ref") or {})
            return {"signatures": signatures, "anchors": anchors}
        except Exception:
            pass

    signatures: dict[str, list[dict[str, Any]]] = {}
    anchors: dict[str, dict[str, Any]] = {}
    for lane in ["candidate", "validated", "published"]:
        lane_root = canonical_root / lane
        if not lane_root.exists():
            continue
        for path in lane_root.rglob("*.json"):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
            rows = []
            if isinstance(payload, dict) and isinstance(payload.get("cards"), list):
                rows = payload["cards"]
            elif isinstance(payload, list):
                rows = payload
            for row in rows:
                occ = _occurrence_from_item(row, path, {})
                if not occ:
                    continue
                ref = {
                    "source_path": str(path),
                    "item_id": row.get("id"),
                    "lane": lane,
                }
                signatures.setdefault(occ["dedupe_signature"], []).append(ref)
                anchor = semantic_anchor(row, {})
                if anchor and anchor not in anchors:
                    ref2 = dict(ref)
                    ref2["meaning_signature"] = meaning_signature(row)
                    anchors[anchor] = ref2
    return {"signatures": signatures, "anchors": anchors}

def semantic_anchor(item: dict[str, Any], manifest: dict[str, Any]) -> str | None:
    content_type = str(item.get("content_type") or manifest.get("content_type") or "")
    path = str(item.get("path") or manifest.get("path") or "")
    content = item.get("content") or {}
    front = content.get("front") if isinstance(content, dict) else {}
    back = content.get("back") if isinstance(content, dict) else {}
    if not isinstance(front, dict):
        front = {}
    if not isinstance(back, dict):
        back = {}
    source_text = ""
    if content_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        source_text = str(front.get("term") or "")
        source_text = normalize_space(source_text)
        if not source_text:
            return None
        return stable_hash(content_type, path, source_text.lower(), length=16)
    if content_type in {"phrase_card", "sentence_card", "idiom_card"}:
        source_text = str(front.get("sentence") or "")
        source_text = normalize_space(source_text)
        if not source_text:
            return None
        return stable_hash(content_type, path, source_text.lower(), length=16)
    if content_type == "grammar_card":
        pattern = normalize_space(str(front.get("pattern") or item.get("pattern") or ""))
        source_text = normalize_space(str(back.get("example_sentence") or item.get("example_fi") or item.get("example") or ""))
        if not pattern or not source_text:
            return None
        return stable_hash(content_type, path, pattern.lower(), source_text.lower(), length=16)
    return None

def meaning_signature(item: dict[str, Any]) -> str:
    content = item.get("content") or {}
    back = content.get("back") if isinstance(content, dict) else {}
    gloss = ""
    if isinstance(back, dict):
        gloss = normalize_space(str(back.get("gloss") or ""))
    return stable_hash(gloss.lower(), length=12)


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def promotion_quality_reasons(item: dict[str, Any], manifest: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    content_type = str(item.get("content_type") or manifest.get("content_type") or "")
    content = item.get("content") or {}
    front = content.get("front") if isinstance(content, dict) else {}
    back = content.get("back") if isinstance(content, dict) else {}
    if not isinstance(front, dict):
        front = {}
    if not isinstance(back, dict):
        back = {}
    source_text = ""
    if content_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        source_text = normalize_space(str(front.get("term") or ""))
    elif content_type in {"phrase_card", "sentence_card", "idiom_card"}:
        source_text = normalize_space(str(front.get("sentence") or ""))
    elif content_type == "grammar_card":
        source_text = normalize_space(str(back.get("example_sentence") or ""))
        if not normalize_space(str(front.get("pattern") or "")):
            reasons.append("missing_grammar_pattern")
        if not normalize_space(str(front.get("usage") or "")):
            reasons.append("missing_grammar_usage")
    else:
        reasons.append("unknown_content_type")

    gloss = normalize_space(str(back.get("gloss") or ""))
    if not source_text:
        reasons.append("missing_source_text")
    if not gloss:
        reasons.append("missing_gloss")
    if source_text and gloss and source_text.lower() == gloss.lower():
        reasons.append("source_text_equals_gloss")
    if "what does" in gloss.lower() or "choose the best" in gloss.lower():
        reasons.append("gloss_looks_like_prompt_not_translation")
    if is_probably_english_source(source_text, content_type):
        reasons.append("source_body_looks_english_or_not_finnish")
    if is_probably_finnish_gloss(gloss):
        reasons.append("gloss_looks_finnish_not_english")
    if content_type in {"phrase_card", "sentence_card", "idiom_card"} and source_text and len(source_text.split()) < 2:
        reasons.append("communicative_body_too_short")
    if content_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"} and len(source_text.split()) > 8:
        reasons.append("term_excessively_long")
    quality = (((item.get("quality") or {}).get("quality_score")) if isinstance(item.get("quality"), dict) else None)
    try:
        if quality is not None and float(quality) < 0.55:
            reasons.append("quality_score_below_promotion_threshold")
    except Exception:
        pass
    return reasons


def is_probably_english_source(text: str, content_type: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    tokens = re.findall(r"[a-zA-ZåäöÅÄÖ]+", lower)
    if not tokens:
        return False
    english_hits = sum(1 for t in tokens if t in ENGLISH_STOPWORDS)
    finnish_hits = sum(1 for hint in FINNISH_HINTS if hint in lower)
    if content_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        # single-word terms may legitimately look international
        return False if finnish_hits > 0 else (english_hits >= 2 and len(tokens) >= 2)
    return english_hits >= 2 and finnish_hits == 0


def is_probably_finnish_gloss(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    finnish_hits = sum(1 for hint in FINNISH_HINTS if hint in lower)
    english_hits = sum(1 for t in re.findall(r"[a-zA-ZåäöÅÄÖ]+", lower) if t in ENGLISH_STOPWORDS)
    return finnish_hits >= 2 and english_hits == 0
