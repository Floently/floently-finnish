from __future__ import annotations

import json
from pathlib import Path

from app.services.learning_platform import CapabilityRegistry, LearnerEvent, TaskCapability, derive_skill_evidence


def test_wave1_fixture_corpus_parses_and_keeps_provenance():
    fixture_path = Path(__file__).parent / "fixtures" / "learning_platform_wave1.json"
    payload = json.loads(fixture_path.read_text(encoding="utf-8"))

    registry = CapabilityRegistry()
    for item in payload["capabilities"]:
        registry.register(TaskCapability.from_mapping(item))
    assert [item.capability_id for item in registry.list_capabilities()] == [
        "reading.everyday.fixture",
        "speaking.professional.fixture",
    ]

    events = [LearnerEvent.from_mapping(item) for item in payload["events"]]
    assert [item.content_version for item in events] == ["fixture-content-v3", "fixture-writing-v2"]
    assert [item.source_event_id for event in events for item in derive_skill_evidence(event)] == [
        "fixture-reading-completed",
        "fixture-writing-submitted",
    ]
