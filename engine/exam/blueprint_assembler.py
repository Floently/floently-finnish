"""
==========================================================
YKI BLUEPRINT ASSEMBLER — Deterministic exam from blueprint + seed
==========================================================

assemble_exam(blueprint, seed) produces the same exam for same blueprint + seed.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from engine.blueprints.loader import get_blueprint_counts, load_blueprint, validate_blueprint
from engine.exam.exam_generator_v3_2 import (
    INDEX_PATH,
    SKILL_TO_TASK_TYPES,
    load_index,
    load_tasks,
)


def calculate_manifest_hash(manifest_path: str | Path) -> str:
    """SHA256 hash of manifest file content. Used for integrity binding."""
    path = Path(manifest_path)
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def _deterministic_select_paths(path_id_pairs: list[tuple[str, str]], count: int, seed: str) -> list[Path]:
    """Select paths deterministically using seed. Same seed => same order."""
    if not path_id_pairs or count <= 0:
        return []
    seed_bytes = seed.encode("utf-8") if isinstance(seed, str) else str(seed).encode("utf-8")
    def sort_key(x: tuple[str, str]) -> tuple[bytes, str]:
        path_part, id_part = x
        h = hashlib.sha256(seed_bytes + id_part.encode("utf-8")).hexdigest()
        return (h.encode("utf-8"), id_part)
    sorted_pairs = sorted(path_id_pairs, key=sort_key)
    return [Path(p[0]) for p in sorted_pairs[:count]]


def _pick_paths_for_skill_with_blueprint(
    index: dict,
    level_band: str,
    skill: str,
    blueprint: dict[str, Any],
    seed: str,
) -> list[Path]:
    """Select task paths for one skill from blueprint counts, using seed."""
    task_types = SKILL_TO_TASK_TYPES.get(skill, [])
    counts = get_blueprint_counts(blueprint, skill)
    if not counts:
        return []
    collected = []
    for task_type in task_types:
        want = counts.get(task_type, 0)
        if want <= 0:
            continue
        pairs = index.get(level_band, {}).get(task_type, [])
        selected = _deterministic_select_paths(pairs, want, seed + ":" + task_type)
        collected.extend(selected)
    return collected


def assemble_exam(
    blueprint: dict[str, Any] | str,
    seed: str,
    level_band: str | None = None,
) -> dict[str, Any]:
    """
    Assemble exam deterministically from blueprint and seed.
    Same blueprint + seed => same exam. Returns exam dict.
    """
    if isinstance(blueprint, str):
        blueprint = load_blueprint(blueprint)
    ok, err = validate_blueprint(blueprint)
    if not ok:
        raise ValueError(f"Invalid blueprint: {err}")
    level_band = level_band or blueprint.get("level_band", "B1_B2")
    index = load_index()
    exam = {
        "level_band": level_band,
        "reading": [],
        "listening": [],
        "writing": [],
        "speaking": [],
    }
    exam["reading"] = load_tasks(
        _pick_paths_for_skill_with_blueprint(index, level_band, "reading", blueprint, seed)
    )
    exam["listening"] = load_tasks(
        _pick_paths_for_skill_with_blueprint(index, level_band, "listening", blueprint, seed)
    )
    exam["writing"] = load_tasks(
        _pick_paths_for_skill_with_blueprint(index, level_band, "writing", blueprint, seed)
    )
    exam["speaking"] = load_tasks(
        _pick_paths_for_skill_with_blueprint(index, level_band, "speaking", blueprint, seed)
    )
    return exam


def write_exam_manifest(
    session_id: str,
    blueprint_version: str,
    seed: str,
    tasks_selected: dict[str, int],
    path: Path | None = None,
) -> Path:
    """Write exam_manifest.json for audit. Returns path to manifest. Call calculate_manifest_hash(path) after."""
    from datetime import datetime, timezone
    manifest = {
        "session_id": session_id,
        "blueprint_version": blueprint_version,
        "seed": seed,
        "tasks_selected": tasks_selected,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if path is None:
        Path("exam_sessions/manifests").mkdir(parents=True, exist_ok=True)
        path = Path("exam_sessions/manifests") / f"{session_id}.json"
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    return path
