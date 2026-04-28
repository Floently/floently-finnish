from __future__ import annotations

_EVENTS: list[dict] = []

def append_event(event: dict) -> None:
    _EVENTS.append(dict(event))

def list_events() -> list[dict]:
    return list(_EVENTS)
