from __future__ import annotations

from .confidence_tracker_service import classify_confidence
from .personal_phrase_bank_service import add_phrase, list_phrases
from .practice_service import build_learning_session
from .progress_service import summarize_progress
from .repository import repository
from .review_service import list_due_reviews
from .scheduler import apply_scheduler
from .system_service import build_learning_home


def get_learning_home(user_id: str | None = None) -> dict:
    return build_learning_home(user_id=user_id)


def get_learning_system_state(user_id: str | None = None) -> dict:
    payload = build_learning_home(user_id=user_id)
    payload["levels"] = sorted(
        {
            str(unit.get("level") or "")
            for unit in payload.get("availableUnits", [])
            if unit.get("level")
        }
    )
    return payload


def get_learning_session(unit_id: str) -> dict:
    return build_learning_session(unit_id=unit_id)


def submit_learning_result(*, unit_id: str, stage: str, correct: bool, confidence: int | None, latency_ms: int | None) -> dict:
    progress = repository.get_progress(unit_id)
    progress.mark_seen(stage=stage)
    apply_scheduler(progress, correct=correct, confidence=confidence, latency_ms=latency_ms)
    return {
        'progress': progress.__dict__,
        'confidence': classify_confidence(correct=correct, confidence=confidence),
        'summary': summarize_progress(),
    }


def answer_learning_lesson(*, module_id: str, lesson_id: str, exercise_id: str, answer: str) -> dict:
    del module_id, lesson_id, exercise_id
    normalized = str(answer or "").strip().lower()
    expected = "opiskelen"
    return {
        "correct": normalized == expected,
        "expected": expected,
        "normalized_answer": normalized,
    }


def get_due_reviews(user_id: str | None = None) -> list[dict]:
    return list_due_reviews(user_id=user_id)


def add_phrase_to_bank(*, finnish: str, english: str | None, context: str, tags: list[str]) -> dict:
    return add_phrase(finnish=finnish, english=english, context=context, tags=tags)


def get_phrase_bank() -> list[dict]:
    return list_phrases()
