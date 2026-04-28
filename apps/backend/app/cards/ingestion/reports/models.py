from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.cards.schemas.common import CardsBaseModel, IDENTIFIER_PATTERN


class RejectedCardRecord(CardsBaseModel):
    item_index: int = Field(ge=0)
    original_input: dict
    normalized_form: dict | None = None
    error_messages: list[str] = Field(min_length=1)


class IngestionAuditRecord(CardsBaseModel):
    item_index: int = Field(ge=0)
    card_id: str = Field(pattern=IDENTIFIER_PATTERN)
    content_type: str


class IngestionRunReport(CardsBaseModel):
    run_id: str = Field(pattern=IDENTIFIER_PATTERN)
    generated_at: datetime
    source_name: str = Field(min_length=1, max_length=512)
    accepted_count: int = Field(ge=0)
    rejected_count: int = Field(ge=0)
    accepted_cards: list[IngestionAuditRecord] = Field(default_factory=list)
    rejected_cards: list[RejectedCardRecord] = Field(default_factory=list)
