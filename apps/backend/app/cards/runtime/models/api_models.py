from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    request_id: str | None = None
    details: dict[str, str] = Field(default_factory=dict)


class SessionStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    domain: str = Field(pattern=r"^(general|professional)$")
    content_type: str | None = Field(default=None, pattern=r"^(vocabulary_card|sentence_card|grammar_card)$")
    profession: str | None = Field(default=None, pattern=r"^(none|general_workplace|doctor|nurse|practical_nurse|other)$")
    level: str | None = Field(default=None, pattern=r"^(A1|A2|A1_A2|B1|B2|B1_B2|C1|C2|C1_C2)$")


class ServedOptionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    option_id: str
    text: str


class ServedFollowUpResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    variant_type: str
    prompt: str
    options: list[ServedOptionResponse] = Field(default_factory=list)
    blank_template: str | None = None
    context_text: str | None = None
    stimulus_text: str | None = None


class CardAudioSpeakerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    speaker_id: str
    speaker_label: str
    voice_profile: str


class CardAudioSegmentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asset_id: str
    url: str
    speaker_id: str
    speaker_label: str
    voice_profile: str
    sequence_index: int = Field(ge=0)
    duration_seconds: float = Field(ge=0.0)
    pause_after_ms: int = Field(ge=0)


class CardAudioResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    asset_ids: list[str] = Field(default_factory=list)
    duration_seconds: float = Field(ge=0.0)
    transcript_visible: bool = False
    speakers: list[CardAudioSpeakerResponse] = Field(default_factory=list)
    segments: list[CardAudioSegmentResponse] = Field(default_factory=list)


class CardPreviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    content_type: str
    path: str
    domain: str
    profession: str
    level_band: str
    difficulty: str
    tags: list[str]
    prompt_family: str
    word: str
    state: Literal["new", "learning", "mastered"]
    seen_count: int = Field(ge=0)
    correct_rate: float = Field(ge=0.0, le=1.0)
    front_text: str
    back_prompt: str
    audio: CardAudioResponse | None = None
    served_follow_up: ServedFollowUpResponse
    order_index: int = Field(ge=0)


class SessionStateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    status: str
    current_card_index: int = Field(ge=0)
    total_cards: int = Field(ge=1)
    answered_count: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime


class CardSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session: SessionStateResponse
    first_card: CardPreviewResponse


class AdaptiveSelectionReasonResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    card_id: str
    reason_code: str
    reason_message: str
    due_at: datetime | None = None
    difficulty_score: float = Field(ge=0.0, le=1.0)
    success_rate: float = Field(ge=0.0, le=1.0)
    total_attempts: int = Field(ge=0)
    streak: int = Field(ge=0)
    variant_index: int = Field(ge=0)
    variant_type: str


class AdaptiveCardSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session: SessionStateResponse
    first_card: CardPreviewResponse
    review_queue_id: str
    selection_reasons: list[AdaptiveSelectionReasonResponse] = Field(default_factory=list)


class NextCardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session: SessionStateResponse
    card: CardPreviewResponse | None = None
    completed: bool


class AnswerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_answer: str = Field(min_length=1, max_length=500)


class CorrectAnswerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str = Field(min_length=1, max_length=500)
    option_id: str | None = None
    display_text: str | None = Field(default=None, max_length=500)


class AnswerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    correct: bool
    is_correct: bool
    expected_variant_type: str
    evaluation_mode: str
    submitted_answer_normalized: str = Field(min_length=1, max_length=500)
    correct_answer: CorrectAnswerResponse
    accepted_variants: list[str] = Field(default_factory=list)
    explanation: str | None = Field(default=None, max_length=500)
    next_recommended_action: str | None = Field(default=None, max_length=128)
    session_completed: bool
    session: SessionStateResponse
    next_card: CardPreviewResponse | None = None
    adaptive_update: AdaptiveAnswerUpdateResponse | None = None


class AdaptiveAnswerUpdateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    card_id: str
    total_attempts: int = Field(ge=0)
    correct_attempts: int = Field(ge=0)
    incorrect_attempts: int = Field(ge=0)
    success_rate: float = Field(ge=0.0, le=1.0)
    streak: int = Field(ge=0)
    difficulty_score: float = Field(ge=0.0, le=1.0)
    next_due_at: datetime | None = None
    interval_days: int = Field(ge=0)
    review_status: str
    last_variant_type: str
    explanation: str


class DeckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    count: int = Field(ge=0)
    cards: list[CardPreviewResponse] = Field(default_factory=list)
