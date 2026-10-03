"""Wave-1 learner-event and task-capability foundation.

This package is intentionally independent from the legacy learning scheduler.
HTTP callers must pass canonical authenticated user identity explicitly.
"""

from .async_service import AsyncLearnerEventService
from .capabilities import CapabilityRegistry, CapabilityState
from .evidence import derive_skill_evidence
from .identity import LearnerIdentity, canonical_identity_from_user
from .models import LearnerEvent, SkillEvidence, TaskCapability
from .repositories import InMemoryLearnerEventRepository, JsonFileLearnerEventRepository
from .service import LearnerEventService
from .sql_repository import SqlAlchemyLearnerEventRepository

__all__ = [
    "AsyncLearnerEventService",
    "CapabilityRegistry",
    "CapabilityState",
    "InMemoryLearnerEventRepository",
    "JsonFileLearnerEventRepository",
    "LearnerEvent",
    "LearnerEventService",
    "LearnerIdentity",
    "SkillEvidence",
    "SqlAlchemyLearnerEventRepository",
    "TaskCapability",
    "canonical_identity_from_user",
    "derive_skill_evidence",
]
