from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from engine.media.audio_cache_manager import CACHE_DIR, ensure_cache_dir
from engine.media.media_registry import register_audio


@dataclass(frozen=True)
class TtsProvider:
    name: str


class DeterministicFixtureProvider:
    name = "fixture"

    def synthesize(self, transcript: str, voice_profile: str) -> bytes:
        digest = hashlib.sha256(f"{voice_profile}:{transcript}".encode("utf-8")).hexdigest().encode("ascii")
        return b"ID3-FIXTURE-" + digest


def hash_transcript(transcript: str, voice_profile: str) -> str:
    return hashlib.sha256(f"{voice_profile}:{transcript}".encode("utf-8")).hexdigest()


def audio_url_for_asset(audio_asset_id: str) -> str:
    return f"/api/audio/{audio_asset_id}.mp3"


def provider_order(_voice_profile: str | None) -> list[TtsProvider]:
    return [
        TtsProvider("elevenlabs"),
        TtsProvider("azure"),
        TtsProvider("openai"),
        TtsProvider("google"),
        TtsProvider("fixture"),
    ]


def _provider_name() -> str:
    configured = str(os.getenv("YKI_TTS_PROVIDER", "")).strip().lower()
    return configured or "fixture"


def _estimate_duration_seconds(text: str) -> float:
    words = max(1, len([part for part in str(text or "").split() if part.strip()]))
    return round(max(1.0, words / 2.6), 2)


def _audio_path_for_hash(content_hash: str) -> Path:
    ensure_cache_dir()
    return CACHE_DIR / f"{content_hash}.mp3"


def generate_audio(
    transcript: str,
    voice_profile: str,
    *,
    audio_asset_id: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    normalized_transcript = str(transcript or "").strip()
    normalized_profile = str(voice_profile or "").strip() or "yki_standard_female"
    if not normalized_transcript:
        raise ValueError("Transcript is required for TTS generation")

    content_hash = hash_transcript(normalized_transcript, normalized_profile)
    audio_path = _audio_path_for_hash(content_hash)
    if not audio_path.exists():
        payload = DeterministicFixtureProvider().synthesize(normalized_transcript, normalized_profile)
        audio_path.write_bytes(payload)

    merged_metadata = {
        "duration_seconds": _estimate_duration_seconds(normalized_transcript),
        **(metadata or {}),
    }
    provider = _provider_name()
    record = register_audio(
        str(audio_asset_id or content_hash),
        audio_path=str(audio_path),
        provider=provider,
        metadata=merged_metadata,
    )
    return {
        **record,
        "url": audio_url_for_asset(str(audio_asset_id or content_hash)),
    }
