from __future__ import annotations

import json
from dataclasses import replace
from types import SimpleNamespace

import pytest

from app.services.learning_platform import (
    InMemoryLearnerEventRepository,
    JsonFileLearnerEventRepository,
    LearnerEvent,
    LearnerEventService,
    LearnerIdentity,
    canonical_identity_from_user,
    derive_skill_evidence,
)
from app.services.learning_platform.errors import (
    IdempotencyConflict,
    LearnerOwnershipError,
    MissingLearnerIdentity,
    PersistenceError,
)


def event(**overrides) -> LearnerEvent:
    payload = {
        "schemaVersion": "learning.v1",
        "eventId": "evt-1",
        "learnerId": "user-1",
        "occurredAt": "2026-08-16T12:00:00+00:00",
        "eventKind": "reading_completed",
        "taskId": "reading-a2-1",
        "contentVersion": "content-7",
        "attemptId": "attempt-1",
        "pathway": "everyday",
        "runtime": "reading",
        "skills": ["reading"],
        "levelBand": "A2",
        "score": 3,
        "maxScore": 4,
        "metadata": {"questionCount": 4},
    }
    payload.update(overrides)
    return LearnerEvent.from_mapping(payload)


def test_same_user_can_write_and_read_own_event():
    service = LearnerEventService(InMemoryLearnerEventRepository())
    identity = LearnerIdentity("user-1")
    stored, inserted = service.record_event(identity, event())
    assert inserted is True
    assert service.get_event(identity, "evt-1") == stored
    assert service.list_events(identity) == [stored]


def test_cross_account_read_and_write_are_denied():
    service = LearnerEventService(InMemoryLearnerEventRepository())
    with pytest.raises(LearnerOwnershipError):
        service.record_event(LearnerIdentity("user-2"), event())
    service.record_event(LearnerIdentity("user-1"), event())
    with pytest.raises(LearnerOwnershipError):
        service.list_events(LearnerIdentity("user-2"), learner_id="user-1")
    with pytest.raises(LearnerOwnershipError):
        service.get_event(LearnerIdentity("user-2"), "evt-1", learner_id="user-1")


def test_missing_identity_fails_closed_and_email_is_not_fallback():
    with pytest.raises(MissingLearnerIdentity):
        LearnerIdentity("")
    with pytest.raises(MissingLearnerIdentity):
        canonical_identity_from_user(None)
    with pytest.raises(MissingLearnerIdentity):
        canonical_identity_from_user(SimpleNamespace(email="learner@example.com"))
    assert canonical_identity_from_user(
        SimpleNamespace(id="canonical-user-id", email="learner@example.com")
    ).user_id == "canonical-user-id"


def test_duplicate_event_is_idempotent_but_conflicting_reuse_is_rejected():
    service = LearnerEventService(InMemoryLearnerEventRepository())
    identity = LearnerIdentity("user-1")
    first, first_inserted = service.record_event(identity, event())
    duplicate, duplicate_inserted = service.record_event(identity, event())
    assert first_inserted is True
    assert duplicate_inserted is False
    assert duplicate == first
    with pytest.raises(IdempotencyConflict):
        service.record_event(identity, event(contentVersion="content-8"))
    assert service.get_event(identity, "evt-1").content_version == "content-7"


@pytest.mark.parametrize(
    ("occurred_at", "message"),
    [
        ("not-a-timestamp", "occurredAt must be a valid ISO datetime"),
        ("2026-08-16T12:00:00", "occurredAt must include a timezone offset"),
        ("2026-08-16", "occurredAt must include a timezone offset"),
    ],
)
def test_event_rejects_malformed_and_naive_occurred_at(occurred_at, message):
    with pytest.raises(ValueError, match=message):
        event(occurredAt=occurred_at)


def test_direct_event_creation_rejects_naive_occurred_at():
    source = event()
    with pytest.raises(ValueError, match="occurredAt must include a timezone offset"):
        replace(source, occurred_at="2026-08-16T12:00:00")


def test_json_repository_survives_restart_and_retains_versions(tmp_path):
    path = tmp_path / "learner-events.json"
    service = LearnerEventService(JsonFileLearnerEventRepository(path))
    service.record_event(LearnerIdentity("user-1"), event())

    restarted = LearnerEventService(JsonFileLearnerEventRepository(path))
    restored = restarted.get_event(LearnerIdentity("user-1"), "evt-1")
    assert restored is not None
    assert restored.schema_version == "learning.v1"
    assert restored.content_version == "content-7"
    assert restored.to_mapping()["metadata"] == {"questionCount": 4}


def test_json_repository_rejects_malformed_persistence(tmp_path):
    path = tmp_path / "learner-events.json"
    path.write_text("[]", encoding="utf-8")
    with pytest.raises(PersistenceError):
        JsonFileLearnerEventRepository(path)


def test_json_repository_rejects_naive_timestamp_during_deserialization(tmp_path):
    path = tmp_path / "learner-events.json"
    persisted_event = event().to_mapping()
    persisted_event["occurredAt"] = "2026-08-16T12:00:00"
    path.write_text(
        json.dumps({"formatVersion": 1, "events": [persisted_event]}),
        encoding="utf-8",
    )
    with pytest.raises(PersistenceError, match="occurredAt must include a timezone offset"):
        JsonFileLearnerEventRepository(path)


def test_event_to_evidence_is_deterministic_and_preserves_source():
    source = event(skills=["reading", "vocabulary"])
    first = derive_skill_evidence(source)
    second = derive_skill_evidence(source)
    assert first == second
    assert [item.skill for item in first] == ["reading", "vocabulary"]
    assert {item.evidence_type for item in first} == {"retrieval"}
    assert {item.source_event_id for item in first} == {"evt-1"}
    assert {item.learner_id for item in first} == {"user-1"}
    assert {item.level_band for item in first} == {"A2"}


@pytest.mark.parametrize("event_kind", ["task_started", "task_skipped", "task_abandoned"])
def test_non_learning_navigation_like_events_do_not_create_evidence(event_kind):
    assert derive_skill_evidence(event(eventKind=event_kind)) == []


@pytest.mark.parametrize(
    ("event_kind", "expected"),
    [
        ("task_completed", "exposure"),
        ("answer_submitted", "retrieval"),
        ("answer_corrected", "correction"),
        ("retry_completed", "retry"),
        ("writing_submitted", "production"),
        ("writing_retried", "retry"),
        ("speaking_submitted", "production"),
        ("reading_completed", "retrieval"),
        ("listening_completed", "retrieval"),
    ],
)
def test_evidence_action_mapping_is_conservative(event_kind, expected):
    source = event(eventKind=event_kind)
    assert {item.evidence_type for item in derive_skill_evidence(source)} == {expected}


def test_future_practice_queries_are_owner_scoped_and_deterministic():
    repository = InMemoryLearnerEventRepository()
    service = LearnerEventService(repository)
    identity = LearnerIdentity("user-1")
    service.record_event(identity, event(eventId="evt-2", occurredAt="2026-08-16T12:10:00+00:00"))
    service.record_event(
        identity,
        event(
            eventId="evt-1",
            occurredAt="2026-08-16T12:00:00+00:00",
            eventKind="writing_submitted",
            runtime="writing",
            skills=["writing"],
            taskId="writing-a2-1",
        ),
    )
    assert [item.event_id for item in service.list_events(identity)] == ["evt-1", "evt-2"]
    assert [item.event_id for item in service.list_events(identity, skill="reading")] == ["evt-2"]
    assert [item.skill for item in service.list_evidence(identity, skill="writing")] == ["writing"]
    assert [item.event_id for item in service.list_events(identity, since="2026-08-16T12:05:00Z")] == ["evt-2"]


def test_mixed_timezone_offsets_sort_filter_and_derive_by_actual_instant():
    service = LearnerEventService(InMemoryLearnerEventRepository())
    identity = LearnerIdentity("user-1")
    later = event(eventId="evt-later", occurredAt="2026-08-16T09:45:00+00:00")
    earlier = event(eventId="evt-earlier", occurredAt="2026-08-16T10:30:00+02:00")

    service.record_event(identity, later)
    service.record_event(identity, earlier)

    assert [item.event_id for item in service.list_events(identity)] == ["evt-earlier", "evt-later"]
    assert [item.event_id for item in service.list_events(identity, since="2026-08-16T09:00:00Z")] == [
        "evt-later"
    ]
    assert [item.source_event_id for item in service.list_evidence(identity)] == [
        "evt-earlier",
        "evt-later",
    ]


def test_since_filter_rejects_naive_cutoff():
    service = LearnerEventService(InMemoryLearnerEventRepository())
    identity = LearnerIdentity("user-1")
    service.record_event(identity, event())
    with pytest.raises(ValueError, match="since must include a timezone offset"):
        service.list_events(identity, since="2026-08-16T12:00:00")
