from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone
import uuid
from typing import Literal

from app.services.learning.confidence_tracker_service import ConfidenceSignal, build_confidence_tracker
from app.services.learning.personal_phrase_bank_service import PhraseEntry, build_phrase_bank
from app.services.learning.revision_vault_service import RevisionEntry, prioritise_revision
from app.services.learning.study_plan_service import (
    StudyPreferences,
    StudySignal,
    build_weekly_plan,
    estimate_readiness,
)
from app.services.learning.work_track_service import list_work_tracks
from app.services.learning.workplace_incident_service import build_incident_lab

PressureBand = Literal["low", "rising", "high", "exam_simulation"]
Section = Literal["reading", "listening", "writing", "speaking"]


@dataclass(frozen=True)
class SectionPerformance:
    section: Section
    accuracy: float
    completion_rate: float
    confidence: float
    attempts: int


@dataclass(frozen=True)
class MockSegment:
    week_index: int
    focus: str
    pressure_band: PressureBand
    timed_minutes: int
    section_mix: list[Section]
    checkpoint: str
    why: str


@dataclass(frozen=True)
class MockCyclePlan:
    target_level: str
    overall_pressure: PressureBand
    readiness_score: int
    weak_sections: list[Section]
    strong_sections: list[Section]
    segments: list[MockSegment]
    coaching_notes: list[str]


_BACKEND_VERSION = "2026-04-01.backend-lock.v1"
_CONTRACT_VERSION = "2026-04-01.contract-lock.v1"
_GOVERNANCE_VERSION = "2026-04-01.governance-lock.v1"
_POLICY_VERSION = "2026-04-01.policy-lock.v1"
_DECISION_VERSION = "2026-04-01.decision-lock.v1"


def _governed_payload(data: dict) -> dict:
    return {
        "ok": True,
        "data": data,
        "error": None,
        "meta": {
            "version": _BACKEND_VERSION,
            "contract_version": _CONTRACT_VERSION,
            "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            "trace_id": str(uuid.uuid4()),
            "event_id": None,
        },
    }


def _sample_study_signals() -> list[StudySignal]:
    today = date.today()
    return [
        StudySignal("reading", 0.68, 0.59, 8, today - timedelta(days=4)),
        StudySignal("listening", 0.61, 0.52, 7, today - timedelta(days=2)),
        StudySignal("writing", 0.57, 0.48, 6, today - timedelta(days=5)),
        StudySignal("speaking", 0.54, 0.41, 5, today - timedelta(days=1)),
    ]


def _sample_confidence_signals() -> list[ConfidenceSignal]:
    return [
        ConfidenceSignal("reading", 0.74, 0.62, 0.18, 0.21),
        ConfidenceSignal("listening", 0.66, 0.51, 0.25, 0.29),
        ConfidenceSignal("writing", 0.58, 0.44, 0.31, 0.34),
        ConfidenceSignal("speaking", 0.55, 0.39, 0.34, 0.42),
    ]


def _sample_phrase_entries() -> list[PhraseEntry]:
    return [
        PhraseEntry("Voisitko tarkentaa?", "Could you clarify?", "repair", "repairing understanding", "practising", 5, 3),
        PhraseEntry("Haluan varmistaa, että ymmärsin oikein.", "I want to make sure I understood correctly.", "speaking", "confirming understanding", "practising", 3, 4),
        PhraseEntry("Liitän tähän yhteenvedon.", "I am attaching a summary.", "writing", "email follow-up", "ready", 1, 6),
        PhraseEntry("Tämä vaatii vielä tarkistuksen.", "This still needs verification.", "workplace", "status update", "new", 7, 1),
    ]


def _sample_revision_entries() -> list[RevisionEntry]:
    today = date.today()
    return [
        RevisionEntry("rv-001", "speaking", "Explain a work delay politely.", "Se tulee myöhemmin.", "Tilanne viivästyy hieman, mutta tarkistan ajan heti.", "The answer was too abrupt and lacked repair language.", 3, today - timedelta(days=6), 0.42),
        RevisionEntry("rv-002", "writing", "Write a short appointment message.", "Minä tulen huomenna 9.", "Vahvistan ajan huomiselle klo 9.", "Needed clearer formal phrasing.", 2, today - timedelta(days=4), 0.51),
        RevisionEntry("rv-003", "listening", "Summarise the main idea.", "En tiedä.", "Pääajatus oli, että aikataulu muuttui turvallisuussyistä.", "The learner missed the gist and froze under uncertainty.", 4, today - timedelta(days=7), 0.35),
    ]


def _readiness(signals: list[SectionPerformance]) -> int:
    if not signals:
        return 0
    scores = []
    for signal in signals:
        scores.append((signal.accuracy * 0.65 + signal.completion_rate * 0.2 + signal.confidence * 0.15) * 100)
    return max(0, min(100, round(sum(scores) / len(scores))))


def _risk_score(signal: SectionPerformance) -> float:
    return (
        (1 - signal.accuracy) * 55
        + (1 - signal.completion_rate) * 25
        + (1 - signal.confidence) * 15
        + max(0, 6 - signal.attempts) * 2
    )


def build_mock_exam_cycle(
    signals: list[SectionPerformance],
    target_level: str = "B1",
    weeks_until_exam: int = 6,
) -> MockCyclePlan:
    if not signals:
        signals = [
            SectionPerformance(section=s, accuracy=0.55, completion_rate=0.6, confidence=0.45, attempts=2)
            for s in ["reading", "listening", "writing", "speaking"]
        ]
    readiness_score = _readiness(signals)
    ranked = sorted(signals, key=_risk_score, reverse=True)
    weak_sections = [item.section for item in ranked[:2]]
    strong_sections = [item.section for item in sorted(ranked, key=_risk_score)[:2]]

    weeks = max(3, min(8, weeks_until_exam))
    segments: list[MockSegment] = []
    order: list[Section] = ["reading", "listening", "writing", "speaking"]
    for week_index in range(1, weeks + 1):
        if week_index <= max(1, weeks // 3):
            pressure: PressureBand = "low"
            timed_minutes = 30
            focus = "Section control and recovery language"
        elif week_index <= max(2, (weeks * 2) // 3):
            pressure = "rising"
            timed_minutes = 45
            focus = "Mixed-task stamina and transition control"
        elif week_index < weeks:
            pressure = "high"
            timed_minutes = 60
            focus = "Exam pressure rehearsal with stricter timing"
        else:
            pressure = "exam_simulation"
            timed_minutes = 75
            focus = "Full mock flow under exam-like conditions"

        section_mix = [
            weak_sections[week_index % len(weak_sections)],
            order[(week_index - 1) % len(order)],
            strong_sections[week_index % len(strong_sections)],
        ]
        deduped_mix: list[Section] = []
        for item in section_mix:
            if item not in deduped_mix:
                deduped_mix.append(item)

        checkpoint = (
            "Run a full mock and score timing, clarity, and recovery phrases."
            if pressure == "exam_simulation"
            else f"Finish one timed {weak_sections[0]} block and one mixed-skill review."
        )
        why = (
            "Pressure stays gentle so the learner can fix process gaps before harder simulations."
            if pressure == "low"
            else "Pressure is rising to build exam stamina without abandoning targeted repair."
            if pressure == "rising"
            else "This phase forces steadier output under stricter time and transition demands."
            if pressure == "high"
            else "The final week checks readiness under the closest practical exam conditions."
        )
        segments.append(MockSegment(week_index, focus, pressure, timed_minutes, deduped_mix, checkpoint, why))

    overall_pressure: PressureBand = (
        "exam_simulation"
        if readiness_score >= 78
        else "high"
        if readiness_score >= 63
        else "rising"
        if readiness_score >= 48
        else "low"
    )
    coaching_notes = [
        f"Keep {strong_sections[0]} stable with one lighter maintenance block every week.",
        f"Use {weak_sections[0]} as the anchor section for every mock cycle until timing feels calmer.",
        "Track timing stress separately from accuracy so hesitation does not hide real progress.",
    ]
    return MockCyclePlan(
        target_level, overall_pressure, readiness_score, weak_sections, strong_sections, segments, coaching_notes
    )


def get_learning_modules() -> dict:
    return _governed_payload({
        "decisionVersion": _DECISION_VERSION,
        "governanceStatus": "governed",
        "governanceVersion": _GOVERNANCE_VERSION,
        "policyVersion": _POLICY_VERSION,
        "modules": [],
    })


def start_yki_practice_session() -> dict:
    session_id = str(uuid.uuid4())
    return _governed_payload({
        "session_id": session_id,
        "current_task_index": 0,
        "isComplete": False,
        "session_hash": str(uuid.uuid4()),
        "task_sequence_hash": str(uuid.uuid4()),
        "decisionVersion": _DECISION_VERSION,
        "policyVersion": _POLICY_VERSION,
        "governanceVersion": _GOVERNANCE_VERSION,
    })


def get_yki_practice_session(session_id: str) -> dict:
    return _governed_payload({
        "session_id": session_id,
        "current_task_index": 0,
        "isComplete": False,
        "session_hash": str(uuid.uuid4()),
        "task_sequence_hash": str(uuid.uuid4()),
        "decisionVersion": _DECISION_VERSION,
        "policyVersion": _POLICY_VERSION,
        "governanceVersion": _GOVERNANCE_VERSION,
    })


def get_learning_system() -> dict:
    signals = _sample_study_signals()
    preferences = StudyPreferences(minutes_per_day=35, study_days_per_week=5, target_level="B1", work_focus="Office")
    readiness = estimate_readiness(signals, preferences)
    weekly_plan = build_weekly_plan(signals, preferences)
    return {
        "readiness": asdict(readiness),
        "weeklyPlan": asdict(weekly_plan),
        "todayAction": "Start with a 15-minute speaking repair block, then complete one timed writing task.",
        "learningLoop": ["Diagnose", "Learn", "Retrieve", "Produce", "Correct", "Schedule", "Review"],
        "decisionVersion": _DECISION_VERSION,
        "governanceStatus": "governed",
        "governanceVersion": _GOVERNANCE_VERSION,
        "policyVersion": _POLICY_VERSION,
    }


def get_learning_planner() -> dict:
    preferences = StudyPreferences(minutes_per_day=35, study_days_per_week=5, target_level="B1", work_focus="Office")
    return asdict(build_weekly_plan(_sample_study_signals(), preferences))


def get_learning_confidence() -> dict:
    return asdict(build_confidence_tracker(_sample_confidence_signals()))


def get_learning_phrase_bank() -> dict:
    return asdict(build_phrase_bank(_sample_phrase_entries()))


def add_learning_phrase(*, finnish: str, english: str, context: str, tags: list[str] | None = None) -> dict:
    phrase_bank = get_learning_phrase_bank()
    active = list(phrase_bank.get("active_phrases") or [])
    active.append(
        {
            "phrase": finnish,
            "meaning": english,
            "context": context,
            "category": (tags or ["saved"])[0],
            "status": "new",
            "reuse_count": 0,
        }
    )
    phrase_bank["active_phrases"] = active
    return phrase_bank


def get_learning_revision_vault() -> dict:
    queue = prioritise_revision(_sample_revision_entries())
    return {
        "queue": [asdict(item) for item in queue],
        "principles": [
            "Retrieve before re-reading.",
            "Repair the exact weak pattern, then reuse it in production.",
            "Schedule review while the correction is still fresh.",
        ],
    }


def get_learning_work_tracks() -> dict:
    return {"tracks": [asdict(track) for track in list_work_tracks()]}


def get_learning_workplace_incident(track: str) -> dict:
    return asdict(build_incident_lab(track))


def get_yki_exam_mock_cycle() -> dict:
    signals = [
        SectionPerformance("reading", 0.69, 0.74, 0.61, 8),
        SectionPerformance("listening", 0.62, 0.66, 0.52, 7),
        SectionPerformance("writing", 0.58, 0.63, 0.47, 6),
        SectionPerformance("speaking", 0.55, 0.58, 0.42, 5),
    ]
    return asdict(build_mock_exam_cycle(signals, target_level="B1", weeks_until_exam=6))


def get_yki_practice_overview() -> dict:
    return {
        "recommendedSections": ["speaking", "writing"],
        "nextTask": "Run one speaking prompt and one short written repair task.",
        "dailyPractice": {
            "status": "available",
            "focus": "retrieval",
            "minutes": 15,
        },
    }


def get_professional_overview() -> dict:
    tracks = [asdict(track) for track in list_work_tracks()]
    return {
        "tracks": tracks,
        "recommendedTrack": tracks[3],
        "nextMission": "Practise one office clarification scenario and write one short follow-up message.",
    }


def get_speaking_lab_overview() -> dict:
    return {
        "recordingState": "ready",
        "fluencyScore": 62,
        "repairLanguageScore": 58,
        "tasks": [
            "Answer a 45-second work clarification prompt.",
            "Repeat once using a calmer opening and one repair phrase.",
        ],
        "feedback": [
            "Use one stronger opening line before giving details.",
            "Pause once before the repair phrase so the message sounds controlled.",
        ],
    }
