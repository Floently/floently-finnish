"""Server-side RevenueCat V1 subscriber verification for KieliValmis iOS.

This module is intentionally independent of the HTTP router and user database.
The authenticated KieliValmis user ID, never a client-selected RevenueCat ID,
is the only accepted subscriber identifier. No network calls happen at import.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Mapping
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from app.core.utils import parse_iso, utc_now

REVENUECAT_API_V1 = "https://api.revenuecat.com/v1"
IOS_PRODUCT_CONTRACT: dict[str, tuple[str, str]] = {
    "floently_yki_monthly": ("yki_monthly", "yki_access"),
    "floently_yki_3months": ("yki_3_months", "yki_access"),
    "floently_yki_yearly": ("yki_yearly", "yki_access"),
    "floently_prof_monthly": ("professional_monthly", "professional_access"),
    "floently_prof_3months": ("professional_3_months", "professional_access"),
    "floently_prof_yearly": ("professional_yearly", "professional_access"),
    "floently_combo_monthly": ("combined_monthly", "combined_access"),
    "floently_combo_3months": ("combined_3_months", "combined_access"),
    "floently_combo_yearly": ("combined_yearly", "combined_access"),
}


class RevenueCatVerificationError(RuntimeError):
    """A store subscription cannot be confirmed from authoritative evidence."""


@dataclass(frozen=True)
class VerifiedAppleSubscription:
    app_user_id: str
    product_id: str
    plan_id: str
    entitlement_id: str
    period_type: str
    purchased_at: str
    expires_at: str
    status: str  # trialing, active, grace_period, expired, or refunded
    cancellation_detected_at: str | None
    billing_issue_detected_at: str | None
    is_sandbox: bool

    @property
    def grants_access(self) -> bool:
        return self.status in {"trialing", "active", "grace_period"}


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    parsed = parse_iso(value.strip())
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _iso(value: Any) -> str | None:
    parsed = _timestamp(value)
    return parsed.isoformat() if parsed is not None else None


def fetch_revenuecat_v1_subscriber(
    *,
    app_user_id: str,
    secret_api_key: str,
    timeout: float = 6.0,
    opener: Callable[..., Any] | None = None,
) -> dict[str, Any]:
    """GET the logged-in user's subscriber from RevenueCat; never log the key."""
    user_id = str(app_user_id or "").strip()
    key = str(secret_api_key or "").strip()
    if not user_id or not key:
        raise RevenueCatVerificationError("Subscriber identity or server API key is unavailable.")
    if timeout <= 0 or timeout > 30:
        raise RevenueCatVerificationError("Invalid RevenueCat request timeout.")
    req = Request(
        f"{REVENUECAT_API_V1}/subscribers/{quote(user_id, safe='')}",
        headers={"Authorization": f"Bearer {key}", "Accept": "application/json"},
        method="GET",
    )
    try:
        with (opener or urlopen)(req, timeout=timeout) as response:
            body = response.read()
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        # Intentionally omit response body, headers and credentials.
        raise RevenueCatVerificationError("RevenueCat subscriber verification unavailable.") from exc
    if len(body) > 1024 * 1024:
        raise RevenueCatVerificationError("RevenueCat subscriber response is too large.")
    try:
        payload = json.loads(body)
    except (ValueError, UnicodeError) as exc:
        raise RevenueCatVerificationError("RevenueCat subscriber returned invalid JSON.") from exc
    if not isinstance(payload, dict) or not isinstance(payload.get("subscriber"), dict):
        raise RevenueCatVerificationError("RevenueCat subscriber response has invalid shape.")
    return payload


def verify_apple_subscriber(
    *,
    app_user_id: str,
    payload: Mapping[str, Any],
    expected_plan_id: str | None = None,
    now: datetime | None = None,
) -> VerifiedAppleSubscription | None:
    """Return verified StoreKit state, None if no known product exists.

    A known product with inconsistent entitlement, a wrong store, or malformed
    purchase/expiration data fails closed. Expired/refunded products are returned
    explicitly, never promoted into an active entitlement.
    """
    user_id = str(app_user_id or "").strip()
    if not user_id:
        raise RevenueCatVerificationError("Authenticated subscriber identity is missing.")
    subscriber = payload.get("subscriber")
    if not isinstance(subscriber, Mapping):
        raise RevenueCatVerificationError("RevenueCat subscriber is missing.")
    subscriptions = subscriber.get("subscriptions")
    entitlements = subscriber.get("entitlements")
    if not isinstance(subscriptions, Mapping) or not isinstance(entitlements, Mapping):
        raise RevenueCatVerificationError("RevenueCat purchase or entitlement data is missing.")

    current = now or utc_now()
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    current = current.astimezone(timezone.utc)

    known: list[tuple[datetime, VerifiedAppleSubscription]] = []
    for raw_product, raw_subscription in subscriptions.items():
        product = str(raw_product)
        if product not in IOS_PRODUCT_CONTRACT:
            continue
        if not isinstance(raw_subscription, Mapping):
            raise RevenueCatVerificationError("Known Apple subscription has invalid data.")
        plan_id, entitlement_id = IOS_PRODUCT_CONTRACT[product]
        if expected_plan_id and plan_id != expected_plan_id:
            continue
        if str(raw_subscription.get("store") or "").lower() != "app_store":
            raise RevenueCatVerificationError("Known Apple product has an unexpected store.")
        period = str(raw_subscription.get("period_type") or "").lower().strip()
        if period not in {"trial", "normal", "intro", "promotional", "prepaid"}:
            raise RevenueCatVerificationError("Known Apple subscription has invalid period type.")
        purchased = _timestamp(raw_subscription.get("purchase_date"))
        expires = _timestamp(raw_subscription.get("expires_date"))
        if purchased is None or expires is None:
            raise RevenueCatVerificationError("Subscription purchase or expiration is missing.")
        if purchased > current:
            raise RevenueCatVerificationError("Subscription purchase date is in the future.")
        refunded = _timestamp(raw_subscription.get("refunded_at")) is not None
        grace = _timestamp(raw_subscription.get("grace_period_expires_date"))
        # RevenueCat retains historical subscriptions after an upgrade. The
        # entitlement points at the CURRENT product only; old expired/refunded
        # products must not block validation of a newly purchased plan.
        entitlement = entitlements.get(entitlement_id)
        if expires > current and not refunded:
            if not isinstance(entitlement, Mapping):
                raise RevenueCatVerificationError("Known Apple subscription is missing its mapped entitlement.")
            if str(entitlement.get("product_identifier") or "") != product:
                raise RevenueCatVerificationError("Apple subscription entitlement/product mismatch.")
            entitlement_expiry = _timestamp(entitlement.get("expires_date"))
            if entitlement_expiry is None:
                raise RevenueCatVerificationError("Subscription entitlement expiration is missing.")
        else:
            entitlement_expiry = expires
            if isinstance(entitlement, Mapping) and str(entitlement.get("product_identifier") or "") == product:
                entitlement_expiry = _timestamp(entitlement.get("expires_date")) or expires

        in_grace = bool(grace and grace > current and entitlement_expiry > current and not refunded)
        effective_expiry = (
            min(grace, entitlement_expiry)
            if in_grace and grace is not None and expires <= current
            else min(expires, entitlement_expiry)
        )
        if refunded:
            status = "refunded"
        elif in_grace and expires <= current:
            status = "grace_period"
        elif effective_expiry <= current:
            status = "expired"
        else:
            status = "trialing" if period == "trial" else "active"

        record = VerifiedAppleSubscription(
            app_user_id=user_id,
            product_id=product,
            plan_id=plan_id,
            entitlement_id=entitlement_id,
            period_type=period,
            purchased_at=purchased.isoformat(),
            expires_at=effective_expiry.isoformat(),
            status=status,
            cancellation_detected_at=_iso(raw_subscription.get("unsubscribe_detected_at")),
            billing_issue_detected_at=_iso(raw_subscription.get("billing_issues_detected_at")),
            is_sandbox=bool(raw_subscription.get("is_sandbox")),
        )
        known.append((purchased, record))

    if not known:
        if expected_plan_id:
            raise RevenueCatVerificationError("Expected subscription was not verified for this user.")
        return None
    known.sort(key=lambda pair: pair[0], reverse=True)
    if expected_plan_id:
        return known[0][1]
    # An active subscription takes precedence over stale expired products.
    for _, record in known:
        if record.grants_access:
            return record
    return known[0][1]
