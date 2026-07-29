from __future__ import annotations

import json
import os
from typing import Any

from app.services import yki_evaluation_service as svc


def section(
    *,
    level: str,
    evidence: list[str],
    correction_original: str | None,
) -> dict[str, Any]:
    corrections = []

    if correction_original is not None:
        corrections.append(
            {
                "original": correction_original,
                "corrected": "Tämä on korjattu suomalainen ilmaus.",
                "explanation": "The original expression needs a clearer grammatical form.",
            }
        )

    return {
        "status": "assessed",
        "estimated_level": level,
        "score_available": False,
        "score": 0,
        "summary": "The learner communicates relevant ideas with developing control.",
        "evidence": evidence,
        "criteria": [
            {
                "name": "Task fulfilment",
                "score": 3,
                "score_max": 5,
                "rationale": "The response addresses the main communicative purpose.",
                "evidence": evidence[:1],
            }
        ],
        "corrections": corrections,
        "improvements": [
            "Use more precise vocabulary and connect supporting details more clearly."
        ],
    }


payload = {
    "writing_responses": [
        {
            "task_id": "w1",
            "text": "Hei. Bussi oli myöhässä ja myöhästyin työstä. Toivon, että aikataulu tarkistetaan pian.",
        },
        {
            "task_id": "w2",
            "text": "Minun mielestäni kirjasto on tärkeä, koska siellä voi opiskella rauhassa ja tavata muita ihmisiä.",
        },
    ],
    "speaking_transcripts": [
        "Minusta bussiliikenne on tärkeä työmatkoilla, mutta vuorojen pitäisi olla täsmällisempiä.",
        "Kirjastossa minä voin lukea, opiskella ja käyttää tietokonetta ilman lisämaksua.",
    ],
}

raw = {
    "overall_estimated_level": "B1",
    "confidence": 0.78,
    "overall_summary": "The learner demonstrates functional communication with clear development priorities.",
    "sections": {
        "reading": section(
            level="A2",
            evidence=["Objective evidence supplied by the engine."],
            correction_original=None,
        ),
        "listening": section(
            level="A2",
            evidence=["Objective evidence supplied by the engine."],
            correction_original=None,
        ),
        "writing": section(
            level="B1",
            evidence=[
                "The learner explains a bus delay.",
                "The learner values the library.",
            ],
            correction_original="A paraphrased sentence that is not present.",
        ),
        "speaking": section(
            level="B1",
            evidence=[
                "The learner discusses public transport.",
                "The learner describes library use.",
            ],
            correction_original="Another paraphrase that is not present.",
        ),
    },
    "strengths": ["Communicates relevant ideas."],
    "improvements": ["Develop grammatical accuracy."],
    "action_plan": [],
}

normalized = svc._normalise_ai_report(raw, payload)
assert normalized is not None
assert len(normalized["actionPlan"]) == 3

for section_name in ("writing", "speaking"):
    sources = svc._section_source_texts(payload, section_name)
    result = normalized["sections"][section_name]
    assert len(result["evidence"]) >= 2, result
    assert all(
        svc._is_verbatim_excerpt(item, sources)
        for item in result["evidence"]
    ), result
    assert result["corrections"] == [], result
    assert result["criteria"], result
    assert all(
        0 <= float(item["score"]) <= 5
        and float(item["scoreMax"]) == 5
        for item in result["criteria"]
    )
    assert all(
        all(
            svc._is_verbatim_excerpt(evidence, sources)
            for evidence in item["evidence"]
        )
        for item in result["criteria"]
    )

exact = json.loads(json.dumps(raw))
exact["sections"]["writing"]["evidence"] = [
    "Bussi oli myöhässä",
    "kirjasto on tärkeä",
]
exact["sections"]["writing"]["corrections"] = [
    {
        "original": "Minun mielestäni kirjasto on tärkeä",
        "corrected": "Mielestäni kirjasto on tärkeä",
        "explanation": "The shorter construction is more idiomatic Finnish.",
    }
]
exact["sections"]["speaking"]["evidence"] = [
    "bussiliikenne on tärkeä",
    "Kirjastossa minä voin lukea",
]
exact["sections"]["speaking"]["corrections"] = [
    {
        "original": "Kirjastossa minä voin lukea",
        "corrected": "Kirjastossa voin lukea",
        "explanation": "The explicit pronoun is unnecessary in this neutral context.",
    }
]
exact["action_plan"] = [
    "Review one objective section.",
    "Rewrite one response.",
    "Repeat one speaking task.",
]

exact_normalized = svc._normalise_ai_report(exact, payload)
assert exact_normalized is not None
assert len(exact_normalized["sections"]["writing"]["corrections"]) == 1
assert len(exact_normalized["sections"]["speaking"]["corrections"]) == 1

original_urlopen = svc.urllib.request.urlopen
calls = {"count": 0}


class FakeResponse:
    def __init__(self, response_payload: dict[str, Any]) -> None:
        self._payload = response_payload

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: Any) -> None:
        return None

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")


def fake_urlopen(request: Any, timeout: int) -> FakeResponse:
    del request, timeout
    calls["count"] += 1
    body = {"sections": {}} if calls["count"] == 1 else exact
    return FakeResponse(
        {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(body),
                    }
                }
            ]
        }
    )


os.environ["OPENAI_EVALUATION_ENABLED"] = "true"
os.environ["OPENAI_API_KEY"] = "test-key-not-used"
os.environ["OPENAI_EVALUATION_MODEL"] = "test-model"
svc.urllib.request.urlopen = fake_urlopen

try:
    replay, model = svc._openai_report(payload)
finally:
    svc.urllib.request.urlopen = original_urlopen

assert calls["count"] == 2, calls
assert replay is not None
assert model == "test-model"

print("YKI_REGRESSION_GROUNDED_SALVAGE=PASS")
print("YKI_REGRESSION_EXACT_CORRECTIONS=PASS")
print("YKI_REGRESSION_RETRY_CONTRACT=PASS")
