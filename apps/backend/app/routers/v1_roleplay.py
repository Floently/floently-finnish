"""Canonical roleplay routes served under /api/v1/roleplay/session/*."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.core.config import SETTINGS
from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import require_feature
from app.services.tts.voice_registry import (
    encode_resolved_voice_profile,
    resolve_voice_identity,
)
from app.runtime.roleplay import (
    list_scenarios as runtime_list_scenarios,
    start_session as runtime_start_session,
    submit_turn as runtime_submit_turn,
    finish_session as runtime_finish_session,
)


class RoleplaySessionStartRequest(BaseModel):
    profession: str
    level_band: str
    scenario_id: str | None = None
    context_label: str | None = None


class RoleplayTurnSubmitRequest(BaseModel):
    transcript: str


def _attach_voice_identity(result: dict[str, Any]) -> dict[str, Any]:
    """Attach one deterministic preferred TTS identity to a roleplay payload.

    ``voiceIdentity`` is the structured forward contract. ``voiceProfile`` is
    also replaced with a versioned resolved-voice transport token so already-
    shipped clients, which only forward that legacy string, still request the
    exact provider voice selected for this persona.
    """
    scenario = result.get("scenario") if isinstance(result.get("scenario"), dict) else {}
    persona_id = str(
        result.get("personaId")
        or result.get("persona_id")
        or scenario.get("personaId")
        or ""
    ).strip()
    display_name = str(
        result.get("personaName")
        or result.get("persona_name")
        or scenario.get("personaName")
        or "AI"
    ).strip() or "AI"
    gender = str(
        result.get("personaGender")
        or result.get("persona_gender")
        or scenario.get("personaGender")
        or ""
    ).strip().lower()
    voice_profile = str(
        result.get("semanticVoiceProfile")
        or result.get("voiceProfile")
        or result.get("voice_profile")
        or ""
    ).strip()

    if not persona_id or gender not in {"male", "female"} or not voice_profile:
        return result

    provider = str(SETTINGS.tts_default_provider or "google").strip().lower() or "google"
    if provider not in {"google", "openai"}:
        provider = "google"

    identity = resolve_voice_identity(
        persona_id=persona_id,
        display_name=display_name,
        gender=gender,
        voice_profile=voice_profile,
        provider=provider,
    )
    result["voiceIdentity"] = {
        "identityId": identity["identity_id"],
        "personaId": identity["persona_id"],
        "displayName": identity["display_name"],
        "gender": identity["gender"],
        "language": identity["language"],
        "voiceProfile": identity["voice_profile"],
        "provider": identity["provider"],
        "providerVoiceId": identity["provider_voice_id"],
        "registryVersion": identity["registry_version"],
        "genderCertified": identity["gender_certified"],
    }
    result["semanticVoiceProfile"] = voice_profile
    result["voiceProfile"] = encode_resolved_voice_profile(identity)
    return result


def build_roleplay_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/roleplay/scenarios")
    async def get_roleplay_scenarios_route(
        profession: str = "general",
        level_band: str = "B1-B2",
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="workplace")
        scenarios = runtime_list_scenarios(
            profession=profession,  # type: ignore[arg-type]
            level_band=level_band,  # type: ignore[arg-type]
        )
        return {"scenarios": scenarios}

    @router.post("/roleplay/session/start")
    async def start_roleplay_session_route(
        payload: RoleplaySessionStartRequest,
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        """
        Start a new roleplay session.
        Returns full session start payload including personaName and track.
        """
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="workplace")
        try:
            result = runtime_start_session(
                profession=payload.profession,  # type: ignore[arg-type]
                level_band=payload.level_band,  # type: ignore[arg-type]
                scenario_id=payload.scenario_id,
                context_label=payload.context_label,
                rotation_user_key=str(
                    user.get("user_id")
                    or user.get("email")
                    or "preview"
                ),
            )
        except (ValueError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return _attach_voice_identity(result)

    @router.post("/roleplay/session/{session_id}/turn")
    async def submit_roleplay_turn_route(
        session_id: str,
        payload: RoleplayTurnSubmitRequest,
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        """
        Submit one learner turn. Returns AI reply, personaName, per-turn
        feedback, and completion flag.
        """
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="workplace")
        try:
            return _attach_voice_identity(
                runtime_submit_turn(
                    session_id=session_id,
                    transcript=payload.transcript,
                )
            )
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @router.post("/roleplay/session/{session_id}/finish")
    async def finish_roleplay_session_route(session_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        """
        Finish session and return the full pedagogical feedback report.
        Report includes annotated transcript, scores, grammar observations,
        strong/difficult phrases, and prioritised next steps.
        """
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature="workplace")
        try:
            return _attach_voice_identity(runtime_finish_session(session_id=session_id))
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    return router
