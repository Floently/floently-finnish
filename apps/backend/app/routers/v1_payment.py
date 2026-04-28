from __future__ import annotations

from typing import Any

try:
    import stripe
except Exception:  # pragma: no cover - optional at import time
    stripe = None

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.config import SETTINGS
from app.core.responses import success_payload
from app.middleware.request_id import get_request_id
from app.services.auth_service import current_user_from_authorization
from app.services.subscription_service import handle_stripe_event, payment_status


def build_payment_router() -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.get("/payments/status")
    async def get_payment_status(request: Request, authorization: str | None = Header(default=None)) -> dict[str, Any]:
        user, _ = current_user_from_authorization(authorization)
        return success_payload(data=payment_status(user=user), request_id=get_request_id(request))

    @router.post("/payments/stripe/webhook")
    async def stripe_webhook(request: Request) -> dict[str, Any]:
        if stripe is None or not SETTINGS.stripe_webhook_secret:
            raise HTTPException(status_code=503, detail="Stripe webhook is not configured.")
        signature = request.headers.get("stripe-signature")
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature header.")
        payload = await request.body()
        try:
            event = stripe.Webhook.construct_event(payload, signature, SETTINGS.stripe_webhook_secret)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature.") from exc
        result = handle_stripe_event(event)
        return success_payload(
            data={
                "received": True,
                "event_type": result.get("event_type"),
                "handled": result.get("handled", True),
                "result": result,
            },
            request_id=get_request_id(request),
        )

    return router
