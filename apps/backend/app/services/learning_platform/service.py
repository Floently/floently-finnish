from __future__ import annotations

from datetime import datetime

from .evidence import derive_skill_evidence
from .errors import LearnerOwnershipError
from .identity import LearnerIdentity
from .models import LearnerEvent, LearningPathway, LearningSkill, SkillEvidence
from .repositories import LearnerEventRepository


class LearnerEventService:
    """Authenticated ownership boundary around learner-event persistence."""

    def __init__(self, repository: LearnerEventRepository) -> None:
        self.repository = repository

    def record_event(
        self,
        identity: LearnerIdentity,
        event: LearnerEvent,
    ) -> tuple[LearnerEvent, bool]:
        self._require_owner(identity, event.learner_id)
        return self.repository.append(event)

    def get_event(
        self,
        identity: LearnerIdentity,
        event_id: str,
        *,
        learner_id: str | None = None,
    ) -> LearnerEvent | None:
        owner_id = learner_id or identity.user_id
        self._require_owner(identity, owner_id)
        return self.repository.get(owner_id, event_id)

    def list_events(
        self,
        identity: LearnerIdentity,
        *,
        learner_id: str | None = None,
        pathway: LearningPathway | None = None,
        skill: LearningSkill | None = None,
        since: str | None = None,
    ) -> list[LearnerEvent]:
        owner_id = learner_id or identity.user_id
        self._require_owner(identity, owner_id)
        events = self.repository.list_for_learner(owner_id)
        if pathway is not None:
            events = [event for event in events if event.pathway == pathway]
        if skill is not None:
            events = [event for event in events if skill in event.skills]
        if since is not None:
            cutoff = _parse_iso_datetime(since)
            events = [event for event in events if _parse_iso_datetime(event.occurred_at) >= cutoff]
        return events

    def list_evidence(
        self,
        identity: LearnerIdentity,
        *,
        learner_id: str | None = None,
        pathway: LearningPathway | None = None,
        skill: LearningSkill | None = None,
        since: str | None = None,
    ) -> list[SkillEvidence]:
        evidence = [
            item
            for event in self.list_events(
                identity,
                learner_id=learner_id,
                pathway=pathway,
                skill=skill,
                since=since,
            )
            for item in derive_skill_evidence(event)
        ]
        if skill is not None:
            evidence = [item for item in evidence if item.skill == skill]
        return sorted(evidence, key=lambda item: (item.observed_at, item.evidence_id))

    @staticmethod
    def _require_owner(identity: LearnerIdentity, learner_id: str) -> None:
        if identity.user_id != str(learner_id or "").strip():
            raise LearnerOwnershipError("Learner data is owned by another authenticated user")


def _parse_iso_datetime(value: str) -> datetime:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError("timestamp is required")
    try:
        return datetime.fromisoformat(normalized.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"Invalid ISO timestamp: {value!r}") from exc
