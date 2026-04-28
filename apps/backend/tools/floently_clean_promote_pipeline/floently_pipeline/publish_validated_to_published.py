#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Publish canonical validated lane into published lane.")
    p.add_argument("--canonical-root", required=True, help="Path to canonical_bank root")
    p.add_argument("--report", help="Optional report path")
    p.add_argument("--clear-published", action="store_true", help="Delete existing published JSON files before republishing")
    return p.parse_args()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def iter_validated_files(validated_root: Path):
    for p in sorted(validated_root.rglob("*.json")):
        if p.is_file():
            yield p


def normalize_cards(payload: Any, now_iso: str) -> tuple[Any, int]:
    count = 0
    if isinstance(payload, dict) and isinstance(payload.get("cards"), list):
        wrapper = deepcopy(payload)
        cards = []
        for card in wrapper["cards"]:
            if not isinstance(card, dict):
                continue
            item = deepcopy(card)
            item["state"] = "published"
            item["validation_passed"] = True
            item["published_at"] = now_iso
            cards.append(item)
        wrapper["cards"] = cards
        count = len(cards)
        return wrapper, count
    if isinstance(payload, list):
        cards = []
        for card in payload:
            if not isinstance(card, dict):
                continue
            item = deepcopy(card)
            item["state"] = "published"
            item["validation_passed"] = True
            item["published_at"] = now_iso
            cards.append(item)
        count = len(cards)
        return cards, count
    raise ValueError("unsupported payload shape")


def main() -> None:
    args = parse_args()
    canonical_root = Path(args.canonical_root).resolve()
    validated_root = canonical_root / "validated"
    published_root = canonical_root / "published"

    if args.clear_published and published_root.exists():
        for p in sorted(published_root.rglob("*.json")):
            if p.is_file():
                p.unlink()

    published_root.mkdir(parents=True, exist_ok=True)
    now_iso = datetime.now(timezone.utc).isoformat()

    results = []
    total_cards = 0
    for src in iter_validated_files(validated_root):
        rel = src.relative_to(validated_root)
        dst = published_root / rel
        payload = load_json(src)
        normalized, count = normalize_cards(payload, now_iso)
        dump_json(dst, normalized)
        total_cards += count
        results.append({"source": str(src), "published": str(dst), "card_count": count})

    summary = {
        "canonical_root": str(canonical_root),
        "validated_root": str(validated_root),
        "published_root": str(published_root),
        "file_count": len(results),
        "card_count": total_cards,
        "published_at": now_iso,
        "files": results,
    }

    report_path = Path(args.report).resolve() if args.report else canonical_root / "reports" / "publish_report.json"
    dump_json(report_path, summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
