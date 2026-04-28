from app.services.learning.models import LearningProgress
from app.services.learning.scheduler import apply_scheduler


def test_scheduler_sets_next_review():
    progress = LearningProgress(unit_id='unit-1')
    apply_scheduler(progress, correct=True, confidence=4, latency_ms=3000)
    assert progress.next_review_at is not None
    assert progress.ease >= 2.3
