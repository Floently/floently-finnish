from __future__ import annotations

import json
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.paths import BACKEND_ROOT

BANK_ROOT = BACKEND_ROOT / "materials" / "yki" / "certified_bank"
POOL_INDEX_PATH = BANK_ROOT / "metadata" / "pool_index.json"
MANIFEST_PATH = BANK_ROOT / "manifest.json"

RUNTIME_SCHEMA_VERSION = "floently-local-yki-certified-fallback-v1"

_TASK_TYPES_BY_SECTION = {
    "reading": "reading_mcq_set",
    "listening": "listening_mcq_set",
    "writing": "writing_prompt",
    "speaking": "speaking_roleplay",
}

_SECTION_TITLES = {
    "reading": "Reading",
    "listening": "Listening",
    "writing": "Writing",
    "speaking": "Speaking",
}

_RECOMMENDED_MINUTES = {
    "reading": 25,
    "listening": 25,
    "writing": 35,
    "speaking": 20,
}

_TASKS_PER_SECTION = {
    "reading": 3,
    "listening": 2,
    "writing": 2,
    "speaking": 2,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_level_band(raw: str | None) -> str:
    value = (raw or "B1_B2").strip().upper().replace("-", "_")
    aliases = {
        "A1A2": "A1_A2",
        "A1_A2": "A1_A2",
        "B1B2": "B1_B2",
        "B1_B2": "B1_B2",
        "C1C2": "C1_C2",
        "C1_C2": "C1_C2",
    }
    return aliases.get(value, "B1_B2")


def display_level_band(level_band: str) -> str:
    return level_band.replace("_", "-")


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_pool_index() -> dict[str, Any]:
    return _load_json(POOL_INDEX_PATH)


def _load_manifest() -> dict[str, Any]:
    return _load_json(MANIFEST_PATH)


def _task_path_from_pool_entry(entry: Any) -> str | None:
    if isinstance(entry, (list, tuple)) and entry:
        return str(entry[0])
    if isinstance(entry, dict):
        raw = entry.get("file_path") or entry.get("path")
        if raw:
            return str(raw)
    return None


def _load_task(relative_path: str) -> dict[str, Any] | None:
    candidate = (BANK_ROOT / relative_path).resolve()
    try:
        candidate.relative_to(BANK_ROOT.resolve())
    except ValueError:
        return None
    if not candidate.exists():
        return None
    try:
        task = _load_json(candidate)
    except Exception:
        return None
    if not isinstance(task, dict):
        return None
    return task


def _task_title(task: dict[str, Any], section: str) -> str:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    for key in ("title", "instruction", "question", "prompt"):
        value = content.get(key) or task.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()[:180]
    return f"{_SECTION_TITLES.get(section, section.title())} task"


def _public_task(task: dict[str, Any], section: str, index: int) -> dict[str, Any]:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    task_id = str(task.get("id") or task.get("task_id") or f"{section}-{index}")
    task_type = str(task.get("task_type") or _TASK_TYPES_BY_SECTION[section])
    level_band = normalize_level_band(str(task.get("level_band") or task.get("level") or "B1_B2"))

    return {
        "id": task_id,
        "task_id": task_id,
        "taskId": task_id,
        "section": section,
        "skill": str(task.get("skill") or section),
        "task_type": task_type,
        "type": task_type,
        "level_band": level_band,
        "display_level_band": display_level_band(level_band),
        "title": _task_title(task, section),
        "content": content,
        "materials": content.get("materials") if isinstance(content.get("materials"), dict) else {},
        "items": content.get("items") if isinstance(content.get("items"), list) else [],
        "questions": content.get("questions") if isinstance(content.get("questions"), list) else [],
        "timing": content.get("timing") if isinstance(content.get("timing"), dict) else {"recommended_minutes": _RECOMMENDED_MINUTES[section]},
        "recommended_minutes": _RECOMMENDED_MINUTES[section],
        "local_fallback": True,
    }


def _select_tasks(level_band: str, session_id: str) -> dict[str, list[dict[str, Any]]]:
    pool = _load_pool_index()
    level_pool = pool.get(level_band)
    if not isinstance(level_pool, dict):
        level_pool = pool.get("B1_B2") if isinstance(pool.get("B1_B2"), dict) else {}

    rng = random.Random(session_id)
    selected: dict[str, list[dict[str, Any]]] = {}

    for section, task_type in _TASK_TYPES_BY_SECTION.items():
        entries = level_pool.get(task_type)
        if not isinstance(entries, list):
            entries = []
        shuffled = list(entries)
        rng.shuffle(shuffled)

        tasks: list[dict[str, Any]] = []
        for entry in shuffled:
            relative = _task_path_from_pool_entry(entry)
            if not relative:
                continue
            raw = _load_task(relative)
            if not raw:
                continue
            tasks.append(_public_task(raw, section, len(tasks)))
            if len(tasks) >= _TASKS_PER_SECTION[section]:
                break

        selected[section] = tasks

    return selected


def build_local_yki_runtime(*, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    level_band = normalize_level_band(str(payload.get("level_band") or "B1_B2"))
    session_id = f"local_yki_{uuid.uuid4().hex[:16]}"
    tasks_by_section = _select_tasks(level_band, session_id)
    all_tasks = [task for section in ("reading", "listening", "writing", "speaking") for task in tasks_by_section.get(section, [])]
    manifest = _load_manifest()

    sections = []
    for section in ("reading", "listening", "writing", "speaking"):
        section_tasks = tasks_by_section.get(section, [])
        sections.append(
            {
                "key": section,
                "title": _SECTION_TITLES[section],
                "task_count": len(section_tasks),
                "recommended_minutes": _RECOMMENDED_MINUTES[section],
                "tasks": section_tasks,
            }
        )

    runtime = {
        "session_id": session_id,
        "id": session_id,
        "engine_session_token": f"local:{session_id}",
        "runtime_schema_version": RUNTIME_SCHEMA_VERSION,
        "level_band": level_band,
        "display_level_band": display_level_band(level_band),
        "mode": payload.get("mode") or "formal_exam_simulation",
        "status": "in_progress",
        "current_section": "reading",
        "current_task_index": 0,
        "created_at": _now(),
        "updated_at": _now(),
        "bank_kind": str(manifest.get("bank_version") or "certified"),
        "material_authority": "engine_v3_2_certified_local_fallback",
        "exam": {
            "reading": tasks_by_section.get("reading", []),
            "listening": tasks_by_section.get("listening", []),
            "writing": tasks_by_section.get("writing", []),
            "speaking": tasks_by_section.get("speaking", []),
        },
        "sections": sections,
        "tasks": all_tasks,
        "responses": {},
        "results": None,
        "metadata": {
            "source": "local_certified_bank_fallback",
            "user_id": user_id,
            "level_band": level_band,
            "display_level_band": display_level_band(level_band),
            "task_count": len(all_tasks),
            "bank_total_tasks": manifest.get("total_tasks"),
            "engine_unavailable_fallback": True,
            "engine_session_token": f"local:{session_id}",
        },
    }
    return runtime


def is_local_runtime_record(record: dict[str, Any] | None) -> bool:
    if not record:
        return False
    token = str(record.get("engine_session_token") or "")
    return token.startswith("local:")


def local_accept_response(*, session_id: str, payload: dict[str, Any] | None = None, action: str = "accepted") -> dict[str, Any]:
    return {
        "status": action,
        "session_id": session_id,
        "accepted": True,
        "local_fallback": True,
        "payload": payload or {},
        "updated_at": _now(),
    }


def local_submit_response(*, session_id: str, confirm_incomplete: bool) -> dict[str, Any]:
    return {
        "status": "submitted",
        "session_id": session_id,
        "submitted": True,
        "confirm_incomplete": confirm_incomplete,
        "local_fallback": True,
        "score": {
            "overall": None,
            "reading": None,
            "listening": None,
            "writing": None,
            "speaking": None,
        },
        "summary": "YKI exam submitted in local certified-bank fallback mode.",
        "certificate_ready": True,
        "updated_at": _now(),
    }


def local_certificate_response(*, session_id: str) -> dict[str, Any]:
    return {
        "session_id": session_id,
        "status": "available",
        "local_fallback": True,
        "title": "Floently Finnish YKI practice certificate",
        "summary": "Practice exam completed using the certified local YKI bank fallback.",
        "issued_at": _now(),
    }
