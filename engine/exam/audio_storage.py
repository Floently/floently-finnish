from __future__ import annotations

import re
from pathlib import Path


EXAM_AUDIO_ROOT = Path("uploads/audio/exam")
EXAM_AUDIO_ROOT.mkdir(parents=True, exist_ok=True)


def sanitize_path_segment(value: str, fallback: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9._-]", "_", str(value or "").strip())
    return normalized or fallback


def exam_audio_task_dir(session_id: str, task_id: str) -> Path:
    session_segment = sanitize_path_segment(session_id, "session")
    task_segment = sanitize_path_segment(task_id, "task")
    target_dir = (EXAM_AUDIO_ROOT / session_segment / task_segment).resolve()
    root = EXAM_AUDIO_ROOT.resolve()
    if not target_dir.is_relative_to(root):
        raise ValueError("Resolved audio directory escapes exam audio root")
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir


def exam_audio_file_path(
    *,
    session_id: str,
    task_id: str,
    suffix: str,
    turn_id: str | None = None,
) -> Path:
    safe_suffix = suffix if str(suffix or "").startswith(".") else f".{suffix or 'wav'}"
    filename = "recording" if not turn_id else f"turn_{sanitize_path_segment(turn_id, 'turn')}"
    return exam_audio_task_dir(session_id, task_id) / f"{filename}{safe_suffix}"


def is_managed_exam_audio_path(file_path: str, *, session_id: str, task_id: str) -> bool:
    candidate = Path(str(file_path or "")).expanduser()
    if not candidate.is_absolute():
        candidate = (Path.cwd() / candidate).resolve()
    else:
        candidate = candidate.resolve()
    allowed_dir = exam_audio_task_dir(session_id, task_id)
    return candidate.is_relative_to(allowed_dir)
