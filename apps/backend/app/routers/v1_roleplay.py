"""Canonical roleplay routes served under /api/v1/roleplay/session/*."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import require_feature
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
            )
        except (ValueError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return result

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
            return runtime_submit_turn(
                session_id=session_id,
                transcript=payload.transcript,
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
            return runtime_finish_session(session_id=session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    return router
