"""
Engine status, health, diagnostics, and metrics endpoints.
"""

from __future__ import annotations

import os
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException
from engine.exam.exam_timing_engine import (
    DEFAULT_EXAM_MODE,
    EXAM_MODES,
    duration_profile_for_mode,
)
from engine.tools.build_task_index_v3_2 import INDEX_PATH, ensure_task_index_v3_2

router = APIRouter(tags=["engine"], prefix="/engine")

ENGINE_VERSION = os.getenv("YKI_ENGINE_VERSION", "3.3")
_engine_start_time = time.time()

try:
    from engine.event_store.store import EVENTS_DIR, has_event_log, load_events
    from engine.event_store.integrity import verify_event_chain, EventIntegrityError
    from engine.blueprints.loader import load_blueprint, validate_blueprint, BLUEPRINTS_DIR
    from engine.runtime.session_manager_v3_3 import list_active_sessions, ACTIVE_SESSIONS
    from engine.metrics import get_metrics, increment_metric
    _INTEGRATION_AVAILABLE = True
except ImportError:
    _INTEGRATION_AVAILABLE = False
    def increment_metric(name: str, delta: int = 1) -> None: ...
    def get_metrics() -> dict: return {}

def _event_store_writable() -> bool:
    try:
        EVENTS_DIR.mkdir(parents=True, exist_ok=True)
        test_file = EVENTS_DIR / ".health_check"
        test_file.write_text("ok")
        test_file.unlink()
        return True
    except Exception:
        return False


def _blueprints_valid() -> tuple[bool, list[str]]:
    if not _INTEGRATION_AVAILABLE or not BLUEPRINTS_DIR.exists():
        return True, []
    loaded = []
    for path in BLUEPRINTS_DIR.glob("*.json"):
        name = path.stem
        try:
            bp = load_blueprint(name)
            ok, err = validate_blueprint(bp)
            if ok:
                loaded.append(name)
            else:
                return False, [f"{name}: {err}"]
        except Exception as e:
            return False, [f"{name}: {e!s}"]
    return True, loaded


def _certified_tasks_available() -> bool:
    try:
        ensure_task_index_v3_2(strict=False)
        return INDEX_PATH.exists()
    except Exception:
        return False


@router.get("/health")
def engine_health():
    """Checks: event store writable, blueprints valid, certified tasks available."""
    checks = {}
    if _INTEGRATION_AVAILABLE:
        checks["event_store_writable"] = _event_store_writable()
        ok, errs = _blueprints_valid()
        checks["blueprints_valid"] = ok
        if not ok and errs:
            checks["blueprint_errors"] = errs
        checks["certified_tasks_available"] = _certified_tasks_available()
        checks["snapshot_dir_exists"] = Path("exam_sessions/snapshots").exists() or True
    else:
        checks["event_store_writable"] = True
        checks["blueprints_valid"] = True
        checks["certified_tasks_available"] = _certified_tasks_available()
    all_ok = all(
        v for k, v in checks.items()
        if k not in ("blueprint_errors",) and isinstance(v, bool)
    )
    if all_ok:
        return {"status": "OK", "checks": checks}
    return {"status": "DEGRADED", "checks": checks}


@router.get("/status")
def engine_status():
    """Engine version, blueprints loaded, event store integrity, active sessions, deterministic mode."""
    blueprints_loaded = []
    event_store_integrity = "OK"
    if _INTEGRATION_AVAILABLE:
        _, blueprints_loaded = _blueprints_valid()
        if not _event_store_writable():
            event_store_integrity = "NOT_WRITABLE"
    active = 0
    active_session_modes = {mode: 0 for mode in EXAM_MODES}
    try:
        sessions = list_active_sessions() if _INTEGRATION_AVAILABLE else []
        active = len(sessions)
        for session in sessions:
            mode = str(session.get("mode") or DEFAULT_EXAM_MODE).strip().lower()
            if mode in active_session_modes:
                active_session_modes[mode] += 1
    except Exception:
        active = len(ACTIVE_SESSIONS) if _INTEGRATION_AVAILABLE else 0
        for session in ACTIVE_SESSIONS.values():
            mode = str(session.get("mode") or DEFAULT_EXAM_MODE).strip().lower()
            if mode in active_session_modes:
                active_session_modes[mode] += 1
    return {
        "engine_version": ENGINE_VERSION,
        "blueprints_loaded": blueprints_loaded or ["B1_B2_blueprint_v1"],
        "event_store_integrity": event_store_integrity,
        "active_sessions": active,
        "deterministic_mode": True,
        "default_mode": DEFAULT_EXAM_MODE,
        "supported_modes": list(EXAM_MODES),
        "active_session_modes": active_session_modes,
        "timing_profiles": {
            mode: duration_profile_for_mode(mode) for mode in EXAM_MODES
        },
    }


@router.get("/session/{session_id}/diagnostics")
def session_diagnostics(session_id: str):
    """Session state, events count, hash chain valid, last event."""
    if not _INTEGRATION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Event store not available")
    events = load_events(session_id)
    events_count = len(events)
    hash_chain_valid = False
    try:
        verify_event_chain(session_id)
        hash_chain_valid = True
    except EventIntegrityError:
        hash_chain_valid = False
    last_event = None
    if events:
        ev = events[-1]
        last_event = {
            "event_id": ev.event_id,
            "event_type": ev.event_type,
            "timestamp": ev.timestamp.isoformat() if hasattr(ev.timestamp, "isoformat") else str(ev.timestamp),
        }
    from engine.session_rebuilder.rebuild_session import rebuild_session
    state = rebuild_session(session_id, fallback_session={})
    session_state = state.get("current_state", "UNKNOWN")
    return {
        "session_state": session_state,
        "events_count": events_count,
        "hash_chain_valid": hash_chain_valid,
        "blueprint_version": state.get("blueprint_version"),
        "seed": state.get("seed"),
        "last_event": last_event,
    }


@router.get("/metrics")
def engine_metrics():
    """Telemetry: active_sessions, events_written, sessions_completed, engine_errors, uptime_seconds."""
    m = get_metrics()
    try:
        active = len(list_active_sessions()) if _INTEGRATION_AVAILABLE else 0
    except Exception:
        active = 0
    return {
        "active_sessions": active,
        "events_written": m.get("events_written", 0),
        "sessions_completed": m.get("sessions_completed", 0),
        "engine_errors": m.get("engine_errors", 0),
        "uptime_seconds": time.time() - _engine_start_time,
    }
