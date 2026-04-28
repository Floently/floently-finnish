from __future__ import annotations

from datetime import datetime

from pydantic import Field, model_validator

from .common import (
    AnswerOutcome,
    CardsBaseModel,
    CollectionKind,
    IDENTIFIER_PATTERN,
    ReviewStateStatus,
    SessionStatus,
    TAG_PATTERN,
)
from .follow_ups import FollowUpVariantType


class SessionTarget(CardsBaseModel):
    kind: CollectionKind
    target_id: str = Field(pattern=IDENTIFIER_PATTERN)
    target_version: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_target_kind(self) -> "SessionTarget":
        if self.kind not in {
            CollectionKind.deck,
            CollectionKind.module,
            CollectionKind.lesson,
            CollectionKind.review_queue,
        }:
            raise ValueError("card sessions must target deck/module/lesson/review_queue")
        return self


class ServedVariantRecord(CardsBaseModel):
    card_id: str = Field(pattern=IDENTIFIER_PATTERN)
    variant_type: FollowUpVariantType
    sequence_index: int = Field(ge=0)
    served_at: datetime


class CardSession(CardsBaseModel):
    session_id: str = Field(pattern=IDENTIFIER_PATTERN)
    user_id: str = Field(pattern=IDENTIFIER_PATTERN)
    target: SessionTarget
    selected_card_ids: list[str] = Field(min_length=1)
    current_card_index: int = Field(ge=0)
    status: SessionStatus
    served_variant_history: list[ServedVariantRecord] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def validate_card_pointer(self) -> "CardSession":
        if self.current_card_index >= len(self.selected_card_ids):
            raise ValueError("current_card_index must point to a selected card")
        return self


class CardReviewState(CardsBaseModel):
    card_id: str = Field(pattern=IDENTIFIER_PATTERN)
    user_id: str = Field(pattern=IDENTIFIER_PATTERN)
    status: ReviewStateStatus
    last_seen_at: datetime | None = None
    last_answered_at: datetime | None = None
    last_outcome: AnswerOutcome | None = None
    streak: int = Field(ge=0, default=0)
    ease_score: float = Field(ge=1.0, le=5.0, default=2.5)
    interval_days: int = Field(ge=0, default=0)
    due_at: datetime | None = None
    error_count: int = Field(ge=0, default=0)
    weak_area_tags: list[str] = Field(default_factory=list)
    last_variant_type: FollowUpVariantType | None = None

    @model_validator(mode="after")
    def validate_review_state(self) -> "CardReviewState":
        if self.status == ReviewStateStatus.unseen:
            if self.last_seen_at is not None or self.last_answered_at is not None:
                raise ValueError("unseen review state cannot have seen/answered timestamps")
        else:
            if self.last_seen_at is None:
                raise ValueError("non-unseen review state requires last_seen_at")
        return self

