from __future__ import annotations

from typing import Any

from app.services.subscription_service import require_feature
from app.services.yki_evaluation_service import evaluate_yki_submission
from app.runtime.voice import resolve_voice_ref
from app.runtime.yki import (
    engine_request,
    get_yki_session_record,
    map_engine_error,
    read_yki_evaluation_evidence,
    record_yki_evaluation_evidence,
    sanitize_runtime_for_client,
    store_yki_session,
)
from app.runtime.yki_local_fallback import build_local_yki_runtime, is_local_runtime_record, local_accept_response, local_certificate_response, local_submit_response


async def start_yki_session(*, user: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    require_feature(user=user, feature="yki")
    response = await engine_request(method="POST", path="/exam/start", payload=payload)
    if response.status_code in {408, 429, 500, 502, 503, 504}:
        runtime = build_local_yki_runtime(user_id=user["user_id"], payload=payload)
    else:
        map_engine_error(response=response)
        runtime = response.payload
    store_yki_session(user_id=user["user_id"], runtime=runtime)
    return {"runtime": sanitize_runtime_for_client(runtime)}


async def get_yki_session(*, user_id: str, session_id: str) -> dict[str, Any]:
    record = get_yki_session_record(user_id=user_id, session_id=session_id)
    if is_local_runtime_record(record):
        runtime = record.get("runtime") or {"session_id": session_id, "status": "in_progress", "local_fallback": True}
        return {"runtime": sanitize_runtime_for_client(runtime)}
    response = await engine_request(method="GET", path=f"/exam/{session_id}")
    if response.status_code in {408, 429, 500, 502, 503, 504} and record.get("runtime"):
        return {"runtime": sanitize_runtime_for_client(record["runtime"])}
    map_engine_error(response=response)
    runtime = response.payload
    store_yki_session(user_id=user_id, runtime=runtime)
    return {"runtime": sanitize_runtime_for_client(runtime)}


async def submit_yki_answer(*, user_id: str, session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    record = get_yki_session_record(
        user_id=user_id,
        session_id=session_id,
    )

    if is_local_runtime_record(record):
        return local_accept_response(
            session_id=session_id,
            payload=payload,
            action="answer_accepted",
        )

    task_id = str(
        payload.get("task_id")
        or ""
    ).strip()

    question_id = str(
        payload.get("item_id")
        or payload.get("question_id")
        or ""
    ).strip()

    response = await engine_request(
        method="POST",
        path=f"/exam/{session_id}/answer",
        payload={
            "item_id": task_id,
            "question_id": question_id,
            "answer": payload.get("answer"),
        },
    )

    map_engine_error(
        response=response,
    )

    return response.payload


async def submit_yki_writing(*, user_id: str, session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    record = get_yki_session_record(
        user_id=user_id,
        session_id=session_id,
    )

    if is_local_runtime_record(record):
        result = local_accept_response(
            session_id=session_id,
            payload=payload,
            action="writing_accepted",
        )
    else:
        response = await engine_request(
            method="POST",
            path=f"/exam/{session_id}/writing",
            payload=payload,
        )
        map_engine_error(response=response)
        result = response.payload

    task_id = str(
        payload.get("task_id")
        or "writing"
    )

    record_yki_evaluation_evidence(
        user_id=user_id,
        session_id=session_id,
        category="writing",
        key=task_id,
        value={
            "text": str(payload.get("text") or ""),
            "engine": result,
        },
    )

    return result


async def submit_yki_audio(*, user_id: str, session_id: str, task_id: str, audio_ref: str) -> dict[str, Any]:
    record = get_yki_session_record(
        user_id=user_id,
        session_id=session_id,
    )

    if is_local_runtime_record(record):
        result = local_accept_response(
            session_id=session_id,
            payload={
                "task_id": task_id,
                "audio_ref": audio_ref,
            },
            action="audio_accepted",
        )
    else:
        audio_file_path = resolve_voice_ref(
            audio_ref=audio_ref,
            expected_session_id=session_id,
            expected_task_id=task_id,
        )

        response = await engine_request(
            method="POST",
            path=f"/exam/{session_id}/audio",
            payload={
                "task_id": task_id,
                "audio_file_path": audio_file_path,
            },
        )
        map_engine_error(response=response)
        result = response.payload

    record_yki_evaluation_evidence(
        user_id=user_id,
        session_id=session_id,
        category="audio",
        key=task_id,
        value={
            "audio_submitted": bool(audio_ref),
            "engine": result,
        },
    )

    return result


async def submit_yki_speaking(*, user_id: str, session_id: str, item_id: str, audio_ref: str, duration_sec: float) -> dict[str, Any]:
    record = get_yki_session_record(
        user_id=user_id,
        session_id=session_id,
    )

    if is_local_runtime_record(record):
        result = local_accept_response(
            session_id=session_id,
            payload={
                "item_id": item_id,
                "audio_ref": audio_ref,
                "duration_sec": duration_sec,
            },
            action="speaking_accepted",
        )
    else:
        audio_file_path = resolve_voice_ref(
            audio_ref=audio_ref,
            expected_session_id=session_id,
            expected_task_id=item_id,
        )

        response = await engine_request(
            method="POST",
            path=f"/exam/{session_id}/speaking",
            payload={
                "item_id": item_id,
                "audio_file_path": audio_file_path,
                "duration_sec": duration_sec,
            },
        )
        map_engine_error(response=response)
        result = response.payload

    record_yki_evaluation_evidence(
        user_id=user_id,
        session_id=session_id,
        category="speaking",
        key=item_id,
        value={
            "audio_submitted": bool(audio_ref),
            "duration_sec": float(duration_sec),
            "engine": result,
        },
    )

    return result


async def start_yki_conversation(*, user_id: str, session_id: str, task_id: str) -> dict[str, Any]:
    record = get_yki_session_record(user_id=user_id, session_id=session_id)
    if is_local_runtime_record(record):
        return local_accept_response(session_id=session_id, payload={"task_id": task_id}, action="conversation_started")
    response = await engine_request(
        method="POST",
        path="/exam/speaking/start_conversation",
        payload={"session_id": session_id, "task_id": task_id, "session_token": record["engine_session_token"]},
    )
    map_engine_error(response=response)
    return response.payload


async def submit_yki_turn(*, user_id: str, session_id: str, task_id: str, turn_id: str, audio_ref: str, transcript_text: str | None) -> dict[str, Any]:
    record = get_yki_session_record(
        user_id=user_id,
        session_id=session_id,
    )

    if is_local_runtime_record(record):
        result = local_accept_response(
            session_id=session_id,
            payload={
                "task_id": task_id,
                "turn_id": turn_id,
                "audio_ref": audio_ref,
                "transcript_text": transcript_text,
            },
            action="turn_accepted",
        )
    else:
        audio_file_path = resolve_voice_ref(
            audio_ref=audio_ref,
            expected_session_id=session_id,
            expected_task_id=task_id,
            expected_turn_id=turn_id,
        )

        response = await engine_request(
            method="POST",
            path="/exam/speaking/submit_turn",
            payload={
                "session_id": session_id,
                "task_id": task_id,
                "turn_id": turn_id,
                "audio_file_path": audio_file_path,
                "session_token": record["engine_session_token"],
                "transcript_text": transcript_text,
            },
        )
        map_engine_error(response=response)
        result = response.payload

    record_yki_evaluation_evidence(
        user_id=user_id,
        session_id=session_id,
        category="conversation",
        key=f"{task_id}:{turn_id}",
        value={
            "task_id": task_id,
            "turn_id": turn_id,
            "transcript_text": transcript_text,
            "audio_submitted": bool(audio_ref),
            "engine": result,
        },
    )

    return result


async def generate_yki_reply(*, user_id: str, session_id: str, task_id: str) -> dict[str, Any]:
    record = get_yki_session_record(user_id=user_id, session_id=session_id)
    if is_local_runtime_record(record):
        return {"session_id": session_id, "task_id": task_id, "reply": "Jatketaan harjoitusta. Vastaa omin sanoin suomeksi.", "local_fallback": True}
    response = await engine_request(
        method="POST",
        path="/exam/speaking/generate_reply",
        payload={"session_id": session_id, "task_id": task_id, "session_token": record["engine_session_token"]},
    )
    map_engine_error(response=response)
    return response.payload


async def submit_yki_exam(*, user_id: str, session_id: str, confirm_incomplete: bool) -> dict[str, Any]:
    record = get_yki_session_record(
        user_id=user_id,
        session_id=session_id,
    )

    if is_local_runtime_record(record):
        result = local_submit_response(
            session_id=session_id,
            confirm_incomplete=confirm_incomplete,
        )
    else:
        response = await engine_request(
            method="POST",
            path=f"/exam/{session_id}/submit",
            payload={
                "confirm_incomplete": confirm_incomplete,
                "session_token": record["engine_session_token"],
            },
        )
        map_engine_error(response=response)
        result = response.payload

    evidence = read_yki_evaluation_evidence(
        user_id=user_id,
        session_id=session_id,
    )

    evaluation_report = evaluate_yki_submission(
        runtime=(
            record.get("runtime")
            if isinstance(record.get("runtime"), dict)
            else {}
        ),
        submission=result,
        evidence=evidence,
    )

    return {
        **result,
        "evaluation": evaluation_report,
        "evaluationReport": evaluation_report,
        "disclaimer": evaluation_report["disclaimer"],
    }


async def get_yki_certificate(*, user_id: str, session_id: str) -> dict[str, Any]:
    record = get_yki_session_record(user_id=user_id, session_id=session_id)
    if is_local_runtime_record(record):
        return local_certificate_response(session_id=session_id)
    response = await engine_request(method="GET", path=f"/exam/{session_id}/certificate")
    map_engine_error(response=response)
    return response.payload
