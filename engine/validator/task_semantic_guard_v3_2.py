from __future__ import annotations

import ast
import re
from dataclasses import dataclass
from typing import Any


SERIALIZED_OPTION_TEXT_RE = re.compile(
    r"^\s*\{.*(['\"]id['\"]\s*:|['\"]text['\"]\s*:).*\}\s*$",
    re.DOTALL,
)
WRITING_TEMPLATE_RE = re.compile(
    r"(Write for the receiver in this scenario:|Purpose:|Constraint:)",
    re.IGNORECASE,
)
WRITING_NUMERIC_ARTIFACT_RE = re.compile(
    r"\b(?:teksti|polku|kohta|saie|sana|vastaanottaja|arvio)\d+\b",
    re.IGNORECASE,
)


@dataclass
class SemanticValidationResultV3_2:
    semantic_pass: bool
    semantic_errors: list[str]


def first_string(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped:
                return stripped
    return None


def normalize_option_payload(option: Any) -> tuple[str | None, str | None, bool]:
    if isinstance(option, dict):
        return (
            first_string(option.get("text"), option.get("label"), option.get("value")),
            first_string(option.get("id"), option.get("value")),
            True,
        )

    if not isinstance(option, str):
        return None, None, False

    stripped = option.strip()
    if not stripped:
        return None, None, False

    if not SERIALIZED_OPTION_TEXT_RE.match(stripped):
        return stripped, None, False

    try:
        parsed = ast.literal_eval(stripped)
    except (SyntaxError, ValueError):
        return stripped, None, True

    if isinstance(parsed, dict):
        return (
            first_string(parsed.get("text"), parsed.get("label"), parsed.get("value")) or stripped,
            first_string(parsed.get("id"), parsed.get("value")),
            True,
        )

    return stripped, None, True


def _semantic_text_fragments(task: dict[str, Any]) -> list[str]:
    content = task.get("content") if isinstance(task.get("content"), dict) else {}
    materials = content.get("materials") if isinstance(content.get("materials"), dict) else {}
    fragments: list[str] = []

    def add(value: Any) -> None:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped:
                fragments.append(stripped)
        elif isinstance(value, list):
            for item in value:
                add(item)
        elif isinstance(value, dict):
            for item in value.values():
                add(item)

    add(content.get("instruction"))
    add(content.get("rubric"))
    add(materials.get("text"))
    add(materials.get("scenario"))
    add(materials.get("transcript"))
    add(content.get("questions"))
    add(content.get("items"))
    return fragments


def validate_task_semantics_v3_2(raw: dict[str, Any]) -> SemanticValidationResultV3_2:
    errors: list[str] = []
    task_type = raw.get("task_type")
    content = raw.get("content") if isinstance(raw.get("content"), dict) else {}

    if task_type in {"reading_mcq_set", "listening_mcq_set"}:
        questions = content.get("questions") if isinstance(content.get("questions"), list) else []
        for question_index, question in enumerate(questions):
            if not isinstance(question, dict):
                continue
            options = question.get("options") if isinstance(question.get("options"), list) else []
            for option_index, option in enumerate(options):
                normalized_text, _, was_serialized = normalize_option_payload(option)
                if not normalized_text:
                    errors.append(
                        f"content.questions[{question_index}].options[{option_index}] has no user-facing text"
                    )
                elif was_serialized:
                    errors.append(
                        f"content.questions[{question_index}].options[{option_index}] is a serialized option object"
                    )

    if task_type == "writing_prompt":
        for fragment in _semantic_text_fragments(raw):
            if WRITING_TEMPLATE_RE.search(fragment):
                errors.append("writing prompt contains reconstruction template scaffolding")
                break
        for fragment in _semantic_text_fragments(raw):
            if WRITING_NUMERIC_ARTIFACT_RE.search(fragment):
                errors.append("writing prompt contains numeric reconstruction artifacts")
                break

    return SemanticValidationResultV3_2(
        semantic_pass=not errors,
        semantic_errors=errors,
    )
