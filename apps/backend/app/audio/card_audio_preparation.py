from __future__ import annotations

import re
from typing import TYPE_CHECKING

from app.audio.dialogue_builder import DialogueBuilder
from app.cards.schemas.cards import CardEnvelope, validate_card_payload
from app.cards.schemas.content import GrammarCardContent, SentenceCardContent, VocabularyCardContent

if TYPE_CHECKING:
    from app.audio.tts_service import CardTTSService

_DIALOGUE_LINE_PATTERN = re.compile(r"^(?P<speaker>[A-Za-zÅÄÖåäö0-9 _-]{1,32})\s*:\s*(?P<text>.+)$")


class CardAudioPreparationService:
    def __init__(
        self,
        *,
        tts_service: CardTTSService | None = None,
        dialogue_builder: DialogueBuilder | None = None,
    ):
        if tts_service is None:
            from app.audio.tts_service import CardTTSService

            tts_service = CardTTSService()
        self.tts_service = tts_service
        self.dialogue_builder = dialogue_builder or DialogueBuilder(tts_service=self.tts_service)

    async def prepare_cards_for_publication(self, cards: list[CardEnvelope]) -> list[CardEnvelope]:
        prepared: list[CardEnvelope] = []
        for card in cards:
            audio_payload = await self._build_audio_payload(card)
            payload = card.model_dump(mode="json")
            payload["content"]["audio"] = audio_payload
            prepared.append(validate_card_payload(payload))
        return prepared

    async def _build_audio_payload(self, card: CardEnvelope) -> dict:
        dialogue_turns = _extract_dialogue_turns(card)
        if dialogue_turns:
            bundle = await self.dialogue_builder.build_dialogue_audio(
                dialogue_turns,
                context_type=_context_type(card),
            )
            unique_speakers: dict[str, tuple[str, str]] = {}
            for speaker_id, speaker_label, voice_profile in bundle.speaker_order:
                unique_speakers.setdefault(speaker_id, (speaker_label, voice_profile))
            return {
                "type": "dialogue",
                "asset_ids": [segment.asset.id for segment in bundle.segments],
                "duration_seconds": bundle.total_duration_seconds,
                "transcript_visible": False,
                "speakers": [
                    {
                        "speaker_id": speaker_id,
                        "speaker_label": speaker_label,
                        "voice_profile": voice_profile,
                    }
                    for speaker_id, (speaker_label, voice_profile) in sorted(unique_speakers.items())
                ],
                "segments": [
                    {
                        "asset_id": segment.asset.id,
                        "speaker_id": segment.asset.speaker_id,
                        "speaker_label": segment.asset.speaker_label,
                        "voice_profile": segment.asset.voice_profile,
                        "sequence_index": segment.sequence_index,
                        "transcript_visible": False,
                        "duration_seconds": segment.asset.duration_seconds,
                        "pause_after_ms": segment.pause_after_ms,
                    }
                    for segment in bundle.segments
                ],
            }

        asset = await self.tts_service.generate_audio(
            text=_single_audio_text(card),
            speaker_id="narrator",
            speaker_label="Narrator",
            speaking_style=_speaking_style(card),
            speed=1.0,
            context_type=_context_type(card),
        )
        return {
            "type": "single",
            "asset_ids": [asset.id],
            "duration_seconds": asset.duration_seconds,
            "transcript_visible": False,
            "speakers": [
                {
                    "speaker_id": asset.speaker_id,
                    "speaker_label": asset.speaker_label,
                    "voice_profile": asset.voice_profile,
                }
            ],
            "segments": [
                {
                    "asset_id": asset.id,
                    "speaker_id": asset.speaker_id,
                    "speaker_label": asset.speaker_label,
                    "voice_profile": asset.voice_profile,
                    "sequence_index": 0,
                    "transcript_visible": False,
                    "duration_seconds": asset.duration_seconds,
                    "pause_after_ms": 0,
                }
            ],
        }


def _extract_dialogue_turns(card: CardEnvelope) -> list[dict[str, str]]:
    if not isinstance(card.content, SentenceCardContent):
        return []
    lines = [line.strip() for line in card.content.front.sentence.splitlines() if line.strip()]
    turns: list[dict[str, str]] = []
    for line in lines:
        match = _DIALOGUE_LINE_PATTERN.match(line)
        if not match:
            return []
        turns.append(
            {
                "speaker": match.group("speaker").strip(),
                "text": match.group("text").strip(),
            }
        )
    return turns if len(turns) >= 2 else []


def _single_audio_text(card: CardEnvelope) -> str:
    if isinstance(card.content, VocabularyCardContent):
        return card.content.front.term
    if isinstance(card.content, SentenceCardContent):
        return card.content.front.sentence
    if isinstance(card.content, GrammarCardContent):
        return card.content.front.example
    raise TypeError("Unsupported card content type for audio")


def _context_type(card: CardEnvelope) -> str:
    if isinstance(card.content, VocabularyCardContent):
        return "vocabulary_listening"
    if isinstance(card.content, SentenceCardContent):
        return "sentence_listening"
    return "grammar_listening"


def _speaking_style(card: CardEnvelope) -> str:
    if isinstance(card.content, VocabularyCardContent):
        return "vocabulary_prompt"
    if isinstance(card.content, SentenceCardContent):
        return "sentence_prompt"
    return "grammar_prompt"
