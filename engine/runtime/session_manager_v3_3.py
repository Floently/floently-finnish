"""
Session manager for exam runtime sessions.
"""

from __future__ import annotations

import copy
import json
import threading
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from engine.exam.exam_timing_engine import (
    DEFAULT_EXAM_MODE,
    duration_profile_for_mode,
    normalize_duration_profile,
    normalize_exam_mode,
    total_duration_seconds,
)
from engine.exam.exam_generator_v3_2 import generate_exam
from engine.runtime.logging_v3_3 import log_event

try:
    from engine.event_store.store import append_event, has_event_log, load_events
    from engine.events.exam_events import ExamEvent, INTRO_STARTED, SESSION_CREATED
    from engine.session_rebuilder.rebuild_session import rebuild_session
    from engine.event_store.integrity import verify_event_chain, EventIntegrityError
    from engine.event_store.integrity import ManifestIntegrityError
    from engine.runtime.security_audit import audit_log
    _EVENT_SOURCING_AVAILABLE = True
except ImportError:
    _EVENT_SOURCING_AVAILABLE = False


SESSIONS_PATH = Path("exam_sessions")
SESSIONS_PATH.mkdir(parents=True, exist_ok=True)

SESSION_EXPIRY_SECONDS = total_duration_seconds()

ACTIVE_SESSIONS: dict[str, dict[str, Any]] = {}

_MANAGER_LOCK = threading.RLock()
_SESSION_LOCKS: dict[str, threading.RLock] = {}


class SessionError(RuntimeError):
    pass


class SessionNotFoundError(SessionError):
    pass


class SessionExpiredError(SessionError):
    pass


def _session_path(session_id: str) -> Path:
    return SESSIONS_PATH / f"{session_id}.json"


def _copy_session(session: dict[str, Any]) -> dict[str, Any]:
    return copy.deepcopy(session)


def _is_expired(session: dict[str, Any]) -> bool:
    start_time = float(session.get("start_time", 0))
    expiry_seconds = total_duration_seconds(session.get("duration_profile_seconds"))
    return (time.time() - start_time) >= expiry_seconds


def _normalize_session(session: dict[str, Any]) -> dict[str, Any]:
    normalized = _copy_session(session)
    normalized.setdefault("session_id", str(uuid.uuid4()))
    normalized.setdefault("level_band", "B1_B2")
    normalized["mode"] = normalize_exam_mode(normalized.get("mode"))
    normalized.setdefault("seed", normalized["session_id"])
    normalized["duration_profile_seconds"] = normalize_duration_profile(
        normalized.get("duration_profile_seconds")
        or duration_profile_for_mode(normalized["mode"])
    )

    # Backfill older runtime sessions that were missing the generated exam.
    if not normalized.get("exam"):
        normalized["exam"] = generate_exam(
            normalized["level_band"],
            mode=normalized["mode"],
            seed=normalized["seed"],
        )

    normalized.setdefault("answers", {})
    normalized.setdefault("audio_answers", {})
    normalized.setdefault("writing_answers", {})
    normalized.setdefault("speaking_runtime", {})
    normalized.setdefault("start_time", time.time())
    normalized.setdefault("completed", False)
    return normalized


def _load_session_from_disk(session_id: str) -> dict[str, Any]:
    session_path = _session_path(session_id)
    if not session_path.exists():
        raise SessionNotFoundError(f"Session not found: {session_id}")

    with session_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    return _normalize_session(payload)


def _write_session_to_disk(session: dict[str, Any]) -> None:
    session_path = _session_path(session["session_id"])
    temp_path = session_path.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(session, handle, indent=2, ensure_ascii=False)
    temp_path.replace(session_path)


def _cache_session_unlocked(session: dict[str, Any]) -> None:
    session_id = session["session_id"]
    ACTIVE_SESSIONS[session_id] = _copy_session(session)
    _SESSION_LOCKS.setdefault(session_id, threading.RLock())


def _prune_expired_sessions() -> None:
    with _MANAGER_LOCK:
        expired_ids = [
            session_id
            for session_id, session in ACTIVE_SESSIONS.items()
            if _is_expired(session)
        ]

    for session_id in expired_ids:
        delete_session(session_id, missing_ok=True)


def create_session(
    level_band: str,
    blueprint_version: str | None = None,
    seed: str | None = None,
    manifest_hash: str | None = None,
    mode: str = DEFAULT_EXAM_MODE,
    duration_profile_seconds: dict[str, Any] | None = None,
) -> dict[str, Any]:
    normalized_mode = normalize_exam_mode(mode)
    resolved_duration_profile_seconds = normalize_duration_profile(
        duration_profile_seconds or duration_profile_for_mode(normalized_mode)
    )
    session_id = str(uuid.uuid4())
    resolved_seed = str(seed or session_id)
    session = {
        "session_id": session_id,
        "level_band": level_band,
        "exam": generate_exam(level_band, mode=normalized_mode, seed=resolved_seed),
        "answers": {},
        "audio_answers": {},
        "writing_answers": {},
        "speaking_runtime": {},
        "start_time": time.time(),
        "mode": normalized_mode,
        "seed": resolved_seed,
        "duration_profile_seconds": resolved_duration_profile_seconds,
        "completed": False,
    }

    saved_session = save_session(session)
    log_event(
        "session_created",
        session_id=saved_session["session_id"],
        level_band=level_band,
        mode=normalized_mode,
    )

    if _EVENT_SOURCING_AVAILABLE:
        try:
            payload = {
                "session_id": saved_session["session_id"],
                "level_band": level_band,
                "start_time": saved_session["start_time"],
                "mode": normalized_mode,
                "duration_profile_seconds": resolved_duration_profile_seconds,
            }
            if blueprint_version is not None:
                payload["blueprint_version"] = blueprint_version
            if seed is not None:
                payload["seed"] = seed
            if manifest_hash is not None:
                payload["manifest_hash"] = manifest_hash
            append_event(ExamEvent(
                session_id=saved_session["session_id"],
                event_type=SESSION_CREATED,
                payload=payload,
            ))
            append_event(ExamEvent(
                session_id=saved_session["session_id"],
                event_type=INTRO_STARTED,
                payload={},
            ))
        except Exception:
            pass

    return saved_session


def get_session(session_id: str) -> dict[str, Any]:
    _prune_expired_sessions()

    with _MANAGER_LOCK:
        session = ACTIVE_SESSIONS.get(session_id)
        if session is None:
            session = _load_session_from_disk(session_id)
            if _EVENT_SOURCING_AVAILABLE and has_event_log(session_id):
                try:
                    verify_event_chain(session_id)
                except EventIntegrityError:
                    audit_log("tampered_event_chain", session_id=session_id)
                    raise SessionError(f"Event chain integrity failed: {session_id}")
                try:
                    session = rebuild_session(session_id, fallback_session=session)
                    if not session.get("exam") and ACTIVE_SESSIONS.get(session_id):
                        session["exam"] = ACTIVE_SESSIONS[session_id].get("exam")
                except ManifestIntegrityError:
                    audit_log("manifest_integrity_failed", session_id=session_id)
                    raise SessionError(f"Manifest integrity failed: {session_id}")
                except Exception:
                    pass
            _cache_session_unlocked(session)
            session = ACTIVE_SESSIONS[session_id]

    if _is_expired(session):
        delete_session(session_id, missing_ok=True)
        raise SessionExpiredError(f"Session expired: {session_id}")

    return _copy_session(session)


def save_session(session: dict[str, Any]) -> dict[str, Any]:
    normalized = _normalize_session(session)
    session_id = normalized["session_id"]

    with _MANAGER_LOCK:
        lock = _SESSION_LOCKS.setdefault(session_id, threading.RLock())

    with lock:
        _write_session_to_disk(normalized)
        with _MANAGER_LOCK:
            ACTIVE_SESSIONS[session_id] = _copy_session(normalized)

    return _copy_session(normalized)


def delete_session(session_id: str, missing_ok: bool = False) -> None:
    with _MANAGER_LOCK:
        ACTIVE_SESSIONS.pop(session_id, None)
        _SESSION_LOCKS.pop(session_id, None)

    session_path = _session_path(session_id)
    if session_path.exists():
        session_path.unlink()
        return

    if not missing_ok:
        raise SessionNotFoundError(f"Session not found: {session_id}")


def list_active_sessions() -> list[dict[str, Any]]:
    _prune_expired_sessions()

    with _MANAGER_LOCK:
        return [
            _copy_session(session)
            for session in ACTIVE_SESSIONS.values()
            if not session.get("completed", False)
        ]


@contextmanager
def locked_session(session_id: str) -> Iterator[dict[str, Any]]:
    _prune_expired_sessions()

    with _MANAGER_LOCK:
        session = ACTIVE_SESSIONS.get(session_id)
        if session is None:
            session = _load_session_from_disk(session_id)
            _cache_session_unlocked(session)
            session = ACTIVE_SESSIONS[session_id]
        lock = _SESSION_LOCKS.setdefault(session_id, threading.RLock())

    with lock:
        if _is_expired(session):
            delete_session(session_id, missing_ok=True)
            raise SessionExpiredError(f"Session expired: {session_id}")

        original = _copy_session(session)
        try:
            yield session
        except Exception:
            with _MANAGER_LOCK:
                ACTIVE_SESSIONS[session_id] = original
            raise
        else:
            save_session(session)
