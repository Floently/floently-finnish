from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, Header, Request, UploadFile
from fastapi.responses import FileResponse

from app.middleware.request_id import get_request_id
from app.models.api_models import PronunciationAnalyzeRequest, TtsRequest
from app.core.responses import success_payload
from app.services.auth_service import current_user_from_authorization
from app.services.voice_service import analyze_pronunciation, create_tts_request, get_tts_health_snapshot, transcribe_audio
from app.services.tts.runtime import get_cached_audio_file


def build_voice_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/voice/tts/health")
    async def tts_health_route(request: Request) -> dict[str, Any]:
        return success_payload(data=get_tts_health_snapshot(), request_id=get_request_id(request))

    @router.get("/tts/health")
    async def legacy_tts_health_route(request: Request) -> dict[str, Any]:
        """Voice/TTS health probe exposed by the canonical voice router."""
        return success_payload(data=get_tts_health_snapshot(), request_id=get_request_id(request))

    @router.get("/audio/health")
    async def legacy_audio_health_route(request: Request) -> dict[str, Any]:
        """Compatibility alias for the old v1_audio compatibility stub.

        This keeps /api/v1/audio/health available while removing the separate
        previous audio status surface.
        """
        return success_payload(data={"ok": True, "mode": "voice_router_compatibility_alias"}, request_id=get_request_id(request))

    @router.post("/voice/stt/transcriptions")
    async def transcribe_audio_route(
        request: Request,
        file: UploadFile = File(...),
        mime_type: str = Form(...),
        duration_ms: int | None = Form(default=None),
        session_id: str = Form(default="voice-session"),
        speaking_session_id: str | None = Form(default=None),
        turn_id: str | None = Form(default=None),
        task_id: str | None = Form(default=None),
        mode: str = Form(default="speaking_practice"),
        locale: str = Form(default="fi-FI"),
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        if authorization:
            current_user_from_authorization(authorization)
        if mode != "yki_exam" and not speaking_session_id:
            speaking_session_id = session_id
        raw = await file.read()
        data = transcribe_audio(
            raw_bytes=raw,
            filename=file.filename or "audio.bin",
            mime_type=mime_type,
            duration_ms=duration_ms,
            session_id=session_id,
            speaking_session_id=speaking_session_id,
            turn_id=turn_id,
            task_id=task_id,
            mode=mode,
            locale=locale,
        )
        return success_payload(data=data, request_id=get_request_id(request))

    @router.post("/voice/tts/requests")
    async def create_tts_request_route(request: Request, payload: TtsRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        if authorization:
            current_user_from_authorization(authorization)
        return success_payload(data=await create_tts_request(payload=payload.model_dump()), request_id=get_request_id(request))

    @router.get("/voice/tts/audio/{cache_key}.{file_extension}")
    async def get_tts_audio_file(cache_key: str, file_extension: str) -> FileResponse:
        del file_extension
        audio_path, metadata = get_cached_audio_file(cache_key)
        media_type = str(metadata.get("media_type") or "audio/mpeg")
        resolved_extension = str(metadata.get("file_extension") or "mp3")
        return FileResponse(audio_path, media_type=media_type, filename=f"{cache_key}.{resolved_extension}")

    @router.post("/voice/pronunciation/analyze")
    async def analyze_pronunciation_route(request: Request, payload: PronunciationAnalyzeRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        current_user_from_authorization(authorization)
        return success_payload(
            data=analyze_pronunciation(expected_text=payload.expected_text, transcript=payload.transcript),
            request_id=get_request_id(request),
        )

    return router
