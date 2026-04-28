from __future__ import annotations

from collections import Counter
from .repository import repository


def build_diagnostic(user_id: str | None = None, current_level: str | None = None) -> dict:
    levels = Counter(unit.level for unit in repository.units.values())
    recommended = current_level or 'A2'
    return {
        'recommendedLevel': recommended,
        'availableLevels': dict(levels),
        'questionCount': 5,
        'purpose': 'Place the learner into the next most useful learning lane before review and production work start.',
    }
