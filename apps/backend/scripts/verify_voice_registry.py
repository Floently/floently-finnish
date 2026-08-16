#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.tts.voice_registry import (  # noqa: E402
    google_voice_gender,
    provider_voice_name,
    validate_voice_registry,
    voices_for_dialogue,
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    report = validate_voice_registry()
    require(report["ok"], f"voice registry invalid: {report['errors']}")

    male_voices = set(report["google_voices"]["male"])
    female_voices = set(report["google_voices"]["female"])

    require(male_voices, "Google male voice pool must not be empty")
    require(female_voices, "Google female voice pool must not be empty")
    require(not (male_voices & female_voices), "Google gender pools must be disjoint")

    require(
        google_voice_gender("fi-FI-Standard-B") == "female",
        "Google fi-FI-Standard-B must remain classified female",
    )
    require(
        google_voice_gender("fi-FI-Wavenet-B") == "female",
        "Google fi-FI-Wavenet-B must remain classified female",
    )
    require(
        "fi-FI-Standard-B" not in male_voices,
        "Standard-B must never re-enter the Google male pool",
    )
    require(
        "fi-FI-Wavenet-B" not in male_voices,
        "Wavenet-B must never re-enter the Google male pool",
    )

    male = provider_voice_name(
        "google",
        voice_profile="yki_standard_male",
        voice_hint="male",
        persona_id="matti",
    )
    female = provider_voice_name(
        "google",
        voice_profile="yki_standard_female",
        voice_hint="female",
        persona_id="aino",
    )
    require(male in male_voices, f"male profile resolved outside male pool: {male}")
    require(female in female_voices, f"female profile resolved outside female pool: {female}")

    # Explicit actor metadata must win over stale legacy profiles.
    male_override = provider_voice_name(
        "google",
        voice_profile="yki_standard_female",
        voice_hint="male",
        persona_id="legacy-male",
    )
    female_override = provider_voice_name(
        "google",
        voice_profile="yki_standard_male",
        voice_hint="female",
        persona_id="legacy-female",
    )
    require(
        male_override in male_voices,
        f"explicit male hint did not override female profile: {male_override}",
    )
    require(
        female_override in female_voices,
        f"explicit female hint did not override male profile: {female_override}",
    )

    # Same persona must keep the same provider voice.
    stable_first = provider_voice_name(
        "google",
        voice_profile="yki_standard_male",
        voice_hint="male",
        persona_id="persona-stable",
    )
    stable_second = provider_voice_name(
        "google",
        voice_profile="yki_standard_male",
        voice_hint="male",
        persona_id="persona-stable",
    )
    require(stable_first == stable_second, "persona voice assignment is not deterministic")

    # The registry must provide actual audible variety, not one voice per gender.
    sampled_male = {
        provider_voice_name(
            "google",
            voice_profile="yki_standard_male",
            voice_hint="male",
            persona_id=f"male-persona-{index}",
        )
        for index in range(24)
    }
    sampled_female = {
        provider_voice_name(
            "google",
            voice_profile="yki_standard_female",
            voice_hint="female",
            persona_id=f"female-persona-{index}",
        )
        for index in range(24)
    }
    require(len(sampled_male) >= 2, f"male pool produced no variety: {sampled_male}")
    require(len(sampled_female) >= 2, f"female pool produced no variety: {sampled_female}")

    dialogue = voices_for_dialogue(
        "google",
        [
            {
                "speaker_id": "matti",
                "gender": "male",
                "voice_profile": "yki_standard_male",
                "persona_id": "matti",
            },
            {
                "speaker_id": "pekka",
                "gender": "male",
                "voice_profile": "yki_standard_male",
                "persona_id": "pekka",
            },
            {
                "speaker_id": "aino",
                "gender": "female",
                "voice_profile": "yki_standard_female",
                "persona_id": "aino",
            },
            {
                "speaker_id": "liisa",
                "gender": "female",
                "voice_profile": "yki_standard_female",
                "persona_id": "liisa",
            },
        ],
    )
    require(dialogue["matti"] in male_voices, "Matti did not receive a male voice")
    require(dialogue["pekka"] in male_voices, "Pekka did not receive a male voice")
    require(dialogue["aino"] in female_voices, "Aino did not receive a female voice")
    require(dialogue["liisa"] in female_voices, "Liisa did not receive a female voice")
    require(dialogue["matti"] != dialogue["pekka"], "two male speakers should be distinguishable")
    require(dialogue["aino"] != dialogue["liisa"], "two female speakers should be distinguishable")

    runtime_text = (BACKEND_ROOT / "app/services/tts/runtime.py").read_text(encoding="utf-8")
    require(
        '"fi-FI-Standard-B" if hint == "male"' not in runtime_text,
        "runtime reintroduced Standard-B as a male fallback",
    )
    require(
        '"fi-FI-Wavenet-B" if hint == "male"' not in runtime_text,
        "runtime reintroduced Wavenet-B as a male fallback",
    )
    require(
        '"fi-FI-Chirp3-HD-Charon" if hint == "male"' in runtime_text,
        "runtime does not contain a verified male Google fallback",
    )

    print(
        "VOICE_REGISTRY_INVARIANTS=PASS "
        f"male_pool={len(male_voices)} female_pool={len(female_voices)} "
        f"male_sample={len(sampled_male)} female_sample={len(sampled_female)}"
    )


if __name__ == "__main__":
    main()
