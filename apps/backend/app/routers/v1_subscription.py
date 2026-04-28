from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, Request

from app.middleware.request_id import get_request_id
from app.core.responses import success_payload
from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import (
    PLAN_CATALOG,
    billing_checkout_url,
    billing_portal_url,
    check_feature,
    start_trial,
    subscription_status,
)


def build_subscription_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/subscription/status")
    async def get_subscription_status(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(data=subscription_status(user=user), request_id=get_request_id(request))

    @router.get("/subscription/plans")
    async def get_subscription_plans(request: Request) -> dict[str, Any]:
        return success_payload(data={"plans": PLAN_CATALOG}, request_id=get_request_id(request))

    @router.get("/subscription/check-feature")
    async def check_subscription_feature(request: Request, feature: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(data=check_feature(user=user, feature=feature), request_id=get_request_id(request))

    @router.post("/subscription/checkout")
    async def create_checkout_session(
        request: Request,
        payload: dict[str, Any],
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        plan = str(payload.get("plan") or "free")
        return success_payload(
            data={
                "checkout_url": billing_checkout_url(plan_id=plan, user_id=user["user_id"]),
                "plan": plan,
                "mode": "configured",
            },
            request_id=get_request_id(request),
        )

    @router.post("/subscription/trial")
    async def start_subscription_trial(
        request: Request,
        payload: dict[str, Any],
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        trial_days = int(payload.get("trial_days") or 3)
        return success_payload(
            data=start_trial(user=user, trial_days=trial_days),
            request_id=get_request_id(request),
        )

    @router.post("/subscription/portal")
    async def create_portal_session(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(
            data={
                "portal_url": billing_portal_url(user_id=user["user_id"]),
                "mode": "configured",
            },
            request_id=get_request_id(request),
        )

    return router
