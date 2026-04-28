from __future__ import annotations

import copy
from typing import Any

from engine.exam.conversation_runtime import build_conversation_payload
from engine.exam.tts_voice_manager import normalize_role_name
from engine.runtime.logging_v3_3 import log_event
from engine.services.audio_resolver import MediaIntegrityError, resolve_audio


RECORDING_RESPONSE_MODE = "recording_response"
RECORDING_SPEAKING_MODE = "recording"
CONVERSATION_MODE = "conversation"
ALLOWED_SPEAKING_MODES = {RECORDING_RESPONSE_MODE, RECORDING_SPEAKING_MODE, CONVERSATION_MODE}


def _trimmed(value: Any) -> str:
    return str(value or "").strip()


def _runtime_mode_for_speaking_mode(speaking_mode: str) -> str:
    return CONVERSATION_MODE if speaking_mode == CONVERSATION_MODE else RECORDING_RESPONSE_MODE


def _speaking_mode_alias(value: Any) -> str:
    normalized = _trimmed(value)
    if normalized == RECORDING_RESPONSE_MODE:
        return RECORDING_SPEAKING_MODE
    if normalized in {RECORDING_SPEAKING_MODE, CONVERSATION_MODE}:
        return normalized
    return ""


def _conversation_role_for_task(task: dict[str, Any]) -> str:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    materials = content.get("materials") if isinstance(content.get("materials"), dict) else {}
    roles = materials.get("roles") if isinstance(materials.get("roles"), dict) else {}
    explicit_role = (
        _trimmed(task.get("conversation_role"))
        or _trimmed(content.get("conversation_role"))
        or _trimmed(roles.get("partner"))
    )
    return normalize_role_name(explicit_role)


def speaking_mode_for_task(task: dict[str, Any]) -> str:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    explicit_mode = (
        _speaking_mode_alias(task.get("speaking_mode"))
        or _speaking_mode_alias(content.get("speaking_mode"))
        or _speaking_mode_alias(task.get("mode"))
        or _speaking_mode_alias(content.get("mode"))
    )
    if explicit_mode:
        return explicit_mode

    task_type = _trimmed(task.get("task_type"))
    if task_type == "speaking_roleplay":
        return CONVERSATION_MODE
    if task_type in {"speaking", "speaking_monologue", "speaking_interview", "speaking_opinion_monologue"}:
        return RECORDING_RESPONSE_MODE
    raise ValueError(f"Unsupported speaking task type: {task_type or 'missing'}")


def normalize_speaking_task(task: dict[str, Any]) -> dict[str, Any]:
    normalized = copy.deepcopy(task)
    task_id = _trimmed(normalized.get("id"))
    if not task_id:
        raise ValueError("Speaking task missing id")

    resolved_mode = speaking_mode_for_task(normalized)
    normalized["task_type"] = "speaking"
    normalized["skill"] = "speaking"
    normalized["speaking_mode"] = resolved_mode
    normalized["mode"] = _runtime_mode_for_speaking_mode(resolved_mode)
    content = normalized.get("content") if isinstance(normalized.get("content"), dict) else {}
    normalized["content"] = content
    content["mode"] = normalized["mode"]
    content["speaking_mode"] = normalized["speaking_mode"]

    if normalized["speaking_mode"] == CONVERSATION_MODE:
        conversation_role = _conversation_role_for_task(normalized)
        normalized["conversation_role"] = conversation_role
        content["conversation_role"] = conversation_role
        content["conversation"] = build_conversation_payload(normalized)
        content.setdefault("target_duration_seconds", 120)
        return normalized

    instruction = _trimmed(content.get("instruction")) or _trimmed(normalized.get("instruction"))
    if not instruction:
        raise ValueError("Recording speaking task missing instruction")
    prompt_audio_text = _trimmed(content.get("prompt_audio_text")) or instruction
    content["instruction"] = instruction
    content.setdefault("target_duration_seconds", int(content.get("target_duration_seconds") or 60))
    content["prompt_audio_text"] = prompt_audio_text
    normalized["conversation_role"] = ""
    return normalized


def _timing_minutes(task: dict[str, Any]) -> int:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    timing = content.get("timing") if isinstance(content.get("timing"), dict) else {}
    value = int(timing.get("recommended_minutes") or 0)
    return value


def _recording_audio(task_id: str, task: dict[str, Any]) -> dict[str, Any] | None:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    prompt_text = _trimmed(content.get("prompt_audio_text"))
    if not prompt_text:
        return None
    try:
        audio = resolve_audio(
            transcript=prompt_text,
            audio_asset_id=f"{task_id}-recording-prompt",
            voice="female",
            speed=1.0,
        )
        log_event(
            "TTS_GENERATED",
            task_id=task_id,
            speaking_mode=RECORDING_SPEAKING_MODE,
            audio_asset_id=f"{task_id}-recording-prompt",
            voice_profile="yki_standard_female",
        )
        return audio
    except MediaIntegrityError as exc:
        log_event(
            "speaking_prompt_audio_unavailable",
            task_id=task_id,
            error=str(exc),
        )
        return None


def build_speaking_screen(task: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_speaking_task(task)
    task_id = _trimmed(normalized.get("id"))
    content = normalized["content"]
    mode = normalized["mode"]
    speaking_mode = normalized["speaking_mode"]
    timing_minutes = _timing_minutes(normalized)

    prompt_audio = _recording_audio(task_id, normalized) if mode == RECORDING_RESPONSE_MODE else None
    prompt_text = (
        _trimmed(content.get("prompt_audio_text"))
        if mode == RECORDING_RESPONSE_MODE
        else _trimmed(((content.get("conversation") or {}).get("turns") or [{}])[0].get("text"))
    ) or _trimmed(content.get("instruction"))

    payload = {
        "id": f"{task_id}:speaking",
        "task_id": task_id,
        "section": "speaking",
        "skill": "speaking",
        "screen_type": "speaking_task",
        "ui_type": "speaking_task",
        "title": "Speaking Task",
        "mode": mode,
        "speaking_mode": speaking_mode,
        "instruction": _trimmed(content.get("instruction")),
        "prompt_text": prompt_text,
        "prompt_audio_url": prompt_audio.get("url") if isinstance(prompt_audio, dict) else None,
        "timing_minutes": timing_minutes,
        "target_duration_seconds": int(content.get("target_duration_seconds") or 60),
        "materials": copy.deepcopy(content.get("materials") or {}),
        "conversation_role": _trimmed(content.get("conversation_role")),
        "permissions": {
            "microphone_required": True,
        },
        "ui_variant": "speaking_conversation" if speaking_mode == CONVERSATION_MODE else "speaking_recording",
    }
    log_event("SPEAKING_MODE", task_id=task_id, speaking_mode=speaking_mode)

    if mode == RECORDING_RESPONSE_MODE:
        payload["audio"] = prompt_audio
        payload["recording"] = {
            "prompt_audio_text": _trimmed(content.get("prompt_audio_text")),
            "controls": ["record", "stop", "playback", "submit"],
        }
    else:
        payload["conversation"] = copy.deepcopy(content.get("conversation") or {})
        payload["audio"] = None
        payload["conversation_ui"] = {
            "layout": "chat",
            "controls": ["play_ai_audio", "record", "stop", "submit_turn"],
        }

    return payload


def speaking_answered(session: dict[str, Any], task: dict[str, Any]) -> bool:
    task_id = _trimmed(task.get("id"))
    if not task_id:
        return False
    mode = speaking_mode_for_task(task)
    if mode == RECORDING_SPEAKING_MODE:
        audio_answers = session.get("audio_answers", {})
        return bool(audio_answers.get(task_id))
    speaking_runtime = session.get("speaking_runtime", {})
    state = speaking_runtime.get(task_id) if isinstance(speaking_runtime, dict) else None
    return bool(state and (state.get("completed") or state.get("responses")))
