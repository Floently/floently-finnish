from __future__ import annotations

import copy
import random
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

from app.services import yki_evaluation_service as evaluation
from app.runtime import yki_local_fallback as bank


def _section(level, score, evidence, criteria, corrections=None):
    return {
        "status": "assessed",
        "estimated_level": level,
        "score_available": True,
        "score": score,
        "summary": "Balanced, specific practice assessment.",
        "evidence": evidence,
        "criteria": [
            {
                "name": name,
                "score": criterion_score,
                "score_max": 5,
                "rationale": "Criterion rationale.",
                "evidence": criterion_evidence,
            }
            for name, criterion_score, criterion_evidence in criteria
        ],
        "corrections": corrections or [],
        "improvements": [
            "Practise the next-level feature shown by this criterion.",
            "Repeat the task and compare the new evidence.",
        ],
    }


def main() -> None:
    writing_1 = "Haluan hakea kesätyöpaikkaa kaupungin puistotoimessa. Olen ahkera ja vastuullinen."
    writing_2 = "Kokonaisuudessaan osallistuva budjetointi on mielestäni onnistunut ja hyödyllinen toimintatapa."
    speaking_1 = "Hei, kuinka kauan olet asunut täällä asunnossa?"
    speaking_2 = "Voitko kertoa, milloin ilmoittautuminen avautuu?"

    payload = {
        "target_level_band": "B1-B2",
        "objective_scores": {
            "reading": {"score": 8.0, "maximum": 14, "percentage": 57.1},
            "listening": {"score": 0.0, "maximum": 9, "percentage": 0.0},
        },
        "writing_responses": [
            {"task_id": "w1", "text": writing_1},
            {"task_id": "w2", "text": writing_2},
        ],
        "speaking_transcripts": [speaking_1, speaking_2],
    }

    raw = {
        "overall_estimated_level": "A2",
        "confidence": 0.75,
        "overall_summary": "Mixed profile.",
        "sections": {
            "reading": _section("A2", 57.1, [writing_1], [("Understanding", 3, [writing_2])]),
            "listening": _section("A1", 0, [speaking_1], [("Understanding", 1, [speaking_2])]),
            "writing": _section(
                "B1",
                0,
                [writing_1, writing_2],
                [("Task fulfilment", 3, [writing_1]), ("Coherence", 3, [writing_2])],
                [{
                    "original": "Olen ahkera ja vastuullinen.",
                    "corrected": "Olen ahkera, vastuullinen ja yhteistyökykyinen.",
                    "explanation": "Adds a relevant quality.",
                }],
            ),
            "speaking": _section(
                "A2",
                0,
                [speaking_1, speaking_2],
                [("Task fulfilment", 2, [speaking_1]), ("Coherence", 2, [speaking_2])],
            ),
        },
        "strengths": ["Writing is structured."],
        "improvements": ["Improve listening."],
        "action_plan": [
            "Review missed listening items.",
            "Rewrite one response.",
            "Repeat one speaking task.",
        ],
    }

    normalized = evaluation._normalise_ai_report(copy.deepcopy(raw), payload)
    assert normalized is not None

    reading = normalized["sections"]["reading"]
    listening = normalized["sections"]["listening"]
    writing = normalized["sections"]["writing"]
    speaking = normalized["sections"]["speaking"]

    assert reading["score"] == 57.1
    assert reading["evidence"] == ["Exact score: 8.0/14 (57.1%)."]
    assert all(item["evidence"] == reading["evidence"] for item in reading["criteria"])

    assert listening["score"] == 0.0
    assert listening["scoreAvailable"] is True
    assert listening["evidence"] == ["Exact score: 0.0/9 (0.0%)."]
    assert all(item["evidence"] == listening["evidence"] for item in listening["criteria"])

    assert writing["scoreAvailable"] is True
    assert writing["score"] == 60.0
    assert speaking["scoreAvailable"] is True
    assert speaking["score"] == 40.0
    assert writing["corrections"]
    assert not speaking["corrections"]

    prediction = evaluation._prediction_payload(
        target_level="B1-B2",
        sections=normalized["sections"],
    )
    assert prediction["sections"]["reading"]["grade"] == "below 3"
    assert prediction["sections"]["listening"]["grade"] == "below 3"
    assert prediction["sections"]["writing"]["grade"] == "3"
    assert prediction["sections"]["speaking"]["grade"] == "below 3"
    assert prediction["officialResult"] is False

    assert evaluation.REPORT_VERSION == "1.2"
    assert evaluation.PROMPT_VERSION == "yki-deep-evaluation-v4"
    assert evaluation.RUBRIC_VERSION == "floently-yki-practice-v3"

    synthetic = [
        {"difficulty": 0.15, "id": "easy-1"},
        {"difficulty": 0.20, "id": "easy-2"},
        {"difficulty": 0.45, "id": "mid-1"},
        {"difficulty": 0.55, "id": "mid-2"},
        {"difficulty": 0.80, "id": "hard-1"},
        {"difficulty": 0.90, "id": "hard-2"},
    ]
    selected = bank._select_difficulty_spread(
        tasks=synthetic,
        count=3,
        rng=random.Random("calibration"),
    )
    difficulties = [item["difficulty"] for item in selected]
    assert difficulties == sorted(difficulties)
    assert difficulties[0] <= 0.20
    assert 0.45 <= difficulties[1] <= 0.55
    assert difficulties[2] >= 0.80

    actual = bank._select_tasks("B1_B2", "floently-calibration-contract")
    assert len(actual["reading"]) == 3
    assert len(actual["listening"]) == 2
    assert len(actual["writing"]) == 3
    assert len(actual["speaking"]) == 3

    for section_name in ("writing", "speaking"):
        values = [item.get("difficulty") for item in actual[section_name]]
        assert all(isinstance(value, (int, float)) for value in values), values
        assert values == sorted(values), values
        assert len(set(values)) >= 2, values

    repeated = bank._select_tasks("B1_B2", "floently-calibration-contract")
    assert [item["task_id"] for item in actual["writing"]] == [item["task_id"] for item in repeated["writing"]]
    assert [item["task_id"] for item in actual["speaking"]] == [item["task_id"] for item in repeated["speaking"]]

    print("YKI_REPORT_EVIDENCE_ISOLATION=PASS")
    print("YKI_REPORT_SUBJECTIVE_SCORE_CALIBRATION=PASS")
    print("YKI_REPORT_PREDICTED_GRADES=PASS")
    print("YKI_BANK_BALANCED_COUNTS=PASS")
    print("YKI_BANK_DIFFICULTY_SPREAD=PASS")
    print("YKI_REPORT_CALIBRATION_CONTRACT=PASS")


if __name__ == "__main__":
    main()
