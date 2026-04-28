from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from engine.media.audio_cache_manager import CACHE_DIR, ensure_cache_dir


REGISTRY_PATH = CACHE_DIR / "media_registry.json"


def ensure_registry() -> Path:
    ensure_cache_dir()
    if not REGISTRY_PATH.exists():
        REGISTRY_PATH.write_text("{}", encoding="utf-8")
    return REGISTRY_PATH


def _read_registry() -> dict[str, Any]:
    ensure_registry()
    try:
        payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except Exception:
        payload = {}
    return payload if isinstance(payload, dict) else {}


def _write_registry(payload: dict[str, Any]) -> None:
    ensure_registry()
    REGISTRY_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def register_audio(
    audio_asset_id: str,
    *,
    audio_path: str,
    provider: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    asset_id = str(audio_asset_id or "").strip()
    if not asset_id:
        raise ValueError("audio_asset_id is required")
    record = {
        "audio_asset_id": asset_id,
        "audio_path": str(audio_path),
        "provider": str(provider or "fixture"),
        "metadata": metadata or {},
    }
    payload = _read_registry()
    payload[asset_id] = record
    _write_registry(payload)
    return record


def lookup_audio(audio_asset_id: str) -> dict[str, Any] | None:
    asset_id = str(audio_asset_id or "").strip()
    if not asset_id:
        return None
    payload = _read_registry()
    record = payload.get(asset_id)
    return record if isinstance(record, dict) else None
