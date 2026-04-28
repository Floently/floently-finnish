from typing import Any, Dict

def validate_reverse_answer(user_input: str, expected: Dict[str, Any]) -> Dict[str, Any]:
    """
    Lightweight donor validator for reverse-production cards.
    This is still heuristic, but it is safer than the original version:
    it tolerates missing keys and gives structured feedback.
    """
    cleaned = user_input.strip().lower()
    correct_form = str(expected.get("correct_form", "")).strip().lower()
    base_verb = str(expected.get("base_verb", "")).strip()
    object_form = str(expected.get("object", "")).strip().lower()

    verb_ok = bool(correct_form) and correct_form in cleaned
    object_ok = bool(object_form) and object_form in cleaned

    score = 0.0
    feedback = []

    if verb_ok:
        score += 0.5
        feedback.append("✔ verb is correct")
    else:
        if correct_form:
            feedback.append(f"✘ verb is incorrect (expected: {base_verb} → {correct_form})")
        else:
            feedback.append("✘ verb target missing from expected payload")

    if object_ok:
        score += 0.5
        feedback.append("✔ case usage is correct")
    else:
        if object_form:
            feedback.append(f"✘ object/case incorrect (expected: {object_form})")
        else:
            feedback.append("✘ object target missing from expected payload")

    return {
        "valid": score == 1.0,
        "score": round(score, 2),
        "feedback": feedback,
    }
