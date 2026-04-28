from __future__ import annotations

from pydantic import BaseModel, Field


MAX_TTS_TEXT_LENGTH = 4000


class GenerateTTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TTS_TEXT_LENGTH)
    voice: str = Field(default="female", min_length=1, max_length=64)
    voice_profile: str | None = Field(default=None, min_length=1, max_length=64)
    provider: str | None = Field(default=None, pattern=r"^(google|openai|azure|elevenlabs)$")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    replayable: bool = True
