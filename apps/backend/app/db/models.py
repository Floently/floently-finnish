"""ORM models placeholder."""

from datetime import UTC, datetime
import uuid
import json
from sqlalchemy import Column, DateTime, String, Text, ForeignKey, Integer, Float, JSON, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def _ensure_utc(value):
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for existing users
    name = Column(String, nullable=True)
    access_choice = Column(String, nullable=True)
    access_choice_at = Column(DateTime, nullable=True)
    subscription_tier = Column(String, nullable=False, default="free")
    subscription_pathway = Column(String, nullable=True)
    subscription_billing_period = Column(String, nullable=True)
    profession_slot_count = Column(Integer, nullable=False, default=0)
    selected_professions = Column(JSON, nullable=False, default=list)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)
    stripe_checkout_session_id = Column(String, nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    trial_ends_at = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    provider_links = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)


class GrammarLog(Base):
    """Store grammar error logs for users."""
    __tablename__ = "grammar_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    original_text = Column(Text, nullable=False)
    corrected_text = Column(Text)
    mistakes = Column(JSON)  # List of error dicts
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = relationship("User", backref="grammar_logs")


class PronunciationLog(Base):
    """Store pronunciation analysis logs for users."""
    __tablename__ = "pronunciation_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    transcript = Column(Text, nullable=False)
    expected_text = Column(Text)
    score = Column(Float)  # 0-4 scale
    issues = Column(JSON)  # List of pronunciation issues
    audio_path = Column(String)  # Path to audio file if stored
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = relationship("User", backref="pronunciation_logs")


class UsageLog(Base):
    """Track feature usage for subscription limits."""
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    feature = Column(String, nullable=False, index=True)  # e.g., "conversation", "yki_exam"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = relationship("User", backref="usage_logs")


class DailyRecharge(Base):
    """Store daily recharge packs for users."""
    __tablename__ = "daily_recharge"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)  # Date of recharge
    vocab_json = Column(JSON)  # List of vocabulary items
    grammar_json = Column(JSON)  # Grammar bite data
    challenge_json = Column(JSON)  # Mini challenge data
    topic = Column(String)  # Next conversation topic
    completed = Column(String, default="false")  # "true" or "false" as string for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = relationship("User", backref="daily_recharges")


class UserDailyState(Base):
    """Track daily completion state for streaks and XP."""
    __tablename__ = "user_daily_state"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)  # Date
    vocab_done = Column(String, default="false")
    grammar_done = Column(String, default="false")
    challenge_done = Column(String, default="false")
    conversation_done = Column(String, default="false")
    xp_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = relationship("User", backref="daily_states")


class RechargeHistory(Base):
    """Store recharge completion history for analytics."""
    __tablename__ = "recharge_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    vocab_learned = Column(JSON)  # List of vocab items learned
    grammar_learned = Column(JSON)  # Grammar bite completed
    challenge_result = Column(JSON)  # Challenge completion data
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    user = relationship("User", backref="recharge_history")


class RoleplayAttempt(Base):
    __tablename__ = "roleplay_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    client_session_id = Column(String, nullable=False, unique=True, index=True)
    profession_field = Column(String, nullable=False, index=True)
    cefr_level = Column(String, nullable=False)
    scenario_id = Column(String, nullable=True, index=True)
    scenario_title = Column(String, nullable=True)
    session_start_time = Column(DateTime, nullable=False)
    session_end_time = Column(DateTime, nullable=False)
    session_duration = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="roleplay_attempts")
    turns = relationship("RoleplayTurn", backref="attempt", cascade="all, delete-orphan")
    score = relationship("RoleplayScore", backref="attempt", uselist=False, cascade="all, delete-orphan")


class RoleplayTurn(Base):
    __tablename__ = "roleplay_turns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String, ForeignKey("roleplay_attempts.id"), nullable=False, index=True)
    turn_index = Column(Integer, nullable=False)
    ai_transcript = Column(Text, nullable=False)
    user_transcript = Column(Text, nullable=False)
    ai_timestamp = Column(DateTime, nullable=True)
    user_timestamp = Column(DateTime, nullable=True)


class RoleplayScore(Base):
    __tablename__ = "roleplay_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String, ForeignKey("roleplay_attempts.id"), nullable=False, unique=True, index=True)
    overall_score = Column(Float, nullable=False)
    fluency_score = Column(Float, nullable=False)
    grammar_score = Column(Float, nullable=False)
    vocabulary_score = Column(Float, nullable=False)
    relevance_score = Column(Float, nullable=False)
    cefr_estimate = Column(String, nullable=True)
    feedback_fi = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class YKISession(Base):
    __tablename__ = "yki_sessions"

    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    blueprint_key = Column(String, nullable=False, index=True)
    mode = Column(String, nullable=False, index=True)
    skill = Column(String, nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    seed = Column(String, nullable=False)
    task_ids = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    finished_at = Column(DateTime, nullable=True, index=True)
    status = Column(String, nullable=False, default="active", index=True)

    user = relationship("User", backref="yki_sessions")


class YKIExamEvent(Base):
    __tablename__ = "yki_exam_events"

    event_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("yki_sessions.session_id"), nullable=False, index=True)
    event_index = Column(Integer, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    previous_hash = Column(String, nullable=True)
    event_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("YKISession", backref="event_rows")


class YKIExamSnapshot(Base):
    __tablename__ = "yki_exam_snapshots"

    snapshot_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("yki_sessions.session_id"), nullable=False, index=True)
    event_index = Column(Integer, nullable=False, index=True)
    snapshot_payload = Column(JSON, nullable=False)
    snapshot_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("YKISession", backref="snapshot_rows")


class YKIAssemblyAuditLog(Base):
    __tablename__ = "yki_assembly_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String, nullable=False, unique=True, index=True)
    session_id = Column(String, ForeignKey("yki_sessions.session_id"), nullable=True, unique=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    mode = Column(String, nullable=False, index=True)
    blueprint_key = Column(String, nullable=False, index=True)
    blueprint_version = Column(String, nullable=False)
    seed = Column(String, nullable=False)
    bank_version = Column(String, nullable=True)
    strict = Column(Boolean, nullable=False, default=True)
    selected_task_ids = Column(JSON, nullable=False)
    warnings_count = Column(Integer, nullable=False, default=0)
    invalid_count = Column(Integer, nullable=False, default=0)

    session = relationship("YKISession", backref="assembly_audit_log", uselist=False)
    user = relationship("User", backref="yki_assembly_audit_logs")


class YKIExamAssemblyAuditLog(Base):
    __tablename__ = "yki_exam_assembly_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_attempt_id = Column(String, nullable=False, unique=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    mode = Column(String, nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    exam_type = Column(String, nullable=False, default="full", index=True)
    blueprint_key = Column(String, nullable=False, index=True)
    blueprint_version = Column(String, nullable=False)
    certification_version = Column(String, nullable=True)
    content_integrity_hash = Column(String, nullable=True)
    seed = Column(String, nullable=False)
    bank_version = Column(String, nullable=True)
    strict = Column(Boolean, nullable=False, default=True)
    status = Column(String, nullable=False, default="success", index=True)
    selected_task_ids = Column(JSON, nullable=False)
    selected_fingerprints = Column(JSON, nullable=True)
    selected_task_count = Column(Integer, nullable=False, default=0)
    warnings_count = Column(Integer, nullable=False, default=0)
    invalid_count = Column(Integer, nullable=False, default=0)

    user = relationship("User", backref="yki_exam_assembly_audit_logs")


class YKISessionResult(Base):
    __tablename__ = "yki_session_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("yki_sessions.session_id"), nullable=False, index=True)
    task_id = Column(String, nullable=False, index=True)
    response_payload = Column(JSON, nullable=False)
    score_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("YKISession", backref="results")


class YKIEvaluation(Base):
    __tablename__ = "yki_evaluations"

    evaluation_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_attempt_id = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    exam_type = Column(String, nullable=False, default="full")
    evaluator_version = Column(String, nullable=False, default="heuristic_v1")
    sections_payload = Column(JSON, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="yki_evaluations")


class YKIPlacement(Base):
    __tablename__ = "yki_placements"

    placement_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String, ForeignKey("yki_evaluations.evaluation_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    level_band_attempted = Column(String, nullable=False, index=True)
    placement_band = Column(String, nullable=False, index=True)
    section_bands = Column(JSON, nullable=True)
    numeric_score = Column(Float, nullable=True)
    confidence = Column(String, nullable=False, default="medium")
    algorithm_version = Column(String, nullable=False, default="weighted_avg_v1")
    recommendation_payload = Column(JSON, nullable=True)
    decided_at = Column(DateTime, default=datetime.utcnow, index=True)

    evaluation = relationship("YKIEvaluation", backref="placement", uselist=False)
    user = relationship("User", backref="yki_placements")


class YKISessionAttempt(Base):
    __tablename__ = "yki_session_attempts"

    attempt_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("yki_sessions.session_id"), nullable=True, unique=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    mode = Column(String, nullable=False, index=True)  # practice | daily | conversation
    level_band = Column(String, nullable=False, index=True)
    skill = Column(String, nullable=False, index=True)
    seed = Column(String, nullable=False)
    strict = Column(Boolean, nullable=False, default=True)
    bank_version = Column(String, nullable=True)
    selected_task_ids = Column(JSON, nullable=False)
    sections = Column(JSON, nullable=True)
    warnings_count = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    finished_at = Column(DateTime, nullable=True, index=True)

    user = relationship("User", backref="yki_session_attempts")
    session = relationship("YKISession", backref="attempt_record", uselist=False)


class YKIDailySession(Base):
    __tablename__ = "yki_daily_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    session_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD (Europe/Helsinki)
    level_band = Column(String, nullable=False, index=True)
    mode = Column(String, nullable=False, default="daily", index=True)
    seed = Column(String, nullable=False)
    session_attempt_id = Column(
        String,
        ForeignKey("yki_session_attempts.attempt_id"),
        nullable=False,
        unique=True,
        index=True,
    )
    selected_task_ids = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="yki_daily_sessions")
    session_attempt = relationship("YKISessionAttempt", backref="daily_session", uselist=False)


class YKISessionAttemptTask(Base):
    __tablename__ = "yki_session_attempt_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_attempt_id = Column(
        String,
        ForeignKey("yki_session_attempts.attempt_id"),
        nullable=False,
        index=True,
    )
    task_id = Column(String, nullable=False, index=True)
    task_index = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    session_attempt = relationship("YKISessionAttempt", backref="task_rows")


class YKISpeakingTurn(Base):
    __tablename__ = "yki_speaking_turns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("yki_sessions.session_id"), nullable=False, index=True)
    task_id = Column(String, nullable=False, index=True)
    turn_index = Column(Integer, nullable=False, index=True)
    speaker = Column(String, nullable=False, index=True)  # ai | user
    text_fi = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("YKISession", backref="speaking_turns")


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class VoiceTurn(Base):
    __tablename__ = "voice_turns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("voice_sessions.id"), nullable=True, index=True)
    task_id = Column(String, nullable=True, index=True)
    user_turn_index = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    mime_type = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    original_path = Column(Text, nullable=True)
    normalized_path = Column(Text, nullable=True)
    normalized_format = Column(String, nullable=True)  # wav16k_mono

    transcript_text = Column(Text, nullable=True)
    transcript_language = Column(String, nullable=True)
    transcript_confidence = Column(Float, nullable=True)

    error_code = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)

    session = relationship("VoiceSession", backref="turns")


class VoiceEvent(Base):
    __tablename__ = "voice_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    session_id = Column(String, nullable=True, index=True)
    turn_id = Column(String, nullable=True, index=True)
    event_type = Column(String, nullable=False, index=True)
    payload_json = Column(Text, nullable=True)


class CardAdaptivePerformance(Base):
    __tablename__ = "card_adaptive_performance"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True, index=True)
    card_id = Column(String, primary_key=True, index=True)
    total_attempts = Column(Integer, nullable=False, default=0)
    correct_attempts = Column(Integer, nullable=False, default=0)
    incorrect_attempts = Column(Integer, nullable=False, default=0)
    last_seen_at = Column(DateTime, nullable=True)
    last_correct_at = Column(DateTime, nullable=True)
    success_rate = Column(Float, nullable=False, default=0.0)
    streak = Column(Integer, nullable=False, default=0)
    difficulty_score = Column(Float, nullable=False, default=0.6)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", backref="card_adaptive_performance_rows")

    def to_domain_model(self):
        from app.cards.adaptive.models import CardPerformanceRecord

        return CardPerformanceRecord(
            card_id=self.card_id,
            user_id=self.user_id,
            total_attempts=self.total_attempts,
            correct_attempts=self.correct_attempts,
            incorrect_attempts=self.incorrect_attempts,
            last_seen_at=_ensure_utc(self.last_seen_at),
            last_correct_at=_ensure_utc(self.last_correct_at),
            success_rate=self.success_rate,
            streak=self.streak,
            difficulty_score=self.difficulty_score,
        )

    def apply_domain_model(self, record) -> None:
        self.total_attempts = record.total_attempts
        self.correct_attempts = record.correct_attempts
        self.incorrect_attempts = record.incorrect_attempts
        self.last_seen_at = record.last_seen_at
        self.last_correct_at = record.last_correct_at
        self.success_rate = record.success_rate
        self.streak = record.streak
        self.difficulty_score = record.difficulty_score


class CardReviewState(Base):
    __tablename__ = "card_review_states"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True, index=True)
    card_id = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False, index=True)
    last_seen_at = Column(DateTime, nullable=True)
    last_answered_at = Column(DateTime, nullable=True)
    last_outcome = Column(String, nullable=True)
    streak = Column(Integer, nullable=False, default=0)
    ease_score = Column(Float, nullable=False, default=2.5)
    interval_days = Column(Integer, nullable=False, default=0)
    due_at = Column(DateTime, nullable=True, index=True)
    error_count = Column(Integer, nullable=False, default=0)
    weak_area_tags = Column(JSON, nullable=False, default=list)
    last_variant_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", backref="card_review_state_rows")

    def to_domain_model(self):
        from app.cards.schemas.common import AnswerOutcome, ReviewStateStatus
        from app.cards.schemas.follow_ups import FollowUpVariantType
        from app.cards.schemas.session import CardReviewState as CardReviewStateModel

        return CardReviewStateModel(
            card_id=self.card_id,
            user_id=self.user_id,
            status=ReviewStateStatus(self.status),
            last_seen_at=_ensure_utc(self.last_seen_at),
            last_answered_at=_ensure_utc(self.last_answered_at),
            last_outcome=AnswerOutcome(self.last_outcome) if self.last_outcome else None,
            streak=self.streak,
            ease_score=self.ease_score,
            interval_days=self.interval_days,
            due_at=_ensure_utc(self.due_at),
            error_count=self.error_count,
            weak_area_tags=list(self.weak_area_tags or []),
            last_variant_type=FollowUpVariantType(self.last_variant_type) if self.last_variant_type else None,
        )

    def apply_domain_model(self, record) -> None:
        self.status = record.status.value
        self.last_seen_at = record.last_seen_at
        self.last_answered_at = record.last_answered_at
        self.last_outcome = record.last_outcome.value if record.last_outcome else None
        self.streak = record.streak
        self.ease_score = record.ease_score
        self.interval_days = record.interval_days
        self.due_at = record.due_at
        self.error_count = record.error_count
        self.weak_area_tags = list(record.weak_area_tags)
        self.last_variant_type = record.last_variant_type.value if record.last_variant_type else None


class AudioAssetRow(Base):
    __tablename__ = "audio_assets"

    id = Column(String, primary_key=True)
    text_hash = Column(String, nullable=False, unique=True, index=True)
    source_text = Column(Text, nullable=False)
    speaker_id = Column(String, nullable=False, index=True)
    speaker_label = Column(String, nullable=False)
    voice_profile = Column(String, nullable=False, index=True)
    voice_id = Column(String, nullable=False)
    provider = Column(String, nullable=False, index=True)
    speaking_style = Column(String, nullable=False, index=True)
    speed = Column(Float, nullable=False)
    context_type = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    media_type = Column(String, nullable=False, default="audio/wav")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_domain_model(self):
        from pathlib import Path

        from app.audio.models import AudioAsset

        return AudioAsset(
            id=self.id,
            text_hash=self.text_hash,
            source_text=self.source_text,
            speaker_id=self.speaker_id,
            speaker_label=self.speaker_label,
            voice_profile=self.voice_profile,
            voice_id=self.voice_id,
            provider=self.provider,
            speaking_style=self.speaking_style,
            speed=self.speed,
            context_type=self.context_type,
            file_path=Path(self.file_path),
            duration_seconds=self.duration_seconds,
            media_type=self.media_type,
            created_at=_ensure_utc(self.created_at),
        )


class CardReviewQueueSnapshot(Base):
    __tablename__ = "card_review_queue_snapshots"

    queue_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, index=True)
    filters_json = Column(JSON, nullable=False)
    selected_card_ids = Column(JSON, nullable=False, default=list)
    due_card_ids = Column(JSON, nullable=False, default=list)
    new_card_ids = Column(JSON, nullable=False, default=list)
    difficult_card_ids = Column(JSON, nullable=False, default=list)
    selection_reasons = Column(JSON, nullable=False, default=list)

    user = relationship("User", backref="card_review_queue_snapshots")

    def to_domain_model(self):
        from app.cards.adaptive.models import AdaptiveSessionFilters, AdaptiveSelectionReason, ReviewQueueSnapshot

        return ReviewQueueSnapshot(
            queue_id=self.queue_id,
            user_id=self.user_id,
            created_at=_ensure_utc(self.created_at),
            filters=AdaptiveSessionFilters.model_validate(self.filters_json),
            selected_card_ids=list(self.selected_card_ids or []),
            due_card_ids=list(self.due_card_ids or []),
            new_card_ids=list(self.new_card_ids or []),
            difficult_card_ids=list(self.difficult_card_ids or []),
            selection_reasons=[
                AdaptiveSelectionReason.model_validate(item) for item in (self.selection_reasons or [])
            ],
        )

    def apply_domain_model(self, snapshot) -> None:
        self.created_at = snapshot.created_at
        self.filters_json = snapshot.filters.model_dump(mode="json")
        self.selected_card_ids = list(snapshot.selected_card_ids)
        self.due_card_ids = list(snapshot.due_card_ids)
        self.new_card_ids = list(snapshot.new_card_ids)
        self.difficult_card_ids = list(snapshot.difficult_card_ids)
        self.selection_reasons = [item.model_dump(mode="json") for item in snapshot.selection_reasons]


class CardRuntimeSession(Base):
    __tablename__ = "card_runtime_sessions"

    session_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    target_kind = Column(String, nullable=False)
    target_id = Column(String, nullable=False, index=True)
    target_version = Column(Integer, nullable=False, default=1)
    selected_card_ids = Column(JSON, nullable=False, default=list)
    current_card_index = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, index=True)
    served_variant_history = Column(JSON, nullable=False, default=list)
    served_variant_indices = Column(JSON, nullable=False, default=dict)
    selection_reasons = Column(JSON, nullable=False, default=dict)
    adaptive_session = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, index=True)
    updated_at = Column(DateTime, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True, index=True)

    user = relationship("User", backref="card_runtime_sessions")


class CardRuntimeAnswer(Base):
    __tablename__ = "card_runtime_answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("card_runtime_sessions.session_id"), nullable=False, index=True)
    card_id = Column(String, nullable=False, index=True)
    sequence_index = Column(Integer, nullable=False, index=True)
    answered_at = Column(DateTime, nullable=False, index=True)
    user_answer = Column(Text, nullable=False)
    normalized_user_answer = Column(Text, nullable=False)
    correct = Column(Boolean, nullable=False)
    outcome = Column(String, nullable=False)
    variant_type = Column(String, nullable=False)

    session = relationship("CardRuntimeSession", backref="answer_rows")


class CardDatasetVersion(Base):
    __tablename__ = "card_dataset_versions"

    dataset_version_id = Column(String, primary_key=True)
    dataset_name = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False, index=True)
    source_version_tag = Column(String, nullable=False)
    source_manifest_ref = Column(String, nullable=True)
    card_count = Column(Integer, nullable=False, default=0)
    deck_count = Column(Integer, nullable=False, default=0)
    module_count = Column(Integer, nullable=False, default=0)
    published_by_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, index=True)
    published_at = Column(DateTime, nullable=False, index=True)
    archived_at = Column(DateTime, nullable=True, index=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="card_dataset_versions")


class PublishedCard(Base):
    __tablename__ = "published_cards"

    dataset_version_id = Column(
        String,
        ForeignKey("card_dataset_versions.dataset_version_id"),
        primary_key=True,
    )
    card_id = Column(String, primary_key=True, index=True)
    content_type = Column(String, nullable=False, index=True)
    path = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)
    profession = Column(String, nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    difficulty = Column(String, nullable=False, index=True)
    version = Column(Integer, nullable=False)
    version_tag = Column(String, nullable=False)
    card_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, index=True)

    dataset = relationship("CardDatasetVersion", backref="published_card_rows")


class PublishedDeck(Base):
    __tablename__ = "published_decks"

    dataset_version_id = Column(
        String,
        ForeignKey("card_dataset_versions.dataset_version_id"),
        primary_key=True,
    )
    deck_id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    path = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)
    profession = Column(String, nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    content_type = Column(String, nullable=False, index=True)
    lifecycle_state = Column(String, nullable=False, index=True)
    module_ids = Column(JSON, nullable=False, default=list)
    card_ids = Column(JSON, nullable=False, default=list)
    card_total = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, index=True)
    published_at = Column(DateTime, nullable=False, index=True)
    archived_at = Column(DateTime, nullable=True, index=True)

    dataset = relationship("CardDatasetVersion", backref="published_deck_rows")


class PublishedModule(Base):
    __tablename__ = "published_modules"

    dataset_version_id = Column(
        String,
        ForeignKey("card_dataset_versions.dataset_version_id"),
        primary_key=True,
    )
    module_id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    path = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)
    profession = Column(String, nullable=False, index=True)
    level_band = Column(String, nullable=False, index=True)
    content_type = Column(String, nullable=False, index=True)
    lifecycle_state = Column(String, nullable=False, index=True)
    card_ids = Column(JSON, nullable=False, default=list)
    card_total = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, index=True)
    published_at = Column(DateTime, nullable=False, index=True)
    archived_at = Column(DateTime, nullable=True, index=True)

    dataset = relationship("CardDatasetVersion", backref="published_module_rows")
