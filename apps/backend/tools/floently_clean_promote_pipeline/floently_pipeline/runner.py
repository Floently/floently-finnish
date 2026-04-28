from __future__ import annotations

import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from .ai import OpenAIHelper
from .aps import build_aps_items
from .config import PipelineConfig
from .dedupe import dedupe_items
from .extract import extract_items
from .global_dedupe import build_global_index, dedupe_against_global_index
from .intake import RawBatch, inventory_inputs, read_raw_batches
from .manifest import infer_manifest
from .normalize import normalize_items
from .quality import validate_items
from .utils import dump_json, ensure_dir, file_fast_fingerprint, list_input_files, load_json_if_exists, sha256_file, write_jsonl


class PipelineRunner:
    def __init__(self, config: PipelineConfig, ai_mode: str = "off", openai_api_key: str | None = None, model: str | None = None, global_bank_paths: list[str] | None = None) -> None:
        self.config = config
        self.ai_mode = ai_mode
        ai_model = model or config.ai.get("default_model", "gpt-4o-mini")
        ai_timeout = float(config.ai.get("request_timeout_seconds", 20.0))
        self.ai = OpenAIHelper(api_key=openai_api_key, model=ai_model, timeout_seconds=ai_timeout)
        configured_global_paths = list(config.global_dedupe.get("paths", []))
        if global_bank_paths:
            configured_global_paths.extend(global_bank_paths)
        self.global_bank_paths = [p for p in configured_global_paths if p]
        self.cross_batch_within_run = bool(config.global_dedupe.get("cross_batch_within_run", True))
        self.global_index = build_global_index(self.global_bank_paths) if self.global_bank_paths else None
        self.run_seen: dict[str, list[dict[str, Any]]] = {}
        self.progress_interval_seconds = float(config.defaults.get("progress_interval_seconds", 1.0))
        self.incremental_enabled = bool(config.defaults.get("incremental_scan_enabled", True))
        self.ai_batch_recover_size = int(config.ai.get("batch_recover_size", 25))
        self.ai_max_recover_items_per_batch = int(config.ai.get("max_recover_items_per_batch", 40))
        self.ai_recover_only_below_confidence = float(config.ai.get("recover_only_below_confidence", 0.5))
        self.ai_skip_recover_for_explicit_clean_batches = bool(config.ai.get("skip_recover_for_explicit_clean_batches", True))
        self.ai_skip_batch_verify_for_explicit_clean_batches = bool(config.ai.get("skip_batch_verify_for_explicit_clean_batches", True))
        self.large_auxiliary_skip_threshold = int(config.defaults.get("large_auxiliary_skip_threshold", 2000))
        self.large_auxiliary_skip_name_hints = set(config.defaults.get("large_auxiliary_skip_name_hints", [
            "generated_cards", "filtered_cards", "enriched_cards", "vocabulary_full", "yki_exercises"
        ]))

    def _log(self, message: str) -> None:
        print(message, file=sys.stderr, flush=True)

    def _scan_cache_path(self, root: Path) -> Path:
        return root / ".scan_cache.json"

    def _load_scan_cache(self, root: Path) -> dict[str, Any]:
        return load_json_if_exists(self._scan_cache_path(root), default={"version": 13, "files": {}, "updated_at": None}) or {"version": 13, "files": {}, "updated_at": None}

    def _save_scan_cache(self, root: Path, cache: dict[str, Any]) -> None:
        cache["updated_at"] = datetime.utcnow().isoformat() + "Z"
        dump_json(self._scan_cache_path(root), cache)

    def _discover_batches(self, input_path: str, root: Path) -> tuple[list[RawBatch], dict[str, Any], list[dict[str, Any]]]:
        cache = self._load_scan_cache(root)
        files_state = cache.setdefault("files", {})
        discovered: list[RawBatch] = []
        inventory: list[dict[str, Any]] = []
        skipped_by_cache = 0

        for path in list_input_files(Path(input_path)):
            fp = file_fast_fingerprint(path)
            path_key = str(path.resolve())
            cached = files_state.get(path_key)
            if self.incremental_enabled and cached and cached.get("size") == fp["size"] and cached.get("mtime_ns") == fp["mtime_ns"]:
                for b in cached.get("batches", []):
                    rb = RawBatch(
                        source_path=path_key,
                        source_name=b.get("source_name") or path.name,
                        manifest=b.get("manifest"),
                        items=[],
                        raw_format=b.get("raw_format", "cached_batch"),
                        skip_reason="unchanged file already scanned; using existing ready-bank artifacts",
                        auxiliary_kind="cached_source",
                        file_fingerprint=fp,
                        batch_key=b.get("batch_key"),
                        batch_content_hash=b.get("batch_content_hash"),
                    )
                    discovered.append(rb)
                inventory.append({"source_name": path.name, "source_path": path_key, "raw_format": "cached_source_json", "status": "cached", "input_count": 0})
                skipped_by_cache += 1
                continue

            file_hash = sha256_file(path)
            if self.incremental_enabled and cached and cached.get("file_sha256") == file_hash:
                for b in cached.get("batches", []):
                    rb = RawBatch(
                        source_path=path_key,
                        source_name=b.get("source_name") or path.name,
                        manifest=b.get("manifest"),
                        items=[],
                        raw_format=b.get("raw_format", "cached_batch"),
                        skip_reason="unchanged file content already scanned; using existing ready-bank artifacts",
                        auxiliary_kind="cached_source",
                        file_fingerprint=fp,
                        batch_key=b.get("batch_key"),
                        batch_content_hash=b.get("batch_content_hash"),
                    )
                    discovered.append(rb)
                inventory.append({"source_name": path.name, "source_path": path_key, "raw_format": "cached_source_json", "status": "cached", "input_count": 0})
                skipped_by_cache += 1
                files_state[path_key] = {**fp, "file_sha256": file_hash, "batches": cached.get("batches", [])}
                continue

            try:
                parsed_batches = read_raw_batches(path)
            except Exception as exc:
                parsed_batches = [RawBatch(
                    source_path=path_key,
                    source_name=path.name,
                    manifest={
                        "content_type": "metadata_only",
                        "language": "fi",
                        "path": "unsupported/source",
                        "domain": "unsupported_input",
                        "profession": "none",
                        "level_band": "unknown",
                        "source_id": f"source.unsupported.{path.stem}",
                        "authoring_note": "unsupported source preserved as skipped batch",
                    },
                    items=[],
                    raw_format="unsupported_source_json",
                    skip_reason=f"unsupported input structure: {exc}",
                    auxiliary_kind="unsupported_source",
                )]
            for rb in parsed_batches:
                rb.file_fingerprint = fp
                if not rb.batch_key:
                    rb.batch_key = f"{path_key}|{rb.source_name}"
                discovered.append(rb)
            files_state[path_key] = {
                **fp,
                "file_sha256": file_hash,
                "batches": [
                    {
                        "source_name": b.source_name,
                        "manifest": b.manifest,
                        "raw_format": b.raw_format,
                        "batch_key": b.batch_key,
                        "batch_content_hash": b.batch_content_hash,
                    }
                    for b in parsed_batches
                ],
            }
        cache["stats"] = {"cached_files_skipped": skipped_by_cache, "discovered_batches": len(discovered)}
        self._save_scan_cache(root, cache)
        return discovered, cache, inventory

    def _write_run_checkpoint(self, run_id: str, root: Path, *, status: str, inventory: list[dict[str, Any]], summary_batches: list[dict[str, Any]], run_start: float, error: str | None = None, interrupted: bool = False, current_batch: dict[str, Any] | None = None, cache_stats: dict[str, Any] | None = None) -> dict[str, Any]:
        summary = {
            "run_id": run_id,
            "status": status,
            "output_root": str(root),
            "batch_count": len(summary_batches),
            "processed_batch_count": sum(1 for b in summary_batches if b.get("status") == "processed"),
            "skipped_batch_count": sum(1 for b in summary_batches if b.get("status") in {"skipped", "cached"}),
            "failed_batch_count": sum(1 for b in summary_batches if b.get("status") == "failed"),
            "interrupted": interrupted,
            "error": error,
            "current_batch": current_batch,
            "global_bank_paths": self.global_bank_paths,
            "global_bank_signature_count": self.global_index.size if self.global_index is not None else 0,
            "elapsed_seconds": round(time.monotonic() - run_start, 3),
            "cache": cache_stats or {},
            "batches": summary_batches,
        }
        dump_json(root / "inventory.json", inventory)
        dump_json(root / "summary.json", summary)
        dump_json(root / "run_status.json", {
            "run_id": run_id,
            "status": status,
            "interrupted": interrupted,
            "error": error,
            "current_batch": current_batch,
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "elapsed_seconds": summary["elapsed_seconds"],
        })
        return summary

    def _checkpoint_batch(self, batch_root: Path, status_payload: dict[str, Any]) -> None:
        dump_json(batch_root / "batch_status.json", status_payload)

    def _serialize_extracted(self, extracted: list[Any]) -> list[dict[str, Any]]:
        return [{"item_type": i.item_type, "core_fields": i.core_fields, "confidence": i.confidence, "notes": i.notes, "raw_fragment": i.raw_fragment, "needs_ai_help": i.needs_ai_help} for i in extracted]

    def _serialize_normalized(self, normalized: list[Any]) -> list[dict[str, Any]]:
        return [{"item_type": i.item_type, "fields": i.fields, "normalized_key": i.normalized_key, "dedupe_signature": i.dedupe_signature, "score_seed": i.score_seed, "notes": i.notes, "needs_review": i.needs_review, "metadata": getattr(i, "metadata", {})} for i in normalized]

    def _is_explicit_clean_batch(self, raw_batch: Any) -> bool:
        return bool(raw_batch.manifest) and raw_batch.raw_format in {
            "batch_manifest_vocabulary_items_json", "batch_manifest_grammar_items_json", "batch_manifest_sentence_items_json",
            "batch_manifest_phrase_items_json", "batch_manifest_slang_items_json", "batch_manifest_idiom_items_json",
            "sequential_manifest_plus_items", "manifest_wrapper_json", "flat_manifest_with_items_json", "jsonl_manifest_first",
            "compiled_cards_array_json"
        }

    def _should_skip_large_auxiliary_batch(self, raw_batch: Any) -> tuple[bool, str | None]:
        if raw_batch.manifest:
            return False, None
        if raw_batch.raw_format not in {"items_array_json", "items_array_stream_json"}:
            return False, None
        if len(raw_batch.items) < self.large_auxiliary_skip_threshold:
            return False, None
        stem = Path(raw_batch.source_name).stem.lower()
        if any(h in stem for h in self.large_auxiliary_skip_name_hints):
            return True, "recognized large generic auxiliary items array; quarantined for speed because it repeatedly yields no canonical APS output"
        return False, None

    def run(self, input_path: str, output_root: str) -> dict[str, Any]:
        run_id = datetime.utcnow().strftime("run_%Y%m%dT%H%M%SZ")
        run_start = time.monotonic()
        root, output_alias_file = self._resolve_output_root(output_root)
        root.mkdir(parents=True, exist_ok=True)

        inventory: list[dict[str, Any]] = []
        summary_batches: list[dict[str, Any]] = []
        processed_items_total = 0
        cache_state = {"cached_files_skipped": 0, "discovered_batches": 0}

        self._log(f"[{run_id}] starting pipeline")
        self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, cache_stats=cache_state)
        try:
            self._log(f"[{run_id}] inventorying input source: {input_path}")
            batches, scan_cache, pre_inventory = self._discover_batches(input_path, root)
            cache_state = scan_cache.get("stats", cache_state)
            inventory.extend(pre_inventory)
            self._log(f"[{run_id}] discovered {len(batches)} batch(es)")
            if cache_state.get("cached_files_skipped"):
                self._log(f"[{run_id}] incremental scan skipped {cache_state['cached_files_skipped']} unchanged file(s)")
            if self.global_index is not None:
                self._log(f"[{run_id}] loaded global dedupe index with {self.global_index.size} signatures")
            self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, cache_stats=cache_state)

            for batch_no, raw_batch in enumerate(batches, start=1):
                batch_id = Path(raw_batch.source_name).stem
                batch_root = ensure_dir(root / "batches" / batch_id)
                batch_state = {
                    "batch_id": batch_id,
                    "batch_no": batch_no,
                    "batch_total": len(batches),
                    "source_name": raw_batch.source_name,
                    "source_path": raw_batch.source_path,
                    "raw_format": raw_batch.raw_format,
                    "status": "running",
                    "stage": "start",
                    "input_count": len(raw_batch.items),
                    "processed_items_total_before_batch": processed_items_total,
                    "batch_key": raw_batch.batch_key,
                }
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' start: raw_format={raw_batch.raw_format}, input_count={len(raw_batch.items)}")

                if raw_batch.auxiliary_kind == "cached_source":
                    summary_batch = {
                        "batch_id": batch_id,
                        "source_name": raw_batch.source_name,
                        "raw_format": raw_batch.raw_format,
                        "status": "cached",
                        "skip_reason": raw_batch.skip_reason,
                        "input_count": 0,
                        "extracted_count": 0,
                        "aps_count": 0,
                        "batch_key": raw_batch.batch_key,
                    }
                    summary_batches.append(summary_batch)
                    batch_state.update({"status": "cached", "stage": "cached", "skip_reason": raw_batch.skip_reason})
                    self._checkpoint_batch(batch_root, batch_state)
                    self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                    self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' cached: {raw_batch.skip_reason}")
                    continue

                if raw_batch.skip_reason:
                    payload = {
                        "source_name": raw_batch.source_name,
                        "source_path": raw_batch.source_path,
                        "raw_format": raw_batch.raw_format,
                        "auxiliary_kind": raw_batch.auxiliary_kind,
                        "skip_reason": raw_batch.skip_reason,
                        "input_count": len(raw_batch.items),
                        "manifest_hint": raw_batch.manifest,
                    }
                    dump_json(batch_root / "skipped.json", payload)
                    inventory.append({"source_name": raw_batch.source_name, "source_path": raw_batch.source_path, "raw_format": raw_batch.raw_format, "status": "skipped", "skip_reason": raw_batch.skip_reason, "input_count": len(raw_batch.items)})
                    summary_batch = {"batch_id": batch_id, "source_name": raw_batch.source_name, "raw_format": raw_batch.raw_format, "status": "skipped", "auxiliary_kind": raw_batch.auxiliary_kind, "skip_reason": raw_batch.skip_reason, "input_count": len(raw_batch.items), "extracted_count": 0, "aps_count": 0}
                    summary_batches.append(summary_batch)
                    batch_state.update({"status": "skipped", "stage": "skipped", "skip_reason": raw_batch.skip_reason})
                    self._checkpoint_batch(batch_root, batch_state)
                    self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                    self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' skipped: {raw_batch.skip_reason}")
                    continue

                skip_large, skip_large_reason = self._should_skip_large_auxiliary_batch(raw_batch)
                if skip_large:
                    payload = {
                        "source_name": raw_batch.source_name,
                        "source_path": raw_batch.source_path,
                        "raw_format": raw_batch.raw_format,
                        "auxiliary_kind": "large_auxiliary_items_array",
                        "skip_reason": skip_large_reason,
                        "input_count": len(raw_batch.items),
                        "manifest_hint": raw_batch.manifest,
                    }
                    dump_json(batch_root / "skipped.json", payload)
                    inventory.append({"source_name": raw_batch.source_name, "source_path": raw_batch.source_path, "raw_format": raw_batch.raw_format, "status": "skipped", "skip_reason": skip_large_reason, "input_count": len(raw_batch.items)})
                    summary_batch = {"batch_id": batch_id, "source_name": raw_batch.source_name, "raw_format": raw_batch.raw_format, "status": "skipped", "auxiliary_kind": "large_auxiliary_items_array", "skip_reason": skip_large_reason, "input_count": len(raw_batch.items), "extracted_count": 0, "aps_count": 0}
                    summary_batches.append(summary_batch)
                    batch_state.update({"status": "skipped", "stage": "skipped", "skip_reason": skip_large_reason})
                    self._checkpoint_batch(batch_root, batch_state)
                    self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                    self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' skipped: {skip_large_reason}")
                    continue

                aid = infer_manifest(raw_batch.source_path, raw_batch.manifest, raw_batch.items, self.config)
                dump_json(batch_root / "aid.json", {"manifest": aid.manifest, "confidence": aid.confidence, "origin": aid.origin, "notes": aid.notes})
                batch_state.update({"stage": "manifest_inferred", "manifest_content_type": aid.manifest.get("content_type"), "manifest_profession": aid.manifest.get("profession"), "manifest_confidence": aid.confidence, "manifest_origin": aid.origin})
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' manifest: type={aid.manifest.get('content_type')} profession={aid.manifest.get('profession')} confidence={aid.confidence:.2f} origin={aid.origin}")

                ai_reviews: list[dict[str, Any]] = []
                explicit_clean_batch = self._is_explicit_clean_batch(raw_batch)
                if self.ai_mode in {"verify", "full"} and self.ai.enabled and not (self.ai_skip_batch_verify_for_explicit_clean_batches and explicit_clean_batch):
                    self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' ai batch verify start")
                    vr = self.ai.verify_batch_manifest(aid.manifest, raw_batch.items)
                    ai_reviews.append({"kind": "batch_verify", "ok": vr.ok, "payload": vr.payload, "error": vr.error})
                    write_jsonl(batch_root / "ai_reviews.jsonl", ai_reviews)
                    if vr.ok:
                        self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' ai batch verify ok confidence={float(vr.payload.get('confidence', 0.0)):.2f}")
                    else:
                        self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' ai batch verify error: {vr.error}")

                extracted = extract_items(raw_batch.items, aid.manifest)
                raw_uncertain_indices = [idx for idx, item in enumerate(extracted, start=1) if item.needs_ai_help]

                if self.ai_skip_recover_for_explicit_clean_batches and explicit_clean_batch:
                    for item in extracted:
                        if item.core_fields and item.confidence >= self.ai_recover_only_below_confidence:
                            item.needs_ai_help = False

                uncertain_indices = [idx for idx, item in enumerate(extracted, start=1) if item.needs_ai_help and item.confidence < self.ai_recover_only_below_confidence]
                write_jsonl(batch_root / "extracted_items.jsonl", self._serialize_extracted(extracted))
                batch_state.update({"stage": "extracted", "extracted_count": len(extracted), "uncertain_count": len(uncertain_indices), "ai_reviews_count": len(ai_reviews)})
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' extracted={len(extracted)} uncertain={len(uncertain_indices)}")

                if self.ai_mode in {"verify", "full"} and self.ai.enabled and uncertain_indices:
                    recovered_ok = 0
                    recovered_err = 0
                    last_progress = 0.0
                    last_flush = 0.0
                    total_uncertain = len(uncertain_indices)
                    capped = False
                    if total_uncertain > self.ai_max_recover_items_per_batch:
                        capped = True
                        uncertain_indices = uncertain_indices[: self.ai_max_recover_items_per_batch]
                        total_uncertain = len(uncertain_indices)
                    idx_to_itempos = {u_idx: u_idx - 1 for u_idx in uncertain_indices}
                    current_uncertain = 0
                    if capped:
                        self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' ai recover capped at {total_uncertain} items for speed")
                    for start_i in range(0, total_uncertain, self.ai_batch_recover_size):
                        chunk_indices = uncertain_indices[start_i:start_i + self.ai_batch_recover_size]
                        chunk_items = [extracted[idx_to_itempos[i]].raw_fragment for i in chunk_indices]
                        now = time.monotonic()
                        if current_uncertain == 0 or now - last_progress >= self.progress_interval_seconds:
                            self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' ai recover progress: uncertain_done={current_uncertain}/{total_uncertain} extracted_seen={chunk_indices[0]-1}/{len(extracted)}")
                            last_progress = now
                        rec = self.ai.recover_uncertain_items(aid.manifest, chunk_items)
                        if rec.ok and isinstance(rec.payload.get("items"), list) and len(rec.payload.get("items", [])) == len(chunk_indices):
                            for idx_num, payload in zip(chunk_indices, rec.payload.get("items", [])):
                                item = extracted[idx_to_itempos[idx_num]]
                                ai_reviews.append({"kind": "item_recover", "ok": True, "payload": payload, "error": None, "raw_fragment": item.raw_fragment})
                                if payload.get("mgi"):
                                    recovered_ok += 1
                                    item.item_type = payload.get("content_type_guess", item.item_type)
                                    item.core_fields = payload.get("mgi", item.core_fields)
                                    item.confidence = max(float(payload.get("confidence", item.confidence)), item.confidence)
                                    item.notes.extend(payload.get("notes", []))
                                    item.needs_ai_help = bool(payload.get("needs_human_review", False))
                                else:
                                    recovered_err += 1
                            current_uncertain += len(chunk_indices)
                        else:
                            # fallback per item within the chunk only on failure
                            for idx_num in chunk_indices:
                                item = extracted[idx_to_itempos[idx_num]]
                                single = self.ai.recover_uncertain_item(aid.manifest, item.raw_fragment)
                                ai_reviews.append({"kind": "item_recover", "ok": single.ok, "payload": single.payload, "error": single.error, "raw_fragment": item.raw_fragment})
                                if single.ok and single.payload.get("mgi"):
                                    recovered_ok += 1
                                    item.item_type = single.payload.get("content_type_guess", item.item_type)
                                    item.core_fields = single.payload.get("mgi", item.core_fields)
                                    item.confidence = max(float(single.payload.get("confidence", item.confidence)), item.confidence)
                                    item.notes.extend(single.payload.get("notes", []))
                                    item.needs_ai_help = bool(single.payload.get("needs_human_review", False))
                                else:
                                    recovered_err += 1
                                current_uncertain += 1
                        now = time.monotonic()
                        if current_uncertain == total_uncertain or now - last_flush >= self.progress_interval_seconds:
                            write_jsonl(batch_root / "ai_reviews.jsonl", ai_reviews)
                            write_jsonl(batch_root / "extracted_items.jsonl", self._serialize_extracted(extracted))
                            batch_state.update({"stage": "ai_recovering", "ai_recover_total_uncertain": total_uncertain, "ai_recover_done": current_uncertain, "ai_recover_ok": recovered_ok, "ai_recover_errors": recovered_err, "ai_reviews_count": len(ai_reviews), "ai_recover_capped": capped})
                            self._checkpoint_batch(batch_root, batch_state)
                            self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                            last_flush = now
                    self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' ai recover done: ok={recovered_ok} errors={recovered_err} total_uncertain={total_uncertain}")

                normalized = normalize_items(extracted, aid.manifest)
                write_jsonl(batch_root / "normalized_items.jsonl", self._serialize_normalized(normalized))
                batch_state.update({"stage": "normalized", "normalized_count": len(normalized)})
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' normalized={len(normalized)}")

                dedupe_result = dedupe_items(normalized)
                dump_json(batch_root / "duplicate_report.json", dedupe_result.report)
                if dedupe_result.rejected:
                    write_jsonl(batch_root / "rejected_duplicates.jsonl", dedupe_result.rejected)
                batch_state.update({"stage": "local_deduped", "local_dedupe_kept": len(dedupe_result.kept), "local_dedupe_rejected": len(dedupe_result.rejected)})
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' local dedupe kept={len(dedupe_result.kept)} rejected={len(dedupe_result.rejected)}")

                global_dedupe_result = None
                if self.global_index is not None or self.cross_batch_within_run:
                    compare_index = self.global_index if self.global_index is not None else build_global_index([])
                    run_seen = self.run_seen if self.cross_batch_within_run else {}
                    global_dedupe_result = dedupe_against_global_index(dedupe_result.kept, compare_index, run_seen=run_seen)
                    dump_json(batch_root / "global_duplicate_report.json", global_dedupe_result.report)
                    if global_dedupe_result.rejected:
                        write_jsonl(batch_root / "rejected_global_duplicates.jsonl", global_dedupe_result.rejected)
                    items_for_validation = global_dedupe_result.kept
                    batch_state.update({"stage": "global_deduped", "global_dedupe_kept": len(items_for_validation), "global_dedupe_rejected": len(global_dedupe_result.rejected)})
                    self._checkpoint_batch(batch_root, batch_state)
                    self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                    self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' global dedupe kept={len(items_for_validation)} rejected={len(global_dedupe_result.rejected)}")
                else:
                    items_for_validation = dedupe_result.kept

                validation_result = validate_items(items_for_validation, aid.manifest, self.config)
                dump_json(batch_root / "validation_report.json", validation_result.report)
                if validation_result.rejected:
                    write_jsonl(batch_root / "rejected_validation.jsonl", validation_result.rejected)
                batch_state.update({"stage": "validated", "validated_count": len(validation_result.accepted), "validation_rejected_count": len(validation_result.rejected)})
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' validation accepted={len(validation_result.accepted)} rejected={len(validation_result.rejected)}")

                aps_items = build_aps_items(validation_result.accepted, aid.manifest)
                write_jsonl(batch_root / "aps_items.jsonl", aps_items)
                dump_json(batch_root / "release_candidate.json", {"manifest": aid.manifest, "items": aps_items})
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' aps_count={len(aps_items)}")

                metrics = {
                    "source_name": raw_batch.source_name,
                    "raw_format": raw_batch.raw_format,
                    "status": "processed",
                    "input_count": len(raw_batch.items),
                    "manifest_confidence": aid.confidence,
                    "extracted_count": len(extracted),
                    "dedupe_kept_count": len(dedupe_result.kept),
                    "dedupe_rejected_count": len(dedupe_result.rejected),
                    "global_dedupe_kept_count": len(items_for_validation),
                    "global_dedupe_rejected_count": len(global_dedupe_result.rejected) if global_dedupe_result else 0,
                    "validated_count": len(validation_result.accepted),
                    "validation_rejected_count": len(validation_result.rejected),
                    "aps_count": len(aps_items),
                    "ai_reviews_count": len(ai_reviews),
                    "batch_key": raw_batch.batch_key,
                    "batch_content_hash": raw_batch.batch_content_hash,
                }
                dump_json(batch_root / "metrics.json", metrics)
                if ai_reviews:
                    write_jsonl(batch_root / "ai_reviews.jsonl", ai_reviews)

                inventory.append({"source_name": raw_batch.source_name, "source_path": raw_batch.source_path, "raw_format": raw_batch.raw_format, "status": "processed", "input_count": len(raw_batch.items)})
                summary_batch = {"batch_id": batch_id, **metrics}
                summary_batches.append(summary_batch)
                processed_items_total += len(raw_batch.items)

                batch_state.update({"status": "processed", "stage": "complete", "processed_items_total_after_batch": processed_items_total, **metrics})
                self._checkpoint_batch(batch_root, batch_state)
                self._write_run_checkpoint(run_id, root, status="running", inventory=inventory, summary_batches=summary_batches, run_start=run_start, current_batch=batch_state, cache_stats=cache_state)
                self._log(f"[{run_id}] batch {batch_no}/{len(batches)} '{batch_id}' complete: processed_input_total={processed_items_total}")

            summary = self._write_run_checkpoint(run_id, root, status="completed", inventory=inventory, summary_batches=summary_batches, run_start=run_start, cache_stats=cache_state)
            if output_alias_file is not None:
                alias_target = output_alias_file
                if alias_target.exists() and alias_target.is_dir():
                    alias_target = alias_target / "artifacts_pointer.json"
                dump_json(alias_target, {"note": "Output path ended with a file extension, so the pipeline wrote artifacts to a directory with the same stem.", "artifacts_root": str(root), "summary": summary})
            self._log(f"[{run_id}] run complete in {summary['elapsed_seconds']}s: processed_batches={summary['processed_batch_count']} skipped_batches={summary['skipped_batch_count']}")
            return summary

        except KeyboardInterrupt:
            current_batch = None
            batch_status_files = sorted((root / "batches").glob("*/batch_status.json")) if (root / "batches").exists() else []
            if batch_status_files:
                try:
                    current_batch = json.loads(batch_status_files[-1].read_text(encoding="utf-8"))
                    current_batch["status"] = "interrupted"
                except Exception:
                    current_batch = None
            summary = self._write_run_checkpoint(run_id, root, status="interrupted", inventory=inventory, summary_batches=summary_batches, run_start=run_start, interrupted=True, current_batch=current_batch, error="KeyboardInterrupt", cache_stats=cache_state)
            self._log(f"[{run_id}] interrupted; partial artifacts preserved at {root}")
            return summary

        except Exception as exc:
            current_batch = None
            batch_status_files = sorted((root / "batches").glob("*/batch_status.json")) if (root / "batches").exists() else []
            if batch_status_files:
                try:
                    current_batch = json.loads(batch_status_files[-1].read_text(encoding="utf-8"))
                    current_batch["status"] = "failed"
                except Exception:
                    current_batch = None
            summary = self._write_run_checkpoint(run_id, root, status="failed", inventory=inventory, summary_batches=summary_batches, run_start=run_start, interrupted=False, current_batch=current_batch, error=str(exc), cache_stats=cache_state)
            self._log(f"[{run_id}] failed; partial artifacts preserved at {root}: {exc}")
            return summary

    def _resolve_output_root(self, output_root: str) -> tuple[Path, Path | None]:
        target = Path(output_root)
        if target.suffix.lower() in {".json", ".jsonl"}:
            dir_target = target.with_suffix("")
            if target.exists() and target.is_dir() and not dir_target.exists():
                return target, target / "artifacts_pointer.json"
            return dir_target, target
        return target, None
