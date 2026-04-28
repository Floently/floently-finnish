from __future__ import annotations

from copy import deepcopy
from hashlib import sha256

from .decision_version import DECISION_VERSION, POLICY_VERSION, get_decision_metadata

DEFAULT_POLICY_RULES = {
    "adaptation": {
        "weight_multiplier_min": 0.8,
        "weight_multiplier_max": 1.2,
        "max_weight_adjustment": 0.06,
        "yki_influence_max_bonus": 0.03,
    },
    "stagnation": {
        "threshold_attempts": 3,
        "improvement_epsilon": 0.05,
        "retry_limit": 2,
        "escalation_path": [
            "retry_current_unit",
            "alternative_unit",
            "switch_difficulty",
            "forced_progression",
        ],
    },
    "yki": {"exam_mode_locked": True, "max_influence_contribution": 0.12},
}


def _round_score(value: float):
    return round(value, 4)


def _normalize_weights(weights: dict[str, float]):
    total = sum(max(0.0, value) for value in weights.values())
    if total <= 0:
        return {}
    return {key: _round_score(max(0.0, value) / total) for key, value in weights.items()}


def get_policy_config():
    metadata = get_decision_metadata()
    return {
        "policy_version": metadata["policy_version"],
        "decision_version": metadata["decision_version"],
        "decision_policy_version": metadata["decision_policy_version"],
        "governance_version": metadata["governance_version"],
        "change_reference": metadata["change_reference"],
        "governance_status": metadata["governance_status"],
        "rules": deepcopy(DEFAULT_POLICY_RULES),
        "lastApprovedChange": None,
    }


def build_deterministic_seed(*parts):
    payload = "::".join(str(part) for part in parts if part is not None)
    return sha256(payload.encode("utf-8")).hexdigest()


def clamp_yki_influence_bonus(suggested_bonus: float):
    cap = DEFAULT_POLICY_RULES["adaptation"]["yki_influence_max_bonus"]
    return max(0.0, min(cap, _round_score(suggested_bonus)))


def clamp_adaptive_weights(base_weights: dict[str, float], suggested_adjustments: dict[str, float], *, yki_influence_bonus: float = 0.0, audit_context: dict | None = None):
    adaptation_rules = DEFAULT_POLICY_RULES["adaptation"]
    min_multiplier = adaptation_rules["weight_multiplier_min"]
    max_multiplier = adaptation_rules["weight_multiplier_max"]
    max_adjustment = adaptation_rules["max_weight_adjustment"]
    capped_yki_bonus = clamp_yki_influence_bonus(yki_influence_bonus)
    constrained_weights = {}
    for factor, base_weight in base_weights.items():
        suggested_adjustment = _round_score(suggested_adjustments.get(factor, 0.0))
        allowed_adjustment = max(-max_adjustment, min(max_adjustment, suggested_adjustment))
        min_allowed_weight = _round_score(base_weight * min_multiplier)
        max_allowed_weight = _round_score(base_weight * max_multiplier)
        constrained_weight = max(min_allowed_weight, min(max_allowed_weight, _round_score(base_weight + allowed_adjustment)))
        if factor == "regression" and capped_yki_bonus > 0:
            constrained_weight = min(max_allowed_weight, _round_score(constrained_weight + capped_yki_bonus))
        constrained_weights[factor] = constrained_weight
    normalized_weights = _normalize_weights(constrained_weights)
    return {
        "policy_version": POLICY_VERSION,
        "decision_version": DECISION_VERSION,
        "weights": normalized_weights,
        "yki_influence_bonus": capped_yki_bonus,
    }


def get_stagnation_policy():
    return deepcopy(DEFAULT_POLICY_RULES["stagnation"])


def resolve_stagnation_stage(retry_count: int):
    escalation_path = DEFAULT_POLICY_RULES["stagnation"]["escalation_path"]
    retry_count = max(0, int(retry_count))
    return escalation_path[min(retry_count, len(escalation_path) - 1)]


def clamp_retry_count(retry_count: int):
    retry_limit = DEFAULT_POLICY_RULES["stagnation"]["retry_limit"]
    return max(0, min(retry_limit, int(retry_count)))


def is_exam_mode_locked():
    return bool(DEFAULT_POLICY_RULES["yki"]["exam_mode_locked"])
