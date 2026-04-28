from __future__ import annotations

from app.audio.audio_types import AudioBundle, AudioSegment, AudioSpeaker
from app.audio.tts_service import CardTTSService
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.content import GrammarCardContent, SentenceCardContent, VocabularyCardContent


class CardAudioService:
    def __init__(self, *, tts_service: CardTTSService | None = None):
        self.tts_service = tts_service or CardTTSService()

    async def ensure_runtime_audio(self, card: CardEnvelope) -> AudioBundle:
        content = card.content
        if isinstance(content, VocabularyCardContent):
            text = content.front.term
            style = "vocabulary_prompt"
            context_type = "vocabulary_card"
        elif isinstance(content, SentenceCardContent):
            text = content.front.sentence
            style = "sentence_prompt"
            context_type = "sentence_card"
        elif isinstance(content, GrammarCardContent):
            text = content.front.example
            style = "grammar_prompt"
            context_type = "grammar_card"
        else:  # pragma: no cover - schema guard
            raise TypeError("Unsupported card content type for runtime audio")

        asset = await self.tts_service.generate_audio(
            text=text,
            speaker_id="narrator",
            speaker_label="Narrator",
            speaking_style=style,
            speed=1.0,
            context_type=context_type,
        )
        speaker = AudioSpeaker(
            speaker_id=asset.speaker_id,
            speaker_label=asset.speaker_label,
            voice_profile=asset.voice_profile,
        )
        segment = AudioSegment(
            asset_id=asset.id,
            url=f"/cards/audio/{asset.id}",
            speaker_id=asset.speaker_id,
            speaker_label=asset.speaker_label,
            voice_profile=asset.voice_profile,
            sequence_index=0,
            duration_seconds=asset.duration_seconds,
            pause_after_ms=0,
        )
        return AudioBundle(
            audio_type="single",
            asset_ids=[asset.id],
            duration_seconds=asset.duration_seconds,
            transcript_visible=False,
            speakers=[speaker],
            segments=[segment],
        )
