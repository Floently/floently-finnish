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

REPORT_VERSION = "1.2"
PROMPT_VERSION = "yki-deep-evaluation-v4"
RUBRIC_VERSION = "floently-yki-practice-v3"

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


_SECTION_IMPROVEMENT_DEFAULTS: dict[str, tuple[str, ...]] = {
    "reading": (
        "Review every missed item and classify the cause as vocabulary, main idea, detail, or inference.",
        "Read one B1-B2 text and write a two-sentence summary with two supporting details.",
    ),
    "listening": (
        "Replay one B1-B2 recording with a transcript and mark the words that changed the meaning.",
        "Practise identifying the main point, speaker intention, and two concrete details.",
    ),
    "writing": (
        "Rewrite one response using the grounded corrections and add two specific supporting details.",
        "Check case endings, verb forms, word order, and connectors before submitting.",
    ),
    "speaking": (
        "Repeat one task with a clear opening, two supporting points, and a concise conclusion.",
        "Compare the new transcript with this report and correct recurring grammar and vocabulary errors.",
    ),
}


def _ensure_section_improvements(
    *,
    section_name: str,
    section: dict[str, Any],
) -> None:
    improvements = _safe_strings(
        section.get("improvements"),
        6,
    )

    for candidate in _SECTION_IMPROVEMENT_DEFAULTS.get(
        section_name,
        (),
    ):
        item = _trim(
            candidate,
            700,
        )

        if item and item not in improvements:
            improvements.append(item)

        if len(improvements) >= 2:
            break

    section["improvements"] = improvements[:6]



def _objective_score_line(
    exact: dict[str, Any],
) -> str | None:
    score = exact.get("score")
    maximum = exact.get("maximum")
    percentage = exact.get("percentage")

    if score is None or maximum is None:
        return None

    return (
        f"Exact score: {score}/{maximum}"
        + (
            f" ({percentage}%)."
            if percentage is not None
            else "."
        )
    )


def _ground_objective_section(
    *,
    section: dict[str, Any],
    exact: dict[str, Any],
) -> None:
    percentage = exact.get("percentage")
    exact_line = _objective_score_line(exact)

    section["scoreAvailable"] = percentage is not None
    section["score"] = float(
        percentage if percentage is not None else 0
    )
    section["evidence"] = [exact_line] if exact_line else []
    section["corrections"] = []

    for criterion in section.get("criteria", []):
        if isinstance(criterion, dict):
            criterion["evidence"] = [exact_line] if exact_line else []


def _calibrate_subjective_score(
    section: dict[str, Any],
) -> None:
    ratios: list[float] = []

    for criterion in section.get("criteria", []):
        if not isinstance(criterion, dict):
            continue

        maximum = _bounded(
            criterion.get("scoreMax"),
            0.1,
            5,
            5,
        )
        score = _bounded(
            criterion.get("score"),
            0,
            maximum,
            0,
        )
        ratios.append(score / maximum)

    if not ratios:
        section["scoreAvailable"] = False
        section["score"] = 0.0
        return

    section["scoreAvailable"] = True
    section["score"] = round(
        sum(ratios) / len(ratios) * 100,
        1,
    )


def _normalised_target_band(
    value: Any,
) -> str:
    candidate = (
        str(value or "B1-B2")
        .strip()
        .upper()
        .replace("_", "-")
    )

    if candidate in {"A1-A2", "B1-B2", "C1-C2"}:
        return candidate

    return "B1-B2"


def _predicted_grade(
    *,
    target_band: str,
    estimated_level: Any,
) -> str:
    level = _level(estimated_level)

    if level == "insufficient_evidence":
        return "not enough evidence"

    if target_band == "A1-A2":
        return "1" if level == "A1" else "2"

    if target_band == "C1-C2":
        if level == "C1":
            return "5"
        if level == "C2":
            return "6"
        return "below 5"

    if level == "B1":
        return "3"
    if level in {"B2", "C1", "C2"}:
        return "4"
    return "below 3"


def _prediction_payload(
    *,
    target_level: Any,
    sections: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    target_band = _normalised_target_band(target_level)
    predicted_sections: dict[str, dict[str, str]] = {}

    for section_name in _SECTIONS:
        section = sections.get(section_name, {})
        estimated_level = _level(section.get("estimatedLevel"))
        grade = _predicted_grade(
            target_band=target_band,
            estimated_level=estimated_level,
        )
        predicted_sections[section_name] = {
            "grade": grade,
            "estimatedLevel": estimated_level,
            "label": (
                f"Most likely YKI grade {grade}"
                if grade[:1].isdigit()
                else f"Most likely {grade} on the {target_band} test"
            ),
        }

    summary = (
        "Most likely practice prediction: "
        + ", ".join(
            f"{section_name.title()} {predicted_sections[section_name]['grade']}"
            for section_name in _SECTIONS
        )
        + "."
    )

    return {
        "targetBand": target_band,
        "sections": predicted_sections,
        "summary": summary,
        "officialResult": False,
    }


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
                "minimum": 0,
                "maximum": 100,
                "description": (
                    "Section percentage from 0 to 100. "
                    "Reading and listening must exactly match "
                    "the supplied objective percentage."
                ),
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
                            "minimum": 0,
                            "maximum": 5,
                        },
                        "score_max": {
                            "type": "number",
                            "enum": [5],
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
                        "score_max",
                        "rationale",
                        "evidence",
                    ],
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
            "corrections",
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


def _is_production_environment() -> bool:
    return any(
        str(
            os.environ.get(name)
            or ""
        ).strip().lower()
        in {
            "production",
            "prod",
        }
        for name in (
            "APP_ENV",
            "FLOENTLY_ENV",
        )
    )


def _evaluation_enabled() -> bool:
    return _env_bool(
        "OPENAI_EVALUATION_ENABLED",
        _is_production_environment(),
    )


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

    speaking = evidence.get(
        "speaking",
    )

    if isinstance(speaking, dict):
        _find_transcripts(
            speaking,
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
                        5,
                        0,
                    ),
                    1,
                ),
                "scoreMax": 5,
                "rationale": rationale,
                "evidence": _safe_strings(
                    item.get("evidence"),
                    4,
                ),
            }
        )

        if len(criteria) >= 8:
            break

    corrections: list[dict[str, str]] = []

    for item in value.get("corrections") or []:
        if not isinstance(item, dict):
            continue

        original = _trim(
            item.get("original"),
            700,
        )
        corrected = _trim(
            item.get("corrected"),
            700,
        )
        explanation = _trim(
            item.get("explanation"),
            900,
        )

        if not original or not corrected or not explanation:
            continue

        corrections.append(
            {
                "original": original,
                "corrected": corrected,
                "explanation": explanation,
            }
        )

        if len(corrections) >= 6:
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
        "corrections": corrections,
        "improvements": _safe_strings(
            value.get("improvements"),
            6,
        ),
    }


def _normalized_match_text(
    value: Any,
) -> str:
    return (
        " ".join(
            str(value or "")
            .strip()
            .split()
        )
        .strip('"“”')
        .casefold()
    )


def _section_source_texts(
    payload: dict[str, Any],
    section_name: str,
) -> list[str]:
    values: list[str] = []

    if section_name == "writing":
        raw = payload.get(
            "writing_responses"
        )

        if isinstance(raw, list):
            for item in raw:
                if not isinstance(item, dict):
                    continue

                text = _trim(
                    item.get("text"),
                    5000,
                )

                if text:
                    values.append(text)

    elif section_name == "speaking":
        raw = payload.get(
            "speaking_transcripts"
        )

        if isinstance(raw, list):
            for item in raw:
                text = _trim(
                    item,
                    3000,
                )

                if text:
                    values.append(text)

    return values


def _is_verbatim_excerpt(
    value: Any,
    sources: list[str],
) -> bool:
    excerpt = _normalized_match_text(
        value
    )

    if len(excerpt) < 5:
        return False

    return any(
        excerpt
        in _normalized_match_text(source)
        for source in sources
    )


def _source_excerpts(
    sources: list[str],
    limit: int = 2,
) -> list[str]:
    result: list[str] = []

    for source in sources:
        words = _trim(
            source,
            3000,
        ).split()

        for offset in (
            0,
            18,
        ):
            excerpt = " ".join(
                words[offset : offset + 18]
            ).strip()

            if (
                len(excerpt) >= 5
                and excerpt not in result
            ):
                result.append(excerpt)

            if len(result) >= limit:
                return result

    return result


def _ground_language_section(
    *,
    section_name: str,
    section: dict[str, Any],
    sources: list[str],
) -> None:
    matched_evidence = [
        item
        for item in section["evidence"]
        if _is_verbatim_excerpt(
            item,
            sources,
        )
    ]

    for excerpt in _source_excerpts(
        sources,
        2,
    ):
        if excerpt not in matched_evidence:
            matched_evidence.append(excerpt)

        if len(matched_evidence) >= 2:
            break

    matched_corrections = [
        item
        for item in section["corrections"]
        if _is_verbatim_excerpt(
            item["original"],
            sources,
        )
    ]

    for criterion in section["criteria"]:
        grounded = [
            item
            for item in criterion.get(
                "evidence",
                [],
            )
            if _is_verbatim_excerpt(
                item,
                sources,
            )
        ]

        if not grounded and matched_evidence:
            grounded = matched_evidence[:1]

        criterion["evidence"] = grounded[:4]

    if len(matched_evidence) < 2:
        _LOG.warning(
            "YKI evaluation retained a language section with limited grounded evidence: section=%s matched=%s",
            section_name,
            len(matched_evidence),
        )
        section["status"] = "limited"

    if not matched_corrections:
        _LOG.warning(
            "YKI evaluation retained a grounded language section without a verified correction: section=%s",
            section_name,
        )

    section["evidence"] = matched_evidence[:8]
    section["corrections"] = matched_corrections[:6]


def _normalise_ai_report(
    value: Any,
    payload: dict[str, Any],
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

    for section_name in (
        "writing",
        "speaking",
    ):
        sources = _section_source_texts(
            payload,
            section_name,
        )

        if not sources:
            continue

        _ground_language_section(
            section_name=section_name,
            section=sections[section_name],
            sources=sources,
        )

    objective_scores = payload.get("objective_scores")
    if not isinstance(objective_scores, dict):
        objective_scores = {}

    for section_name in ("reading", "listening"):
        exact = objective_scores.get(section_name)
        if not isinstance(exact, dict):
            exact = {}
        _ground_objective_section(
            section=sections[section_name],
            exact=exact,
        )

    for section_name in ("writing", "speaking"):
        _calibrate_subjective_score(sections[section_name])

    for section_name in _SECTIONS:
        _ensure_section_improvements(
            section_name=section_name,
            section=sections[section_name],
        )

    improvements = _safe_strings(
        value.get("improvements"),
        8,
    )

    action_plan = _safe_strings(
        value.get("action_plan"),
        5,
    )

    action_candidates = [
        *improvements,
        "Review the weakest objective section and explain every missed item.",
        "Rewrite one writing response using the report corrections and criteria.",
        "Repeat one speaking task and compare the new transcript with the evidence.",
        "Complete one timed four-section practice run and compare the results.",
    ]

    for candidate in action_candidates:
        action = _trim(
            candidate,
            600,
        )

        if action and action not in action_plan:
            action_plan.append(action)

        if len(action_plan) >= 3:
            break

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
    if not _evaluation_enabled():
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
        "Evaluate reading, listening, writing, and speaking independently. "
        "Never let performance or evidence from one section influence another. "
        "Section scores use a 0-100 percentage scale. "
        "Criterion scores use a 0-5 scale and score_max must equal 5. "
        "For reading and listening, preserve the exact supplied score, "
        "set the section score to the supplied percentage exactly, and use "
        "only objective score facts as evidence. Never quote writing or "
        "speaking text inside reading or listening. "
        "Never invent an incorrect answer or unseen question. "
        "Evaluate writing only from supplied learner texts. Assess task "
        "fulfilment, coherence, vocabulary range, grammatical control, and "
        "register. A connected response that fulfils the task, gives reasons, "
        "and remains understandable should not be held below B1 merely because "
        "minor errors or non-advanced vocabulary remain. Reserve A2 for "
        "short, weakly connected, incomplete, or substantially limited writing. "
        "Evaluate speaking only from supplied transcripts, interaction "
        "records, and durations. Assess task fulfilment, coherence, vocabulary "
        "and grammar, and interaction. Normal hesitation in a transcript is not "
        "by itself a reason to deny B1 when the message is developed and clear. "
        "Be strict and accurate, but constructive: identify demonstrated "
        "strengths before explaining the precise next-level gap. Do not apply "
        "the same error as multiple penalties across criteria. "
        "When writing or speaking evidence exists, "
        "return at least two evidence entries that are short verbatim "
        "substrings copied directly from the learner evidence, without "
        "labels, quotation marks, paraphrasing, or ellipses. Copy punctuation "
        "exactly. Also return at least one correction whose original field is "
        "copied verbatim from the learner evidence, whose corrected field "
        "gives improved Finnish, and whose explanation "
        "states the concrete language issue. Never invent learner text. "
        "Do not assess pronunciation, accent, voice quality, or acoustic "
        "fluency because acoustic features are not supplied. "
        "Return at least two concrete improvement actions for every section. "
        "Use task-specific evidence rather than generic advice. "
        "The result is an AI-estimated practice level and is never an "
        "official YKI result, grade, assessment, or certificate. "
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
                "3200",
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

    attempts = 2

    for attempt in range(1, attempts + 1):
        attempt_payload = dict(request_payload)
        attempt_messages = list(
            request_payload["messages"]
        )

        if attempt > 1:
            attempt_messages = [
                {
                    "role": "system",
                    "content": (
                        system_prompt
                        + " This is a validation retry. Ensure learner evidence and correction originals are copied as exact contiguous substrings, with no added labels, quotation marks, or ellipses."
                    ),
                },
                request_payload["messages"][1],
            ]

        attempt_payload["messages"] = attempt_messages

        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(
                attempt_payload,
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
            normalized = _normalise_ai_report(
                parsed,
                payload,
            )

            if normalized is not None:
                if attempt > 1:
                    _LOG.info(
                        "YKI evaluation recovered on retry: attempt=%s",
                        attempt,
                    )

                return normalized, model

            _LOG.warning(
                "YKI evaluation response failed structural validation: attempt=%s/%s",
                attempt,
                attempts,
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
                "YKI evaluation HTTP failure: attempt=%s/%s status=%s message=%s",
                attempt,
                attempts,
                getattr(exc, "code", "unknown"),
                _trim(error_message, 500),
            )

        except (
            urllib.error.URLError,
            TimeoutError,
            KeyError,
            TypeError,
            ValueError,
            json.JSONDecodeError,
        ) as exc:
            _LOG.warning(
                "YKI evaluation attempt failed safely: attempt=%s/%s error=%s message=%s",
                attempt,
                attempts,
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
            "corrections": [],
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
        "corrections": [],
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
        "corrections": [],
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

    for section_name in (
        "reading",
        "listening",
    ):
        _ground_objective_section(
            section=report["sections"][section_name],
            exact=objective[section_name],
        )

    for section_name in (
        "writing",
        "speaking",
    ):
        _calibrate_subjective_score(
            report["sections"][section_name]
        )

    predicted_yki = _prediction_payload(
        target_level=target_level,
        sections=report["sections"],
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
        "predictedYki": predicted_yki,
        **report,
    }
