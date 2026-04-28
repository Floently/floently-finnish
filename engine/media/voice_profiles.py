from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VoiceProfile:
    name: str
    providers: dict[str, str]


YKI_STANDARD_FEMALE = VoiceProfile(
    name="yki_standard_female",
    providers={
        "google": "fi-FI-Neural2-A",
        "elevenlabs": "21m00Tcm4TlvDq8ikWAM",
        "azure": "fi-FI-NooraNeural",
        "openai": "alloy",
    },
)

YKI_STANDARD_MALE = VoiceProfile(
    name="yki_standard_male",
    providers={
        "google": "fi-FI-Neural2-D",
        "elevenlabs": "TxGEqnHWrfWFTfGW9XjX",
        "azure": "fi-FI-HarriNeural",
        "openai": "verse",
    },
)

VOICE_PROFILES: dict[str, VoiceProfile] = {
    YKI_STANDARD_FEMALE.name: YKI_STANDARD_FEMALE,
    YKI_STANDARD_MALE.name: YKI_STANDARD_MALE,
}
