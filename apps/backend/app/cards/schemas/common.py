from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator

IDENTIFIER_PATTERN = r"^[a-z0-9][a-z0-9._:-]{2,127}$"
TAG_PATTERN = r"^[a-z0-9][a-z0-9_-]{1,63}$"


class CardsBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class LearningPath(str, Enum):
    general = "general"
    professional = "professional"


class CardContentType(str, Enum):
    vocabulary_card = "vocabulary_card"
    sentence_card = "sentence_card"
    grammar_card = "grammar_card"


class DomainScope(str, Enum):
    general_finnish = "general_finnish"
    yki_support = "yki_support"
    workplace_communication = "workplace_communication"
    healthcare = "healthcare"


class ProfessionTrack(str, Enum):
    none = "none"
    general_workplace = "general_workplace"
    doctor = "doctor"
    nurse = "nurse"
    practical_nurse = "practical_nurse"
    other = "other"


class LevelBand(str, Enum):
    a1 = "A1"
    a2 = "A2"
    a1_a2 = "A1_A2"
    b1 = "B1"
    b2 = "B2"
    b1_b2 = "B1_B2"
    c1 = "C1"
    c2 = "C2"
    c1_c2 = "C1_C2"


class DifficultyBand(str, Enum):
    intro = "intro"
    core = "core"
    stretch = "stretch"


class LanguageCode(str, Enum):
    fi = "fi"


class PromptFamily(str, Enum):
    vocabulary_memory = "vocabulary_memory"
    sentence_memory = "sentence_memory"
    grammar_memory = "grammar_memory"


class QualityStatus(str, Enum):
    raw = "raw"
    reviewed = "reviewed"
    approved = "approved"


class SourceKind(str, Enum):
    manual_curated = "manual_curated"
    imported_workspace = "imported_workspace"
    generated_pipeline = "generated_pipeline"


class CollectionKind(str, Enum):
    deck = "deck"
    module = "module"
    lesson = "lesson"
    review_queue = "review_queue"


class ReviewQueueKind(str, Enum):
    due = "due"
    weak_area = "weak_area"
    new_cards = "new_cards"
    failed_cards = "failed_cards"


class SessionStatus(str, Enum):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class ReviewStateStatus(str, Enum):
    unseen = "unseen"
    learning = "learning"
    review = "review"
    mastered = "mastered"
    suspended = "suspended"


class AnswerOutcome(str, Enum):
    correct = "correct"
    partially_correct = "partially_correct"
    incorrect = "incorrect"
    skipped = "skipped"


class ProfessionScope(CardsBaseModel):
    track: ProfessionTrack
    slug: str | None = Field(default=None, pattern=IDENTIFIER_PATTERN)
    label: str | None = Field(default=None, min_length=2, max_length=64)

    @model_validator(mode="after")
    def validate_profession_scope(self) -> "ProfessionScope":
        if self.track == ProfessionTrack.none:
            if self.slug is not None or self.label is not None:
                raise ValueError("profession.slug and profession.label must be empty when track is 'none'")
            return self
        if not self.slug or not self.label:
            raise ValueError("professional cards require profession.slug and profession.label")
        return self


class SourceDescriptor(CardsBaseModel):
    source_id: str = Field(pattern=IDENTIFIER_PATTERN)
    kind: SourceKind
    origin_path: str = Field(min_length=1, max_length=512)
    authoring_note: str | None = Field(default=None, max_length=500)


class QualityDescriptor(CardsBaseModel):
    status: QualityStatus
    reviewer: str | None = Field(default=None, min_length=2, max_length=128)
    validation_checks: list[str] = Field(default_factory=list)
    quality_score: float | None = Field(default=None, ge=0.0, le=1.0)

