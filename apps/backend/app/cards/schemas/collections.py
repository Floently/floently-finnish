from __future__ import annotations

from pydantic import Field, model_validator

from .common import (
    CardsBaseModel,
    CollectionKind,
    DomainScope,
    IDENTIFIER_PATTERN,
    LearningPath,
    LevelBand,
    ProfessionScope,
    ReviewQueueKind,
    TAG_PATTERN,
)
from .publication import PublicationInfo


class CardReference(CardsBaseModel):
    card_id: str = Field(pattern=IDENTIFIER_PATTERN)
    card_version: int = Field(ge=1)
    ordinal: int = Field(ge=1)


class GroupingBase(CardsBaseModel):
    id: str = Field(pattern=IDENTIFIER_PATTERN)
    version: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=500)
    path: LearningPath
    domain: DomainScope
    profession: ProfessionScope
    level_band: LevelBand
    tags: list[str] = Field(default_factory=list)
    focus_tags: list[str] = Field(default_factory=list)
    publication: PublicationInfo

    @model_validator(mode="after")
    def validate_scope(self) -> "GroupingBase":
        _validate_path_domain_profession_consistency(self.path, self.domain, self.profession)
        return self


def _validate_path_domain_profession_consistency(
    path: LearningPath,
    domain: DomainScope,
    profession: ProfessionScope,
) -> None:
    if path == LearningPath.general:
        if profession.track.value != "none":
            raise ValueError("general path groupings must use profession.track='none'")
        if domain not in {DomainScope.general_finnish, DomainScope.yki_support}:
            raise ValueError("general path groupings must use a general/yki_support domain")
    if path == LearningPath.professional:
        if profession.track.value == "none":
            raise ValueError("professional path groupings require a profession track")
        if domain not in {DomainScope.workplace_communication, DomainScope.healthcare}:
            raise ValueError("professional path groupings must use a professional domain")


class CardLesson(GroupingBase):
    kind: CollectionKind = CollectionKind.lesson
    card_refs: list[CardReference] = Field(min_length=1)


class LessonReference(CardsBaseModel):
    lesson_id: str = Field(pattern=IDENTIFIER_PATTERN)
    lesson_version: int = Field(ge=1)
    ordinal: int = Field(ge=1)


class CardModule(GroupingBase):
    kind: CollectionKind = CollectionKind.module
    lesson_refs: list[LessonReference] = Field(min_length=1)
    card_refs: list[CardReference] = Field(default_factory=list)


class ModuleReference(CardsBaseModel):
    module_id: str = Field(pattern=IDENTIFIER_PATTERN)
    module_version: int = Field(ge=1)
    ordinal: int = Field(ge=1)


class DeckCounts(CardsBaseModel):
    card_total: int = Field(ge=1)
    module_total: int = Field(ge=1)
    lesson_total: int = Field(ge=1)


class CardDeck(GroupingBase):
    kind: CollectionKind = CollectionKind.deck
    module_refs: list[ModuleReference] = Field(min_length=1)
    counts: DeckCounts
    manifest_ref: str | None = Field(default=None, pattern=IDENTIFIER_PATTERN)

    @model_validator(mode="after")
    def validate_counts(self) -> "CardDeck":
        if self.counts.module_total < len(self.module_refs):
            raise ValueError("deck.counts.module_total cannot be smaller than module_refs length")
        return self


class SourceReference(CardsBaseModel):
    source_kind: CollectionKind = Field(alias="kind")
    source_id: str = Field(pattern=IDENTIFIER_PATTERN)
    source_version: int = Field(ge=1)


class CardReviewQueue(GroupingBase):
    kind: CollectionKind = CollectionKind.review_queue
    queue_kind: ReviewQueueKind
    source_refs: list[SourceReference] = Field(min_length=1)
    card_refs: list[CardReference] = Field(default_factory=list)
    manifest_ref: str | None = Field(default=None, pattern=IDENTIFIER_PATTERN)

