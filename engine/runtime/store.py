from __future__ import annotations

_RUNTIME: dict[str, dict] = {}

def save_runtime(session_id: str, payload: dict) -> None:
    _RUNTIME[session_id] = dict(payload)

def get_runtime(session_id: str) -> dict | None:
    return _RUNTIME.get(session_id)
