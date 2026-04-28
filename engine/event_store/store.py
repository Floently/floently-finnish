"""
==========================================================
YKI EVENT STORE — Append-only event log
==========================================================

Storage: exam_sessions/events/{session_id}.log
Never overwrite. Append only. Sequential order.
New events are hash-chained (previous_hash, event_hash); GENESIS for first event.
"""

from __future__ import annotations

import json
from pathlib import Path

from engine.events.exam_events import ExamEvent, GENESIS_HASH, compute_event_hash

try:
    from engine.metrics import increment_metric
except ImportError:
    def increment_metric(name: str, delta: int = 1) -> None: ...


EVENTS_DIR = Path("exam_sessions/events")
EVENTS_DIR.mkdir(parents=True, exist_ok=True)


def _event_log_path(session_id: str) -> Path:
    safe_id = "".join(c if c.isalnum() or c in "-_" else "_" for c in session_id)
    return EVENTS_DIR / f"{safe_id}.log"


def append_event(event: ExamEvent) -> None:
    """Append a single event to the session log. Chains hash if not set."""
    path = _event_log_path(event.session_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    previous_hash = GENESIS_HASH
    if path.exists():
        events = load_events(event.session_id)
        if events:
            previous_hash = getattr(events[-1], "event_hash", None) or GENESIS_HASH
    if not getattr(event, "event_hash", None) or event.event_hash == "":
        ts = event.timestamp.isoformat() if hasattr(event.timestamp, "isoformat") else str(event.timestamp)
        event_hash = compute_event_hash(
            previous_hash,
            event.event_id,
            event.session_id,
            event.event_type,
            ts,
            event.payload,
        )
        event = event.model_copy(update={"previous_hash": previous_hash, "event_hash": event_hash})
    with path.open("a", encoding="utf-8") as f:
        f.write(event.to_log_line())
    try:
        increment_metric("events_written")
    except Exception:
        pass


def load_events(session_id: str) -> list[ExamEvent]:
    """Load all events for a session in order. Returns [] if no log exists."""
    path = _event_log_path(session_id)
    if not path.exists():
        return []
    events = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                events.append(ExamEvent.model_validate(data))
            except (json.JSONDecodeError, Exception):
                continue
    return events


def has_event_log(session_id: str) -> bool:
    """True if this session has an event log (event-sourced)."""
    return _event_log_path(session_id).exists()
