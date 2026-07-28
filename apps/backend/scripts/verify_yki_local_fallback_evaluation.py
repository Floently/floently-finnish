from __future__ import annotations

import os

from app.runtime.yki_local_fallback import (
    build_local_yki_runtime,
    local_submit_response,
    normalize_local_runtime_for_client,
)
from app.services.yki_evaluation_service import (
    evaluate_yki_submission,
)


os.environ["OPENAI_EVALUATION_ENABLED"] = "0"

runtime = build_local_yki_runtime(
    user_id="verification-user",
    payload={
        "level_band": "B1_B2",
        "mode": "formal_exam_simulation",
    },
)

normalized = normalize_local_runtime_for_client(
    runtime
)

sections = normalized.get("sections")

assert isinstance(sections, list)
assert len(sections) == 4

expected_sections = [
    "reading",
    "listening",
    "writing",
    "speaking",
]

assert [
    section.get("section_type")
    for section in sections
] == expected_sections

for section in sections:
    assert isinstance(section.get("items"), list)
    assert "tasks" not in section

reading = sections[0]
listening = sections[1]
writing = sections[2]
speaking = sections[3]

assert reading["items"]
assert listening["items"]
assert writing["items"]
assert speaking["items"]

reading_item = reading["items"][0]
reading_question = reading_item["questions"][0]

listening_item = listening["items"][0]
listening_question = listening_item["questions"][0]

assert reading_question["options"]
assert listening_question["options"]
assert reading_question["question"]
assert listening_question["question"]

assert writing["items"][0]["prompt"]["instructions"]
assert speaking["items"][0]["prompt"]["instructions"]

objective_evidence = {
    (
        f"{reading_item['item_id']}:"
        f"{reading_question['answer_id']}"
    ): {
        "answer":
            reading_question["correct_index"],
    },
    (
        f"{listening_item['item_id']}:"
        f"{listening_question['answer_id']}"
    ): {
        "answer":
            listening_question["correct_index"],
    },
}

evidence = {
    "objective": objective_evidence,
    "writing": {
        "writing-verification": {
            "text": (
                "Kirjoitan tämän vastauksen suomeksi. "
                "Perustelen mielipiteeni kahdella selkeällä "
                "syyllä ja annan lopuksi käytännöllisen "
                "ehdotuksen tilanteen ratkaisemiseksi."
            ),
        },
    },
    "speaking": {
        "speaking-verification": {
            "transcript_text": (
                "Hei. Haluaisin selittää tilanteen ja "
                "ehdottaa ratkaisua. Minulle sopisi huominen "
                "iltapäivä, koska olen silloin vapaana."
            ),
            "duration_sec": 42,
            "audio_submitted": True,
        },
    },
}

submission = local_submit_response(
    session_id=runtime["session_id"],
    confirm_incomplete=True,
    runtime=runtime,
    evidence=evidence,
)

assert submission["score"]["reading"] == 1
assert submission["score"]["listening"] == 1
assert submission["score"]["overall"] == 2

report = evaluate_yki_submission(
    runtime=runtime,
    submission=submission,
    evidence=evidence,
)

assert report["officialResult"] is False
assert report["pronunciationAssessed"] is False

assert (
    report["objectiveScores"]["reading"]["score"]
    == 1.0
)

assert (
    report["objectiveScores"]["listening"]["score"]
    == 1.0
)

assert (
    report["sections"]["writing"]["status"]
    == "limited"
)

assert (
    report["sections"]["speaking"]["status"]
    == "limited"
)

assert (
    report["audioEvidenceAvailable"]
    is True
)

print(
    "YKI_LOCAL_FALLBACK_RUNTIME_AND_EVALUATION=PASS"
)
