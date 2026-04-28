from __future__ import annotations

from hashlib import sha256
import json

from .system_models import LearningExercise, LearningItem, LearningLesson, LearningSystemLevel, LearningSystemModule


def _deterministic_hash(payload: dict) -> str:
    return sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _exercise(*, exercise_id: str, title: str, prompt: str, input_mode: str, options: list[str], expected_answer: str, explanation: str) -> LearningExercise:
    return LearningExercise(
        id=exercise_id,
        title=title,
        prompt=prompt,
        input_mode=input_mode,
        options=options,
        expected_answer=expected_answer,
        explanation=explanation,
        deterministic_key=_deterministic_hash({
            "exercise_id": exercise_id,
            "expected_answer": expected_answer,
            "input_mode": input_mode,
            "options": options,
            "prompt": prompt,
            "title": title,
        }),
    )


LEARNING_LEVELS = [
    LearningSystemLevel(
        id="level-a1-foundations",
        title="Foundations",
        cefr="A1",
        description="Build stable everyday Finnish for routines, identity, and basic questions.",
        modules=[
            LearningSystemModule(
                id="module-a1-routines",
                title="Daily Routines",
                description="Present-tense routines and time anchors for simple daily answers.",
                level_id="level-a1-foundations",
                level_label="A1",
                lessons=[
                    LearningLesson(
                        id="lesson-a1-present-routines",
                        title="Present tense for routines",
                        summary="Describe what you do every day with clear present-tense verbs.",
                        explanation="Finnish uses the present tense for routines, habits, and actions that are true now.",
                        examples=["Mina asun Espoossa ja opiskelen suomea iltaisin."],
                        items=[LearningItem(id="a1-routines-item-1", label="Focus", value="Match the verb ending to the subject.")],
                        exercises=[
                            _exercise(
                                exercise_id="exercise-a1-routines-1",
                                title="Verb form check",
                                prompt="Complete the sentence: Mina ___ suomea joka paiva.",
                                input_mode="text",
                                options=[],
                                expected_answer="opiskelen",
                                explanation="'Opiskelen' matches the first-person singular subject 'mina'.",
                            )
                        ],
                    )
                ],
            )
        ],
    ),
    LearningSystemLevel(
        id="level-a2-navigation",
        title="Navigation",
        cefr="A2",
        description="Handle directions and service interactions with location language.",
        modules=[
            LearningSystemModule(
                id="module-a2-places",
                title="Places and Directions",
                description="Use place words, local cases, and polite service questions.",
                level_id="level-a2-navigation",
                level_label="A2",
                lessons=[
                    LearningLesson(
                        id="lesson-a2-local-cases",
                        title="Local cases for place",
                        summary="Talk about where something is and where someone goes.",
                        explanation="Local cases help you show location and movement.",
                        examples=["Kirjasto on aseman lahella."],
                        items=[LearningItem(id="a2-local-item-1", label="Location", value="asemalla means at the station")],
                        exercises=[
                            _exercise(
                                exercise_id="exercise-a2-local-1",
                                title="Select the best answer",
                                prompt="Choose the best question for finding a place.",
                                input_mode="choice",
                                options=["Missa asema on?", "Mina asema olen?", "Asema missa menee?"],
                                expected_answer="Missa asema on?",
                                explanation="This is the natural question for asking where the station is.",
                            )
                        ],
                    )
                ],
            )
        ],
    ),
    LearningSystemLevel(
        id="level-b1-work",
        title="Work and Study",
        cefr="B1",
        description="Give clearer requests and explanations in work or study settings.",
        modules=[
            LearningSystemModule(
                id="module-b1-requests",
                title="Requests and Explanations",
                description="Write or say clear schedule requests with reasons and outcomes.",
                level_id="level-b1-work",
                level_label="B1",
                lessons=[
                    LearningLesson(
                        id="lesson-b1-email-request",
                        title="Simple email request",
                        summary="Make a request, give a reason, and propose the next step.",
                        explanation="A useful work message has three parts: request, reason, next step.",
                        examples=["Voinko siirtaa kokousta huomiseen, koska olen laakarissa?"],
                        items=[LearningItem(id="b1-email-item-1", label="Request", value="Voinko siirtaa kokousta huomiseen?")],
                        exercises=[
                            _exercise(
                                exercise_id="exercise-b1-email-1",
                                title="Reason connector",
                                prompt="Choose the best connector: Tarvitsen uuden ajan, ___ olen poissa aamulla.",
                                input_mode="choice",
                                options=["koska", "mutta", "joskus"],
                                expected_answer="koska",
                                explanation="'Koska' introduces the reason.",
                            )
                        ],
                    )
                ],
            )
        ],
    ),
]
