"""
FastAPI exam runtime endpoints backed by the session manager.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from engine.api.request_rate_limits import check_rate_limit
from engine.exam.audio_storage import is_managed_exam_audio_path
from engine.exam.exam_certificate_engine_v3_2 import generate_certificate
from engine.exam.conversation_runtime import (
    generate_ai_reply,
    start_conversation,
    submit_turn_response,
)
from engine.exam.exam_session_engine_v3_2 import (
    ExamSession,
    MediaIntegrityError,
    serialize_exam_for_client,
    speaking_duration_limits,
)
from engine.exam.exam_scoring_engine_v3_2 import get_objective_answer_map
from engine.exam.speaking_controller import normalize_speaking_task
from engine.exam.exam_timing_engine import DEFAULT_EXAM_MODE
from engine.schema.public_exam_runtime_models_v3_3 import (
    PublicSessionResponseModel,
    StartExamResponseModel,
)
from engine.runtime.session_manager_v3_3 import (
    SessionError,
    SessionExpiredError,
    SessionNotFoundError,
    delete_session,
    locked_session,
)
from engine.runtime.session_tokens import issue_engine_session_token, verify_engine_session_token
try:
    from engine.metrics import increment_metric
except ImportError:
    def increment_metric(name: str, delta: int = 1) -> None: ...


router = APIRouter(tags=["exam"])


class StartExamRequest(BaseModel):
    level_band: Literal["A1_A2", "B1_B2", "C1_C2"]
    mode: Literal["production", "test"] = DEFAULT_EXAM_MODE
    seed: str | None = None
    duration_profile_seconds: dict[str, int] | None = None


class AnswerRequest(BaseModel):
    item_id: str
    question_id: str
    answer: int | bool | str


class SessionAnswerRequest(BaseModel):
    session_id: str
    item_id: str
    question_id: str
    answer: int | bool | str


class WritingAnswerRequest(BaseModel):
    task_id: str
    text: str


class AudioAnswerRequest(BaseModel):
    task_id: str
    audio_file_path: str


class SpeakingAnswerRequest(BaseModel):
    item_id: str
    audio_file_path: str
    duration_sec: float


class StartConversationRequest(BaseModel):
    session_id: str
    task_id: str
    session_token: str


class SubmitConversationTurnRequest(BaseModel):
    session_id: str
    task_id: str
    turn_id: str
    audio_file_path: str
    session_token: str
    transcript_text: str | None = None


class GenerateConversationReplyRequest(BaseModel):
    session_id: str
    task_id: str
    session_token: str


class SubmitExamRequest(BaseModel):
    confirm_incomplete: bool = False
    session_token: str


def _load_runtime_session(session_id: str) -> ExamSession:
    try:
        return ExamSession(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc
    except SessionExpiredError as exc:
        raise HTTPException(status_code=410, detail="Session expired") from exc
    except SessionError as exc:
        increment_metric("engine_errors")
        raise HTTPException(status_code=403, detail="Session invalid") from exc


def _translate_runtime_error(exc: Exception) -> HTTPException:
    if isinstance(exc, HTTPException):
        return exc
    increment_metric("engine_errors")
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, RuntimeError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail="Internal server error")


def _load_speaking_task(session: ExamSession, task_id: str) -> dict[str, Any]:
    task = next(
        (candidate for candidate in session.exam.get("speaking", []) if str(candidate.get("id") or "").strip() == task_id),
        None,
    )
    if not isinstance(task, dict):
        raise HTTPException(status_code=404, detail="Speaking task not found")
    try:
        return normalize_speaking_task(task)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _assert_managed_audio_path(*, session_id: str, task_id: str, audio_file_path: str) -> None:
    if not is_managed_exam_audio_path(
        audio_file_path,
        session_id=session_id,
        task_id=task_id,
    ):
        raise HTTPException(status_code=400, detail="Audio file path must reference a managed exam upload")


def _require_valid_session_token(session: ExamSession, token: str) -> None:
    if not verify_engine_session_token(session.to_dict(), token):
        raise HTTPException(status_code=403, detail="Engine session token is invalid")


def _resolve_answer_id(*, session: ExamSession, item_id: str, question_id: str) -> str:
    answer_map = get_objective_answer_map(session.exam)
    metadata = answer_map.get(question_id)
    if metadata is None:
        raise HTTPException(status_code=400, detail="Unknown question_id")
    if str(metadata.get("task_id") or "") != str(item_id or ""):
        raise HTTPException(status_code=400, detail="Question does not belong to item")
    return question_id


def _validate_speaking_duration(
    *,
    session: ExamSession,
    task: dict[str, Any],
    duration_sec: float,
) -> None:
    limits = speaking_duration_limits(
        task,
        duration_profile_seconds=session.duration_profile_seconds,
    )
    if duration_sec < float(limits["min_duration_sec"]):
        raise HTTPException(status_code=400, detail="Speaking recording is shorter than the minimum duration")
    if duration_sec > float(limits["max_duration_sec"]):
        raise HTTPException(status_code=400, detail="Speaking recording exceeds the maximum duration")


@router.post("/exam/start")
def start_exam(req: StartExamRequest):
    session = ExamSession.create(
        req.level_band,
        mode=req.mode,
        seed=req.seed,
        duration_profile_seconds=req.duration_profile_seconds,
    )
    try:
        payload = session.public_state()
        try:
            StartExamResponseModel(**payload)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"V3 CONTRACT VALIDATION FAILED: {e}")

        return payload
    except MediaIntegrityError as exc:
        delete_session(session.session_id, missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail={
                "code": "MEDIA_VALIDATION_FAILED",
                "message": str(exc),
            },
        ) from exc
    except Exception:
        delete_session(session.session_id, missing_ok=True)
        raise


@router.get("/exam/{session_id}")
def get_exam(session_id: str):
    session = _load_runtime_session(session_id)
    state = session.public_state()

    try:
        PublicSessionResponseModel(**state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"V3 CONTRACT VALIDATION FAILED: {e}")

    return state


@router.post("/exam/{session_id}/answer")
def submit_answer(session_id: str, req: AnswerRequest):
    check_rate_limit(scope="answer", session_id=session_id, limit=10, window_seconds=1.0)
    session = _load_runtime_session(session_id)
    try:
        answer_id = _resolve_answer_id(session=session, item_id=req.item_id, question_id=req.question_id)
        session.record_answer(answer_id, req.answer)
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return {"status": "answer recorded"}


@router.post("/exam/answer")
def submit_answer_by_session(req: SessionAnswerRequest):
    return submit_answer(
        req.session_id,
        AnswerRequest(
            item_id=req.item_id,
            question_id=req.question_id,
            answer=req.answer,
        ),
    )


@router.post("/exam/{session_id}/writing")
def submit_writing(session_id: str, req: WritingAnswerRequest):
    session = _load_runtime_session(session_id)
    try:
        session.record_writing(req.task_id, req.text)
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return {"status": "writing recorded"}


@router.post("/exam/{session_id}/audio")
def submit_audio(session_id: str, req: AudioAnswerRequest):
    check_rate_limit(scope="audio_answer", session_id=session_id, limit=10, window_seconds=1.0)
    session = _load_runtime_session(session_id)
    _assert_managed_audio_path(
        session_id=session_id,
        task_id=req.task_id,
        audio_file_path=req.audio_file_path,
    )
    try:
        session.record_audio(req.task_id, req.audio_file_path)
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return {"status": "audio recorded"}


@router.post("/exam/{session_id}/speaking")
def submit_speaking(session_id: str, req: SpeakingAnswerRequest):
    check_rate_limit(scope="speaking_answer", session_id=session_id, limit=10, window_seconds=60.0)
    session = _load_runtime_session(session_id)
    task = _load_speaking_task(session, req.item_id)
    _assert_managed_audio_path(
        session_id=session_id,
        task_id=req.item_id,
        audio_file_path=req.audio_file_path,
    )
    _validate_speaking_duration(session=session, task=task, duration_sec=float(req.duration_sec))
    try:
        session.record_speaking(req.item_id, req.audio_file_path, float(req.duration_sec))
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return {"status": "speaking recorded"}


@router.post("/exam/speaking/start_conversation")
def start_exam_conversation(req: StartConversationRequest):
    check_rate_limit(scope="conversation_start", session_id=req.session_id, limit=10, window_seconds=60.0)
    session = _load_runtime_session(req.session_id)
    _require_valid_session_token(session, req.session_token)
    task = _load_speaking_task(session, req.task_id)
    try:
        with locked_session(req.session_id) as raw_session:
            state = start_conversation(raw_session, task)
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return state


@router.post("/exam/speaking/submit_turn")
def submit_exam_conversation_turn(req: SubmitConversationTurnRequest):
    check_rate_limit(scope="conversation_turn", session_id=req.session_id, limit=30, window_seconds=60.0)
    session = _load_runtime_session(req.session_id)
    _require_valid_session_token(session, req.session_token)
    task = _load_speaking_task(session, req.task_id)
    _assert_managed_audio_path(
        session_id=req.session_id,
        task_id=req.task_id,
        audio_file_path=req.audio_file_path,
    )
    try:
        with locked_session(req.session_id) as raw_session:
            state = submit_turn_response(
                raw_session,
                task,
                turn_id=req.turn_id,
                audio_file_path=req.audio_file_path,
                transcript_text=req.transcript_text,
            )
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return state


@router.post("/exam/speaking/generate_reply")
def generate_exam_conversation_reply(req: GenerateConversationReplyRequest):
    check_rate_limit(scope="conversation_reply", session_id=req.session_id, limit=30, window_seconds=60.0)
    session = _load_runtime_session(req.session_id)
    _require_valid_session_token(session, req.session_token)
    task = _load_speaking_task(session, req.task_id)
    try:
        with locked_session(req.session_id) as raw_session:
            state = generate_ai_reply(raw_session, task)
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
    return state


@router.get("/exam/{session_id}/time")
def get_exam_time(session_id: str):
    session = _load_runtime_session(session_id)
    return session.public_state()["metadata"]["timing"]


@router.get("/exam/{session_id}/progress")
def get_exam_progress(session_id: str):
    session = _load_runtime_session(session_id)
    return session.progress()


@router.get("/exam/{session_id}/submission_status")
def get_exam_submission_status(session_id: str):
    session = _load_runtime_session(session_id)
    return session.submission_status()


@router.post("/exam/{session_id}/submit")
def submit_exam(session_id: str, req: SubmitExamRequest):
    session = _load_runtime_session(session_id)
    try:
        check_rate_limit(scope="submit_exam", session_id=session_id, limit=10, window_seconds=60.0)
        _require_valid_session_token(session, req.session_token)
        return session.submit(confirm_incomplete=bool(req.confirm_incomplete))
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc


@router.get("/exam/{session_id}/certificate")
def get_certificate(session_id: str):
    session = _load_runtime_session(session_id)
    try:
        return generate_certificate(session)
    except Exception as exc:
        raise _translate_runtime_error(exc) from exc
