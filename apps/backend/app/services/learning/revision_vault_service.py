from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Literal, Sequence

Section = Literal["reading", "listening", "writing", "speaking", "grammar", "vocabulary"]


@dataclass(frozen=True)
class RevisionEntry:
    entry_id: str
    section: Section
    prompt: str
    learner_answer: str
    expected_answer: str
    explanation: str
    mistake_count: int
    last_seen_on: date
    confidence: float


@dataclass(frozen=True)
class RevisionQueueItem:
    entry_id: str
    priority_score: int
    bucket: Literal["urgent", "soon", "light"]
    repair_action: str
    section: Section
    prompt: str
    explanation: str


_REPAIR_ACTIONS = {
    "reading": "Re-read for evidence and paraphrase the answer before choosing.",
    "listening": "Replay mentally from notes, then summarise the gist in Finnish.",
    "writing": "Rewrite the sentence with one clearer connector and one corrected form.",
    "speaking": "Say the repaired answer aloud twice with a slower first pass.",
    "grammar": "Create three new example sentences using the corrected pattern.",
    "vocabulary": "Use the missing word in two work-related and one everyday sentence.",
}


def prioritise_revision(entries: Sequence[RevisionEntry], today: date | None = None) -> list[RevisionQueueItem]:
    today = today or date.today()
    ranked: list[RevisionQueueItem] = []

    for entry in entries:
        age_days = max(0, (today - entry.last_seen_on).days)
        priority = round(entry.mistake_count * 12 + age_days * 1.5 + (1 - entry.confidence) * 22)
        if priority >= 45:
            bucket: Literal["urgent", "soon", "light"] = "urgent"
        elif priority >= 25:
            bucket = "soon"
        else:
            bucket = "light"

        ranked.append(
            RevisionQueueItem(
                entry_id=entry.entry_id,
                priority_score=priority,
                bucket=bucket,
                repair_action=_REPAIR_ACTIONS[entry.section],
                section=entry.section,
                prompt=entry.prompt,
                explanation=entry.explanation,
            )
        )

    return sorted(ranked, key=lambda item: item.priority_score, reverse=True)
