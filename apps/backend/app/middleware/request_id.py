from __future__ import annotations

import uuid
from typing import Callable

from fastapi import FastAPI, Request

from app.core.request_context import get_request_id as _get_ctx_request_id, set_request_id


def get_request_id(request: Request | None = None) -> str | None:
    if request is not None:
        value = getattr(request.state, "request_id", None)
        if value:
            return str(value)
    return _get_ctx_request_id()


def register_request_id_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def _request_id_middleware(request: Request, call_next: Callable):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id
        set_request_id(request_id)
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
