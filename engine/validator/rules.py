from __future__ import annotations

def validate_level_band(value: str) -> bool:
    return value in {"A1_A2", "B1_B2", "C1_C2"}
