from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Any

from fastapi import HTTPException

from app.services.yki_runtime_integrity import ALLOWED_ENGINE_SECTION_ORDER, ALLOWED_RUNTIME_FLOW


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, *, scope: str, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        bucket = f"{scope}:{key}"
        cutoff = now - float(window_seconds)
        with self._lock:
            events = self._events[bucket]
            while events and events[0] < cutoff:
                events.popleft()
            if len(events) >= limit:
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            events.append(now)


rate_limiter = InMemoryRateLimiter()


def answer_value_present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(answer_value_present(item) for item in value)
    if isinstance(value, dict):
        return any(answer_value_present(item) for item in value.values())
    return True


def task_response_complete(task: dict[str, Any], response_payload: dict[str, Any] | None) -> bool:
    response = response_payload or {}
    skill = str(task.get("skill") or "").strip().lower()
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    questions = [question for question in list(content.get("questions") or []) if isinstance(question, dict)]

    if skill in ("reading", "listening"):
        if not questions:
            return False
        answers_by_id = response.get("answers_by_id") if isinstance(response.get("answers_by_id"), dict) else {}
        if answers_by_id:
            return all(answer_value_present(answers_by_id.get(str(question.get("id") or ""))) for question in questions)
        answers = response.get("answers") if isinstance(response.get("answers"), list) else []
        if len(answers) < len(questions):
            return False
        return all(answer_value_present(answers[index]) for index in range(len(questions)))

    if skill == "writing":
        return answer_value_present(response.get("text"))

    if skill == "speaking":
        return answer_value_present(response.get("audio_file_path"))

    return False


def section_progress(
    manifest: dict[str, Any],
    responses_by_task: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    exam = manifest.get("exam") if isinstance(manifest.get("exam"), dict) else {}
    progress: list[dict[str, Any]] = []
    for section in ALLOWED_ENGINE_SECTION_ORDER:
        tasks = [task for task in list(exam.get(section) or []) if isinstance(task, dict)]
        if not tasks:
            continue
        completed = all(
            task_response_complete(task, responses_by_task.get(str(task.get("task_id") or task.get("id") or "")))
            for task in tasks
        )
        progress.append(
            {
                "section": section,
                "task_count": len(tasks),
                "completed": completed,
            }
        )
    return progress


def current_section_key(
    manifest: dict[str, Any],
    responses_by_task: dict[str, dict[str, Any]],
) -> str:
    progress = section_progress(manifest, responses_by_task)
    for item in progress:
        if not item["completed"]:
            return str(item["section"])
    if progress:
        return str(progress[-1]["section"])
    return "reading"


def ensure_submit_ready(
    manifest: dict[str, Any],
    responses_by_task: dict[str, dict[str, Any]],
) -> None:
    progress = section_progress(manifest, responses_by_task)
    incomplete = [item["section"] for item in progress if not item["completed"]]
    if incomplete:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid exam transition: {current_section_key(manifest, responses_by_task).upper()} -> SUBMIT",
        )


def ensure_section_access(
    manifest: dict[str, Any],
    responses_by_task: dict[str, dict[str, Any]],
    target_section: str,
) -> None:
    normalized_target = str(target_section or "").strip().lower()
    if normalized_target not in ALLOWED_ENGINE_SECTION_ORDER:
        raise HTTPException(status_code=400, detail="Unknown exam section")

    progress = section_progress(manifest, responses_by_task)
    unlocked_sections: list[str] = []
    for item in progress:
        unlocked_sections.append(str(item["section"]))
        if not item["completed"]:
            break
    if normalized_target not in unlocked_sections:
        current = current_section_key(manifest, responses_by_task).upper()
        raise HTTPException(status_code=409, detail=f"Invalid exam transition: {current} -> {normalized_target.upper()}")


def ensure_runtime_flow_transition(previous: str, next_state: str) -> None:
    order = {name: index for index, name in enumerate(ALLOWED_RUNTIME_FLOW)}
    prev = str(previous or "").strip().upper()
    nxt = str(next_state or "").strip().upper()
    if prev not in order or nxt not in order:
        raise ValueError("Unknown runtime flow state")
    if order[nxt] < order[prev]:
        raise ValueError(f"Invalid runtime flow transition: {prev} -> {nxt}")
