from __future__ import annotations

from app.services.learning_platform.evidence import derive_skill_evidence
from app.services.learning_platform.errors import LearnerOwnershipError
from app.services.learning_platform.identity import LearnerIdentity
from app.services.learning_platform.models import LearnerEvent, SkillEvidence
from app.services.learning_platform.sql_repository import SqlAlchemyLearnerEventRepository


class AsyncLearnerEventService:
    """Async ownership boundary for durable learner-event persistence."""

    def __init__(self, repository: SqlAlchemyLearnerEventRepository) -> None:
        self.repository = repository

    async def record_event(
        self,
        identity: LearnerIdentity,
        event: LearnerEvent,
    ) -> tuple[LearnerEvent, bool]:
        self._require_owner(identity, event.learner_id)
        return await self.repository.append(event)

    async def get_event(
        self,
        identity: LearnerIdentity,
        event_id: str,
        *,
        learner_id: str | None = None,
    ) -> LearnerEvent | None:
        owner_id = learner_id or identity.user_id
        self._require_owner(identity, owner_id)
        return await self.repository.get(owner_id, event_id)

    async def list_events(
        self,
        identity: LearnerIdentity,
        *,
        learner_id: str | None = None,
        pathway: str | None = None,
        skill: str | None = None,
        since: str | None = None,
        limit: int = 200,
    ) -> list[LearnerEvent]:
        owner_id = learner_id or identity.user_id
        self._require_owner(identity, owner_id)

        events = await self.repository.list_for_learner(
            owner_id,
            pathway=pathway,
            since=since,
            limit=limit,
        )

        if skill is not None:
            events = [event for event in events if skill in event.skills]

        return events

    async def list_evidence(
        self,
        identity: LearnerIdentity,
        *,
        learner_id: str | None = None,
        pathway: str | None = None,
        skill: str | None = None,
        since: str | None = None,
        limit: int = 200,
    ) -> list[SkillEvidence]:
        events = await self.list_events(
            identity,
            learner_id=learner_id,
            pathway=pathway,
            skill=skill,
            since=since,
            limit=limit,
        )

        evidence = [
            item
            for event in events
            for item in derive_skill_evidence(event)
        ]
        if skill is not None:
            evidence = [item for item in evidence if item.skill == skill]

        return evidence

    @staticmethod
    def _require_owner(identity: LearnerIdentity, learner_id: str) -> None:
        if identity.user_id != str(learner_id or "").strip():
            raise LearnerOwnershipError(
                "Learner data is owned by another authenticated user"
            )
