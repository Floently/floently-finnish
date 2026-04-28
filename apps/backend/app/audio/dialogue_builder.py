from __future__ import annotations

from typing import TYPE_CHECKING

from app.audio.models import DialogueBundle, DialogueSegment, DialogueTurn
from app.cards.observability import increment_metric, log_card_event

if TYPE_CHECKING:
    from app.audio.tts_service import CardTTSService


class DialogueBuilderError(RuntimeError):
    """Raised when deterministic dialogue audio preparation fails."""


class DialogueBuilder:
    def __init__(self, *, tts_service: CardTTSService | None = None):
        if tts_service is None:
            from app.audio.tts_service import CardTTSService

            tts_service = CardTTSService()
        self.tts_service = tts_service

    async def build_dialogue_audio(
        self,
        turns: list[DialogueTurn | dict[str, str]],
        *,
        speaking_style: str = "dialogue_turn",
        context_type: str = "dialogue_listening",
    ) -> DialogueBundle:
        normalized_turns = [_normalize_turn(turn) for turn in turns if _normalize_turn(turn).text]
        if len(normalized_turns) < 2:
            raise DialogueBuilderError("Dialogue audio requires at least two spoken turns")
        if len({turn.speaker_id for turn in normalized_turns}) < 2:
            raise DialogueBuilderError("Dialogue audio requires at least two distinct speakers")

        segments: list[DialogueSegment] = []
        for index, turn in enumerate(normalized_turns):
            try:
                asset = await self.tts_service.generate_audio(
                    text=turn.text,
                    speaker_id=turn.speaker_id,
                    speaker_label=turn.speaker_label,
                    speaking_style=speaking_style,
                    speed=_speed_for_turn(index),
                    context_type=context_type,
                )
            except Exception as exc:
                raise DialogueBuilderError(str(exc)) from exc
            segments.append(
                DialogueSegment(
                    asset=asset,
                    sequence_index=index,
                    pause_after_ms=_pause_after_turn(turn.text),
                )
            )

        total_duration_seconds = round(
            sum(segment.asset.duration_seconds + (segment.pause_after_ms / 1000.0) for segment in segments),
            3,
        )
        increment_metric("cards.audio.dialogue_built")
        log_card_event(
            "cards.audio.dialogue_built",
            turn_count=len(segments),
            speakers=sorted({segment.asset.speaker_id for segment in segments}),
            duration_seconds=total_duration_seconds,
        )
        return DialogueBundle(
            speaker_order=[
                (segment.asset.speaker_id, segment.asset.speaker_label, segment.asset.voice_profile)
                for segment in segments
            ],
            segments=segments,
            total_duration_seconds=total_duration_seconds,
        )


def _normalize_turn(turn: DialogueTurn | dict[str, str]) -> DialogueTurn:
    if isinstance(turn, DialogueTurn):
        return DialogueTurn(
            speaker_id=str(turn.speaker_id).strip().lower(),
            speaker_label=str(turn.speaker_label).strip() or str(turn.speaker_id).strip(),
            text=" ".join(str(turn.text).split()).strip(),
        )
    speaker = str(turn.get("speaker") or "").strip()
    text = " ".join(str(turn.get("text") or "").split()).strip()

    # ── Multi-voice listening fix (#7.3) ────────────────────────────────
    # When the listening data file specifies an explicit gender per speaker,
    # encode it into the speaker_id so that _voice_profile_for_speaker in
    # tts_service can resolve it deterministically. The TTS path recognizes
    # the 'fi-m-' / 'fi-f-' prefix as a gender hint, mirroring the Finnish
    # persona registry id pattern.
    #
    # If no gender is given, fall back to the prior behavior (hash-based
    # gender guess) but log a warning so listening data authors can fix it.
    gender_raw = str(turn.get("gender") or "").strip().lower()
    speaker_id_lower = speaker.lower()
    if gender_raw in {"male", "m"} and not speaker_id_lower.startswith(("fi-m-", "fi-f-")):
        speaker_id_resolved = f"fi-m-{speaker_id_lower or 'speaker'}"
    elif gender_raw in {"female", "f"} and not speaker_id_lower.startswith(("fi-m-", "fi-f-")):
        speaker_id_resolved = f"fi-f-{speaker_id_lower or 'speaker'}"
    else:
        speaker_id_resolved = speaker_id_lower

    return DialogueTurn(
        speaker_id=speaker_id_resolved,
        speaker_label=speaker or "Speaker",
        text=text,
    )


def _pause_after_turn(text: str) -> int:
    trimmed = str(text or "").strip()
    if trimmed.endswith("?"):
        return 420
    if trimmed.endswith("!"):
        return 380
    return 320


def _speed_for_turn(index: int) -> float:
    speeds = (0.98, 1.0, 1.02, 0.99)
    return speeds[index % len(speeds)]
