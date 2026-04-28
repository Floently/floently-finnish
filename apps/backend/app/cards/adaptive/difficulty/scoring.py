from __future__ import annotations

from datetime import datetime, timezone

from app.cards.adaptive.models import CardPerformanceRecord


def compute_difficulty_score(record: CardPerformanceRecord, *, now: datetime | None = None) -> float:
    current_time = now or datetime.now(timezone.utc)
    if record.total_attempts <= 0:
        return 0.6

    success_component = (1.0 - record.success_rate) * 0.55
    error_component = (record.incorrect_attempts / max(record.total_attempts, 1)) * 0.2
    experience_component = 0.1 if record.total_attempts < 3 else 0.0
    streak_relief = min(record.streak, 4) * 0.05
    if record.last_seen_at is None:
        recency_component = 0.15
    else:
        days_since_seen = max((current_time - record.last_seen_at).total_seconds(), 0.0) / 86400.0
        recency_component = min(days_since_seen / 30.0, 1.0) * 0.15

    difficulty = 0.2 + success_component + error_component + experience_component + recency_component - streak_relief
    return round(min(1.0, max(0.0, difficulty)), 4)

