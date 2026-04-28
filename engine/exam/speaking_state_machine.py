from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


STATE_IDLE = "IDLE"
STATE_PROMPT_PLAYING = "PROMPT_PLAYING"
STATE_WAITING_FOR_RECORDING = "WAITING_FOR_RECORDING"
STATE_RECORDING = "RECORDING"
STATE_UPLOADING = "UPLOADING"
STATE_AI_RESPONDING = "AI_RESPONDING"
STATE_CONVERSATION_COMPLETE = "CONVERSATION_COMPLETE"

SUPPORTED_SPEAKING_STATES = (
    STATE_IDLE,
    STATE_PROMPT_PLAYING,
    STATE_WAITING_FOR_RECORDING,
    STATE_RECORDING,
    STATE_UPLOADING,
    STATE_AI_RESPONDING,
    STATE_CONVERSATION_COMPLETE,
)

_ALLOWED_TRANSITIONS = {
    STATE_IDLE: {STATE_PROMPT_PLAYING, STATE_WAITING_FOR_RECORDING},
    STATE_PROMPT_PLAYING: {STATE_WAITING_FOR_RECORDING, STATE_CONVERSATION_COMPLETE},
    STATE_WAITING_FOR_RECORDING: {STATE_RECORDING, STATE_UPLOADING, STATE_CONVERSATION_COMPLETE},
    STATE_RECORDING: {STATE_UPLOADING, STATE_CONVERSATION_COMPLETE},
    STATE_UPLOADING: {STATE_AI_RESPONDING, STATE_CONVERSATION_COMPLETE},
    STATE_AI_RESPONDING: {STATE_PROMPT_PLAYING, STATE_WAITING_FOR_RECORDING, STATE_CONVERSATION_COMPLETE},
    STATE_CONVERSATION_COMPLETE: set(),
}


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_state_machine(state: dict[str, Any]) -> dict[str, Any]:
    current_state = str(state.get("state") or "").strip() or STATE_IDLE
    state["state"] = current_state
    history = state.get("state_history")
    if not isinstance(history, list):
        history = []
    if not history:
        history.append({"state": current_state, "timestamp": _timestamp()})
    state["state_history"] = history
    state["supported_states"] = list(SUPPORTED_SPEAKING_STATES)
    return state


def transition_state(state: dict[str, Any], next_state: str) -> dict[str, Any]:
    ensure_state_machine(state)
    normalized_next_state = str(next_state or "").strip()
    if normalized_next_state not in SUPPORTED_SPEAKING_STATES:
        raise ValueError(f"Unsupported speaking state: {normalized_next_state or 'missing'}")

    current_state = str(state.get("state") or STATE_IDLE)
    if normalized_next_state == current_state:
        return state

    allowed = _ALLOWED_TRANSITIONS.get(current_state, set())
    if normalized_next_state not in allowed:
        raise RuntimeError(f"Invalid speaking state transition: {current_state} -> {normalized_next_state}")

    state["state"] = normalized_next_state
    state["state_history"].append(
        {
            "state": normalized_next_state,
            "timestamp": _timestamp(),
        }
    )
    return state
