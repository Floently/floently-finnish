from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal
from uuid import uuid4

from .models import PhraseBankEntry
from .repository import repository

PhraseCategory = Literal["speaking", "writing", "repair", "workplace", "exam"]
PhraseStatus = Literal["new", "practising", "ready"]


@dataclass(frozen=True)
class PhraseEntry:
    phrase: str
    meaning: str
    category: PhraseCategory
    context: str
    status: PhraseStatus = "new"
    last_used_days_ago: int | None = None
    reuse_count: int = 0


@dataclass(frozen=True)
class PhraseBankState:
    active_phrases: list[PhraseEntry] = field(default_factory=list)
    review_queue: list[PhraseEntry] = field(default_factory=list)
    suggested_prompts: list[str] = field(default_factory=list)
    coaching_notes: list[str] = field(default_factory=list)


DEFAULT_PROMPTS = {
    "speaking": "Give a 45-second answer that uses this phrase naturally.",
    "writing": "Write a short message where this phrase sounds useful and not memorised.",
    "repair": "Use this phrase to recover after not understanding something.",
    "workplace": "Use this phrase in a practical work situation.",
    "exam": "Use this phrase in a YKI-style task without forcing it.",
}


def build_phrase_bank(entries: list[PhraseEntry]) -> PhraseBankState:
    ordered = sorted(
        entries,
        key=lambda item: (
            item.status == "ready",
            item.last_used_days_ago is not None and item.last_used_days_ago < 2,
            -item.reuse_count,
        ),
    )
    review_queue = [
        item
        for item in ordered
        if item.status != "ready" or (item.last_used_days_ago is not None and item.last_used_days_ago >= 4)
    ][:6]
    prompts = [f"{item.phrase}: {DEFAULT_PROMPTS[item.category]}" for item in review_queue]
    notes = [
        "Keep phrases tied to situations, not only translations.",
        "Promote a phrase to ready only after using it in both speaking and writing.",
        "Mix repair phrases with stronger content phrases so speech stays natural under pressure.",
    ]
    return PhraseBankState(
        active_phrases=ordered[:10],
        review_queue=review_queue,
        suggested_prompts=prompts,
        coaching_notes=notes,
    )


def add_phrase(*, finnish: str, english: str | None, context: str, tags: list[str]) -> dict[str, str | None | list[str]]:
    category: PhraseCategory = "workplace" if "workplace" in tags else "speaking"
    entry = PhraseBankEntry(
        id=f"phrase-{uuid4().hex[:12]}",
        finnish=finnish.strip(),
        english=(english or "").strip() or None,
        context=context.strip(),
        tags=list(tags),
    )
    repository.add_phrase(entry)
    return {
        "id": entry.id,
        "finnish": entry.finnish,
        "english": entry.english,
        "context": entry.context,
        "tags": entry.tags,
        "category": category,
    }


def list_phrases() -> list[dict]:
    return repository.list_phrase_bank()
