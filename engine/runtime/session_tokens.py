"""
Signed engine session tokens for protected exam-runtime operations.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from typing import Any


_SECRET_ENV = "YKI_ENGINE_SESSION_SECRET"
_DEVELOPMENT_SECRET = "kielitaika-yki-engine-dev-session-secret"


def _is_production_environment() -> bool:
    environment = str(
        os.getenv("ENVIRONMENT")
        or os.getenv("APP_ENV")
        or ""
    ).strip().lower()
    return environment in {"prod", "production"}


def _secret_bytes() -> bytes:
    secret = str(os.getenv(_SECRET_ENV, "") or "").strip()
    if not secret:
        if _is_production_environment():
            raise RuntimeError(f"{_SECRET_ENV} must be configured")
        secret = _DEVELOPMENT_SECRET
    return secret.encode("utf-8")


def _encode_payload(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _decode_payload(encoded: str) -> dict[str, Any]:
    padding = "=" * (-len(encoded) % 4)
    raw = base64.urlsafe_b64decode(f"{encoded}{padding}".encode("ascii"))
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Session token payload must be an object")
    return payload


def _sign(encoded_payload: str) -> str:
    digest = hmac.new(
        _secret_bytes(),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def issue_engine_session_token(session: dict[str, Any]) -> str:
    session_id = str(session.get("session_id") or "").strip()
    start_time = float(session.get("start_time") or 0.0)
    if not session_id:
        raise ValueError("Cannot issue token for session without session_id")
    payload = {
        "sid": session_id,
        "iat": int(start_time),
    }
    encoded_payload = _encode_payload(payload)
    return f"{encoded_payload}.{_sign(encoded_payload)}"


def verify_engine_session_token(session: dict[str, Any], token: str) -> bool:
    encoded_payload, separator, encoded_signature = str(token or "").partition(".")
    if not encoded_payload or not separator or not encoded_signature:
        return False
    expected_signature = _sign(encoded_payload)
    if not hmac.compare_digest(expected_signature, encoded_signature):
        return False
    try:
        payload = _decode_payload(encoded_payload)
    except Exception:
        return False
    session_id = str(session.get("session_id") or "").strip()
    issued_at = int(float(session.get("start_time") or 0.0))
    return (
        payload.get("sid") == session_id
        and int(payload.get("iat") or 0) == issued_at
    )
