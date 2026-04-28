from __future__ import annotations

from enum import Enum
from typing import Annotated, Literal

from pydantic import Field, StringConstraints, model_validator

from .common import CardsBaseModel, IDENTIFIER_PATTERN

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
NormalizedText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
OPTION_IDENTIFIER_PATTERN = r"^[a-z0-9][a-z0-9._:-]{0,31}$"


class EvaluationMode(str, Enum):
    option_id = "option_id"
    exact_text = "exact_text"
    normalized_text = "normalized_text"


class FollowUpVariantType(str, Enum):
    recognition_mcq = "recognition_mcq"
    typed_recall = "typed_recall"
    fill_in = "fill_in"
    reverse_recall = "reverse_recall"
    context_mcq = "context_mcq"
    grammar_application = "grammar_application"


class AnswerOption(CardsBaseModel):
    option_id: str = Field(pattern=OPTION_IDENTIFIER_PATTERN)
    text: ShortText
    explanation: str | None = Field(default=None, max_length=300)


class ReverseTarget(CardsBaseModel):
    target_kind: Literal["translation", "definition", "context"]
    value: ShortText


class GrammarEvaluationBasis(CardsBaseModel):
    rule_id: str = Field(pattern=IDENTIFIER_PATTERN)
    expected_feature: ShortText
    evaluation_notes: str | None = Field(default=None, max_length=300)


class RecognitionMcqFollowUp(CardsBaseModel):
    variant_type: Literal["recognition_mcq"] = "recognition_mcq"
    prompt: ShortText
    options: list[AnswerOption] = Field(min_length=2, max_length=6)
    answer_key: str = Field(pattern=OPTION_IDENTIFIER_PATTERN)
    accepted_variants: list[str] = Field(default_factory=list, max_length=0)
    evaluation_mode: Literal[EvaluationMode.option_id] = EvaluationMode.option_id

    @model_validator(mode="after")
    def validate_answer_key(self) -> "RecognitionMcqFollowUp":
        option_ids = {option.option_id for option in self.options}
        if self.answer_key not in option_ids:
            raise ValueError("recognition_mcq.answer_key must match one of the option_ids")
        return self


class TypedRecallFollowUp(CardsBaseModel):
    variant_type: Literal["typed_recall"] = "typed_recall"
    prompt: ShortText
    answer_key: NormalizedText
    accepted_variants: list[NormalizedText] = Field(min_length=1)
    evaluation_mode: Literal[EvaluationMode.exact_text, EvaluationMode.normalized_text] = EvaluationMode.normalized_text

    @model_validator(mode="after")
    def validate_answers(self) -> "TypedRecallFollowUp":
        answers = {self.answer_key, *self.accepted_variants}
        if len(answers) < 2:
            raise ValueError("typed_recall requires at least one accepted variant in addition to answer_key")
        return self


class FillInFollowUp(CardsBaseModel):
    variant_type: Literal["fill_in"] = "fill_in"
    prompt: ShortText
    blank_template: ShortText
    answer_key: NormalizedText
    accepted_variants: list[NormalizedText] = Field(min_length=1)
    evaluation_mode: Literal[EvaluationMode.normalized_text, EvaluationMode.exact_text] = EvaluationMode.normalized_text

    @model_validator(mode="after")
    def validate_blank(self) -> "FillInFollowUp":
        if "___" not in self.blank_template:
            raise ValueError("fill_in.blank_template must include '___' as the gap marker")
        return self


class ReverseRecallFollowUp(CardsBaseModel):
    variant_type: Literal["reverse_recall"] = "reverse_recall"
    prompt: ShortText
    reverse_target: ReverseTarget
    answer_key: NormalizedText
    accepted_variants: list[NormalizedText] = Field(min_length=1)
    evaluation_mode: Literal[EvaluationMode.normalized_text, EvaluationMode.exact_text] = EvaluationMode.normalized_text


class ContextMcqFollowUp(CardsBaseModel):
    variant_type: Literal["context_mcq"] = "context_mcq"
    prompt: ShortText
    context_text: ShortText
    options: list[AnswerOption] = Field(min_length=2, max_length=6)
    answer_key: str = Field(pattern=OPTION_IDENTIFIER_PATTERN)
    accepted_variants: list[str] = Field(default_factory=list, max_length=0)
    evaluation_mode: Literal[EvaluationMode.option_id] = EvaluationMode.option_id

    @model_validator(mode="after")
    def validate_answer_key(self) -> "ContextMcqFollowUp":
        option_ids = {option.option_id for option in self.options}
        if self.answer_key not in option_ids:
            raise ValueError("context_mcq.answer_key must match one of the option_ids")
        return self


class GrammarApplicationFollowUp(CardsBaseModel):
    variant_type: Literal["grammar_application"] = "grammar_application"
    prompt: ShortText
    stimulus_text: ShortText
    evaluation_basis: GrammarEvaluationBasis
    answer_key: NormalizedText
    accepted_variants: list[NormalizedText] = Field(min_length=1)
    evaluation_mode: Literal[EvaluationMode.normalized_text, EvaluationMode.exact_text] = EvaluationMode.normalized_text


VocabularyFollowUp = Annotated[
    RecognitionMcqFollowUp | TypedRecallFollowUp | FillInFollowUp | ReverseRecallFollowUp | ContextMcqFollowUp,
    Field(discriminator="variant_type"),
]

SentenceFollowUp = Annotated[
    RecognitionMcqFollowUp | TypedRecallFollowUp | FillInFollowUp | ReverseRecallFollowUp | ContextMcqFollowUp,
    Field(discriminator="variant_type"),
]

GrammarFollowUp = Annotated[
    RecognitionMcqFollowUp | TypedRecallFollowUp | FillInFollowUp | GrammarApplicationFollowUp,
    Field(discriminator="variant_type"),
]

AnyFollowUp = Annotated[
    RecognitionMcqFollowUp
    | TypedRecallFollowUp
    | FillInFollowUp
    | ReverseRecallFollowUp
    | ContextMcqFollowUp
    | GrammarApplicationFollowUp,
    Field(discriminator="variant_type"),
]
