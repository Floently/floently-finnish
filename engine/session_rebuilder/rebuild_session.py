"""
==========================================================
YKI SESSION REBUILDER — Deterministic state from event log
==========================================================

events = load_events(session_id)
state = initial_state()
for event in events:
    state = apply_event(state, event)
return state
"""

from __future__ import annotations

import copy
import time
from typing import Any

from engine.exam.exam_timing_engine import DEFAULT_EXAM_MODE, duration_profile_for_mode
from engine.events.exam_events import (
    ANSWER_SUBMITTED,
    AUDIO_UPLOADED,
    EXAM_SUBMITTED,
    INTRO_STARTED,
    RESULTS_GENERATED,
    SESSION_CREATED,
    WRITING_SUBMITTED,
)
from engine.event_store.store import load_events
from engine.session_rebuilder.state_machine import next_state_after_event

try:
    from engine.event_store.snapshots import load_snapshot, write_snapshot, should_snapshot
    _SNAPSHOTS_AVAILABLE = True
except ImportError:
    _SNAPSHOTS_AVAILABLE = False

try:
    from engine.event_store.integrity import verify_manifest_integrity, ManifestIntegrityError
    _MANIFEST_INTEGRITY_AVAILABLE = True
except ImportError:
    _MANIFEST_INTEGRITY_AVAILABLE = False


def initial_state(session_id: str = "", level_band: str = "B1_B2", exam: dict | None = None) -> dict[str, Any]:
    """Empty session state before any events."""
    return {
        "session_id": session_id,
        "level_band": level_band,
        "exam": exam or {},
        "answers": {},
        "audio_answers": {},
        "writing_answers": {},
        "start_time": time.time(),
        "mode": DEFAULT_EXAM_MODE,
        "duration_profile_seconds": duration_profile_for_mode(DEFAULT_EXAM_MODE),
        "completed": False,
        "current_state": "",
        "score": None,
        "cefr_level": None,
        "feedback": None,
        "results": None,
    }


def apply_event(state: dict[str, Any], event: Any) -> dict[str, Any]:
    """Return new state after applying event. Immutable-style: copy then update."""
    if hasattr(event, "payload"):
        payload = event.payload
        event_type = event.event_type
    else:
        payload = event.get("payload", {})
        event_type = event.get("event_type", "")
    next_state = copy.deepcopy(state)

    if event_type == SESSION_CREATED:
        next_state["session_id"] = payload.get("session_id", state["session_id"])
        next_state["level_band"] = payload.get("level_band", state["level_band"])
        next_state["exam"] = payload.get("exam", state.get("exam") or {})
        next_state["start_time"] = payload.get("start_time", state.get("start_time", time.time()))
        next_state["mode"] = payload.get("mode", state.get("mode", DEFAULT_EXAM_MODE))
        next_state["duration_profile_seconds"] = payload.get(
            "duration_profile_seconds",
            state.get("duration_profile_seconds", duration_profile_for_mode(DEFAULT_EXAM_MODE)),
        )
        next_state["current_state"] = "INIT"
        return next_state

    if event_type == INTRO_STARTED:
        next_state["current_state"] = "INTRO"
        return next_state

    if event_type == ANSWER_SUBMITTED:
        answer_id = payload.get("answer_id")
        answer = payload.get("answer")
        if answer_id is not None:
            next_state.setdefault("answers", {})[answer_id] = answer
        next_state["current_state"] = next_state_after_event(
            next_state.get("current_state", ""), event_type, payload
        ) or next_state.get("current_state", "READING")
        return next_state

    if event_type == AUDIO_UPLOADED:
        task_id = payload.get("task_id")
        path = payload.get("audio_file_path")
        if task_id is not None:
            next_state.setdefault("audio_answers", {})[task_id] = path
        return next_state

    if event_type == WRITING_SUBMITTED:
        task_id = payload.get("task_id")
        text = payload.get("text")
        if task_id is not None:
            next_state.setdefault("writing_answers", {})[task_id] = text
        return next_state

    if event_type == EXAM_SUBMITTED:
        next_state["current_state"] = "SUBMITTED"
        next_state["completed"] = True
        return next_state

    if event_type == RESULTS_GENERATED:
        next_state["current_state"] = "RESULTS_READY"
        next_state["score"] = payload.get("score")
        next_state["cefr_level"] = payload.get("cefr_level")
        next_state["feedback"] = payload.get("feedback")
        next_state["results"] = payload.get("results")
        return next_state

    return next_state


def rebuild_session(session_id: str, fallback_session: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Rebuild session state from event log. Uses snapshot + replay if snapshot exists.
    If no events exist, return fallback_session (legacy JSON session) or initial_state.
    When SESSION_CREATED payload contains manifest_hash, verifies manifest file integrity.
    """
    events = load_events(session_id)
    if not events:
        if fallback_session:
            return copy.deepcopy(fallback_session)
        return initial_state(session_id=session_id)

    # Manifest integrity: if first event has manifest_hash, verify manifest file
    if _MANIFEST_INTEGRITY_AVAILABLE:
        first = events[0]
        payload = first.payload if hasattr(first, "payload") else (first.get("payload") or {})
        stored_hash = payload.get("manifest_hash")
        if stored_hash:
            verify_manifest_integrity(session_id, stored_hash)

    state = initial_state(session_id=session_id)
    start_index = 0
    if _SNAPSHOTS_AVAILABLE:
        snap = load_snapshot(session_id)
        if snap and snap.get("last_event_id") and snap.get("state"):
            for i, ev in enumerate(events):
                if getattr(ev, "event_id", None) == snap["last_event_id"]:
                    state = copy.deepcopy(snap["state"])
                    start_index = i + 1
                    break
    for ev in events[start_index:]:
        state = apply_event(state, ev)
    state["session_id"] = session_id
    if fallback_session and not state.get("exam"):
        state["exam"] = fallback_session.get("exam") or {}
    return state
