from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, Request

from app.middleware.request_id import get_request_id
from app.models.api_models import (
    AudioReferenceRequest,
    GenerateConversationReplyRequest,
    ObjectiveAnswerRequest,
    SpeakingAnswerRequest,
    StartConversationRequest,
    StartExamRequest,
    SubmitConversationTurnRequest,
    SubmitExamRequest,
    WritingAnswerRequest,
)
from app.core.responses import success_payload
from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import require_feature
from app.services.yki_service import (
    generate_yki_reply,
    get_yki_certificate,
    get_yki_session,
    start_yki_conversation,
    start_yki_session,
    submit_yki_answer,
    submit_yki_audio,
    submit_yki_exam,
    submit_yki_speaking,
    submit_yki_turn,
    submit_yki_writing,
)


def build_yki_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.post("/yki/sessions")
    async def start_yki_session_route(request: Request, payload: StartExamRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await start_yki_session(user=user, payload=payload.model_dump())
        return success_payload(data=data, request_id=get_request_id(request))

    @router.get("/yki/sessions/{session_id}")
    async def get_yki_session_route(request: Request, session_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await get_yki_session(user_id=user["user_id"], session_id=session_id)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/answers")
    async def submit_yki_answer_route(request: Request, session_id: str, payload: ObjectiveAnswerRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await submit_yki_answer(user_id=user["user_id"], session_id=session_id, payload=payload.model_dump())
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/writing")
    async def submit_yki_writing_route(request: Request, session_id: str, payload: WritingAnswerRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await submit_yki_writing(user_id=user["user_id"], session_id=session_id, payload=payload.model_dump())
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/audio")
    async def submit_yki_audio_route(request: Request, session_id: str, payload: AudioReferenceRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await submit_yki_audio(
            user_id=user["user_id"],
            session_id=session_id,
            task_id=payload.task_id,
            audio_ref=payload.audio_ref,
        )
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/speaking")
    async def submit_yki_speaking_route(request: Request, session_id: str, payload: SpeakingAnswerRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await submit_yki_speaking(
            user_id=user["user_id"],
            session_id=session_id,
            item_id=payload.item_id,
            audio_ref=payload.audio_ref,
            duration_sec=payload.duration_sec,
        )
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/speaking/conversation")
    async def start_yki_conversation_route(request: Request, session_id: str, payload: StartConversationRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await start_yki_conversation(user_id=user["user_id"], session_id=session_id, task_id=payload.task_id)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/speaking/turns")
    async def submit_yki_turn_route(request: Request, session_id: str, payload: SubmitConversationTurnRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await submit_yki_turn(
            user_id=user["user_id"],
            session_id=session_id,
            task_id=payload.task_id,
            turn_id=payload.turn_id,
            audio_ref=payload.audio_ref,
            transcript_text=payload.transcript_text,
        )
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/speaking/reply")
    async def generate_yki_reply_route(request: Request, session_id: str, payload: GenerateConversationReplyRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await generate_yki_reply(user_id=user["user_id"], session_id=session_id, task_id=payload.task_id)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/yki/sessions/{session_id}/submit")
    async def submit_yki_exam_route(request: Request, session_id: str, payload: SubmitExamRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await submit_yki_exam(user_id=user["user_id"], session_id=session_id, confirm_incomplete=payload.confirm_incomplete)
        return success_payload(data=data, request_id=get_request_id(request))

    @router.get("/yki/sessions/{session_id}/certificate")
    async def get_yki_certificate_route(request: Request, session_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="yki")
        data = await get_yki_certificate(user_id=user["user_id"], session_id=session_id)
        return success_payload(data=data, request_id=get_request_id(request))

    return router
