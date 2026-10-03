from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth_dependencies import get_current_user
from app.core.errors import AppError
from app.core.request_context import get_request_id
from app.core.responses import success_payload
from app.db.database import get_session
from app.db.models import User
from app.services.learning_platform.async_service import AsyncLearnerEventService
from app.services.learning_platform.errors import (
    IdempotencyConflict,
    LearnerOwnershipError,
    MissingLearnerIdentity,
)
from app.services.learning_platform.identity import canonical_identity_from_user
from app.services.learning_platform.models import LearnerEvent, parse_aware_iso_datetime
from app.services.learning_platform.sql_repository import SqlAlchemyLearnerEventRepository

router = APIRouter(prefix="/api/v1/learning", tags=["learning-events"])

_ALLOWED_PATHWAYS = {"everyday", "professional", "yki"}
_ALLOWED_SKILLS = {
    "vocabulary",
    "grammar",
    "listening",
    "speaking",
    "reading",
    "writing",
}


def _service(session: AsyncSession) -> AsyncLearnerEventService:
    return AsyncLearnerEventService(
        SqlAlchemyLearnerEventRepository(session)
    )


def _validation_error(message: str) -> AppError:
    return AppError(
        status_code=422,
        code="LEARNING_EVENT_VALIDATION_ERROR",
        message=message,
        retryable=False,
    )


def _translate_boundary_error(exc: Exception) -> AppError:
    if isinstance(exc, LearnerOwnershipError):
        return AppError(
            status_code=403,
            code="LEARNER_OWNERSHIP_MISMATCH",
            message="Learner data belongs to a different authenticated user.",
            retryable=False,
        )
    if isinstance(exc, MissingLearnerIdentity):
        return AppError(
            status_code=401,
            code="LEARNER_IDENTITY_REQUIRED",
            message="An authenticated learner identity is required.",
            retryable=False,
        )
    if isinstance(exc, IdempotencyConflict):
        return AppError(
            status_code=409,
            code="LEARNER_EVENT_IDEMPOTENCY_CONFLICT",
            message=str(exc),
            retryable=False,
        )
    if isinstance(exc, ValueError):
        return _validation_error(str(exc))
    raise exc


@router.post("/events")
async def record_event(
    request: Request,
    payload: dict[str, Any],
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        identity = canonical_identity_from_user(current_user)
        event = LearnerEvent.from_mapping(payload)
        stored, inserted = await _service(session).record_event(
            identity,
            event,
        )
    except Exception as exc:
        raise _translate_boundary_error(exc) from exc

    return success_payload(
        data={
            "event": stored.to_mapping(),
            "inserted": inserted,
        },
        request_id=get_request_id(),
    )


@router.get("/events")
async def list_events(
    request: Request,
    pathway: str | None = None,
    skill: str | None = None,
    since: str | None = None,
    limit: int = Query(default=200, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        identity = canonical_identity_from_user(current_user)

        if pathway is not None and pathway not in _ALLOWED_PATHWAYS:
            raise _validation_error("Unsupported pathway.")
        if skill is not None and skill not in _ALLOWED_SKILLS:
            raise _validation_error("Unsupported skill.")
        if since is not None:
            parse_aware_iso_datetime(since, "since")

        events = await _service(session).list_events(
            identity,
            pathway=pathway,
            skill=skill,
            since=since,
            limit=limit,
        )
    except AppError:
        raise
    except Exception as exc:
        raise _translate_boundary_error(exc) from exc

    return success_payload(
        data={"events": [event.to_mapping() for event in events]},
        request_id=get_request_id(),
    )


@router.get("/events/{event_id}")
async def get_event(
    request: Request,
    event_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        identity = canonical_identity_from_user(current_user)
        event = await _service(session).get_event(identity, event_id)
    except Exception as exc:
        raise _translate_boundary_error(exc) from exc

    if event is None:
        raise AppError(
            status_code=404,
            code="LEARNER_EVENT_NOT_FOUND",
            message="Learner event was not found.",
            retryable=False,
        )

    return success_payload(
        data={"event": event.to_mapping()},
        request_id=get_request_id(),
    )


@router.get("/evidence")
async def list_evidence(
    request: Request,
    pathway: str | None = None,
    skill: str | None = None,
    since: str | None = None,
    limit: int = Query(default=200, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        identity = canonical_identity_from_user(current_user)

        if pathway is not None and pathway not in _ALLOWED_PATHWAYS:
            raise _validation_error("Unsupported pathway.")
        if skill is not None and skill not in _ALLOWED_SKILLS:
            raise _validation_error("Unsupported skill.")
        if since is not None:
            parse_aware_iso_datetime(since, "since")

        evidence = await _service(session).list_evidence(
            identity,
            pathway=pathway,
            skill=skill,
            since=since,
            limit=limit,
        )
    except AppError:
        raise
    except Exception as exc:
        raise _translate_boundary_error(exc) from exc

    return success_payload(
        data={"evidence": [item.to_mapping() for item in evidence]},
        request_id=get_request_id(),
    )
