from __future__ import annotations

from typing import Any


def analyze_pronunciation(
    audio_file_path: str,
    *,
    transcript: str,
    duration_seconds: float | None = None,
    reference_text: str = "",
) -> dict[str, Any]:
    expected_tokens = {token for token in str(reference_text).lower().split() if token}
    actual_tokens = {token for token in str(transcript).lower().split() if token}
    overlap = len(expected_tokens & actual_tokens)
    denominator = max(1, len(expected_tokens))
    coverage = round(overlap / denominator, 2)
    overall = round(60 + coverage * 40, 2) if transcript.strip() else 0.0
    return {
        "audio_file_path": audio_file_path,
        "transcript": transcript,
        "duration_seconds": float(duration_seconds or 0.0),
        "reference_text": reference_text,
        "overall": overall,
        "coverage": coverage,
        "provider": "fixture",
    }
