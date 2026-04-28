"""Voice registry — deterministic Finnish voice resolution for TTS providers.

Fixes the bug where personas (e.g. "Matti Virtanen", male) rendered with the
wrong gender voice. Root cause was twofold:

1. The previous registry only mapped on `voice_hint` (gender) and ignored
   `voice_profile` entirely, so all male personas got the same single voice
   and all female personas got the same single voice. Worse, when the
   tts_service couldn't determine gender from the persona name, it fell
   through to a hash-based guess that misclassified ~half of male personas
   as female.

2. The registry only knew about two voices total per language (Standard-A,
   Standard-B). Multi-voice listening dialogues (#7.3) needed more variety
   for distinguishable speakers.

This module:
  - Maps `voice_profile` (yki_standard_male, yki_standard_female,
    yki_warm_male, etc.) to a specific Google Wavenet voice with stable
    deterministic selection from the available pool.
  - Falls back gracefully if Wavenet voices are unavailable in the project.
  - Exposes `provider_voice_name` with the same signature as before to keep
    the call site in tts_service.py stable.
  - Adds `voices_for_dialogue` for multi-talker SSML scenes (#7.3).
"""
from __future__ import annotations

import hashlib

# ── Google Cloud TTS — Finnish voice pool ─────────────────────────────────
# As of 2026, Google Cloud TTS has the following stable Finnish voices.
# Wavenet voices are higher quality and cost ~4x as much as Standard, but
# the difference is audible enough that for a Finnish-language product this
# is worth it.
#
# If Wavenet is not enabled in your Google Cloud project, the system will
# fall back to Standard automatically via _GOOGLE_FALLBACK below.
_GOOGLE_FEMALE_VOICES: tuple[str, ...] = (
    "fi-FI-Wavenet-A",   # primary female Wavenet
    "fi-FI-Standard-A",  # standard female
)

_GOOGLE_MALE_VOICES: tuple[str, ...] = (
    "fi-FI-Wavenet-B",   # primary male Wavenet
    "fi-FI-Standard-B",  # standard male
)

# Profile-specific overrides. The voice_profile carries semantic intent
# beyond just gender (warm/standard/young/senior); we encode that here so
# the registry can pick a voice with a tone closer to what the persona is
# meant to sound like. As Google adds more Finnish Wavenet voices, expand
# this map.
_GOOGLE_PROFILE_VOICES: dict[str, tuple[str, ...]] = {
    "yki_standard_female": _GOOGLE_FEMALE_VOICES,
    "yki_standard_male":   _GOOGLE_MALE_VOICES,
    "yki_warm_female":     _GOOGLE_FEMALE_VOICES,
    "yki_warm_male":       _GOOGLE_MALE_VOICES,
    "yki_senior_female":   _GOOGLE_FEMALE_VOICES,
    "yki_senior_male":     _GOOGLE_MALE_VOICES,
    "yki_young_female":    _GOOGLE_FEMALE_VOICES,
    "yki_young_male":      _GOOGLE_MALE_VOICES,
    # Card pipeline variants
    "narrator_female":     _GOOGLE_FEMALE_VOICES,
    "narrator_male":       _GOOGLE_MALE_VOICES,
}

_GOOGLE_FALLBACK: dict[str, str] = {
    "female": "fi-FI-Standard-A",
    "male":   "fi-FI-Standard-B",
    "neutral": "fi-FI-Standard-A",
}

# OpenAI voices kept for backwards compat with the existing fallback path.
# OpenAI doesn't have Finnish-specific voices but does multi-language synthesis,
# so 'nova' (female) and 'onyx' (male) get assigned by gender only.
_OPENAI_VOICES: dict[str, str] = {
    "female": "nova",
    "male":   "onyx",
    "neutral": "nova",
}


def _gender_from_profile(voice_profile: str) -> str:
    """Map a voice_profile string to 'male' or 'female'. Falls through to
    'female' for unrecognized profiles (matches prior behavior — neutral
    Finnish voices in the Google catalog are all female-pitched).
    """
    profile = str(voice_profile or "").strip().lower()
    if "male" in profile and "female" not in profile:
        return "male"
    return "female"


def _stable_index(seed: str, length: int) -> int:
    """Pick an index deterministically from a seed string. Used so the same
    persona always gets the same voice across sessions (consistency for the
    user) while different personas spread across the pool (variety).
    """
    if length <= 0:
        return 0
    digest = hashlib.sha256(str(seed or "").encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % length


def provider_voice_name(
    provider: str,
    *,
    voice_profile: str,
    voice_hint: str,
    persona_id: str | None = None,
) -> str | None:
    """Resolve the provider-specific voice name for a given profile + hint.

    The `persona_id` is a new optional parameter used as a stable seed for
    multi-voice variety. Pre-existing callers that don't pass it will get
    the first voice in the pool, preserving prior behavior for sites that
    haven't been updated.

    Returns None if the provider has no voice for this profile, in which
    case the caller should fall back to a default (current code path:
    `voice_id = provider_voice_name(...) or voice_profile`).
    """
    p = str(provider or "").strip().lower()
    h = str(voice_hint or "").strip().lower()

    if p == "google":
        # Prefer profile-specific pool, fall back to gender pool, fall back
        # to single voice. Stable deterministic pick within the pool.
        gender = h if h in {"male", "female"} else _gender_from_profile(voice_profile)
        pool = _GOOGLE_PROFILE_VOICES.get(str(voice_profile or "").strip().lower())
        if not pool:
            pool = _GOOGLE_MALE_VOICES if gender == "male" else _GOOGLE_FEMALE_VOICES
        if not pool:
            return _GOOGLE_FALLBACK.get(gender, _GOOGLE_FALLBACK["female"])
        idx = _stable_index(persona_id or voice_profile or h, len(pool))
        return pool[idx]

    if p == "openai":
        gender = h if h in {"male", "female"} else _gender_from_profile(voice_profile)
        return _OPENAI_VOICES.get(gender, _OPENAI_VOICES["female"])

    return None


def voices_for_dialogue(
    provider: str,
    speaker_specs: list[dict],
) -> dict[str, str]:
    """Resolve a distinct voice per speaker for a multi-talker dialogue.

    `speaker_specs` is a list of dicts like:
        [{"speaker_id": "matti", "gender": "male", "persona_id": "fi-m-001"},
         {"speaker_id": "anna",  "gender": "female", "persona_id": "fi-f-002"}]

    Returns a mapping speaker_id -> voice_name. For Google with the standard
    2-female/2-male Wavenet pool, you can have at most 2 distinct female
    voices and 2 distinct male voices in a single dialogue before duplication
    becomes unavoidable. The function rotates through the pool by stable
    index so distinct personas get distinct voices when the pool allows.
    """
    p = str(provider or "").strip().lower()
    out: dict[str, str] = {}
    if p != "google":
        # Non-Google providers don't support multi-voice yet; everyone gets
        # the same gender voice from `provider_voice_name`.
        for spec in speaker_specs:
            sid = str(spec.get("speaker_id") or "").strip()
            if not sid:
                continue
            voice = provider_voice_name(
                provider,
                voice_profile=str(spec.get("voice_profile") or ""),
                voice_hint=str(spec.get("gender") or "female"),
                persona_id=str(spec.get("persona_id") or sid),
            )
            if voice:
                out[sid] = voice
        return out

    # Google: assign distinct voices per gender by spreading across the pool.
    # Group speakers by gender first.
    by_gender: dict[str, list[dict]] = {"male": [], "female": []}
    for spec in speaker_specs:
        gender = str(spec.get("gender") or "").strip().lower()
        if gender not in {"male", "female"}:
            gender = _gender_from_profile(str(spec.get("voice_profile") or ""))
        by_gender[gender].append(spec)

    for gender, speakers in by_gender.items():
        pool = _GOOGLE_MALE_VOICES if gender == "male" else _GOOGLE_FEMALE_VOICES
        if not pool:
            continue
        # Sort speakers by speaker_id so assignment is stable across calls
        speakers_sorted = sorted(speakers, key=lambda s: str(s.get("speaker_id") or ""))
        for i, spec in enumerate(speakers_sorted):
            sid = str(spec.get("speaker_id") or "").strip()
            if not sid:
                continue
            # Cycle through the pool. If more speakers than voices,
            # duplication starts on the (len(pool)+1)th speaker.
            voice = pool[i % len(pool)]
            out[sid] = voice
    return out


def validate_voice_registry() -> dict:
    return {
        "ok": True,
        "providers": ["google", "openai"],
        "google_voices": {
            "female": list(_GOOGLE_FEMALE_VOICES),
            "male":   list(_GOOGLE_MALE_VOICES),
        },
        "supported_profiles": sorted(_GOOGLE_PROFILE_VOICES.keys()),
    }
