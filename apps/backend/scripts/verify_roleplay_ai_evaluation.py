from __future__ import annotations

import logging
import os
import sys

from app.services.roleplay_evaluation_service import (
    evaluate_roleplay_session,
)


def fixture() -> tuple[dict, dict]:
    session = {
        "level": "B1-B2",
        "profession": "general",
        "scenario": {
            "scenario_id": (
                "general_everyday_conversation"
            ),
            "title": "Tuotteen vaihtaminen",
            "prompt": (
                "Vaihda väärän kokoinen "
                "tuote liikkeessä."
            ),
            "track": "general",
            "keyPhrases": [
                "haluaisin vaihtaa",
                "voisitteko auttaa",
                "mikä on seuraava vaihe",
            ],
        },
        "mission": {
            "missionId": (
                "shop_return_wrong_size"
            ),
            "title": (
                "Väärän kokoisen tuotteen palautus"
            ),
            "learnerGoal": (
                "Selitä ongelma ja sovi ratkaisu."
            ),
            "complication": (
                "Kuittia ei löydy heti."
            ),
            "requiredActions": [
                "selitä ongelma",
                "pyydä ratkaisua",
                "sovi seuraava askel",
            ],
        },
    }

    review = {
        "track": "general",
        "scores": {
            "totalTurns": 3,
            "avgWordCount": 7,
            "avgPhrasesCoverage": 3,
        },
        "transcriptAnnotated": [
            {
                "speaker": "AI",
                "text": "Hei, miten voin auttaa?",
                "comment": None,
            },
            {
                "speaker": "USER",
                "text": (
                    "Hei, haluaisin vaihtaa "
                    "tämän tuotteen."
                ),
                "comment": None,
            },
            {
                "speaker": "AI",
                "text": (
                    "Mikä tuotteessa on vikana?"
                ),
                "comment": None,
            },
            {
                "speaker": "USER",
                "text": (
                    "Voisitteko auttaa, koska "
                    "koko on väärä?"
                ),
                "comment": None,
            },
            {
                "speaker": "AI",
                "text": "Onko sinulla kuitti?",
                "comment": None,
            },
            {
                "speaker": "USER",
                "text": (
                    "Kuitti ei ole mukana. "
                    "Mikä on seuraava vaihe?"
                ),
                "comment": None,
            },
        ],
        "strongPhrases": [
            "haluaisin vaihtaa",
            "voisitteko auttaa",
            "mikä on seuraava vaihe",
        ],
        "difficultPhrases": [],
    }

    return session, review


def assert_contract(
    report: dict,
) -> None:
    assert report[
        "reportVersion"
    ] == "1.0"

    assert report[
        "evaluationKind"
    ] == "roleplay"

    assert report[
        "provider"
    ] in {
        "openai",
        "deterministic_fallback",
    }

    assert report[
        "status"
    ] in {
        "ready",
        "fallback",
    }

    assert report[
        "pronunciationAssessed"
    ] is False

    assert report[
        "audioEvidenceAvailable"
    ] is False

    assert len(
        report["criteria"]
    ) == 6

    assert {
        item["id"]
        for item in report["criteria"]
    } == {
        "task_fulfilment",
        "interaction",
        "coherence",
        "grammar",
        "vocabulary",
        "register",
    }

    assert len(
        report["actionPlan"]
    ) >= 3

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

    session, review = fixture()

    report = evaluate_roleplay_session(
        session=session,
        review=review,
    )

    assert_contract(
        report,
    )

    if live:
        assert report[
            "status"
        ] == "ready", report

        assert report[
            "provider"
        ] == "openai", report

        assert report[
            "model"
        ], report

        print(
            "ROLEPLAY_AI_EVALUATION_LIVE=PASS "
            f"model={report['model']} "
            f"level={report['estimatedLevel']}"
        )

    else:
        assert report[
            "status"
        ] == "fallback", report

        assert report[
            "provider"
        ] == "deterministic_fallback", report

        assert report[
            "estimatedLevel"
        ] == "insufficient_evidence", report

        print(
            "ROLEPLAY_AI_EVALUATION_FALLBACK=PASS"
        )


if __name__ == "__main__":
    main()
