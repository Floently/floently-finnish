from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Literal

LearningStage = Literal['diagnose', 'learn', 'retrieve', 'produce', 'correct', 'schedule', 'review']
LearningKind = Literal['vocabulary', 'grammar', 'phrase', 'speaking_prompt', 'workplace_task']


@dataclass(frozen=True)
class LearningUnit:
    id: str
    kind: LearningKind
    level: str
    title: str
    summary: str
    example: str
    tags: list[str] = field(default_factory=list)
    difficulty: Literal['easy', 'medium', 'hard'] = 'medium'


@dataclass
class LearningProgress:
    unit_id: str
    repetitions: int = 0
    successful_retrievals: int = 0
    consecutive_successes: int = 0
    last_stage: LearningStage = 'diagnose'
    last_seen_at: str | None = None
    next_review_at: str | None = None
    ease: float = 2.3

    def mark_seen(self, stage: LearningStage) -> None:
        self.last_stage = stage
        self.last_seen_at = datetime.now(UTC).isoformat()


@dataclass(frozen=True)
class PhraseBankEntry:
    id: str
    finnish: str
    english: str | None
    context: str
    tags: list[str]


@dataclass
class DailyPlan:
    diagnose_count: int
    learn_count: int
    retrieve_count: int
    produce_count: int
    review_count: int
    due_today: int
