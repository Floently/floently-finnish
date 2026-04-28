"""
==========================================================
YKI EXAM GENERATOR — V3.2
==========================================================

Deterministic exam assembler.

Uses the task index instead of scanning the canonical bank.

This keeps exam generation fast even with very large banks.

Constraints
-----------
- Must not run validators
- Must not run semantic engine
- Must preserve task schema validity
"""

import copy
import json
from hashlib import sha256
from pathlib import Path

from engine.tools.build_task_index_v3_2 import INDEX_PATH, ensure_task_index_v3_2


PRODUCTION_EXAM_BLUEPRINT = {
    "reading_mcq_set": 4,
    "listening_mcq_set": 4,
    "writing_prompt": 2,
    "speaking_roleplay": 2,
}

TEST_EXAM_BLUEPRINT = {
    "reading_mcq_set": 1,
    "listening_mcq_set": 1,
    "writing_prompt": 1,
    "speaking_roleplay": 1,
}

EXAM_BLUEPRINTS = {
    "production": PRODUCTION_EXAM_BLUEPRINT,
    "test": TEST_EXAM_BLUEPRINT,
}

TEST_SECTION_QUESTION_LIMITS = {
    "reading": 1,
    "listening": 1,
}


SKILL_TO_TASK_TYPES = {
    "reading": [
        "reading_mcq_set",
        "reading_true_false",
        "reading_mcq",
        "reading_short_answer",
        "reading_open_response",
        "reading_summary",
    ],

    "listening": [
        "listening_mcq_set",
        "listening_true_false",
        "listening_mcq",
    ],

    "writing": [
        "writing_prompt",
        "writing_email_formal",
        "writing_short_message",
    ],

    "speaking": [
        "speaking_roleplay",
        "speaking_monologue",
        "speaking_interview",
        "speaking_opinion_monologue",
    ],
}


def load_index():
    payload = ensure_task_index_v3_2(strict=False)
    runtime_index = payload.get("runtime_index")
    if isinstance(runtime_index, dict):
        return runtime_index
    if isinstance(payload, dict):
        return payload
    raise RuntimeError("Task index payload is malformed.")


def deterministic_select_paths(path_id_pairs, count, seed):

    if not path_id_pairs or count <= 0:
        return []

    normalized_seed = str(seed or "")
    sorted_pairs = sorted(
        path_id_pairs,
        key=lambda item: (
            sha256(f"{normalized_seed}::{item[1]}".encode("utf-8")).hexdigest(),
            item[1],
        ),
    )

    selected = sorted_pairs[:count]

    return [Path(p[0]) for p in selected]


def pick_paths_for_skill(index, level_band, skill, blueprint, seed):

    task_types = SKILL_TO_TASK_TYPES.get(skill, [])
    desired_total = sum(max(0, int(blueprint.get(task_type, 0))) for task_type in task_types)
    if desired_total <= 0:
        return []

    blueprint_types = [t for t in blueprint if t in task_types and int(blueprint[t]) > 0]

    ordered_types = blueprint_types + [
        t for t in task_types if t not in blueprint_types
    ]

    collected = []
    seen_ids = set()

    for task_type in ordered_types:

        if len(collected) >= desired_total:
            break

        pairs = [
            pair for pair in index.get(level_band, {}).get(task_type, [])
            if pair[1] not in seen_ids
        ]
        if not pairs:
            continue

        requested = int(blueprint.get(task_type, 0))
        need = requested if requested > 0 else desired_total - len(collected)

        selected = deterministic_select_paths(pairs, need, f"{seed}:{skill}:{task_type}")
        selected_paths = {str(path) for path in selected}

        collected.extend(selected)
        seen_ids.update(pair[1] for pair in pairs if pair[0] in selected_paths)

    return collected


def load_tasks(paths):

    tasks = []

    for path in paths:

        try:
            with open(path, "r", encoding="utf-8") as f:
                tasks.append(json.load(f))
        except Exception:
            continue

    return tasks


def _trim_task_questions(task, *, limit):
    if limit <= 0:
        return copy.deepcopy(task)

    trimmed = copy.deepcopy(task)
    content = trimmed.get("content")
    if isinstance(content, dict):
        if isinstance(content.get("questions"), list):
            content["questions"] = content["questions"][:limit]
        elif isinstance(content.get("items"), list):
            content["items"] = content["items"][:limit]

    if isinstance(trimmed.get("questions"), list):
        trimmed["questions"] = trimmed["questions"][:limit]
    elif isinstance(trimmed.get("items"), list):
        trimmed["items"] = trimmed["items"][:limit]
    return trimmed


def _reduce_exam_for_test_mode(exam):
    reduced = {
        "level_band": exam["level_band"],
        "reading": [],
        "listening": [],
        "writing": [],
        "speaking": [],
    }

    if exam["reading"]:
        reduced["reading"] = [
            _trim_task_questions(exam["reading"][0], limit=TEST_SECTION_QUESTION_LIMITS["reading"])
        ]
    if exam["listening"]:
        reduced["listening"] = [
            _trim_task_questions(exam["listening"][0], limit=TEST_SECTION_QUESTION_LIMITS["listening"])
        ]
    if exam["writing"]:
        reduced["writing"] = [copy.deepcopy(exam["writing"][0])]
    if exam["speaking"]:
        reduced["speaking"] = [copy.deepcopy(exam["speaking"][0])]

    return reduced


def generate_exam(level_band="B1_B2", mode="production", seed=None):

    index = load_index()
    normalized_mode = "test" if mode == "test" else "production"
    blueprint = EXAM_BLUEPRINTS[normalized_mode]
    deterministic_seed = str(seed or f"{level_band}:{normalized_mode}")

    exam = {
        "level_band": level_band,
        "reading": [],
        "listening": [],
        "writing": [],
        "speaking": [],
    }

    reading_paths = pick_paths_for_skill(
        index,
        level_band,
        "reading",
        blueprint,
        deterministic_seed,
    )

    listening_paths = pick_paths_for_skill(
        index,
        level_band,
        "listening",
        blueprint,
        deterministic_seed,
    )

    writing_paths = pick_paths_for_skill(
        index,
        level_band,
        "writing",
        blueprint,
        deterministic_seed,
    )

    speaking_paths = pick_paths_for_skill(
        index,
        level_band,
        "speaking",
        blueprint,
        deterministic_seed,
    )

    exam["reading"] = load_tasks(reading_paths)
    exam["listening"] = load_tasks(listening_paths)
    exam["writing"] = load_tasks(writing_paths)
    exam["speaking"] = load_tasks(speaking_paths)

    if normalized_mode == "test":
        exam = _reduce_exam_for_test_mode(exam)

    expected_counts = {
        "reading": blueprint["reading_mcq_set"],
        "listening": blueprint["listening_mcq_set"],
        "writing": blueprint["writing_prompt"],
        "speaking": blueprint["speaking_roleplay"],
    }
    for section, expected in expected_counts.items():
        actual = len(exam[section])
        if actual < expected:
            raise RuntimeError(
                f"Insufficient indexed tasks for {level_band} {section}: "
                f"{actual}/{expected} available."
            )

    return exam


if __name__ == "__main__":

    exam = generate_exam("B1_B2")

    print("Exam generated:")
    print("Reading:", len(exam["reading"]))
    print("Listening:", len(exam["listening"]))
    print("Writing:", len(exam["writing"]))
    print("Speaking:", len(exam["speaking"]))
