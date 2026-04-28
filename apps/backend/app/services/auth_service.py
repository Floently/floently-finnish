from __future__ import annotations

import hashlib
import json
import secrets
from datetime import timedelta
from typing import Any
from urllib import parse, request

from ..core.config import SETTINGS
from ..core.errors import AppError
from ..core.paths import RUNTIME_DIR
from ..core.state_store import STORE
from ..core.utils import PasswordHashError, hash_password, iso_now, new_id, normalize_email, parse_iso, utc_now, verify_password
from .password_reset_email_service import build_password_reset_links, send_password_reset_email


AUTH_GUARD_KEY = "__auth__"
PASSWORD_RESET_NEUTRAL_MESSAGE = "If an account exists for this email, we have sent password reset instructions."
EMAIL_VERIFICATION_NEUTRAL_MESSAGE = "If an account exists for this email, we have sent verification instructions."


def auth_methods() -> list[dict[str, Any]]:
    methods = [{
        "method_id": "password",
        "kind": "password",
        "enabled": True,
        "display_name": "Email and password",
    }]
    provider_ids = list(SETTINGS.auth_provider_ids)
    if SETTINGS.google_oauth_valid_audiences() and "google" not in provider_ids:
        provider_ids.append("google")
    for provider in provider_ids:
        methods.append(
            {
                "method_id": provider,
                "kind": "provider",
                "enabled": True,
                "display_name": provider.replace("_", " ").title(),
            }
        )
    return methods


def _auth_lock_items(*items: tuple[str, str]) -> tuple[tuple[str, str], ...]:
    return (
        ("users", AUTH_GUARD_KEY),
        ("auth_sessions", AUTH_GUARD_KEY),
        ("access_tokens", AUTH_GUARD_KEY),
        ("refresh_tokens", AUTH_GUARD_KEY),
        *items,
    )


def _persist_auth_state() -> None:
    STORE.write_snapshot()


def _bootstrap_password_user_payloads() -> list[dict[str, Any]]:
    raw = str(SETTINGS.auth_bootstrap_password_users_json or "").strip()
    if not raw:
        runtime_bootstrap_path = RUNTIME_DIR / "auth_bootstrap_password_users.json"
        if runtime_bootstrap_path.exists():
            try:
                raw = runtime_bootstrap_path.read_text(encoding="utf-8").strip()
            except Exception:
                raw = ""
    if not raw:
        return []
    try:
        payload = json.loads(raw)
    except Exception as exc:
        raise AppError(500, "AUTH_BOOTSTRAP_INVALID", "AUTH_BOOTSTRAP_PASSWORD_USERS_JSON is invalid JSON.", False, {"classification": "terminal"}) from exc
    if isinstance(payload, dict):
        payload = [payload]
    if not isinstance(payload, list):
        raise AppError(500, "AUTH_BOOTSTRAP_INVALID", "AUTH_BOOTSTRAP_PASSWORD_USERS_JSON must be a JSON list or object.", False, {"classification": "terminal"})
    result: list[dict[str, Any]] = []
    for item in payload:
        if isinstance(item, dict):
            result.append(item)
    return result


def bootstrap_password_users() -> dict[str, int]:
    created = 0
    updated = 0
    skipped = 0
    for raw_item in _bootstrap_password_user_payloads():
        email = normalize_email(raw_item.get("email"))
        password = str(raw_item.get("password") or "").strip()
        name = raw_item.get("name")
        force = bool(raw_item.get("force"))
        if not email or not password:
            skipped += 1
            continue
        _validate_password_strength(password)
        existing = _load_user_by_email(email)
        if existing:
            user_id = str(existing["user_id"])
            next_user = dict(existing)
            next_user["email"] = email
            password_hash = str(next_user.get("password_hash") or "").strip()
            changed = False
            password_changed = False
            if force or not password_hash:
                next_user["password_hash"] = hash_password(password)
                changed = True
                password_changed = True
            if isinstance(name, str) and name.strip() and (force or not str(next_user.get("name") or "").strip()):
                next_user["name"] = name.strip()
                changed = True
            with STORE.locked(*_auth_lock_items(("email_index", email), ("users", user_id))):
                STORE.set("users", user_id, next_user)
                STORE.set("email_index", email, user_id)
                if password_changed:
                    _invalidate_all_auth_sessions_for_user(user_id=user_id)
            if changed:
                updated += 1
            else:
                skipped += 1
            continue

        create_user(email=email, password=password, name=str(name).strip() if isinstance(name, str) else None)
        created += 1
    if created or updated:
        _persist_auth_state()
    return {"created": created, "updated": updated, "skipped": skipped}


def _validate_password_strength(password: str) -> None:
    if len(password) < 8 or len(password) > 128:
        raise AppError(400, "VALIDATION_ERROR", "Password must be 8-128 characters.", False, {"classification": "non_retryable"})


def _token_sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _is_email_syntax_valid(value: str) -> bool:
    return "@" in value and "." in value.rsplit("@", 1)[-1]


def _rate_limit_key(*, scope: str, key: str) -> str:
    return f"{scope}:{_token_sha256(key)}"


def _check_and_increment_rate_limit(*, scope: str, key: str, limit: int, window_seconds: int) -> bool:
    now = utc_now()
    cutoff = now - timedelta(seconds=window_seconds)
    bucket_key = _rate_limit_key(scope=scope, key=key)
    with STORE.locked(("password_reset_rate_limits", bucket_key)):
        payload = STORE.get_ref("password_reset_rate_limits", bucket_key)
        attempts = payload.get("attempts") if isinstance(payload, dict) else []
        recent = [ts for ts in attempts if (parsed := parse_iso(ts)) and parsed >= cutoff]
        if len(recent) >= limit:
            STORE.set("password_reset_rate_limits", bucket_key, {"attempts": recent})
            return False
        recent.append(now.replace(microsecond=0).isoformat())
        STORE.set("password_reset_rate_limits", bucket_key, {"attempts": recent})
        return True


def _check_and_increment_register_rate_limit(*, scope: str, key: str, limit: int, window_seconds: int) -> bool:
    now = utc_now()
    cutoff = now - timedelta(seconds=window_seconds)
    bucket_key = _rate_limit_key(scope=scope, key=key)
    with STORE.locked(("register_rate_limits", bucket_key)):
        payload = STORE.get_ref("register_rate_limits", bucket_key)
        attempts = payload.get("attempts") if isinstance(payload, dict) else []
        recent = [ts for ts in attempts if (parsed := parse_iso(ts)) and parsed >= cutoff]
        if len(recent) >= limit:
            STORE.set("register_rate_limits", bucket_key, {"attempts": recent})
            return False
        recent.append(now.replace(microsecond=0).isoformat())
        STORE.set("register_rate_limits", bucket_key, {"attempts": recent})
        return True


def _register_rate_limit_key_email(email: str) -> str:
    return normalize_email(email)


def _register_rate_limit_key_ip(request_ip: str | None) -> str:
    return str(request_ip or "unknown").strip() or "unknown"


def enforce_register_guards(*, email: str, request_ip: str | None, captcha_token: str | None = None) -> None:
    normalized_email = normalize_email(email)
    if not normalized_email or not _is_email_syntax_valid(normalized_email):
        raise AppError(400, "VALIDATION_ERROR", "Email is invalid.", False, {"classification": "non_retryable"})

    if SETTINGS.signup_captcha_secret:
        verify_signup_captcha(token=captcha_token, remote_ip=request_ip)

    email_allowed = _check_and_increment_register_rate_limit(
        scope="email",
        key=_register_rate_limit_key_email(normalized_email),
        limit=max(1, SETTINGS.register_rate_limit_per_email),
        window_seconds=max(60, SETTINGS.register_rate_limit_window_seconds),
    )
    ip_allowed = _check_and_increment_register_rate_limit(
        scope="ip",
        key=_register_rate_limit_key_ip(request_ip),
        limit=max(1, SETTINGS.register_rate_limit_per_ip),
        window_seconds=max(60, SETTINGS.register_rate_limit_window_seconds),
    )
    if not email_allowed or not ip_allowed:
        raise AppError(429, "RATE_LIMITED", "Too many registration attempts. Please try again later.", False, {"classification": "retryable"})


def verify_signup_captcha(*, token: str | None, remote_ip: str | None = None) -> None:
    if not SETTINGS.signup_captcha_secret:
        return
    token_value = str(token or "").strip()
    if not token_value:
        raise AppError(400, "CAPTCHA_REQUIRED", "Captcha is required.", False, {"classification": "non_retryable"})

    payload = {
        "secret": SETTINGS.signup_captcha_secret,
        "response": token_value,
    }
    if remote_ip:
        payload["remoteip"] = str(remote_ip).strip()

    encoded = parse.urlencode(payload).encode("utf-8")
    req = request.Request(
        SETTINGS.signup_captcha_verify_url,
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=5) as response:
            body = response.read().decode("utf-8")
            data = json.loads(body)
    except Exception as exc:
        raise AppError(503, "CAPTCHA_VERIFY_FAILED", "Captcha verification failed. Please retry.", False, {"classification": "retryable"}) from exc

    if not bool(data.get("success")):
        raise AppError(400, "CAPTCHA_INVALID", "Captcha validation failed.", False, {"classification": "non_retryable"})


def _new_email_verification_token() -> str:
    return secrets.token_urlsafe(48)


def _record_email_verification_token(*, user_id: str, email: str) -> str:
    token = _new_email_verification_token()
    token_hash = _token_sha256(token)
    token_id = new_id("evt")
    now = utc_now().replace(microsecond=0)
    expires_at = (now + timedelta(hours=24)).isoformat()
    with STORE.locked(("email_verification_tokens", AUTH_GUARD_KEY), ("email_verification_tokens", token_id)):
        for existing_id, payload in list(STORE._data["email_verification_tokens"].items()):
            if not isinstance(payload, dict):
                continue
            if payload.get("user_id") != user_id:
                continue
            if payload.get("used_at"):
                continue
            STORE.set(
                "email_verification_tokens",
                existing_id,
                {
                    **payload,
                    "used_at": now.isoformat(),
                    "invalidated_reason": "superseded",
                },
            )
        STORE.set(
            "email_verification_tokens",
            token_id,
            {
                "token_id": token_id,
                "token_hash": token_hash,
                "user_id": user_id,
                "email": email,
                "created_at": now.isoformat(),
                "expires_at": expires_at,
                "used_at": None,
            },
        )
    return token


def request_email_verification(*, email: str) -> dict[str, Any]:
    normalized = normalize_email(email)
    user = _load_user_by_email(normalized) if normalized else None
    if not user:
        _persist_auth_state()
        return {"message": EMAIL_VERIFICATION_NEUTRAL_MESSAGE}

    if user.get("email_verified_at"):
        _persist_auth_state()
        return {"message": "Email is already verified."}

    token = _record_email_verification_token(user_id=str(user["user_id"]), email=normalized)
    _persist_auth_state()
    data: dict[str, Any] = {"message": EMAIL_VERIFICATION_NEUTRAL_MESSAGE}
    if SETTINGS.environment == "development":
        data["verification_token"] = token
    return data


def confirm_email_verification(*, token: str) -> dict[str, Any]:
    token_value = str(token or "").strip()
    if not token_value:
        raise AppError(400, "AUTH_EMAIL_VERIFICATION_INVALID", "Verification token is invalid or expired.", False, {"classification": "non_retryable"})
    token_hash = _token_sha256(token_value)
    now = utc_now().replace(microsecond=0)

    with STORE.locked(*_auth_lock_items(("email_verification_tokens", AUTH_GUARD_KEY))):
        token_record: dict[str, Any] | None = None
        token_record_id: str | None = None
        for record_id, payload in STORE._data["email_verification_tokens"].items():
            if not isinstance(payload, dict):
                continue
            if payload.get("token_hash") != token_hash:
                continue
            token_record = payload
            token_record_id = str(record_id)
            break

        if not token_record or not token_record_id or token_record.get("used_at"):
            raise AppError(400, "AUTH_EMAIL_VERIFICATION_INVALID", "Verification token is invalid or expired.", False, {"classification": "non_retryable"})
        expires_at = parse_iso(token_record.get("expires_at"))
        if not expires_at or expires_at <= utc_now():
            STORE.set(
                "email_verification_tokens",
                token_record_id,
                {**token_record, "used_at": now.isoformat(), "invalidated_reason": "expired"},
            )
            raise AppError(400, "AUTH_EMAIL_VERIFICATION_INVALID", "Verification token is invalid or expired.", False, {"classification": "non_retryable"})

        user_id = str(token_record.get("user_id") or "")
        user = STORE.get_ref("users", user_id)
        if not user:
            raise AppError(400, "AUTH_EMAIL_VERIFICATION_INVALID", "Verification token is invalid or expired.", False, {"classification": "non_retryable"})
        updated_user = dict(user)
        updated_user["email_verified_at"] = now.isoformat()
        STORE.set("users", user_id, updated_user)
        STORE.set(
            "email_verification_tokens",
            token_record_id,
            {**token_record, "used_at": now.isoformat(), "invalidated_reason": "consumed"},
        )
    _persist_auth_state()
    return {"message": "Email verified successfully."}


def _record_password_reset_token(*, user: dict[str, Any], token_hash: str, request_ip: str | None) -> str:
    token_id = new_id("prt")
    now = utc_now().replace(microsecond=0)
    expires_at = (now + timedelta(minutes=SETTINGS.password_reset_token_ttl_minutes)).isoformat()
    with STORE.locked(*_auth_lock_items(("password_reset_tokens", AUTH_GUARD_KEY), ("password_reset_tokens", token_id))):
        # Invalidate previous unused tokens for this user.
        for existing_id, payload in list(STORE._data["password_reset_tokens"].items()):
            if not isinstance(payload, dict):
                continue
            if payload.get("user_id") != user["user_id"]:
                continue
            if payload.get("used_at"):
                continue
            STORE.set(
                "password_reset_tokens",
                existing_id,
                {
                    **payload,
                    "used_at": now.isoformat(),
                    "invalidated_reason": "superseded",
                },
            )
        STORE.set(
            "password_reset_tokens",
            token_id,
            {
                "token_id": token_id,
                "token_hash": token_hash,
                "user_id": user["user_id"],
                "email": user["email"],
                "created_at": now.isoformat(),
                "expires_at": expires_at,
                "used_at": None,
                "request_ip_hash": _token_sha256(request_ip or "unknown"),
            },
        )
    return token_id


def _invalidate_all_auth_sessions_for_user(*, user_id: str) -> None:
    session_ids = [
        session_id
        for session_id, payload in STORE._data["auth_sessions"].items()
        if isinstance(payload, dict) and payload.get("user_id") == user_id and payload.get("status") == "active"
    ]
    for session_id in session_ids:
        _invalidate_auth_session(auth_session_id=str(session_id))


def _issue_tokens(*, user_id: str, auth_session_id: str | None = None) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    issued_at = utc_now()
    auth_session = auth_session_id or new_id("auth")
    access_token = new_id("atk")
    refresh_token = new_id("rtk")
    access_expires_at = (issued_at + timedelta(minutes=SETTINGS.access_token_minutes)).replace(microsecond=0).isoformat()
    refresh_expires_at = (issued_at + timedelta(days=SETTINGS.refresh_token_days)).replace(microsecond=0).isoformat()
    access_payload = {
        "user_id": user_id,
        "auth_session_id": auth_session,
        "expires_at": access_expires_at,
    }
    refresh_payload = {
        "user_id": user_id,
        "auth_session_id": auth_session,
        "expires_at": refresh_expires_at,
    }
    return (
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "access_expires_at": access_expires_at,
            "refresh_expires_at": refresh_expires_at,
            "auth_session_id": auth_session,
        },
        access_payload,
        refresh_payload,
    )


def _set_auth_session(*, user_id: str, auth_session_id: str) -> None:
    existing = STORE.get_ref("auth_sessions", auth_session_id) or {}
    STORE.set(
        "auth_sessions",
        auth_session_id,
        {
            "auth_session_id": auth_session_id,
            "user_id": user_id,
            "status": "active",
            "created_at": existing.get("created_at") or iso_now(),
            "updated_at": iso_now(),
            "terminated_at": None,
        },
    )


def _assert_auth_session_active(*, auth_session_id: str, user_id: str) -> None:
    session = STORE.get_ref("auth_sessions", auth_session_id)
    if not session or session.get("user_id") != user_id or session.get("status") != "active":
        raise AppError(401, "AUTH_SESSION_EXPIRED", "User session is no longer valid.", False, {"classification": "terminal"})


def _invalidate_auth_session(*, auth_session_id: str) -> dict[str, Any]:
    session = STORE.get_ref("auth_sessions", auth_session_id)
    if not session:
        raise AppError(401, "AUTH_REQUIRED", "Authentication is required.", False, {"classification": "non_retryable"})

    access_tokens = [
        token
        for token, payload in STORE._data["access_tokens"].items()
        if isinstance(payload, dict) and payload.get("auth_session_id") == auth_session_id
    ]
    refresh_tokens = [
        token
        for token, payload in STORE._data["refresh_tokens"].items()
        if isinstance(payload, dict) and payload.get("auth_session_id") == auth_session_id
    ]
    for token in access_tokens:
        STORE.delete("access_tokens", token)
    for token in refresh_tokens:
        STORE.delete("refresh_tokens", token)
    STORE.set(
        "auth_sessions",
        auth_session_id,
        {
            **session,
            "status": "terminated",
            "updated_at": iso_now(),
            "terminated_at": iso_now(),
        },
    )
    return {"auth_session_id": auth_session_id, "status": "terminated"}


def _auth_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name"),
        "subscription_tier": user.get("subscription_tier", "free"),
        "subscription_expires_at": user.get("subscription_expires_at"),
        "trial_ends_at": user.get("trial_ends_at"),
    }


def bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError(401, "AUTH_REQUIRED", "Authentication is required.", False, {"classification": "non_retryable"})
    return authorization.split(" ", 1)[1].strip()


def current_user_from_authorization(authorization: str | None) -> tuple[dict[str, Any], dict[str, Any]]:
    return get_current_user(access_token=bearer_token(authorization))


def _auth_data_corruption(message: str, *, email: str | None = None, user_ids: list[str] | None = None, reason: str | None = None) -> AppError:
    details: dict[str, Any] = {"classification": "terminal"}
    if email:
        details["email"] = email
    if user_ids:
        details["user_ids"] = user_ids
    if reason:
        details["reason"] = reason
    return AppError(500, "AUTH_DATA_CORRUPTION", message, False, details)


def _matching_user_records(email: str) -> list[tuple[str, dict[str, Any]]]:
    normalized = normalize_email(email)
    records: list[tuple[str, dict[str, Any]]] = []
    for user_id, payload in STORE._data["users"].items():
        if not isinstance(payload, dict):
            continue
        if normalize_email(payload.get("email")) != normalized:
            continue
        records.append((str(user_id), dict(payload)))
    records.sort(key=lambda item: item[0])
    return records


def _load_user_by_email(email: str) -> dict[str, Any] | None:
    normalized = normalize_email(email)
    with STORE.locked(*_auth_lock_items(("email_index", normalized))):
        indexed_user_id = STORE.get_ref("email_index", normalized)
        matches = _matching_user_records(normalized)

    if len(matches) > 1:
        raise _auth_data_corruption(
            "User authentication data is invalid. Please reset password.",
            email=normalized,
            user_ids=[user_id for user_id, _ in matches],
            reason="multiple_users_for_email",
        )

    if not matches:
        if indexed_user_id:
            raise _auth_data_corruption(
                "User authentication data is invalid. Please reset password.",
                email=normalized,
                user_ids=[str(indexed_user_id)],
                reason="email_index_points_to_missing_user",
            )
        return None

    user_id, user = matches[0]
    if not indexed_user_id or str(indexed_user_id) != user_id:
        raise _auth_data_corruption(
            "User authentication data is invalid. Please reset password.",
            email=normalized,
            user_ids=[user_id, str(indexed_user_id)] if indexed_user_id else [user_id],
            reason="email_index_mismatch",
        )
    if str(user.get("user_id") or "") != user_id:
        raise _auth_data_corruption(
            "User authentication data is invalid. Please reset password.",
            email=normalized,
            user_ids=[user_id],
            reason="user_id_mismatch",
        )
    return user


def _issue_auth_for_user(user: dict[str, Any]) -> dict[str, Any]:
    current = dict(user)
    tokens, access_payload, refresh_payload = _issue_tokens(user_id=current["user_id"])
    with STORE.locked(
        *_auth_lock_items(
            ("users", current["user_id"]),
            ("auth_sessions", tokens["auth_session_id"]),
            ("access_tokens", tokens["access_token"]),
            ("refresh_tokens", tokens["refresh_token"]),
        )
    ):
        STORE.set("users", current["user_id"], current)
        _set_auth_session(user_id=current["user_id"], auth_session_id=tokens["auth_session_id"])
        STORE.set("access_tokens", tokens["access_token"], access_payload)
        STORE.set("refresh_tokens", tokens["refresh_token"], refresh_payload)
    _persist_auth_state()
    return {"auth_user": _auth_user(current), "tokens": tokens}


def create_user(*, email: str, password: str, name: str | None) -> dict[str, Any]:
    normalized = normalize_email(email)
    if not normalized:
        raise AppError(400, "VALIDATION_ERROR", "Email is required.", False, {"classification": "non_retryable"})
    _validate_password_strength(password)
    if _load_user_by_email(normalized):
        raise AppError(400, "AUTH_EMAIL_EXISTS", "Email already registered.", False, {"classification": "non_retryable"})

    user_id = new_id("usr")
    tokens, access_payload, refresh_payload = _issue_tokens(user_id=user_id)
    user = {
        "user_id": user_id,
        "email": normalized,
        "name": name.strip() if isinstance(name, str) and name.strip() else None,
        "password_hash": hash_password(password),
        "subscription_tier": "free",
        "subscription_expires_at": None,
        "trial_ends_at": None,
        "email_verified_at": None if SETTINGS.require_email_verification else iso_now(),
        "provider_links": {},
        "created_at": iso_now(),
    }
    with STORE.locked(
        *_auth_lock_items(
            ("email_index", normalized),
            ("users", user_id),
            ("auth_sessions", tokens["auth_session_id"]),
            ("access_tokens", tokens["access_token"]),
            ("refresh_tokens", tokens["refresh_token"]),
        )
    ):
        if STORE.has("email_index", normalized):
            raise AppError(400, "AUTH_EMAIL_EXISTS", "Email already registered.", False, {"classification": "non_retryable"})
        STORE.set("users", user_id, user)
        STORE.set("email_index", normalized, user_id)
        _set_auth_session(user_id=user_id, auth_session_id=tokens["auth_session_id"])
        STORE.set("access_tokens", tokens["access_token"], access_payload)
        STORE.set("refresh_tokens", tokens["refresh_token"], refresh_payload)
    _persist_auth_state()
    if SETTINGS.require_email_verification:
        token = _record_email_verification_token(user_id=user_id, email=normalized)
        _persist_auth_state()
        data: dict[str, Any] = {"auth_user": _auth_user(user), "tokens": tokens, "email_verification_required": True}
        if SETTINGS.environment == "development":
            data["verification_token"] = token
        return data
    return {"auth_user": _auth_user(user), "tokens": tokens}


def set_password(*, email: str, password: str, confirm_password: str) -> dict[str, Any]:
    if password != confirm_password:
        raise AppError(400, "VALIDATION_ERROR", "Passwords do not match.", False, {"classification": "non_retryable"})
    _validate_password_strength(password)
    normalized = normalize_email(email)
    if not normalized:
        raise AppError(400, "VALIDATION_ERROR", "Email is required.", False, {"classification": "non_retryable"})
    user = _load_user_by_email(normalized)
    if not user:
        raise AppError(404, "AUTH_USER_NOT_FOUND", "No account found for that email.", False, {"classification": "non_retryable"})
    updated = dict(user)
    updated["password_hash"] = hash_password(password)
    with STORE.locked(*_auth_lock_items(("email_index", normalized), ("users", updated["user_id"]))):
        STORE.set("users", updated["user_id"], updated)
    _persist_auth_state()
    return {"message": "Password set successfully."}


def request_password_reset(*, email: str, request_ip: str | None = None) -> dict[str, Any]:
    normalized = normalize_email(email)
    if not normalized or not _is_email_syntax_valid(normalized):
        return {"message": PASSWORD_RESET_NEUTRAL_MESSAGE}

    within_email_limit = _check_and_increment_rate_limit(
        scope="email",
        key=normalized,
        limit=max(1, SETTINGS.password_reset_rate_limit_per_email),
        window_seconds=max(60, SETTINGS.password_reset_rate_limit_window_seconds),
    )
    ip_key = request_ip or "unknown"
    within_ip_limit = _check_and_increment_rate_limit(
        scope="ip",
        key=ip_key,
        limit=max(1, SETTINGS.password_reset_rate_limit_per_ip),
        window_seconds=max(60, SETTINGS.password_reset_rate_limit_window_seconds),
    )
    if not within_email_limit or not within_ip_limit:
        _persist_auth_state()
        return {"message": PASSWORD_RESET_NEUTRAL_MESSAGE}

    user = _load_user_by_email(normalized)
    if not user:
        _persist_auth_state()
        return {"message": PASSWORD_RESET_NEUTRAL_MESSAGE}

    token = secrets.token_urlsafe(48)
    token_hash = _token_sha256(token)
    _record_password_reset_token(user=user, token_hash=token_hash, request_ip=request_ip)
    links = build_password_reset_links(token=token)
    try:
        send_password_reset_email(
            email=normalized,
            links=links,
            expires_in_minutes=max(1, SETTINGS.password_reset_token_ttl_minutes),
        )
    except Exception:
        # Keep reset response neutral and avoid leaking delivery internals to clients.
        pass
    _persist_auth_state()
    return {"message": PASSWORD_RESET_NEUTRAL_MESSAGE}


def complete_password_reset(*, token: str, password: str, confirm_password: str) -> dict[str, Any]:
    if password != confirm_password:
        raise AppError(400, "VALIDATION_ERROR", "Passwords do not match.", False, {"classification": "non_retryable"})
    _validate_password_strength(password)
    token_value = str(token or "").strip()
    if not token_value:
        raise AppError(400, "AUTH_RESET_TOKEN_INVALID", "Reset token is invalid or expired.", False, {"classification": "non_retryable"})

    token_hash = _token_sha256(token_value)
    now = utc_now()
    with STORE.locked(*_auth_lock_items(("password_reset_tokens", AUTH_GUARD_KEY))):
        token_record: dict[str, Any] | None = None
        token_record_id: str | None = None
        for record_id, payload in STORE._data["password_reset_tokens"].items():
            if not isinstance(payload, dict):
                continue
            if payload.get("token_hash") != token_hash:
                continue
            token_record = payload
            token_record_id = str(record_id)
            break

        if not token_record or not token_record_id:
            raise AppError(400, "AUTH_RESET_TOKEN_INVALID", "Reset token is invalid or expired.", False, {"classification": "non_retryable"})
        if token_record.get("used_at"):
            raise AppError(400, "AUTH_RESET_TOKEN_INVALID", "Reset token is invalid or expired.", False, {"classification": "non_retryable"})

        expires_at = parse_iso(token_record.get("expires_at"))
        if not expires_at or expires_at <= now:
            STORE.set(
                "password_reset_tokens",
                token_record_id,
                {
                    **token_record,
                    "used_at": now.replace(microsecond=0).isoformat(),
                    "invalidated_reason": "expired",
                },
            )
            raise AppError(400, "AUTH_RESET_TOKEN_INVALID", "Reset token is invalid or expired.", False, {"classification": "non_retryable"})

        user_id = str(token_record.get("user_id") or "")
        user = STORE.get_ref("users", user_id)
        if not user:
            raise AppError(400, "AUTH_RESET_TOKEN_INVALID", "Reset token is invalid or expired.", False, {"classification": "non_retryable"})

        updated_user = dict(user)
        updated_user["password_hash"] = hash_password(password)
        STORE.set("users", user_id, updated_user)
        STORE.set(
            "password_reset_tokens",
            token_record_id,
            {
                **token_record,
                "used_at": now.replace(microsecond=0).isoformat(),
                "invalidated_reason": "consumed",
            },
        )
        _invalidate_all_auth_sessions_for_user(user_id=user_id)

    _persist_auth_state()
    return {"message": "Password reset successful. Please sign in with your new password."}


def login_user(*, email: str, password: str) -> dict[str, Any]:
    user = _load_user_by_email(email)
    if not user:
        raise AppError(401, "AUTH_INVALID_CREDENTIALS", "Incorrect email or password.", False, {"classification": "non_retryable"})
    password_hash = str(user.get("password_hash") or "").strip()
    provider_links = user.get("provider_links") if isinstance(user.get("provider_links"), dict) else {}
    if not password_hash:
        if isinstance(provider_links, dict) and provider_links.get("google"):
            raise AppError(
                401,
                "AUTH_PASSWORD_NOT_SET",
                "This account uses Google sign-in. Continue with Google or set a password first.",
                False,
                {"classification": "non_retryable"},
            )
        raise AppError(
            401,
            "AUTH_PASSWORD_NOT_SET",
            "This account does not have a password set yet. Use password reset or set a password first.",
            False,
            {"classification": "non_retryable"},
        )
    try:
        password_valid = verify_password(password, password_hash)
    except PasswordHashError as exc:
        raise _auth_data_corruption(
            "User authentication data is invalid. Please reset password.",
            email=user.get("email"),
            user_ids=[str(user.get("user_id") or "")],
            reason=str(exc),
        ) from exc
    if not password_valid:
        raise AppError(401, "AUTH_INVALID_CREDENTIALS", "Incorrect email or password.", False, {"classification": "non_retryable"})
    if SETTINGS.require_email_verification and not user.get("email_verified_at"):
        raise AppError(403, "AUTH_EMAIL_NOT_VERIFIED", "Please verify your email before signing in.", False, {"classification": "non_retryable"})
    return _issue_auth_for_user(user)


def login_dev_user(*, email: str, name: str | None = None) -> dict[str, Any]:
    normalized = normalize_email(email)
    if not normalized:
      raise AppError(400, "VALIDATION_ERROR", "Email is required.", False, {"classification": "non_retryable"})

    user = _load_user_by_email(normalized)
    if user:
        updated = dict(user)
        if name and not updated.get("name"):
            updated["name"] = name.strip()
            with STORE.locked(*_auth_lock_items(("email_index", normalized), ("users", updated["user_id"]))):
                STORE.set("users", updated["user_id"], updated)
            _persist_auth_state()
        return _issue_auth_for_user(updated)

    return create_user(
        email=normalized,
        password="floently-dev-password",
        name=name,
    )


def login_google_identity(*, provider: str, external_id: str, email: str, name: str | None) -> dict[str, Any]:
    provider_name = str(provider or "").strip().lower()
    normalized_email = normalize_email(email)
    external_subject = str(external_id or "").strip()
    if provider_name != "google":
        raise AppError(400, "AUTH_PROVIDER_DISABLED", "Unsupported provider.", False, {"classification": "non_retryable", "provider": provider_name})
    if not normalized_email or not external_subject:
        raise AppError(400, "VALIDATION_ERROR", "Google account details are incomplete.", False, {"classification": "non_retryable"})

    link_key = f"{provider_name}:{external_subject}"
    with STORE.locked(*_auth_lock_items(("provider_index", link_key))):
        linked_user_id = STORE.get_ref("provider_index", link_key)
    linked_user = STORE.get_ref("users", str(linked_user_id)) if linked_user_id else None
    if linked_user:
        if linked_user.get("email") != normalized_email:
            raise AppError(409, "AUTH_PROVIDER_CONFLICT", "Google account is linked to a different email.", False, {"provider": provider_name})

    user = linked_user or _load_user_by_email(normalized_email)
    if user:
        updated = dict(user)
        provider_links = dict(updated.get("provider_links") or {})
        provider_links[provider_name] = external_subject
        updated["provider_links"] = provider_links
        if not updated.get("name") and isinstance(name, str) and name.strip():
            updated["name"] = name.strip()
        with STORE.locked(
            *_auth_lock_items(
                ("provider_index", link_key),
                ("email_index", updated["email"]),
                ("users", updated["user_id"]),
            )
        ):
            STORE.set("users", updated["user_id"], updated)
            STORE.set("email_index", updated["email"], updated["user_id"])
            STORE.set("provider_index", link_key, updated["user_id"])
        _persist_auth_state()
        return _issue_auth_for_user(updated)

    user_id = new_id("usr")
    created = {
        "user_id": user_id,
        "email": normalized_email,
        "name": name.strip() if isinstance(name, str) and name.strip() else None,
        "password_hash": None,
        "subscription_tier": "free",
        "subscription_expires_at": None,
        "trial_ends_at": None,
        "email_verified_at": iso_now(),
        "provider_links": {provider_name: external_subject},
        "created_at": iso_now(),
    }
    with STORE.locked(
        *_auth_lock_items(
            ("provider_index", link_key),
            ("email_index", normalized_email),
            ("users", user_id),
        )
    ):
        STORE.set("users", user_id, created)
        STORE.set("email_index", normalized_email, user_id)
        STORE.set("provider_index", link_key, user_id)
    _persist_auth_state()
    return _issue_auth_for_user(created)


def login_provider(*, provider_id: str, provider_token: str) -> dict[str, Any]:
    provider = str(provider_id or "").strip()
    opaque_token = str(provider_token or "").strip()
    if provider not in SETTINGS.auth_provider_ids:
        raise AppError(400, "AUTH_PROVIDER_DISABLED", "Provider login is not enabled.", False, {"classification": "non_retryable"})
    if not opaque_token:
        raise AppError(400, "VALIDATION_ERROR", "Provider token is required.", False, {"classification": "non_retryable"})

    external_subject = hashlib.sha256(f"{provider}:{opaque_token}".encode("utf-8")).hexdigest()
    link_key = f"{provider}:{external_subject}"

    with STORE.locked(*_auth_lock_items(("provider_index", link_key))):
        existing_user_id = STORE.get_ref("provider_index", link_key)

    if existing_user_id:
        tokens, access_payload, refresh_payload = _issue_tokens(user_id=str(existing_user_id))
        with STORE.locked(
            *_auth_lock_items(
                ("provider_index", link_key),
                ("users", str(existing_user_id)),
                ("auth_sessions", tokens["auth_session_id"]),
                ("access_tokens", tokens["access_token"]),
                ("refresh_tokens", tokens["refresh_token"]),
            )
        ):
            user_id = STORE.get_ref("provider_index", link_key)
            user = STORE.get_ref("users", str(user_id or ""))
            if not user_id or not user:
                raise AppError(401, "AUTH_SESSION_EXPIRED", "Provider-linked user was not found.", False, {"classification": "terminal"})
            _set_auth_session(user_id=str(existing_user_id), auth_session_id=tokens["auth_session_id"])
            STORE.set("access_tokens", tokens["access_token"], access_payload)
            STORE.set("refresh_tokens", tokens["refresh_token"], refresh_payload)
        _persist_auth_state()
        return {"auth_user": _auth_user(user), "tokens": tokens}

    user_id = new_id("usr")
    email = f"{provider}-{user_id}@provider.local"
    user = {
        "user_id": user_id,
        "email": email,
        "name": None,
        "password_hash": None,
        "subscription_tier": "free",
        "subscription_expires_at": None,
        "trial_ends_at": None,
        "email_verified_at": iso_now(),
        "provider_links": {provider: external_subject},
        "created_at": iso_now(),
    }
    tokens, access_payload, refresh_payload = _issue_tokens(user_id=user_id)
    with STORE.locked(
        *_auth_lock_items(
            ("provider_index", link_key),
            ("email_index", email),
            ("users", user_id),
            ("auth_sessions", tokens["auth_session_id"]),
            ("access_tokens", tokens["access_token"]),
            ("refresh_tokens", tokens["refresh_token"]),
        )
    ):
        existing_user_id = STORE.get_ref("provider_index", link_key)
        if existing_user_id:
            existing_user = STORE.get_ref("users", str(existing_user_id))
            if not existing_user:
                raise AppError(401, "AUTH_SESSION_EXPIRED", "Provider-linked user was not found.", False, {"classification": "terminal"})
            _set_auth_session(user_id=str(existing_user_id), auth_session_id=tokens["auth_session_id"])
            STORE.set("access_tokens", tokens["access_token"], access_payload)
            STORE.set("refresh_tokens", tokens["refresh_token"], refresh_payload)
            _persist_auth_state()
            return {"auth_user": _auth_user(existing_user), "tokens": tokens}
        STORE.set("users", user_id, user)
        STORE.set("email_index", email, user_id)
        STORE.set("provider_index", link_key, user_id)
        _set_auth_session(user_id=user_id, auth_session_id=tokens["auth_session_id"])
        STORE.set("access_tokens", tokens["access_token"], access_payload)
        STORE.set("refresh_tokens", tokens["refresh_token"], refresh_payload)
    _persist_auth_state()
    return {"auth_user": _auth_user(user), "tokens": tokens}


def refresh_auth(*, refresh_token: str) -> dict[str, Any]:
    token_value = str(refresh_token or "").strip()
    if not token_value:
        raise AppError(400, "VALIDATION_ERROR", "Refresh token is required.", False, {"classification": "non_retryable"})

    with STORE.locked(*_auth_lock_items(("refresh_tokens", token_value))):
        token_payload = STORE.get_ref("refresh_tokens", token_value)
        if not token_payload:
            raise AppError(401, "AUTH_REFRESH_INVALID", "Refresh token is invalid.", False, {"classification": "non_retryable"})
        user_id = str(token_payload["user_id"])
        auth_session_id = token_payload["auth_session_id"]

    tokens, access_payload, refresh_payload = _issue_tokens(user_id=user_id, auth_session_id=auth_session_id)
    with STORE.locked(
        *_auth_lock_items(
            ("refresh_tokens", token_value),
            ("users", user_id),
            ("auth_sessions", auth_session_id),
            ("access_tokens", tokens["access_token"]),
            ("refresh_tokens", tokens["refresh_token"]),
        )
    ):
        token_payload = STORE.get_ref("refresh_tokens", token_value)
        if not token_payload:
            raise AppError(401, "AUTH_REFRESH_INVALID", "Refresh token is invalid.", False, {"classification": "non_retryable"})
        expires_at = parse_iso(token_payload.get("expires_at"))
        if not expires_at or expires_at <= utc_now():
            STORE.delete("refresh_tokens", token_value)
            raise AppError(401, "AUTH_SESSION_EXPIRED", "Refresh token has expired.", False, {"classification": "terminal"})
        user = STORE.get_ref("users", user_id)
        if not user:
            STORE.delete("refresh_tokens", token_value)
            raise AppError(401, "AUTH_SESSION_EXPIRED", "User session is no longer valid.", False, {"classification": "terminal"})
        _assert_auth_session_active(auth_session_id=auth_session_id, user_id=user_id)
        STORE.delete("refresh_tokens", token_value)
        _set_auth_session(user_id=user_id, auth_session_id=auth_session_id)
        STORE.set("access_tokens", tokens["access_token"], access_payload)
        STORE.set("refresh_tokens", tokens["refresh_token"], refresh_payload)
    _persist_auth_state()
    return {"auth_user": _auth_user(user), "tokens": tokens}


def get_current_user(*, access_token: str) -> tuple[dict[str, Any], dict[str, Any]]:
    token_value = str(access_token or "").strip()
    if not token_value:
        raise AppError(401, "AUTH_REQUIRED", "Authentication is required.", False, {"classification": "non_retryable"})

    with STORE.locked(*_auth_lock_items(("access_tokens", token_value))):
        token_payload = STORE.get_ref("access_tokens", token_value)
        if not token_payload:
            raise AppError(401, "AUTH_REQUIRED", "Authentication is required.", False, {"classification": "non_retryable"})
        user_id = str(token_payload["user_id"])

    with STORE.locked(*_auth_lock_items(("access_tokens", token_value), ("users", user_id))):
        token_payload = STORE.get_ref("access_tokens", token_value)
        if not token_payload:
            raise AppError(401, "AUTH_REQUIRED", "Authentication is required.", False, {"classification": "non_retryable"})
        expires_at = parse_iso(token_payload.get("expires_at"))
        if not expires_at or expires_at <= utc_now():
            STORE.delete("access_tokens", token_value)
            raise AppError(401, "AUTH_SESSION_EXPIRED", "Access token has expired.", False, {"classification": "terminal"})
        user = STORE.get_ref("users", user_id)
        if not user:
            raise AppError(401, "AUTH_SESSION_EXPIRED", "Authenticated user was not found.", False, {"classification": "terminal"})
        _assert_auth_session_active(auth_session_id=str(token_payload["auth_session_id"]), user_id=user_id)

    return _auth_user(user) | {"subscription_tier": user.get("subscription_tier", "free")}, copy_token_payload(token_payload)


def logout_auth(*, authorization: str | None, refresh_token: str | None = None) -> dict[str, Any]:
    session_id: str | None = None
    access_token = None
    try:
        access_token = bearer_token(authorization)
    except AppError:
        access_token = None
    token_value = str(refresh_token or "").strip()

    with STORE.locked(*_auth_lock_items()):
        if access_token:
            payload = STORE.get_ref("access_tokens", access_token)
            if isinstance(payload, dict):
                session_id = str(payload.get("auth_session_id") or "").strip() or None
        if not session_id and token_value:
            payload = STORE.get_ref("refresh_tokens", token_value)
            if isinstance(payload, dict):
                session_id = str(payload.get("auth_session_id") or "").strip() or None
        if not session_id:
            raise AppError(401, "AUTH_REQUIRED", "Authentication is required.", False, {"classification": "non_retryable"})
        payload = _invalidate_auth_session(auth_session_id=session_id)
    _persist_auth_state()
    return payload


def copy_token_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": payload["user_id"],
        "auth_session_id": payload["auth_session_id"],
        "expires_at": payload["expires_at"],
    }


def auth_session_payload(*, user: dict[str, Any], token_payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "auth_user": _auth_user(user),
        "auth_session_id": token_payload["auth_session_id"],
        "available_auth_methods": auth_methods(),
    }
