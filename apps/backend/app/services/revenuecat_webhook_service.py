"""Reconcile authenticated RevenueCat webhook notifications with current server data.

A webhook is a hint to re-fetch a subscriber, not proof of an entitlement.
Always resolve a real local account and fetch RevenueCat through the same
server-only logic used by authenticated purchase/restore requests.
"""
from __future__ import annotations

from typing import Any

from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import utc_now
from app.db import auth_repository
from app.services.subscription_service import apply_store_subscription_sync


def _matching_account(event: dict[str, Any]) -> dict[str, Any] | None:
    raw_ids = [event.get("app_user_id"), event.get("original_app_user_id")]
    aliases = event.get("aliases")
    if isinstance(aliases, list):
        raw_ids.extend(aliases[:100])
    ids = list(dict.fromkeys(
        identifier.strip()
        for identifier in raw_ids
        if isinstance(identifier, str) and identifier.strip()
    ))
    matches: dict[str, dict[str, Any]] = {}
    for uid in ids:
        # Never match on email, transaction ID or client-controlled plan.
        person = auth_repository.AUTH_USERS.get_user_by_id(uid)
        if person is not None:
            matches[str(person["user_id"])] = person
    if len(matches) > 1:
        raise AppError(
            409, "REVENUECAT_IDENTITY_CONFLICT",
            "RevenueCat aliases match multiple accounts; subscription not updated.",
            False, {"classification": "terminal"},
        )
    return next(iter(matches.values()), None)


def reconcile_revenuecat_webhook_event(parsed: dict[str, Any]) -> dict[str, Any]:
    """Idempotent response for a notification authenticated by HMAC + header.

    Call from the dedicated webhook route only AFTER authentication; never
    accept an arbitrary HTTP JSON body directly as a billing decision.
    """
    event = parsed["event"]
    event_id = event["id"]
    event_type = event["type"]
    if not isinstance(event_id, str) or not event_id.strip():
        raise AppError(400, "INVALID_WEBHOOK_EVENT", "Webhook event ID is missing.", False)
    if not isinstance(event_type, str) or not event_type.strip():
        raise AppError(400, "INVALID_WEBHOOK_EVENT", "Webhook event type is missing.", False)

    store = str(event.get("store") or "").strip().upper()
    platform = {"APP_STORE": "ios", "PLAY_STORE": "android"}.get(store)
    if event_type == "TEST" or platform is None:
        return {"received": True, "reconciled": False}

    # Prevent two parallel deliveries from reconciling the same notification.
    with STORE.locked(("revenuecat_webhook_events", event_id)):
        if STORE.get("revenuecat_webhook_events", event_id):
            return {"received": True, "reconciled": True, "duplicate": True}
        user = _matching_account(event)
        if user is None:
            # This may be an anonymous customer not yet linked to an app login.
            # Treat it as a benign event, never create/grant a local account.
            return {"received": True, "reconciled": False}
        try:
            apply_store_subscription_sync(user=user, payload={"platform": platform})
        except AppError as exc:
            # A store fetch failure must remain retryable so RevenueCat can
            # redeliver; never acknowledge a failed reconciliation as a success.
            if exc.retryable:
                raise
            raise AppError(
                503,
                "STORE_WEBHOOK_RECONCILIATION_FAILED",
                "Store state could not be reconciled. Please retry.",
                True,
                {"classification": "retryable"},
            ) from exc
        STORE.set("revenuecat_webhook_events", event_id, {
            "processed_at": utc_now().replace(microsecond=0).isoformat(),
            "platform": platform,
            "type": event_type,
        })
        STORE.write_snapshot()
    return {"received": True, "reconciled": True}
