from __future__ import annotations

from dataclasses import asdict

from .diagnostic_service import build_diagnostic
from .repository import repository
from .review_service import list_due_reviews
from .study_plan_service import build_study_plan


def build_learning_home(user_id: str | None = None) -> dict:
    due_items = list_due_reviews(user_id=user_id)
    units = repository.list_units()
    return {
        'mode': 'learn',
        'loop': ['diagnose', 'learn', 'retrieve', 'produce', 'correct', 'schedule', 'review'],
        'diagnostic': build_diagnostic(user_id=user_id),
        'studyPlan': build_study_plan(user_id=user_id),
        'dueReviews': due_items,
        'availableUnits': units,
        'nextAction': 'Start with a short diagnosis or continue your due reviews.',
    }
