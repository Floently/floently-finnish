from __future__ import annotations

from dataclasses import dataclass, field

@dataclass
class RuntimeSession:
    session_id: str
    level_band: str
    status: str = "initialized"
    answers: dict = field(default_factory=dict)
