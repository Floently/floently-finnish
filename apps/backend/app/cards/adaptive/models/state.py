from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import Field

from app.cards.schemas.common import CardsBaseModel, CardContentType, LearningPath, LevelBand, ProfessionTrack
from app.cards.schemas.follow_ups import FollowUpVariantType
from app.cards.schemas.session import CardReviewState


class AdaptiveReasonCode(str, Enum):
    new_card = "new_card"
    due_review = "due_review"
    difficult_card = "difficult_card"
    scheduled_review = "scheduled_review"


class AdaptiveSessionFilters(CardsBaseModel):
    domain: LearningPath
    content_type: CardContentType | None = None
    profession: ProfessionTrack | None = None
    level_band: LevelBand | None = None
    limit: int = Field(ge=1, le=100, default=10)


class CardPerformanceRecord(CardsBaseModel):
    card_id: str = Field(min_length=3, max_length=128)
    user_id: str = Field(min_length=3, max_length=128)
    total_attempts: int = Field(ge=0, default=0)
    correct_attempts: int = Field(ge=0, default=0)
    incorrect_attempts: int = Field(ge=0, default=0)
    last_seen_at: datetime | None = None
    last_correct_at: datetime | None = None
    success_rate: float = Field(ge=0.0, le=1.0, default=0.0)
    streak: int = Field(ge=0, default=0)
    difficulty_score: float = Field(ge=0.0, le=1.0, default=0.6)


class AdaptiveSelectionReason(CardsBaseModel):
    card_id: str = Field(min_length=3, max_length=128)
    reason_code: AdaptiveReasonCode
    reason_message: str = Field(min_length=1, max_length=300)
    due_at: datetime | None = None
    difficulty_score: float = Field(ge=0.0, le=1.0)
    success_rate: float = Field(ge=0.0, le=1.0)
    total_attempts: int = Field(ge=0)
    streak: int = Field(ge=0)
    variant_index: int = Field(ge=0)
    variant_type: FollowUpVariantType


class ReviewQueueSnapshot(CardsBaseModel):
    queue_id: str = Field(min_length=3, max_length=160)
    user_id: str = Field(min_length=3, max_length=128)
    created_at: datetime
    filters: AdaptiveSessionFilters
    selected_card_ids: list[str] = Field(default_factory=list)
    due_card_ids: list[str] = Field(default_factory=list)
    new_card_ids: list[str] = Field(default_factory=list)
    difficult_card_ids: list[str] = Field(default_factory=list)
    selection_reasons: list[AdaptiveSelectionReason] = Field(default_factory=list)


class AdaptiveAnswerUpdate(CardsBaseModel):
    card_id: str = Field(min_length=3, max_length=128)
    total_attempts: int = Field(ge=0)
    correct_attempts: int = Field(ge=0)
    incorrect_attempts: int = Field(ge=0)
    success_rate: float = Field(ge=0.0, le=1.0)
    streak: int = Field(ge=0)
    difficulty_score: float = Field(ge=0.0, le=1.0)
    next_due_at: datetime | None = None
    interval_days: int = Field(ge=0, default=0)
    review_status: str
    last_variant_type: FollowUpVariantType
    explanation: str = Field(min_length=1, max_length=300)


class UserAdaptiveState(CardsBaseModel):
    performance_records: list[CardPerformanceRecord] = Field(default_factory=list)
    review_states: list[CardReviewState] = Field(default_factory=list)
    latest_review_queue: ReviewQueueSnapshot | None = None


class AdaptiveStateStorePayload(CardsBaseModel):
    version: int = Field(ge=1, default=1)
    users: dict[str, UserAdaptiveState] = Field(default_factory=dict)


class AdaptiveSessionPlan(CardsBaseModel):
    queue_snapshot: ReviewQueueSnapshot
    ordered_card_ids: list[str] = Field(default_factory=list)
    variant_indices: dict[str, int] = Field(default_factory=dict)
    selection_reasons: dict[str, AdaptiveSelectionReason] = Field(default_factory=dict)

