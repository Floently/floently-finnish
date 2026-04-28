__all__ = [
    "CardRepository",
    "CardRepositoryError",
    "CardSessionRepository",
    "CardSessionRepositoryError",
]


def __getattr__(name: str):
    if name in {"CardRepository", "CardRepositoryError"}:
        from .card_repository import CardRepository, CardRepositoryError

        return {
            "CardRepository": CardRepository,
            "CardRepositoryError": CardRepositoryError,
        }[name]
    if name in {"CardSessionRepository", "CardSessionRepositoryError"}:
        from .session_repository import CardSessionRepository, CardSessionRepositoryError

        return {
            "CardSessionRepository": CardSessionRepository,
            "CardSessionRepositoryError": CardSessionRepositoryError,
        }[name]
    raise AttributeError(name)
