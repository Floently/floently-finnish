from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


class PublicQuestionModel(BaseModel):
    model_config = {"extra": "forbid"}

    id: str
    answer_id: str
    index: int
    question: str
    options: list[str]


class PublicPromptModel(BaseModel):
    model_config = {"extra": "forbid"}

    title: str | None = None
    text: str | None = None
    audio_url: str | None = None
    instruction: str | None = None
    instructions: str | None = None
    context: str | None = None


class PublicSectionItemModel(BaseModel):
    model_config = {"extra": "forbid"}

    item_id: str
    index: int
    prompt: PublicPromptModel
    questions: list[PublicQuestionModel] = []


class RecordingModel(BaseModel):
    model_config = {"extra": "forbid"}

    min_duration_sec: int
    max_duration_sec: int


class ConversationTurnModel(BaseModel):
    model_config = {"extra": "forbid"}

    turn_id: str
    speaker: str
    text: str | None = None
    audio_url: str | None = None
    response_required: bool = False


class SpeakingItemModel(PublicSectionItemModel):
    model_config = {"extra": "forbid"}

    speaking_mode: Literal["recording", "conversation"]
    recording: RecordingModel
    conversation: list[ConversationTurnModel] = []


class PublicSectionModel(BaseModel):
    model_config = {"extra": "forbid"}

    section_type: Literal["reading", "listening", "writing", "speaking"]
    index: int
    items: list[PublicSectionItemModel | SpeakingItemModel]


class PublicRuntimeResponsesModel(BaseModel):
    model_config = {"extra": "forbid"}

    objective_answers: dict[str, Any] = {}
    writing_answers: dict[str, str] = {}
    audio_answers: dict[str, str] = {}


class PublicRuntimeProgressModel(BaseModel):
    model_config = {"extra": "forbid"}

    answered: int
    total: int


class PublicSessionMetadataModel(BaseModel):
    model_config = {"extra": "allow"}

    generated_at: float | None = None
    level: str | None = None
    mode: Literal["production", "test"] | None = None
    timing: dict[str, Any] = {}
    duration_profile_seconds: dict[str, int] = {}
    start_time: float | None = None
    completed: bool = False
    engine_session_token: str | None = None


class StartExamResponseModel(BaseModel):
    model_config = {"extra": "forbid"}

    runtime_schema_version: Literal["3.0"]
    sections: list[PublicSectionModel]
    session_id: str
    level: str | None = None
    responses: PublicRuntimeResponsesModel
    progress: PublicRuntimeProgressModel
    engine_session_token: str | None = None
    metadata: PublicSessionMetadataModel


class PublicSessionResponseModel(BaseModel):
    model_config = {"extra": "forbid"}

    runtime_schema_version: Literal["3.0"]
    sections: list[PublicSectionModel]
    session_id: str
    level: str | None = None
    responses: PublicRuntimeResponsesModel
    progress: PublicRuntimeProgressModel
    engine_session_token: str | None = None
    metadata: PublicSessionMetadataModel
