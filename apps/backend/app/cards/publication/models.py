from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PublishDatasetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_name: str = Field(default="default", min_length=1, max_length=64)
    version_label: str | None = Field(default=None, min_length=3, max_length=128)
    notes: str | None = Field(default=None, max_length=500)


class DatasetVersionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_version_id: str
    dataset_name: str
    state: str
    source_version_tag: str
    card_count: int = Field(ge=0)
    deck_count: int = Field(ge=0)
    module_count: int = Field(ge=0)
    created_at: datetime
    published_at: datetime
    archived_at: datetime | None = None
    notes: str | None = None


class SourceLifecycleSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_name: str
    state: str
    card_count: int = Field(ge=0)
    deck_count: int = Field(ge=0)
    module_count: int = Field(ge=0)
    version_tag: str


class PublicationOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: SourceLifecycleSummaryResponse
    datasets: list[DatasetVersionResponse] = Field(default_factory=list)


class PublicationActionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset: DatasetVersionResponse
