from __future__ import annotations

import httpx

from .base import BaseTTSProvider, TTSProviderError, TTSProviderUnavailableError


class ElevenLabsProvider(BaseTTSProvider):
    name = "elevenlabs"

    def configured(self) -> bool:
        return bool(self.settings.eleven_api_key and str(self.settings.eleven_api_key).strip())

    async def synthesize(self, *, text: str, voice_id: str, speed: float) -> bytes:
        if not self.configured():
            raise TTSProviderUnavailableError("ElevenLabs API key not configured")

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": str(self.settings.eleven_api_key or ""),
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.4,
                "similarity_boost": 0.8,
                "speed": float(speed),
            },
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
        try:
            response.raise_for_status()
        except Exception as exc:
            raise TTSProviderError(f"ElevenLabs request failed: {exc}") from exc
        return response.content
