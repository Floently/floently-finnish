from __future__ import annotations

from datetime import UTC, datetime, timedelta

from .models import LearningProgress


def next_review_interval_days(*, correct: bool, confidence: int | None, latency_ms: int | None, ease: float) -> float:
    confidence_factor = {1: 0.5, 2: 0.75, 3: 1.0, 4: 1.2, 5: 1.4}.get(confidence or 3, 1.0)
    latency_factor = 0.75 if latency_ms and latency_ms > 9000 else 1.0
    result_factor = ease if correct else 0.35
    return max(0.25, round(result_factor * confidence_factor * latency_factor, 2))


def apply_scheduler(progress: LearningProgress, *, correct: bool, confidence: int | None, latency_ms: int | None) -> LearningProgress:
    progress.repetitions += 1
    if correct:
        progress.successful_retrievals += 1
        progress.consecutive_successes += 1
        progress.ease = min(3.0, round(progress.ease + 0.08, 2))
    else:
        progress.consecutive_successes = 0
        progress.ease = max(1.3, round(progress.ease - 0.2, 2))

    interval_days = next_review_interval_days(
        correct=correct,
        confidence=confidence,
        latency_ms=latency_ms,
        ease=progress.ease,
    )
    progress.next_review_at = (datetime.now(UTC) + timedelta(days=interval_days)).isoformat()
    return progress
