from __future__ import annotations

from dataclasses import asdict

from .repository import repository


def list_due_reviews(user_id: str | None = None) -> list[dict]:
    return [asdict(unit) for unit in repository.due_units()]
