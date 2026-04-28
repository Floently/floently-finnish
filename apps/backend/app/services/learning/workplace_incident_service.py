from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Track = Literal["healthcare", "retail", "hospitality", "cleaning", "construction", "office"]
Difficulty = Literal["guided", "standard", "pressured"]


@dataclass(frozen=True)
class IncidentScenario:
    track: Track
    title: str
    difficulty: Difficulty
    situation: str
    language_targets: list[str]
    response_choices: list[str]
    best_response: int
    follow_up_task: str
    why: str


@dataclass(frozen=True)
class IncidentLab:
    track: Track
    scenarios: list[IncidentScenario] = field(default_factory=list)
    coaching_notes: list[str] = field(default_factory=list)


_SCENARIOS: dict[Track, list[IncidentScenario]] = {
    "healthcare": [IncidentScenario("healthcare", "Medication timing is unclear", "standard", "A patient says they already took medicine, but the handover note is unclear.", ["clarifying politely", "confirming timing", "escalating uncertainty"], ["Give the medicine quickly so the schedule stays on time.", "Ask calm follow-up questions and confirm with the note or colleague before acting.", "Ignore the uncertainty because the patient is probably mistaken."], 1, "Write a short handover note describing the uncertainty and what you checked.", "Healthcare Finnish needs safe clarification language under pressure.")],
    "retail": [IncidentScenario("retail", "Returned item has no receipt", "guided", "A customer wants to return an item but cannot find the receipt.", ["explaining policy politely", "offering alternatives", "de-escalation"], ["Say no immediately and end the conversation.", "Explain the store policy clearly, then offer exchange or account lookup if available.", "Promise a refund even though you are not sure the policy allows it."], 1, "Practise a 30-second spoken explanation of the store policy in simple Finnish.", "Retail learners need calm policy language that keeps the interaction respectful.")],
    "hospitality": [IncidentScenario("hospitality", "Kitchen delay affects a guest order", "pressured", "A guest has waited too long and asks why their order is still missing.", ["apologising", "giving a brief explanation", "setting expectations"], ["Avoid the guest until the order is ready.", "Apologise, explain the delay briefly, and give a realistic wait estimate.", "Blame the kitchen staff in front of the guest."], 1, "Write a one-line internal message to the kitchen asking for an updated timing estimate.", "Hospitality Finnish often depends on short, calm repair language.")],
    "cleaning": [IncidentScenario("cleaning", "Room cannot be finished on time", "standard", "You discover a maintenance issue that prevents you finishing the room schedule normally.", ["reporting a problem", "describing status", "asking for instructions"], ["Leave without reporting because the issue is not your fault.", "Report the problem clearly, describe what is unfinished, and ask what to prioritise next.", "Mark the room complete even though it is not ready."], 1, "Write a short status update for a supervisor.", "Clean workplace communication often depends on clear status language more than complex grammar.")],
    "construction": [IncidentScenario("construction", "A safety instruction was not understood", "pressured", "A coworker looks unsure after a safety instruction near active work.", ["stopping unsafe action", "repeating instructions clearly", "confirming understanding"], ["Assume they understood because work cannot stop.", "Pause the task, repeat the instruction clearly, and confirm understanding before continuing.", "Tell them to ask someone else later."], 1, "Practise a spoken stop-and-repeat safety instruction with slow, clear Finnish.", "Construction Finnish needs direct, safety-first language.")],
    "office": [IncidentScenario("office", "Meeting information is inconsistent", "guided", "Two messages give different meeting times and your team is confused.", ["clarifying written information", "summarising the problem", "confirming the final version"], ["Send both times again and let others decide.", "Summarise the inconsistency, ask for one confirmed time, and resend the final update clearly.", "Ignore it and join when you think is best."], 1, "Draft a short corrected meeting update in Finnish.", "Office learners need concise clarification language for written coordination.")],
}


def build_incident_lab(track: Track) -> IncidentLab:
    scenarios = _SCENARIOS[track]
    notes = [
        "The goal is not only choosing the best answer but explaining why the other answers are risky.",
        "Repeat the scenario aloud once after reading so the learner practises both comprehension and response.",
        "Finish each scenario with a short written or spoken follow-up task.",
    ]
    return IncidentLab(track=track, scenarios=scenarios, coaching_notes=notes)
