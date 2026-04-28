"""
==========================================================
YKI EXAM SCORING ENGINE — V3.2
==========================================================
Evaluates exam answers.
"""

from __future__ import annotations

from engine.exam.speaking_controller import speaking_answered


OBJECTIVE_SECTIONS = ("reading", "listening")


def build_answer_id(task_id, question_index):
    return f"{task_id}_{question_index}"


def extract_task_questions(task):
    content = task.get("content")
    if not isinstance(content, dict):
        content = {}

    nested_content = content.get("content")
    if not isinstance(nested_content, dict):
        nested_content = {}

    candidates = (
        task.get("questions"),
        task.get("items"),
        content.get("questions"),
        content.get("items"),
        nested_content.get("questions"),
        nested_content.get("items"),
    )

    for candidate in candidates:
        if isinstance(candidate, list):
            return candidate

    return []


def get_objective_answer_map(exam):
    answer_map = {}

    for section in OBJECTIVE_SECTIONS:
        for task in exam.get(section, []):
            task_id = task.get("id")
            if not task_id:
                continue

            for question_index, question in enumerate(extract_task_questions(task)):
                answer_map[build_answer_id(task_id, question_index)] = {
                    "section": section,
                    "task_id": task_id,
                    "question_index": question_index,
                    "correct_answer": _extract_correct_answer(question),
                }

    return answer_map


def count_total_questions(exam):
    total = 0

    for section in OBJECTIVE_SECTIONS:
        for task in exam.get(section, []):
            total += len(extract_task_questions(task))

    total += sum(1 for task in exam.get("writing", []) if task.get("id"))
    total += sum(1 for task in exam.get("speaking", []) if task.get("id"))
    return total


def count_answered_questions(session):
    exam = session.get("exam", {})
    answers = session.get("answers", {})
    writing_answers = session.get("writing_answers", {})
    answer_map = get_objective_answer_map(exam)
    answered = sum(1 for answer_id in answer_map if answer_id in answers)
    answered += sum(
        1
        for task in exam.get("writing", [])
        if task.get("id") and writing_answers.get(task["id"])
    )
    answered += sum(
        1
        for task in exam.get("speaking", [])
        if task.get("id") and speaking_answered(session, task)
    )
    return answered


def _extract_correct_answer(question):
    for key in (
        "correct_index",
        "correctIndex",
        "correctBoolean",
        "correct_answer",
        "correctAnswer",
    ):
        if key in question:
            return question.get(key)
    return None


def _coerce_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "t", "1", "yes", "o"}:
            return True
        if normalized in {"false", "f", "0", "no", "v"}:
            return False
    return None


def _coerce_int(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.lstrip("-").isdigit():
            return int(stripped)
    return None


def _answers_match(user_answer, correct_answer):
    if isinstance(correct_answer, bool):
        return _coerce_bool(user_answer) is correct_answer

    if isinstance(correct_answer, int):
        return _coerce_int(user_answer) == correct_answer

    return user_answer == correct_answer


def score_exam(session):

    exam = session["exam"]
    answers = session.get("answers", {})
    writing_answers = session.get("writing_answers", {})
    result = {
        "reading": 0,
        "listening": 0,
        "writing": 0,
        "speaking": 0,
    }

    for answer_id, metadata in get_objective_answer_map(exam).items():
        correct = metadata.get("correct_answer")
        if correct is None:
            continue

        user = answers.get(answer_id)
        if _answers_match(user, correct):
            result[metadata["section"]] += 1

    result["writing"] = sum(
        1
        for task in exam.get("writing", [])
        if task.get("id") and writing_answers.get(task["id"])
    )
    result["speaking"] = sum(
        1
        for task in exam.get("speaking", [])
        if task.get("id") and speaking_answered(session, task)
    )
    result["total"] = (
        result["reading"] +
        result["listening"] +
        result["writing"] +
        result["speaking"]
    )

    return result


def estimate_cefr(total_score, max_score):
    if max_score <= 0:
        return "A1"

    ratio = max(0.0, min(float(total_score) / float(max_score), 1.0))

    if ratio <= 0.2:
        return "A1"
    if ratio <= 0.4:
        return "A2"
    if ratio <= 0.6:
        return "B1"
    if ratio <= 0.8:
        return "B2"
    return "C1"
