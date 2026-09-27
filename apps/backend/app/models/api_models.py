from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RegisterPasswordRequest(BaseModel):
    email: str
    password: str
    name: str | None = None
    captcha_token: str | None = None


class LoginPasswordRequest(BaseModel):
    email: str
    password: str


class LoginProviderRequest(BaseModel):
    provider_id: str
    provider_token: str


class GoogleAuthRequest(BaseModel):
    oauth_result_id: str | None = None
    redirect_origin: str | None = None
    credential: str | None = None
    id_token: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class SetPasswordRequest(BaseModel):
    email: str
    password: str
    confirm_password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirmRequest(BaseModel):
    token: str
    password: str
    confirm_password: str


class EmailVerificationRequest(BaseModel):
    email: str


class EmailVerificationConfirmRequest(BaseModel):
    token: str


class DeleteAccountRequest(BaseModel):
    confirm_delete: bool = False
    deletion_reason: str | None = Field(default=None, max_length=240)


class TtsRequest(BaseModel):
    text: str
    voice: str | None = None
    voice_preference: str | None = None
    voice_profile: str | None = None
    language_code: str | None = None
    provider: str | None = None
    mode: str | None = None
    speed: float | None = None
    replayable: bool = True


class PronunciationAnalyzeRequest(BaseModel):
    expected_text: str
    transcript: str


class RoleplayCreateRequest(BaseModel):
    scenario_id: str
    level: str = "B1-B2"
    display_preferences: dict[str, Any] | None = None


class RoleplayTurnRequest(BaseModel):
    user_message: str


class StartExamRequest(BaseModel):
    level_band: str = "B1_B2"
    mode: str | None = None
    metadata: dict[str, Any] | None = None


class ObjectiveAnswerRequest(BaseModel):
    task_id: str
    item_id: str | None = None
    answer: Any = None


class WritingAnswerRequest(BaseModel):
    task_id: str
    text: str


class AudioReferenceRequest(BaseModel):
    task_id: str
    audio_ref: str


class SpeakingAnswerRequest(BaseModel):
    item_id: str
    audio_ref: str
    duration_sec: float = Field(default=0.0, ge=0.0)
    transcript_text: str | None = Field(
        default=None,
        max_length=12000,
    )


class StartConversationRequest(BaseModel):
    task_id: str


class SubmitConversationTurnRequest(BaseModel):
    task_id: str
    turn_id: str
    audio_ref: str
    transcript_text: str | None = None


class GenerateConversationReplyRequest(BaseModel):
    task_id: str


class SubmitExamRequest(BaseModel):
    confirm_incomplete: bool = False
