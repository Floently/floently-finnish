#!/usr/bin/env python3
# ==========================================================
# YKI VALIDATOR BACKTEST HARNESS — V3.2
#
# Deterministic. Read-only. No engine mutation.
# Generates minimal valid and targeted failing fixtures
# for all structural and blueprint constraint paths.
#
# Run: python -m engine.validator.backtest_validator_v3_2
# ==========================================================

import copy
import sys
from typing import Any, Dict, List, Tuple

from engine.validator.task_validator_v3_2 import validate_task_v3_2


# ------------------------------------------------------------------
# Minimal valid fixture builders
# ------------------------------------------------------------------

_BASE_ROOT: Dict[str, Any] = {
    "id": "00000000-0000-0000-0000-000000000001",
    "version": "3.2.0",
    "level_band": "A1_A2",
    "difficulty": 0.500,
    "language": "fi",
    "source": {
        "origin": "backtest",
        "generator": None,
        "generated_at": None,
    },
    "quality": {
        "certification": {
            "status": "uncertified",
            "certified_at": None,
            "certified_by": None,
        }
    },
}

_MCQ_QUESTION: Dict[str, Any] = {
    "id": "00000000-0000-0000-0000-000000000010",
    "prompt": "Test question?",
    "options": ["Option A", "Option B"],
    "correct_index": 0,
}


def _reading_valid() -> Dict[str, Any]:
    return {
        **copy.deepcopy(_BASE_ROOT),
        "task_type": "reading_mcq_set",
        "skill": "reading",
        "content": {
            "instruction": "Read the text.",
            "materials": {
                "text": "Hello world today",
                "word_count": 3,
            },
            "questions": [
                {**_MCQ_QUESTION, "id": f"00000000-0000-0000-0000-00000000001{i}"}
                for i in range(3)
            ],
            "timing": {"recommended_minutes": 10},
        },
    }


def _listening_valid() -> Dict[str, Any]:
    return {
        **copy.deepcopy(_BASE_ROOT),
        "task_type": "listening_mcq_set",
        "skill": "listening",
        "content": {
            "instruction": "Listen to the audio.",
            "materials": {
                "transcript": "Hello world today",
                "audio_asset_id": "00000000-0000-0000-0000-000000000099",
            },
            "questions": [
                {**_MCQ_QUESTION, "id": f"00000000-0000-0000-0000-00000000001{i}"}
                for i in range(3)
            ],
            "timing": {"recommended_minutes": 10},
        },
    }


def _writing_valid() -> Dict[str, Any]:
    return {
        **copy.deepcopy(_BASE_ROOT),
        "task_type": "writing_prompt",
        "skill": "writing",
        "content": {
            "instruction": "Write a response.",
            "materials": {"scenario": "You are writing a formal letter."},
            "items": [
                {
                    "id": "00000000-0000-0000-0000-000000000020",
                    "prompt": "Write about your daily routine.",
                },
            ],
            "rubric": "Grade on clarity and coherence.",
            "timing": {"recommended_minutes": 20},
        },
    }


def _speaking_valid() -> Dict[str, Any]:
    return {
        **copy.deepcopy(_BASE_ROOT),
        "task_type": "speaking_roleplay",
        "skill": "speaking",
        "content": {
            "instruction": "Perform the roleplay.",
            "materials": {
                "roles": {
                    "user": "Customer",
                    "partner": "Shopkeeper",
                },
            },
            "items": [
                {
                    "id": "00000000-0000-0000-0000-000000000030",
                    "ai_first_turn_fi": "Hei, voinko auttaa?",
                },
            ],
            "rubric": "Grade on fluency and vocabulary.",
            "timing": {"recommended_minutes": 5},
        },
    }


# ------------------------------------------------------------------
# Test runner
# ------------------------------------------------------------------

_results: List[Tuple[str, bool]] = []


def _run(
    name: str,
    raw: Dict[str, Any],
    expect_structural: bool,
    expect_blueprint: bool,
) -> None:
    result = validate_task_v3_2(raw)
    passed = (
        result.structural_pass == expect_structural
        and result.blueprint_pass == expect_blueprint
    )
    _results.append((name, passed))
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {name}")
    print(f"       structural_pass={result.structural_pass}  (expected {expect_structural})")
    print(f"       blueprint_pass={result.blueprint_pass}    (expected {expect_blueprint})")
    for e in result.structural_errors:
        print(f"       structural_error: {e}")
    for e in result.blueprint_errors:
        print(f"       blueprint_error:  {e}")
    print()


# ------------------------------------------------------------------
# Test suite
# ------------------------------------------------------------------

def run_backtest() -> None:
    print("=" * 60)
    print("YKI VALIDATOR BACKTEST — V3.2")
    print("=" * 60)
    print()

    # ----------------------------------------------------------------
    # Valid fixtures — all four task types must pass both layers
    # ----------------------------------------------------------------

    _run("valid: reading_mcq_set",   _reading_valid(),   True, True)
    _run("valid: listening_mcq_set", _listening_valid(), True, True)
    _run("valid: writing_prompt",    _writing_valid(),   True, True)
    _run("valid: speaking_roleplay", _speaking_valid(),  True, True)

    # ----------------------------------------------------------------
    # questions_min_count violation
    # reading requires >= 3 questions; supply 2 → Layer 2 failure
    # ----------------------------------------------------------------

    task = _reading_valid()
    task["content"]["questions"] = task["content"]["questions"][:2]
    _run("fail: questions_min_count", task, False, False)

    # ----------------------------------------------------------------
    # options_min_count_per_question violation
    # each question requires >= 2 options; supply 1 → Layer 2 failure
    # ----------------------------------------------------------------

    task = _reading_valid()
    for q in task["content"]["questions"]:
        q["options"] = ["Only option"]
        q["correct_index"] = 0
    _run("fail: options_min_count_per_question", task, False, False)

    # ----------------------------------------------------------------
    # correct_index out of bounds
    # 2 options (indices 0-1); correct_index=5 → Layer 2 failure
    # ----------------------------------------------------------------

    task = _reading_valid()
    task["content"]["questions"][0]["correct_index"] = 5
    _run("fail: correct_index_out_of_bounds", task, False, False)

    # ----------------------------------------------------------------
    # transcript empty
    # listening requires non-empty transcript; supply whitespace → Layer 2 failure
    # ----------------------------------------------------------------

    task = _listening_valid()
    task["content"]["materials"]["transcript"] = "   "
    _run("fail: transcript_empty", task, False, False)

    # ----------------------------------------------------------------
    # word_count mismatch
    # text has 3 words; word_count=99 → Layer 2 failure
    # ----------------------------------------------------------------

    task = _reading_valid()
    task["content"]["materials"]["word_count"] = 99
    _run("fail: word_count_mismatch", task, False, False)

    # ----------------------------------------------------------------
    # difficulty precision violation
    # 0.12345 has 5 decimal places; max allowed is 3 → Layer 3 failure
    # Pydantic accepts float, so structural_pass=True.
    # ----------------------------------------------------------------

    task = _reading_valid()
    task["difficulty"] = 0.12345
    _run("fail: difficulty_precision", task, True, False)

    # ----------------------------------------------------------------
    # level_band invalid literal
    # "X1_X2" is not in Literal["A1_A2","B1_B2","C1_C2"] →
    # Pydantic (Layer 1) rejects → structural_pass=False
    # ----------------------------------------------------------------

    task = _reading_valid()
    task["level_band"] = "X1_X2"
    _run("fail: level_band_invalid", task, False, False)

    # ----------------------------------------------------------------
    # skill–task_type mismatch
    # ReadingMCQSetModel enforces skill: Literal["reading"];
    # passing "listening" → Pydantic (Layer 1) rejects → structural_pass=False
    # ----------------------------------------------------------------

    task = _reading_valid()
    task["skill"] = "listening"
    _run("fail: skill_task_type_mismatch", task, False, False)

    # ----------------------------------------------------------------
    # Summary
    # ----------------------------------------------------------------

    total = len(_results)
    passed = sum(1 for _, ok in _results if ok)
    failed = total - passed

    print("=" * 60)
    print(f"RESULTS: {passed}/{total} passed  |  {failed} failed")
    print("=" * 60)

    if failed > 0:
        print()
        print("FAILED CASES:")
        for name, ok in _results:
            if not ok:
                print(f"  - {name}")
        sys.exit(1)


if __name__ == "__main__":
    run_backtest()
