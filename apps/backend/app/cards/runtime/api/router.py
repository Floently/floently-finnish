from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.cards.adaptive.services.state_store import AdaptiveStateStoreError
from app.cards.observability import increment_metric, log_card_event
from app.cards.publication.deck_publication_service import DeckPublicationService, DeckPublicationServiceError
from app.cards.publication.models import (
    PublicationActionResponse,
    PublicationOverviewResponse,
    PublishDatasetRequest,
)
from app.core.request_context import get_request_id
from app.cards.runtime.models.api_models import (
    AdaptiveCardSessionResponse,
    AnswerRequest,
    AnswerResponse,
    CardSessionResponse,
    DeckResponse,
    ErrorResponse,
    NextCardResponse,
    SessionStartRequest,
)
from app.cards.runtime.rate_limit import CardRateLimitError
from app.cards.runtime.repositories import CardRepositoryError
from app.cards.runtime.repositories.session_repository import CardSessionRepositoryError
from app.cards.runtime.services import CardRuntimeService
from app.cards.runtime.session_engine import CardSessionEngineError
from app.cards.schemas.common import CardContentType, LearningPath, LevelBand, ProfessionTrack
from app.db.database import get_session
from app.db.models import User

router = APIRouter(prefix="/cards", tags=["cards"])
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    from app.core.auth_dependencies import get_current_user as _get_current_user

    return await _get_current_user(credentials=credentials, session=session)


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    from app.core.auth_dependencies import get_current_admin_user as _get_current_admin_user

    return await _get_current_admin_user(current_user=current_user)


@lru_cache(maxsize=1)
def get_cards_service() -> CardRuntimeService:
    return CardRuntimeService()


@lru_cache(maxsize=1)
def get_publication_service() -> DeckPublicationService:
    return DeckPublicationService()


@router.post(
    "/session/start",
    response_model=CardSessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
)
async def start_card_session(
    request: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    service: CardRuntimeService = Depends(get_cards_service),
) -> CardSessionResponse:
    try:
        return await service.start_session(
            user_id=current_user.id,
            domain=LearningPath(request.domain),
            content_type=CardContentType(request.content_type) if request.content_type else None,
            profession=ProfessionTrack(request.profession) if request.profession else None,
            level_band=LevelBand(request.level) if request.level else None,
        )
    except CardRateLimitError as exc:
        raise _runtime_error(status.HTTP_429_TOO_MANY_REQUESTS, "rate_limited", str(exc))
    except (CardRepositoryError, CardSessionEngineError, CardSessionRepositoryError, AdaptiveStateStoreError) as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "cards_not_found", str(exc))


@router.get(
    "/session/adaptive/start",
    response_model=AdaptiveCardSessionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
)
async def start_adaptive_card_session(
    domain: str,
    content_type: str | None = None,
    profession: str | None = None,
    level: str | None = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    service: CardRuntimeService = Depends(get_cards_service),
) -> AdaptiveCardSessionResponse:
    try:
        return await service.start_adaptive_session(
            user_id=current_user.id,
            domain=LearningPath(domain),
            content_type=CardContentType(content_type) if content_type else None,
            profession=ProfessionTrack(profession) if profession else None,
            level_band=LevelBand(level) if level else None,
            limit=limit,
        )
    except ValueError as exc:
        raise _runtime_error(status.HTTP_400_BAD_REQUEST, "invalid_filters", str(exc))
    except CardRateLimitError as exc:
        raise _runtime_error(status.HTTP_429_TOO_MANY_REQUESTS, "rate_limited", str(exc))
    except (CardRepositoryError, CardSessionEngineError, CardSessionRepositoryError, AdaptiveStateStoreError) as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "cards_not_found", str(exc))


@router.get(
    "/session/{session_id}/next",
    response_model=NextCardResponse,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
async def next_card(
    session_id: str,
    current_user: User = Depends(get_current_user),
    service: CardRuntimeService = Depends(get_cards_service),
) -> NextCardResponse:
    try:
        return await service.get_next_card(session_id=session_id, user_id=current_user.id)
    except (CardSessionEngineError, CardSessionRepositoryError) as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "invalid_session", str(exc))
    except CardRepositoryError as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "card_lookup_failed", str(exc))


@router.post(
    "/session/{session_id}/answer",
    response_model=AnswerResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
    },
)
async def answer_card(
    session_id: str,
    request: AnswerRequest,
    current_user: User = Depends(get_current_user),
    service: CardRuntimeService = Depends(get_cards_service),
) -> AnswerResponse:
    try:
        return await service.answer_current_card(
            session_id=session_id,
            user_id=current_user.id,
            user_answer=request.user_answer,
        )
    except CardRateLimitError as exc:
        raise _runtime_error(status.HTTP_429_TOO_MANY_REQUESTS, "rate_limited", str(exc))
    except (CardSessionRepositoryError, AdaptiveStateStoreError) as exc:
        raise _runtime_error(status.HTTP_500_INTERNAL_SERVER_ERROR, "persistence_failure", str(exc))
    except CardSessionEngineError as exc:
        message = str(exc)
        if "Unknown session_id" in message:
            raise _runtime_error(status.HTTP_404_NOT_FOUND, "invalid_session", message)
        if "not active" in message:
            raise _runtime_error(status.HTTP_409_CONFLICT, "session_inactive", message)
        raise _runtime_error(status.HTTP_400_BAD_REQUEST, "invalid_answer", message)
    except CardRepositoryError as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "card_lookup_failed", str(exc))


@router.get(
    "/deck",
    response_model=DeckResponse,
    responses={404: {"model": ErrorResponse}},
)
async def deck(
    domain: str,
    content_type: str | None = None,
    profession: str | None = None,
    level: str | None = None,
    source: str | None = None,
    current_user: User = Depends(get_current_user),
    service: CardRuntimeService = Depends(get_cards_service),
) -> DeckResponse:
    try:
        return await service.list_cards(
            user_id=current_user.id,
            domain=LearningPath(domain),
            content_type=CardContentType(content_type) if content_type else None,
            profession=ProfessionTrack(profession) if profession else None,
            level_band=LevelBand(level) if level else None,
            source=source,
        )
    except ValueError as exc:
        raise _runtime_error(status.HTTP_400_BAD_REQUEST, "invalid_filters", str(exc))
    except CardRepositoryError as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "cards_not_found", str(exc))


@router.get(
    "/runtime",
    response_model=DeckResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def runtime_deck(
    domain: str | None = None,
    content_type: str | None = None,
    profession: str | None = None,
    level: str | None = None,
    source: str | None = None,
    current_user: User = Depends(get_current_user),
    service: CardRuntimeService = Depends(get_cards_service),
) -> DeckResponse:
    try:
        return await service.list_cards(
            user_id=current_user.id,
            domain=LearningPath(domain) if domain else None,
            content_type=CardContentType(content_type) if content_type else None,
            profession=ProfessionTrack(profession) if profession else None,
            level_band=LevelBand(level) if level else None,
            source=source,
        )
    except ValueError as exc:
        raise _runtime_error(status.HTTP_400_BAD_REQUEST, "invalid_filters", str(exc))
    except CardRepositoryError as exc:
        raise _runtime_error(status.HTTP_404_NOT_FOUND, "cards_not_found", str(exc))


@router.get(
    "/admin/publication",
    response_model=PublicationOverviewResponse,
    responses={500: {"model": ErrorResponse}},
)
async def card_publication_overview(
    current_admin: User = Depends(get_current_admin_user),
    service: DeckPublicationService = Depends(get_publication_service),
) -> PublicationOverviewResponse:
    try:
        return await service.list_overview()
    except DeckPublicationServiceError as exc:
        raise _runtime_error(status.HTTP_500_INTERNAL_SERVER_ERROR, "publication_overview_failed", str(exc))


@router.post(
    "/admin/publish",
    response_model=PublicationActionResponse,
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
async def publish_card_dataset(
    request: PublishDatasetRequest,
    current_admin: User = Depends(get_current_admin_user),
    service: DeckPublicationService = Depends(get_publication_service),
) -> PublicationActionResponse:
    try:
        return await service.publish_validated_source(
            published_by_user_id=current_admin.id,
            dataset_name=request.dataset_name,
            version_label=request.version_label,
            notes=request.notes,
        )
    except DeckPublicationServiceError as exc:
        message = str(exc)
        status_code = status.HTTP_409_CONFLICT if "already exists" in message else status.HTTP_400_BAD_REQUEST
        raise _runtime_error(status_code, "publish_failed", message)


@router.post(
    "/admin/datasets/{dataset_version_id}/archive",
    response_model=PublicationActionResponse,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
async def archive_card_dataset(
    dataset_version_id: str,
    current_admin: User = Depends(get_current_admin_user),
    service: DeckPublicationService = Depends(get_publication_service),
) -> PublicationActionResponse:
    try:
        return await service.archive_dataset(dataset_version_id, archived_by_user_id=current_admin.id)
    except DeckPublicationServiceError as exc:
        message = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if "Unknown dataset" in message else status.HTTP_409_CONFLICT
        raise _runtime_error(status_code, "archive_failed", message)


def _runtime_error(status_code: int, code: str, message: str) -> HTTPException:
    increment_metric("cards.api_error", code=code)
    log_card_event("cards.api_error", status_code=status_code, code=code, message=message)
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
            "request_id": get_request_id(),
            "details": {},
        },
    )
