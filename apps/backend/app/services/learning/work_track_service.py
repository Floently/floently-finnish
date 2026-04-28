from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

WorkDomain = Literal["healthcare", "construction", "cleaning", "office", "hospitality", "retail"]


@dataclass(frozen=True)
class WorkTrack:
    domain: WorkDomain
    title: str
    core_tasks: list[str]
    key_language_targets: list[str]
    speaking_scenarios: list[str]
    writing_tasks: list[str]
    vocabulary_clusters: list[str]


_TRACKS: dict[WorkDomain, WorkTrack] = {
    "healthcare": WorkTrack("healthcare", "Healthcare Finnish", ["handover updates", "symptom clarification", "patient reassurance"], ["imperatives politely", "time expressions", "condition and pain vocabulary"], ["ward handover", "explaining a procedure", "calling a colleague for support"], ["short patient note", "incident summary", "shift communication message"], ["symptoms", "body parts", "medication timing", "care instructions"]),
    "construction": WorkTrack("construction", "Construction Finnish", ["site safety", "tool requests", "task sequencing"], ["location cases", "warnings", "materials and measurement language"], ["morning site briefing", "hazard escalation", "asking for clarification"], ["work log", "delivery note", "issue escalation message"], ["tools", "measurements", "surfaces", "safety gear"]),
    "cleaning": WorkTrack("cleaning", "Cleaning and Facility Finnish", ["surface instructions", "supply reporting", "customer-facing updates"], ["sequencing", "chemicals and warnings", "polite service phrasing"], ["asking for access", "reporting a broken item", "confirming task completion"], ["cleaning checklist note", "supply request", "customer message"], ["rooms", "chemicals", "equipment", "hygiene instructions"]),
    "office": WorkTrack("office", "Office and Admin Finnish", ["calendar coordination", "status updates", "request clarification"], ["formal requests", "meeting language", "summary and follow-up phrases"], ["stand-up update", "meeting interruption repair", "handover explanation"], ["email follow-up", "meeting summary", "task update"], ["scheduling", "priorities", "documents", "stakeholder communication"]),
    "hospitality": WorkTrack("hospitality", "Hospitality Finnish", ["guest requests", "service recovery", "shift coordination"], ["service politeness", "offers and suggestions", "problem resolution language"], ["front desk check-in", "complaint handling", "kitchen-floor coordination"], ["booking note", "guest follow-up message", "shift note"], ["rooms", "food and drink", "service phrases", "complaints"]),
    "retail": WorkTrack("retail", "Retail Finnish", ["customer guidance", "returns", "stock communication"], ["questions and offers", "comparison language", "refund and return terms"], ["product recommendation", "return discussion", "stockroom coordination"], ["stock note", "customer message", "incident note"], ["sizes", "prices", "stock", "customer service"]),
}


def get_work_track(domain: WorkDomain) -> WorkTrack:
    return _TRACKS[domain]


def list_work_tracks() -> list[WorkTrack]:
    return list(_TRACKS.values())
