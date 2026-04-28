from __future__ import annotations

from typing import Any

from .config import SETTINGS
from .errors import AppError
from .utils import utc_now


def utc_timestamp() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def success_payload(*, data: Any, request_id: str | None = None) -> dict[str, Any]:
    return {
        "ok": True,
        "data": data,
        "error": None,
        "meta": {
            "request_id": request_id,
            "timestamp": utc_timestamp(),
            "api_version": SETTINGS.api_version,
        },
    }


def error_payload(
    *,
    request_id: str | None = None,
    error: AppError | None = None,
    message: str | None = None,
    code: str | None = None,
) -> dict[str, Any]:
    resolved_error = error or AppError(
        status_code=400,
        code=code or "UNKNOWN_ERROR",
        message=message or "Unknown error.",
        retryable=False,
        details={},
    )
    return {
        "ok": False,
        "data": None,
        "error": {
            "code": resolved_error.code,
            "message": resolved_error.message,
            "retryable": resolved_error.retryable,
            "details": resolved_error.details or None,
        },
        "meta": {
            "request_id": request_id,
            "timestamp": utc_timestamp(),
            "api_version": SETTINGS.api_version,
        },
    }
