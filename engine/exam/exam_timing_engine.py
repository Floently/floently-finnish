from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from engine.exam.exam_scoring_engine_v3_2 import get_objective_answer_map


SECTION_ORDER = ("reading", "listening", "writing", "speaking")
PRODUCTION_SECTION_DURATIONS_MINUTES = {
    "reading": 60,
    "listening": 40,
    "writing": 55,
    "speaking": 20,
}
SECTION_DURATIONS_MINUTES = dict(PRODUCTION_SECTION_DURATIONS_MINUTES)
EXAM_MODES = ("production", "test")
DEFAULT_EXAM_MODE = "production"
PRODUCTION_DURATION_PROFILE_SECONDS = {
    section: minutes * 60 for section, minutes in PRODUCTION_SECTION_DURATIONS_MINUTES.items()
}
TEST_DURATION_PROFILE_SECONDS = {
    "reading": 20,
    "listening": 20,
    "writing": 15,
    "speaking": 15,
}
EXAM_DURATION_PROFILES = {
    "production": PRODUCTION_DURATION_PROFILE_SECONDS,
    "test": TEST_DURATION_PROFILE_SECONDS,
}


class SectionTimingError(RuntimeError):
    pass


@dataclass(frozen=True)
class SectionWindow:
    section: str
    starts_at_offset_seconds: int
    ends_at_offset_seconds: int
    duration_seconds: int


def normalize_exam_mode(value: str | None) -> str:
    candidate = str(value or DEFAULT_EXAM_MODE).strip().lower()
    if candidate not in EXAM_DURATION_PROFILES:
        raise SectionTimingError(f"Unsupported exam mode: {candidate}")
    return candidate


def duration_profile_for_mode(mode: str | None = None) -> dict[str, int]:
    normalized_mode = normalize_exam_mode(mode)
    profile = EXAM_DURATION_PROFILES[normalized_mode]
    return {section: int(profile[section]) for section in SECTION_ORDER}


def normalize_duration_profile(duration_profile: dict[str, Any] | None = None) -> dict[str, int]:
    if not isinstance(duration_profile, dict):
        return duration_profile_for_mode(DEFAULT_EXAM_MODE)

    normalized: dict[str, int] = {}
    for section in SECTION_ORDER:
        value = duration_profile.get(section)
        if not isinstance(value, (int, float)):
            raise SectionTimingError(f"Missing duration for section: {section}")
        duration_seconds = int(value)
        if duration_seconds <= 0:
            raise SectionTimingError(f"Invalid duration for section {section}: {duration_seconds}")
        normalized[section] = duration_seconds
    return normalized


def total_duration_seconds(duration_profile: dict[str, Any] | None = None) -> int:
    profile = normalize_duration_profile(duration_profile)
    return sum(profile.values())


def build_timing_manifest(
    start_time: float,
    *,
    now: float | None = None,
    duration_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    current_time = time.time() if now is None else now
    profile = normalize_duration_profile(duration_profile)
    offset = 0
    sections: list[dict[str, Any]] = []
    active_section: str | None = None
    section_remaining_seconds = 0

    for section in SECTION_ORDER:
        duration_seconds = profile[section]
        starts_at = offset
        ends_at = offset + duration_seconds
        absolute_start = start_time + starts_at
        absolute_end = start_time + ends_at
        if absolute_start <= current_time < absolute_end:
            active_section = section
            section_remaining_seconds = int(absolute_end - current_time)
        sections.append(
            {
                "section": section,
                "duration_minutes": duration_seconds / 60.0,
                "duration_seconds": duration_seconds,
                "starts_at_offset_seconds": starts_at,
                "ends_at_offset_seconds": ends_at,
                "started": current_time >= absolute_start,
                "expired": current_time >= absolute_end,
            }
        )
        offset = ends_at

    total_remaining_seconds = max(0, int((start_time + total_duration_seconds(profile)) - current_time))
    return {
        "sections": sections,
        "active_section": active_section,
        "section_remaining_seconds": section_remaining_seconds,
        "total_remaining_seconds": total_remaining_seconds,
    }


def section_for_answer_id(exam: dict[str, Any], answer_id: str) -> str:
    answer_map = get_objective_answer_map(exam)
    metadata = answer_map.get(answer_id)
    if not metadata:
        raise SectionTimingError(f"Unknown answer_id: {answer_id}")
    return str(metadata["section"])


def section_for_task_id(exam: dict[str, Any], task_id: str) -> str:
    for section in SECTION_ORDER:
        for task in exam.get(section, []):
            if task.get("id") == task_id:
                return section
    raise SectionTimingError(f"Unknown task_id: {task_id}")


def assert_section_available(
    start_time: float,
    section: str,
    *,
    now: float | None = None,
    duration_profile: dict[str, Any] | None = None,
) -> None:
    current_time = time.time() if now is None else now
    profile = normalize_duration_profile(duration_profile)
    if section not in profile:
        raise SectionTimingError(f"Unknown section: {section}")

    offset = 0
    for candidate in SECTION_ORDER:
        duration_seconds = profile[candidate]
        section_start = start_time + offset
        section_end = section_start + duration_seconds
        if candidate == section:
            if current_time < section_start:
                raise SectionTimingError(f"Section {section} has not started yet")
            if current_time >= section_end:
                raise SectionTimingError(f"Section {section} deadline has passed")
            return
        offset += duration_seconds

    raise SectionTimingError(f"Unknown section: {section}")
