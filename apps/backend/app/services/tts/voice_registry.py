"""Deterministic Finnish TTS voice resolution.

KV-VOICE-002 repairs the provider-gender registry used by roleplay and future
multi-speaker practice. Provider gender metadata is curated from the provider's
published supported-voice list and must be verified before a voice is certified
for an explicitly gendered persona.

Important product rules:
- Explicit ``voice_hint`` wins over a contradictory legacy ``voice_profile``.
- A certified male profile may never resolve to a provider voice curated female,
  and vice versa.
- Persona IDs are stable selection seeds so the same persona keeps the same
  provider voice while a pool can still provide audible variety.
- This module resolves voices only. Session-level persona/voice persistence is
  KV-VOICE-003 and structured YKI multi-speaker playback is KV-VOICE-004.
"""
from __future__ import annotations

import hashlib
from typing import Literal

VoiceGender = Literal["male", "female", "neutral"]

GOOGLE_VOICE_CATALOG_URL = (
    "https://cloud.google.com/text-to-speech/docs/list-voices-and-types"
)

_GOOGLE_VOICE_GENDER: dict[str, VoiceGender] = {
    "fi-FI-Chirp3-HD-Alnilam": "male",
    "fi-FI-Chirp3-HD-Charon": "male",
    "fi-FI-Chirp3-HD-Enceladus": "male",
    "fi-FI-Chirp3-HD-Fenrir": "male",
    "fi-FI-Chirp3-HD-Aoede": "female",
    "fi-FI-Chirp3-HD-Autonoe": "female",
    "fi-FI-Chirp3-HD-Callirrhoe": "female",
    "fi-FI-Chirp3-HD-Despina": "female",
    "fi-FI-Wavenet-B": "female",
    "fi-FI-Standard-B": "female",
}

_GOOGLE_MALE_VOICES: tuple[str, ...] = tuple(
    voice for voice, gender in _GOOGLE_VOICE_GENDER.items() if gender == "male"
)
_GOOGLE_FEMALE_VOICES: tuple[str, ...] = tuple(
    voice for voice, gender in _GOOGLE_VOICE_GENDER.items() if gender == "female"
)

_GOOGLE_PROFILE_VOICES: dict[str, tuple[str, ...]] = {
    "yki_standard_female": _GOOGLE_FEMALE_VOICES,
    "yki_standard_male": _GOOGLE_MALE_VOICES,
    "yki_warm_female": _GOOGLE_FEMALE_VOICES,
    "yki_warm_male": _GOOGLE_MALE_VOICES,
    "yki_senior_female": _GOOGLE_FEMALE_VOICES,
    "yki_senior_male": _GOOGLE_MALE_VOICES,
    "yki_young_female": _GOOGLE_FEMALE_VOICES,
    "yki_young_male": _GOOGLE_MALE_VOICES,
    "narrator_female": _GOOGLE_FEMALE_VOICES,
    "narrator_male": _GOOGLE_MALE_VOICES,
}

_GOOGLE_FALLBACK: dict[VoiceGender, str] = {
    "female": "fi-FI-Standard-B",
    "male": "fi-FI-Chirp3-HD-Charon",
    "neutral": "fi-FI-Standard-B",
}

# Backwards-compatible built-in OpenAI voice selection. The current OpenAI
# API docs list these voice IDs but do not publish provider gender metadata,
# so they are intentionally not part of the certified gender registry.
_OPENAI_VOICES: dict[VoiceGender, str] = {
    "female": "nova",
    "male": "onyx",
    "neutral": "nova",
}


def _gender_from_profile(voice_profile: str) -> VoiceGender:
    profile = str(voice_profile or "").strip().lower()
    if "female" in profile:
        return "female"
    if "male" in profile:
        return "male"
    return "neutral"


def _resolved_gender(voice_hint: str, voice_profile: str) -> VoiceGender:
    hint = str(voice_hint or "").strip().lower()
    if hint in {"male", "female", "neutral"}:
        return hint
    return _gender_from_profile(voice_profile)


def _stable_index(seed: str, length: int) -> int:
    if length <= 0:
        return 0
    digest = hashlib.sha256(str(seed or "").encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % length


def google_voice_gender(voice_name: str) -> VoiceGender | None:
    return _GOOGLE_VOICE_GENDER.get(str(voice_name or "").strip())


def _google_pool_for_gender(gender: VoiceGender) -> tuple[str, ...]:
    if gender == "male":
        return _GOOGLE_MALE_VOICES
    return _GOOGLE_FEMALE_VOICES


def provider_voice_name(
    provider: str,
    *,
    voice_profile: str,
    voice_hint: str,
    persona_id: str | None = None,
) -> str | None:
    p = str(provider or "").strip().lower()
    gender = _resolved_gender(voice_hint, voice_profile)

    if p == "google":
        profile_key = str(voice_profile or "").strip().lower()
        profile_gender = _gender_from_profile(profile_key)
        pool = _GOOGLE_PROFILE_VOICES.get(profile_key)

        if not pool or (
            profile_gender in {"male", "female"}
            and gender in {"male", "female"}
            and profile_gender != gender
        ):
            pool = _google_pool_for_gender(gender)

        if not pool:
            return _GOOGLE_FALLBACK[gender]

        voice_name = pool[_stable_index(persona_id or voice_profile or gender, len(pool))]
        curated_gender = google_voice_gender(voice_name)

        if (
            gender in {"male", "female"}
            and curated_gender is not None
            and curated_gender != gender
        ):
            raise ValueError(
                f"Google voice registry gender mismatch: requested={gender} "
                f"voice={voice_name} provider_gender={curated_gender}"
            )
        return voice_name

    if p == "openai":
        return _OPENAI_VOICES.get(gender, _OPENAI_VOICES["neutral"])

    return None


def voices_for_dialogue(
    provider: str,
    speaker_specs: list[dict],
) -> dict[str, str]:
    p = str(provider or "").strip().lower()
    out: dict[str, str] = {}

    if p != "google":
        for spec in speaker_specs:
            sid = str(spec.get("speaker_id") or "").strip()
            if not sid:
                continue
            voice = provider_voice_name(
                provider,
                voice_profile=str(spec.get("voice_profile") or ""),
                voice_hint=str(spec.get("gender") or "neutral"),
                persona_id=str(spec.get("persona_id") or sid),
            )
            if voice:
                out[sid] = voice
        return out

    by_gender: dict[VoiceGender, list[dict]] = {
        "male": [],
        "female": [],
        "neutral": [],
    }
    for spec in speaker_specs:
        gender = _resolved_gender(
            str(spec.get("gender") or ""),
            str(spec.get("voice_profile") or ""),
        )
        by_gender[gender].append(spec)

    for gender, speakers in by_gender.items():
        pool = _google_pool_for_gender(gender)
        if not pool:
            continue

        speakers_sorted = sorted(
            speakers,
            key=lambda spec: str(spec.get("speaker_id") or ""),
        )
        for index, spec in enumerate(speakers_sorted):
            sid = str(spec.get("speaker_id") or "").strip()
            if not sid:
                continue
            voice_name = pool[index % len(pool)]
            curated_gender = google_voice_gender(voice_name)
            if (
                gender in {"male", "female"}
                and curated_gender is not None
                and curated_gender != gender
            ):
                raise ValueError(
                    f"Dialogue voice registry gender mismatch: "
                    f"speaker={sid} requested={gender} voice={voice_name} "
                    f"provider_gender={curated_gender}"
                )
            out[sid] = voice_name

    return out


def validate_voice_registry() -> dict:
    errors: list[str] = []

    if not _GOOGLE_MALE_VOICES:
        errors.append("google_male_pool_empty")
    if not _GOOGLE_FEMALE_VOICES:
        errors.append("google_female_pool_empty")

    for voice_name in _GOOGLE_MALE_VOICES:
        if google_voice_gender(voice_name) != "male":
            errors.append(f"male_pool_mismatch:{voice_name}")
    for voice_name in _GOOGLE_FEMALE_VOICES:
        if google_voice_gender(voice_name) != "female":
            errors.append(f"female_pool_mismatch:{voice_name}")

    if google_voice_gender("fi-FI-Standard-B") != "female":
        errors.append("standard_b_must_be_female")
    if google_voice_gender("fi-FI-Wavenet-B") != "female":
        errors.append("wavenet_b_must_be_female")

    return {
        "ok": not errors,
        "errors": errors,
        "providers": ["google", "openai"],
        "google_catalog_url": GOOGLE_VOICE_CATALOG_URL,
        "google_voices": {
            "female": list(_GOOGLE_FEMALE_VOICES),
            "male": list(_GOOGLE_MALE_VOICES),
        },
        "google_voice_gender": dict(_GOOGLE_VOICE_GENDER),
        "supported_profiles": sorted(_GOOGLE_PROFILE_VOICES.keys()),
        "openai_gender_certified": False,
    }
