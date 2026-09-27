from __future__ import annotations

from contextvars import ContextVar
from typing import Any

_REQUEST_HEADERS: ContextVar[dict[str, str]] = ContextVar("floently_request_headers", default={})
_REQUEST_ID: ContextVar[str | None] = ContextVar("floently_request_id", default=None)
_REQUEST_PATH: ContextVar[str | None] = ContextVar("floently_request_path", default=None)
_REQUEST_METHOD: ContextVar[str | None] = ContextVar("floently_request_method", default=None)


def set_request_headers(headers: dict[str, Any]):
    normalized = {str(k).lower(): str(v) for k, v in headers.items() if v is not None}
    return _REQUEST_HEADERS.set(normalized)


def reset_request_headers(token) -> None:
    _REQUEST_HEADERS.reset(token)


def request_header(name: str) -> str | None:
    value = _REQUEST_HEADERS.get({}).get(name.lower())
    return value.strip() if isinstance(value, str) and value.strip() else None



def set_request_path(path: str | None, method: str | None = None):
    normalized_path = str(path or "").strip() or None
    normalized_method = str(method or "").strip().upper() or None
    token_path = _REQUEST_PATH.set(normalized_path)
    token_method = _REQUEST_METHOD.set(normalized_method)
    return token_path, token_method


def reset_request_path(tokens) -> None:
    token_path, token_method = tokens
    _REQUEST_PATH.reset(token_path)
    _REQUEST_METHOD.reset(token_method)


def request_path() -> str | None:
    return _REQUEST_PATH.get()


def request_method() -> str | None:
    return _REQUEST_METHOD.get()


def set_request_id(request_id: str | None):
    normalized = str(request_id or "").strip() or None
    return _REQUEST_ID.set(normalized)


def reset_request_id(token) -> None:
    _REQUEST_ID.reset(token)


def get_request_id() -> str:
    return (
        _REQUEST_ID.get()
        or request_header("x-request-id")
        or request_header("x-correlation-id")
        or request_header("cf-ray")
        or "unknown"
    )
