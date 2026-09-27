from __future__ import annotations

from .evidence import derive_skill_evidence
from .errors import LearnerOwnershipError
from .identity import LearnerIdentity
from .models import (
    LearnerEvent,
    LearningPathway,
    LearningSkill,
    SkillEvidence,
    parse_aware_iso_datetime,
)
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
            cutoff = parse_aware_iso_datetime(since, "since")
            events = [
                event
                for event in events
                if parse_aware_iso_datetime(event.occurred_at, "occurredAt") >= cutoff
            ]
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
        return sorted(
            evidence,
            key=lambda item: (
                parse_aware_iso_datetime(item.observed_at, "observedAt"),
                item.evidence_id,
            ),
        )

    @staticmethod
    def _require_owner(identity: LearnerIdentity, learner_id: str) -> None:
        if identity.user_id != str(learner_id or "").strip():
            raise LearnerOwnershipError("Learner data is owned by another authenticated user")
