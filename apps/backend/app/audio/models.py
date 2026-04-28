from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass(frozen=True)
class AudioAsset:
    id: str
    text_hash: str
    source_text: str
    speaker_id: str
    speaker_label: str
    voice_profile: str
    voice_id: str
    provider: str
    speaking_style: str
    speed: float
    context_type: str
    file_path: Path
    duration_seconds: float
    media_type: str
    created_at: datetime


@dataclass(frozen=True)
class DialogueTurn:
    speaker_id: str
    speaker_label: str
    text: str


@dataclass(frozen=True)
class DialogueSegment:
    asset: AudioAsset
    sequence_index: int
    pause_after_ms: int


@dataclass(frozen=True)
class DialogueBundle:
    speaker_order: list[tuple[str, str, str]]
    segments: list[DialogueSegment]
    total_duration_seconds: float
