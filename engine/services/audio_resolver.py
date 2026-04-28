from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    import httpx
except ImportError:  # pragma: no cover - exercised in minimal local environments
    class _MissingHttpx:
        @staticmethod
        def post(*args: Any, **kwargs: Any) -> Any:
            raise RuntimeError("httpx is not installed")

    httpx = _MissingHttpx()

from engine.exam.tts_voice_manager import ensure_voice_profile
from engine.media.media_registry import lookup_audio
from engine.media.tts_engine import audio_url_for_asset, generate_audio
from engine.runtime.logging_v3_3 import log_event
from engine.runtime.resilience import RetryPolicy, retry_sync


class MediaIntegrityError(RuntimeError):
    pass


PUHIS_BASE_URL = str(os.getenv("PUHIS_BASE_URL", "") or "").strip().rstrip("/")
PUHIS_TIMEOUT_SECONDS = float(os.getenv("PUHIS_TTS_TIMEOUT_SECONDS", "60"))
PUHIS_INTERNAL_TTS_TOKEN = os.getenv("PUHIS_INTERNAL_TTS_TOKEN", "").strip()
PUHIS_RETRY_POLICY = RetryPolicy(
    attempts=5,
    initial_delay_seconds=float(os.getenv("PUHIS_TTS_RETRY_INITIAL_SECONDS", "0.25")),
    max_delay_seconds=float(os.getenv("PUHIS_TTS_RETRY_MAX_SECONDS", "3.0")),
    backoff_multiplier=2.0,
    jitter_ratio=0.2,
)


def _estimate_duration_seconds(text: str) -> float:
    words = max(1, len([part for part in str(text or "").split() if part.strip()]))
    return round(max(1.0, words / 2.6), 2)


def _static_audio_object(audio_asset_id: str, transcript: str) -> dict[str, Any] | None:
    if not audio_asset_id:
        return None
    record = lookup_audio(audio_asset_id)
    if not record:
        return None
    audio_path = Path(str(record.get("audio_path", "")))
    if not audio_path.exists():
        return None
    metadata = record.get("metadata") if isinstance(record.get("metadata"), dict) else {}
    duration_seconds = float(metadata.get("duration_seconds") or 0.0)
    if duration_seconds <= 0:
        duration_seconds = _estimate_duration_seconds(transcript)
    return {
        "url": audio_url_for_asset(audio_asset_id),
        "duration_seconds": duration_seconds,
        "provider": "static",
        "replayable": True,
    }


def _voice_profile_for_hint(voice: str) -> str:
    normalized_voice = str(voice or "").strip().lower()
    if normalized_voice == "male":
        return "yki_standard_male"
    return "yki_standard_female"


def _is_localhost_url(url: str) -> bool:
    if not url:
        return False
    parsed = urlparse(url)
    hostname = str(parsed.hostname or "").strip().lower()
    return hostname in {"127.0.0.1", "localhost", "0.0.0.0"}


def _validate_public_audio_url(url: str) -> str:
    normalized = str(url or "").strip()
    if not normalized:
        raise MediaIntegrityError("Audio URL missing from provider payload")
    if normalized.startswith("http") and _is_localhost_url(normalized):
        raise MediaIntegrityError("Audio URL cannot point to localhost")
    if normalized.startswith("/") and not PUHIS_BASE_URL:
        raise MediaIntegrityError("Relative audio URL requires PUHIS_BASE_URL to be configured")
    return normalized if normalized.startswith("http") else f"{PUHIS_BASE_URL}{normalized}"


def _engine_audio_object(
    *,
    transcript: str,
    audio_asset_id: str,
    voice: str,
    voice_profile: str | None = None,
) -> dict[str, Any]:
    estimated_duration = _estimate_duration_seconds(transcript)
    resolved_voice_profile = ensure_voice_profile(
        voice_profile or _voice_profile_for_hint(voice)
    )
    log_event(
        "TTS_REQUEST",
        audio_asset_id=audio_asset_id,
        voice=voice,
        voice_profile=resolved_voice_profile,
        transport="engine_fallback",
    )
    record = generate_audio(
        transcript,
        resolved_voice_profile,
        audio_asset_id=audio_asset_id,
        metadata={"duration_seconds": estimated_duration},
    )
    metadata = record.get("metadata") if isinstance(record.get("metadata"), dict) else {}
    duration_seconds = float(metadata.get("duration_seconds") or estimated_duration)
    payload = {
        "url": audio_url_for_asset(audio_asset_id),
        "duration_seconds": duration_seconds,
        "provider": str(record.get("provider") or "engine"),
        "replayable": True,
    }
    log_event(
        "TTS_RESPONSE",
        audio_asset_id=audio_asset_id,
        voice_profile=resolved_voice_profile,
        provider=payload["provider"],
        duration_seconds=payload["duration_seconds"],
        transport="engine_fallback",
    )
    return payload


def resolve_audio(
    *,
    transcript: str,
    audio_asset_id: str = "",
    voice: str = "female",
    voice_profile: str | None = None,
    speed: float = 1.0,
) -> dict[str, Any]:
    static_audio = _static_audio_object(audio_asset_id.strip(), transcript)
    if static_audio:
        return static_audio

    normalized_transcript = str(transcript or "").strip()
    if not normalized_transcript:
        raise MediaIntegrityError("Transcript missing for dynamic audio resolution")

    puhis_error: Exception | None = None
    payload: dict[str, Any] | None = None
    resolved_voice_profile = ensure_voice_profile(
        voice_profile or _voice_profile_for_hint(voice)
    )
    headers = {}
    if PUHIS_INTERNAL_TTS_TOKEN:
        headers["x-internal-tts-token"] = PUHIS_INTERNAL_TTS_TOKEN
    for path in ("/api/tts/generate", "/voice/tts/generate"):
        if not PUHIS_BASE_URL:
            break
        try:
            def _request_provider_audio() -> dict[str, Any]:
                log_event(
                    "TTS_REQUEST",
                    audio_asset_id=audio_asset_id.strip(),
                    voice=voice,
                    voice_profile=resolved_voice_profile,
                    transport="puhis_http",
                    path=path,
                )
                response = httpx.post(
                    f"{PUHIS_BASE_URL}{path}",
                    json={
                        "text": normalized_transcript,
                        "voice": voice,
                        "voice_profile": resolved_voice_profile,
                        "speed": float(speed),
                        "replayable": True,
                    },
                    headers=headers,
                    timeout=PUHIS_TIMEOUT_SECONDS,
                )
                response.raise_for_status()
                return response.json()

            payload = retry_sync(
                _request_provider_audio,
                is_retryable=lambda exc: True,
                on_retry=lambda attempt, exc, delay: log_event(
                    "TTS_RETRY",
                    audio_asset_id=audio_asset_id.strip(),
                    voice_profile=resolved_voice_profile,
                    transport="puhis_http",
                    path=path,
                    attempt=attempt,
                    delay_seconds=round(delay, 3),
                    error=str(exc),
                ),
                policy=PUHIS_RETRY_POLICY,
            )
            audio = payload.get("audio") if isinstance(payload, dict) else None
            log_event(
                "TTS_RESPONSE",
                audio_asset_id=audio_asset_id.strip(),
                voice_profile=resolved_voice_profile,
                provider=str((audio or {}).get("provider") or ""),
                duration_seconds=float((audio or {}).get("duration_seconds") or 0.0),
                transport="puhis_http",
                path=path,
            )
            break
        except Exception as exc:
            puhis_error = exc

    if payload is None:
        try:
            return _engine_audio_object(
                transcript=normalized_transcript,
                audio_asset_id=audio_asset_id.strip(),
                voice=voice,
                voice_profile=resolved_voice_profile,
            )
        except Exception as exc:
            detail = (
                "Puhis audio resolution failed"
                if puhis_error is None
                else f"Puhis audio resolution failed: {puhis_error}"
            )
            raise MediaIntegrityError(
                f"{detail}; engine fallback failed: {exc}"
            ) from exc

    audio = payload.get("audio") if isinstance(payload, dict) else None
    if not isinstance(audio, dict):
        raise MediaIntegrityError("Puhis audio resolution returned no audio object")

    url = str(audio.get("url", "")).strip()
    duration_seconds = float(audio.get("duration_seconds") or 0.0)
    provider = str(audio.get("provider", "")).strip()
    if not url or duration_seconds <= 0 or not provider:
        raise MediaIntegrityError("Puhis audio resolution returned incomplete audio metadata")
    return {
        "url": _validate_public_audio_url(url),
        "duration_seconds": duration_seconds,
        "provider": provider,
        "replayable": bool(audio.get("replayable", True)),
    }
