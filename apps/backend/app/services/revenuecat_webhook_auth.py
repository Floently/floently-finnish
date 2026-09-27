"""Authenticate RevenueCat webhooks before parsing or reconciling any event.

RevenueCat's configured Authorization header and the optional dashboard HMAC
signing secret are deliberately separate from the RevenueCat REST V1 API key.
This release requires BOTH controls: missing configuration fails closed.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import time
from typing import Any


class RevenueCatWebhookAuthenticationError(ValueError):
    """Webhook request cannot be trusted. Never echo credentials or raw event."""


_SIGNATURE_PATTERN = re.compile(r"^t=([0-9]{1,20}),v1=([a-fA-F0-9]{64})$")
_MAX_BODY_BYTES = 256 * 1024


def authenticate_revenuecat_webhook(
    *,
    raw_body: bytes,
    authorization_header: str | None,
    signature_header: str | None,
    expected_authorization: str | None,
    signing_secret: str | None,
    now_seconds: int | None = None,
    tolerance_seconds: int = 300,
) -> dict[str, Any]:
    """Verify header + fresh HMAC of `t.<exact raw JSON bytes>`.

    Webhook event data only triggers a subsequent server-side subscriber fetch;
    neither this authentication nor a signed webhook event grants access itself.
    """
    expected = str(expected_authorization or "").strip()
    signing_key = str(signing_secret or "").strip()
    received = str(authorization_header or "").strip()
    if not expected or not signing_key:
        raise RevenueCatWebhookAuthenticationError("Webhook authentication is not configured.")
    if not received or not hmac.compare_digest(received, expected):
        raise RevenueCatWebhookAuthenticationError("Webhook authorization failed.")
    if not isinstance(raw_body, bytes) or not raw_body or len(raw_body) > _MAX_BODY_BYTES:
        raise RevenueCatWebhookAuthenticationError("Webhook body is missing or too large.")
    signature = str(signature_header or "").replace(" ", "")
    match = _SIGNATURE_PATTERN.fullmatch(signature)
    if match is None:
        raise RevenueCatWebhookAuthenticationError("Webhook signature is missing or invalid.")
    timestamp_text, received_mac = match.groups()
    issued = int(timestamp_text)
    current = int(time.time() if now_seconds is None else now_seconds)
    if tolerance_seconds <= 0 or abs(current - issued) > tolerance_seconds:
        raise RevenueCatWebhookAuthenticationError("Webhook signature expired.")
    expected_mac = hmac.new(
        signing_key.encode("utf-8"),
        timestamp_text.encode("ascii") + b"." + raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(received_mac.lower(), expected_mac):
        raise RevenueCatWebhookAuthenticationError("Webhook signature mismatch.")
    try:
        parsed = json.loads(raw_body)
    except (ValueError, UnicodeError) as exc:
        raise RevenueCatWebhookAuthenticationError("Webhook JSON is invalid.") from exc
    event = parsed.get("event") if isinstance(parsed, dict) else None
    if not isinstance(event, dict):
        raise RevenueCatWebhookAuthenticationError("Webhook event is missing.")
    event_id = event.get("id")
    event_type = event.get("type")
    if not isinstance(event_id, str) or not event_id.strip():
        raise RevenueCatWebhookAuthenticationError("Webhook event identifier is missing.")
    if not isinstance(event_type, str) or not event_type.strip():
        raise RevenueCatWebhookAuthenticationError("Webhook event type is missing.")
    return parsed
