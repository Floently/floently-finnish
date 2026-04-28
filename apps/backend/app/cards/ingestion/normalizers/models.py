from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator

from app.cards.schemas.common import (
    CardContentType,
    CardsBaseModel,
    DifficultyBand,
    DomainScope,
    IDENTIFIER_PATTERN,
    LearningPath,
    LevelBand,
    ProfessionScope,
    QualityStatus,
    SourceKind,
)


class IngestionSourceProfile(CardsBaseModel):
    profile_id: str = Field(pattern=IDENTIFIER_PATTERN)
    source_id: str = Field(pattern=IDENTIFIER_PATTERN)
    source_kind: SourceKind
    origin_path: str = Field(min_length=1, max_length=512)
    authoring_note: str | None = Field(default=None, max_length=500)
    path: LearningPath
    domain: DomainScope
    profession: ProfessionScope
    quality_status: QualityStatus = QualityStatus.raw
    reviewer: str | None = Field(default=None, min_length=2, max_length=128)
    quality_score: float | None = Field(default=None, ge=0.0, le=1.0)
    validation_checks: list[str] = Field(default_factory=lambda: ["ingestion_pipeline", "schema_validation"])
    version_tag: str = Field(pattern=IDENTIFIER_PATTERN)
    manifest_ref: str = Field(pattern=IDENTIFIER_PATTERN)
    default_level_band: LevelBand | None = None
    default_difficulty: DifficultyBand | None = None
    card_version: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_path_domain_profession(self) -> "IngestionSourceProfile":
        if self.path == LearningPath.general:
            if self.profession.track.value != "none":
                raise ValueError("general ingestion profiles must use profession.track='none'")
            if self.domain not in {DomainScope.general_finnish, DomainScope.yki_support}:
                raise ValueError("general ingestion profiles must use general_finnish or yki_support")
        if self.path == LearningPath.professional:
            if self.profession.track.value == "none":
                raise ValueError("professional ingestion profiles require a profession track")
            if self.domain not in {DomainScope.workplace_communication, DomainScope.healthcare}:
                raise ValueError("professional ingestion profiles must use workplace_communication or healthcare")
        return self


class NormalizedItemBase(CardsBaseModel):
    item_index: int = Field(ge=0)
    content_type: CardContentType
    profile: IngestionSourceProfile
    raw_input: dict
    level_band: LevelBand
    difficulty: DifficultyBand
    tags: list[str] = Field(default_factory=list)
    slug: str = Field(pattern=IDENTIFIER_PATTERN)


class NormalizedVocabularyItem(NormalizedItemBase):
    content_type: Literal[CardContentType.vocabulary_card] = CardContentType.vocabulary_card
    term: str = Field(min_length=1, max_length=120)
    lemma: str | None = Field(default=None, max_length=120)
    part_of_speech: str | None = Field(default=None, max_length=64)
    gloss: str | None = Field(default=None, max_length=250)
    example_sentence: str | None = Field(default=None, max_length=500)
    recognition_options: list[str] = Field(min_length=2, max_length=6)
    correct_answer: str = Field(min_length=1, max_length=120)


class NormalizedSentenceItem(NormalizedItemBase):
    content_type: Literal[CardContentType.sentence_card] = CardContentType.sentence_card
    sentence: str = Field(min_length=1, max_length=500)
    translation_hint: str | None = Field(default=None, max_length=250)
    grammar_focus: list[str] = Field(default_factory=list)
    fill_target: str = Field(min_length=1, max_length=120)
    blank_template: str = Field(min_length=1, max_length=500)


class NormalizedGrammarItem(NormalizedItemBase):
    content_type: Literal[CardContentType.grammar_card] = CardContentType.grammar_card
    focus: str = Field(min_length=1, max_length=64)
    rule_label: str = Field(min_length=1, max_length=120)
    pattern: str = Field(min_length=1, max_length=250)
    rule_summary: str = Field(min_length=1, max_length=500)
    example: str = Field(min_length=1, max_length=500)
    target_form: str = Field(min_length=1, max_length=120)
    stimulus_text: str = Field(min_length=1, max_length=500)
    expected_feature: str = Field(min_length=1, max_length=120)
