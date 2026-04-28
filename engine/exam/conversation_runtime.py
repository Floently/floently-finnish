from __future__ import annotations

import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from engine.exam.speaking_state_machine import (
    STATE_AI_RESPONDING,
    STATE_CONVERSATION_COMPLETE,
    STATE_IDLE,
    STATE_PROMPT_PLAYING,
    STATE_RECORDING,
    STATE_UPLOADING,
    STATE_WAITING_FOR_RECORDING,
    ensure_state_machine,
    transition_state,
)
from engine.exam.tts_voice_manager import (
    ensure_voice_profile,
    normalize_role_name,
    voice_hint_for_profile,
)
from engine.runtime.logging_v3_3 import log_event
from engine.services.audio_resolver import MediaIntegrityError, resolve_audio
from engine.speech.stt_engine import transcribe_audio


USER_SPEAKER_ID = "user"
DEFAULT_MAX_USER_TURNS = 3


@dataclass(frozen=True)
class ConversationTurn:
    turn_id: str
    speaker: str
    text: str
    response_required: bool
    voice_profile: str | None = None


def _stable_turn_id(task_id: str, label: str, index: int) -> str:
    digest = hashlib.sha1(f"{task_id}:{label}:{index}".encode("utf-8")).hexdigest()
    return f"turn_{index + 1}_{digest[:8]}"


def _trimmed(value: Any) -> str:
    return str(value or "").strip()


def _normalize_voice_profile(value: Any, fallback: str) -> str:
    return ensure_voice_profile(_trimmed(value), fallback=fallback)


def _speaker_voice_map(conversation: dict[str, Any]) -> dict[str, str]:
    speakers = conversation.get("speakers") if isinstance(conversation.get("speakers"), dict) else {}
    assignments: dict[str, str] = {}
    fallback_cycle = ["yki_standard_female", "yki_standard_male"]
    next_index = 0
    for speaker_id, speaker in speakers.items():
        if speaker_id == USER_SPEAKER_ID:
            continue
        profile = ""
        if isinstance(speaker, dict):
            profile = _trimmed(speaker.get("voice_profile"))
        fallback_profile = fallback_cycle[next_index % len(fallback_cycle)]
        if not profile:
            profile = fallback_profile
            next_index += 1
        speaker_role = ""
        if isinstance(speaker, dict):
            speaker_role = speaker.get("role") or speaker.get("label") or speaker_id
        assignments[speaker_id] = ensure_voice_profile(profile, role=speaker_role, fallback=fallback_profile)
    return assignments


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _conversation_role(task: dict[str, Any], conversation: dict[str, Any]) -> str:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    explicit_role = (
        _trimmed(task.get("conversation_role"))
        or _trimmed(content.get("conversation_role"))
    )
    if explicit_role:
        return normalize_role_name(explicit_role)

    speakers = conversation.get("speakers") if isinstance(conversation.get("speakers"), dict) else {}
    for speaker_id, speaker in speakers.items():
        if speaker_id == USER_SPEAKER_ID or not isinstance(speaker, dict):
            continue
        candidate = _trimmed(speaker.get("role")) or _trimmed(speaker.get("label")) or speaker_id
        normalized = normalize_role_name(candidate)
        if normalized:
            return normalized
    return ""


def _max_turns(conversation: dict[str, Any]) -> int:
    turns = conversation.get("turns") if isinstance(conversation.get("turns"), list) else []
    max_user_turns = int(conversation.get("max_user_turns") or DEFAULT_MAX_USER_TURNS)
    return max(len(turns), max_user_turns * 2 + 1)


def build_conversation_payload(task: dict[str, Any]) -> dict[str, Any]:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    task_mode = _trimmed(task.get("mode")) or _trimmed(content.get("mode"))
    if task_mode != "conversation":
        raise ValueError("Conversation payload requested for a non-conversation speaking task")

    if isinstance(content.get("conversation"), dict):
        conversation = json.loads(json.dumps(content["conversation"]))
        speakers = conversation.get("speakers") if isinstance(conversation.get("speakers"), dict) else {}
        turns_payload = conversation.get("turns") if isinstance(conversation.get("turns"), list) else []
        if not speakers or not turns_payload:
            raise ValueError("Conversation task is missing speakers or turns")

        normalized_turns: list[dict[str, Any]] = []
        speaker_voice_map = _speaker_voice_map({"speakers": speakers})
        for index, raw_turn in enumerate(turns_payload):
            if not isinstance(raw_turn, dict):
                raise ValueError("Conversation turns must be objects")
            speaker_id = _trimmed(raw_turn.get("speaker"))
            if not speaker_id or speaker_id not in speakers:
                raise ValueError("Conversation turn contains an unknown speaker")
            text = _trimmed(raw_turn.get("text"))
            response_required = bool(raw_turn.get("response_required"))
            if speaker_id == USER_SPEAKER_ID:
                response_required = True
            elif not text:
                raise ValueError("AI conversation turns must contain text")

            normalized_turns.append(
                {
                    "turn_id": _trimmed(raw_turn.get("turn_id")) or _stable_turn_id(str(task.get("id") or "task"), speaker_id, index),
                    "speaker": speaker_id,
                    "text": text,
                    "response_required": response_required,
                    "voice_profile": None if speaker_id == USER_SPEAKER_ID else _normalize_voice_profile(
                        raw_turn.get("voice_profile"),
                        speaker_voice_map.get(speaker_id, "yki_standard_female"),
                    ),
                }
            )

        conversation["speakers"] = speakers
        conversation["turns"] = normalized_turns
        conversation.setdefault("max_user_turns", sum(1 for turn in normalized_turns if turn["speaker"] == USER_SPEAKER_ID))
        conversation.setdefault("generation_mode", "scripted")
        conversation["conversation_role"] = _conversation_role(task, conversation)
        return conversation

    materials = content.get("materials") if isinstance(content.get("materials"), dict) else {}
    roles = materials.get("roles") if isinstance(materials.get("roles"), dict) else {}
    items = content.get("items") if isinstance(content.get("items"), list) else []
    opening_line = _trimmed((items[0] or {}).get("ai_first_turn_fi")) if items else ""
    if not opening_line:
        raise ValueError("Legacy conversation task is missing ai_first_turn_fi")

    partner_label = _trimmed(roles.get("partner")) or "Keskustelukumppani"
    user_label = _trimmed(roles.get("user")) or "Sinä"
    partner_role = _trimmed(content.get("conversation_role")) or partner_label
    partner_voice_profile = ensure_voice_profile("", role=partner_role)
    speakers = {
        USER_SPEAKER_ID: {
            "speaker_id": USER_SPEAKER_ID,
            "label": user_label,
            "role": user_label,
            "kind": "user",
        },
        "partner": {
            "speaker_id": "partner",
            "label": partner_label,
            "role": partner_label,
            "kind": "ai",
            "voice_profile": partner_voice_profile,
        },
    }
    return {
        "speakers": speakers,
        "turns": [
            {
                "turn_id": _stable_turn_id(str(task.get("id") or "task"), "partner", 0),
                "speaker": "partner",
                "text": opening_line,
                "response_required": False,
                "voice_profile": partner_voice_profile,
            },
        ],
        "max_user_turns": int(content.get("max_user_turns") or DEFAULT_MAX_USER_TURNS),
        "generation_mode": "generated_followup",
        "conversation_role": normalize_role_name(partner_role),
    }


def _conversation_state(session: dict[str, Any], task_id: str, task: dict[str, Any] | None = None) -> dict[str, Any]:
    speaking_runtime = session.setdefault("speaking_runtime", {})
    state = speaking_runtime.setdefault(
        task_id,
        {
            "conversation_active": False,
            "current_turn": None,
            "transcript": [],
            "responses": {},
            "awaiting_turn_id": None,
            "completed": False,
            "started": False,
            "last_generated_turn_index": -1,
            "state": STATE_IDLE,
            "state_history": [],
            "conversation_session": {},
        },
    )
    ensure_state_machine(state)
    conversation = {}
    if isinstance(task, dict):
        content = task.get("content") if isinstance(task.get("content"), dict) else {}
        conversation = content.get("conversation") if isinstance(content.get("conversation"), dict) else {}
    conversation_session = state.get("conversation_session")
    if not isinstance(conversation_session, dict):
        conversation_session = {}
        state["conversation_session"] = conversation_session
    conversation_session.setdefault("session_id", str(uuid.uuid4()))
    conversation_session.setdefault("exam_id", str(session.get("session_id") or ""))
    conversation_session.setdefault("task_id", task_id)
    conversation_session.setdefault("turn_number", len(state.get("transcript") or []))
    conversation_session.setdefault("max_turns", _max_turns(conversation) if conversation else DEFAULT_MAX_USER_TURNS * 2 + 1)
    conversation_session.setdefault("turns", [])
    conversation_session.setdefault("conversation_role", _conversation_role(task or {}, conversation) if conversation else "")
    conversation_session.setdefault("started_at", _timestamp())
    conversation_session["updated_at"] = _timestamp()
    return state


def _resolve_turn_audio(turn: dict[str, Any]) -> dict[str, Any] | None:
    if turn.get("speaker") == USER_SPEAKER_ID:
        return None
    text = _trimmed(turn.get("text"))
    if not text:
        return None
    voice_profile = _trimmed(turn.get("voice_profile")) or "yki_standard_female"
    voice_hint = voice_hint_for_profile(voice_profile)
    try:
        audio = resolve_audio(
            transcript=text,
            audio_asset_id=f"{turn['turn_id']}-audio",
            voice=voice_hint,
            voice_profile=voice_profile,
            speed=1.0,
        )
        log_event(
            "TTS_GENERATED",
            turn_id=turn.get("turn_id"),
            speaker=turn.get("speaker"),
            voice_profile=voice_profile,
            audio_asset_id=f"{turn['turn_id']}-audio",
        )
        return audio
    except MediaIntegrityError as exc:
        log_event(
            "conversation_audio_unavailable",
            turn_id=turn.get("turn_id"),
            speaker=turn.get("speaker"),
            error=str(exc),
        )
        return None


def _normalize_public_turn(turn: dict[str, Any], *, audio: dict[str, Any] | None = None, recorded_audio_path: str | None = None, transcript_text: str | None = None) -> dict[str, Any]:
    payload = {
        "turn_id": turn["turn_id"],
        "speaker": turn["speaker"],
        "text": _trimmed(turn.get("text")),
        "response_required": bool(turn.get("response_required")),
        "voice_profile": turn.get("voice_profile"),
    }
    if audio:
        payload["audio"] = audio
    if recorded_audio_path:
        payload["audio_file_path"] = recorded_audio_path
    if transcript_text:
        payload["transcript_text"] = transcript_text
    return payload


def _record_conversation_session_turn(state: dict[str, Any], turn_payload: dict[str, Any]) -> None:
    conversation_session = state.get("conversation_session")
    if not isinstance(conversation_session, dict):
        return
    turns = conversation_session.get("turns")
    if not isinstance(turns, list):
        turns = []
        conversation_session["turns"] = turns
    turns.append(
        {
            "speaker": "user" if turn_payload.get("speaker") == USER_SPEAKER_ID else "ai",
            "speaker_id": turn_payload.get("speaker"),
            "text": turn_payload.get("text"),
            "audio_url": (turn_payload.get("audio") or {}).get("url") if isinstance(turn_payload.get("audio"), dict) else None,
            "audio_file_path": turn_payload.get("audio_file_path"),
            "timestamp": _timestamp(),
        }
    )
    conversation_session["turn_number"] = len(turns)
    conversation_session["updated_at"] = _timestamp()


def _public_state(task_id: str, task: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    conversation = task["content"]["conversation"]
    return {
        "task_id": task_id,
        "mode": "conversation",
        "speaking_mode": "conversation",
        "conversation_active": bool(state.get("conversation_active")),
        "current_turn": state.get("current_turn"),
        "awaiting_turn_id": state.get("awaiting_turn_id"),
        "completed": bool(state.get("completed")),
        "state": state.get("state"),
        "state_history": state.get("state_history", []),
        "transcript": state.get("transcript", []),
        "responses": state.get("responses", {}),
        "conversation_session": state.get("conversation_session", {}),
        "speakers": conversation.get("speakers", {}),
        "max_user_turns": int(conversation.get("max_user_turns") or DEFAULT_MAX_USER_TURNS),
        "conversation_role": conversation.get("conversation_role") or _conversation_role(task, conversation),
    }


def _append_ai_turn(state: dict[str, Any], turn: dict[str, Any]) -> dict[str, Any]:
    transition_state(state, STATE_PROMPT_PLAYING)
    audio = _resolve_turn_audio(turn)
    public_turn = _normalize_public_turn(turn, audio=audio)
    state["transcript"].append(public_turn)
    _record_conversation_session_turn(state, public_turn)
    state["current_turn"] = turn["turn_id"]
    state["conversation_active"] = True
    state["started"] = True
    state["awaiting_turn_id"] = None
    return state["transcript"][-1]


def _next_scripted_turn(task: dict[str, Any], state: dict[str, Any]) -> dict[str, Any] | None:
    conversation = task["content"]["conversation"]
    turns = conversation.get("turns") if isinstance(conversation.get("turns"), list) else []
    current_turn_id = state.get("current_turn")
    if not turns:
        return None
    if not current_turn_id:
        return dict(turns[0])
    for index, turn in enumerate(turns):
        if turn.get("turn_id") == current_turn_id:
            if index + 1 < len(turns):
                return dict(turns[index + 1])
            return None
    return None


def _ai_generation_templates(level_band: str) -> list[str]:
    if level_band == "C1_C2":
        return [
            "Hyvä huomio. Ymmärrän tilanteesi. Voisitko tarkentaa, mikä on sinulle tärkein tavoite tässä asiassa?",
            "Kiitos selkeästä vastauksesta. Ehdotan, että sovimme ensin pääkohdista ja sitten etenemme vaiheittain. Mitä mieltä olet tästä?",
            "Kuulostaa perustellulta. Voimme rakentaa ratkaisun yhdessä askel kerrallaan. Mikä vaihtoehto olisi sinulle realistisin juuri nyt?",
        ]
    if level_band == "B1_B2":
        return [
            "Kiitos vastauksesta. Ymmärrän tilanteen. Voimmeko sopia seuraavan askeleen yhdessä?",
            "Hyvä, nyt asia on selkeämpi. Mitä haluaisit tehdä ensin tässä tilanteessa?",
            "Selvä. Voimme jatkaa näin. Mikä vaihtoehto tuntuu sinusta parhaimmalta?",
        ]
    return [
        "Kiitos, ymmärrän. Voimmeko sopia tästä yhdessä?",
        "Hyvä, kiitos vastauksesta. Mitä haluat tehdä seuraavaksi?",
        "Selvä, kuulostaa hyvältä. Sopiiko tämä suunnitelma sinulle?",
    ]


def _deterministic_reply(task: dict[str, Any], transcript: list[dict[str, Any]]) -> str:
    level_band = _trimmed(task.get("level_band")) or "B1_B2"
    history_text = "|".join(entry.get("text", "") for entry in transcript)
    templates = _ai_generation_templates(level_band)
    digest = hashlib.sha256(f"{task.get('id')}|{history_text}|{len(transcript)}".encode("utf-8")).hexdigest()
    template_index = int(digest[:8], 16) % len(templates)
    if len([entry for entry in transcript if entry.get("speaker") == USER_SPEAKER_ID]) >= int(task["content"]["conversation"].get("max_user_turns") or DEFAULT_MAX_USER_TURNS):
        return "Kiitos vastauksesta. Tämä keskustelu päättyy tähän."
    return templates[template_index]


def _build_generated_turn(task: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    conversation = task["content"]["conversation"]
    transcript = state.get("transcript", [])
    generated_index = int(state.get("last_generated_turn_index") or 0) + 1
    state["last_generated_turn_index"] = generated_index
    return {
        "turn_id": _stable_turn_id(str(task.get("id") or "task"), "partner_generated", generated_index),
        "speaker": "partner",
        "text": _deterministic_reply(task, transcript),
        "response_required": False,
        "voice_profile": _trimmed(
            conversation.get("speakers", {}).get("partner", {}).get("voice_profile")
            if isinstance(conversation.get("speakers", {}).get("partner"), dict)
            else ""
        ) or ensure_voice_profile("", role=conversation.get("conversation_role")),
    }


def start_conversation(session: dict[str, Any], task: dict[str, Any]) -> dict[str, Any]:
    task_id = str(task.get("id") or "").strip()
    if not task_id:
        raise ValueError("Conversation task missing id")

    state = _conversation_state(session, task_id, task)
    if state.get("started"):
        return _public_state(task_id, task, state)

    first_turn = _next_scripted_turn(task, state)
    if first_turn is None:
        raise ValueError("Conversation task has no initial turn")

    if first_turn.get("speaker") == USER_SPEAKER_ID:
        transition_state(state, STATE_WAITING_FOR_RECORDING)
        state["awaiting_turn_id"] = first_turn["turn_id"]
        state["current_turn"] = first_turn["turn_id"]
        state["conversation_active"] = True
        state["started"] = True
    else:
        _append_ai_turn(state, first_turn)
        scripted_next = _next_scripted_turn(task, state)
        if scripted_next and scripted_next.get("speaker") == USER_SPEAKER_ID:
            state["awaiting_turn_id"] = scripted_next["turn_id"]
            state["current_turn"] = scripted_next["turn_id"]
            transition_state(state, STATE_WAITING_FOR_RECORDING)
        elif task["content"]["conversation"].get("generation_mode") == "generated_followup":
            awaiting_id = _stable_turn_id(task_id, USER_SPEAKER_ID, 0)
            state["awaiting_turn_id"] = awaiting_id
            state["current_turn"] = awaiting_id
            transition_state(state, STATE_WAITING_FOR_RECORDING)

    log_event(
        "CONVERSATION_START",
        session_id=session.get("session_id"),
        task_id=task_id,
        current_turn=state.get("current_turn"),
        conversation_session_id=state.get("conversation_session", {}).get("session_id"),
    )
    return _public_state(task_id, task, state)


def submit_turn_response(
    session: dict[str, Any],
    task: dict[str, Any],
    *,
    turn_id: str,
    audio_file_path: str,
    transcript_text: str | None = None,
) -> dict[str, Any]:
    task_id = str(task.get("id") or "").strip()
    if not task_id:
        raise ValueError("Conversation task missing id")
    state = _conversation_state(session, task_id, task)
    if not state.get("started"):
        raise ValueError("Conversation has not been started")
    if state.get("completed"):
        return _public_state(task_id, task, state)
    if state.get("state") not in {STATE_WAITING_FOR_RECORDING, STATE_RECORDING}:
        raise RuntimeError(f"Conversation is in {state.get('state')} and cannot accept a recording")
    expected_turn_id = _trimmed(state.get("awaiting_turn_id"))
    if not expected_turn_id or expected_turn_id != _trimmed(turn_id):
        raise ValueError("Conversation is not waiting for this turn")
    if not _trimmed(audio_file_path):
        raise ValueError("Audio file path is required")

    transition_state(state, STATE_RECORDING)
    transition_state(state, STATE_UPLOADING)
    transcript_payload = transcript_text
    if not transcript_payload:
        try:
            transcript_payload = _trimmed(transcribe_audio(audio_file_path).get("transcript"))
        except Exception:
            transcript_payload = ""

    response_entry = {
        "audio_file_path": audio_file_path,
        "transcript_text": transcript_payload,
        "submitted": True,
    }
    state["responses"][expected_turn_id] = response_entry
    user_turn = {
        "turn_id": expected_turn_id,
        "speaker": USER_SPEAKER_ID,
        "text": transcript_payload,
        "response_required": True,
        "voice_profile": None,
    }
    public_turn = _normalize_public_turn(
        user_turn,
        recorded_audio_path=audio_file_path,
        transcript_text=transcript_payload,
    )
    state["transcript"].append(public_turn)
    _record_conversation_session_turn(state, public_turn)
    state["current_turn"] = expected_turn_id
    state["awaiting_turn_id"] = None
    transition_state(state, STATE_AI_RESPONDING)

    log_event(
        "CONVERSATION_TURN",
        session_id=session.get("session_id"),
        task_id=task_id,
        turn_id=expected_turn_id,
        audio_file_path=audio_file_path,
        state=state.get("state"),
    )
    return _public_state(task_id, task, state)


def generate_ai_reply(session: dict[str, Any], task: dict[str, Any]) -> dict[str, Any]:
    task_id = str(task.get("id") or "").strip()
    if not task_id:
        raise ValueError("Conversation task missing id")
    state = _conversation_state(session, task_id, task)
    if not state.get("started"):
        raise ValueError("Conversation has not been started")
    if state.get("completed"):
        return _public_state(task_id, task, state)
    if state.get("awaiting_turn_id"):
        raise ValueError("Conversation is waiting for a user recording")
    if state.get("state") not in {STATE_AI_RESPONDING, STATE_PROMPT_PLAYING}:
        transition_state(state, STATE_AI_RESPONDING)

    conversation = task["content"]["conversation"]
    next_turn = _next_scripted_turn(task, state)
    if next_turn is None and conversation.get("generation_mode") == "generated_followup":
        next_turn = _build_generated_turn(task, state)

    if next_turn is None:
        state["completed"] = True
        state["conversation_active"] = False
        transition_state(state, STATE_CONVERSATION_COMPLETE)
        log_event(
            "CONVERSATION_COMPLETE",
            session_id=session.get("session_id"),
            task_id=task_id,
        )
        return _public_state(task_id, task, state)

    if next_turn.get("speaker") == USER_SPEAKER_ID:
        state["awaiting_turn_id"] = next_turn["turn_id"]
        state["current_turn"] = next_turn["turn_id"]
        state["conversation_active"] = True
        transition_state(state, STATE_WAITING_FOR_RECORDING)
    else:
        _append_ai_turn(state, next_turn)
        following_turn = _next_scripted_turn(task, state)
        if following_turn and following_turn.get("speaker") == USER_SPEAKER_ID:
            state["awaiting_turn_id"] = following_turn["turn_id"]
            state["current_turn"] = following_turn["turn_id"]
            transition_state(state, STATE_WAITING_FOR_RECORDING)
        elif conversation.get("generation_mode") == "generated_followup":
            generated_count = len([entry for entry in state["transcript"] if entry.get("speaker") == USER_SPEAKER_ID])
            if generated_count >= int(conversation.get("max_user_turns") or DEFAULT_MAX_USER_TURNS):
                state["completed"] = True
                state["conversation_active"] = False
                transition_state(state, STATE_CONVERSATION_COMPLETE)
            else:
                awaiting_id = _stable_turn_id(task_id, USER_SPEAKER_ID, generated_count)
                state["awaiting_turn_id"] = awaiting_id
                state["current_turn"] = awaiting_id
                transition_state(state, STATE_WAITING_FOR_RECORDING)

    if state.get("completed"):
        log_event(
            "CONVERSATION_COMPLETE",
            session_id=session.get("session_id"),
            task_id=task_id,
        )
    else:
        log_event(
            "CONVERSATION_TURN",
            session_id=session.get("session_id"),
            task_id=task_id,
            turn_id=state.get("current_turn"),
            state=state.get("state"),
        )
    return _public_state(task_id, task, state)


def conversation_answered(session: dict[str, Any], task_id: str) -> bool:
    state = session.get("speaking_runtime", {}).get(task_id) if isinstance(session.get("speaking_runtime"), dict) else None
    if not isinstance(state, dict):
        return False
    return bool(state.get("completed")) or bool(state.get("responses"))


def conversation_reference_text(task: dict[str, Any]) -> str:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    conversation = content.get("conversation") if isinstance(content.get("conversation"), dict) else {}
    turns = conversation.get("turns") if isinstance(conversation.get("turns"), list) else []
    if turns:
        return "\n".join(
            f"{_trimmed(turn.get('speaker'))}: {_trimmed(turn.get('text'))}"
            for turn in turns
            if isinstance(turn, dict) and (_trimmed(turn.get("text")) or bool(turn.get("response_required")))
        )
    items = content.get("items") if isinstance(content.get("items"), list) else []
    return "\n".join(
        _trimmed(item.get("ai_first_turn_fi"))
        for item in items
        if isinstance(item, dict) and _trimmed(item.get("ai_first_turn_fi"))
    )
