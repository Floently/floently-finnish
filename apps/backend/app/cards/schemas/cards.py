from __future__ import annotations

from typing import Annotated, Literal

from pydantic import Field, TypeAdapter, model_validator

from .common import (
    CardContentType,
    CardsBaseModel,
    DifficultyBand,
    DomainScope,
    IDENTIFIER_PATTERN,
    LanguageCode,
    LearningPath,
    LevelBand,
    ProfessionScope,
    QualityDescriptor,
    TAG_PATTERN,
    SourceDescriptor,
)
from .content import GrammarCardContent, SentenceCardContent, VocabularyCardContent
from .follow_ups import GrammarApplicationFollowUp
from .publication import PublicationInfo


class CardEnvelopeBase(CardsBaseModel):
    id: str = Field(pattern=IDENTIFIER_PATTERN)
    version: int = Field(ge=1)
    path: LearningPath
    domain: DomainScope
    profession: ProfessionScope
    level_band: LevelBand
    difficulty: DifficultyBand
    language: LanguageCode
    source: SourceDescriptor
    quality: QualityDescriptor
    tags: list[str] = Field(default_factory=list)
    publication: PublicationInfo

    @model_validator(mode="after")
    def validate_scope(self) -> "CardEnvelopeBase":
        _validate_path_domain_profession_consistency(self.path, self.domain, self.profession)
        return self


def _validate_path_domain_profession_consistency(
    path: LearningPath,
    domain: DomainScope,
    profession: ProfessionScope,
) -> None:
    if path == LearningPath.general:
        if profession.track.value != "none":
            raise ValueError("general cards must use profession.track='none'")
        if domain not in {DomainScope.general_finnish, DomainScope.yki_support}:
            raise ValueError("general cards must use a general/yki_support domain")
    if path == LearningPath.professional:
        if profession.track.value == "none":
            raise ValueError("professional cards require a profession track")
        if domain not in {DomainScope.workplace_communication, DomainScope.healthcare}:
            raise ValueError("professional cards must use a professional domain")


class VocabularyCard(CardEnvelopeBase):
    content_type: Literal[CardContentType.vocabulary_card] = CardContentType.vocabulary_card
    content: VocabularyCardContent


class SentenceCard(CardEnvelopeBase):
    content_type: Literal[CardContentType.sentence_card] = CardContentType.sentence_card
    content: SentenceCardContent


class GrammarCard(CardEnvelopeBase):
    content_type: Literal[CardContentType.grammar_card] = CardContentType.grammar_card
    content: GrammarCardContent

    @model_validator(mode="after")
    def validate_grammar_followups(self) -> "GrammarCard":
        if not any(isinstance(item, GrammarApplicationFollowUp) for item in self.content.follow_ups):
            return self
        return self


CardEnvelope = Annotated[VocabularyCard | SentenceCard | GrammarCard, Field(discriminator="content_type")]

CARD_ENVELOPE_ADAPTER = TypeAdapter(CardEnvelope)


def validate_card_payload(payload: dict) -> CardEnvelope:
    return CARD_ENVELOPE_ADAPTER.validate_python(payload)
