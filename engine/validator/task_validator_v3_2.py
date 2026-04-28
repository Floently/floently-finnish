# ==========================================================
# YKI CANONICAL VALIDATOR — V3.2
#
# Deterministic. No mutation. No defaults. No inference.
# All rules derived from task_contract_registry_v3_2.TASK_REGISTRY.
#
# Three validation layers:
#   1. Structural  — Pydantic schema enforcement
#   2. Structural  — Contract structural constraints (from registry)
#   3. Blueprint   — Blueprint constraints (from registry)
# ==========================================================

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import ValidationError

from engine.registry.task_contract_registry_v3_2 import TASK_REGISTRY
from engine.schema.task_models_v3_2 import TASK_TYPE_TO_MODEL, BaseTaskModel
from engine.validator.task_semantic_guard_v3_2 import validate_task_semantics_v3_2


# ------------------------------------------------------------------
# Result type
# ------------------------------------------------------------------

@dataclass
class ValidationResultV3_2:
    structural_pass: bool
    structural_errors: List[str]
    blueprint_pass: bool
    blueprint_errors: List[str]
    validated_model: Optional[Any] = None


# ------------------------------------------------------------------
# Public entry point
# ------------------------------------------------------------------

def validate_task_v3_2(raw: Dict[str, Any]) -> ValidationResultV3_2:
    structural_errors: List[str] = []
    blueprint_errors: List[str] = []
    validated_model: Optional[Any] = None

    # ----------------------------------------------------------
    # LAYER 1 — Structural: Pydantic schema enforcement
    # ----------------------------------------------------------

    task_type = raw.get("task_type")

    if task_type not in TASK_TYPE_TO_MODEL:
        structural_errors.append(
            f"Unknown or missing task_type: {task_type!r}"
        )
        return ValidationResultV3_2(
            structural_pass=False,
            structural_errors=structural_errors,
            blueprint_pass=False,
            blueprint_errors=["Blueprint not evaluated: structural failure"],
        )

    model_class = TASK_TYPE_TO_MODEL[task_type]

    try:
        model: BaseTaskModel = model_class.model_validate(raw)
        validated_model = model
    except ValidationError as exc:
        for err in exc.errors():
            loc = " -> ".join(str(p) for p in err["loc"])
            structural_errors.append(f"{loc}: {err['msg']}")
        return ValidationResultV3_2(
            structural_pass=False,
            structural_errors=structural_errors,
            blueprint_pass=False,
            blueprint_errors=["Blueprint not evaluated: structural failure"],
            validated_model=None,
        )

    # ----------------------------------------------------------
    # LAYER 2 — Structural: contract structural constraints
    # All rules read from registry — no hardcoded values.
    # ----------------------------------------------------------

    registry_entry = TASK_REGISTRY[task_type]
    structural_constraints = registry_entry["content_structure"]["structural_constraints"]
    difficulty_range = registry_entry.get("difficulty_range", {})

    _enforce_structural_constraints(model, structural_constraints, structural_errors)
    _enforce_shared_contract_constraints(model, difficulty_range, structural_errors)

    semantic_result = validate_task_semantics_v3_2(raw)
    structural_errors.extend(semantic_result.semantic_errors)

    structural_pass = len(structural_errors) == 0

    if not structural_pass:
        return ValidationResultV3_2(
            structural_pass=False,
            structural_errors=structural_errors,
            blueprint_pass=False,
            blueprint_errors=["Blueprint not evaluated: structural constraint failure"],
            validated_model=None,
        )

    # ----------------------------------------------------------
    # LAYER 3 — Blueprint constraints
    # All rules read from registry — no hardcoded values.
    # ----------------------------------------------------------

    blueprint_constraints = registry_entry["content_structure"]["blueprint_validation_constraints"]

    _enforce_blueprint_constraints(model, blueprint_constraints, blueprint_errors)

    blueprint_pass = len(blueprint_errors) == 0

    return ValidationResultV3_2(
        structural_pass=structural_pass,
        structural_errors=structural_errors,
        blueprint_pass=blueprint_pass,
        blueprint_errors=blueprint_errors,
        validated_model=validated_model if blueprint_pass else None,
    )


# ------------------------------------------------------------------
# Layer 2 enforcement — structural constraints
# ------------------------------------------------------------------

def _enforce_structural_constraints(
    model: BaseTaskModel,
    constraints: Dict[str, Any],
    errors: List[str],
) -> None:
    content = model.content

    if "questions_min_count" in constraints:
        min_count = constraints["questions_min_count"]
        questions = getattr(content, "questions", [])
        if len(questions) < min_count:
            errors.append(
                f"content.questions count {len(questions)} is below minimum {min_count}"
            )

    if "items_min_count" in constraints:
        min_count = constraints["items_min_count"]
        items = getattr(content, "items", [])
        if len(items) < min_count:
            errors.append(
                f"content.items count {len(items)} is below minimum {min_count}"
            )

    if "options_min_count_per_question" in constraints:
        min_opts = constraints["options_min_count_per_question"]
        questions = getattr(content, "questions", [])
        for i, question in enumerate(questions):
            if len(question.options) < min_opts:
                errors.append(
                    f"content.questions[{i}].options count {len(question.options)}"
                    f" is below minimum {min_opts}"
                )

    if constraints.get("correct_index_must_be_in_bounds"):
        questions = getattr(content, "questions", [])
        for i, question in enumerate(questions):
            if question.correct_index < 0 or question.correct_index >= len(question.options):
                errors.append(
                    f"content.questions[{i}].correct_index {question.correct_index}"
                    f" is out of bounds for options length {len(question.options)}"
                )

    if constraints.get("transcript_must_be_non_empty"):
        materials = getattr(content, "materials", None)
        transcript = getattr(materials, "transcript", None)
        if transcript is not None and transcript.strip() == "":
            errors.append("content.materials.transcript must not be empty")

    if constraints.get("word_count_must_equal_text_split_len"):
        materials = getattr(content, "materials", None)
        if materials is not None:
            text = getattr(materials, "text", None)
            word_count = getattr(materials, "word_count", None)
            if text is not None and word_count is not None:
                actual_len = len(text.split())
                if word_count != actual_len:
                    errors.append(
                        f"content.materials.word_count {word_count}"
                        f" does not equal len(text.split()) {actual_len}"
                    )


# ------------------------------------------------------------------
# Layer 3 enforcement — blueprint constraints
# ------------------------------------------------------------------

def _enforce_blueprint_constraints(
    model: BaseTaskModel,
    bp_constraints: Dict[str, Any],
    errors: List[str],
) -> None:
    if "allowed_level_bands" in bp_constraints:
        allowed = bp_constraints["allowed_level_bands"]
        if model.level_band not in allowed:
            errors.append(
                f"level_band {model.level_band!r} is not in allowed_level_bands {list(allowed)}"
            )

    if bp_constraints.get("difficulty_required"):
        if model.difficulty is None:
            errors.append("difficulty is required but missing")

    if "difficulty_precision_decimals" in bp_constraints:
        max_precision = bp_constraints["difficulty_precision_decimals"]
        if model.difficulty is not None:
            actual_precision = abs(Decimal(str(model.difficulty)).as_tuple().exponent)
            if actual_precision > max_precision:
                errors.append(
                    f"difficulty {model.difficulty} has {actual_precision} decimal places,"
                    f" maximum allowed is {max_precision}"
                )


def _enforce_shared_contract_constraints(
    model: BaseTaskModel,
    difficulty_range: Dict[str, Any],
    errors: List[str],
) -> None:
    if model.language != "fi":
        errors.append(f"language must be 'fi', got {model.language!r}")

    allowed_range = difficulty_range.get(model.level_band)
    if (
        isinstance(allowed_range, tuple)
        and len(allowed_range) == 2
        and model.difficulty is not None
    ):
        minimum = float(allowed_range[0])
        maximum = float(allowed_range[1])
        if float(model.difficulty) < minimum or float(model.difficulty) > maximum:
            errors.append(
                f"difficulty {model.difficulty} is outside allowed range {minimum:.3f}-{maximum:.3f}"
            )
