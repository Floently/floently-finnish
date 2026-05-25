from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, Request

from app.middleware.request_id import get_request_id
from app.core.responses import success_payload
from app.core.errors import AppError
from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import (
    PLAN_CATALOG,
    billing_checkout_session,
    billing_portal_url,
    cancel_trial_at_period_end,
    check_feature,
    resume_subscription_renewal,
    apply_store_subscription_sync,
    subscription_status,
    track_usage_event,
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
        return success_payload(
            data=billing_checkout_session(payload=payload, user_id=user["user_id"]),
            request_id=get_request_id(request),
        )

    @router.post("/subscription/trial")
    async def start_subscription_trial(
        request: Request,
        payload: dict[str, Any],
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        current_status = subscription_status(user=user)
        if current_status.get("trial_used") or current_status.get("trialUsed"):
            raise AppError(
                409,
                "TRIAL_ALREADY_USED",
                "Trial already used. Choose a paid subscription to continue.",
                False,
                {
                    "classification": "non_retryable",
                    "trial_used": True,
                    "trialUsed": True,
                    "can_start_trial": False,
                    "canStartTrial": False,
                    "trial_already_used": True,
                    "trialAlreadyUsed": True,
                },
            )
        # Trials are now started through Stripe Checkout so users enter payment
        # details first and are charged only after the 3-day trial ends.
        # Keep this endpoint as a harmless 200 response for older clients.
        return success_payload(
            data={
                "checkout_required": True,
                "message": "Start the 3-day trial through Stripe Checkout.",
                "subscription": subscription_status(user=user),
            },
            request_id=get_request_id(request),
        )

    @router.post("/subscription/cancel-trial")
    async def cancel_subscription_trial(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(
            data=cancel_trial_at_period_end(user=user),
            request_id=get_request_id(request),
        )

    @router.post("/subscription/reactivate")
    async def reactivate_subscription(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(
            data=resume_subscription_renewal(user=user),
            request_id=get_request_id(request),
        )


    @router.post("/subscription/store/sync")
    async def sync_store_subscription(
        request: Request,
        payload: dict[str, Any],
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(
            data=apply_store_subscription_sync(user=user, payload=payload),
            request_id=get_request_id(request),
        )

    @router.post("/tracking/event")
    async def create_tracking_event(
        request: Request,
        payload: dict[str, Any],
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(
            data=track_usage_event(
                user=user,
                event_type=str(payload.get("event_type") or payload.get("eventType") or "event"),
                feature=payload.get("feature"),
                screen=payload.get("screen"),
                profession=payload.get("profession"),
                session_id=payload.get("session_id") or payload.get("sessionId"),
                metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
            ),
            request_id=get_request_id(request),
        )

    @router.post("/subscription/portal")
    async def create_portal_session(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(
            data={
                "url": billing_portal_url(user_id=user["user_id"]),
                "portal_url": None,
                "mode": "configured",
            },
            request_id=get_request_id(request),
        )

    return router
