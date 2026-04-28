from __future__ import annotations

from fastapi import HTTPException, Request

from app.core.config import get_settings
from app.db.models import User
from app.services.yki_exam_runtime_guard import rate_limiter


def _request_host(request: Request) -> str:
    return str(getattr(request.client, "host", "") or "").strip()


def is_internal_tts_request(request: Request) -> bool:
    settings = get_settings()
    token = str(request.headers.get("x-internal-tts-token") or "").strip()
    configured = str(getattr(settings, "internal_tts_token", "") or "").strip()
    if configured and token and token == configured:
        return True
    return _request_host(request) in {"127.0.0.1", "::1", "localhost"}


def ensure_tts_access(request: Request, current_user: User | None) -> None:
    if current_user is not None or is_internal_tts_request(request):
        return
    raise HTTPException(status_code=401, detail="Authentication required")


def apply_tts_rate_limit(request: Request, current_user: User | None) -> None:
    key = getattr(current_user, "id", None) or _request_host(request) or "anonymous"
    rate_limiter.check(scope="tts_generate", key=str(key), limit=30, window_seconds=60)
