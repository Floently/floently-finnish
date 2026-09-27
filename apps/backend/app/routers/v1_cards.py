from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.errors import AppError
from app.services.auth_service import current_user_from_authorization
from app.services.cards_service import cards_service
from app.services.card_hint_service import generate_card_coach_hint

router = APIRouter(prefix="/cards", tags=["cards"])
_CARD_HINT_LOG = logging.getLogger("floently.card_hint")
from app.core.paths import BACKEND_ROOT as _BACKEND_ROOT
TTS_AUDIO_DIR = _BACKEND_ROOT / "app" / ".tts_runtime" / "audio"


class CardAnswerIn(BaseModel):
    cardId: str
    answer: str
    confidence: int | None = 3
    elapsedMs: int | None = 0


class RuntimeAnswerRequest(BaseModel):
    user_answer: str


class CardCoachHintRequest(BaseModel):
    card_id: str | None = None
    front_text: str | None = None
    prompt: str | None = None
    content_type: str | None = None
    ui_language: str | None = None
    existing_hint: str | None = None
    correct_answer: str | None = None
    options: list[str] | None = None


class CardFlagRequest(BaseModel):
    card_id: str
    reason: str
    note: str | None = None
    session_id: str | None = None


def _cards_user_id(authorization: str | None) -> str:
    if not authorization:
        return "anonymous"
    try:
        user, _ = current_user_from_authorization(authorization)
        return str(user["user_id"])
    except AppError:
        raise
    except Exception:
        return "anonymous"


def _require_cards_user_id(authorization: str | None) -> str:
    user_id = _cards_user_id(authorization)
    if user_id == "anonymous":
        raise HTTPException(status_code=401, detail={"error": "Authentication is required."})
    return user_id


@router.get("/session")
def get_session(mode: str = Query("vocabulary"), limit: int = Query(10, ge=1, le=30)):
    return cards_service.get_session(mode, limit)


@router.post("/answer")
def answer_card(payload: CardAnswerIn):
    return cards_service.answer(payload.cardId, payload.answer)


@router.get("/session/adaptive/start")
def start_runtime_session(
    domain: str = Query("general"),
    content_type: str = Query("vocabulary_card"),
    profession: str | None = Query(default=None),
    level: str | None = Query(default=None),
    ui_language: str | None = Query(default=None),
    limit: int = Query(10, ge=1, le=30),
    authorization: str | None = Header(default=None),
):
    return cards_service.start_runtime_session(
        user_id=_require_cards_user_id(authorization),
        domain=domain,
        content_type=content_type,
        profession=profession,
        level=level,
        ui_language=ui_language,
        adaptive=True,
        limit=limit,
    )


@router.post("/session/{session_id}/answer")
def answer_runtime_card(
    session_id: str,
    payload: RuntimeAnswerRequest,
    authorization: str | None = Header(default=None),
):
    return cards_service.answer_runtime_card(
        user_id=_require_cards_user_id(authorization),
        session_id=session_id,
        user_answer=payload.user_answer,
    )


@router.get("/session/{session_id}/next")
def next_runtime_card(session_id: str, authorization: str | None = Header(default=None)):
    return cards_service.next_runtime_card(
        user_id=_require_cards_user_id(authorization),
        session_id=session_id,
    )


@router.get("/deck")
def runtime_deck(
    domain: str = Query("general"),
    content_type: str = Query("vocabulary_card"),
    profession: str | None = Query(default=None),
    level: str | None = Query(default=None),
    ui_language: str | None = Query(default=None),
    source: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
):
    return cards_service.get_runtime_deck(
        user_id=_require_cards_user_id(authorization),
        domain=domain,
        content_type=content_type,
        profession=profession,
        level=level,
        source=source,
        ui_language=ui_language,
    )


@router.get("/audio/generated/{filename}")
def get_generated_card_audio(filename: str):
    safe_name = Path(filename).name
    if not safe_name.endswith(".mp3"):
        raise HTTPException(status_code=404, detail={"error": "Audio not found."})
    audio_path = TTS_AUDIO_DIR / safe_name
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail={"error": "Audio not found."})
    return FileResponse(audio_path, media_type="audio/mpeg", filename=safe_name)


@router.post("/coach/hint")
def coach_card_hint(payload: CardCoachHintRequest, authorization: str | None = Header(default=None)):
    user_id = _require_cards_user_id(authorization)
    context = cards_service.get_card_hint_context(
        card_id=payload.card_id or "",
        ui_language=payload.ui_language,
    )
    if context is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "CARD_NOT_FOUND",
                "message": "Card was not found in the runtime bank.",
            },
        )

    result = generate_card_coach_hint(
        user_id=user_id,
        card_id=context["card_id"],
        front_text=context["front_text"],
        prompt=context["prompt"],
        content_type=context["content_type"],
        ui_language=payload.ui_language,
        existing_hint=payload.existing_hint,
        correct_answer=context["correct_answer"],
        options=context["options"],
    )
    _CARD_HINT_LOG.info(
        "card_hint_generated card_id=%s content_type=%s ui_language=%s provider=%s model=%s reason=%s quality_warning=%s options_count=%s",
        context["card_id"],
        context["content_type"],
        payload.ui_language,
        result.get("provider"),
        result.get("model"),
        result.get("reason"),
        result.get("quality_warning"),
        len(context.get("options") or []),
    )
    return result


@router.post('/flag')
def flag_card(payload: CardFlagRequest, authorization: str | None = Header(default=None)):
    return cards_service.report_card_issue(user_id=_require_cards_user_id(authorization), card_id=payload.card_id, reason=payload.reason, note=payload.note, session_id=payload.session_id)
