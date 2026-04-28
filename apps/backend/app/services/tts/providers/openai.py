from __future__ import annotations

import httpx

from .base import BaseTTSProvider, TTSProviderError, TTSProviderUnavailableError


class OpenAIProvider(BaseTTSProvider):
    name = "openai"

    def configured(self) -> bool:
        return bool(
            self.settings.openai_tts_enabled
            and self.settings.openai_api_key
            and str(self.settings.openai_api_key).strip()
        )

    async def synthesize(self, *, text: str, voice_id: str, speed: float) -> bytes:
        if not self.configured():
            raise TTSProviderUnavailableError("OpenAI API key not configured")
        normalized_text = str(text or "").strip()
        if not normalized_text:
            raise TTSProviderError("OpenAI TTS input text is empty")

        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.settings.openai_tts_model or "tts-1",
            "input": normalized_text,
            "voice": voice_id,
            "response_format": "mp3",
            "speed": float(speed),
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post("https://api.openai.com/v1/audio/speech", headers=headers, json=payload)
        try:
            response.raise_for_status()
        except Exception as exc:
            raise TTSProviderError(f"OpenAI request failed: {exc}") from exc
        if not response.content:
            raise TTSProviderError("OpenAI returned empty audio")
        return response.content
