from __future__ import annotations

import base64
import hashlib
import json
import re
import secrets
from datetime import timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import Request as FastAPIRequest
from fastapi.responses import RedirectResponse

from app.core.config import SETTINGS
from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import iso_now, new_id, parse_iso, utc_now
from app.services.auth_service import login_google_identity


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def google_auth_available() -> bool:
    return bool(SETTINGS.google_oauth_client_id.strip())


def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    # Allow mobile deep-link scheme used for in-app OAuth callback
    if origin.startswith("floently://"):
        return True
    if origin in SETTINGS.cors_allow_origins:
        return True
    return bool(re.match(SETTINGS.cors_allow_origin_regex, origin))


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _code_verifier() -> str:
    return _base64url(secrets.token_bytes(64))


def _code_challenge(verifier: str) -> str:
    return _base64url(hashlib.sha256(verifier.encode("utf-8")).digest())


def _callback_url(request: FastAPIRequest) -> str:
    from app.core.config import SETTINGS
    if SETTINGS.public_base_url:
        return f"{SETTINGS.public_base_url.rstrip('/')}/api/v1/auth/google/callback"
    return str(request.url_for("google_callback_route"))


def _is_custom_scheme_origin(origin: str) -> bool:
    """Return True for mobile deep-link origins like floently://auth/callback."""
    parsed_scheme = origin.split("://", 1)[0].lower() if "://" in origin else ""
    return bool(parsed_scheme) and parsed_scheme not in {"http", "https"}


def _frontend_return_url(origin: str, **params: str) -> str:
    if _is_custom_scheme_origin(origin):
        # Mobile deep-link: append query params directly to the URI
        return f"{origin.rstrip('/')}?{urlencode(params)}"
    return f"{origin.rstrip('/')}/?{urlencode(params)}"


def _google_json_request(
    url: str,
    *,
    method: str = "GET",
    form: dict[str, str] | None = None,
    query: dict[str, str] | None = None,
) -> dict[str, Any]:
    payload = None
    headers: dict[str, str] = {}
    final_url = url
    if query:
        final_url = f"{url}?{urlencode(query)}"
    if form is not None:
        payload = urlencode(form).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    request = Request(final_url, data=payload, headers=headers, method=method)
    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise AppError(502, "GOOGLE_AUTH_UPSTREAM_ERROR", "Google authentication failed.", True, {"upstream": detail[:400]})
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise AppError(502, "GOOGLE_AUTH_UPSTREAM_ERROR", "Google authentication failed.", True, {"upstream": str(error)})


def start_google_oauth(*, request: FastAPIRequest, redirect_origin: str | None) -> dict[str, Any]:
    if not google_auth_available():
        raise AppError(503, "AUTH_PROVIDER_DISABLED", "Google sign-in is not configured.", False, {"provider": "google"})
    origin = str(redirect_origin or "").strip()
    if not _is_allowed_origin(origin):
        raise AppError(400, "VALIDATION_ERROR", "Invalid Google auth redirect origin.", False, {"redirect_origin": origin or None})

    state_id = new_id("gstate")
    verifier = _code_verifier()
    expires_at = (utc_now() + timedelta(seconds=SETTINGS.google_oauth_timeout_seconds)).replace(microsecond=0).isoformat()
    STORE.set(
        "oauth_states",
        state_id,
        {
            "provider": "google",
            "redirect_origin": origin,
            "code_verifier": verifier,
            "expires_at": expires_at,
            "created_at": iso_now(),
        },
    )

    authorization_params = {
        "client_id": SETTINGS.google_oauth_client_id,
        "redirect_uri": _callback_url(request),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state_id,
        "prompt": "select_account",
        "code_challenge": _code_challenge(verifier),
        "code_challenge_method": "S256",
    }
    authorization_url = f"{GOOGLE_AUTH_URL}?{urlencode(authorization_params)}"
    return {
        "provider": "google",
        "authorization_url": authorization_url,
        "expires_at": expires_at,
    }


def complete_google_oauth(oauth_result_id: str) -> dict[str, Any]:
    result_id = str(oauth_result_id or "").strip()
    if not result_id:
        raise AppError(400, "VALIDATION_ERROR", "OAuth result id is required.", False, {"provider": "google"})
    payload = STORE.get_ref("oauth_results", result_id)
    STORE.delete("oauth_results", result_id)
    if not isinstance(payload, dict):
        raise AppError(401, "AUTH_PROVIDER_RESULT_INVALID", "Google sign-in session is invalid.", False, {"provider": "google"})
    expires_at = parse_iso(payload.get("expires_at"))
    auth_payload = payload.get("auth_payload")
    if not expires_at or expires_at <= utc_now() or not isinstance(auth_payload, dict):
        raise AppError(401, "AUTH_PROVIDER_RESULT_INVALID", "Google sign-in session has expired.", False, {"provider": "google"})
    return auth_payload


def _validate_google_token_payload(id_token: str) -> dict[str, Any]:
    token_info = _google_json_request(GOOGLE_TOKENINFO_URL, query={"id_token": id_token})
    issuer = str(token_info.get("iss") or "").strip()
    audience = str(token_info.get("aud") or "").strip()
    expires_at = int(str(token_info.get("exp") or "0"))
    email = str(token_info.get("email") or "").strip().lower()
    subject = str(token_info.get("sub") or "").strip()
    if issuer not in GOOGLE_ISSUERS:
        raise AppError(401, "AUTH_PROVIDER_INVALID_TOKEN", "Google identity token issuer is invalid.", False, {"provider": "google"})
    allowed_audiences = SETTINGS.google_oauth_valid_audiences()
    if not allowed_audiences:
        raise AppError(503, "AUTH_PROVIDER_DISABLED", "Google sign-in is not configured.", False, {"provider": "google"})
    if audience not in allowed_audiences:
        raise AppError(401, "AUTH_PROVIDER_INVALID_TOKEN", "Google identity token audience is invalid.", False, {"provider": "google"})
    if expires_at <= int(utc_now().timestamp()):
        raise AppError(401, "AUTH_PROVIDER_INVALID_TOKEN", "Google identity token has expired.", False, {"provider": "google"})
    if token_info.get("email_verified") not in {"true", True}:
        raise AppError(401, "AUTH_PROVIDER_INVALID_TOKEN", "Google account email is not verified.", False, {"provider": "google"})
    if not email or not subject:
        raise AppError(401, "AUTH_PROVIDER_INVALID_TOKEN", "Google identity token is incomplete.", False, {"provider": "google"})
    return {
        "email": email,
        "external_id": subject,
        "name": str(token_info.get("name") or "").strip() or None,
    }


def _exchange_google_code(*, request: FastAPIRequest, code: str, code_verifier: str) -> dict[str, Any]:
    if not code:
        raise AppError(400, "VALIDATION_ERROR", "Google authorization code is required.", False, {"provider": "google"})
    form = {
        "client_id": SETTINGS.google_oauth_client_id,
        "code": code,
        "code_verifier": code_verifier,
        "grant_type": "authorization_code",
        "redirect_uri": _callback_url(request),
    }
    if SETTINGS.google_oauth_client_secret:
        form["client_secret"] = SETTINGS.google_oauth_client_secret
    token_payload = _google_json_request(GOOGLE_TOKEN_URL, method="POST", form=form)
    id_token = str(token_payload.get("id_token") or "").strip()
    if not id_token:
        raise AppError(401, "AUTH_PROVIDER_INVALID_TOKEN", "Google authentication did not return an identity token.", False, {"provider": "google"})
    return _validate_google_token_payload(id_token)


def complete_google_id_token_auth(id_token: str) -> dict[str, Any]:
    token = str(id_token or "").strip()
    if not token:
        raise AppError(400, "VALIDATION_ERROR", "Google identity token is required.", False, {"provider": "google"})
    identity = _validate_google_token_payload(token)
    return login_google_identity(
        provider="google",
        external_id=identity["external_id"],
        email=identity["email"],
        name=identity["name"],
    )


def _redirect_with_error(origin: str | None, message: str) -> RedirectResponse:
    return RedirectResponse(
        _frontend_return_url(origin or "", google_auth="error", google_auth_error=message) if origin else "/",
        status_code=302,
    )


def handle_google_callback(
    *,
    request: FastAPIRequest,
    code: str | None,
    state: str | None,
    error: str | None,
    error_description: str | None,
) -> RedirectResponse:
    state_id = str(state or "").strip()
    pending = STORE.get_ref("oauth_states", state_id) if state_id else None
    redirect_origin = pending.get("redirect_origin") if isinstance(pending, dict) else None

    if error:
        if state_id:
            STORE.delete("oauth_states", state_id)
        message = str(error_description or error).strip() or "Google sign-in failed."
        return _redirect_with_error(redirect_origin, message)

    if not isinstance(pending, dict):
        raise AppError(401, "AUTH_PROVIDER_STATE_INVALID", "Google sign-in state is invalid.", False, {"provider": "google"})
    expires_at = parse_iso(pending.get("expires_at"))
    if not expires_at or expires_at <= utc_now():
        STORE.delete("oauth_states", state_id)
        return _redirect_with_error(str(redirect_origin or ""), "Google sign-in expired. Please try again.")

    identity = _exchange_google_code(
        request=request,
        code=str(code or "").strip(),
        code_verifier=str(pending.get("code_verifier") or "").strip(),
    )
    auth_payload = login_google_identity(
        provider="google",
        external_id=identity["external_id"],
        email=identity["email"],
        name=identity["name"],
    )

    STORE.delete("oauth_states", state_id)
    result_id = new_id("goauth")
    STORE.set(
        "oauth_results",
        result_id,
        {
            "provider": "google",
            "auth_payload": auth_payload,
            "expires_at": (utc_now() + timedelta(minutes=5)).replace(microsecond=0).isoformat(),
            "created_at": iso_now(),
        },
    )
    return RedirectResponse(
        _frontend_return_url(str(redirect_origin or ""), google_auth="success", oauth_result_id=result_id),
        status_code=302,
    )
