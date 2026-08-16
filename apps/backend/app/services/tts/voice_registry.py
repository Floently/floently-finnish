"""Deterministic Finnish TTS voice resolution.

KV-VOICE-002 repairs the provider-gender registry used by roleplay and future
multi-speaker practice. KV-VOICE-003 adds a stable product-level voice identity
that binds one persona to one preferred provider voice for the session/client.

Important product rules:
- Explicit ``voice_hint`` wins over a contradictory legacy ``voice_profile``.
- A certified male profile may never resolve to a provider voice curated female,
  and vice versa.
- Persona IDs are stable selection seeds so the same persona keeps the same
  provider voice while a pool can still provide audible variety.
- An exact provider voice ID, once resolved into a voice identity, must round-trip
  through this registry unchanged when its gender contract is valid.
- Structured YKI multi-speaker playback remains KV-VOICE-004.
"""
from __future__ import annotations

import hashlib
from typing import Any, Literal

VoiceGender = Literal["male", "female", "neutral"]

VOICE_REGISTRY_VERSION = "2026-08-16.1"
GOOGLE_VOICE_CATALOG_URL = (
    "https://cloud.google.com/text-to-speech/docs/list-voices-and-types"
)

# Provider-published Finnish voice metadata verified 2026-08-16. Keep legacy
# Standard/Wavenet entries here so regression checks can prove they remain
# classified correctly even though the normal persona pool uses Chirp 3 HD.
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

# Use one comparable GA voice family for normal actor selection so male and
# female personas receive similar synthesis quality. Legacy voices remain
# explicit fallbacks/metadata, not random members of the main persona pool.
_GOOGLE_MALE_VOICES: tuple[str, ...] = (
    "fi-FI-Chirp3-HD-Alnilam",
    "fi-FI-Chirp3-HD-Charon",
    "fi-FI-Chirp3-HD-Enceladus",
    "fi-FI-Chirp3-HD-Fenrir",
)
_GOOGLE_FEMALE_VOICES: tuple[str, ...] = (
    "fi-FI-Chirp3-HD-Aoede",
    "fi-FI-Chirp3-HD-Autonoe",
    "fi-FI-Chirp3-HD-Callirrhoe",
    "fi-FI-Chirp3-HD-Despina",
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
# so these are product assignments rather than provider-certified genders.
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
        return hint  # type: ignore[return-value]
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
    profile_raw = str(voice_profile or "").strip()
    gender = _resolved_gender(voice_hint, profile_raw)

    if p == "google":
        # KV-VOICE-003: once the backend has resolved an exact provider voice,
        # the client may send that exact ID back as voice_profile. Do not hash it
        # into another voice. Validate the explicit actor gender before returning.
        exact_gender = google_voice_gender(profile_raw)
        if exact_gender is not None:
            if gender in {"male", "female"} and exact_gender != gender:
                raise ValueError(
                    f"Google exact voice gender mismatch: requested={gender} "
                    f"voice={profile_raw} provider_gender={exact_gender}"
                )
            return profile_raw

        profile_key = profile_raw.lower()
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

        voice_name = pool[_stable_index(persona_id or profile_raw or gender, len(pool))]
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
        # Preserve a previously resolved OpenAI product assignment exactly.
        expected = _OPENAI_VOICES.get(gender, _OPENAI_VOICES["neutral"])
        if profile_raw in set(_OPENAI_VOICES.values()):
            if profile_raw != expected and gender in {"male", "female"}:
                raise ValueError(
                    f"OpenAI product voice assignment mismatch: requested={gender} "
                    f"voice={profile_raw}"
                )
            return profile_raw
        return expected

    return None


def resolve_voice_identity(
    *,
    persona_id: str,
    display_name: str,
    gender: str,
    voice_profile: str,
    provider: str,
    language: str = "fi-FI",
) -> dict[str, Any]:
    """Resolve one immutable preferred voice binding for a product persona.

    The identity is deterministic for the same persona/profile/provider and is
    safe to send to clients. ``gender_certified`` means the provider publishes
    matching gender metadata for the selected voice; OpenAI's built-in voice
    mapping is currently a KieliValmis product assignment, not provider metadata.
    """
    normalized_gender = _resolved_gender(gender, voice_profile)
    normalized_provider = str(provider or "google").strip().lower() or "google"
    resolved_voice = provider_voice_name(
        normalized_provider,
        voice_profile=voice_profile,
        voice_hint=normalized_gender,
        persona_id=persona_id,
    )
    if not resolved_voice:
        raise ValueError(
            f"No provider voice resolved for provider={normalized_provider} "
            f"persona={persona_id}"
        )

    gender_certified = False
    if normalized_provider == "google":
        provider_gender = google_voice_gender(resolved_voice)
        gender_certified = bool(
            provider_gender is not None
            and normalized_gender in {"male", "female"}
            and provider_gender == normalized_gender
        )

    identity_seed = "|".join(
        (
            VOICE_REGISTRY_VERSION,
            str(persona_id or ""),
            normalized_provider,
            resolved_voice,
            normalized_gender,
        )
    )
    identity_id = "rvi_" + hashlib.sha256(identity_seed.encode("utf-8")).hexdigest()[:20]

    return {
        "identity_id": identity_id,
        "persona_id": str(persona_id or ""),
        "display_name": str(display_name or "AI"),
        "gender": normalized_gender,
        "language": language,
        "voice_profile": str(voice_profile or ""),
        "provider": normalized_provider,
        "provider_voice_id": resolved_voice,
        "registry_version": VOICE_REGISTRY_VERSION,
        "gender_certified": gender_certified,
    }


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
        "registry_version": VOICE_REGISTRY_VERSION,
        "google_catalog_url": GOOGLE_VOICE_CATALOG_URL,
        "google_voices": {
            "female": list(_GOOGLE_FEMALE_VOICES),
            "male": list(_GOOGLE_MALE_VOICES),
        },
        "google_voice_gender": dict(_GOOGLE_VOICE_GENDER),
        "supported_profiles": sorted(_GOOGLE_PROFILE_VOICES.keys()),
        "openai_gender_certified": False,
    }
