from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

SkillArea = Literal["reading", "listening", "writing", "speaking"]
ConfidenceBand = Literal["fragile", "uneven", "solid", "confident"]


@dataclass(frozen=True)
class ConfidenceSignal:
    area: SkillArea
    accuracy: float
    confidence: float
    retry_rate: float
    hesitation_rate: float


@dataclass(frozen=True)
class ConfidenceInsight:
    area: SkillArea
    knowledge_score: int
    confidence_score: int
    band: ConfidenceBand
    interpretation: str
    action: str


@dataclass(frozen=True)
class ConfidenceTrackerState:
    overall_band: ConfidenceBand
    insights: list[ConfidenceInsight] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


def _band(knowledge: int, confidence: int) -> ConfidenceBand:
    if knowledge >= 78 and confidence >= 72:
        return "confident"
    if knowledge >= 65 and confidence >= 55:
        return "solid"
    if knowledge >= 50 or confidence >= 45:
        return "uneven"
    return "fragile"


def build_confidence_tracker(signals: list[ConfidenceSignal]) -> ConfidenceTrackerState:
    if not signals:
        return ConfidenceTrackerState(
            overall_band="fragile",
            insights=[],
            notes=["No signals yet. Start with one timed and one untimed task in each major skill area."],
        )

    insights: list[ConfidenceInsight] = []
    bands: list[ConfidenceBand] = []
    for signal in signals:
        knowledge = max(0, min(100, round((signal.accuracy * 0.75 + (1 - signal.retry_rate) * 0.25) * 100)))
        confidence = max(0, min(100, round((signal.confidence * 0.7 + (1 - signal.hesitation_rate) * 0.3) * 100)))
        band = _band(knowledge, confidence)
        bands.append(band)

        if knowledge >= 65 and confidence < 50:
            interpretation = "Knowledge is better than the learner's felt confidence. Hesitation is suppressing performance."
            action = "Add short low-stakes timed reps and spoken rehearsal before harder tasks."
        elif knowledge < 55 and confidence >= 60:
            interpretation = "Confidence is running ahead of control. The learner needs deeper repair work."
            action = "Slow down, check errors carefully, and repeat targeted correction tasks."
        else:
            interpretation = "Confidence and control are moving at a similar level."
            action = "Keep a balanced cycle of timed practice and review."

        insights.append(
            ConfidenceInsight(
                area=signal.area,
                knowledge_score=knowledge,
                confidence_score=confidence,
                band=band,
                interpretation=interpretation,
                action=action,
            )
        )

    ordering = {"fragile": 0, "uneven": 1, "solid": 2, "confident": 3}
    overall_band = min(bands, key=lambda item: ordering[item])
    notes = [
        "Track confidence separately from correctness so fear and skill are not confused.",
        "Use the lowest-confidence area as a daily warm-up, not only as a weekly emergency task.",
    ]
    return ConfidenceTrackerState(overall_band=overall_band, insights=insights, notes=notes)


def classify_confidence(*, correct: bool, confidence: int | None) -> dict[str, int | str | bool]:
    normalized_confidence = max(1, min(5, int(confidence or 3)))
    if correct and normalized_confidence >= 4:
        band = "confident"
    elif correct:
        band = "solid"
    elif normalized_confidence >= 4:
        band = "uneven"
    else:
        band = "fragile"
    return {
        "correct": bool(correct),
        "confidence": normalized_confidence,
        "band": band,
    }
