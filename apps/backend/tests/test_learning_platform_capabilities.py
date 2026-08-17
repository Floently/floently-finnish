from pathlib import Path

import pytest

from app.services.learning_platform import CapabilityRegistry, TaskCapability
from app.services.learning_platform.errors import CapabilityConflict


def capability(**overrides):
    payload = {
        "capabilityId": "reading.everyday",
        "runtime": "reading",
        "supportedPathways": ["everyday"],
        "supportedSkills": ["reading"],
        "health": "available",
    }
    payload.update(overrides)
    return TaskCapability.from_mapping(payload)


def test_capability_registry_is_deterministic_and_idempotent():
    registry = CapabilityRegistry()
    registry.register(capability(capabilityId="z-runtime"))
    registry.register(capability(capabilityId="a-runtime"))
    registry.register(capability(capabilityId="a-runtime"))
    assert [item.capability_id for item in registry.list_capabilities()] == ["a-runtime", "z-runtime"]


def test_conflicting_capability_definition_is_rejected():
    registry = CapabilityRegistry()
    registry.register(capability())
    with pytest.raises(CapabilityConflict):
        registry.register(capability(health="degraded"))


def test_feature_flag_health_fails_closed_and_is_deterministic():
    registry = CapabilityRegistry()
    registry.register(capability(featureFlag="wave1_reading", health="degraded"))

    missing = registry.resolve("reading.everyday")
    disabled = registry.resolve("reading.everyday", feature_flags={"wave1_reading": False})
    enabled = registry.resolve("reading.everyday", feature_flags={"wave1_reading": True})

    assert missing.feature_enabled is False
    assert missing.effective_health == "unavailable"
    assert missing.schedulable is False
    assert disabled == missing
    assert enabled.feature_enabled is True
    assert enabled.effective_health == "degraded"
    assert enabled.schedulable is True


def test_unavailable_capability_is_never_schedulable():
    registry = CapabilityRegistry()
    registry.register(capability(health="unavailable"))
    state = registry.resolve("reading.everyday")
    assert state.effective_health == "unavailable"
    assert state.schedulable is False


def test_registry_queries_do_not_emit_or_persist_learner_events():
    registry = CapabilityRegistry()
    registry.register(capability())
    assert registry.get("reading.everyday") == capability()
    assert len(registry.list_states()) == 1
    # The registry has no learner-event repository dependency by design.
    assert not hasattr(registry, "repository")


def test_frozen_typescript_contract_still_contains_agent_b_fields():
    contract_path = Path(__file__).parents[3] / "packages" / "core" / "schemas" / "learning.ts"
    source = contract_path.read_text(encoding="utf-8")
    for marker in (
        "LEARNING_CONTRACT_VERSION = 'learning.v1'",
        "export type TaskCapability",
        "export type LearnerEvent",
        "export type SkillEvidence",
        "contentVersion: string",
        "learnerId: string",
        "sourceEventId: string",
    ):
        assert marker in source
