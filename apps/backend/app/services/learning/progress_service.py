from __future__ import annotations

from .repository import repository


def summarize_progress(user_id: str | None = None) -> dict:
    total = len(repository.units)
    reviewed = 0
    mastered = 0
    for unit_id in repository.units:
        progress = repository.get_progress(unit_id)
        if progress.repetitions > 0:
            reviewed += 1
        if progress.consecutive_successes >= 3:
            mastered += 1
    completion_percent = int((reviewed / total) * 100) if total else 0
    return {
        'totalUnits': total,
        'reviewedUnits': reviewed,
        'masteredUnits': mastered,
        'completionPercent': completion_percent,
        'streakDays': min(reviewed, 14),
    }
