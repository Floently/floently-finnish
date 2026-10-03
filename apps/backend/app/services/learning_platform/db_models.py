from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, JSON, String, UniqueConstraint

from app.db.models import Base


class LearnerEventRecord(Base):
    """Durable relational storage for the canonical learning.v1 event payload."""

    __tablename__ = "learner_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    event_id = Column(String, nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    event_kind = Column(String, nullable=False, index=True)
    task_id = Column(String, nullable=False, index=True)
    content_version = Column(String, nullable=False)
    pathway = Column(String, nullable=False, index=True)
    runtime = Column(String, nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "learner_id",
            "event_id",
            name="uq_learner_events_learner_event",
        ),
        Index(
            "ix_learner_events_owner_time",
            "learner_id",
            "occurred_at",
            "event_id",
        ),
        Index(
            "ix_learner_events_owner_pathway_time",
            "learner_id",
            "pathway",
            "occurred_at",
        ),
    )
