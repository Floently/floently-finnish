from __future__ import annotations

import asyncio
from unittest.mock import patch

from app.services import yki_service as svc


async def main() -> None:
    evaluation = {
        "disclaimer": "practice only",
        "status": "ready",
    }
    submission = {
        "status": "submitted",
        "score": {"reading": 1},
    }
    record = {
        "submission_result": submission,
        "evaluation_report": evaluation,
    }

    with (
        patch.object(
            svc,
            "get_yki_session_record",
            return_value=record,
        ),
        patch.object(
            svc,
            "read_yki_evaluation_evidence",
            side_effect=AssertionError(
                "idempotent recovery must return before reading evidence"
            ),
        ),
        patch.object(
            svc,
            "evaluate_yki_submission",
            side_effect=AssertionError(
                "idempotent recovery must not evaluate again"
            ),
        ),
    ):
        result = await svc.submit_yki_exam(
            user_id="user",
            session_id="session",
            confirm_incomplete=True,
        )

    assert result["status"] == "submitted", result
    assert result["evaluation"] is evaluation, result
    assert result["evaluationReport"] is evaluation, result
    assert result["disclaimer"] == "practice only", result

    print("YKI_FINAL_SUBMIT_IDEMPOTENT_RECOVERY=PASS")


if __name__ == "__main__":
    asyncio.run(main())
