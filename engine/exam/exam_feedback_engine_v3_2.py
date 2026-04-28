"""
==========================================================
YKI EXAM FEEDBACK ENGINE — V3.2
==========================================================
Generates simple exam feedback.
"""

def generate_feedback(score):

    feedback = {}

    for section, value in score.items():

        if section in {"writing", "speaking"}:
            level = "submitted" if value else "missing"
            feedback[section] = {
                "score": value,
                "evaluation": level
            }
            continue

        if value >= 8:
            level = "excellent"

        elif value >= 5:
            level = "good"

        elif value >= 3:
            level = "developing"

        else:
            level = "needs improvement"

        feedback[section] = {
            "score": value,
            "evaluation": level
        }

    return feedback
