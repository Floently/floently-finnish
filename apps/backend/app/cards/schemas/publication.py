from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import Field, model_validator

from .common import CardsBaseModel, IDENTIFIER_PATTERN


class PublicationState(str, Enum):
    draft = "draft"
    validated = "validated"
    published = "published"
    archived = "archived"


class PublicationInfo(CardsBaseModel):
    state: PublicationState
    version_tag: str = Field(pattern=IDENTIFIER_PATTERN)
    manifest_ref: str | None = Field(default=None, pattern=IDENTIFIER_PATTERN)
    validation_passed: bool = False
    published_at: datetime | None = None
    archived_at: datetime | None = None

    @model_validator(mode="after")
    def validate_state(self) -> "PublicationInfo":
        if self.state == PublicationState.validated and not self.validation_passed:
            raise ValueError("validated publication requires validation_passed=True")
        if self.state == PublicationState.published:
            if not self.validation_passed:
                raise ValueError("published publication requires validation_passed=True")
            if self.published_at is None:
                raise ValueError("published publication requires published_at")
        if self.state == PublicationState.archived and self.archived_at is None:
            raise ValueError("archived publication requires archived_at")
        return self

