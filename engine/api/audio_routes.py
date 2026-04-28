from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from engine.media.audio_cache_manager import CACHE_DIR
from engine.media.media_registry import lookup_audio
from engine.media.media_registry import REGISTRY_PATH


router = APIRouter(prefix="/api/audio", tags=["audio"])


@router.get("/health")
def audio_health():
    return {
        "tts": "ok",
        "audio_storage": "ok" if CACHE_DIR.exists() else "missing",
        "registry": "ok" if REGISTRY_PATH.exists() else "missing",
    }


@router.get("/{audio_asset_id}.mp3")
def stream_audio_asset(audio_asset_id: str):
    record = lookup_audio(audio_asset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Audio asset not found")

    audio_path = Path(str(record.get("audio_path", "")))
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file missing from cache")

    return FileResponse(audio_path, media_type="audio/mpeg", filename=f"{audio_asset_id}.mp3")
