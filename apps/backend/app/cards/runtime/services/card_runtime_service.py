from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from app.audio.audio_types import AudioBundle
from app.cards.adaptive import AdaptiveLearningService
from app.cards.adaptive.models import CardPerformanceRecord
from app.cards.adaptive.models import AdaptiveSessionFilters
from app.cards.observability import increment_metric, log_card_event
from app.cards.runtime.mappers import map_card_for_runtime, map_selection_reason, map_session_state
from app.cards.runtime.models.api_models import (
    AdaptiveAnswerUpdateResponse,
    AdaptiveCardSessionResponse,
    AnswerResponse,
    CardAudioResponse,
    CardAudioSegmentResponse,
    CardAudioSpeakerResponse,
    CardSessionResponse,
    CorrectAnswerResponse,
    DeckResponse,
    NextCardResponse,
)
from app.cards.runtime.rate_limit import CardRateLimitError, CardRateLimiter
from app.cards.runtime.repositories.card_repository import CardRepository, CardRepositoryError
from app.cards.runtime.repositories.session_repository import CardSessionRepository, CardSessionRepositoryError
from app.cards.runtime.models.session_state import RuntimeSessionRecord
from app.cards.runtime.services.card_selector import CardSelector, SelectionContext
from app.cards.runtime.session_engine import CardSessionEngine, CardSessionEngineError
from app.cards.schemas.cards import CardEnvelope
from app.cards.schemas.common import CardContentType, LearningPath, LevelBand, ProfessionTrack, SessionStatus
from app.cards.schemas.session import CardReviewState
from app.cards.schemas.follow_ups import (
    ContextMcqFollowUp,
    FillInFollowUp,
    GrammarApplicationFollowUp,
    RecognitionMcqFollowUp,
    ReverseRecallFollowUp,
    TypedRecallFollowUp,
)

if TYPE_CHECKING:
    from app.audio.audio_service import CardAudioService


class CardRuntimeService:
    def __init__(
        self,
        *,
        repository: CardRepository | None = None,
        session_engine: CardSessionEngine | None = None,
        adaptive_learning: AdaptiveLearningService | None = None,
        session_repository: CardSessionRepository | None = None,
        rate_limiter: CardRateLimiter | None = None,
        card_selector: CardSelector | None = None,
        audio_service: CardAudioService | None = None,
    ):
        self.repository = repository or CardRepository()
        self.session_engine = session_engine or CardSessionEngine()
        self.adaptive_learning = adaptive_learning or AdaptiveLearningService()
        self.session_repository = session_repository or CardSessionRepository()
        self.rate_limiter = rate_limiter or CardRateLimiter()
        self.card_selector = card_selector or CardSelector()
        if audio_service is None:
            from app.audio.audio_service import CardAudioService

            audio_service = CardAudioService()
        self.audio_service = audio_service

    async def list_cards(
        self,
        *,
        user_id: str | None = None,
        domain: LearningPath | None = None,
        content_type: CardContentType | None = None,
        profession: ProfessionTrack | None = None,
        level_band: LevelBand | None = None,
        source: str | None = None,
    ) -> DeckResponse:
        cards = await self.repository.get_cards(
            domain=domain,
            content_type=content_type,
            profession=profession,
            level_band=level_band,
            source=source,
        )
        if not cards:
            increment_metric("cards.deck_empty")
            log_card_event(
                "cards.deck_empty",
                domain=domain.value if domain else None,
                content_type=content_type.value if content_type else None,
                profession=profession.value if profession else None,
                level_band=level_band.value if level_band else None,
                source=source,
            )
        performance_by_card, review_state_by_card = await self._load_user_runtime_maps(user_id)
        return DeckResponse(
            count=len(cards),
            cards=[
                map_card_for_runtime(
                    card,
                    order_index=index,
                    performance=performance_by_card.get(card.id),
                    review_state=review_state_by_card.get(card.id),
                )
                for index, card in enumerate(cards)
            ],
        )

    async def start_session(
        self,
        *,
        user_id: str,
        domain: LearningPath,
        content_type: CardContentType | None = None,
        profession: ProfessionTrack | None = None,
        level_band: LevelBand | None = None,
    ) -> CardSessionResponse:
        self.rate_limiter.check_session_start(user_id)
        cards = await self.repository.get_cards(
            domain=domain,
            content_type=content_type,
            profession=profession,
            level_band=level_band,
        )
        if not cards:
            increment_metric("cards.session_start_failed", reason="no_cards")
            raise CardRepositoryError("No published cards matched the requested filters")
        target_id = _build_runtime_target_id(domain=domain, content_type=content_type, profession=profession, level_band=level_band)
        performance_by_card, review_state_by_card = await self._load_user_runtime_maps(user_id)
        first_card = self.card_selector.get_next(
            cards=cards,
            performance_by_card=performance_by_card,
            review_state_by_card=review_state_by_card,
            context=SelectionContext(
                session_id=f"bootstrap.{user_id}.{uuid4().hex}",
                user_id=user_id,
                answered_count=0,
                recent_card_ids=[],
            ),
        )
        record = self.session_engine.create_session(
            user_id=user_id,
            target_id=target_id,
            card_ids=[first_card.id],
            initial_variant_type=first_card.content.follow_ups[0].variant_type,
        )
        await self.session_repository.create_session(record)
        increment_metric("cards.session_started", session_type="deterministic")
        log_card_event(
            "cards.session_started",
            user_id=user_id,
            session_id=record.session.session_id,
            total_cards=1,
            adaptive_session=False,
        )
        first_audio = _map_audio_bundle(await self.audio_service.ensure_runtime_audio(first_card))
        return CardSessionResponse(
            session=map_session_state(record),
            first_card=map_card_for_runtime(
                first_card,
                order_index=0,
                performance=performance_by_card.get(first_card.id),
                review_state=review_state_by_card.get(first_card.id),
                audio_override=first_audio,
            ),
        )

    async def start_adaptive_session(
        self,
        *,
        user_id: str,
        domain: LearningPath,
        content_type: CardContentType | None = None,
        profession: ProfessionTrack | None = None,
        level_band: LevelBand | None = None,
        limit: int = 10,
    ) -> AdaptiveCardSessionResponse:
        self.rate_limiter.check_adaptive_start(user_id)
        cards = await self.repository.get_cards(
            domain=domain,
            content_type=content_type,
            profession=profession,
            level_band=level_band,
        )
        if not cards:
            increment_metric("cards.session_start_failed", reason="no_cards")
            raise CardRepositoryError("No published cards matched the requested filters")
        plan = await self.adaptive_learning.build_session_plan(
            user_id=user_id,
            cards=cards,
            filters=AdaptiveSessionFilters(
                domain=domain,
                content_type=content_type,
                profession=profession,
                level_band=level_band,
                limit=limit,
            ),
        )
        if not plan.ordered_card_ids:
            increment_metric("cards.session_start_failed", reason="no_eligible_cards")
            log_card_event("cards.adaptive_session_empty", user_id=user_id, domain=domain.value)
            raise CardRepositoryError("Adaptive review queue did not select any cards")
        first_card = await self.repository.get_card_by_id(plan.ordered_card_ids[0])
        performance_by_card, review_state_by_card = await self._load_user_runtime_maps(user_id)
        first_variant_index = plan.variant_indices[first_card.id]
        first_variant = first_card.content.follow_ups[first_variant_index]
        record = self.session_engine.create_session(
            user_id=user_id,
            target_id=plan.queue_snapshot.queue_id,
            card_ids=plan.ordered_card_ids,
            initial_variant_type=first_variant.variant_type,
            initial_variant_index=first_variant_index,
            variant_indices=plan.variant_indices,
            selection_reasons=plan.selection_reasons,
            adaptive_session=True,
        )
        await self.session_repository.create_session(record)
        increment_metric("cards.session_started", session_type="adaptive")
        log_card_event(
            "cards.adaptive_session_started",
            user_id=user_id,
            session_id=record.session.session_id,
            review_queue_id=plan.queue_snapshot.queue_id,
            total_cards=len(plan.ordered_card_ids),
        )
        first_audio = _map_audio_bundle(await self.audio_service.ensure_runtime_audio(first_card))
        return AdaptiveCardSessionResponse(
            session=map_session_state(record),
            first_card=map_card_for_runtime(
                first_card,
                order_index=0,
                variant_index=first_variant_index,
                performance=performance_by_card.get(first_card.id),
                review_state=review_state_by_card.get(first_card.id),
                audio_override=first_audio,
            ),
            review_queue_id=plan.queue_snapshot.queue_id,
            selection_reasons=[map_selection_reason(reason) for reason in plan.queue_snapshot.selection_reasons],
        )

    async def get_next_card(self, *, session_id: str, user_id: str) -> NextCardResponse:
        record = await self.session_repository.get_session(session_id)
        self._ensure_session_alignment(record)
        if record.session.user_id != user_id:
            increment_metric("cards.invalid_session_access")
            raise CardSessionEngineError("Session does not belong to the current user")
        if record.session.status != SessionStatus.active:
            raise CardSessionEngineError("Session is not active")

        performance_by_card, review_state_by_card = await self._load_user_runtime_maps(user_id)
        cards = await self._load_session_candidates(record)
        if not cards:
            raise CardRepositoryError("No published cards matched the active session filters")
        record = self._append_next_card_if_needed(
            record=record,
            user_id=user_id,
            cards=cards,
            performance_by_card=performance_by_card,
            review_state_by_card=review_state_by_card,
        )
        current_session = record.session
        next_variant = None
        next_variant_index = 0
        next_card_id = current_session.selected_card_ids[current_session.current_card_index + 1]
        next_card = await self.repository.get_card_by_id(next_card_id)
        next_variant_index = record.served_variant_indices.get(next_card_id, 0)
        next_variant = next_card.content.follow_ups[next_variant_index].variant_type
        record = self.session_engine.advance(
            record=record,
            next_variant_type=next_variant,
            next_variant_index=next_variant_index,
        )
        await self.session_repository.save_session(record)
        card = await self.repository.get_card_by_id(record.session.selected_card_ids[record.session.current_card_index])
        variant_index = record.served_variant_indices.get(card.id, 0)
        runtime_audio = _map_audio_bundle(await self.audio_service.ensure_runtime_audio(card))
        return NextCardResponse(
            session=map_session_state(record),
            card=map_card_for_runtime(
                card,
                order_index=record.session.current_card_index,
                variant_index=variant_index,
                performance=performance_by_card.get(card.id),
                review_state=review_state_by_card.get(card.id),
                audio_override=runtime_audio,
            ),
            completed=False,
        )

    async def answer_current_card(self, *, session_id: str, user_id: str, user_answer: str) -> AnswerResponse:
        self.rate_limiter.check_answer_submit(user_id, session_id)
        record = await self.session_repository.get_session(session_id)
        self._ensure_session_alignment(record)
        session = record.session
        if session.user_id != user_id:
            increment_metric("cards.invalid_session_access")
            raise CardSessionEngineError("Session does not belong to the current user")
        if session.status != SessionStatus.active:
            increment_metric("cards.answer_rejected", reason="session_inactive")
            raise CardSessionEngineError("Session is not active")
        card = await self.repository.get_card_by_id(session.selected_card_ids[session.current_card_index])
        variant_index = record.served_variant_indices.get(card.id, 0)
        served_follow_up = _select_follow_up(card, variant_index)
        normalized_answer = _normalize_answer(user_answer)
        correct = _evaluate_answer(served_follow_up, user_answer)
        updated = self.session_engine.record_answer(
            record=record,
            user_answer=user_answer,
            normalized_user_answer=normalized_answer,
            correct=correct,
            variant_type=served_follow_up.variant_type,
        )
        await self.session_repository.append_answer(session_id, updated.answers[-1])
        await self.session_repository.save_session(updated)
        adaptive_update = await self.adaptive_learning.record_answer(
            user_id=user_id,
            card=card,
            correct=correct,
            variant_index=variant_index,
            variant_type=served_follow_up.variant_type,
        )
        increment_metric("cards.answer_submitted", outcome="correct" if correct else "incorrect")
        log_card_event(
            "cards.answer_submitted",
            user_id=user_id,
            session_id=session_id,
            card_id=card.id,
            correct=correct,
            variant_type=str(served_follow_up.variant_type),
        )
        cards = await self._load_session_candidates(updated)
        if not cards:
            raise CardRepositoryError("No published cards matched the active session filters")
        performance_by_card, review_state_by_card = await self._load_user_runtime_maps(user_id)
        updated = self._append_next_card_if_needed(
            record=updated,
            user_id=user_id,
            cards=cards,
            performance_by_card=performance_by_card,
            review_state_by_card=review_state_by_card,
        )
        next_card_id = updated.session.selected_card_ids[updated.session.current_card_index + 1]
        next_card = await self.repository.get_card_by_id(next_card_id)
        next_variant_index = updated.served_variant_indices.get(next_card.id, 0)
        updated = self.session_engine.advance(
            record=updated,
            next_variant_type=next_card.content.follow_ups[next_variant_index].variant_type,
            next_variant_index=next_variant_index,
        )
        self._ensure_session_alignment(updated)
        await self.session_repository.save_session(updated)
        current_card_id = updated.session.selected_card_ids[updated.session.current_card_index]
        if current_card_id != next_card_id:
            raise CardSessionEngineError(
                "Advanced runtime session is inconsistent with the selected next card"
            )
        current_card = await self.repository.get_card_by_id(current_card_id)
        current_variant_index = updated.served_variant_indices.get(current_card.id, 0)
        next_audio = _map_audio_bundle(await self.audio_service.ensure_runtime_audio(current_card))
        return AnswerResponse(
            correct=correct,
            is_correct=correct,
            expected_variant_type=str(served_follow_up.variant_type),
            evaluation_mode=served_follow_up.evaluation_mode.value,
            submitted_answer_normalized=normalized_answer,
            correct_answer=_build_correct_answer(served_follow_up),
            accepted_variants=_build_accepted_variants(served_follow_up),
            explanation=card.content.explanation.summary,
            next_recommended_action="advance_session" if correct else "retry_with_feedback",
            session_completed=False,
            session=map_session_state(updated),
            next_card=map_card_for_runtime(
                current_card,
                order_index=updated.session.current_card_index,
                variant_index=current_variant_index,
                performance=performance_by_card.get(current_card.id),
                review_state=review_state_by_card.get(current_card.id),
                audio_override=next_audio,
            ),
            adaptive_update=AdaptiveAnswerUpdateResponse(
                card_id=adaptive_update.card_id,
                total_attempts=adaptive_update.total_attempts,
                correct_attempts=adaptive_update.correct_attempts,
                incorrect_attempts=adaptive_update.incorrect_attempts,
                success_rate=adaptive_update.success_rate,
                streak=adaptive_update.streak,
                difficulty_score=adaptive_update.difficulty_score,
                next_due_at=adaptive_update.next_due_at,
                interval_days=adaptive_update.interval_days,
                review_status=adaptive_update.review_status,
                last_variant_type=adaptive_update.last_variant_type.value,
                explanation=adaptive_update.explanation,
            ),
        )

    def _append_next_card_if_needed(
        self,
        *,
        record: RuntimeSessionRecord,
        user_id: str,
        cards: list[CardEnvelope],
        performance_by_card: dict[str, CardPerformanceRecord],
        review_state_by_card: dict[str, CardReviewState],
    ) -> RuntimeSessionRecord:
        session = record.session
        if session.current_card_index < len(session.selected_card_ids) - 1:
            return record
        next_card = self.card_selector.get_next(
            cards=cards,
            performance_by_card=performance_by_card,
            review_state_by_card=review_state_by_card,
            context=SelectionContext(
                session_id=session.session_id,
                user_id=user_id,
                answered_count=len(record.answers),
                recent_card_ids=list(session.selected_card_ids),
            ),
        )
        session.selected_card_ids.append(next_card.id)
        if next_card.id not in record.served_variant_indices:
            record.served_variant_indices[next_card.id] = 0
        return record

    @staticmethod
    def _ensure_session_alignment(record: RuntimeSessionRecord) -> None:
        session = record.session
        if not session.selected_card_ids:
            raise CardSessionEngineError("Runtime session has no selected cards")
        if session.current_card_index < 0 or session.current_card_index >= len(session.selected_card_ids):
            raise CardSessionEngineError("current_card_index must point to a selected card")

    async def _load_user_runtime_maps(
        self,
        user_id: str | None,
    ) -> tuple[dict[str, CardPerformanceRecord], dict[str, CardReviewState]]:
        if not user_id:
            return {}, {}
        user_state = await self.adaptive_learning.state_store.load_user_state(user_id)
        performance_by_card = {
            record.card_id: record for record in user_state.performance_records if record.user_id == user_id
        }
        review_state_by_card = {
            record.card_id: record for record in user_state.review_states if record.user_id == user_id
        }
        return performance_by_card, review_state_by_card

    async def _load_session_candidates(self, record: RuntimeSessionRecord) -> list[CardEnvelope]:
        domain = _parse_learning_path(record.session.target.target_id)
        if domain is not None:
            return await self.repository.get_cards(
                domain=domain,
                content_type=_parse_content_type(record.session.target.target_id),
                profession=_parse_profession(record.session.target.target_id),
                level_band=_parse_level_band(record.session.target.target_id),
            )
        session_card_ids = []
        seen = set()
        for card_id in record.session.selected_card_ids:
            if card_id in seen:
                continue
            seen.add(card_id)
            session_card_ids.append(card_id)
        cards = [await self.repository.get_card_by_id(card_id) for card_id in session_card_ids]
        return cards


def _build_runtime_target_id(
    *,
    domain: LearningPath,
    content_type: CardContentType | None,
    profession: ProfessionTrack | None,
    level_band: LevelBand | None,
) -> str:
    parts = ["runtime", domain.value, content_type.value if content_type else "mixed"]
    if profession is not None:
        parts.append(profession.value)
    if level_band is not None:
        parts.append(level_band.value.lower())
    return ".".join(parts)


def _normalize_answer(value: str) -> str:
    return " ".join(value.strip().split()).casefold()


def _parse_learning_path(target_id: str) -> LearningPath | None:
    parts = target_id.split(".")
    if len(parts) < 2:
        return None
    try:
        return LearningPath(parts[1])
    except ValueError:
        return None


def _parse_content_type(target_id: str) -> CardContentType | None:
    parts = target_id.split(".")
    if len(parts) < 3 or parts[2] == "mixed":
        return None
    try:
        return CardContentType(parts[2])
    except ValueError:
        return None


def _parse_profession(target_id: str) -> ProfessionTrack | None:
    parts = target_id.split(".")
    if len(parts) < 4:
        return None
    try:
        return ProfessionTrack(parts[3])
    except ValueError:
        return None


def _parse_level_band(target_id: str) -> LevelBand | None:
    parts = target_id.split(".")
    if len(parts) < 5:
        return None
    try:
        return LevelBand(parts[4].upper())
    except ValueError:
        return None


def _map_audio_bundle(bundle: AudioBundle) -> CardAudioResponse:
    return CardAudioResponse(
        type=bundle.audio_type,
        asset_ids=list(bundle.asset_ids),
        duration_seconds=bundle.duration_seconds,
        transcript_visible=bundle.transcript_visible,
        speakers=[
            CardAudioSpeakerResponse(
                speaker_id=speaker.speaker_id,
                speaker_label=speaker.speaker_label,
                voice_profile=speaker.voice_profile,
            )
            for speaker in bundle.speakers
        ],
        segments=[
            CardAudioSegmentResponse(
                asset_id=segment.asset_id,
                url=segment.url,
                speaker_id=segment.speaker_id,
                speaker_label=segment.speaker_label,
                voice_profile=segment.voice_profile,
                sequence_index=segment.sequence_index,
                duration_seconds=segment.duration_seconds,
                pause_after_ms=segment.pause_after_ms,
            )
            for segment in bundle.segments
        ],
    )


def _select_follow_up(card: CardEnvelope, variant_index: int):
    if variant_index < 0 or variant_index >= len(card.content.follow_ups):
        raise CardSessionEngineError(f"Variant index {variant_index} is out of range for card {card.id}")
    return card.content.follow_ups[variant_index]


def _evaluate_answer(follow_up, user_answer: str) -> bool:
    if isinstance(follow_up, (RecognitionMcqFollowUp, ContextMcqFollowUp)):
        option_ids = {option.option_id for option in follow_up.options}
        if user_answer not in option_ids:
            raise CardSessionEngineError("MCQ answers must use option_id values from the served card")
        return user_answer == follow_up.answer_key

    normalized_answer = _normalize_answer(user_answer)
    accepted = {_normalize_answer(follow_up.answer_key)}
    accepted.update(_normalize_answer(item) for item in follow_up.accepted_variants)
    if isinstance(follow_up, (TypedRecallFollowUp, FillInFollowUp, ReverseRecallFollowUp, GrammarApplicationFollowUp)):
        return normalized_answer in accepted
    raise CardSessionEngineError("Unsupported follow-up variant")


def _build_correct_answer(follow_up) -> CorrectAnswerResponse:
    if isinstance(follow_up, (RecognitionMcqFollowUp, ContextMcqFollowUp)):
        for option in follow_up.options:
            if option.option_id == follow_up.answer_key:
                return CorrectAnswerResponse(
                    value=option.option_id,
                    option_id=option.option_id,
                    display_text=option.text,
                )
    return CorrectAnswerResponse(value=follow_up.answer_key, display_text=follow_up.answer_key)


def _build_accepted_variants(follow_up) -> list[str]:
    if isinstance(follow_up, (RecognitionMcqFollowUp, ContextMcqFollowUp)):
        return [follow_up.answer_key]
    accepted = [follow_up.answer_key]
    accepted.extend(item for item in follow_up.accepted_variants if item != follow_up.answer_key)
    return accepted
