from __future__ import annotations

import json
import os

WEIGHTS = {
    "weak_pattern": 0.3,
    "low_mastery": 0.25,
    "due_review": 0.2,
    "regression": 0.15,
    "difficulty_alignment": 0.1,
}


def _coerce_weight(value):
    try:
        return max(0.0, float(value))
    except (TypeError, ValueError):
        return None


def _normalize_weights(weights: dict[str, float]):
    total = sum(weights.values())
    if total <= 0:
        return WEIGHTS.copy()
    return {key: round(value / total, 4) for key, value in weights.items()}


def get_decision_weights(overrides: dict | None = None):
    resolved = WEIGHTS.copy()
    raw_env = os.getenv("LEARNING_DECISION_WEIGHTS")
    if raw_env:
        try:
            env_weights = json.loads(raw_env)
        except json.JSONDecodeError:
            env_weights = {}
        for key, value in env_weights.items():
            if key in resolved:
                parsed = _coerce_weight(value)
                if parsed is not None:
                    resolved[key] = parsed
    for key, value in (overrides or {}).items():
        if key in resolved:
            parsed = _coerce_weight(value)
            if parsed is not None:
                resolved[key] = parsed
    return _normalize_weights(resolved)
