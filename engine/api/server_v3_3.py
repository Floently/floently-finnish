"""
Composed FastAPI server entrypoint for the YKI runtime.
"""

from __future__ import annotations

import os
import sys

from fastapi import FastAPI
import uvicorn

if __package__ in {None, ""}:
    sys.path.append(
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    )

from engine.logging.json_logger import configure_logging
configure_logging()

from engine.blueprints.loader import validate_all_blueprints
from engine.tools.build_task_index_v3_2 import ensure_task_index_v3_2
validate_all_blueprints()
ensure_task_index_v3_2(strict=True)

from engine.api.audio_upload_api_v3_3 import router as audio_upload_router
from engine.api.middleware import install_runtime_middleware
from engine.api.audio_routes import router as audio_router
from engine.api.debug_routes import router as debug_router
from engine.api.exam_api_v3_3 import router as exam_router
from engine.api.engine_status_api import router as engine_status_router
from engine.api.learning_api_v1 import router as learning_router
from engine.runtime.session_tokens import _SECRET_ENV as ENGINE_SESSION_SECRET_ENV


app = FastAPI(
    title="KieliTaika YKI Engine API",
    version="3.3",
)
install_runtime_middleware(app)


def _require_runtime_configuration() -> None:
    secret = str(os.getenv(ENGINE_SESSION_SECRET_ENV, "") or "").strip()
    environment = str(os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or "").strip().lower()
    if environment in {"prod", "production"} and not secret:
        raise RuntimeError(f"{ENGINE_SESSION_SECRET_ENV} must be configured before starting the engine")


_require_runtime_configuration()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(exam_router)
app.include_router(audio_upload_router)
app.include_router(audio_router)
app.include_router(debug_router)
app.include_router(engine_status_router)
app.include_router(learning_router)


PORT = int(os.getenv("YKI_ENGINE_PORT", 8181))


if __name__ == "__main__":
    uvicorn.run("engine.api.server_v3_3:app", host="0.0.0.0", port=PORT)
