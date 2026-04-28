from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from engine.validator.task_semantic_guard_v3_2 import validate_task_semantics_v3_2
from engine.validator.task_validator_v3_2 import validate_task_v3_2


REPO_ROOT = Path(__file__).resolve().parents[2]
MATERIALS_ROOT = REPO_ROOT / "apps" / "backend" / "materials" / "yki"
INDEX_PATH = MATERIALS_ROOT / "task_banks" / "task_index_v3_2.json"
REPORT_PATH = MATERIALS_ROOT / "manifest" / "task_index_rebuild_report.md"
SALVAGED_TASKS_PATH = MATERIALS_ROOT / "manifest" / "task_index_salvaged_tasks.json"
UNUSABLE_TASKS_PATH = MATERIALS_ROOT / "manifest" / "task_index_unusable_tasks.json"

DEFAULT_LEVEL_BAND = "B1_B2"
VALID_LEVEL_BANDS = {"A1_A2", "B1_B2", "C1_C2"}
DEFAULT_RUNTIME_BLUEPRINT = {
    "reading_mcq_set": 4,
    "listening_mcq_set": 4,
    "writing_prompt": 2,
    "speaking_roleplay": 2,
}

ATOMIC_TASK_TYPES = {
    "reading_mcq",
    "reading_true_false",
    "reading_open_response",
    "reading_summary",
    "listening_mcq",
    "listening_true_false",
    "listening_open_response",
    "writing_short_message",
    "writing_structured_feedback",
    "writing_descriptive_short",
    "writing_email_or_request",
    "writing_opinion_argument",
    "writing_formal_complaint",
    "writing_job_application",
    "speaking_interview_topic",
    "speaking_narrative_timed",
    "speaking_simulated_dialogue",
    "speaking_micro_situations",
    "speaking_opinion_monologue",
    "speaking_interview_discussion",
}

EXPANDED_TASK_TYPES = {
    "reading_mcq_set",
    "listening_mcq_set",
    "writing_prompt",
    "speaking_roleplay",
    "listening_short_answer",
    "reading_short_answer",
    "writing_email_formal",
    "writing_summary",
    "speaking_monologue",
}

KNOWN_TASK_TYPES = ATOMIC_TASK_TYPES | EXPANDED_TASK_TYPES | {"speaking_interview"}

PLACEHOLDER_MARKERS = (
    "placeholder",
    "täydennetään myöhemmin",
    "tehtävä täydennetään",
    "gap-fill",
    "lorem ipsum",
    "dummy text",
)


@dataclass(frozen=True)
class BankConfig:
    label: str
    root: Path
    kind: str
    priority: int


@dataclass
class IndexEntry:
    level_band: str
    skill: str
    task_type: str
    atomic_task_type: str
    task_id: str
    file_path: str
    bank_label: str
    bank_kind: str
    salvage_source: bool
    quality_status: str
    selected_for_runtime: bool = False


def _configured_path(env_var: str, default: str) -> Path:
    value = os.getenv(env_var)
    if value:
        return Path(value).expanduser().resolve()
    return Path(default).expanduser().resolve()


def _bank_configs() -> list[BankConfig]:
    return [
        BankConfig(
            label="workspace_certified_bank",
            root=_configured_path(
                "YKI_WORKSPACE_CERTIFIED_BANK_ROOT",
                str(MATERIALS_ROOT / "certified_bank"),
            ),
            kind="certified",
            priority=0,
        ),
        BankConfig(
            label="external_certified_archive",
            root=_configured_path(
                "YKI_CERTIFIED_ARCHIVE_ROOT",
                str(Path.home() / "Asiakirjat/kielitaika/yki"),
            ),
            kind="archive",
            priority=1,
        ),
        BankConfig(
            label="external_raw_bank",
            root=_configured_path(
                "YKI_RAW_BANK_ROOT",
                str(Path.home() / "Asiakirjat/kielitaika/yki_material_raw_bank"),
            ),
            kind="raw",
            priority=2,
        ),
    ]


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _iter_candidate_files(bank: BankConfig) -> list[Path]:
    if not bank.root.exists():
        return []
    if bank.kind == "certified":
        tasks_dir = bank.root / "tasks"
        if not tasks_dir.exists():
            return []
        return sorted(tasks_dir.rglob("*.json"))
    if bank.kind == "raw":
        files: list[Path] = []
        for section in ("reading", "listening", "writing", "speaking", "unknown"):
            section_dir = bank.root / section
            if section_dir.exists():
                files.extend(sorted(section_dir.glob("*.json")))
        return files
    files: list[Path] = []
    for tasks_dir in sorted(bank.root.rglob("tasks")):
        if tasks_dir.is_dir():
            files.extend(sorted(tasks_dir.glob("*.json")))
    return files


def _text_values(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        texts: list[str] = []
        for nested in value.values():
            texts.extend(_text_values(nested))
        return texts
    if isinstance(value, list):
        texts: list[str] = []
        for nested in value:
            texts.extend(_text_values(nested))
        return texts
    return []


def _first_non_empty(*values: Any) -> Any:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
        if value not in (None, "", [], {}):
            return value
    return None


def _infer_level_band(task: dict[str, Any]) -> str | None:
    candidates = [
        task.get("level_band"),
        (task.get("content") or {}).get("level_band"),
    ]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return None


def _infer_skill(task: dict[str, Any], task_type: str, path: Path) -> str | None:
    candidates = [task.get("skill")]
    if task_type and "_" in task_type:
        candidates.append(task_type.split("_", 1)[0])
    for part in path.parts:
        if part in {"reading", "listening", "writing", "speaking"}:
            candidates.append(part)
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return None


def _question_list(task: dict[str, Any]) -> list[dict[str, Any]]:
    content = task.get("content")
    if isinstance(content, dict):
        for key in ("questions", "items"):
            value = content.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    for key in ("questions", "items"):
        value = task.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _materials_text(task: dict[str, Any]) -> str:
    content = task.get("content")
    materials: dict[str, Any] = {}
    if isinstance(content, dict):
        value = content.get("materials")
        if isinstance(value, dict):
            materials = value
    task_materials = task.get("materials")
    if isinstance(task_materials, dict):
        materials = {**task_materials, **materials}
    return str(
        _first_non_empty(
            materials.get("text"),
            materials.get("scenario"),
            materials.get("transcript"),
            materials.get("audioTranscript"),
            content.get("script") if isinstance(content, dict) else None,
            content.get("passage") if isinstance(content, dict) else None,
            content.get("scenario") if isinstance(content, dict) else None,
            task.get("passage_fi"),
            task.get("scenario_fi"),
        )
        or ""
    )


def _prompt_text(task: dict[str, Any]) -> str:
    content = task.get("content")
    prompt = task.get("prompt")
    if isinstance(content, dict):
        prompt = _first_non_empty(prompt, content.get("prompt"))
    prompt_dict = prompt if isinstance(prompt, dict) else {}
    return str(
        _first_non_empty(
            prompt if isinstance(prompt, str) else None,
            prompt_dict.get("instruction"),
            prompt_dict.get("instruction_fi"),
            prompt_dict.get("topic"),
            task.get("instruction"),
            task.get("instructions_fi"),
            task.get("title"),
            task.get("scenario_fi"),
            task.get("ai_first_turn_fi"),
            content.get("scenario") if isinstance(content, dict) else None,
            content.get("ai_first_turn_fi") if isinstance(content, dict) else None,
            content.get("instruction") if isinstance(content, dict) else None,
        )
        or ""
    )


def _user_facing_payload(task: dict[str, Any]) -> dict[str, Any]:
    return {
        "prompt": task.get("prompt"),
        "content": task.get("content"),
        "materials": task.get("materials"),
        "items": task.get("items"),
        "instruction": task.get("instruction"),
        "instructions_fi": task.get("instructions_fi"),
        "title": task.get("title"),
        "passage_fi": task.get("passage_fi"),
        "scenario_fi": task.get("scenario_fi"),
        "ai_first_turn_fi": task.get("ai_first_turn_fi"),
    }


def _has_placeholder_text(task: dict[str, Any]) -> bool:
    for text in _text_values(_user_facing_payload(task)):
        lowered = text.casefold()
        if any(marker in lowered for marker in PLACEHOLDER_MARKERS):
            return True
    return False


def _has_valid_mcq_questions(task: dict[str, Any], minimum: int) -> bool:
    questions = _question_list(task)
    if len(questions) < minimum:
        return False
    for question in questions:
        prompt = _first_non_empty(
            question.get("prompt"),
            question.get("question"),
            question.get("question_fi"),
            question.get("statement"),
        )
        options = _first_non_empty(question.get("options"), question.get("choices"), question.get("choices_fi"))
        correct_index = _first_non_empty(
            question.get("correct_index"),
            question.get("correctIndex"),
        )
        if not isinstance(prompt, str) or not prompt.strip():
            return False
        if not isinstance(options, list) or len(options) < 2:
            return False
        if not isinstance(correct_index, int) or not 0 <= correct_index < len(options):
            return False
    return True


def _has_valid_boolean_questions(task: dict[str, Any], minimum: int) -> bool:
    questions = _question_list(task)
    if len(questions) < minimum:
        return False
    for question in questions:
        prompt = _first_non_empty(
            question.get("prompt"),
            question.get("question"),
            question.get("statement"),
        )
        answer = _first_non_empty(
            question.get("correct_answer"),
            question.get("correctAnswer"),
            question.get("correctBoolean"),
            question.get("truth_value"),
        )
        if not isinstance(prompt, str) or not prompt.strip():
            return False
        if not isinstance(answer, bool):
            return False
    return True


def _is_structurally_usable(task: dict[str, Any], task_type: str) -> list[str]:
    reasons: list[str] = []
    if _has_placeholder_text(task):
        reasons.append("contains_placeholder_text")

    prompt_text = _prompt_text(task)
    materials_text = _materials_text(task)

    if task_type in {"reading_mcq_set", "listening_mcq_set"}:
        if not _has_valid_mcq_questions(task, minimum=3):
            reasons.append("invalid_mcq_set_structure")
        if not materials_text:
            reasons.append("missing_source_material")
        return reasons

    if task_type in {"reading_mcq", "listening_mcq"}:
        if not _has_valid_mcq_questions(task, minimum=1):
            reasons.append("invalid_mcq_structure")
        if not materials_text:
            reasons.append("missing_source_material")
        return reasons

    if task_type in {"reading_true_false", "listening_true_false"}:
        if not _has_valid_boolean_questions(task, minimum=3):
            reasons.append("invalid_true_false_structure")
        if not materials_text:
            reasons.append("missing_source_material")
        return reasons

    if task_type in {"reading_open_response", "reading_short_answer", "reading_summary"}:
        if not prompt_text:
            reasons.append("missing_reading_prompt")
        if not materials_text:
            reasons.append("missing_source_material")
        return reasons

    if task_type in {"listening_open_response", "listening_short_answer"}:
        if not prompt_text:
            reasons.append("missing_listening_prompt")
        if not materials_text:
            reasons.append("missing_source_material")
        return reasons

    if task_type.startswith("writing_"):
        if not prompt_text:
            reasons.append("missing_writing_prompt")
        return reasons

    if task_type.startswith("speaking_"):
        if not prompt_text and not materials_text:
            reasons.append("missing_speaking_prompt")
        return reasons

    reasons.append("unknown_task_type")
    return reasons


def _infer_atomic_from_prompt(task_type: str, task: dict[str, Any]) -> str:
    text = " ".join(_text_values({"prompt": task.get("prompt"), "content": task.get("content")})).casefold()
    if task_type == "reading_mcq_set":
        return "reading_mcq"
    if task_type == "listening_mcq_set":
        return "listening_mcq"
    if task_type == "reading_short_answer":
        return "reading_open_response"
    if task_type == "listening_short_answer":
        return "listening_open_response"
    if task_type == "writing_email_formal":
        return "writing_email_or_request"
    if task_type == "writing_summary":
        return "writing_descriptive_short"
    if task_type == "speaking_roleplay":
        return "speaking_simulated_dialogue"
    if task_type == "speaking_monologue":
        if any(token in text for token in ("mielipide", "kanta", "argument", "agree", "disagree")):
            return "speaking_opinion_monologue"
        if any(token in text for token in ("tarina", "kuvaile", "story", "narrative", "kertoa")):
            return "speaking_narrative_timed"
        return "speaking_interview_topic"
    if task_type == "writing_prompt":
        if any(token in text for token in ("hakemus", "työhakemus", "job application")):
            return "writing_job_application"
        if any(token in text for token in ("valitus", "reklamaatio", "complaint")):
            return "writing_formal_complaint"
        if any(token in text for token in ("mielipide", "kannanotto", "argument", "editor")):
            return "writing_opinion_argument"
        if any(token in text for token in ("palaute", "feedback")):
            return "writing_structured_feedback"
        if any(token in text for token in ("sähköposti", "email", "viesti", "request", "pyyntö")):
            return "writing_email_or_request"
        return "writing_descriptive_short"
    return task_type


def _infer_atomic_task_type(task_type: str, task: dict[str, Any]) -> str:
    if task_type in ATOMIC_TASK_TYPES:
        return task_type
    if task_type == "speaking_interview":
        return "speaking_interview_topic"
    return _infer_atomic_from_prompt(task_type, task)


def _quality_status(task: dict[str, Any]) -> str:
    quality = task.get("quality")
    if isinstance(quality, dict):
        certification = quality.get("certification")
        if isinstance(certification, dict):
            status = certification.get("status")
            if isinstance(status, str) and status.strip():
                return status.strip()
    if isinstance(quality, str) and quality.strip():
        return quality.strip()
    source = task.get("source")
    if isinstance(source, dict):
        origin = _first_non_empty(source.get("origin"), source.get("generator"), source.get("created_by"))
        if isinstance(origin, str) and origin:
            return origin
    if isinstance(source, str) and source.strip():
        return source.strip()
    return "unknown"


def _task_id(task: dict[str, Any], path: Path) -> str | None:
    candidates = [
        task.get("id"),
        task.get("task_id"),
        task.get("_legacy_id"),
    ]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    if path.stem:
        return path.stem
    return None


def _scan_bank(bank: BankConfig) -> dict[str, Any]:
    accepted: list[IndexEntry] = []
    rejected: list[dict[str, Any]] = []
    stats = Counter()

    for path in _iter_candidate_files(bank):
        stats["files_scanned"] += 1
        try:
            payload = _load_json(path)
        except Exception as exc:
            rejected.append(
                {
                    "bank_label": bank.label,
                    "file_path": str(path.resolve()),
                    "reason": [f"json_load_error:{exc.__class__.__name__}"],
                }
            )
            stats["rejected"] += 1
            continue

        if not isinstance(payload, dict):
            rejected.append(
                {
                    "bank_label": bank.label,
                    "file_path": str(path.resolve()),
                    "reason": ["non_object_payload"],
                }
            )
            stats["rejected"] += 1
            continue

        if bank.kind == "certified":
            validation = validate_task_v3_2(payload)
            semantic = validate_task_semantics_v3_2(payload)
            reasons: list[str] = []
            if not validation.structural_pass:
                reasons.extend(f"structural:{error}" for error in validation.structural_errors)
            if validation.structural_pass and not validation.blueprint_pass:
                reasons.extend(f"blueprint:{error}" for error in validation.blueprint_errors)
            if not semantic.semantic_pass:
                reasons.extend(f"semantic:{error}" for error in semantic.semantic_errors)
            if reasons:
                rejected.append(
                    {
                        "bank_label": bank.label,
                        "file_path": str(path.resolve()),
                        "reason": reasons,
                    }
                )
                stats["rejected"] += 1
                continue

        if "original_payload" in payload or payload.get("rejection_reason"):
            rejected.append(
                {
                    "bank_label": bank.label,
                    "file_path": str(path.resolve()),
                    "task_id": _task_id(payload, path),
                    "task_type": payload.get("task_type"),
                    "reason": ["rejection_wrapper"],
                }
            )
            stats["rejected"] += 1
            continue

        task_type = payload.get("task_type")
        task_id = _task_id(payload, path)
        level_band = _infer_level_band(payload)
        skill = _infer_skill(payload, str(task_type or ""), path)

        reasons: list[str] = []
        if not task_type:
            reasons.append("missing_task_type")
        elif task_type not in KNOWN_TASK_TYPES:
            reasons.append("unsupported_task_type")
        if not task_id:
            reasons.append("missing_task_id")
        if not level_band:
            reasons.append("missing_level_band")
        elif level_band not in VALID_LEVEL_BANDS:
            reasons.append("unsupported_level_band")
        if not skill:
            reasons.append("missing_skill")
        if not reasons and task_type:
            reasons.extend(_is_structurally_usable(payload, task_type))

        if reasons:
            rejected.append(
                {
                    "bank_label": bank.label,
                    "file_path": str(path.resolve()),
                    "task_id": task_id,
                    "task_type": task_type,
                    "reason": reasons,
                }
            )
            stats["rejected"] += 1
            continue

        accepted.append(
            IndexEntry(
                level_band=level_band or "",
                skill=skill or "",
                task_type=str(task_type),
                atomic_task_type=_infer_atomic_task_type(str(task_type), payload),
                task_id=task_id or "",
                file_path=str(path.resolve()),
                bank_label=bank.label,
                bank_kind=bank.kind,
                salvage_source=bank.kind != "certified",
                quality_status=_quality_status(payload),
            )
        )
        stats["accepted"] += 1

    return {
        "bank": bank,
        "accepted": accepted,
        "rejected": rejected,
        "stats": stats,
    }


def _select_runtime_entries(scan_results: list[dict[str, Any]]) -> list[IndexEntry]:
    priority_by_bank = {result["bank"].label: result["bank"].priority for result in scan_results}
    selected: dict[tuple[str, str], IndexEntry] = {}

    for result in scan_results:
        for entry in result["accepted"]:
            key = (entry.task_type, entry.task_id)
            current = selected.get(key)
            if current is None:
                selected[key] = entry
                continue
            current_priority = priority_by_bank[current.bank_label]
            candidate_priority = priority_by_bank[entry.bank_label]
            if candidate_priority < current_priority:
                selected[key] = entry

    chosen = list(selected.values())
    for entry in chosen:
        entry.selected_for_runtime = True
    return chosen


def _runtime_index(entries: list[IndexEntry]) -> dict[str, dict[str, list[list[str]]]]:
    grouped: dict[str, dict[str, list[list[str]]]] = defaultdict(lambda: defaultdict(list))
    for entry in sorted(entries, key=lambda item: (item.level_band, item.task_type, item.task_id)):
        grouped[entry.level_band][entry.task_type].append([entry.file_path, entry.task_id])
    return {level: dict(task_types) for level, task_types in grouped.items()}


def _atomic_inventory(entries: list[IndexEntry]) -> dict[str, int]:
    counts = Counter(entry.atomic_task_type for entry in entries)
    return {task_type: counts.get(task_type, 0) for task_type in sorted(ATOMIC_TASK_TYPES)}


def _bank_salvage_summary(scan_results: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    summary: dict[str, dict[str, int]] = {}
    for result in scan_results:
        accepted = len(result["accepted"])
        rejected = len(result["rejected"])
        summary[result["bank"].label] = {
            "accepted": accepted,
            "rejected": rejected,
        }
    return summary


def _selected_salvaged_entries(entries: list[IndexEntry]) -> list[dict[str, Any]]:
    salvaged = [
        asdict(entry)
        for entry in entries
        if entry.salvage_source
    ]
    return sorted(salvaged, key=lambda item: (item["bank_label"], item["level_band"], item["task_type"], item["task_id"]))


def _runtime_blueprint_requirements() -> dict[str, int]:
    try:
        from engine.blueprints.loader import load_blueprint

        blueprint = load_blueprint("B1_B2_blueprint_v1")
        counts: dict[str, int] = {}
        for section in (blueprint.get("sections") or {}).values():
            if isinstance(section, dict):
                for task_type, count in section.items():
                    if isinstance(count, int) and count > 0:
                        counts[task_type] = count
        return counts or dict(DEFAULT_RUNTIME_BLUEPRINT)
    except Exception:
        return dict(DEFAULT_RUNTIME_BLUEPRINT)


def _blueprint_coverage(runtime_index: dict[str, dict[str, list[list[str]]]], level_band: str) -> dict[str, dict[str, int | bool]]:
    requirements = _runtime_blueprint_requirements()
    level_index = runtime_index.get(level_band, {})
    coverage: dict[str, dict[str, int | bool]] = {}
    for task_type, required in requirements.items():
        available = len(level_index.get(task_type, []))
        coverage[task_type] = {
            "required": required,
            "available": available,
            "satisfied": available >= required,
        }
    return coverage


def validate_index_payload(payload: dict[str, Any], strict: bool = False, level_band: str = DEFAULT_LEVEL_BAND) -> list[str]:
    errors: list[str] = []
    runtime_index = payload.get("runtime_index")
    if not isinstance(runtime_index, dict):
        errors.append("missing_runtime_index")
        return errors
    if level_band not in runtime_index:
        errors.append(f"missing_level_band:{level_band}")
    coverage = _blueprint_coverage(runtime_index, level_band)
    if strict:
        for task_type, status in coverage.items():
            if not status["satisfied"]:
                errors.append(
                    f"insufficient_pool:{level_band}:{task_type}:{status['available']}/{status['required']}"
                )
    return errors


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def _schema_markdown() -> str:
    return """```json
{
  "version": "3.2.0",
  "generated_at": "2026-03-12T00:00:00+00:00",
  "entry_schema": [
    "level_band",
    "skill",
    "task_type",
    "atomic_task_type",
    "task_id",
    "file_path",
    "bank_label",
    "bank_kind",
    "salvage_source",
    "quality_status",
    "selected_for_runtime"
  ],
  "entries": [
    {
      "level_band": "B1_B2",
      "skill": "reading",
      "task_type": "reading_mcq_set",
      "atomic_task_type": "reading_mcq",
      "task_id": "example-id",
      "file_path": "/abs/path/to/task.json",
      "bank_label": "workspace_certified_bank",
      "bank_kind": "certified",
      "salvage_source": false,
      "quality_status": "unknown",
      "selected_for_runtime": true
    }
  ],
  "runtime_index": {
    "B1_B2": {
      "reading_mcq_set": [
        ["/abs/path/to/task.json", "example-id"]
      ]
    }
  }
}
```"""


def _render_report(payload: dict[str, Any], scan_results: list[dict[str, Any]]) -> str:
    atomic_inventory = payload["statistics"]["atomic_inventory"]
    salvage_summary = payload["statistics"]["salvage_summary"]
    coverage = payload["statistics"]["blueprint_coverage"]
    missing = [
        task_type
        for task_type, status in coverage.items()
        if not status["satisfied"]
    ]

    lines = [
        "# Task Index Rebuild Report",
        "",
        f"Generated at: {payload['generated_at']}",
        "",
        "## SECTION 1 — Index Schema",
        "",
        "The runtime now loads `runtime_index` from `apps/backend/materials/yki/task_banks/task_index_v3_2.json`. Each audited entry also records the atomic classification and source bank used during rebuild.",
        "",
        _schema_markdown(),
        "",
        "## SECTION 2 — Atomic Task Inventory",
        "",
        "| Atomic task type | Count |",
        "| --- | ---: |",
    ]
    for task_type, count in atomic_inventory.items():
        lines.append(f"| {task_type} | {count} |")

    lines.extend(
        [
            "",
            "## SECTION 3 — Bank Salvage Results",
            "",
            "| Bank | Accepted usable tasks | Rejected unusable tasks |",
            "| --- | ---: | ---: |",
        ]
    )
    for bank_label, counts in salvage_summary.items():
        lines.append(f"| {bank_label} | {counts['accepted']} | {counts['rejected']} |")

    listening_coverage = coverage.get("listening_mcq_set", {"available": 0, "required": 0, "satisfied": False})
    lines.extend(
        [
            "",
            "## SECTION 4 — Missing Critical Pools",
            "",
            f"- `listening_mcq_set`: available `{listening_coverage['available']}`, required `{listening_coverage['required']}`, satisfied `{listening_coverage['satisfied']}`.",
        ]
    )
    if missing:
        lines.append(f"- Pools still below blueprint minimum: {', '.join(sorted(missing))}.")
    else:
        lines.append("- No critical pools are below the blueprint minimum after rebuild.")

    lines.extend(
        [
            "",
            "## SECTION 5 — Blueprint Compatibility",
            "",
            "| Blueprint pool | Required | Available | Satisfied |",
            "| --- | ---: | ---: | --- |",
        ]
    )
    for task_type, status in coverage.items():
        lines.append(
            f"| {task_type} | {status['required']} | {status['available']} | {status['satisfied']} |"
        )

    lines.extend(
        [
            "",
            "## SECTION 6 — Runtime Safety Checks",
            "",
            "- Validate that `apps/backend/materials/yki/task_banks/task_index_v3_2.json` exists at server startup.",
            "- If the index is missing or malformed, run `build_task_index_v3_2` automatically before serving traffic.",
            "- Reject startup when blueprint pools for `B1_B2` do not meet minimum counts.",
            "- Re-validate the selected task payloads for placeholder markers and empty content during every rebuild.",
            "- Keep explicit `task_index_salvaged_tasks.json` and `task_index_unusable_tasks.json` audit trails so runtime repairs remain explainable.",
        ]
    )

    rejected_total = sum(len(result["rejected"]) for result in scan_results)
    lines.extend(
        [
            "",
            f"Rejected unusable task records written: `{rejected_total}`.",
            f"Selected salvaged task records written: `{len(payload['selected_salvaged_tasks'])}`.",
        ]
    )
    return "\n".join(lines) + "\n"


def build_index(
    index_path: Path = INDEX_PATH,
    report_path: Path = REPORT_PATH,
    salvaged_path: Path = SALVAGED_TASKS_PATH,
    unusable_path: Path = UNUSABLE_TASKS_PATH,
) -> dict[str, Any]:
    scan_results = [_scan_bank(bank) for bank in _bank_configs()]
    selected_entries = _select_runtime_entries(scan_results)
    runtime_index = _runtime_index(selected_entries)

    entries = [
        asdict(entry)
        for result in scan_results
        for entry in result["accepted"]
    ]
    entries.sort(key=lambda item: (item["bank_label"], item["level_band"], item["task_type"], item["task_id"]))

    unusable_tasks = [
        rejected
        for result in scan_results
        for rejected in result["rejected"]
    ]
    unusable_tasks.sort(key=lambda item: (item["bank_label"], item["file_path"]))

    payload = {
        "version": "3.2.0",
        "generated_at": _utc_now(),
        "entry_schema": [
            "level_band",
            "skill",
            "task_type",
            "atomic_task_type",
            "task_id",
            "file_path",
            "bank_label",
            "bank_kind",
            "salvage_source",
            "quality_status",
            "selected_for_runtime",
        ],
        "sources": [
            {
                "label": result["bank"].label,
                "root": str(result["bank"].root),
                "kind": result["bank"].kind,
                "priority": result["bank"].priority,
                **dict(result["stats"]),
            }
            for result in scan_results
        ],
        "entries": entries,
        "runtime_index": runtime_index,
        "statistics": {
            "selected_runtime_entries": len(selected_entries),
            "atomic_inventory": _atomic_inventory(selected_entries),
            "salvage_summary": _bank_salvage_summary(scan_results),
            "blueprint_coverage": _blueprint_coverage(runtime_index, DEFAULT_LEVEL_BAND),
        },
        "selected_salvaged_tasks": _selected_salvaged_entries(selected_entries),
    }

    _write_json(index_path, payload)
    _write_json(salvaged_path, payload["selected_salvaged_tasks"])
    _write_json(unusable_path, unusable_tasks)
    report_path.write_text(_render_report(payload, scan_results), encoding="utf-8")
    return payload


def ensure_task_index_v3_2(strict: bool = False) -> dict[str, Any]:
    payload: dict[str, Any] | None = None
    if INDEX_PATH.exists():
        try:
            loaded = _load_json(INDEX_PATH)
            if isinstance(loaded, dict):
                payload = loaded
        except Exception:
            payload = None

    if payload is None:
        payload = build_index()

    errors = validate_index_payload(payload, strict=strict)
    if errors:
        payload = build_index()
        errors = validate_index_payload(payload, strict=strict)
        if errors:
            raise RuntimeError(
                "Task index validation failed: " + ", ".join(errors)
            )
    return payload


def main() -> None:
    payload = build_index()
    coverage = payload["statistics"]["blueprint_coverage"]
    print("=== TASK INDEX BUILT ===")
    print("index_file:", INDEX_PATH)
    print("report_file:", REPORT_PATH)
    print("salvaged_tasks_file:", SALVAGED_TASKS_PATH)
    print("unusable_tasks_file:", UNUSABLE_TASKS_PATH)
    print("runtime_entries:", payload["statistics"]["selected_runtime_entries"])
    for task_type, status in coverage.items():
        print(
            f"coverage {task_type}: {status['available']}/{status['required']} "
            f"satisfied={status['satisfied']}"
        )


if __name__ == "__main__":
    main()
