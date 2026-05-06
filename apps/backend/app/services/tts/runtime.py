from __future__ import annotations

import json
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.config import SETTINGS
from app.core.paths import RUNTIME_DIR
from app.services.tts.voice_registry import provider_voice_name

_CACHE_DIR = RUNTIME_DIR / 'tts_cache'
_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# OpenAI voices kept here as a small lookup since the OpenAI TTS provider
# doesn't need persona-aware variety. For Google, we ALWAYS use the registry
# via provider_voice_name() to ensure consistent behavior across the app.
_OPENAI_VOICES: dict[str, str] = {"female": "nova", "male": "onyx", "neutral": "nova"}
_DEV_VOICE = "dev"


class TTSRouterError(RuntimeError):
    pass


class TTSProviderFailure(RuntimeError):
    def __init__(self, voice_profile: str | None, failures: list[str]):
        self.voice_profile = voice_profile
        self.failures = failures
        super().__init__(self.message())

    def message(self) -> str:
        joined = '; '.join(self.failures) if self.failures else 'TTS provider unavailable.'
        return joined


@dataclass
class TTSResolvedAudio:
    url: str
    duration_seconds: float | None
    provider: str
    replayable: bool
    voice_profile: str | None
    cache_key: str
    cached: bool


def _meta_path(cache_key: str) -> Path:
    return _CACHE_DIR / f'{cache_key}.json'


def _audio_path(cache_key: str, extension: str = "mp3") -> Path:
    return _CACHE_DIR / f'{cache_key}.{extension}'


def provider_health() -> dict[str, str]:
    from app.services.tts.providers.google import GoogleTTSProvider
    from app.services.tts.providers.openai import OpenAIProvider
    from app.services.tts.providers.development_fallback import DevelopmentFallbackProvider

    google = GoogleTTSProvider(SETTINGS)
    openai = OpenAIProvider(SETTINGS)
    dev = DevelopmentFallbackProvider(SETTINGS)
    return {
        'google': google.status(),
        'openai': openai.status(),
        'development_fallback': 'ok' if SETTINGS.dev_mode and dev.configured() else 'disabled',
        'voice_registry': 'ok',
    }


def get_cached_audio_file(cache_key: str) -> tuple[Path, dict[str, Any]]:
    meta_path = _meta_path(cache_key)
    if not meta_path.exists():
        raise FileNotFoundError(cache_key)
    metadata = json.loads(meta_path.read_text(encoding='utf-8'))
    extension = str(metadata.get("file_extension") or "mp3")
    audio_path = _audio_path(cache_key, extension)
    if not audio_path.exists():
        raise FileNotFoundError(cache_key)
    return audio_path, metadata


async def resolve_tts_audio(
    *,
    text: str,
    voice: str,
    voice_profile: str | None,
    provider: str | None = None,
    speed: float,
    replayable: bool,
) -> TTSResolvedAudio:
    cache_key = f'tts_{uuid.uuid5(uuid.NAMESPACE_URL, f"{provider}:{voice}:{voice_profile}:{speed}:{text}").hex}'
    meta_path = _meta_path(cache_key)

    if meta_path.exists():
        metadata = json.loads(meta_path.read_text(encoding='utf-8'))
        extension = str(metadata.get("file_extension") or "mp3")
        audio_path = _audio_path(cache_key, extension)
        if audio_path.exists():
            return TTSResolvedAudio(
                url=f'/api/v1/voice/tts/audio/{cache_key}.{extension}',
                duration_seconds=metadata.get('duration_seconds'),
                provider=str(metadata.get('provider') or provider or SETTINGS.tts_default_provider),
                replayable=bool(metadata.get('replayable', replayable)),
                voice_profile=metadata.get('voice_profile'),
                cache_key=cache_key,
                cached=True,
            )

    provider_order = _ordered_providers(provider, voice, voice_profile=voice_profile)
    if not provider_order:
        raise TTSRouterError('No TTS provider is configured for this deployment.')

    failures: list[str] = []
    active_provider = None
    voice_id = None
    audio_bytes = None
    for candidate_provider, candidate_voice_id in provider_order:
        try:
            audio_bytes = await candidate_provider.synthesize(text=text, voice_id=candidate_voice_id, speed=speed)
            active_provider = candidate_provider
            voice_id = candidate_voice_id
            break
        except Exception as exc:
            failures.append(f"{candidate_provider.name}: {exc}")

    if active_provider is None or audio_bytes is None:
        raise TTSProviderFailure(voice_profile, failures)

    extension = active_provider.file_extension()
    audio_path = _audio_path(cache_key, extension)
    audio_path.write_bytes(audio_bytes)

    metadata: dict[str, Any] = {
        'provider': active_provider.name,
        'voice_profile': voice_profile or voice,
        'voice_id': voice_id,
        'duration_seconds': None,
        'replayable': replayable,
        'media_type': active_provider.media_type(),
        'file_extension': extension,
        'text_preview': text[:120],
    }
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')

    return TTSResolvedAudio(
        url=f'/api/v1/voice/tts/audio/{cache_key}.{extension}',
        duration_seconds=None,
        provider=active_provider.name,
        replayable=replayable,
        voice_profile=voice_profile or voice,
        cache_key=cache_key,
        cached=False,
    )


def _ordered_providers(requested_provider: str | None, voice_hint: str, voice_profile: str | None = None) -> list[tuple]:
    """Return list of (provider_instance, voice_id) tuples in try order, configured-only."""
    from app.services.tts.providers.google import GoogleTTSProvider
    from app.services.tts.providers.openai import OpenAIProvider
    from app.services.tts.providers.development_fallback import DevelopmentFallbackProvider

    hint = str(voice_hint or "female").strip().lower()
    resolved_profile = str(voice_profile or f"yki_standard_{hint}").strip()
    google_voice = (
        provider_voice_name("google", voice_profile=resolved_profile, voice_hint=hint)
        or SETTINGS.google_tts_default_voice
        or ("fi-FI-Standard-B" if hint == "male" else "fi-FI-Standard-A")
    )
    registry = {
        "google": (GoogleTTSProvider(SETTINGS), google_voice),
        "openai": (OpenAIProvider(SETTINGS), _OPENAI_VOICES.get(hint, "nova")),
        "development_fallback": (DevelopmentFallbackProvider(SETTINGS), _DEV_VOICE),
    }
    requested = str(requested_provider or "").strip().lower()
    order: list[str] = []
    allow_development_fallback = SETTINGS.dev_mode and str(SETTINGS.environment or SETTINGS.app_env or "").strip().lower() in {
        "development",
        "dev",
        "local",
        "test",
        "testing",
    }
    for candidate in (
        requested,
        SETTINGS.tts_default_provider,
        SETTINGS.tts_fallback_provider,
        "development_fallback" if allow_development_fallback else "",
    ):
        normalized = str(candidate or "").strip().lower()
        if normalized and normalized in registry and normalized not in order:
            order.append(normalized)

    result = []
    for name in order:
        provider_instance, voice_id = registry[name]
        if name == "development_fallback" and not allow_development_fallback:
            continue
        if provider_instance.configured():
            result.append((provider_instance, voice_id))
    return result
