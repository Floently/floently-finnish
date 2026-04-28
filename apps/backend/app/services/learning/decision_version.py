BASE_DECISION_VERSION = "1.0.0"
DECISION_VERSION = BASE_DECISION_VERSION
POLICY_VERSION = "1.0.0"
GOVERNANCE_VERSION = "legacy_uncontrolled"
GOVERNED_POLICY_COMPONENT = "learning.policy_engine"
DECISION_POLICY_VERSION = f"{DECISION_VERSION}|policy:{POLICY_VERSION}"


def get_decision_metadata():
    return {
        "decision_version": DECISION_VERSION,
        "policy_version": POLICY_VERSION,
        "decision_policy_version": DECISION_POLICY_VERSION,
        "governance_version": GOVERNANCE_VERSION,
        "change_reference": None,
        "governance_status": "legacy_uncontrolled",
    }
