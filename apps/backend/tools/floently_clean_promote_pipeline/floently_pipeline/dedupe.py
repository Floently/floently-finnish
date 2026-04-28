from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class DedupeResult:
    kept: list[Any]
    rejected: list[dict[str, Any]]
    report: dict[str, Any]


def dedupe_items(normalized_items: list[Any]) -> DedupeResult:
    seen: dict[str, Any] = {}
    kept: list[Any] = []
    rejected: list[dict[str, Any]] = []
    actual_duplicates: list[str] = []
    for item in normalized_items:
        if item.dedupe_signature in seen:
            actual_duplicates.append(item.dedupe_signature)
            rejected.append(
                {
                    "reason": "exact_normalized_duplicate",
                    "dedupe_signature": item.dedupe_signature,
                    "normalized_key": item.normalized_key,
                    "raw_fragment": item.raw_fragment,
                }
            )
            continue
        seen[item.dedupe_signature] = item
        kept.append(item)
    report = {
        "input_count": len(normalized_items),
        "kept_count": len(kept),
        "rejected_count": len(rejected),
        "item_signatures": sorted(seen.keys()),
        "actual_duplicate_signatures": sorted(set(actual_duplicates)),
    }
    return DedupeResult(kept=kept, rejected=rejected, report=report)
