from __future__ import annotations

import os
import re
from typing import Any

from engine.media.voice_profiles import (
    VOICE_PROFILES,
    YKI_STANDARD_FEMALE,
    YKI_STANDARD_MALE,
)


DEFAULT_ROLE_VOICE_PROFILES = {
    "teacher": YKI_STANDARD_FEMALE.name,
    "customer": YKI_STANDARD_MALE.name,
    "coworker": YKI_STANDARD_FEMALE.name,
    "colleague": YKI_STANDARD_MALE.name,
    "doctor": YKI_STANDARD_MALE.name,
    "nurse": YKI_STANDARD_FEMALE.name,
    "partner": YKI_STANDARD_FEMALE.name,
}


def normalize_role_name(value: Any) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower())
    return normalized.strip("_")


def role_voice_profile(role: Any, fallback: str = YKI_STANDARD_FEMALE.name) -> str:
    normalized_role = normalize_role_name(role)
    if not normalized_role:
        return fallback

    env_name = f"YKI_VOICE_PROFILE_{normalized_role.upper()}"
    configured_profile = str(os.getenv(env_name, "")).strip()
    if configured_profile in VOICE_PROFILES:
        return configured_profile

    return DEFAULT_ROLE_VOICE_PROFILES.get(normalized_role, fallback)


def ensure_voice_profile(profile_name: Any, *, role: Any = None, fallback: str = YKI_STANDARD_FEMALE.name) -> str:
    normalized_profile = str(profile_name or "").strip()
    if normalized_profile in VOICE_PROFILES:
        return normalized_profile
    return role_voice_profile(role, fallback=fallback)


def voice_hint_for_profile(profile_name: Any) -> str:
    normalized = str(profile_name or "").strip().lower()
    return "male" if "male" in normalized else "female"
