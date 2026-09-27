from __future__ import annotations

import hashlib
from dataclasses import asdict, dataclass
from typing import Any

from app.runtime.finnish_personas import list_personas
from app.services.tts.voice_registry import voices_for_dialogue


@dataclass(frozen=True)
class ConversationSpeaker:
    speaker_id: str
    display_name: str
    gender: str
    persona_id: str
    voice_profile: str
    voice_id: str | None = None


def _stable_index(seed: str, length: int) -> int:
    if length <= 0:
        return 0
    digest = hashlib.sha256(str(seed or "").encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % length


def _display_name(persona: dict[str, Any]) -> str:
    first = str(persona.get("firstName") or "").strip()
    last = str(persona.get("lastName") or "").strip()
    title = str(persona.get("title") or "").strip()
    name = " ".join(part for part in [first, last] if part)
    return f"{title} {name}".strip() if title else name


def pick_dialogue_speakers(*, seed: str, provider: str = "google") -> list[dict[str, Any]]:
    personas = [p for p in list_personas() if isinstance(p, dict)]
    males = [p for p in personas if p.get("gender") == "male"]
    females = [p for p in personas if p.get("gender") == "female"]

    if not males or not females:
        personas = personas or []
        selected = personas[:2]
    else:
        female = females[_stable_index(seed + ":female", len(females))]
        male = males[_stable_index(seed + ":male", len(males))]
        selected = [female, male]

    speaker_specs = []
    speakers: list[ConversationSpeaker] = []

    for index, persona in enumerate(selected[:2]):
        sid = "speaker_a" if index == 0 else "speaker_b"
        gender = str(persona.get("gender") or "female")
        persona_id = str(persona.get("id") or sid)
        voice_profile = str(persona.get("voiceProfile") or ("yki_standard_male" if gender == "male" else "yki_standard_female"))
        speaker_specs.append(
            {
                "speaker_id": sid,
                "gender": gender,
                "persona_id": persona_id,
                "voice_profile": voice_profile,
            }
        )
        speakers.append(
            ConversationSpeaker(
                speaker_id=sid,
                display_name=_display_name(persona) or sid,
                gender=gender,
                persona_id=persona_id,
                voice_profile=voice_profile,
            )
        )

    voice_map = voices_for_dialogue(provider, speaker_specs)

    return [
        {
            **asdict(speaker),
            "voice_id": voice_map.get(speaker.speaker_id),
        }
        for speaker in speakers
    ]


def build_yki_dialogue_turns(*, seed: str, topic: str | None = None) -> dict[str, Any]:
    speakers = pick_dialogue_speakers(seed=seed, provider="google")
    topic_text = str(topic or "ajan varaaminen").strip()

    return {
        "mode": "dialogue",
        "topic": topic_text,
        "speakers": speakers,
        "turns": [
            {
                "speaker_id": "speaker_a",
                "text": "Hei, miten voin auttaa?",
            },
            {
                "speaker_id": "speaker_b",
                "text": "Haluaisin varata ajan ensi viikolle.",
            },
            {
                "speaker_id": "speaker_a",
                "text": "Sopiiko tiistai aamupäivällä?",
            },
            {
                "speaker_id": "speaker_b",
                "text": "Kyllä, se sopii hyvin.",
            },
        ],
    }
