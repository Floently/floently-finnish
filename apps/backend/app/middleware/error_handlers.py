from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import AppError, FloentlyError
from app.core.responses import error_payload
from app.middleware.request_id import get_request_id

logger = logging.getLogger("floently.backend.errors")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(request_id=get_request_id(request), error=exc),
        )

    @app.exception_handler(FloentlyError)
    async def _handle_floently_error(request: Request, exc: FloentlyError):
        wrapped = AppError(
            status_code=getattr(exc, "status_code", 400),
            code=getattr(exc, "code", "floently_error").upper(),
            message=getattr(exc, "message", str(exc)),
            retryable=False,
            details={},
        )
        return JSONResponse(
            status_code=wrapped.status_code,
            content=error_payload(request_id=get_request_id(request), error=wrapped),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected_error(request: Request, exc: Exception):
        logger.exception("Unhandled backend exception", exc_info=exc)
        wrapped = AppError(500, "INTERNAL_SERVER_ERROR", "Internal server error.", False, {})
        return JSONResponse(
            status_code=500,
            content=error_payload(request_id=get_request_id(request), error=wrapped),
        )
