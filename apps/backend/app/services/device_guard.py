from __future__ import annotations

import logging
import re
from datetime import timedelta
from typing import Any

from app.core.errors import AppError
from app.core.request_context import request_header, request_path
from app.core.state_store import STORE
from app.core.utils import parse_iso, utc_now

ACTIVE_DEVICE_WINDOW_DAYS = 30

PAYMENT_BLOCKED_STATUSES = {"past_due", "unpaid", "incomplete", "incomplete_expired", "canceled"}
_LOG = logging.getLogger("floently.device_guard")

DEVICE_GUARD_EXEMPT_PATH_PREFIXES = (
    # External API paths.
    "/api/v1/auth/session",
    "/api/v1/auth/google",
    "/api/v1/auth/logout",
    "/api/v1/subscription/status",
    "/api/v1/subscription/portal",
    "/api/v1/subscription/checkout",
    "/api/v1/subscription/trial",
    "/api/v1/devices",
    "/api/v1/health",

    # Internal FastAPI paths after reverse-proxy/API-prefix handling.
    "/auth/session",
    "/auth/google",
    "/auth/logout",
    "/subscription/status",
    "/subscription/portal",
    "/subscription/checkout",
    "/subscription/trial",
    "/devices",
    "/health",
)


def _device_guard_exempt_request() -> bool:
    path = str(request_path() or "").strip()
    if not path:
        return False
    return any(path.startswith(prefix) for prefix in DEVICE_GUARD_EXEMPT_PATH_PREFIXES)



def _sanitize_device_id(value: str | None) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    cleaned = re.sub(r"[^A-Za-z0-9._:-]", "_", raw)[:160]
    return cleaned or None


def _sanitize_platform(value: str | None) -> str:
    raw = str(value or "unknown").strip().lower()
    if raw not in {"web", "android", "ios", "unknown"}:
        return "unknown"
    return raw


def _is_payment_blocked(status: Any) -> bool:
    return str(status or "").strip().lower() in PAYMENT_BLOCKED_STATUSES


def _is_trial_user(user: dict[str, Any]) -> bool:
    return bool(user.get("is_trial") or user.get("trial_ends_at") or user.get("trial_started_at"))


def _is_paid_user(user: dict[str, Any]) -> bool:
    if _is_payment_blocked(user.get("subscription_status")):
        return False
    tier = str(user.get("effective_tier") or user.get("subscription_tier") or "").strip().lower()
    if tier and tier not in {"free", "trial", "none"}:
        return True
    return bool(user.get("has_any_subscription") or user.get("is_active") or user.get("is_internal_all_access"))


def _is_internal_all_access_user(user: dict[str, Any]) -> bool:
    if bool(user.get("is_internal_all_access")):
        return True

    tier = str(
        user.get("effective_tier")
        or user.get("subscription_tier")
        or user.get("billing_tier")
        or user.get("tier")
        or ""
    ).strip().lower()

    if tier in {"internal_all_access", "all_access", "test_all_access"}:
        return True

    email = str(user.get("email") or "").strip().lower()
    internal_emails = {
        "learn@obum.floently.com",
        "vitus.idi@yahoo.com",
    }
    internal_usernames = {
        "testuser",
    }

    username = str(
        user.get("username")
        or user.get("name")
        or user.get("display_name")
        or user.get("user_id")
        or ""
    ).strip().lower()

    return email in internal_emails or username in internal_usernames


def device_limit_for_user(user: dict[str, Any]) -> int:
    if _is_internal_all_access_user(user):
        return 999
    if _is_paid_user(user):
        return 2
    return 1


def _active_device_records_for_user(user_id: str) -> dict[str, dict[str, Any]]:
    cutoff = utc_now() - timedelta(days=ACTIVE_DEVICE_WINDOW_DAYS)
    result: dict[str, dict[str, Any]] = {}

    for key, payload in list(STORE._data.get("client_devices", {}).items()):
        if not isinstance(payload, dict):
            continue
        if str(payload.get("user_id") or "") != user_id:
            continue
        last_seen = parse_iso(payload.get("last_seen_at"))
        if not last_seen or last_seen < cutoff:
            continue
        result[str(key)] = payload

    return result


def enforce_client_device_access(*, user: dict[str, Any], token_payload: dict[str, Any]) -> None:
    if _device_guard_exempt_request():
        return

    user_id = str(user.get("user_id") or token_payload.get("user_id") or "").strip()
    if not user_id:
        return

    device_id = _sanitize_device_id(request_header("x-floently-device-id"))
    platform = _sanitize_platform(request_header("x-floently-client-platform"))

    if not device_id:
        _LOG.warning("device_guard_block_missing_device_id user_id=%s platform=%s", user_id, platform)
        raise AppError(
            403,
            "DEVICE_ID_REQUIRED",
            "This app version must identify the device before access can continue. Please update or restart the app.",
            False,
            {"classification": "terminal"},
        )

    limit = device_limit_for_user(user)
    key = f"{user_id}:{device_id}"
    now = utc_now().replace(microsecond=0).isoformat()

    with STORE.locked(("client_devices", key)):
        active = _active_device_records_for_user(user_id)
        if key not in active and len(active) >= limit:
            # Release-safe behaviour: never hard-lock a valid user out of the app.
            # If the account has too many active devices, remove the oldest active
            # device records until the current device can be registered.
            sorted_active = sorted(
                active.items(),
                key=lambda item: str(item[1].get("last_seen_at") or item[1].get("first_seen_at") or ""),
            )
            removed_keys: list[str] = []
            while key not in active and len(active) >= max(1, limit) and sorted_active:
                old_key, _old_payload = sorted_active.pop(0)
                STORE.delete("client_devices", old_key)
                active.pop(old_key, None)
                removed_keys.append(old_key)

            if removed_keys:
                _LOG.warning(
                    "device_guard_auto_pruned_old_devices user_id=%s platform=%s limit=%s removed_count=%s",
                    user_id,
                    platform,
                    limit,
                    len(removed_keys),
                )

        existing = STORE.get_ref("client_devices", key) or {}
        first_seen_at = existing.get("first_seen_at") or now
        STORE.set(
            "client_devices",
            key,
            {
                "user_id": user_id,
                "device_id": device_id,
                "platform": platform,
                "first_seen_at": first_seen_at,
                "last_seen_at": now,
                "auth_session_id": token_payload.get("auth_session_id"),
            },
        )

    try:
        STORE.write_snapshot()
    except Exception:
        pass
