"""
==========================================================
YKI SNAPSHOT STORE — Periodic state snapshots for fast rebuild
==========================================================

Snapshot every N events. Rebuild = load snapshot + replay events after snapshot.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

SNAPSHOTS_DIR = Path("exam_sessions/snapshots")
SNAPSHOT_INTERVAL = 50


def _snapshot_path(session_id: str) -> Path:
    safe_id = "".join(c if c.isalnum() or c in "-_" else "_" for c in session_id)
    return SNAPSHOTS_DIR / f"{safe_id}.json"


def write_snapshot(session_id: str, state: dict[str, Any], last_event_id: str, event_count: int) -> None:
    """Write snapshot after event_count events (e.g. every 50)."""
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "session_id": session_id,
        "state": state,
        "last_event_id": last_event_id,
        "event_count": event_count,
        "timestamp": time.time(),
    }
    path = _snapshot_path(session_id)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


def load_snapshot(session_id: str) -> dict[str, Any] | None:
    """Return snapshot payload or None if no snapshot."""
    path = _snapshot_path(session_id)
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def should_snapshot(event_count: int) -> bool:
    """True when we should write a snapshot (e.g. every 50 events)."""
    return event_count > 0 and event_count % SNAPSHOT_INTERVAL == 0
