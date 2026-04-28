from __future__ import annotations

import httpx

from .base import BaseTTSProvider, TTSProviderError, TTSProviderUnavailableError


class AzureSpeechProvider(BaseTTSProvider):
    name = "azure"

    def configured(self) -> bool:
        return bool(
            self.settings.azure_speech_key
            and str(self.settings.azure_speech_key).strip()
            and self.settings.azure_speech_region
            and str(self.settings.azure_speech_region).strip()
        )

    async def synthesize(self, *, text: str, voice_id: str, speed: float) -> bytes:
        if not self.configured():
            raise TTSProviderUnavailableError("Azure Speech credentials not configured")

        url = (
            f"https://{self.settings.azure_speech_region}.tts.speech.microsoft.com/"
            "cognitiveservices/v1"
        )
        headers = {
            "Ocp-Apim-Subscription-Key": str(self.settings.azure_speech_key or ""),
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        }
        ssml = (
            "<speak version='1.0' xml:lang='fi-FI'>"
            f"<voice name='{voice_id}'><prosody rate='{max(0.5, min(speed, 2.0)):.2f}'>"
            f"{text}</prosody></voice></speak>"
        )
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, content=ssml.encode("utf-8"))
        try:
            response.raise_for_status()
        except Exception as exc:
            raise TTSProviderError(f"Azure request failed: {exc}") from exc
        return response.content
