from __future__ import annotations

from datetime import datetime, timezone

from app.cards.adaptive.difficulty import compute_difficulty_score
from app.cards.adaptive.models import CardPerformanceRecord


def create_empty_performance(*, card_id: str, user_id: str) -> CardPerformanceRecord:
    return CardPerformanceRecord(card_id=card_id, user_id=user_id)


def update_performance_record(
    record: CardPerformanceRecord,
    *,
    correct: bool,
    now: datetime | None = None,
) -> CardPerformanceRecord:
    current_time = now or datetime.now(timezone.utc)
    record.total_attempts += 1
    record.last_seen_at = current_time
    if correct:
        record.correct_attempts += 1
        record.last_correct_at = current_time
        record.streak += 1
    else:
        record.incorrect_attempts += 1
        record.streak = 0
    record.success_rate = round(record.correct_attempts / max(record.total_attempts, 1), 4)
    record.difficulty_score = compute_difficulty_score(record, now=current_time)
    return record

