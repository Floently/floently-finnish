from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .errors import CapabilityConflict
from .models import TaskCapability, TaskHealth


@dataclass(frozen=True, slots=True)
class CapabilityState:
    capability: TaskCapability
    effective_health: TaskHealth
    feature_enabled: bool

    @property
    def schedulable(self) -> bool:
        return self.feature_enabled and self.effective_health != "unavailable"

    def to_mapping(self) -> dict:
        payload = self.capability.to_mapping()
        payload.update(
            {
                "effectiveHealth": self.effective_health,
                "featureEnabled": self.feature_enabled,
                "schedulable": self.schedulable,
            }
        )
        return payload


class CapabilityRegistry:
    """Deterministic registry for runtime capability declarations.

    Feature flags are passed in explicitly. A missing configured flag fails
    closed for scheduling instead of assuming that the feature is enabled.
    """

    def __init__(self) -> None:
        self._capabilities: dict[str, TaskCapability] = {}

    def register(self, capability: TaskCapability) -> TaskCapability:
        existing = self._capabilities.get(capability.capability_id)
        if existing is None:
            self._capabilities[capability.capability_id] = capability
            return capability
        if existing != capability:
            raise CapabilityConflict(
                f"Capability {capability.capability_id!r} already has a different definition"
            )
        return existing

    def get(self, capability_id: str) -> TaskCapability | None:
        return self._capabilities.get(str(capability_id or "").strip())

    def list_capabilities(self) -> list[TaskCapability]:
        return [self._capabilities[key] for key in sorted(self._capabilities)]

    def resolve(
        self,
        capability_id: str,
        *,
        feature_flags: Mapping[str, bool] | None = None,
    ) -> CapabilityState | None:
        capability = self.get(capability_id)
        if capability is None:
            return None
        return self._state(capability, feature_flags=feature_flags or {})

    def list_states(
        self,
        *,
        feature_flags: Mapping[str, bool] | None = None,
    ) -> list[CapabilityState]:
        flags = feature_flags or {}
        return [self._state(capability, feature_flags=flags) for capability in self.list_capabilities()]

    @staticmethod
    def _state(
        capability: TaskCapability,
        *,
        feature_flags: Mapping[str, bool],
    ) -> CapabilityState:
        if capability.feature_flag is None:
            enabled = True
        else:
            enabled = feature_flags.get(capability.feature_flag) is True
        effective_health: TaskHealth = capability.health if enabled else "unavailable"
        return CapabilityState(
            capability=capability,
            effective_health=effective_health,
            feature_enabled=enabled,
        )
