"""
==========================================================
YKI EXAM SESSION ENGINE — V3.2
==========================================================

Manages runtime exam sessions.
"""

from __future__ import annotations

import copy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from engine.evaluation.writing_evaluator import evaluate_writing
from engine.exam.exam_certificate_engine_v3_2 import generate_certificate
from engine.exam.exam_feedback_engine_v3_2 import generate_feedback
from engine.exam.exam_scoring_engine_v3_2 import (
    build_answer_id,
    count_answered_questions,
    count_total_questions,
    estimate_cefr,
    extract_task_questions,
    get_objective_answer_map,
    score_exam,
)
from engine.exam.conversation_runtime import conversation_reference_text
from engine.exam.speaking_controller import (
    build_speaking_screen,
    normalize_speaking_task,
    speaking_answered,
)
from engine.exam.tts_voice_manager import voice_hint_for_profile
from engine.exam.exam_timing_engine import (
    assert_section_available,
    build_timing_manifest,
    duration_profile_for_mode,
    section_for_answer_id,
    section_for_task_id,
)
from engine.services.audio_resolver import MediaIntegrityError, resolve_audio
from engine.runtime.logging_v3_3 import log_event
from engine.runtime.session_tokens import issue_engine_session_token
from engine.runtime.session_manager_v3_3 import (
    SessionExpiredError,
    SessionNotFoundError,
    create_session,
    get_session,
    locked_session,
)
from engine.schema.runtime_contract_v1 import ExamRuntimeContract, RuntimeAudioObject, RuntimeScreen
from engine.speech.pronunciation_analyzer import analyze_pronunciation
from engine.speech.stt_engine import transcribe_audio

try:
    from engine.event_store.store import append_event
    from engine.events.exam_events import (
        ANSWER_SUBMITTED,
        AUDIO_UPLOADED,
        EXAM_SUBMITTED,
        RESULTS_GENERATED,
        WRITING_SUBMITTED,
        ExamEvent,
    )
    from engine.event_store.snapshots import write_snapshot, should_snapshot
    from engine.session_rebuilder.rebuild_session import rebuild_session
    try:
        from engine.metrics import increment_metric
    except ImportError:
        def increment_metric(name: str, delta: int = 1) -> None: ...
    _EVENTS_AVAILABLE = True
except ImportError:
    _EVENTS_AVAILABLE = False
    def increment_metric(name: str, delta: int = 1) -> None: ...


def _maybe_snapshot(session_id: str) -> None:
    if not _EVENTS_AVAILABLE:
        return
    try:
        from engine.event_store.store import load_events
        events = load_events(session_id)
        if not events or not should_snapshot(len(events)):
            return
        state = rebuild_session(session_id, fallback_session={})
        write_snapshot(session_id, state, events[-1].event_id, len(events))
    except Exception:
        pass


def _strip_answer_keys(question: dict[str, Any]) -> None:
    for key in (
        "correct_index",
        "correctIndex",
        "correctBoolean",
        "correct_answer",
        "correctAnswer",
    ):
        question.pop(key, None)


def _question_payload(task: dict[str, Any]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    for question_index, raw_question in enumerate(extract_task_questions(task)):
        question = copy.deepcopy(raw_question)
        question["answer_id"] = build_answer_id(task["id"], question_index)
        _strip_answer_keys(question)
        payload.append(question)
    return payload


def _resolve_audio_object(
    *,
    audio_asset_id: str,
    text: str,
    voice: str,
) -> dict[str, Any]:
    try:
        return resolve_audio(
            transcript=text,
            audio_asset_id=audio_asset_id,
            voice=voice,
            speed=1.0,
        )
    except MediaIntegrityError as exc:
        log_event(
            "runtime_audio_unavailable",
            audio_asset_id=audio_asset_id,
            voice=voice,
            error=str(exc),
        )
        raise


def _speaking_duration_seconds(timing_minutes: int) -> int:
    if timing_minutes <= 0:
        return 30
    return max(30, timing_minutes * 60)


def _build_speaking_instruction(
    *,
    roles: dict[str, Any],
    partner_line: str,
    timing_minutes: int,
    fallback_instruction: str,
) -> str:
    user_role = str(roles.get("user", "")).strip()
    partner_role = str(roles.get("partner", "")).strip()
    duration_seconds = _speaking_duration_seconds(timing_minutes)
    parts = []
    if user_role or partner_role:
        if user_role and partner_role:
            parts.append(
                f"Tilanne:\nOlet {user_role} ja keskustelukumppani on {partner_role}."
            )
        elif user_role:
            parts.append(f"Tilanne:\nOlet {user_role}.")
    if partner_line:
        parts.append(f'Keskustelukumppani sanoo:\n"{partner_line}"')
    parts.append(
        "Tehtävä:\nVastaa suomeksi, reagoi tilanteeseen luontevasti ja jatka keskustelua."
    )
    parts.append(f"Puhu noin {duration_seconds} sekuntia.")
    if fallback_instruction.strip() and fallback_instruction.strip() not in parts[0:]:
        parts.insert(0, fallback_instruction.strip())
    return "\n\n".join(part for part in parts if part)


def _reading_screens(task: dict[str, Any]) -> list[dict[str, Any]]:
    content = copy.deepcopy(task.get("content") or {})
    materials = content.get("materials") or {}
    timing_minutes = int((content.get("timing") or {}).get("recommended_minutes", 0))
    instruction = str(content.get("instruction", ""))
    return [
        {
            "id": f"{task['id']}:prompt",
            "task_id": task["id"],
            "skill": "reading",
            "screen_type": "reading_prompt",
            "title": "Reading Passage",
            "instruction": instruction,
            "timing_minutes": timing_minutes,
            "materials": {
                "text": materials.get("text", ""),
                "word_count": materials.get("word_count"),
            },
            "questions": [],
            "response_items": [],
            "audio": None,
            "audio_url": None,
        },
        {
            "id": f"{task['id']}:questions",
            "task_id": task["id"],
            "skill": "reading",
            "screen_type": "reading_questions",
            "title": "Reading Questions",
            "instruction": instruction,
            "timing_minutes": timing_minutes,
            "materials": None,
            "questions": _question_payload(task),
            "response_items": [],
            "audio": None,
            "audio_url": None,
        },
    ]


def _listening_screens(task: dict[str, Any]) -> list[dict[str, Any]]:
    content = copy.deepcopy(task.get("content") or {})
    materials = content.get("materials") or {}
    timing_minutes = int((content.get("timing") or {}).get("recommended_minutes", 0))
    instruction = str(content.get("instruction", ""))
    transcript = str(materials.get("transcript", ""))
    audio_asset_id = str(materials.get("audio_asset_id", "")).strip() or f"{task['id']}-listening-audio"
    audio = _resolve_audio_object(
        audio_asset_id=audio_asset_id,
        text=transcript,
        voice="female",
    )
    return [
        {
            "id": f"{task['id']}:prompt",
            "task_id": task["id"],
            "skill": "listening",
            "screen_type": "listening_prompt",
            "title": "Listening Prompt",
            "instruction": instruction,
            "timing_minutes": timing_minutes,
            "materials": None,
            "questions": [],
            "response_items": [],
            "audio": audio,
            "audio_url": audio["url"],
        },
        {
            "id": f"{task['id']}:questions",
            "task_id": task["id"],
            "skill": "listening",
            "screen_type": "listening_questions",
            "title": "Listening Questions",
            "instruction": instruction,
            "timing_minutes": timing_minutes,
            "materials": None,
            "questions": _question_payload(task),
            "response_items": [],
            "audio": None,
            "audio_url": None,
        },
    ]


def _writing_screens(task: dict[str, Any]) -> list[dict[str, Any]]:
    content = copy.deepcopy(task.get("content") or {})
    materials = content.get("materials") or {}
    timing_minutes = int((content.get("timing") or {}).get("recommended_minutes", 0))
    instruction = str(content.get("instruction", ""))
    items = content.get("items") or []
    return [
        {
            "id": f"{task['id']}:prompt",
            "task_id": task["id"],
            "skill": "writing",
            "screen_type": "writing_prompt",
            "title": "Writing Prompt",
            "instruction": instruction,
            "timing_minutes": timing_minutes,
            "materials": {
                "scenario": materials.get("scenario", ""),
            },
            "questions": [],
            "response_items": [],
            "audio": None,
            "audio_url": None,
        },
        {
            "id": f"{task['id']}:response",
            "task_id": task["id"],
            "skill": "writing",
            "screen_type": "writing_response",
            "title": "Writing Response",
            "instruction": instruction,
            "timing_minutes": timing_minutes,
            "materials": None,
            "questions": [],
            "response_items": copy.deepcopy(items),
            "audio": None,
            "audio_url": None,
        },
    ]


def _speaking_screens(task: dict[str, Any]) -> list[dict[str, Any]]:
    normalized = normalize_speaking_task(task)
    return [build_speaking_screen(normalized)]


def _validate_runtime_screens(screens: list[dict[str, Any]]) -> None:
    for screen in screens:
        screen_type = str(screen.get("screen_type", ""))
        audio = screen.get("audio") if isinstance(screen.get("audio"), dict) else None
        if screen_type == "listening_prompt":
            if not audio or not str(audio.get("url") or "").strip() or float(audio.get("duration_seconds") or 0.0) <= 0:
                raise MediaIntegrityError(f"Listening prompt {screen.get('id')} is missing audio")
        if screen_type == "speaking_prompt":
            if not audio or not str(audio.get("url") or "").strip() or float(audio.get("duration_seconds") or 0.0) <= 0:
                raise MediaIntegrityError(f"Speaking prompt {screen.get('id')} is missing audio")
            if not str(screen.get("instruction") or "").strip():
                raise RuntimeError(f"Speaking prompt {screen.get('id')} is missing instructions")
        if screen_type == "speaking_task":
            if not str(screen.get("instruction") or "").strip():
                raise RuntimeError(f"Speaking task {screen.get('id')} is missing instructions")
            mode = str(screen.get("mode") or "").strip()
            speaking_mode = str(screen.get("speaking_mode") or "").strip()
            if mode not in {"recording_response", "conversation"}:
                raise RuntimeError(f"Speaking task {screen.get('id')} is missing a valid mode")
            if speaking_mode not in {"recording", "conversation"}:
                raise RuntimeError(f"Speaking task {screen.get('id')} is missing a valid speaking_mode")
            if mode == "recording_response" and audio:
                RuntimeAudioObject.model_validate(audio)
            if mode == "conversation" and not isinstance(screen.get("conversation"), dict):
                raise RuntimeError(f"Conversation task {screen.get('id')} is missing conversation payload")
        if screen_type == "writing_prompt" and not str(screen.get("instruction") or "").strip():
            raise RuntimeError(f"Writing prompt {screen.get('id')} is missing instructions")


def _sections_for_exam(exam: dict[str, Any]) -> list[dict[str, Any]]:
    sections = [
        {
            "id": "reading",
            "skill": "reading",
            "duration_minutes": SECTION_DURATIONS_MINUTES["reading"],
            "screens": [
                screen
                for task in exam.get("reading", [])
                for screen in _reading_screens(task)
            ],
        },
        {
            "id": "listening",
            "skill": "listening",
            "duration_minutes": SECTION_DURATIONS_MINUTES["listening"],
            "screens": [
                screen
                for task in exam.get("listening", [])
                for screen in _listening_screens(task)
            ],
        },
        {
            "id": "writing",
            "skill": "writing",
            "duration_minutes": SECTION_DURATIONS_MINUTES["writing"],
            "screens": [
                screen
                for task in exam.get("writing", [])
                for screen in _writing_screens(task)
            ],
        },
        {
            "id": "speaking",
            "skill": "speaking",
            "duration_minutes": SECTION_DURATIONS_MINUTES["speaking"],
            "screens": [
                screen
                for task in exam.get("speaking", [])
                for screen in _speaking_screens(task)
            ],
        },
    ]
    _validate_runtime_screens(
        [screen for section in sections for screen in section["screens"]]
    )
    return sections


def _section_questions(task: dict[str, Any]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    for question_index, raw_question in enumerate(extract_task_questions(task)):
        question = copy.deepcopy(raw_question)
        answer_id = build_answer_id(task["id"], question_index)
        options = copy.deepcopy(question.get("options") or [])
        payload.append(
            {
                "id": answer_id,
                "answer_id": answer_id,
                "index": question_index,
                "question": str(question.get("prompt") or question.get("question") or ""),
                "options": options,
            }
        )
    return payload


def _build_reading_section(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    for task_index, task in enumerate(tasks):
        content = copy.deepcopy(task.get("content") or {})
        materials = content.get("materials") or {}
        item_id = str(task.get("id") or f"reading-{task_index}")
        items.append(
            {
                "item_id": item_id,
                "index": task_index,
                "prompt": {
                    "title": content.get("title"),
                    "text": content.get("text") or materials.get("text"),
                },
                "questions": _section_questions(task),
            }
        )
    return {
        "section_type": "reading",
        "index": 0,
        "items": items,
    }


def _build_listening_section(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    for task_index, task in enumerate(tasks):
        content = copy.deepcopy(task.get("content") or {})
        materials = content.get("materials") or {}
        audio_asset_id = materials.get("audio_asset_id")
        if not audio_asset_id:
            audio_asset_id = f"{task['id']}-listening-audio"
        item_id = str(task.get("id") or f"listening-{task_index}")
        items.append(
            {
                "item_id": item_id,
                "index": task_index,
                "prompt": {
                    "audio_url": f"/api/audio/{audio_asset_id}.mp3",
                    "instructions": content.get("instructions") or content.get("instruction"),
                },
                "questions": _section_questions(task),
            }
        )
    return {
        "section_type": "listening",
        "index": 1,
        "items": items,
    }


def _build_writing_section(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    items = []
    for task_index, task in enumerate(tasks):
        content = copy.deepcopy(task.get("content") or {})
        item_id = str(task.get("id") or f"writing-{task_index}")
        items.append(
            {
                "item_id": item_id,
                "index": task_index,
                "prompt": {
                    "instructions": content.get("instructions") or content.get("instruction"),
                }
            }
        )
    return {
        "section_type": "writing",
        "index": 2,
        "items": items,
    }


def speaking_duration_limits(
    task: dict[str, Any],
    duration_profile_seconds: dict[str, Any] | None = None,
) -> dict[str, int]:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    timing = content.get("timing") if isinstance(content.get("timing"), dict) else {}
    target_duration = int(
        content.get("target_duration_seconds")
        or _speaking_duration_seconds(int(timing.get("recommended_minutes") or 0))
        or 60
    )
    min_duration = int(content.get("min_duration_seconds") or max(15, target_duration // 2 or target_duration))
    max_duration = int(content.get("max_duration_seconds") or max(target_duration, min_duration))

    if isinstance(duration_profile_seconds, dict) and duration_profile_seconds.get("speaking") is not None:
        speaking_window_seconds = max(1, int(duration_profile_seconds["speaking"]))
        target_duration = min(target_duration, speaking_window_seconds)
        max_duration = min(max_duration, speaking_window_seconds)
        min_duration_cap = max(1, target_duration // 2 or target_duration)
        if speaking_window_seconds <= 40:
            min_duration_cap = max(1, min(10, min_duration_cap))
        min_duration = min(
            min_duration,
            max_duration,
            min_duration_cap,
        )
    return {
        "min_duration_sec": min_duration,
        "max_duration_sec": max_duration,
    }


def _speaking_context(content: dict[str, Any]) -> str | None:
    explicit = str(content.get("context") or "").strip()
    if explicit:
        return explicit

    materials = content.get("materials") if isinstance(content.get("materials"), dict) else {}
    roles = materials.get("roles") if isinstance(materials.get("roles"), dict) else {}
    user_role = str(roles.get("user") or "").strip()
    partner_role = str(roles.get("partner") or "").strip()
    if user_role and partner_role:
        return f"Olet {user_role} ja keskustelukumppani on {partner_role}."
    if user_role:
        return f"Olet {user_role}."
    if partner_role:
        return f"Keskustelukumppani on {partner_role}."
    return None


def _resolve_public_conversation_turn_audio(turn: dict[str, Any]) -> str | None:
    if str(turn.get("speaker") or "").strip() == "user":
        return None
    text = str(turn.get("text") or "").strip()
    if not text:
        return None
    voice_profile = str(turn.get("voice_profile") or "").strip() or "yki_standard_female"
    try:
        audio = resolve_audio(
            transcript=text,
            audio_asset_id=f"{turn['turn_id']}-audio",
            voice=voice_hint_for_profile(voice_profile),
            voice_profile=voice_profile,
            speed=1.0,
        )
    except MediaIntegrityError as exc:
        log_event(
            "conversation_audio_unavailable",
            turn_id=turn.get("turn_id"),
            speaker=turn.get("speaker"),
            error=str(exc),
        )
        return None
    return str(audio.get("url") or "").strip() or None


def _public_conversation_turns(content: dict[str, Any]) -> list[dict[str, Any]]:
    conversation = content.get("conversation") if isinstance(content.get("conversation"), dict) else {}
    turns = conversation.get("turns") if isinstance(conversation.get("turns"), list) else []
    payload: list[dict[str, Any]] = []
    for index, raw_turn in enumerate(turns):
        if not isinstance(raw_turn, dict):
            continue
        turn = copy.deepcopy(raw_turn)
        turn["turn_id"] = str(turn.get("turn_id") or f"turn-{index}").strip()
        payload.append(
            {
                "turn_id": turn["turn_id"],
                "speaker": str(turn.get("speaker") or "").strip(),
                "text": str(turn.get("text") or "").strip() or None,
                "audio_url": _resolve_public_conversation_turn_audio(turn),
                "response_required": bool(turn.get("response_required")),
            }
        )
    return payload


def _build_speaking_section(
    tasks: list[dict[str, Any]],
    *,
    duration_profile_seconds: dict[str, Any] | None = None,
) -> dict[str, Any]:
    items = []
    for task_index, task in enumerate(tasks):
        normalized = normalize_speaking_task(task)
        content = copy.deepcopy(normalized.get("content") or {})
        screen = build_speaking_screen(normalized)
        item_id = str(task.get("id") or f"speaking-{task_index}")
        items.append(
            {
                "item_id": item_id,
                "index": task_index,
                "speaking_mode": str(normalized.get("speaking_mode") or "recording"),
                "prompt": {
                    "audio_url": screen.get("prompt_audio_url"),
                    "instruction": content.get("instruction"),
                    "instructions": content.get("instructions") or content.get("instruction"),
                    "context": _speaking_context(content),
                },
                "recording": speaking_duration_limits(
                    normalized,
                    duration_profile_seconds=duration_profile_seconds,
                ),
                "conversation": _public_conversation_turns(content),
            }
        )
    return {
        "section_type": "speaking",
        "index": 3,
        "items": items,
    }


def _serialize_runtime_responses(metadata: dict[str, Any] | None) -> dict[str, Any]:
    metadata = metadata or {}
    return {
        "objective_answers": copy.deepcopy(metadata.get("answers") or {}),
        "writing_answers": copy.deepcopy(metadata.get("writing_answers") or {}),
        "audio_answers": copy.deepcopy(metadata.get("audio_answers") or {}),
    }


def _serialize_runtime_progress(exam: dict[str, Any], metadata: dict[str, Any] | None) -> dict[str, int]:
    metadata = metadata or {}
    session_like = {
        "exam": exam,
        "answers": metadata.get("answers") or {},
        "writing_answers": metadata.get("writing_answers") or {},
        "audio_answers": metadata.get("audio_answers") or {},
        "speaking_runtime": metadata.get("speaking_runtime") or {},
    }
    return {
        "answered": count_answered_questions(session_like),
        "total": count_total_questions(exam),
    }


def _runtime_screen_model(screen: dict[str, Any]) -> RuntimeScreen:
    payload = {
        key: value
        for key, value in screen.items()
        if key != "screen_type"
    }
    return RuntimeScreen(
        screen_type=screen["screen_type"],
        payload=payload,
    )


def _timestamp_to_iso8601(value: Any) -> str:
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc).replace(
            microsecond=0
        ).isoformat()
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _mark_speaking_response(
    session: dict[str, Any],
    *,
    task_id: str,
    audio_file_path: str,
    duration_sec: float,
) -> None:
    session.setdefault("audio_answers", {})[task_id] = audio_file_path
    speaking_runtime = session.setdefault("speaking_runtime", {})
    state = speaking_runtime.get(task_id)
    if not isinstance(state, dict):
        state = {}
        speaking_runtime[task_id] = state
    responses = state.get("responses")
    if not isinstance(responses, dict):
        responses = {}
        state["responses"] = responses
    responses["audio_file_path"] = audio_file_path
    responses["duration_sec"] = duration_sec
    state["completed"] = True
    state["conversation_active"] = False
    state["submitted_at"] = _timestamp_to_iso8601(None)


def serialize_exam_for_client(
    exam: dict[str, Any],
    *,
    session_id: str = "preview-runtime",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    metadata = metadata or {}
    duration_profile_seconds = metadata.get("duration_profile_seconds")
    sections = [
        _build_reading_section(exam.get("reading", [])),
        _build_listening_section(exam.get("listening", [])),
        _build_writing_section(exam.get("writing", [])),
        _build_speaking_section(
            exam.get("speaking", []),
            duration_profile_seconds=duration_profile_seconds,
        ),
    ]
    return {
        "runtime_schema_version": "3.0",
        "sections": sections,
        "session_id": session_id,
        "level": exam.get("level_band"),
        "responses": _serialize_runtime_responses(metadata),
        "progress": _serialize_runtime_progress(exam, metadata),
        "engine_session_token": metadata.get("engine_session_token"),
        "metadata": copy.deepcopy(metadata),
    }


def serialize_session_for_client(session: dict[str, Any]) -> dict[str, Any]:
    duration_profile_seconds = copy.deepcopy(
        session.get("duration_profile_seconds") or duration_profile_for_mode("production")
    )
    metadata = {
        "generated_at": session.get("start_time"),
        "level": session["level_band"],
        "mode": session.get("mode", "production"),
        "timing": build_timing_manifest(
            float(session.get("start_time", 0)),
            duration_profile=duration_profile_seconds,
        ),
        "duration_profile_seconds": duration_profile_seconds,
        "answers": session.get("answers", {}),
        "audio_answers": session.get("audio_answers", {}),
        "writing_answers": session.get("writing_answers", {}),
        "speaking_runtime": session.get("speaking_runtime", {}),
        "start_time": session.get("start_time"),
        "completed": session.get("completed", False),
        "engine_session_token": issue_engine_session_token(session),
    }
    if "score" in session:
        metadata["score"] = session["score"]
    if "feedback" in session:
        metadata["feedback"] = session["feedback"]
    if "results" in session:
        metadata["results"] = session["results"]

    return serialize_exam_for_client(
        session["exam"],
        session_id=session["session_id"],
        metadata=metadata,
    )


def _writing_prompt(task: dict[str, Any]) -> str:
    content = task.get("content") or {}
    materials = content.get("materials") or {}
    items = content.get("items") or []
    parts = [
        str(content.get("instruction", "")),
        str(materials.get("scenario", "")),
        " ".join(str(item.get("prompt", "")) for item in items if isinstance(item, dict)),
    ]
    return "\n".join(part for part in parts if part.strip())


def _speaking_reference(task: dict[str, Any]) -> str:
    normalized = normalize_speaking_task(task)
    content = normalized.get("content") or {}
    materials = content.get("materials") or {}
    parts = [
        str(content.get("instruction", "")),
        json_string(materials.get("roles") or {}),
        conversation_reference_text(normalized),
    ]
    return "\n".join(part for part in parts if part.strip())


def json_string(value: Any) -> str:
    if isinstance(value, dict):
        return ", ".join(f"{key}: {item}" for key, item in value.items())
    return str(value)


def build_submission_warning(session: dict[str, Any]) -> dict[str, Any]:
    exam = session.get("exam", {})
    answers = session.get("answers", {})
    writing_answers = session.get("writing_answers", {})
    answer_map = get_objective_answer_map(exam)
    incomplete_by_section = {
        "reading": 0,
        "listening": 0,
        "writing": 0,
        "speaking": 0,
    }

    for answer_id, metadata in answer_map.items():
        if answer_id not in answers:
            incomplete_by_section[metadata["section"]] += 1

    for task in exam.get("writing", []):
        task_id = task.get("id")
        if task_id and not writing_answers.get(task_id):
            incomplete_by_section["writing"] += 1

    for task in exam.get("speaking", []):
        task_id = task.get("id")
        if task_id and not speaking_answered(session, task):
            incomplete_by_section["speaking"] += 1

    incomplete_sections = [
        section
        for section, count in incomplete_by_section.items()
        if count > 0
    ]
    return {
        "warning_required": bool(incomplete_sections),
        "message": "Some sections are incomplete including speaking.\n\nDo you still want to submit the exam?",
        "incomplete_sections": incomplete_sections,
        "incomplete_counts": incomplete_by_section,
        "answered_questions": count_answered_questions(session),
        "total_questions": count_total_questions(exam),
        "confirm_label": "Submit Anyway",
        "cancel_label": "Return to Exam",
    }


def evaluate_submission_payload(session: dict[str, Any]) -> dict[str, Any]:
    writing_results: dict[str, Any] = {}
    for task in session["exam"].get("writing", []):
        task_id = task.get("id")
        if not task_id:
            continue
        response = session.get("writing_answers", {}).get(task_id)
        if not response:
            continue
        writing_results[task_id] = evaluate_writing(response, prompt=_writing_prompt(task))

    speaking_results: dict[str, Any] = {}
    for task in session["exam"].get("speaking", []):
        task_id = task.get("id")
        if not task_id:
            continue
        normalized_task = normalize_speaking_task(task)
        audio_path = session.get("audio_answers", {}).get(task_id)
        if audio_path:
            transcription = transcribe_audio(audio_path)
            speaking_results[task_id] = analyze_pronunciation(
                audio_path,
                transcript=transcription.get("transcript", ""),
                duration_seconds=transcription.get("duration_seconds"),
                reference_text=_speaking_reference(normalized_task),
            )
            speaking_results[task_id]["transcription"] = transcription
            continue

        speaking_state = session.get("speaking_runtime", {}).get(task_id) if isinstance(session.get("speaking_runtime"), dict) else None
        if normalized_task.get("mode") == "conversation" and isinstance(speaking_state, dict):
            response_entries = speaking_state.get("responses") if isinstance(speaking_state.get("responses"), dict) else {}
            transcripts: list[dict[str, Any]] = []
            aggregate_text: list[str] = []
            for turn_id, response in response_entries.items():
                if not isinstance(response, dict):
                    continue
                file_path = str(response.get("audio_file_path") or "").strip()
                transcript_text = str(response.get("transcript_text") or "").strip()
                if file_path:
                    transcription = transcribe_audio(file_path)
                    transcript_text = transcript_text or str(transcription.get("transcript") or "").strip()
                    transcripts.append({
                        "turn_id": turn_id,
                        "audio_file_path": file_path,
                        "transcription": transcription,
                    })
                if transcript_text:
                    aggregate_text.append(transcript_text)

            if transcripts or aggregate_text:
                speaking_results[task_id] = {
                    "mode": "conversation",
                    "turn_count": len(transcripts),
                    "transcript": " ".join(aggregate_text).strip(),
                    "responses": transcripts,
                    "reference_text": _speaking_reference(normalized_task),
                }

    return {
        "writing": writing_results,
        "speaking": speaking_results,
    }


class ExamSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self._refresh()

    @classmethod
    def create(
        cls,
        level_band: str = "B1_B2",
        mode: str = "production",
        seed: str | None = None,
        duration_profile_seconds: dict[str, Any] | None = None,
    ):
        session = create_session(
            level_band,
            mode=mode,
            seed=seed,
            duration_profile_seconds=duration_profile_seconds,
        )
        return cls(session["session_id"])

    def _refresh(self):
        self._session = get_session(self.session_id)
        return self._session

    @property
    def exam(self):
        return self._session["exam"]

    @property
    def level_band(self):
        return self._session["level_band"]

    @property
    def answers(self):
        return self._session.get("answers", {})

    @property
    def audio_answers(self):
        return self._session.get("audio_answers", {})

    @property
    def writing_answers(self):
        return self._session.get("writing_answers", {})

    @property
    def start_time(self):
        return self._session.get("start_time")

    @property
    def completed(self):
        return self._session.get("completed", False)

    @property
    def mode(self):
        return self._session.get("mode", "production")

    @property
    def duration_profile_seconds(self):
        return self._session.get("duration_profile_seconds") or duration_profile_for_mode("production")

    def to_dict(self):
        return self._refresh()

    def public_state(self):
        return serialize_session_for_client(self.to_dict())

    def record_answer(self, answer_id, answer):
        with locked_session(self.session_id) as session:
            self._assert_session_open(session)
            section = section_for_answer_id(session["exam"], answer_id)
            assert_section_available(
                float(session.get("start_time", 0)),
                section,
                duration_profile=session.get("duration_profile_seconds"),
            )

            answer_map = get_objective_answer_map(session["exam"])
            if answer_id not in answer_map:
                raise ValueError(f"Unknown answer_id: {answer_id}")

            session["answers"][answer_id] = answer
            log_event("answer_recorded", session_id=self.session_id, answer_id=answer_id)
            if _EVENTS_AVAILABLE:
                try:
                    append_event(ExamEvent(
                        session_id=self.session_id,
                        event_type=ANSWER_SUBMITTED,
                        payload={"answer_id": answer_id, "answer": answer},
                    ))
                    _maybe_snapshot(self.session_id)
                except Exception:
                    pass
        return self._refresh()

    def record_audio(self, task_id, audio_file_path):
        with locked_session(self.session_id) as session:
            self._assert_session_open(session)
            self._assert_task_exists(session["exam"].get("speaking", []), task_id)
            section = section_for_task_id(session["exam"], task_id)
            assert_section_available(
                float(session.get("start_time", 0)),
                section,
                duration_profile=session.get("duration_profile_seconds"),
            )
            session["audio_answers"][task_id] = audio_file_path
            if _EVENTS_AVAILABLE:
                try:
                    append_event(ExamEvent(
                        session_id=self.session_id,
                        event_type=AUDIO_UPLOADED,
                        payload={"task_id": task_id, "audio_file_path": audio_file_path},
                    ))
                    _maybe_snapshot(self.session_id)
                except Exception:
                    pass
        return self._refresh()

    def record_speaking(self, task_id, audio_file_path, duration_sec):
        with locked_session(self.session_id) as session:
            self._assert_session_open(session)
            self._assert_task_exists(session["exam"].get("speaking", []), task_id)
            section = section_for_task_id(session["exam"], task_id)
            assert_section_available(
                float(session.get("start_time", 0)),
                section,
                duration_profile=session.get("duration_profile_seconds"),
            )
            _mark_speaking_response(
                session,
                task_id=task_id,
                audio_file_path=audio_file_path,
                duration_sec=float(duration_sec),
            )
            if _EVENTS_AVAILABLE:
                try:
                    append_event(ExamEvent(
                        session_id=self.session_id,
                        event_type=AUDIO_UPLOADED,
                        payload={
                            "task_id": task_id,
                            "audio_file_path": audio_file_path,
                            "duration_sec": float(duration_sec),
                            "kind": "speaking_submission",
                        },
                    ))
                    _maybe_snapshot(self.session_id)
                except Exception:
                    pass
        return self._refresh()

    def record_writing(self, task_id, text):
        with locked_session(self.session_id) as session:
            self._assert_session_open(session)
            self._assert_task_exists(session["exam"].get("writing", []), task_id)
            section = section_for_task_id(session["exam"], task_id)
            assert_section_available(
                float(session.get("start_time", 0)),
                section,
                duration_profile=session.get("duration_profile_seconds"),
            )
            session["writing_answers"][task_id] = text
            if _EVENTS_AVAILABLE:
                try:
                    append_event(ExamEvent(
                        session_id=self.session_id,
                        event_type=WRITING_SUBMITTED,
                        payload={"task_id": task_id, "text": text},
                    ))
                    _maybe_snapshot(self.session_id)
                except Exception:
                    pass
        return self._refresh()

    def submit(self, *, confirm_incomplete: bool = False):
        with locked_session(self.session_id) as session:
            self._assert_session_open(session)
            warning = build_submission_warning(session)
            if warning["warning_required"] and not confirm_incomplete:
                log_event(
                    "EXAM_SUBMIT_WARNING",
                    session_id=self.session_id,
                    accepted_count=warning["answered_questions"],
                    incomplete_sections=warning["incomplete_sections"],
                )
                return {
                    "status": "warning",
                    "warning": warning,
                }
            score = self.compute_score(session)
            max_score = count_total_questions(session["exam"])
            cefr_level = estimate_cefr(score.get("total", 0), max_score)
            analytics = evaluate_submission_payload(session)
            feedback = generate_feedback(score)
            results = {
                "score": score,
                "cefr_level": cefr_level,
                "feedback": feedback,
                "analytics": analytics,
            }
            session["completed"] = True
            session["score"] = score
            session["cefr_level"] = cefr_level
            session["feedback"] = feedback
            session["results"] = results
            log_event(
                "exam_submit_confirmed",
                session_id=self.session_id,
                answered_questions=count_answered_questions(session),
            )
            if _EVENTS_AVAILABLE:
                try:
                    append_event(ExamEvent(
                        session_id=self.session_id,
                        event_type=EXAM_SUBMITTED,
                        payload={},
                    ))
                    append_event(ExamEvent(
                        session_id=self.session_id,
                        event_type=RESULTS_GENERATED,
                        payload={
                            "score": score,
                            "cefr_level": cefr_level,
                            "feedback": feedback,
                            "results": results,
                        },
                    ))
                    _maybe_snapshot(self.session_id)
                except Exception:
                    pass
            increment_metric("sessions_completed")

        self._refresh()
        return {
            "status": "submitted",
            "score": self._session["score"],
            "total_score": self._session["score"].get("total", 0),
            "cefr_level": self._session["cefr_level"],
            "level_estimate": self._session["cefr_level"],
            "feedback": self._session["feedback"],
            "certificate_available": True,
            "analytics": self._session["results"].get("analytics", {}),
        }

    def time_remaining(self):
        session = self.to_dict()
        return build_timing_manifest(
            float(session.get("start_time", 0)),
            duration_profile=session.get("duration_profile_seconds"),
        )["total_remaining_seconds"]

    def progress(self):
        session = self.to_dict()
        timing = build_timing_manifest(
            float(session.get("start_time", 0)),
            duration_profile=session.get("duration_profile_seconds"),
        )
        return {
            "answered_questions": count_answered_questions(session),
            "total_questions": count_total_questions(session["exam"]),
            "active_section": timing["active_section"],
            "section_remaining_seconds": timing["section_remaining_seconds"],
            "total_remaining_seconds": timing["total_remaining_seconds"],
        }

    def submission_status(self):
        session = self.to_dict()
        return {
            "completed": bool(session.get("completed", False)),
            "warning": build_submission_warning(session),
        }

    def compute_score(self, session=None):
        payload = session or self.to_dict()
        return score_exam(payload)

    def certificate(self):
        session = self.to_dict()
        if not session.get("completed"):
            raise RuntimeError("Session must be submitted before certificate generation")
        return generate_certificate(session)

    @staticmethod
    def _assert_session_open(session):
        if session.get("completed"):
            raise RuntimeError("Session already submitted")

    @staticmethod
    def _assert_task_exists(tasks, task_id):
        if not any(task.get("id") == task_id for task in tasks):
            raise ValueError(f"Unknown task_id: {task_id}")


def start_session(level_band="B1_B2"):
    return ExamSession.create(level_band)


def load_session(session_id):
    return ExamSession(session_id)


if __name__ == "__main__":
    session = start_session("B1_B2")
    print("Session started:", session.session_id)
    print("Reading tasks:", len(session.exam["reading"]))
    print("Listening tasks:", len(session.exam["listening"]))
