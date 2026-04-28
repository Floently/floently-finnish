from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query
from app.services.yki_materials import (
    YKI_MANIFEST_PATH,
    YKI_POOL_INDEX_PATH,
    YKI_TASK_INDEX_PATH,
    load_yki_json,
)

router = APIRouter(prefix="/api/v1/yki-exam", tags=["yki-exam"])

_ALLOWED = {"A1_A2", "B1_B2", "C1_C2"}
_TASK_INDEX_CACHE: dict[str, Any] | None = None
_POOL_INDEX_CACHE: dict[str, Any] | None = None
_MANIFEST_CACHE: dict[str, Any] | None = None


def _load_json(path: str) -> dict[str, Any]:
    try:
        if path == "task_index":
            return load_yki_json(YKI_TASK_INDEX_PATH)
        if path == "pool_index":
            return load_yki_json(YKI_POOL_INDEX_PATH)
        return load_yki_json(YKI_MANIFEST_PATH)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _task_index() -> dict[str, Any]:
    global _TASK_INDEX_CACHE
    if _TASK_INDEX_CACHE is None:
        _TASK_INDEX_CACHE = _load_json("task_index")
    return _TASK_INDEX_CACHE


def _pool_index() -> dict[str, Any]:
    global _POOL_INDEX_CACHE
    if _POOL_INDEX_CACHE is None:
        _POOL_INDEX_CACHE = _load_json("pool_index")
    return _POOL_INDEX_CACHE


def _manifest() -> dict[str, Any]:
    global _MANIFEST_CACHE
    if _MANIFEST_CACHE is None:
        _MANIFEST_CACHE = _load_json("manifest")
    return _MANIFEST_CACHE


def _normalize_level_band(raw: str | None) -> str:
    candidate = (raw or "B1-B2").strip().upper().replace("-", "_")
    if candidate not in _ALLOWED:
        raise HTTPException(status_code=422, detail="Unsupported YKI level band")
    return candidate


def _entries_for_level(level_band: str) -> list[dict[str, Any]]:
    payload = _task_index()
    entries = payload.get("entries")
    if not isinstance(entries, list):
        raise HTTPException(status_code=500, detail="YKI task index is invalid")
    return [
        entry
        for entry in entries
        if isinstance(entry, dict)
        and str(entry.get("level_band") or "").upper() == level_band
        and entry.get("selected_for_runtime", True) is not False
    ]


def _build_exam_overview(level_band: str) -> dict[str, Any]:
    manifest = _manifest()
    pool_index = _pool_index()
    entries = _entries_for_level(level_band)
    by_skill = {"reading": 0, "listening": 0, "writing": 0, "speaking": 0}
    by_task_type = {"reading_mcq_set": 0, "listening_mcq_set": 0, "writing_prompt": 0, "speaking_roleplay": 0}
    for entry in entries:
        skill = str(entry.get("skill") or "").lower()
        if skill in by_skill:
            by_skill[skill] += 1
        task_type = str(entry.get("task_type") or "")
        if task_type in by_task_type:
            by_task_type[task_type] += 1

    section_minutes = {
        "A1_A2": {"reading": 20, "listening": 20, "writing": 25, "speaking": 15},
        "B1_B2": {"reading": 25, "listening": 25, "writing": 35, "speaking": 20},
        "C1_C2": {"reading": 30, "listening": 30, "writing": 40, "speaking": 25},
    }[level_band]
    levels = (manifest.get("levels") or {}) if isinstance(manifest.get("levels"), dict) else {}
    level_pool = pool_index.get(level_band) if isinstance(pool_index.get(level_band), dict) else {}

    return {
        "level_band": level_band,
        "display_level_band": level_band.replace("_", "-"),
        "bank_kind": str(manifest.get("bank_version") or "certified"),
        "total_tasks": len(entries),
        "certified_total": int(levels.get(level_band) or len(entries)),
        "sections": [
            {"key": "reading", "title": "Reading", "task_count": by_skill["reading"], "recommended_minutes": section_minutes["reading"]},
            {"key": "listening", "title": "Listening", "task_count": by_skill["listening"], "recommended_minutes": section_minutes["listening"]},
            {"key": "writing", "title": "Writing", "task_count": by_skill["writing"], "recommended_minutes": section_minutes["writing"]},
            {"key": "speaking", "title": "Speaking", "task_count": by_skill["speaking"], "recommended_minutes": section_minutes["speaking"]},
        ],
        "task_types": by_task_type,
        "material_authority": "engine_v3_2_certified",
        "pool_sections": list(level_pool.keys()) if isinstance(level_pool, dict) else [],
        "exam_identity": {
            "kind": "formal_exam_simulation",
            "why": "Uses the certified YKI task index and level-banded pool rather than a guided practice subset.",
        },
    }


@router.get("/overview")
def overview(level_band: str = Query(default="B1-B2")) -> dict[str, Any]:
    return _build_exam_overview(_normalize_level_band(level_band))


@router.get("/mock-cycle")
def mock_cycle(level_band: str = Query(default="B1-B2")) -> dict[str, Any]:
    normalized = _normalize_level_band(level_band)
    return {
        "target_level": normalized.replace("_", "-"),
        "overall_pressure": "exam_simulation",
        "readiness_score": 74 if normalized == "B1_B2" else 62 if normalized == "A1_A2" else 68,
        "weak_sections": ["speaking", "writing"] if normalized != "C1_C2" else ["writing"],
        "strong_sections": ["reading"] if normalized != "A1_A2" else ["speaking"],
        "segments": [
            {
                "week_index": 1,
                "focus": "Reading and listening timing",
                "pressure_band": "rising",
                "timed_minutes": 25,
                "section_mix": ["reading", "listening"],
                "checkpoint": "Complete two timed sections without pausing.",
                "why": "Separates timing practice from the full exam so the exam route remains formal.",
            },
            {
                "week_index": 2,
                "focus": "Writing and speaking control",
                "pressure_band": "high",
                "timed_minutes": 35,
                "section_mix": ["writing", "speaking"],
                "checkpoint": "Complete one timed writing response and one speaking response.",
                "why": "Builds readiness without replacing the full exam runtime.",
            },
        ],
        "coaching_notes": [
            "Mock cycle is preparation only.",
            "Use YKI Exam when you want the formal full exam simulation for the chosen band.",
        ],
    }
