from __future__ import annotations

import mimetypes
from difflib import SequenceMatcher
from pathlib import Path

from app.core.config import SETTINGS
from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import iso_now, new_id


def _engine_upload_path(*, session_id: str, task_id: str, turn_id: str | None, suffix: str) -> Path:
    from app.core.paths import RUNTIME_DIR

    root = RUNTIME_DIR / "uploads" / "audio" / "exam"
    root.mkdir(parents=True, exist_ok=True)
    safe_session = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in str(session_id))
    safe_task = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in str(task_id))
    filename = "recording" if not turn_id else f"turn_{''.join(ch if ch.isalnum() or ch in '._-' else '_' for ch in str(turn_id))}"
    extension = suffix if str(suffix).startswith(".") else f".{suffix}"
    target_dir = (root / safe_session / safe_task).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir / f"{filename}{extension}"


def save_voice_file(*, raw_bytes: bytes, filename: str, mime_type: str, mode: str, session_id: str, task_id: str | None, turn_id: str | None) -> tuple[str, str]:
    guessed_ext = mimetypes.guess_extension(mime_type) or Path(filename or "audio.bin").suffix or ".bin"
    voice_ref = new_id("voice")
    if mode == "yki_exam":
        if not task_id:
            raise AppError(400, "VALIDATION_ERROR", "task_id is required for yki_exam voice uploads.", False, {"classification": "non_retryable"})
        target = _engine_upload_path(session_id=session_id, task_id=task_id, turn_id=turn_id, suffix=guessed_ext)
    else:
        from app.core.paths import RUNTIME_DIR
        target_dir = RUNTIME_DIR / "uploads" / "voice" / session_id
        target_dir.mkdir(parents=True, exist_ok=True)
        base_name = "recording" if not turn_id else f"turn_{turn_id}"
        target = target_dir / f"{base_name}{guessed_ext}"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw_bytes)

    with STORE.locked(("voice_refs", voice_ref)):
        STORE.set(
            "voice_refs",
            voice_ref,
            {
                "path": str(target.resolve()),
                "mime_type": mime_type,
                "mode": mode,
                "session_id": session_id,
                "task_id": task_id,
                "turn_id": turn_id,
                "created_at": iso_now(),
            },
        )
    return voice_ref, str(target.resolve())


def resolve_voice_ref(*, audio_ref: str, expected_session_id: str, expected_task_id: str | None = None, expected_turn_id: str | None = None) -> str:
    with STORE.locked(("voice_refs", audio_ref)):
        payload = STORE.get_ref("voice_refs", audio_ref)
        if not payload:
            raise AppError(404, "VOICE_REF_NOT_FOUND", "Audio reference was not found.", False, {"classification": "terminal"})
        if payload.get("session_id") != expected_session_id:
            raise AppError(409, "VOICE_SESSION_MISMATCH", "Audio reference does not belong to this session.", False, {"classification": "terminal"})
        if expected_task_id is not None and payload.get("task_id") != expected_task_id:
            raise AppError(409, "VOICE_TASK_MISMATCH", "Audio reference does not belong to this task.", False, {"classification": "terminal"})
        if expected_turn_id is not None and payload.get("turn_id") != expected_turn_id:
            raise AppError(409, "VOICE_TURN_MISMATCH", "Audio reference does not belong to this turn.", False, {"classification": "terminal"})
        return str(payload["path"])


def pronunciation_feedback(*, expected_text: str, transcript: str) -> dict[str, object]:
    expected = str(expected_text or "").strip()
    actual = str(transcript or "").strip()
    if not expected or not actual:
        raise AppError(400, "VALIDATION_ERROR", "Both expected_text and transcript are required.", False, {"classification": "non_retryable"})
    ratio = SequenceMatcher(None, expected.lower(), actual.lower()).ratio()
    score = round(ratio * 4, 2)
    if ratio > 0.85:
        feedback = "Pronunciation alignment is strong."
    elif ratio > 0.6:
        feedback = "Pronunciation is understandable but has room to improve."
    else:
        feedback = "Pronunciation diverged noticeably from the expected phrase."
    return {
        "score": score,
        "feedback": feedback,
        "details": {
            "similarity_ratio": round(ratio, 3),
            "expected_text": expected,
            "transcript": actual,
        },
    }
