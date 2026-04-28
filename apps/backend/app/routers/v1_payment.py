from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, Request

from app.core.responses import success_payload
from app.middleware.request_id import get_request_id
from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import payment_status


def build_payment_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/payments/status")
    async def get_payment_status(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(data=payment_status(user=user), request_id=get_request_id(request))

    return router
