from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.cards.adaptive.models import AdaptiveSelectionReason
from app.cards.schemas.common import AnswerOutcome, CardsBaseModel
from app.cards.schemas.follow_ups import FollowUpVariantType
from app.cards.schemas.session import CardSession


class SessionAnswerRecord(CardsBaseModel):
    card_id: str = Field(min_length=3, max_length=128)
    sequence_index: int = Field(ge=0)
    answered_at: datetime
    user_answer: str = Field(min_length=1, max_length=500)
    normalized_user_answer: str = Field(min_length=1, max_length=500)
    correct: bool
    outcome: AnswerOutcome
    variant_type: FollowUpVariantType


class RuntimeSessionRecord(CardsBaseModel):
    session: CardSession
    answers: list[SessionAnswerRecord] = Field(default_factory=list)
    served_variant_indices: dict[str, int] = Field(default_factory=dict)
    selection_reasons: dict[str, AdaptiveSelectionReason] = Field(default_factory=dict)
    adaptive_session: bool = False
