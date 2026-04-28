# ==========================================================
# YKI CANONICAL PYDANTIC SCHEMA MODELS — V3.2
#
# Structural shape only.
# Derived strictly from:
#   engine/registry/task_contract_registry_v3_2.py
#   engine/registry/task_runtime_registry_v3_2.py
#   docs/v3.2/YKI_CANONICAL_SCHEMA_V3_2.md
#
# ZERO business logic.
# ZERO default injection.
# ZERO semantic validation.
# ZERO blueprint enforcement.
# ==========================================================

from typing import Dict, List, Literal, Optional, Type

from pydantic import BaseModel


# ------------------------------------------------------------------
# Shared submodels
# ------------------------------------------------------------------

class SourceModel(BaseModel):
    model_config = {"extra": "forbid"}

    origin: str
    generator: Optional[str] = None
    generated_at: Optional[str] = None


class CertificationModel(BaseModel):
    model_config = {"extra": "forbid"}

    status: Literal["uncertified", "certified"]
    certified_at: Optional[str] = None
    certified_by: Optional[str] = None


class QualityModel(BaseModel):
    model_config = {"extra": "forbid"}

    certification: CertificationModel


class TimingModel(BaseModel):
    model_config = {"extra": "forbid"}

    recommended_minutes: int


# ------------------------------------------------------------------
# Reading MCQ Set — content submodels
# ------------------------------------------------------------------

class MaterialsReading(BaseModel):
    model_config = {"extra": "forbid"}

    text: str
    word_count: int


class QuestionModel(BaseModel):
    model_config = {"extra": "forbid"}

    id: str
    prompt: str
    options: List[str]
    correct_index: int


class ReadingMCQSetContent(BaseModel):
    model_config = {"extra": "forbid"}

    instruction: str
    materials: MaterialsReading
    questions: List[QuestionModel]
    timing: TimingModel


# ------------------------------------------------------------------
# Listening MCQ Set — content submodels
# ------------------------------------------------------------------

class MaterialsListening(BaseModel):
    model_config = {"extra": "forbid"}

    transcript: str
    audio_asset_id: str


class ListeningMCQSetContent(BaseModel):
    model_config = {"extra": "forbid"}

    instruction: str
    materials: MaterialsListening
    questions: List[QuestionModel]
    timing: TimingModel


# ------------------------------------------------------------------
# Writing Prompt — content submodels
# ------------------------------------------------------------------

class MaterialsWriting(BaseModel):
    model_config = {"extra": "forbid"}

    scenario: str


class WritingItemModel(BaseModel):
    model_config = {"extra": "forbid"}

    id: str
    prompt: str


class WritingPromptContent(BaseModel):
    model_config = {"extra": "forbid"}

    instruction: str
    materials: MaterialsWriting
    items: List[WritingItemModel]
    rubric: str
    timing: TimingModel


# ------------------------------------------------------------------
# Speaking Roleplay — content submodels
# ------------------------------------------------------------------

class RolesModel(BaseModel):
    model_config = {"extra": "forbid"}

    user: str
    partner: str


class MaterialsSpeaking(BaseModel):
    model_config = {"extra": "forbid"}

    roles: RolesModel


class SpeakingItemModel(BaseModel):
    model_config = {"extra": "forbid"}

    id: str
    ai_first_turn_fi: str


class SpeakingRoleplayContent(BaseModel):
    model_config = {"extra": "forbid"}

    instruction: str
    materials: MaterialsSpeaking
    items: List[SpeakingItemModel]
    rubric: str
    timing: TimingModel


# ------------------------------------------------------------------
# Base task model
# ------------------------------------------------------------------

class BaseTaskModel(BaseModel):
    model_config = {"extra": "forbid"}

    id: str
    version: Literal["3.2.0"]
    task_type: Literal[
        "reading_mcq_set",
        "listening_mcq_set",
        "writing_prompt",
        "speaking_roleplay",
    ]
    level_band: Literal["A1_A2", "B1_B2", "C1_C2"]
    skill: str
    difficulty: float
    language: str
    source: SourceModel
    quality: QualityModel


# ------------------------------------------------------------------
# Concrete task models (one per task type)
# ------------------------------------------------------------------

class ReadingMCQSetModel(BaseTaskModel):
    task_type: Literal["reading_mcq_set"]
    skill: Literal["reading"]
    content: ReadingMCQSetContent


class ListeningMCQSetModel(BaseTaskModel):
    task_type: Literal["listening_mcq_set"]
    skill: Literal["listening"]
    content: ListeningMCQSetContent


class WritingPromptModel(BaseTaskModel):
    task_type: Literal["writing_prompt"]
    skill: Literal["writing"]
    content: WritingPromptContent


class SpeakingRoleplayModel(BaseTaskModel):
    task_type: Literal["speaking_roleplay"]
    skill: Literal["speaking"]
    content: SpeakingRoleplayContent


# ------------------------------------------------------------------
# Task type → model mapping
# Derived from task_runtime_registry_v3_2.ALLOWED_TASK_TYPES
# ------------------------------------------------------------------

TASK_TYPE_TO_MODEL: Dict[str, Type[BaseTaskModel]] = {
    "reading_mcq_set": ReadingMCQSetModel,
    "listening_mcq_set": ListeningMCQSetModel,
    "writing_prompt": WritingPromptModel,
    "speaking_roleplay": SpeakingRoleplayModel,
}
