from __future__ import annotations

def rebuild_from_events(events: list[dict]) -> dict:
    return {"status": "scaffold", "event_count": len(events)}
