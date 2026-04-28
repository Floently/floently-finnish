from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RuntimeAudioObject(BaseModel):
    model_config = {"extra": "forbid"}

    url: str
    duration_seconds: float
    provider: str
    replayable: bool = True


class RuntimeScreen(BaseModel):
    model_config = {"extra": "forbid"}

    screen_type: str
    payload: dict[str, Any]


class ExamRuntimeContract(BaseModel):
    model_config = {"extra": "forbid"}

    runtime_schema_version: str = "1.0"
    contract_type: str = "exam_runtime"
    session_id: str
    screens: list[RuntimeScreen]
    metadata: dict[str, Any] = Field(default_factory=dict)
