"""
==========================================================
YKI SESSION STATE MACHINE — Server-side transition rules
==========================================================

States and allowed transitions. Invalid transitions reject requests.
"""

from __future__ import annotations

INIT = "INIT"
INTRO = "INTRO"
READING = "READING"
LISTENING = "LISTENING"
WRITING = "WRITING"
SPEAKING = "SPEAKING"
REVIEW = "REVIEW"
SUBMITTED = "SUBMITTED"
RESULTS_READY = "RESULTS_READY"

ALLOWED_TRANSITIONS = {
    INIT: (INTRO,),
    INTRO: (READING,),
    READING: (LISTENING,),
    LISTENING: (WRITING,),
    WRITING: (SPEAKING,),
    SPEAKING: (REVIEW,),
    REVIEW: (SUBMITTED,),
    SUBMITTED: (RESULTS_READY,),
    RESULTS_READY: (),
}


def event_type_to_state(event_type: str) -> str | None:
    """Map event type to resulting state (for the state after this event)."""
    mapping = {
        "SESSION_CREATED": INIT,
        "INTRO_STARTED": INTRO,
        "SECTION_STARTED": None,  # section name in payload
        "ANSWER_SUBMITTED": None,
        "AUDIO_UPLOADED": None,
        "WRITING_SUBMITTED": None,
        "SECTION_COMPLETED": None,
        "EXAM_SUBMITTED": SUBMITTED,
        "RESULTS_GENERATED": RESULTS_READY,
    }
    return mapping.get(event_type)


def can_transition(current: str, event_type: str, payload: dict) -> bool:
    """True if applying this event is allowed from current state."""
    allowed = ALLOWED_TRANSITIONS.get(current, ())
    if event_type == "SESSION_CREATED":
        return current == "" or current == INIT
    if event_type == "INTRO_STARTED":
        return current == INIT
    if event_type == "SECTION_STARTED":
        section = (payload.get("section") or "").upper()
        return section in allowed or (current == INTRO and section == "READING") or (current == READING and section == "LISTENING") or (current == LISTENING and section == "WRITING") or (current == WRITING and section == "SPEAKING") or (current == SPEAKING and section == "REVIEW")
    if event_type in ("ANSWER_SUBMITTED", "AUDIO_UPLOADED", "WRITING_SUBMITTED", "SECTION_COMPLETED"):
        return current in (READING, LISTENING, WRITING, SPEAKING, REVIEW)
    if event_type == "EXAM_SUBMITTED":
        return current == REVIEW
    if event_type == "RESULTS_GENERATED":
        return current == SUBMITTED
    return False


def next_state_after_event(current: str, event_type: str, payload: dict) -> str:
    """Compute state after applying event (for replay)."""
    if event_type == "SESSION_CREATED":
        return INIT
    if event_type == "INTRO_STARTED":
        return INTRO
    if event_type == "SECTION_STARTED":
        return (payload.get("section") or "READING").upper()
    if event_type == "EXAM_SUBMITTED":
        return SUBMITTED
    if event_type == "RESULTS_GENERATED":
        return RESULTS_READY
    return current
