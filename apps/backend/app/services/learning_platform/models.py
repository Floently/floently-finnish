from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

LEARNING_CONTRACT_VERSION = "learning.v1"

LearningPathway = Literal["everyday", "professional", "yki"]
LearningSkill = Literal[
    "vocabulary",
    "grammar",
    "listening",
    "speaking",
    "reading",
    "writing",
]
LearningRuntime = Literal[
    "cards",
    "roleplay",
    "reading",
    "writing",
    "listening",
    "yki",
    "professional_mission",
    "grammar",
]
TaskHealth = Literal["available", "degraded", "unavailable"]
LearnerEventKind = Literal[
    "task_started",
    "task_completed",
    "task_skipped",
    "task_abandoned",
    "answer_submitted",
    "answer_corrected",
    "retry_completed",
    "writing_submitted",
    "writing_retried",
    "speaking_submitted",
    "reading_completed",
    "listening_completed",
]
EvidenceType = Literal["exposure", "retrieval", "production", "correction", "retry"]

_ALLOWED_PATHWAYS = {"everyday", "professional", "yki"}
_ALLOWED_SKILLS = {"vocabulary", "grammar", "listening", "speaking", "reading", "writing"}
_ALLOWED_RUNTIMES = {
    "cards",
    "roleplay",
    "reading",
    "writing",
    "listening",
    "yki",
    "professional_mission",
    "grammar",
}
_ALLOWED_HEALTH = {"available", "degraded", "unavailable"}
_ALLOWED_EVENT_KINDS = {
    "task_started",
    "task_completed",
    "task_skipped",
    "task_abandoned",
    "answer_submitted",
    "answer_corrected",
    "retry_completed",
    "writing_submitted",
    "writing_retried",
    "speaking_submitted",
    "reading_completed",
    "listening_completed",
}


def _required(value: Any, field_name: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"{field_name} is required")
    return normalized


def _string_tuple(values: Any, field_name: str, *, allowed: set[str] | None = None) -> tuple[str, ...]:
    if not isinstance(values, (list, tuple)):
        raise ValueError(f"{field_name} must be a list")
    normalized = tuple(_required(value, field_name) for value in values)
    if not normalized:
        raise ValueError(f"{field_name} must not be empty")
    if allowed is not None:
        unknown = sorted(set(normalized) - allowed)
        if unknown:
            raise ValueError(f"Unsupported {field_name}: {', '.join(unknown)}")
    return normalized


def _metadata(value: Any) -> dict[str, str | int | float | bool]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError("metadata must be an object")
    result: dict[str, str | int | float | bool] = {}
    for key, item in value.items():
        if not isinstance(key, str) or not key:
            raise ValueError("metadata keys must be non-empty strings")
        if isinstance(item, bool) or isinstance(item, (str, int, float)):
            result[key] = item
        else:
            raise ValueError("metadata values must be string, number, or boolean")
    return result


@dataclass(frozen=True, slots=True)
class TaskCapability:
    capability_id: str
    runtime: LearningRuntime
    supported_pathways: tuple[LearningPathway, ...]
    supported_skills: tuple[LearningSkill, ...]
    health: TaskHealth
    feature_flag: str | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "capability_id", _required(self.capability_id, "capabilityId"))
        if self.runtime not in _ALLOWED_RUNTIMES:
            raise ValueError(f"Unsupported runtime: {self.runtime}")
        object.__setattr__(
            self,
            "supported_pathways",
            _string_tuple(self.supported_pathways, "supportedPathways", allowed=_ALLOWED_PATHWAYS),
        )
        object.__setattr__(
            self,
            "supported_skills",
            _string_tuple(self.supported_skills, "supportedSkills", allowed=_ALLOWED_SKILLS),
        )
        if self.health not in _ALLOWED_HEALTH:
            raise ValueError(f"Unsupported health: {self.health}")
        if self.feature_flag is not None:
            object.__setattr__(self, "feature_flag", _required(self.feature_flag, "featureFlag"))

    @classmethod
    def from_mapping(cls, payload: dict[str, Any]) -> "TaskCapability":
        return cls(
            capability_id=payload.get("capabilityId"),
            runtime=payload.get("runtime"),
            supported_pathways=tuple(payload.get("supportedPathways") or ()),
            supported_skills=tuple(payload.get("supportedSkills") or ()),
            health=payload.get("health"),
            feature_flag=payload.get("featureFlag"),
        )

    def to_mapping(self) -> dict[str, Any]:
        payload = {
            "capabilityId": self.capability_id,
            "runtime": self.runtime,
            "supportedPathways": list(self.supported_pathways),
            "supportedSkills": list(self.supported_skills),
            "health": self.health,
        }
        if self.feature_flag is not None:
            payload["featureFlag"] = self.feature_flag
        return payload


@dataclass(frozen=True, slots=True)
class LearnerEvent:
    schema_version: str
    event_id: str
    learner_id: str
    occurred_at: str
    event_kind: LearnerEventKind
    task_id: str
    content_version: str
    pathway: LearningPathway
    runtime: LearningRuntime
    skills: tuple[LearningSkill, ...]
    level_band: str
    attempt_id: str | None = None
    profession: str | None = None
    context_id: str | None = None
    score: float | None = None
    max_score: float | None = None
    metadata: dict[str, str | int | float | bool] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.schema_version != LEARNING_CONTRACT_VERSION:
            raise ValueError(f"Unsupported schemaVersion: {self.schema_version}")
        for attr, name in (
            (self.event_id, "eventId"),
            (self.learner_id, "learnerId"),
            (self.occurred_at, "occurredAt"),
            (self.task_id, "taskId"),
            (self.content_version, "contentVersion"),
            (self.level_band, "levelBand"),
        ):
            object.__setattr__(self, name_to_attr(name), _required(attr, name))
        if self.event_kind not in _ALLOWED_EVENT_KINDS:
            raise ValueError(f"Unsupported eventKind: {self.event_kind}")
        if self.pathway not in _ALLOWED_PATHWAYS:
            raise ValueError(f"Unsupported pathway: {self.pathway}")
        if self.runtime not in _ALLOWED_RUNTIMES:
            raise ValueError(f"Unsupported runtime: {self.runtime}")
        object.__setattr__(self, "skills", _string_tuple(self.skills, "skills", allowed=_ALLOWED_SKILLS))
        for optional_attr in ("attempt_id", "profession", "context_id"):
            value = getattr(self, optional_attr)
            if value is not None:
                object.__setattr__(self, optional_attr, _required(value, optional_attr))
        object.__setattr__(self, "metadata", _metadata(self.metadata))
        if self.score is not None and self.max_score is not None and self.max_score < 0:
            raise ValueError("maxScore must be non-negative")

    @classmethod
    def from_mapping(cls, payload: dict[str, Any]) -> "LearnerEvent":
        return cls(
            schema_version=payload.get("schemaVersion"),
            event_id=payload.get("eventId"),
            learner_id=payload.get("learnerId"),
            occurred_at=payload.get("occurredAt"),
            event_kind=payload.get("eventKind"),
            task_id=payload.get("taskId"),
            content_version=payload.get("contentVersion"),
            attempt_id=payload.get("attemptId"),
            pathway=payload.get("pathway"),
            runtime=payload.get("runtime"),
            skills=tuple(payload.get("skills") or ()),
            level_band=payload.get("levelBand"),
            profession=payload.get("profession"),
            context_id=payload.get("contextId"),
            score=payload.get("score"),
            max_score=payload.get("maxScore"),
            metadata=payload.get("metadata") or {},
        )

    def to_mapping(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "schemaVersion": self.schema_version,
            "eventId": self.event_id,
            "learnerId": self.learner_id,
            "occurredAt": self.occurred_at,
            "eventKind": self.event_kind,
            "taskId": self.task_id,
            "contentVersion": self.content_version,
            "pathway": self.pathway,
            "runtime": self.runtime,
            "skills": list(self.skills),
            "levelBand": self.level_band,
        }
        for key, value in (
            ("attemptId", self.attempt_id),
            ("profession", self.profession),
            ("contextId", self.context_id),
            ("score", self.score),
            ("maxScore", self.max_score),
        ):
            if value is not None:
                payload[key] = value
        if self.metadata:
            payload["metadata"] = dict(self.metadata)
        return payload


@dataclass(frozen=True, slots=True)
class SkillEvidence:
    schema_version: str
    evidence_id: str
    learner_id: str
    source_event_id: str
    observed_at: str
    skill: LearningSkill
    level_band: str
    evidence_type: EvidenceType
    pathway: LearningPathway
    score: float | None = None
    max_score: float | None = None
    profession: str | None = None

    def to_mapping(self) -> dict[str, Any]:
        payload = {
            "schemaVersion": self.schema_version,
            "evidenceId": self.evidence_id,
            "learnerId": self.learner_id,
            "sourceEventId": self.source_event_id,
            "observedAt": self.observed_at,
            "skill": self.skill,
            "levelBand": self.level_band,
            "evidenceType": self.evidence_type,
            "pathway": self.pathway,
        }
        if self.score is not None:
            payload["score"] = self.score
        if self.max_score is not None:
            payload["maxScore"] = self.max_score
        if self.profession is not None:
            payload["profession"] = self.profession
        return payload


def name_to_attr(contract_name: str) -> str:
    return {
        "eventId": "event_id",
        "learnerId": "learner_id",
        "occurredAt": "occurred_at",
        "taskId": "task_id",
        "contentVersion": "content_version",
        "levelBand": "level_band",
    }[contract_name]
