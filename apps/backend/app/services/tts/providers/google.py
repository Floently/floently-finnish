from __future__ import annotations

from pathlib import Path
from typing import Any

from .base import BaseTTSProvider, TTSProviderError, TTSProviderUnavailableError


class GoogleTTSProvider(BaseTTSProvider):
    name = "google"

    def configured(self) -> bool:
        return bool(self.settings.google_tts_enabled and self.settings.google_tts_credentials_path)

    async def synthesize(self, *, text: str, voice_id: str, speed: float) -> bytes:
        if not self.configured():
            raise TTSProviderUnavailableError("Google TTS credentials are not configured")
        normalized_text = str(text or "").strip()
        if not normalized_text:
            raise TTSProviderError("Google TTS input text is empty")
        try:
            from google.cloud import texttospeech  # type: ignore
            import google.oauth2.service_account as sa  # type: ignore
        except Exception as exc:
            raise TTSProviderUnavailableError(f"Google Cloud TTS dependencies are unavailable: {exc}") from exc

        credentials = sa.Credentials.from_service_account_file(
            str(self.settings.google_tts_credentials_path),
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        client = texttospeech.TextToSpeechClient(credentials=credentials)
        voice_name = voice_id or self.settings.google_tts_default_voice
        voice = texttospeech.VoiceSelectionParams(
            language_code=self.settings.google_tts_language_code or "fi-FI",
            name=voice_name,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=float(speed),
        )
        try:
            response = client.synthesize_speech(
                input=texttospeech.SynthesisInput(text=normalized_text),
                voice=voice,
                audio_config=audio_config,
            )
        except Exception as exc:
            raise TTSProviderError(f"Google TTS request failed: {exc}") from exc
        if not response.audio_content:
            raise TTSProviderError("Google TTS returned empty audio")
        return response.audio_content

    def diagnostics(self) -> dict[str, Any]:
        credentials_path = self.settings.google_tts_credentials_path
        credentials_file_exists = bool(credentials_path and Path(credentials_path).is_file())
        return {
            'configured': self.configured(),
            'credentials_path': credentials_path,
            'credentials_file_exists': credentials_file_exists,
            'default_voice': self.settings.google_tts_default_voice,
            'language_code': self.settings.google_tts_language_code,
        }
