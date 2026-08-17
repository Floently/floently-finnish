from __future__ import annotations

from .models import LEARNING_CONTRACT_VERSION, EvidenceType, LearnerEvent, SkillEvidence

_EVIDENCE_BY_EVENT_KIND: dict[str, EvidenceType | None] = {
    "task_started": None,
    "task_completed": "exposure",
    "task_skipped": None,
    "task_abandoned": None,
    "answer_submitted": "retrieval",
    "answer_corrected": "correction",
    "retry_completed": "retry",
    "writing_submitted": "production",
    "writing_retried": "retry",
    "speaking_submitted": "production",
    "reading_completed": "retrieval",
    "listening_completed": "retrieval",
}


def derive_skill_evidence(event: LearnerEvent) -> list[SkillEvidence]:
    """Pure deterministic conversion from a real learner event to evidence.

    Starts, skips, and abandons intentionally yield no evidence. A generic task
    completion is only exposure; stronger evidence types require a more
    specific action event.
    """

    evidence_type = _EVIDENCE_BY_EVENT_KIND[event.event_kind]
    if evidence_type is None:
        return []

    return [
        SkillEvidence(
            schema_version=LEARNING_CONTRACT_VERSION,
            evidence_id=f"{event.event_id}:{skill}:{evidence_type}",
            learner_id=event.learner_id,
            source_event_id=event.event_id,
            observed_at=event.occurred_at,
            skill=skill,
            level_band=event.level_band,
            evidence_type=evidence_type,
            score=event.score,
            max_score=event.max_score,
            pathway=event.pathway,
            profession=event.profession,
        )
        for skill in sorted(set(event.skills))
    ]
