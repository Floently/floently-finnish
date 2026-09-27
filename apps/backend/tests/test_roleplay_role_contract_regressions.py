from __future__ import annotations

import json
from pathlib import Path

from app.services.roleplay_ai_service import _violates_role_contract


FIXTURE_PATH = (
    Path(__file__).parent
    / "fixtures"
    / "roleplay_role_contract_regressions.json"
)


def test_production_role_contract_regression_corpus() -> None:
    cases = json.loads(
        FIXTURE_PATH.read_text(
            encoding="utf-8"
        )
    )

    mismatches: list[str] = []

    for case in cases:
        actual = _violates_role_contract(
            case["text"],
            profession=case["profession"],
            scenario_id=case["scenario_id"],
            counterpart_role=case["counterpart_role"],
        )

        expected = bool(
            case["expected_violation"]
        )

        if actual != expected:
            mismatches.append(
                "\n".join(
                    [
                        f"id={case['id']}",
                        f"source={case['source']}",
                        f"learner_role={case['learner_role']}",
                        f"counterpart_role={case['counterpart_role']}",
                        f"expected_violation={expected}",
                        f"actual_violation={actual}",
                        f"text={case['text']}",
                    ]
                )
            )

    assert not mismatches, (
        "ROLEPLAY_ROLE_CONTRACT_REGRESSION\n\n"
        + "\n\n---\n\n".join(
            mismatches
        )
    )
