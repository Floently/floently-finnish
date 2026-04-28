#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

ALLOWED_CONTENT_TYPES = {"vocabulary_card", "sentence_card", "grammar_card"}
LEVEL_PATTERNS = [
    (re.compile(r"\bA1[_ -]?A2\b", re.I), "A1_A2"),
    (re.compile(r"\bB1[_ -]?B2\b", re.I), "B1_B2"),
    (re.compile(r"\bC1[_ -]?C2\b", re.I), "C1_C2"),
    (re.compile(r"\bA2\b", re.I), "A2"),
]


@dataclass
class FileResult:
    path: str
    status: str
    item_count: int = 0
    message: str | None = None


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Normalize source JSON files into a single valid wrapper shape.")
    p.add_argument("--source", required=True, help="Source file or directory to scan")
    p.add_argument("--out", required=True, help="Output file or directory for normalized copies")
    p.add_argument("--report", help="Optional path for a JSON report")
    p.add_argument("--only-json", action="store_true", help="Skip non-JSON files entirely")
    return p.parse_args()


def iter_source_files(source: Path) -> Iterable[Path]:
    if source.is_file():
        yield source
        return
    for p in sorted(source.rglob("*")):
        if p.is_file():
            yield p


def slurp_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def parse_sequential_json(text: str) -> list[Any]:
    decoder = json.JSONDecoder()
    pos = 0
    n = len(text)
    values: list[Any] = []
    while pos < n:
        while pos < n and text[pos].isspace():
            pos += 1
        if pos >= n:
            break
        value, end = decoder.raw_decode(text, pos)
        values.append(value)
        pos = end
    return values


def is_manifest_dict(obj: Any) -> bool:
    if not isinstance(obj, dict):
        return False
    if "batch_manifest" in obj and isinstance(obj.get("batch_manifest"), dict):
        return True
    manifest_keys = {"content_type", "path", "level_band", "source_id", "domain", "profession"}
    return len(manifest_keys.intersection(obj.keys())) >= 2


def find_level_from_name(name: str) -> str | None:
    for pattern, level in LEVEL_PATTERNS:
        if pattern.search(name):
            return level
    return None


def infer_content_type_from_name(name: str) -> str | None:
    lowered = name.lower()
    if "grammar" in lowered:
        return "grammar_card"
    if "sentence" in lowered or "sentences" in lowered:
        return "sentence_card"
    if "vocabulary" in lowered or "synonym" in lowered or "antonym" in lowered or "word" in lowered:
        return "vocabulary_card"
    return None


def infer_general_manifest(path: Path, manifest: dict[str, Any] | None) -> dict[str, Any]:
    name = path.stem
    content_type = infer_content_type_from_name(name)
    level_band = find_level_from_name(path.name) or find_level_from_name(name)
    topic_focus = {
        "grammar_card": "general Finnish grammar",
        "sentence_card": "general Finnish sentences",
        "vocabulary_card": "general Finnish vocabulary",
    }.get(content_type or "", "general Finnish material")

    base = dict(manifest or {})
    if content_type:
        base["content_type"] = content_type
    if level_band:
        base["level_band"] = level_band

    if content_type == "grammar_card":
        base["path"] = "general/grammar"
    elif content_type == "sentence_card":
        base["path"] = "general/sentences"
    elif content_type == "vocabulary_card":
        base["path"] = "general/vocabulary"

    if "general" in path.name.lower():
        base["domain"] = "general_finnish"
        base["profession"] = "general"

    if not base.get("source_id"):
        suffix = "unknown"
        if content_type == "grammar_card":
            suffix = "grammar"
        elif content_type == "sentence_card":
            suffix = "sentences"
        elif content_type == "vocabulary_card":
            suffix = "vocabulary"
        level = (base.get("level_band") or "unknown").lower()
        base["source_id"] = f"source.preflight.general.{suffix}.{level}"

    base.setdefault("language", "fi")
    base.setdefault("batch_number", 1)
    base.setdefault("total_items_planned", 0)
    base.setdefault("items_in_batch", 0)
    base.setdefault("topic_focus", topic_focus)
    return base


def canonicalize_manifest(path: Path, manifest: dict[str, Any] | None, items: list[dict[str, Any]]) -> dict[str, Any]:
    out = infer_general_manifest(path, manifest)
    out["items_in_batch"] = len(items)
    if not out.get("total_items_planned"):
        out["total_items_planned"] = len(items)
    ctype = out.get("content_type")
    if ctype not in ALLOWED_CONTENT_TYPES:
        inferred = infer_content_type_from_name(path.name)
        if inferred:
            out["content_type"] = inferred
    level = out.get("level_band")
    if not level:
        inferred_level = find_level_from_name(path.name)
        if inferred_level:
            out["level_band"] = inferred_level
    return out


def normalize_items(items: list[Any], content_type: str) -> tuple[list[dict[str, Any]], list[str]]:
    normalized: list[dict[str, Any]] = []
    problems: list[str] = []
    required_fields = {
        "vocabulary_card": ["term", "meaning"],
        "sentence_card": ["sentence", "meaning"],
        "grammar_card": ["pattern", "usage", "example_fi", "meaning"],
    }.get(content_type, [])

    for idx, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            problems.append(f"item {idx}: not an object")
            continue
        trimmed = {k: v for k, v in item.items() if v not in (None, "")}
        missing = [field for field in required_fields if field not in trimmed]
        if missing:
            problems.append(f"item {idx}: missing {', '.join(missing)}")
            continue
        normalized.append(trimmed)
    return normalized, problems


def normalize_file(path: Path, source_root: Path, out_root: Path, only_json: bool) -> FileResult:
    rel = path.name if source_root.is_file() else str(path.relative_to(source_root))
    out_path = out_root if source_root.is_file() else out_root / rel
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if path.suffix.lower() != ".json":
        if only_json:
            return FileResult(rel, "skipped", message="non-json file")
        shutil.copy2(path, out_path)
        return FileResult(rel, "copied", message="non-json file copied unchanged")

    try:
        text = slurp_text(path)
        values = parse_sequential_json(text)
    except Exception as exc:
        return FileResult(rel, "failed", message=f"parse error: {exc}")

    manifest: dict[str, Any] | None = None
    item_lists: list[list[Any]] = []

    for value in values:
        if isinstance(value, dict) and "batch_manifest" in value and isinstance(value.get("batch_manifest"), dict):
            if manifest is None:
                manifest = value["batch_manifest"]
            if isinstance(value.get("items"), list):
                item_lists.append(value["items"])
            continue
        if is_manifest_dict(value):
            if manifest is None:
                manifest = value
            else:
                # Preserve the first manifest and ignore duplicates.
                pass
            continue
        if isinstance(value, list):
            item_lists.append(value)
            continue

    merged_items: list[Any] = []
    for item_list in item_lists:
        merged_items.extend(item_list)

    if manifest is None and not merged_items:
        return FileResult(rel, "failed", message="no manifest or items detected")

    manifest = canonicalize_manifest(path, manifest, [x for x in merged_items if isinstance(x, dict)])
    content_type = manifest.get("content_type")
    if content_type not in ALLOWED_CONTENT_TYPES:
        return FileResult(rel, "failed", message=f"unsupported content_type: {content_type}")

    normalized_items, problems = normalize_items(merged_items, content_type)
    if not normalized_items:
        return FileResult(rel, "failed", message="no valid items after normalization; " + "; ".join(problems[:8]))

    payload = {"batch_manifest": manifest, "items": normalized_items}
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if problems:
        problem_path = out_path.with_suffix(out_path.suffix + ".problems.json")
        problem_path.write_text(json.dumps({"problems": problems[:500]}, ensure_ascii=False, indent=2), encoding="utf-8")
        return FileResult(rel, "normalized_with_warnings", item_count=len(normalized_items), message=f"{len(problems)} invalid items skipped")

    return FileResult(rel, "normalized", item_count=len(normalized_items))


def main() -> None:
    args = parse_args()
    source = Path(args.source).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    results: list[FileResult] = []
    for path in iter_source_files(source):
        results.append(normalize_file(path, source, out, args.only_json))

    summary = {
        "source": str(source),
        "out": str(out),
        "files": [r.__dict__ for r in results],
        "counts": {
            "normalized": sum(r.status == "normalized" for r in results),
            "normalized_with_warnings": sum(r.status == "normalized_with_warnings" for r in results),
            "copied": sum(r.status == "copied" for r in results),
            "skipped": sum(r.status == "skipped" for r in results),
            "failed": sum(r.status == "failed" for r in results),
        },
    }

    report_path = Path(args.report).resolve() if args.report else out / "preflight_report.json"
    report_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
