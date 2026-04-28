from __future__ import annotations

import io
import logging
import os
import shutil
import sys
import traceback
from typing import Any

from app.core.errors import AppError
from app.runtime.voice import pronunciation_feedback, save_voice_file
from app.core.config import get_settings
from app.services.tts.providers.google import GoogleTTSProvider
from app.services.tts.providers.openai import OpenAIProvider
from app.services.tts.providers.development_fallback import DevelopmentFallbackProvider
from app.services.tts.runtime import TTSProviderFailure, TTSRouterError, provider_health, resolve_tts_audio
from app.services.tts.voice_registry import validate_voice_registry

ALLOWED_AUDIO_MIME_TYPES = {"audio/m4a", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp3"}
MIN_AUDIO_BYTES = 256  # anything smaller is almost certainly a broken recording, not speech
_SILENCE_FAILURE_MARKERS = ("openai_returned_empty_transcript", "google_returned_empty_transcript")
_TOO_SHORT_FAILURE_MARKERS = ("audio_too_short", "too_short")
_CONFIG_FAILURE_MARKERS = (
    "openai_not_configured",
    "openai_disabled",
    "google_speech_package_unavailable",
    "pydub_import_failed",
)
_CONNECTIVITY_FAILURE_MARKERS = (
    "apiconnectionerror",
    "connecterror",
    "connection error",
    "name or service not known",
    "temporary failure in name resolution",
    "timed out",
    "timeout",
)
_AUTH_FAILURE_MARKERS = (
    "invalid_api_key",
    "authenticationerror",
    "unauthorized",
    "401",
    "invalid api key",
    "incorrect api key",
)
_PERMISSION_FAILURE_MARKERS = (
    "permissiondenied",
    "service_disabled",
    "403",
    "insufficient permission",
    "api has not been used",
    "access denied",
)


def _configure_voice_logger() -> logging.Logger:
    """Ensure voice-service warnings actually reach stderr/dev.log regardless of uvicorn's root config."""
    logger = logging.getLogger("floently.voice.service")
    logger.setLevel(logging.DEBUG)
    already_has_stream = any(isinstance(h, logging.StreamHandler) for h in logger.handlers)
    if not already_has_stream:
        handler = logging.StreamHandler(stream=sys.stderr)
        handler.setLevel(logging.DEBUG)
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
        logger.addHandler(handler)
    logger.propagate = True
    return logger


_LOG = _configure_voice_logger()


def _pin_pydub_ffmpeg() -> None:
    """Pydub shells out to ffmpeg via subprocess; pin absolute paths so a stripped PATH can't break us."""
    ffmpeg_path = shutil.which("ffmpeg")
    ffprobe_path = shutil.which("ffprobe")
    if not ffmpeg_path:
        _LOG.warning("ffmpeg not found on PATH from backend process; Google STT will not work for non-wav inputs")
        return
    try:
        from pydub import AudioSegment  # type: ignore
        AudioSegment.converter = ffmpeg_path
        if ffprobe_path:
            AudioSegment.ffprobe = ffprobe_path
        _LOG.info("Pinned pydub to ffmpeg=%s ffprobe=%s", ffmpeg_path, ffprobe_path)
    except Exception as exc:
        _LOG.warning("Could not pin pydub ffmpeg paths: %s", exc)


_pin_pydub_ffmpeg()


def _has_any_marker(failures: list[str], markers: tuple[str, ...]) -> bool:
    lowered = [f.lower() for f in failures]
    return any(any(marker in item for marker in markers) for item in lowered)


def _classify_stt_failures(failures: list[str]) -> tuple[str, str, bool]:
    if _has_any_marker(failures, _SILENCE_FAILURE_MARKERS):
        return (
            "SILENCE_DETECTED",
            "No speech was detected. Please speak a little louder and closer to the microphone.",
            True,
        )
    if _has_any_marker(failures, _TOO_SHORT_FAILURE_MARKERS):
        return (
            "AUDIO_TOO_SHORT",
            "Recording was too short. Please hold the microphone for at least one second.",
            True,
        )
    if _has_any_marker(failures, _CONFIG_FAILURE_MARKERS):
        return (
            "STT_NOT_CONFIGURED",
            "Voice transcription is not configured on the server.",
            False,
        )
    if _has_any_marker(failures, _CONNECTIVITY_FAILURE_MARKERS):
        return (
            "STT_PROVIDER_UNREACHABLE",
            "Voice transcription provider is unreachable right now. Check network and try again.",
            False,
        )
    if _has_any_marker(failures, _AUTH_FAILURE_MARKERS):
        return (
            "STT_PROVIDER_AUTH_FAILED",
            "Voice transcription provider authentication failed. Backend credentials are invalid at runtime.",
            False,
        )
    if _has_any_marker(failures, _PERMISSION_FAILURE_MARKERS):
        return (
            "STT_PROVIDER_PERMISSION_FAILED",
            "Voice transcription provider is configured but missing permissions or API enablement for this runtime project.",
            False,
        )
    return (
        "STT_PROVIDER_ERROR",
        "Voice transcription is temporarily unavailable. Please try again in a moment.",
        False,
    )


def _to_linear16(raw: bytes, src_format: str) -> tuple[tuple[bytes, int] | None, str | None]:
    """Return ((pcm_bytes, sample_rate), None) on success, or (None, failure_reason) on failure."""
    try:
        from pydub import AudioSegment  # type: ignore
    except Exception as exc:
        reason = f"pydub_import_failed: {exc!r}"
        _LOG.warning(reason)
        return None, reason
    try:
        seg = AudioSegment.from_file(io.BytesIO(raw), format=src_format)
        seg = seg.set_channels(1).set_frame_rate(16000).set_sample_width(2)
        if len(seg) < 200:  # less than 200 ms of audio
            return None, f"audio_too_short: {len(seg)}ms"
        return (seg.raw_data, 16000), None
    except Exception as exc:
        reason = f"pydub_conversion_failed ({src_format}): {type(exc).__name__}: {exc}"
        _LOG.warning("%s\n%s", reason, traceback.format_exc())
        return None, reason


def _guess_src_format(filename: str, mime_type: str) -> str:
    lower_name = (filename or "").lower()
    lower_mime = (mime_type or "").lower()
    if lower_name.endswith((".m4a", ".mp4")) or "mp4" in lower_mime or "m4a" in lower_mime:
        return "mp4"
    if lower_name.endswith(".webm") or "webm" in lower_mime:
        return "webm"
    if lower_name.endswith(".mp3") or lower_mime.endswith("mpeg") or "mp3" in lower_mime:
        return "mp3"
    if lower_name.endswith(".ogg") or "ogg" in lower_mime:
        return "ogg"
    if lower_name.endswith(".wav") or "wav" in lower_mime:
        return "wav"
    return "mp4"


def _transcribe_with_google(raw: bytes, filename: str, locale: str, mime_type: str) -> tuple[str | None, str | None]:
    """Return (transcript, failure_reason). transcript is None on failure; failure_reason explains why."""
    settings = get_settings()
    creds_path = str(settings.google_tts_credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    try:
        from google.cloud import speech as google_speech  # type: ignore
    except Exception as exc:
        reason = f"google_speech_package_unavailable: {exc!r}"
        _LOG.warning(reason)
        return None, reason

    converted, conv_reason = _to_linear16(raw, _guess_src_format(filename, mime_type))
    if not converted:
        return None, conv_reason or "linear16_conversion_failed"
    pcm_bytes, sample_rate = converted

    try:
        if creds_path:
            import google.oauth2.service_account as sa  # type: ignore
            credentials = sa.Credentials.from_service_account_file(
                creds_path,
                scopes=["https://www.googleapis.com/auth/cloud-platform"],
            )
            client = google_speech.SpeechClient(credentials=credentials)
        else:
            client = google_speech.SpeechClient()

        language_code = locale if "-" in locale else f"{locale}-FI"
        config = google_speech.RecognitionConfig(
            encoding=google_speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=sample_rate,
            language_code=language_code,
            alternative_language_codes=["fi-FI"],
            enable_automatic_punctuation=True,
        )
        audio = google_speech.RecognitionAudio(content=pcm_bytes)
        response = client.recognize(config=config, audio=audio)
        parts = [r.alternatives[0].transcript for r in response.results if r.alternatives]
        text = " ".join(parts).strip()
        if not text:
            return None, "google_returned_empty_transcript"
        return text, None
    except Exception as exc:
        reason = f"google_exception: {type(exc).__name__}: {exc}"
        _LOG.warning("Google STT failed: %s\n%s", reason, traceback.format_exc())
        return None, reason


def _transcribe_with_openai(raw: bytes, filename: str, locale: str) -> tuple[str | None, str | None]:
    """Return (transcript, failure_reason). transcript is None on failure; failure_reason explains why."""
    if not get_settings().openai_tts_enabled:
        return None, "openai_disabled"
    api_key = str(get_settings().openai_api_key or os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        return None, "openai_not_configured"
    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:
        reason = f"openai_package_unavailable: {exc!r}"
        _LOG.warning(reason)
        return None, reason
    # Whisper wants a filename with a recognizable audio extension. Default to .m4a for Android mp4.
    safe_name = filename or "audio.m4a"
    lower = safe_name.lower()
    if not any(lower.endswith(ext) for ext in (".m4a", ".mp4", ".mp3", ".wav", ".webm", ".ogg", ".flac", ".mpeg", ".mpga")):
        safe_name = "audio.m4a"
    try:
        client = OpenAI(api_key=api_key)
        bio = io.BytesIO(raw)
        bio.name = safe_name
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=bio,  # type: ignore[arg-type]
            language=(locale or "fi")[:2],
        )
        text = (result.text or "").strip()
        if not text:
            return None, "openai_returned_empty_transcript"
        return text, None
    except Exception as exc:
        reason = f"openai_exception: {type(exc).__name__}: {exc}"
        _LOG.warning("OpenAI STT failed: %s\n%s", reason, traceback.format_exc())
        return None, reason


def _transcribe_best_effort(
    raw: bytes, filename: str, mime_type: str, locale: str
) -> tuple[str | None, str | None, bool, list[str], list[dict[str, str]]]:
    """Try providers in order. Return (transcript, provider_used, stt_available, failure_reasons).

    stt_available is True only if at least one provider actually attempted the call and returned
    meaningful output, OR if providers are configured but produced only empty transcripts (silent
    audio). stt_available is False when every configured provider failed for infrastructure reasons
    (import error, API exception, conversion failure) so the client can show an honest error.
    """
    failures: list[str] = []
    provider_results: list[dict[str, str]] = []

    transcript, reason = _transcribe_with_openai(raw, filename, locale)
    if transcript:
        provider_results.append({"provider": "openai", "status": "success"})
        return transcript, "openai", True, failures, provider_results
    if reason:
        failures.append(f"openai: {reason}")
        provider_results.append({"provider": "openai", "status": "failed", "reason": reason})

    transcript, reason = _transcribe_with_google(raw, filename, locale, mime_type)
    if transcript:
        provider_results.append({"provider": "google", "status": "success"})
        return transcript, "google", True, failures, provider_results
    if reason:
        failures.append(f"google: {reason}")
        provider_results.append({"provider": "google", "status": "failed", "reason": reason})

    # If at least one provider reached a valid "no speech"/"too short" conclusion,
    # treat STT as available even if another provider failed.
    stt_available = _has_any_marker(failures, _SILENCE_FAILURE_MARKERS + _TOO_SHORT_FAILURE_MARKERS)
    return None, None, stt_available, failures, provider_results


def get_stt_runtime_snapshot() -> dict[str, Any]:
    settings = get_settings()
    openai_key = str(settings.openai_api_key or "").strip()
    google_creds = str(settings.google_tts_credentials_path or "").strip()
    return {
        "openai_api_key_present": bool(openai_key),
        "openai_api_key_source": "settings.openai_api_key",
        "google_credentials_path": google_creds or None,
        "google_credentials_path_exists": bool(google_creds and os.path.exists(google_creds)),
        "google_application_credentials_env_present": bool(str(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()),
        "openai_api_key_env_present": bool(str(os.getenv("OPENAI_API_KEY") or "").strip()),
        "openai_stt_api_key_env_present": bool(str(os.getenv("OPENAI_STT_API_KEY") or "").strip()),
        "stt_provider_attempt_order": ["openai", "google"],
    }


def transcribe_audio(
    *,
    raw_bytes: bytes,
    filename: str,
    mime_type: str,
    duration_ms: int | None,
    session_id: str,
    speaking_session_id: str | None,
    turn_id: str | None,
    task_id: str | None,
    mode: str,
    locale: str,
) -> dict[str, Any]:
    if not raw_bytes:
        raise AppError(400, "VALIDATION_ERROR", "Audio file is required.", False, {"classification": "non_retryable"})
    if len(raw_bytes) < MIN_AUDIO_BYTES:
        raise AppError(
            400,
            "AUDIO_TOO_SHORT",
            "Recording is too short. Please hold the microphone for at least one second and try again.",
            False,
            {"classification": "non_retryable", "byte_count": len(raw_bytes)},
        )
    # Normalize MIME type: strip codec parameters before validation
    # e.g. "audio/webm;codecs=opus" → "audio/webm"
    base_mime = (mime_type or "").split(";")[0].strip().lower()
    if base_mime not in ALLOWED_AUDIO_MIME_TYPES:
        raise AppError(400, "VALIDATION_ERROR", "Unsupported audio mime type.", False, {"classification": "non_retryable", "mime_type": mime_type})
    if duration_ms is not None and duration_ms < 0:
        raise AppError(400, "VALIDATION_ERROR", "duration_ms must be zero or greater.", False, {"classification": "non_retryable"})

    effective_speaking_session_id = speaking_session_id or session_id
    audio_ref, audio_path = save_voice_file(
        raw_bytes=raw_bytes,
        filename=filename,
        mime_type=mime_type,
        mode=mode,
        session_id=session_id,
        task_id=task_id,
        turn_id=turn_id,
    )

    transcript, provider, stt_available, failures, provider_results = _transcribe_best_effort(raw_bytes, filename, mime_type, locale)

    if transcript:
        _LOG.info(
            "STT success: provider=%s bytes=%d locale=%s file=%s",
            provider, len(raw_bytes), locale, filename,
        )
    else:
        _LOG.warning(
            "STT produced no transcript: bytes=%d locale=%s file=%s mime=%s path=%s failures=%s",
            len(raw_bytes), locale, filename, mime_type, audio_path, failures,
        )

    response: dict[str, Any] = {
        "ok": True,
        "audio_ref": audio_ref,
        "transcript": transcript,
        "text": transcript,
        "stt_available": bool(transcript) or stt_available,
        "mode": mode,
        "locale": locale,
        "duration_ms": duration_ms,
        "provider": provider,
        "provider_attempt_order": ["openai", "google"],
        "provider_results": provider_results,
        "session_id": session_id,
        "speaking_session_id": effective_speaking_session_id,
    }
    # Surface the real reason(s) in the response when transcription failed. This is the key change:
    # the frontend can now show an actionable error ("microphone was silent" vs "provider down")
    # instead of the generic "No speech detected".
    if not transcript:
        response["failure_reasons"] = failures
        if failures:
            error_code, error_message, derived_stt_available = _classify_stt_failures(failures)
            response["error_code"] = error_code
            response["error_message"] = error_message
            response["stt_available"] = bool(response["stt_available"] or derived_stt_available)
    return response


async def create_tts_request(*, payload: dict[str, Any]) -> dict[str, Any]:
    text = str(payload.get("text") or "").strip()
    if not text:
        raise AppError(
            400,
            "VALIDATION_ERROR",
            "text is required.",
            False,
            {"classification": "non_retryable"},
        )

    voice_preference = str(payload.get("voice_preference") or "female").strip().lower() or "female"
    if voice_preference == "neutral":
        voice_preference = "female"

    try:
        resolved = await resolve_tts_audio(
            text=text,
            voice=voice_preference,
            voice_profile=payload.get("voice_profile"),
            provider=payload.get("provider"),
            speed=float(payload.get("speed") or 1.0),
            replayable=bool(payload.get("replayable", True)),
        )
    except TTSProviderFailure as exc:
        raise AppError(
            503,
            "VOICE_TTS_PROVIDER_FAILURE",
            exc.message(),
            True,
            {
                "classification": "retryable",
                "voice_profile": exc.voice_profile,
                "failures": exc.failures,
            },
        ) from exc
    except TTSRouterError as exc:
        raise AppError(
            503,
            "VOICE_TTS_UNAVAILABLE",
            str(exc),
            True,
            {"classification": "retryable"},
        ) from exc

    return {
        "audio": {
            "url": resolved.url,
            "duration_seconds": resolved.duration_seconds,
            "provider": resolved.provider,
            "replayable": resolved.replayable,
            "voice_profile": resolved.voice_profile,
        },
        "cache_key": resolved.cache_key,
        "cached": resolved.cached,
        "requested_provider": payload.get("provider"),
    }


def analyze_pronunciation(*, expected_text: str, transcript: str) -> dict[str, Any]:
    return pronunciation_feedback(expected_text=expected_text, transcript=transcript)


def get_tts_health_snapshot() -> dict[str, Any]:
    settings = get_settings()
    google_provider = GoogleTTSProvider(settings)
    openai_provider = OpenAIProvider(settings)
    development_provider = DevelopmentFallbackProvider(settings)
    runtime_env = str(settings.environment or settings.app_env or "").strip().lower()
    allow_development_fallback = settings.dev_mode and runtime_env in {
        "development",
        "dev",
        "local",
        "test",
        "testing",
    }
    google_diagnostics = google_provider.diagnostics()
    google_readiness = (
        "ready"
        if bool(google_diagnostics.get("configured")) and bool(google_diagnostics.get("credentials_file_exists"))
        else "misconfigured"
    )
    openai_key = str(settings.openai_api_key or "").strip()
    openai_readiness = "ready" if openai_provider.configured() else "misconfigured"
    return {
        "providers": provider_health(),
        "runtime": {
            "environment": settings.environment,
            "app_env": settings.app_env,
            "dev_mode": settings.dev_mode,
            "development_fallback_allowed": allow_development_fallback,
        },
        "google": google_diagnostics,
        "openai": openai_provider.metadata(),
        "development_fallback": development_provider.metadata(),
        "defaults": {
            "tts_default_provider": settings.tts_default_provider,
            "tts_fallback_provider": settings.tts_fallback_provider,
        },
        "readiness": {
            "google": google_readiness,
            "openai": openai_readiness,
            "openai_key_present": bool(openai_key),
        },
        "voice_registry": validate_voice_registry(),
    }
