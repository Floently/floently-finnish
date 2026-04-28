from __future__ import annotations

from app.cards.adaptive.models import CardPerformanceRecord
from app.cards.runtime.models.api_models import (
    AdaptiveSelectionReasonResponse,
    CardAudioResponse,
    CardAudioSegmentResponse,
    CardAudioSpeakerResponse,
    CardPreviewResponse,
    ServedFollowUpResponse,
    ServedOptionResponse,
    SessionStateResponse,
)
from app.cards.runtime.models.session_state import RuntimeSessionRecord
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.common import ReviewStateStatus
from app.cards.schemas.content import (
    DialogueAudioContent,
    GrammarCardContent,
    SentenceCardContent,
    SingleAudioContent,
    VocabularyCardContent,
)
from app.cards.schemas.session import CardReviewState


def map_card_for_runtime(
    card: CardEnvelope,
    *,
    order_index: int,
    variant_index: int = 0,
    review_state: CardReviewState | None = None,
    performance: CardPerformanceRecord | None = None,
    audio_override: CardAudioResponse | None = None,
) -> CardPreviewResponse:
    if variant_index < 0 or variant_index >= len(card.content.follow_ups):
        raise ValueError(f"variant_index {variant_index} is out of range for card {card.id}")
    follow_up = card.content.follow_ups[variant_index]
    options = []
    if hasattr(follow_up, "options"):
        options = [ServedOptionResponse(option_id=item.option_id, text=item.text) for item in follow_up.options]

    front_text, back_prompt = _card_texts(card)
    card_state = _resolve_runtime_state(review_state=review_state, performance=performance)
    seen_count = performance.total_attempts if performance is not None else 0
    correct_rate = performance.success_rate if performance is not None else 0.0

    return CardPreviewResponse(
        id=card.id,
        content_type=card.content_type.value,
        path=card.path.value,
        domain=card.domain.value,
        profession=card.profession.track.value,
        level_band=card.level_band.value,
        difficulty=card.difficulty.value,
        tags=card.tags,
        prompt_family=card.content.prompt_family.value,
        word=front_text,
        state=card_state,
        seen_count=seen_count,
        correct_rate=correct_rate,
        front_text=front_text,
        back_prompt=back_prompt,
        audio=audio_override if audio_override is not None else _map_audio(card),
        served_follow_up=ServedFollowUpResponse(
            variant_type=str(follow_up.variant_type),
            prompt=follow_up.prompt,
            options=options,
            blank_template=getattr(follow_up, "blank_template", None),
            context_text=getattr(follow_up, "context_text", None),
            stimulus_text=getattr(follow_up, "stimulus_text", None),
        ),
        order_index=order_index,
    )


def map_session_state(record: RuntimeSessionRecord) -> SessionStateResponse:
    session = record.session
    return SessionStateResponse(
        session_id=session.session_id,
        status=session.status.value,
        current_card_index=session.current_card_index,
        total_cards=len(session.selected_card_ids),
        answered_count=len(record.answers),
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def map_selection_reason(reason) -> AdaptiveSelectionReasonResponse:
    return AdaptiveSelectionReasonResponse(
        card_id=reason.card_id,
        reason_code=reason.reason_code.value,
        reason_message=reason.reason_message,
        due_at=reason.due_at,
        difficulty_score=reason.difficulty_score,
        success_rate=reason.success_rate,
        total_attempts=reason.total_attempts,
        streak=reason.streak,
        variant_index=reason.variant_index,
        variant_type=reason.variant_type.value,
    )


def _card_texts(card: CardEnvelope) -> tuple[str, str]:
    content = card.content
    if isinstance(content, VocabularyCardContent):
        return content.front.term, content.back.recall_prompt
    if isinstance(content, SentenceCardContent):
        return content.front.sentence, content.back.recall_prompt
    if isinstance(content, GrammarCardContent):
        return content.front.pattern, content.back.recall_prompt
    raise TypeError("Unsupported card content type")


def _resolve_runtime_state(
    *,
    review_state: CardReviewState | None,
    performance: CardPerformanceRecord | None,
) -> str:
    if performance is None or performance.total_attempts <= 0:
        return "new"
    if review_state is None or review_state.status == ReviewStateStatus.unseen:
        return "new"
    if review_state.status == ReviewStateStatus.mastered:
        return "mastered"
    return "learning"


def _map_audio(card: CardEnvelope) -> CardAudioResponse | None:
    audio = card.content.audio
    if audio is None:
        return None
    if isinstance(audio, SingleAudioContent):
        return CardAudioResponse(
            type=audio.type,
            asset_ids=list(audio.asset_ids),
            duration_seconds=audio.duration_seconds,
            transcript_visible=audio.transcript_visible,
            speakers=[
                CardAudioSpeakerResponse(
                    speaker_id=speaker.speaker_id,
                    speaker_label=speaker.speaker_label,
                    voice_profile=speaker.voice_profile,
                )
                for speaker in audio.speakers
            ],
            segments=[
                CardAudioSegmentResponse(
                    asset_id=segment.asset_id,
                    url=_audio_url(segment.asset_id),
                    speaker_id=segment.speaker_id,
                    speaker_label=segment.speaker_label,
                    voice_profile=segment.voice_profile,
                    sequence_index=segment.sequence_index,
                    duration_seconds=segment.duration_seconds,
                    pause_after_ms=segment.pause_after_ms,
                )
                for segment in audio.segments
            ],
        )
    if isinstance(audio, DialogueAudioContent):
        return CardAudioResponse(
            type=audio.type,
            asset_ids=list(audio.asset_ids),
            duration_seconds=audio.duration_seconds,
            transcript_visible=audio.transcript_visible,
            speakers=[
                CardAudioSpeakerResponse(
                    speaker_id=speaker.speaker_id,
                    speaker_label=speaker.speaker_label,
                    voice_profile=speaker.voice_profile,
                )
                for speaker in audio.speakers
            ],
            segments=[
                CardAudioSegmentResponse(
                    asset_id=segment.asset_id,
                    url=_audio_url(segment.asset_id),
                    speaker_id=segment.speaker_id,
                    speaker_label=segment.speaker_label,
                    voice_profile=segment.voice_profile,
                    sequence_index=segment.sequence_index,
                    duration_seconds=segment.duration_seconds,
                    pause_after_ms=segment.pause_after_ms,
                )
                for segment in audio.segments
            ],
        )
    raise TypeError("Unsupported card audio content type")


def _audio_url(asset_id: str) -> str:
    return f"/cards/audio/{asset_id}"
