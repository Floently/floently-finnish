from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AudioSpeaker:
    speaker_id: str
    speaker_label: str
    voice_profile: str
    # ── Multi-voice listening fix ────────────────────────────────────────
    # Optional explicit gender. When present, the TTS pipeline uses it to
    # disambiguate the voice rather than guessing from speaker_id hash.
    # Listening data files (yki_listening_*) should populate this for
    # every speaker so multi-talker dialogues render with correct gender
    # per speaker.
    gender: str | None = None


@dataclass(frozen=True)
class AudioSegment:
    asset_id: str
    url: str
    speaker_id: str
    speaker_label: str
    voice_profile: str
    sequence_index: int
    duration_seconds: float
    pause_after_ms: int


@dataclass(frozen=True)
class AudioBundle:
    audio_type: str
    asset_ids: list[str]
    duration_seconds: float
    transcript_visible: bool
    speakers: list[AudioSpeaker]
    segments: list[AudioSegment]
