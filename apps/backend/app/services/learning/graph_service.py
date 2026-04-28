from __future__ import annotations

from .repository import repository


def get_unit(unit_id: str):
    return repository.get_unit(unit_id)


def get_related_units(unit_id: str):
    return repository.get_related_units(unit_id)


def get_user_learning_debug_state(user_id: str | None = None):
    return {
        "userId": user_id,
        "moduleCount": len(repository.modules),
        "unitCount": len(repository.units),
    }
