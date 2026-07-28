from __future__ import annotations

import copy
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


def _task_content(
    task: dict[str, Any],
) -> dict[str, Any]:
    content = task.get("content")
    return content if isinstance(content, dict) else {}


def _task_id(
    task: dict[str, Any],
    fallback: str,
) -> str:
    return str(
        task.get("task_id")
        or task.get("id")
        or fallback
    ).strip()


def _question_payloads(
    task: dict[str, Any],
    *,
    fallback_task_id: str,
) -> list[dict[str, Any]]:
    content = _task_content(task)
    raw_questions = content.get("questions")

    if not isinstance(raw_questions, list):
        raw_questions = task.get("questions")

    if not isinstance(raw_questions, list):
        raw_questions = []

    result: list[dict[str, Any]] = []

    for index, raw in enumerate(raw_questions):
        if not isinstance(raw, dict):
            continue

        question_id = str(
            raw.get("id")
            or raw.get("question_id")
            or f"{fallback_task_id}:question:{index}"
        ).strip()

        options = raw.get("options")

        if not isinstance(options, list):
            options = []

        correct_index = raw.get("correct_index")

        if not isinstance(correct_index, int):
            try:
                correct_index = int(correct_index)
            except (TypeError, ValueError):
                correct_index = 0

        result.append(
            {
                "id": question_id,
                "answer_id": question_id,
                "index": index,
                "question": str(
                    raw.get("prompt")
                    or raw.get("question")
                    or ""
                ).strip(),
                "options": [
                    str(option)
                    for option in options
                ],
                "correct_index": correct_index,
            }
        )

    return result


def _writing_prompt(
    task: dict[str, Any],
) -> str:
    content = _task_content(task)
    materials = content.get("materials")

    if not isinstance(materials, dict):
        materials = {}

    items = content.get("items")

    if not isinstance(items, list):
        items = []

    parts = [
        str(content.get("instruction") or "").strip(),
        str(materials.get("scenario") or "").strip(),
    ]

    for item in items:
        if not isinstance(item, dict):
            continue

        prompt = str(
            item.get("prompt")
            or item.get("instruction")
            or item.get("question")
            or ""
        ).strip()

        if prompt:
            parts.append(prompt)

    return "\n\n".join(
        part
        for part in parts
        if part
    )


def _speaking_prompt(
    task: dict[str, Any],
) -> str:
    content = _task_content(task)
    materials = content.get("materials")

    if not isinstance(materials, dict):
        materials = {}

    roles = materials.get("roles")

    if not isinstance(roles, dict):
        roles = {}

    user_role = str(
        roles.get("user")
        or ""
    ).strip()

    partner_role = str(
        roles.get("partner")
        or ""
    ).strip()

    items = content.get("items")

    if not isinstance(items, list):
        items = []

    first_turn = ""

    for item in items:
        if not isinstance(item, dict):
            continue

        first_turn = str(
            item.get("ai_first_turn_fi")
            or item.get("partner_line")
            or item.get("prompt")
            or ""
        ).strip()

        if first_turn:
            break

    parts = [
        str(content.get("instruction") or "").strip(),
    ]

    if user_role and partner_role:
        parts.append(
            f"Olet {user_role}. "
            f"Keskustelukumppani on {partner_role}."
        )
    elif user_role:
        parts.append(
            f"Olet {user_role}."
        )
    elif partner_role:
        parts.append(
            f"Keskustelukumppani on {partner_role}."
        )

    if first_turn:
        parts.append(
            f'Keskustelukumppani sanoo: "{first_turn}"'
        )

    parts.append(
        "Vastaa tilanteeseen suomeksi. "
        "Kerro riittävästi yksityiskohtia ja perustele vastauksesi."
    )

    return "\n\n".join(
        part
        for part in parts
        if part
    )


def _canonical_section_items(
    *,
    section: str,
    tasks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    for index, task in enumerate(tasks):
        if not isinstance(task, dict):
            continue

        task_id = _task_id(
            task,
            f"{section}-{index}",
        )

        content = _task_content(task)
        materials = content.get("materials")

        if not isinstance(materials, dict):
            materials = {}

        if section == "reading":
            items.append(
                {
                    "item_id": task_id,
                    "index": index,
                    "prompt": {
                        "title": str(
                            task.get("title")
                            or content.get("title")
                            or ""
                        ).strip(),
                        "text": str(
                            materials.get("text")
                            or content.get("text")
                            or ""
                        ).strip(),
                    },
                    "questions": _question_payloads(
                        task,
                        fallback_task_id=task_id,
                    ),
                }
            )
            continue

        if section == "listening":
            transcript = str(
                materials.get("transcript")
                or content.get("transcript")
                or content.get("instruction")
                or ""
            ).strip()

            items.append(
                {
                    "item_id": task_id,
                    "index": index,
                    "prompt": {
                        "audio_url": None,
                        "instructions": transcript,
                    },
                    "questions": _question_payloads(
                        task,
                        fallback_task_id=task_id,
                    ),
                }
            )
            continue

        if section == "writing":
            items.append(
                {
                    "item_id": task_id,
                    "index": index,
                    "prompt": {
                        "instructions": _writing_prompt(task),
                    },
                    "questions": [],
                }
            )
            continue

        if section == "speaking":
            items.append(
                {
                    "item_id": task_id,
                    "index": index,
                    "speaking_mode": "recording",
                    "prompt": {
                        "audio_url": None,
                        "instructions": _speaking_prompt(task),
                    },
                    "recording": {
                        "min_duration_sec": 30,
                        "max_duration_sec": 60,
                    },
                    "conversation": [],
                }
            )

    return items


def _canonical_sections(
    tasks_by_section: dict[str, Any],
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []

    for index, section in enumerate(
        (
            "reading",
            "listening",
            "writing",
            "speaking",
        )
    ):
        raw_tasks = tasks_by_section.get(section)

        if not isinstance(raw_tasks, list):
            raw_tasks = []

        result.append(
            {
                "section_type": section,
                "key": section,
                "title": _SECTION_TITLES[section],
                "index": index,
                "recommended_minutes":
                    _RECOMMENDED_MINUTES[section],
                "items": _canonical_section_items(
                    section=section,
                    tasks=raw_tasks,
                ),
            }
        )

    return result


def normalize_local_runtime_for_client(
    runtime: dict[str, Any],
) -> dict[str, Any]:
    payload = copy.deepcopy(runtime)

    exam = payload.get("exam")

    if not isinstance(exam, dict):
        exam = {}

    payload["sections"] = _canonical_sections(
        exam
    )

    return payload


def local_objective_scores(
    *,
    runtime: dict[str, Any],
    evidence: dict[str, Any],
) -> dict[str, int | None]:
    exam = runtime.get("exam")

    if not isinstance(exam, dict):
        exam = {}

    objective = evidence.get("objective")

    if not isinstance(objective, dict):
        objective = {}

    result: dict[str, int | None] = {
        "reading": 0,
        "listening": 0,
        "writing": None,
        "speaking": None,
    }

    for section in (
        "reading",
        "listening",
    ):
        tasks = exam.get(section)

        if not isinstance(tasks, list):
            tasks = []

        correct_count = 0

        for task_index, task in enumerate(tasks):
            if not isinstance(task, dict):
                continue

            task_id = _task_id(
                task,
                f"{section}-{task_index}",
            )

            questions = _question_payloads(
                task,
                fallback_task_id=task_id,
            )

            for question in questions:
                question_id = str(
                    question.get("answer_id")
                    or question.get("id")
                    or ""
                ).strip()

                key = f"{task_id}:{question_id}"
                saved = objective.get(key)

                if not isinstance(saved, dict):
                    continue

                try:
                    selected = int(saved.get("answer"))
                    expected = int(
                        question.get("correct_index")
                    )
                except (TypeError, ValueError):
                    continue

                if selected == expected:
                    correct_count += 1

        result[section] = correct_count

    result["overall"] = int(
        result["reading"] or 0
    ) + int(
        result["listening"] or 0
    )

    return result


def build_local_yki_runtime(*, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    level_band = normalize_level_band(str(payload.get("level_band") or "B1_B2"))
    session_id = f"local_yki_{uuid.uuid4().hex[:16]}"
    tasks_by_section = _select_tasks(level_band, session_id)
    all_tasks = [task for section in ("reading", "listening", "writing", "speaking") for task in tasks_by_section.get(section, [])]
    manifest = _load_manifest()

    sections = _canonical_sections(
        tasks_by_section
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


def local_submit_response(
    *,
    session_id: str,
    confirm_incomplete: bool,
    runtime: dict[str, Any],
    evidence: dict[str, Any],
) -> dict[str, Any]:
    score = local_objective_scores(
        runtime=runtime,
        evidence=evidence,
    )

    return {
        "status": "submitted",
        "session_id": session_id,
        "submitted": True,
        "confirm_incomplete": confirm_incomplete,
        "local_fallback": True,
        "score": score,
        "summary": (
            "YKI exam submitted in local certified-bank "
            "fallback mode with exact objective scoring."
        ),
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
