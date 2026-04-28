from __future__ import annotations

from pathlib import Path
from typing import Any


def transcribe_audio(audio_file_path: str | Path) -> dict[str, Any]:
    path = Path(audio_file_path)
    transcript_path = Path(f"{path}.txt")
    transcript = ""
    if transcript_path.exists():
        transcript = transcript_path.read_text(encoding="utf-8").strip()
    return {
        "transcript": transcript,
        "duration_seconds": 0.0,
        "provider": "fixture",
    }
