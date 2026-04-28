from __future__ import annotations

from dataclasses import asdict

from .repository import repository


def build_learning_session(*, unit_id: str) -> dict:
    unit = repository.get_unit(unit_id)
    if not unit:
        raise ValueError('Unknown unit')
    return {
        'unit': asdict(unit),
        'sequence': ['learn', 'retrieve', 'produce', 'correct', 'schedule', 'review'],
        'retrievalPrompt': f"Recall the key Finnish pattern from: {unit.title}",
        'productionPrompt': unit.example,
    }
