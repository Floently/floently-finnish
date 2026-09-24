"""Webhook must authenticate raw bytes before it may trigger any billing sync."""
from __future__ import annotations

import hashlib
import hmac
import json

import pytest

from app.services.revenuecat_webhook_auth import (
    RevenueCatWebhookAuthenticationError,
    authenticate_revenuecat_webhook,
)


AUTH = "Bearer separate-webhook-token"
HMAC_SECRET = "independent-hmac-secret"
STAMP = 1790250000


def message(*, event_id="evt_01") -> bytes:
    return json.dumps(
        {"api_version": "1.0", "event": {"id": event_id, "type": "RENEWAL", "app_user_id": "user-01"}},
        separators=(",", ":"),
    ).encode()


def signature(raw: bytes, *, secret=HMAC_SECRET, stamp=STAMP) -> str:
    mac = hmac.new(secret.encode(), str(stamp).encode() + b"." + raw, hashlib.sha256).hexdigest()
    return f"t={stamp},v1={mac}"


def check(raw=None, *, auth=AUTH, secret=HMAC_SECRET, sig=None, now=STAMP):
    body = message() if raw is None else raw
    return authenticate_revenuecat_webhook(
        raw_body=body,
        authorization_header=auth,
        signature_header=signature(body) if sig is None else sig,
        expected_authorization=AUTH,
        signing_secret=secret,
        now_seconds=now,
    )


def test_valid_signed_revenuecat_notification_passes_without_granting_access():
    event = check()
    assert event["event"]["id"] == "evt_01"
    assert event["event"]["type"] == "RENEWAL"


@pytest.mark.parametrize("provided", [None, "", "Bearer wrong", "separate-webhook-token"])
def test_missing_or_wrong_authorization_fails(provided):
    with pytest.raises(RevenueCatWebhookAuthenticationError):
        check(auth=provided)


@pytest.mark.parametrize("secret", [None, ""])
def test_missing_hmac_config_fails_closed(secret):
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="not configured"):
        check(secret=secret)


@pytest.mark.parametrize("sig", [None, "", "broken", "t=1,v1=invalid"])
def test_invalid_signature_is_rejected(sig):
    with pytest.raises(RevenueCatWebhookAuthenticationError):
        check(sig=sig if sig is not None else "")


def test_wrong_hmac_secret_is_rejected():
    body = message()
    with pytest.raises(RevenueCatWebhookAuthenticationError):
        check(body, sig=signature(body, secret="wrong"))


def test_tampered_body_is_rejected_even_with_valid_authorization():
    original = message()
    tampered = original.replace(b"RENEWAL", b"EXPIRATION")
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="mismatch"):
        check(tampered, sig=signature(original))


@pytest.mark.parametrize("offset", [-301, 301])
def test_replayed_delivery_outside_five_minute_window_rejected(offset):
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="expired"):
        check(now=STAMP + offset)


def test_valid_delivery_within_tolerance_passes():
    assert check(now=STAMP + 299)["event"]["id"] == "evt_01"


def test_wrong_body_shape_is_rejected_after_valid_signature():
    raw = b'{"event":null}'
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="missing"):
        check(raw)


def test_missing_event_id_is_rejected():
    raw = message(event_id="")
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="identifier"):
        check(raw)


def test_oversized_body_is_rejected_without_parsing():
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="too large"):
        check(b"x" * (256 * 1024 + 1))


def test_webhook_requires_exact_bytes_not_reserialized_json():
    body = message()
    pretty = json.dumps(json.loads(body), indent=2).encode()
    with pytest.raises(RevenueCatWebhookAuthenticationError, match="mismatch"):
        check(pretty, sig=signature(body))
