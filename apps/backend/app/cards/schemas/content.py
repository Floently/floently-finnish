from __future__ import annotations

from typing import Annotated, Literal

from pydantic import Field, TypeAdapter, model_validator

from .common import CardsBaseModel, PromptFamily
from .follow_ups import GrammarFollowUp, SentenceFollowUp, VocabularyFollowUp


class ExplanationContent(CardsBaseModel):
    summary: str = Field(min_length=1, max_length=500)
    example: str | None = Field(default=None, max_length=500)


class AudioSpeaker(CardsBaseModel):
    speaker_id: str = Field(min_length=1, max_length=64)
    speaker_label: str = Field(min_length=1, max_length=64)
    voice_profile: str = Field(min_length=1, max_length=128)


class AudioSegment(CardsBaseModel):
    asset_id: str = Field(min_length=1, max_length=128)
    speaker_id: str = Field(min_length=1, max_length=64)
    speaker_label: str = Field(min_length=1, max_length=64)
    voice_profile: str = Field(min_length=1, max_length=128)
    sequence_index: int = Field(ge=0)
    transcript_visible: bool = False
    duration_seconds: float = Field(ge=0.0)
    pause_after_ms: int = Field(default=0, ge=0, le=5000)


class SingleAudioContent(CardsBaseModel):
    type: Literal["single"]
    asset_ids: list[str] = Field(min_length=1, max_length=1)
    duration_seconds: float = Field(ge=0.0)
    transcript_visible: bool = False
    speakers: list[AudioSpeaker] = Field(min_length=1, max_length=1)
    segments: list[AudioSegment] = Field(min_length=1, max_length=1)

    @model_validator(mode="after")
    def validate_single_audio(self) -> "SingleAudioContent":
        if len(self.asset_ids) != 1:
            raise ValueError("single audio requires exactly one asset_id")
        if self.segments[0].asset_id != self.asset_ids[0]:
            raise ValueError("single audio segment must match asset_ids[0]")
        return self


class DialogueAudioContent(CardsBaseModel):
    type: Literal["dialogue"]
    asset_ids: list[str] = Field(min_length=2)
    duration_seconds: float = Field(ge=0.0)
    transcript_visible: bool = False
    speakers: list[AudioSpeaker] = Field(min_length=2)
    segments: list[AudioSegment] = Field(min_length=2)

    @model_validator(mode="after")
    def validate_dialogue_audio(self) -> "DialogueAudioContent":
        segment_asset_ids = [segment.asset_id for segment in self.segments]
        if segment_asset_ids != self.asset_ids:
            raise ValueError("dialogue audio segments must match asset_ids in order")
        speaker_ids = {speaker.speaker_id for speaker in self.speakers}
        if len(speaker_ids) < 2:
            raise ValueError("dialogue audio requires at least two distinct speakers")
        if any(segment.speaker_id not in speaker_ids for segment in self.segments):
            raise ValueError("dialogue audio segment speaker_id must exist in speakers")
        return self


AudioContent = Annotated[SingleAudioContent | DialogueAudioContent, Field(discriminator="type")]
_AUDIO_CONTENT_ADAPTER = TypeAdapter(AudioContent)


def validate_audio_content(payload: dict) -> AudioContent:
    return _AUDIO_CONTENT_ADAPTER.validate_python(payload)


class ValidationRules(CardsBaseModel):
    case_sensitive: bool = False
    normalize_whitespace: bool = True
    allow_partial_credit: bool = False


class VocabularyFront(CardsBaseModel):
    term: str = Field(min_length=1, max_length=120)
    lemma: str | None = Field(default=None, max_length=120)
    part_of_speech: str | None = Field(default=None, max_length=64)


class VocabularyBack(CardsBaseModel):
    recall_prompt: str = Field(min_length=1, max_length=250)
    gloss: str | None = Field(default=None, max_length=250)
    example_sentence: str | None = Field(default=None, max_length=500)


class VocabularyCardContent(CardsBaseModel):
    front: VocabularyFront
    back: VocabularyBack
    prompt_family: PromptFamily
    follow_ups: list[VocabularyFollowUp] = Field(min_length=1)
    explanation: ExplanationContent
    audio: AudioContent | None = None
    validation: ValidationRules

    @model_validator(mode="after")
    def validate_prompt_family(self) -> "VocabularyCardContent":
        if self.prompt_family != PromptFamily.vocabulary_memory:
            raise ValueError("vocabulary cards require prompt_family='vocabulary_memory'")
        return self


class SentenceFront(CardsBaseModel):
    sentence: str = Field(min_length=1, max_length=500)
    translation_hint: str | None = Field(default=None, max_length=250)


class SentenceBack(CardsBaseModel):
    recall_prompt: str = Field(min_length=1, max_length=250)
    expected_sentence: str = Field(min_length=1, max_length=500)
    grammar_focus: list[str] = Field(default_factory=list)


class SentenceCardContent(CardsBaseModel):
    front: SentenceFront
    back: SentenceBack
    prompt_family: PromptFamily
    follow_ups: list[SentenceFollowUp] = Field(min_length=1)
    explanation: ExplanationContent
    audio: AudioContent | None = None
    validation: ValidationRules

    @model_validator(mode="after")
    def validate_prompt_family(self) -> "SentenceCardContent":
        if self.prompt_family != PromptFamily.sentence_memory:
            raise ValueError("sentence cards require prompt_family='sentence_memory'")
        return self


class GrammarFront(CardsBaseModel):
    rule_label: str = Field(min_length=1, max_length=120)
    pattern: str = Field(min_length=1, max_length=250)
    example: str = Field(min_length=1, max_length=500)


class GrammarBack(CardsBaseModel):
    recall_prompt: str = Field(min_length=1, max_length=250)
    rule_summary: str = Field(min_length=1, max_length=500)
    target_form: str | None = Field(default=None, max_length=250)


class GrammarCardContent(CardsBaseModel):
    front: GrammarFront
    back: GrammarBack
    prompt_family: PromptFamily
    follow_ups: list[GrammarFollowUp] = Field(min_length=1)
    explanation: ExplanationContent
    audio: AudioContent | None = None
    validation: ValidationRules

    @model_validator(mode="after")
    def validate_prompt_family(self) -> "GrammarCardContent":
        if self.prompt_family != PromptFamily.grammar_memory:
            raise ValueError("grammar cards require prompt_family='grammar_memory'")
        return self
