from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Literal, Sequence

Section = Literal["reading", "listening", "writing", "speaking"]
ReadinessBand = Literal["not_ready", "developing", "nearly_ready", "exam_ready"]


@dataclass(frozen=True)
class StudySignal:
    section: Section
    accuracy: float
    confidence: float
    attempts: int
    last_practiced_on: date | None = None


@dataclass(frozen=True)
class StudyPreferences:
    minutes_per_day: int
    study_days_per_week: int
    target_exam_date: date | None = None
    target_level: str = "B1"
    work_focus: str | None = None


@dataclass(frozen=True)
class DailyFocusBlock:
    day_label: str
    minutes: int
    section: Section
    activity: str
    why: str


@dataclass(frozen=True)
class ReadinessSummary:
    overall_score: int
    band: ReadinessBand
    strengths: list[Section]
    risks: list[Section]
    countdown_days: int | None
    next_focus: list[str]


@dataclass(frozen=True)
class WeeklyStudyPlan:
    readiness: ReadinessSummary
    weekly_minutes: int
    focus_blocks: list[DailyFocusBlock] = field(default_factory=list)
    checkpoint_tasks: list[str] = field(default_factory=list)


SECTION_WEIGHT = {
    "reading": 1.0,
    "listening": 1.0,
    "writing": 1.2,
    "speaking": 1.25,
}


def _clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))


def _section_priority(signal: StudySignal, today: date) -> float:
    recency_penalty = 0.0
    if signal.last_practiced_on is not None:
        recency_penalty = min((today - signal.last_practiced_on).days / 21.0, 1.0) * 6

    weakness = (1 - signal.accuracy) * 55
    low_confidence = (1 - signal.confidence) * 18
    low_volume = 0 if signal.attempts >= 8 else (8 - signal.attempts) * 2
    weight = SECTION_WEIGHT[signal.section]
    return (weakness + low_confidence + low_volume + recency_penalty) * weight


def estimate_readiness(signals: Sequence[StudySignal], preferences: StudyPreferences, today: date | None = None) -> ReadinessSummary:
    today = today or date.today()

    if not signals:
        countdown = (preferences.target_exam_date - today).days if preferences.target_exam_date else None
        return ReadinessSummary(
            overall_score=0,
            band="not_ready",
            strengths=[],
            risks=["reading", "listening", "writing", "speaking"],
            countdown_days=countdown,
            next_focus=["Start with a baseline practice session in all four YKI sections."],
        )

    weighted_scores = []
    ranked_sections: list[tuple[Section, float]] = []
    for signal in signals:
        section_score = (
            signal.accuracy * 0.65 + signal.confidence * 0.20 + min(signal.attempts / 10.0, 1.0) * 0.15
        ) * 100
        weighted_scores.append(section_score * SECTION_WEIGHT[signal.section])
        ranked_sections.append((signal.section, _section_priority(signal, today)))

    readiness_score = _clamp_score(sum(weighted_scores) / sum(SECTION_WEIGHT[item.section] for item in signals))
    if readiness_score >= 80:
        band: ReadinessBand = "exam_ready"
    elif readiness_score >= 67:
        band = "nearly_ready"
    elif readiness_score >= 50:
        band = "developing"
    else:
        band = "not_ready"

    ranked_sections.sort(key=lambda item: item[1], reverse=True)
    risks = [section for section, _ in ranked_sections[:2]]
    strengths = [section for section, _ in sorted(ranked_sections, key=lambda item: item[1])[:2]]

    countdown = (preferences.target_exam_date - today).days if preferences.target_exam_date else None

    urgency = ""
    if countdown is not None:
        if countdown <= 14:
            urgency = "Use short, exam-like blocks and simulate timing every study week."
        elif countdown <= 42:
            urgency = "Alternate full-section practice with targeted repair work."

    next_focus = [
        f"Prioritise {risks[0]} repair before your next mixed practice session.",
        f"Keep {strengths[0]} warm with one lighter maintenance block this week.",
    ]
    if preferences.work_focus:
        next_focus.append(f"Blend one {preferences.work_focus.lower()} workplace vocabulary block into the weekly cycle.")
    if urgency:
        next_focus.append(urgency)

    return ReadinessSummary(
        overall_score=readiness_score,
        band=band,
        strengths=strengths,
        risks=risks,
        countdown_days=countdown,
        next_focus=next_focus,
    )


_ACTIVITY_TEMPLATES: dict[Section, list[str]] = {
    "reading": ["Timed short-text comprehension drill", "Keyword scanning and false-friend review"],
    "listening": ["One-pass listening plus note capture", "Replay-free gist extraction task"],
    "writing": ["CEFR-style response with self-check rubric", "Sentence upgrade and cohesion repair"],
    "speaking": ["Prompt response with self-recording", "Roleplay turn-taking and recovery phrases"],
}


def build_weekly_plan(signals: Sequence[StudySignal], preferences: StudyPreferences, today: date | None = None) -> WeeklyStudyPlan:
    today = today or date.today()
    readiness = estimate_readiness(signals, preferences, today=today)

    study_days = max(1, min(preferences.study_days_per_week, 7))
    daily_minutes = max(15, preferences.minutes_per_day)
    weekly_minutes = study_days * daily_minutes

    section_order = list(readiness.risks) + [section for section in ["reading", "listening", "writing", "speaking"] if section not in readiness.risks]

    focus_blocks: list[DailyFocusBlock] = []
    for index in range(study_days):
        section = section_order[index % len(section_order)]
        template = _ACTIVITY_TEMPLATES[section][index % len(_ACTIVITY_TEMPLATES[section])]
        why = "Primary risk area this week." if section in readiness.risks else "Maintenance block to prevent drift."
        focus_blocks.append(
            DailyFocusBlock(
                day_label=(today + timedelta(days=index)).strftime("%a"),
                minutes=daily_minutes,
                section=section,
                activity=template,
                why=why,
            )
        )

    checkpoint_tasks = [
        "Run one mixed four-skill checkpoint at the end of the week.",
        "Review every wrong answer in the revision vault before starting the next cycle.",
    ]
    if preferences.work_focus:
        checkpoint_tasks.append(
            f"Collect 10 field-specific phrases for {preferences.work_focus.lower()} and reuse them in one writing or speaking task."
        )

    return WeeklyStudyPlan(readiness=readiness, weekly_minutes=weekly_minutes, focus_blocks=focus_blocks, checkpoint_tasks=checkpoint_tasks)


def build_study_plan(user_id: str | None = None) -> dict:
    del user_id
    preferences = StudyPreferences(minutes_per_day=20, study_days_per_week=5)
    return build_weekly_plan(signals=[], preferences=preferences).__dict__
