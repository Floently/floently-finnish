from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.core.config import Settings


class TTSProviderError(RuntimeError):
    pass


class TTSProviderUnavailableError(TTSProviderError):
    pass


class BaseTTSProvider(ABC):
    name: str

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @abstractmethod
    def configured(self) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def synthesize(self, *, text: str, voice_id: str, speed: float) -> bytes:
        raise NotImplementedError

    def status(self) -> str:
        return "ok" if self.configured() else "not_configured"

    def file_extension(self) -> str:
        return "mp3"

    def media_type(self) -> str:
        return "audio/mpeg"

    def sanitize_error(self, exc: Exception) -> str:
        return str(exc)

    def metadata(self) -> dict[str, Any]:
        return {"provider": self.name, "configured": self.configured()}
