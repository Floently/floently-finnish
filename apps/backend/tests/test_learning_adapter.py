from app.services.learning.adapter import answer_learning_lesson, get_learning_system_state


def test_learning_system_state_has_levels():
    payload = get_learning_system_state("demo-user")
    assert "levels" in payload
    assert payload["levels"]


def test_answer_learning_lesson_returns_correctness():
    result = answer_learning_lesson(
        module_id="module-a1-routines",
        lesson_id="lesson-a1-present-routines",
        exercise_id="exercise-a1-routines-1",
        answer="opiskelen",
    )
    assert result["correct"] is True
