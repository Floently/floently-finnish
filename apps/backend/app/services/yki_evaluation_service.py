from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any


_LOG = logging.getLogger(
    "floently.yki.evaluation"
)

REPORT_VERSION = "1.0"
PROMPT_VERSION = "yki-deep-evaluation-v1"
RUBRIC_VERSION = "floently-yki-practice-v1"

DISCLAIMER = (
    "AI-estimated YKI practice feedback. "
    "This is not an official YKI result, "
    "grade, assessment, or certificate."
)

_SECTIONS = (
    "reading",
    "listening",
    "writing",
    "speaking",
)

_LEVELS = (
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
    "insufficient_evidence",
)


def _section_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "status": {
                "type": "string",
                "enum": [
                    "assessed",
                    "limited",
                    "insufficient_evidence",
                ],
            },
            "estimated_level": {
                "type": "string",
                "enum": list(_LEVELS),
            },
            "score_available": {
                "type": "boolean",
            },
            "score": {
                "type": "number",
            },
            "summary": {
                "type": "string",
            },
            "evidence": {
                "type": "array",
                "items": {
                    "type": "string",
                },
            },
            "criteria": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {
                            "type": "string",
                        },
                        "score": {
                            "type": "number",
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
                        "name",
                        "score",
                        "rationale",
                        "evidence",
                    ],
                },
            },
            "improvements": {
                "type": "array",
                "items": {
                    "type": "string",
                },
            },
        },
        "required": [
            "status",
            "estimated_level",
            "score_available",
            "score",
            "summary",
            "evidence",
            "criteria",
            "improvements",
        ],
    }


_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "overall_estimated_level": {
            "type": "string",
            "enum": list(_LEVELS),
        },
        "confidence": {
            "type": "number",
        },
        "overall_summary": {
            "type": "string",
        },
        "sections": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                section: _section_schema()
                for section in _SECTIONS
            },
            "required": list(_SECTIONS),
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
        "action_plan": {
            "type": "array",
            "description": (
                "Return exactly three concrete, "
                "non-duplicate practice actions."
            ),
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "overall_estimated_level",
        "confidence",
        "overall_summary",
        "sections",
        "strengths",
        "improvements",
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
        "",
        "0",
        "false",
        "no",
        "off",
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
    item_limit: int = 700,
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


def _bounded(
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


def _level(
    value: Any,
) -> str:
    candidate = (
        str(value or "")
        .strip()
        .upper()
        .replace("_", "-")
    )

    if candidate in _LEVELS:
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


def _count_questions(
    value: Any,
) -> int:
    if isinstance(value, list):
        return sum(
            _count_questions(item)
            for item in value
        )

    if not isinstance(value, dict):
        return 0

    questions = value.get("questions")

    if isinstance(questions, list):
        return len(questions)

    content = value.get("content")

    if isinstance(content, dict):
        nested_questions = content.get(
            "questions",
        )

        if isinstance(nested_questions, list):
            return len(nested_questions)

    items = value.get("items")

    if isinstance(items, list):
        return sum(
            _count_questions(item)
            for item in items
        )

    tasks = value.get("tasks")

    if isinstance(tasks, list):
        return sum(
            _count_questions(item)
            for item in tasks
        )

    return 0


def _objective_maximum(
    runtime: dict[str, Any],
    section_name: str,
) -> int:
    sections = runtime.get("sections")

    if isinstance(sections, list):
        for section in sections:
            if not isinstance(section, dict):
                continue

            key = str(
                section.get("section_type")
                or section.get("key")
                or ""
            ).strip().lower()

            if key != section_name:
                continue

            count = _count_questions(section)

            if count > 0:
                return count

    exam = runtime.get("exam")

    if isinstance(exam, dict):
        count = _count_questions(
            exam.get(section_name),
        )

        if count > 0:
            return count

    return 0


def _writing_texts(
    evidence: dict[str, Any],
) -> list[dict[str, str]]:
    bucket = evidence.get("writing")

    if not isinstance(bucket, dict):
        return []

    result: list[dict[str, str]] = []

    for task_id, item in bucket.items():
        if not isinstance(item, dict):
            continue

        text = _trim(
            item.get("text"),
            5000,
        )

        if text:
            result.append(
                {
                    "task_id": str(task_id),
                    "text": text,
                }
            )

    return result[:10]


def _find_transcripts(
    value: Any,
    result: list[str],
) -> None:
    if len(result) >= 20:
        return

    if isinstance(value, list):
        for item in value:
            _find_transcripts(
                item,
                result,
            )
        return

    if not isinstance(value, dict):
        return

    for key in (
        "transcript",
        "transcript_text",
    ):
        text = _trim(
            value.get(key),
            3000,
        )

        if text and text not in result:
            result.append(text)

    for nested in value.values():
        if isinstance(nested, (dict, list)):
            _find_transcripts(
                nested,
                result,
            )


def _speaking_transcripts(
    *,
    submission: dict[str, Any],
    evidence: dict[str, Any],
) -> list[str]:
    result: list[str] = []

    analytics = submission.get("analytics")

    if isinstance(analytics, dict):
        _find_transcripts(
            analytics.get("speaking"),
            result,
        )

    conversation = evidence.get(
        "conversation",
    )

    if isinstance(conversation, dict):
        _find_transcripts(
            conversation,
            result,
        )

    return result[:20]


def _objective_evidence(
    *,
    runtime: dict[str, Any],
    submission: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    score = (
        submission.get("score")
        if isinstance(
            submission.get("score"),
            dict,
        )
        else {}
    )

    result: dict[str, dict[str, Any]] = {}

    for section in (
        "reading",
        "listening",
    ):
        raw_score = score.get(section)
        maximum = _objective_maximum(
            runtime,
            section,
        )

        try:
            numeric_score = float(raw_score)
        except (TypeError, ValueError):
            numeric_score = None

        percentage = (
            round(
                numeric_score / maximum * 100,
                1,
            )
            if (
                numeric_score is not None
                and maximum > 0
            )
            else None
        )

        result[section] = {
            "score": numeric_score,
            "maximum": (
                maximum
                if maximum > 0
                else None
            ),
            "percentage": percentage,
        }

    return result


def _normalize_section(
    value: Any,
) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    status = str(
        value.get("status")
        or ""
    ).strip()

    if status not in {
        "assessed",
        "limited",
        "insufficient_evidence",
    }:
        return None

    criteria: list[dict[str, Any]] = []

    for item in value.get("criteria") or []:
        if not isinstance(item, dict):
            continue

        name = _trim(
            item.get("name"),
            160,
        )

        rationale = _trim(
            item.get("rationale"),
            900,
        )

        if not name or not rationale:
            continue

        criteria.append(
            {
                "name": name,
                "score": round(
                    _bounded(
                        item.get("score"),
                        0,
                        100,
                        0,
                    ),
                    1,
                ),
                "rationale": rationale,
                "evidence": _safe_strings(
                    item.get("evidence"),
                    4,
                ),
            }
        )

        if len(criteria) >= 8:
            break

    return {
        "status": status,
        "estimatedLevel": _level(
            value.get("estimated_level"),
        ),
        "scoreAvailable": bool(
            value.get("score_available")
        ),
        "score": round(
            _bounded(
                value.get("score"),
                0,
                100,
                0,
            ),
            1,
        ),
        "summary": _trim(
            value.get("summary"),
            1200,
        ),
        "evidence": _safe_strings(
            value.get("evidence"),
            8,
        ),
        "criteria": criteria,
        "improvements": _safe_strings(
            value.get("improvements"),
            6,
        ),
    }


def _normalise_ai_report(
    value: Any,
) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    raw_sections = value.get("sections")

    if not isinstance(raw_sections, dict):
        return None

    sections: dict[str, dict[str, Any]] = {}

    for section_name in _SECTIONS:
        normalized = _normalize_section(
            raw_sections.get(section_name),
        )

        if normalized is None:
            return None

        sections[section_name] = normalized

    improvements = _safe_strings(
        value.get("improvements"),
        8,
    )

    action_plan = _safe_strings(
        value.get("action_plan"),
        5,
    )

    if len(action_plan) < 2:
        return None

    if len(action_plan) == 2:
        focus = (
            improvements[0]
            if improvements
            else (
                "Repeat the weakest section and compare "
                "your new response with this report."
            )
        )

        third_action = _trim(
            "Complete one new timed practice task focusing on: "
            + focus,
            600,
        )

        if third_action in action_plan:
            third_action = (
                "Repeat a complete four-section practice run "
                "and compare the section evidence."
            )

        action_plan.append(
            third_action,
        )

    return {
        "overallEstimatedLevel": _level(
            value.get("overall_estimated_level"),
        ),
        "confidence": round(
            _bounded(
                value.get("confidence"),
                0,
                1,
                0.3,
            ),
            2,
        ),
        "overallSummary": _trim(
            value.get("overall_summary"),
            1500,
        ),
        "sections": sections,
        "strengths": _safe_strings(
            value.get("strengths"),
            8,
        ),
        "improvements": improvements,
        "actionPlan": action_plan[:3],
    }


def _openai_report(
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

    system_prompt = (
        "You are Floently's Finnish YKI practice assessor. "
        "Evaluate reading, listening, writing, and speaking separately. "
        "Preserve exact objective scores supplied for reading and listening. "
        "Never invent an incorrect answer or unseen question. "
        "Evaluate writing only from the supplied learner texts. "
        "Evaluate speaking only from transcripts, interaction records, "
        "and durations. Do not assess pronunciation, accent, voice quality, "
        "or acoustic fluency because acoustic features are not supplied. "
        "Use concrete evidence and distinguish insufficient evidence clearly. "
        "The result is an AI-estimated practice level and is never an official "
        "YKI result, grade, assessment, or certificate. "
        "Return exactly three concrete action-plan steps. "
        "Return only the required structured output."
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
        "max_tokens": int(
            os.environ.get(
                "OPENAI_EVALUATION_MAX_TOKENS",
                "2600",
            )
            or "2600"
        ),
        "store": False,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "floently_yki_evaluation",
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
                response.read().decode("utf-8")
            )

        content = (
            response_data["choices"][0]
            ["message"]["content"]
        )

        parsed = json.loads(content)

        return (
            _normalise_ai_report(parsed),
            model,
        )

    except urllib.error.HTTPError as exc:
        error_message = str(
            getattr(exc, "reason", "")
            or exc
        )

        try:
            raw = exc.read().decode(
                "utf-8",
                errors="replace",
            )

            parsed_error = json.loads(raw)
            error = (
                parsed_error.get("error")
                if isinstance(parsed_error, dict)
                else None
            )

            if isinstance(error, dict):
                error_message = str(
                    error.get("message")
                    or error_message
                )

        except Exception:
            pass

        _LOG.warning(
            "YKI evaluation HTTP failure: status=%s message=%s",
            getattr(exc, "code", "unknown"),
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
            "YKI evaluation fell back safely: %s: %s",
            type(exc).__name__,
            _trim(exc, 500),
        )

        return None, model


def _fallback_report(
    *,
    objective: dict[str, dict[str, Any]],
    writing: list[dict[str, str]],
    speaking: list[str],
) -> dict[str, Any]:
    sections: dict[str, dict[str, Any]] = {}

    for section_name in (
        "reading",
        "listening",
    ):
        exact = objective[section_name]
        percentage = exact.get("percentage")

        sections[section_name] = {
            "status": (
                "limited"
                if percentage is not None
                else "insufficient_evidence"
            ),
            "estimatedLevel": "insufficient_evidence",
            "scoreAvailable": percentage is not None,
            "score": float(percentage or 0),
            "summary": (
                "Exact objective performance is available, "
                "but detailed AI interpretation was unavailable."
            ),
            "evidence": [
                (
                    f"Exact score: {exact.get('score')}"
                    f"/{exact.get('maximum')}"
                )
                if exact.get("maximum") is not None
                else "Objective score details were incomplete."
            ],
            "criteria": [],
            "improvements": [
                (
                    "Review the missed objective items and identify "
                    "whether vocabulary, detail, or inference caused difficulty."
                )
            ],
        }

    writing_words = sum(
        len(item["text"].split())
        for item in writing
    )

    sections["writing"] = {
        "status": (
            "limited"
            if writing
            else "insufficient_evidence"
        ),
        "estimatedLevel": "insufficient_evidence",
        "scoreAvailable": False,
        "score": 0.0,
        "summary": (
            "Writing evidence was saved, but detailed AI language "
            "assessment was unavailable."
            if writing
            else "No writing evidence was available."
        ),
        "evidence": [
            f"Writing responses: {len(writing)}",
            f"Total writing words: {writing_words}",
        ],
        "criteria": [],
        "improvements": [
            (
                "Rewrite one response with a clearer opening, "
                "two supporting details, and a suitable closing."
            )
        ],
    }

    sections["speaking"] = {
        "status": (
            "limited"
            if speaking
            else "insufficient_evidence"
        ),
        "estimatedLevel": "insufficient_evidence",
        "scoreAvailable": False,
        "score": 0.0,
        "summary": (
            "Speaking transcripts were saved, but detailed AI language "
            "assessment was unavailable. Pronunciation was not assessed."
            if speaking
            else (
                "No speaking transcript was available. "
                "Pronunciation was not assessed."
            )
        ),
        "evidence": [
            f"Speaking transcripts: {len(speaking)}",
        ],
        "criteria": [],
        "improvements": [
            (
                "Repeat one speaking task and give a clear answer, "
                "supporting reason, and final conclusion."
            )
        ],
    }

    return {
        "overallEstimatedLevel": "insufficient_evidence",
        "confidence": 0.2,
        "overallSummary": (
            "The practice exam was submitted, but detailed AI evaluation "
            "was unavailable. Exact objective evidence is preserved without "
            "inventing writing, speaking, or pronunciation scores."
        ),
        "sections": sections,
        "strengths": [
            "The completed submission evidence was preserved.",
        ],
        "improvements": [
            (
                "Repeat the weakest section using the section-specific "
                "practice recommendation."
            ),
        ],
        "actionPlan": [
            "Review every missed reading and listening item.",
            "Rewrite one writing response after reviewing its task.",
            "Repeat one speaking task and compare the transcript.",
        ],
    }


def evaluate_yki_submission(
    *,
    runtime: dict[str, Any],
    submission: dict[str, Any],
    evidence: dict[str, Any],
) -> dict[str, Any]:
    objective = _objective_evidence(
        runtime=runtime,
        submission=submission,
    )

    writing = _writing_texts(
        evidence,
    )

    speaking = _speaking_transcripts(
        submission=submission,
        evidence=evidence,
    )

    target_level = (
        runtime.get("display_level_band")
        or runtime.get("level_band")
        or runtime.get("level")
        or "B1-B2"
    )

    payload = {
        "evaluation_kind": "yki_practice",
        "target_level_band": target_level,
        "objective_scores": objective,
        "engine_feedback": submission.get("feedback"),
        "engine_analytics": submission.get("analytics"),
        "writing_responses": writing,
        "speaking_transcripts": speaking,
        "evidence_counts": {
            "writing_responses": len(writing),
            "speaking_transcripts": len(speaking),
        },
        "assessment_limits": [
            (
                "This is practice feedback and not an official "
                "YKI result or certificate."
            ),
            (
                "No acoustic speech features are supplied. "
                "Do not assess pronunciation or accent."
            ),
        ],
    }

    ai_report, model = _openai_report(
        payload,
    )

    report = (
        ai_report
        or _fallback_report(
            objective=objective,
            writing=writing,
            speaking=speaking,
        )
    )

    return {
        "reportVersion": REPORT_VERSION,
        "evaluationKind": "yki_practice",
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
        "officialResult": False,
        "pronunciationAssessed": False,
        "audioEvidenceAvailable": bool(
            evidence.get("speaking")
            or evidence.get("audio")
            or evidence.get("conversation")
        ),
        "objectiveScores": objective,
        **report,
    }
