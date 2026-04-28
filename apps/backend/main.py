from __future__ import annotations

import json
import logging
import sys
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from starlette.background import BackgroundTask
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.router import router as api_router
from app.middleware.error_handlers import register_error_handlers
from app.middleware.request_id import register_request_id_middleware
from app.core.config import SETTINGS
from app.core.state_store import STORE
from app.db import auth_repository
from app.services.auth_service import bootstrap_password_users
from app.services.voice_service import get_tts_health_snapshot

app = FastAPI(title="floently-finnish")
logger = logging.getLogger("floently.backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(SETTINGS.cors_allow_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(SETTINGS.trusted_hosts or ("localhost", "127.0.0.1")))
register_request_id_middleware(app)
register_error_handlers(app)
app.include_router(api_router)


class LegacySpeakRequest(BaseModel):
    text: str
    voice: str


def _route_exists(path: str, method: str) -> bool:
    target = method.upper()
    for route in app.router.routes:
        route_path = getattr(route, 'path', None)
        route_methods = getattr(route, 'methods', None)
        if route_path == path and route_methods and target in route_methods:
            return True
    return False


if not _route_exists('/speak', 'POST'):
    @app.post('/speak')
    def speak(request: LegacySpeakRequest):
        try:
            from google.cloud import texttospeech
        except Exception as exc:  # pragma: no cover - optional dependency path
            raise HTTPException(status_code=503, detail=f'Google TTS is unavailable: {exc}') from exc

        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=request.text)
        voice = texttospeech.VoiceSelectionParams(language_code='fi-FI', name=request.voice)
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

        filename = Path(tempfile.gettempdir()) / f'audio_{uuid.uuid4()}.mp3'
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )
        filename.write_bytes(response.audio_content)
        return FileResponse(
            str(filename),
            media_type='audio/mpeg',
            filename=filename.name,
            background=BackgroundTask(lambda: filename.unlink(missing_ok=True)),
        )


@app.on_event("startup")
async def start_periodic_state_snapshot() -> None:
    import asyncio

    async def _loop() -> None:
        while True:
            await asyncio.sleep(30)
            try:
                STORE.write_snapshot()
            except Exception:
                pass

    asyncio.create_task(_loop())


@app.on_event("shutdown")
async def persist_state_on_shutdown() -> None:
    try:
        STORE.write_snapshot()
    except Exception:
        pass


@app.on_event("startup")
async def init_db_on_startup() -> None:
    try:
        import app.db.database as _db
        from app.db.models import Base
        _db._ensure_session_factory()
        async with _db.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        auth_repository.AUTH_USERS.ensure_schema()
        auth_repository.AUTH_USERS.migrate_state_users(STORE._data.get("users", {}))
        logger.info("Database tables initialised.")
    except Exception as exc:
        logger.warning("Could not initialise database tables: %s", exc)


@app.on_event("startup")
async def bootstrap_auth_password_users_on_startup() -> None:
    try:
        result = bootstrap_password_users()
        if any(result.values()):
            logger.info("Bootstrapped auth password users: %s", json.dumps(result, ensure_ascii=False))
    except Exception as exc:
        logger.warning("Could not bootstrap auth password users: %s", exc)


@app.on_event("startup")
async def log_tts_health_on_startup() -> None:
    try:
        logger.info("TTS health on startup: %s", json.dumps(get_tts_health_snapshot(), ensure_ascii=False))
    except Exception as exc:  # pragma: no cover - startup observability only
        logger.warning("Could not compute TTS health on startup: %s", exc)


@app.get("/")
def home() -> dict:
    return {
        "app": "floently-finnish",
        "mode": "governed_learning_system",
        "learning_loop": ["diagnose", "learn", "retrieve", "produce", "correct", "schedule", "review"],
        "modes": ["learn", "yki_practice", "yki_exam", "professional_finnish", "speaking_lab"],
        "latest_session_id": "mock-session-001",
    }
