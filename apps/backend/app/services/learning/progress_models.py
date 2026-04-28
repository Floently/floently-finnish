from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from math import isfinite


def _now_isoformat():
    return datetime.now(UTC).isoformat()


def _clamp_score(value: float, minimum: float = 0.0, maximum: float = 1.0):
    if not isfinite(value):
        return minimum
    return max(minimum, min(maximum, round(float(value), 4)))


@dataclass
class UserUnitProgress:
    user_id: str
    unit_id: str
    attempts: int = 0
    correct_attempts: int = 0
    last_attempt_at: str | None = None
    mastery_score: float = 0.0
    streak_correct: int = 0

    def __post_init__(self):
        self.attempts = max(0, int(self.attempts))
        self.correct_attempts = max(0, min(int(self.correct_attempts), self.attempts))
        self.mastery_score = _clamp_score(self.mastery_score)
        self.last_attempt_at = self.last_attempt_at or _now_isoformat()


@dataclass
class UserModuleProgress:
    user_id: str
    module_id: str
    completion_percentage: float = 0.0
    mastery_score: float = 0.0

    def __post_init__(self):
        self.completion_percentage = _clamp_score(self.completion_percentage, 0.0, 100.0)
        self.mastery_score = _clamp_score(self.mastery_score)
