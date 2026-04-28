from __future__ import annotations

import io
import math
import wave

from .base import BaseTTSProvider


class DevelopmentFallbackProvider(BaseTTSProvider):
    name = "development_fallback"

    def configured(self) -> bool:
        return True

    def file_extension(self) -> str:
        return "wav"

    def media_type(self) -> str:
        return "audio/wav"

    async def synthesize(self, *, text: str, voice_id: str, speed: float) -> bytes:
        del voice_id
        duration_seconds = min(2.0, max(0.4, len(text.split()) / 6.0))
        sample_rate = 16000
        frame_count = int(sample_rate * duration_seconds)
        amplitude = 12000
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            for index in range(frame_count):
                envelope = 0.6 if (index // 800) % 2 == 0 else 0.3
                sample = int(
                    amplitude
                    * envelope
                    * math.sin(2.0 * math.pi * 440.0 * (index / sample_rate))
                )
                wav_file.writeframesraw(sample.to_bytes(2, "little", signed=True))
        return buffer.getvalue()
