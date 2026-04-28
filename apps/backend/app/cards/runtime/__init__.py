"""Runtime system for serving validated learning cards."""

__all__ = [
    "CardRepository",
    "CardRuntimeService",
    "CardSessionEngine",
]


def __getattr__(name: str):
    if name == "CardRepository":
        from .repositories.card_repository import CardRepository

        return CardRepository
    if name == "CardRuntimeService":
        from .services.card_runtime_service import CardRuntimeService

        return CardRuntimeService
    if name == "CardSessionEngine":
        from .session_engine.engine import CardSessionEngine

        return CardSessionEngine
    raise AttributeError(name)
