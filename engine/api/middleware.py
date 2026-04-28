from __future__ import annotations

import os
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import JSONResponse, Response


def _csv_env(name: str, *, default: str) -> list[str]:
    raw = str(os.getenv(name, default) or "").strip()
    return [part.strip() for part in raw.split(",") if part.strip()]


def _int_env(name: str, *, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, str(default))))
    except ValueError:
        return default


def _is_production_environment() -> bool:
    environment = str(
        os.getenv("ENVIRONMENT")
        or os.getenv("APP_ENV")
        or ""
    ).strip().lower()
    return environment in {"prod", "production"}


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("x-content-type-options", "nosniff")
        response.headers.setdefault("referrer-policy", "no-referrer")
        response.headers.setdefault("x-frame-options", "DENY")
        response.headers.setdefault("permissions-policy", "microphone=(self)")
        if request.headers.get("x-forwarded-proto", request.url.scheme) == "https":
            response.headers.setdefault(
                "strict-transport-security",
                "max-age=31536000; includeSubDomains",
            )
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, max_request_bytes: int) -> None:
        super().__init__(app)
        self._max_request_bytes = max_request_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > self._max_request_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request body exceeds configured size limit"},
                    )
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid content-length header"})
        return await call_next(request)


def install_runtime_middleware(app: FastAPI) -> None:
    allow_origins = _csv_env("YKI_ENGINE_CORS_ALLOW_ORIGINS", default="")
    allow_credentials = str(os.getenv("YKI_ENGINE_CORS_ALLOW_CREDENTIALS", "false")).strip().lower() == "true"
    trusted_hosts = _csv_env("YKI_ENGINE_TRUSTED_HOSTS", default="localhost,127.0.0.1")
    max_request_bytes = _int_env("YKI_ENGINE_MAX_REQUEST_BYTES", default=25 * 1024 * 1024)
    if not _is_production_environment() and (not trusted_hosts or set(trusted_hosts) <= {"localhost", "127.0.0.1"}):
        trusted_hosts = ["*"]

    if allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=allow_credentials,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
            expose_headers=["X-Request-Id"],
        )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts or ["localhost", "127.0.0.1"])
    app.add_middleware(RequestSizeLimitMiddleware, max_request_bytes=max_request_bytes)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestContextMiddleware)
