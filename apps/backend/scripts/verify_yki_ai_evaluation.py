from __future__ import annotations

import logging
import os
import sys

from app.services.yki_evaluation_service import (
    evaluate_yki_submission,
)


def fixture() -> tuple[dict, dict, dict]:
    runtime = {
        "level_band": "B1_B2",
        "display_level_band": "B1-B2",
        "sections": [
            {
                "section_type": "reading",
                "items": [
                    {
                        "questions": [
                            {"id": "r1"},
                            {"id": "r2"},
                            {"id": "r3"},
                        ],
                    },
                ],
            },
            {
                "section_type": "listening",
                "items": [
                    {
                        "questions": [
                            {"id": "l1"},
                            {"id": "l2"},
                        ],
                    },
                ],
            },
        ],
    }

    submission = {
        "status": "submitted",
        "score": {
            "reading": 2,
            "listening": 1,
            "writing": 1,
            "speaking": 1,
            "total": 5,
        },
        "feedback": {
            "reading": {
                "score": 2,
                "evaluation": "developing",
            },
            "listening": {
                "score": 1,
                "evaluation": "needs improvement",
            },
            "writing": {
                "score": 1,
                "evaluation": "submitted",
            },
            "speaking": {
                "score": 1,
                "evaluation": "submitted",
            },
        },
        "analytics": {
            "writing": {
                "write-1": {
                    "word_count": 34,
                    "overall": 62,
                },
            },
            "speaking": {
                "speak-1": {
                    "transcript": (
                        "Minun mielestä julkinen liikenne on tärkeä, "
                        "koska se vähentää autojen määrää."
                    ),
                    "duration_seconds": 38,
                },
            },
        },
    }

    evidence = {
        "writing": {
            "write-1": {
                "text": (
                    "Hei. Haluan antaa palautetta bussivuorosta. "
                    "Bussi oli myöhässä ja siksi myöhästyin työstä. "
                    "Toivon, että aikataulu tarkistetaan."
                ),
            },
        },
        "speaking": {
            "speak-1": {
                "duration_sec": 38,
                "audio_submitted": True,
            },
        },
        "conversation": {
            "conversation-1:turn-1": {
                "transcript_text": (
                    "Voisitteko kertoa, miksi lasku on näin suuri?"
                ),
            },
        },
    }

    return runtime, submission, evidence


def assert_contract(
    report: dict,
) -> None:
    assert report[
        "reportVersion"
    ] == "1.2"

    assert report[
        "evaluationKind"
    ] == "yki_practice"

    assert report[
        "officialResult"
    ] is False

    assert report[
        "pronunciationAssessed"
    ] is False

    assert set(
        report["sections"]
    ) == {
        "reading",
        "listening",
        "writing",
        "speaking",
    }

    assert report[
        "objectiveScores"
    ]["reading"]["score"] == 2.0

    assert report[
        "objectiveScores"
    ]["reading"]["maximum"] == 3

    assert report[
        "objectiveScores"
    ]["listening"]["score"] == 1.0

    assert report[
        "objectiveScores"
    ]["listening"]["maximum"] == 2

    assert len(
        report["actionPlan"]
    ) == 3

    assert (
        "not an official YKI"
        in report["disclaimer"]
    )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    live = "--live" in sys.argv

    os.environ[
        "OPENAI_EVALUATION_ENABLED"
    ] = (
        "true"
        if live
        else "false"
    )

    runtime, submission, evidence = fixture()

    report = evaluate_yki_submission(
        runtime=runtime,
        submission=submission,
        evidence=evidence,
    )

    assert_contract(report)

    if live:
        assert report[
            "status"
        ] == "ready", report

        assert report[
            "provider"
        ] == "openai", report

        assert report[
            "overallEstimatedLevel"
        ] != "insufficient_evidence", report

        print(
            "YKI_AI_EVALUATION_LIVE=PASS "
            f"model={report['model']} "
            f"level={report['overallEstimatedLevel']}"
        )
    else:
        assert report[
            "status"
        ] == "fallback", report

        assert report[
            "provider"
        ] == "deterministic_fallback", report

        assert report[
            "overallEstimatedLevel"
        ] == "insufficient_evidence", report

        print(
            "YKI_AI_EVALUATION_FALLBACK=PASS"
        )


if __name__ == "__main__":
    main()
