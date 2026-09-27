from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any


_LOG = logging.getLogger("floently.roleplay.evaluation")

REPORT_VERSION = "1.0"
PROMPT_VERSION = "roleplay-deep-evaluation-v1"
RUBRIC_VERSION = "floently-roleplay-yki-aligned-v1"

DISCLAIMER = (
    "AI-estimated practice feedback. This is not an official YKI result, "
    "grade, or certificate."
)

_CRITERION_IDS = (
    "task_fulfilment",
    "interaction",
    "coherence",
    "grammar",
    "vocabulary",
    "register",
)

_CRITERION_NAMES = {
    "task_fulfilment": "Task fulfilment",
    "interaction": "Interaction and responsiveness",
    "coherence": "Coherence and clarity",
    "grammar": "Grammar and structures",
    "vocabulary": "Vocabulary and phrase range",
    "register": "Register and appropriateness",
}

_ALLOWED_LEVELS = (
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
    "insufficient_evidence",
)

_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "estimated_level": {
            "type": "string",
            "enum": list(_ALLOWED_LEVELS),
        },
        "confidence": {
            "type": "number",
        },
        "overall_summary": {
            "type": "string",
        },
        "criteria": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "id": {
                        "type": "string",
                        "enum": list(_CRITERION_IDS),
                    },
                    "name": {
                        "type": "string",
                    },
                    "score": {
                        "type": "number",
                    },
                    "level": {
                        "type": "string",
                        "enum": list(_ALLOWED_LEVELS),
                    },
                    "rationale": {
                        "type": "string",
                    },
                    "evidence": {
                        "type": "array",
                        "items": {
                            "type": "string",
                        },
                    },
                },
                "required": [
                    "id",
                    "name",
                    "score",
                    "level",
                    "rationale",
                    "evidence",
                ],
            },
        },
        "strengths": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "improvements": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "corrections": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "original": {
                        "type": "string",
                    },
                    "corrected": {
                        "type": "string",
                    },
                    "explanation": {
                        "type": "string",
                    },
                },
                "required": [
                    "original",
                    "corrected",
                    "explanation",
                ],
            },
        },
        "action_plan": {
            "type": "array",
            "description": (
                "Return exactly three concrete, non-duplicate "
                "practice actions for the learner."
            ),
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "estimated_level",
        "confidence",
        "overall_summary",
        "criteria",
        "strengths",
        "improvements",
        "corrections",
        "action_plan",
    ],
}


def _env_bool(
    name: str,
    default: bool = False,
) -> bool:
    raw = os.environ.get(name)

    if raw is None:
        return default

    return raw.strip().lower() not in {
        "0",
        "false",
        "no",
        "off",
        "",
    }


def _trim(
    value: Any,
    limit: int,
) -> str:
    text = " ".join(
        str(value or "")
        .strip()
        .split()
    )

    if len(text) <= limit:
        return text

    return text[: limit - 1].rstrip() + "…"


def _safe_strings(
    value: Any,
    limit: int,
    item_limit: int = 500,
) -> list[str]:
    if not isinstance(value, list):
        return []

    result: list[str] = []

    for item in value:
        text = _trim(
            item,
            item_limit,
        )

        if text and text not in result:
            result.append(text)

        if len(result) >= limit:
            break

    return result


def _bounded_number(
    value: Any,
    low: float,
    high: float,
    default: float,
) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default

    return max(
        low,
        min(
            high,
            number,
        ),
    )


def _normalize_level(
    value: Any,
) -> str:
    candidate = (
        str(value or "")
        .strip()
        .upper()
        .replace("_", "-")
    )

    if candidate in {
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2",
    }:
        return candidate

    if candidate in {
        "A1-A2",
        "A1/A2",
    }:
        return "A2"

    if candidate in {
        "B1-B2",
        "B1/B2",
    }:
        return "B1"

    if candidate in {
        "C1-C2",
        "C1/C2",
    }:
        return "C1"

    return "insufficient_evidence"


def _normalise_ai_payload(
    data: Any,
) -> dict[str, Any] | None:
    if not isinstance(
        data,
        dict,
    ):
        return None

    raw_criteria = data.get(
        "criteria",
    )

    if not isinstance(
        raw_criteria,
        list,
    ):
        return None

    criteria_by_id: dict[str, dict[str, Any]] = {}

    for item in raw_criteria:
        if not isinstance(
            item,
            dict,
        ):
            continue

        criterion_id = str(
            item.get("id")
            or ""
        ).strip()

        if (
            criterion_id not in _CRITERION_IDS
            or criterion_id in criteria_by_id
        ):
            continue

        criteria_by_id[criterion_id] = {
            "id": criterion_id,
            "name": _trim(
                item.get("name")
                or _CRITERION_NAMES[criterion_id],
                120,
            ),
            "score": round(
                _bounded_number(
                    item.get("score"),
                    0,
                    100,
                    0,
                ),
                1,
            ),
            "level": _normalize_level(
                item.get("level"),
            ),
            "rationale": _trim(
                item.get("rationale"),
                900,
            ),
            "evidence": _safe_strings(
                item.get("evidence"),
                4,
            ),
        }

    if any(
        criterion_id not in criteria_by_id
        for criterion_id in _CRITERION_IDS
    ):
        return None

    corrections: list[dict[str, str]] = []

    for item in data.get("corrections") or []:
        if not isinstance(
            item,
            dict,
        ):
            continue

        original = _trim(
            item.get("original"),
            300,
        )

        corrected = _trim(
            item.get("corrected"),
            300,
        )

        explanation = _trim(
            item.get("explanation"),
            500,
        )

        if (
            original
            and corrected
            and explanation
        ):
            corrections.append(
                {
                    "original": original,
                    "corrected": corrected,
                    "explanation": explanation,
                }
            )

        if len(corrections) >= 8:
            break

    improvements = _safe_strings(
        data.get("improvements"),
        6,
    )

    action_plan = _safe_strings(
        data.get("action_plan"),
        5,
    )

    # Preserve at least two genuine AI-generated actions. When the
    # otherwise valid structured report contains exactly two actions,
    # add one deterministic evidence-based review step rather than
    # discarding the entire detailed evaluation.
    if len(action_plan) < 2:
        return None

    if len(action_plan) == 2:
        if improvements:
            third_action = (
                "Repeat the mission and review this focus: "
                + improvements[0]
            )
        else:
            third_action = (
                "Repeat the same mission, compare the new transcript "
                "with this report, and note one concrete improvement."
            )

        third_action = _trim(
            third_action,
            500,
        )

        if third_action in action_plan:
            third_action = (
                "Repeat the same mission after 48 hours and compare "
                "task fulfilment, clarity, and language range."
            )

        action_plan.append(
            third_action,
        )

    if len(action_plan) < 3:
        return None

    return {
        "estimatedLevel": _normalize_level(
            data.get("estimated_level"),
        ),
        "confidence": round(
            _bounded_number(
                data.get("confidence"),
                0,
                1,
                0.35,
            ),
            2,
        ),
        "overallSummary": _trim(
            data.get("overall_summary"),
            1200,
        ),
        "criteria": [
            criteria_by_id[item]
            for item in _CRITERION_IDS
        ],
        "strengths": _safe_strings(
            data.get("strengths"),
            6,
        ),
        "improvements": improvements,
        "corrections": corrections,
        "actionPlan": action_plan,
    }


def _openai_evaluation(
    payload: dict[str, Any],
) -> tuple[dict[str, Any] | None, str | None]:
    if not _env_bool(
        "OPENAI_EVALUATION_ENABLED",
        False,
    ):
        return None, None

    api_key = str(
        os.environ.get("OPENAI_API_KEY")
        or ""
    ).strip()

    if not api_key:
        return None, None

    model = str(
        os.environ.get("OPENAI_EVALUATION_MODEL")
        or os.environ.get("OPENAI_ROLEPLAY_MODEL")
        or "gpt-4o-mini"
    ).strip()

    timeout = int(
        os.environ.get(
            "OPENAI_EVALUATION_TIMEOUT",
            "45",
        )
        or "45"
    )

    max_tokens = int(
        os.environ.get(
            "OPENAI_EVALUATION_MAX_TOKENS",
            "1800",
        )
        or "1800"
    )

    system_prompt = (
        "You are Floently's Finnish-language practice assessor. "
        "Evaluate only the learner's Finnish turns against the supplied "
        "roleplay mission and target CEFR band. Use concrete quoted evidence. "
        "Separate task fulfilment, interaction, coherence, grammar, vocabulary, "
        "and register. Do not reward mere length, invent errors, or invent "
        "evidence. Do not assess pronunciation, accent, acoustic fluency, or "
        "voice quality because no audio is supplied. The level is an "
        "AI-estimated practice level, never an official YKI result. "
        "Return only the required structured output. "
        "action_plan must contain exactly three concrete, "
        "non-duplicate practice steps."
    )

    request_payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": json.dumps(
                    payload,
                    ensure_ascii=False,
                ),
            },
        ],
        "temperature": 0.1,
        "max_tokens": max_tokens,
        "store": False,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "floently_roleplay_evaluation",
                "strict": True,
                "schema": _OUTPUT_SCHEMA,
            },
        },
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(
            request_payload,
        ).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=timeout,
        ) as response:
            response_data = json.loads(
                response
                .read()
                .decode("utf-8")
            )

        content = (
            response_data["choices"][0]
            ["message"]["content"]
        )

        parsed = json.loads(
            content,
        )

        return (
            _normalise_ai_payload(
                parsed,
            ),
            model,
        )

    except urllib.error.HTTPError as exc:
        error_type = "http_error"
        error_message = str(
            getattr(exc, "reason", "") or exc
        )

        try:
            raw_error = exc.read().decode(
                "utf-8",
                errors="replace",
            )

            parsed_error = json.loads(raw_error)

            api_error = (
                parsed_error.get("error")
                if isinstance(parsed_error, dict)
                else None
            )

            if isinstance(api_error, dict):
                error_type = str(
                    api_error.get("type")
                    or api_error.get("code")
                    or error_type
                )

                error_message = str(
                    api_error.get("message")
                    or error_message
                )

        except (
            OSError,
            TypeError,
            ValueError,
            json.JSONDecodeError,
        ):
            pass

        _LOG.warning(
            (
                "Roleplay evaluation HTTP failure: "
                "status=%s type=%s message=%s"
            ),
            getattr(exc, "code", "unknown"),
            _trim(error_type, 120),
            _trim(error_message, 500),
        )

        return None, model

    except (
        urllib.error.URLError,
        TimeoutError,
        KeyError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
    ) as exc:
        _LOG.warning(
            (
                "Roleplay evaluation transport or "
                "parsing failure: %s: %s"
            ),
            type(exc).__name__,
            _trim(exc, 500),
        )

        return None, model


def _fallback_evaluation(
    *,
    review: dict[str, Any],
) -> dict[str, Any]:
    scores = (
        review.get("scores")
        if isinstance(
            review.get("scores"),
            dict,
        )
        else {}
    )

    turn_count = int(
        scores.get("totalTurns")
        or 0
    )

    average_words = float(
        scores.get("avgWordCount")
        or 0
    )

    strong_phrases = _safe_strings(
        review.get("strongPhrases"),
        10,
        180,
    )

    difficult_phrases = _safe_strings(
        review.get("difficultPhrases"),
        10,
        180,
    )

    task_score = round(
        min(
            100.0,
            35.0
            + len(strong_phrases) * 12.0
            + min(turn_count, 5) * 5.0,
        ),
        1,
    )

    interaction_score = round(
        min(
            100.0,
            30.0
            + min(turn_count, 5) * 10.0
            + min(average_words, 20.0),
        ),
        1,
    )

    coherence_score = round(
        min(
            100.0,
            30.0
            + min(average_words, 25.0) * 2.0,
        ),
        1,
    )

    criteria = [
        {
            "id": "task_fulfilment",
            "name": _CRITERION_NAMES[
                "task_fulfilment"
            ],
            "score": task_score,
            "level": "insufficient_evidence",
            "rationale": (
                "Measured only from completed turns and scenario phrase "
                "coverage; AI assessment was unavailable."
            ),
            "evidence": [
                f"Completed learner turns: {turn_count}",
                (
                    "Scenario phrases observed: "
                    f"{len(strong_phrases)}"
                ),
            ],
        },
        {
            "id": "interaction",
            "name": _CRITERION_NAMES[
                "interaction"
            ],
            "score": interaction_score,
            "level": "insufficient_evidence",
            "rationale": (
                "Measured only from turn completion and response length; "
                "detailed AI assessment was unavailable."
            ),
            "evidence": [
                f"Completed learner turns: {turn_count}",
                (
                    "Average words per learner turn: "
                    f"{average_words}"
                ),
            ],
        },
        {
            "id": "coherence",
            "name": _CRITERION_NAMES[
                "coherence"
            ],
            "score": coherence_score,
            "level": "insufficient_evidence",
            "rationale": (
                "Only response-length evidence was available; coherence "
                "was not linguistically assessed."
            ),
            "evidence": [
                (
                    "Average words per learner turn: "
                    f"{average_words}"
                ),
            ],
        },
    ]

    for criterion_id in (
        "grammar",
        "vocabulary",
        "register",
    ):
        criteria.append(
            {
                "id": criterion_id,
                "name": _CRITERION_NAMES[
                    criterion_id
                ],
                "score": None,
                "level": "insufficient_evidence",
                "rationale": (
                    "No AI linguistic assessment was available, "
                    "so no score was fabricated."
                ),
                "evidence": [],
            }
        )

    if difficult_phrases:
        phrase_improvement = (
            "Practise the remaining scenario phrases: "
            + ", ".join(
                difficult_phrases[:3]
            )
            + "."
        )
    else:
        phrase_improvement = (
            "Expand the range of situation-specific phrases."
        )

    return {
        "estimatedLevel": "insufficient_evidence",
        "confidence": 0.2,
        "overallSummary": (
            "The session was completed, but detailed AI language assessment "
            "was unavailable. Measurable completion evidence is shown without "
            "inventing language scores."
        ),
        "criteria": criteria,
        "strengths": [
            f"Completed {turn_count} learner turns.",
            (
                f"Used {len(strong_phrases)} "
                "scenario phrase(s)."
            ),
        ],
        "improvements": [
            (
                "Repeat the mission and state one clear goal and "
                "one next action in each response."
            ),
            phrase_improvement,
        ],
        "corrections": [],
        "actionPlan": [
            (
                "Repeat the same mission once without reading "
                "the phrase list."
            ),
            (
                "Choose three useful phrases and use each in "
                "a complete sentence."
            ),
            (
                "Record another session and compare how clearly "
                "you explain the goal and next step."
            ),
        ],
    }


def evaluate_roleplay_session(
    *,
    session: dict[str, Any],
    review: dict[str, Any],
) -> dict[str, Any]:
    scenario = (
        session.get("scenario")
        if isinstance(
            session.get("scenario"),
            dict,
        )
        else {}
    )

    mission = (
        session.get("mission")
        if isinstance(
            session.get("mission"),
            dict,
        )
        else {}
    )

    transcript = [
        {
            "speaker": str(
                item.get("speaker")
                or ""
            ),
            "text": _trim(
                item.get("text"),
                900,
            ),
        }
        for item in (
            review.get("transcriptAnnotated")
            or []
        )
        if (
            isinstance(
                item,
                dict,
            )
            and str(
                item.get("text")
                or ""
            ).strip()
        )
    ]

    payload = {
        "evaluation_kind": "roleplay",
        "target_level_band": session.get(
            "level",
        ),
        "profession": session.get(
            "profession",
        ),
        "track": review.get(
            "track",
        ),
        "scenario": {
            "id": scenario.get(
                "scenario_id",
            ),
            "title": scenario.get(
                "title",
            ),
            "prompt": scenario.get(
                "prompt",
            ),
        },
        "mission": (
            {
                "id": mission.get(
                    "missionId",
                ),
                "title": mission.get(
                    "title",
                ),
                "learner_goal": mission.get(
                    "learnerGoal",
                ),
                "complication": mission.get(
                    "complication",
                ),
                "required_actions": (
                    mission.get(
                        "requiredActions",
                    )
                    or []
                ),
            }
            if mission
            else None
        ),
        "useful_phrases": (
            scenario.get(
                "keyPhrases",
            )
            or []
        ),
        "transcript": transcript,
        "assessment_limits": [
            (
                "No raw audio is supplied "
                "to this evaluator."
            ),
            (
                "Do not assess pronunciation, accent, "
                "voice quality, or acoustic fluency."
            ),
        ],
    }

    ai_report, model = _openai_evaluation(
        payload,
    )

    report = (
        ai_report
        or _fallback_evaluation(
            review=review,
        )
    )

    return {
        "reportVersion": REPORT_VERSION,
        "evaluationKind": "roleplay",
        "status": (
            "ready"
            if ai_report
            else "fallback"
        ),
        "provider": (
            "openai"
            if ai_report
            else "deterministic_fallback"
        ),
        "model": (
            model
            if ai_report
            else None
        ),
        "promptVersion": PROMPT_VERSION,
        "rubricVersion": RUBRIC_VERSION,
        "disclaimer": DISCLAIMER,
        "audioEvidenceAvailable": False,
        "pronunciationAssessed": False,
        **report,
    }
