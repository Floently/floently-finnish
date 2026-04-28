"""
Audio upload endpoint for speaking submissions.
"""

from __future__ import annotations

import re
from pathlib import Path

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile

from engine.api.request_rate_limits import check_rate_limit
from engine.exam.audio_storage import exam_audio_file_path
from engine.runtime.logging_v3_3 import log_event
from engine.runtime.session_manager_v3_3 import SessionNotFoundError, get_session
from engine.runtime.session_tokens import verify_engine_session_token


AUDIO_UPLOAD_PATH = Path("uploads/audio")
AUDIO_UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
MAX_AUDIO_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/m4a",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/ogg",
    "application/octet-stream",
}


router = APIRouter(tags=["upload"])


def _sanitize_filename(filename: str) -> str:
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename or "audio")
    return safe_name or "audio"


def _load_session(session_id: str) -> dict:
    try:
        return get_session(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc


def _validate_speaking_task(session: dict, task_id: str) -> None:
    speaking_tasks = session.get("exam", {}).get("speaking", [])
    if not any(str(task.get("id") or "").strip() == task_id for task in speaking_tasks):
        raise HTTPException(status_code=404, detail="Speaking task not found")


@router.post("/upload/audio")
async def upload_audio(
    session_id: str = Form(...),
    task_id: str = Form(...),
    turn_id: str | None = Form(None),
    session_token: str = Form(...),
    file: UploadFile = File(...),
):
    session = _load_session(session_id)
    _validate_speaking_task(session, task_id)
    check_rate_limit(scope="audio_upload", session_id=session_id, limit=20, window_seconds=60.0)
    if not verify_engine_session_token(session, session_token):
        raise HTTPException(status_code=403, detail="Engine session token is invalid")
    content_type = str(file.content_type or "").strip().lower()
    if content_type and content_type not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported audio content type")
    original_name = file.filename or "audio.wav"
    safe_name = _sanitize_filename(Path(original_name).name)
    suffix = Path(safe_name).suffix or ".wav"
    target_path = exam_audio_file_path(
        session_id=session_id,
        task_id=task_id,
        turn_id=turn_id,
        suffix=suffix,
    )

    bytes_written = 0
    with target_path.open("wb") as handle:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            bytes_written += len(chunk)
            if bytes_written > MAX_AUDIO_UPLOAD_BYTES:
                handle.close()
                target_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Audio upload exceeds size limit")
            handle.write(chunk)

    await file.close()

    file_path = target_path.as_posix()
    log_event(
        "audio_upload",
        session_id=session_id,
        task_id=task_id,
        turn_id=turn_id,
        filename=original_name,
        content_type=content_type,
        size_bytes=bytes_written,
        file_path=file_path,
    )
    return {"file_path": file_path}


app = FastAPI(
    title="KieliTaika YKI Audio Upload API",
    version="3.3",
)
app.include_router(router)
