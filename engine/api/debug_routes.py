from __future__ import annotations

from fastapi import APIRouter

from engine.api.runtime_contract_guard import validate_runtime_contract
from engine.exam.exam_generator_v3_2 import generate_exam
from engine.exam.exam_session_engine_v3_2 import ExamSession, serialize_exam_for_client


router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/exam-runtime")
def debug_exam_runtime(level: str = "B1_B2"):
    exam = generate_exam(level)
    payload = serialize_exam_for_client(
        exam,
        session_id="debug-exam-runtime",
        metadata={
            "generated_at": None,
            "level": level,
            "debug": True,
        },
    )
    return validate_runtime_contract(payload)


@router.get("/audio/{session_id}")
def debug_audio(session_id: str):
    session = ExamSession(session_id)
    payload = validate_runtime_contract(session.public_state())
    debug_rows = []
    for screen in payload["screens"]:
        screen_type = screen["screen_type"]
        body = screen["payload"]
        if screen_type not in ("listening_prompt", "speaking_prompt"):
            continue
        audio = body.get("audio") if isinstance(body.get("audio"), dict) else {}
        debug_rows.append(
            {
                "task_id": body.get("task_id"),
                "screen_type": screen_type,
                "transcript_present": bool(body.get("agent_line") or body.get("materials", {}).get("transcript")),
                "audio_url": audio.get("url"),
                "provider": audio.get("provider"),
                "duration_seconds": audio.get("duration_seconds"),
                "exists_reachable": bool(audio.get("url")),
            }
        )
    return {"session_id": session_id, "audio_screens": debug_rows}
