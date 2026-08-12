from __future__ import annotations

import sys
from dataclasses import dataclass, field
import os
from os import getenv
from pathlib import Path

from app.core.paths import BACKEND_ROOT as _BACKEND_ROOT, REPO_ROOT as _REPO_ROOT

def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    existing_keys = set(os.environ.keys())
    parsed: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            parsed[key] = value
    for key, value in parsed.items():
        if key not in existing_keys:
            os.environ[key] = value


# Load repo-level env first, then backend-specific env so backend-local settings win
# when the process was started without sourcing env vars explicitly.
_load_env_file(_REPO_ROOT / ".env")
_load_env_file(_BACKEND_ROOT / ".env")

_DEV_SECRET_SENTINEL = "dev-only-secret-change-me"
_DEFAULT_GOOGLE_WEB_CLIENT_ID = "284679188970-gct31rk3jklvsfic6i0o4k7bsgpkf41t.apps.googleusercontent.com"
_DEFAULT_GOOGLE_ANDROID_CLIENT_ID = "284679188970-c09s4lf1vbbt1cq2i9fptoqnf28bqvmv.apps.googleusercontent.com"


def _environment_name() -> str:
    return ((getenv("FLOENTLY_ENV") or getenv("APP_ENV") or "development").strip() or "development").lower()


def _is_non_production_env() -> bool:
    return _environment_name() in {"development", "dev", "local", "test", "testing"}


def _default_dev_mode() -> str:
    return "true" if _is_non_production_env() else "false"


def _get_bool(name: str, default: str = "false") -> bool:
    return getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    raw = getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _get_float(name: str, default: float) -> float:
    raw = getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _get_list(name: str, default: str = "") -> tuple[str, ...]:
    raw = getenv(name, default)
    if not raw:
        return tuple()
    return tuple(part.strip() for part in raw.split(",") if part.strip())


def _get_optional_str(*names: str) -> str | None:
    for name in names:
        raw = getenv(name)
        if raw is not None:
            value = raw.strip()
            if value:
                return value
    return None


@dataclass(frozen=True)
class Settings:
    app_name: str = getenv("APP_NAME", "Floently Finnish API") or "Floently Finnish API"
    api_version: str = getenv("API_VERSION", "v1") or "v1"
    app_env: str = (getenv("APP_ENV") or getenv("FLOENTLY_ENV") or "development").strip() or "development"
    environment: str = (getenv("FLOENTLY_ENV") or getenv("APP_ENV") or "development").strip() or "development"
    dev_mode: bool = _get_bool("FLOENTLY_DEV_MODE", _default_dev_mode())
    debug: bool = _get_bool("DEBUG", _default_dev_mode()) or _get_bool("FLOENTLY_DEV_MODE", _default_dev_mode())
    log_level: str = (getenv("LOG_LEVEL", "INFO") or "INFO").strip() or "INFO"
    allow_dev_entitlement_override: bool = _get_bool("ALLOW_DEV_ENTITLEMENT_OVERRIDE", "false") and _is_non_production_env()

    access_token_minutes: int = _get_int("ACCESS_TOKEN_MINUTES", 43200)  # 30 days — mobile app uses SecureStore
    access_token_expire_minutes: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", _get_int("ACCESS_TOKEN_MINUTES", 43200))
    refresh_token_days: int = _get_int("REFRESH_TOKEN_DAYS", 90)
    refresh_token_expire_days: int = _get_int("REFRESH_TOKEN_EXPIRE_DAYS", _get_int("REFRESH_TOKEN_DAYS", 90))
    password_reset_token_ttl_minutes: int = _get_int("PASSWORD_RESET_TOKEN_TTL_MINUTES", 30)
    password_reset_rate_limit_window_seconds: int = _get_int("PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS", 900)
    password_reset_rate_limit_per_email: int = _get_int("PASSWORD_RESET_RATE_LIMIT_PER_EMAIL", 3)
    password_reset_rate_limit_per_ip: int = _get_int("PASSWORD_RESET_RATE_LIMIT_PER_IP", 20)
    register_rate_limit_window_seconds: int = _get_int("REGISTER_RATE_LIMIT_WINDOW_SECONDS", 900)
    register_rate_limit_per_email: int = _get_int("REGISTER_RATE_LIMIT_PER_EMAIL", 3)
    register_rate_limit_per_ip: int = _get_int("REGISTER_RATE_LIMIT_PER_IP", 10)
    require_email_verification: bool = _get_bool("REQUIRE_EMAIL_VERIFICATION", "false")
    signup_captcha_secret: str | None = _get_optional_str("SIGNUP_CAPTCHA_SECRET", "CAPTCHA_SECRET")
    signup_captcha_verify_url: str = (
        getenv("SIGNUP_CAPTCHA_VERIFY_URL", "https://challenges.cloudflare.com/turnstile/v0/siteverify")
        or "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    ).strip() or "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    password_reset_deep_link_base: str = (
        getenv("PASSWORD_RESET_DEEP_LINK_BASE", "floently://auth/reset-password") or "floently://auth/reset-password"
    ).strip() or "floently://auth/reset-password"
    password_reset_web_base_url: str = (
        getenv("PASSWORD_RESET_WEB_BASE_URL", "https://app.kielivalmis.com/auth/reset-password")
        or "https://app.kielivalmis.com/auth/reset-password"
    ).strip() or "https://app.kielivalmis.com/auth/reset-password"
    password_reset_email_from: str | None = _get_optional_str("PASSWORD_RESET_EMAIL_FROM")
    password_reset_email_webhook_url: str | None = _get_optional_str("PASSWORD_RESET_EMAIL_WEBHOOK_URL")

    auth_provider_ids: tuple[str, ...] = field(default_factory=lambda: _get_list("AUTH_PROVIDER_IDS"))
    auth_mode: str | None = _get_optional_str("AUTH_MODE")
    auth_bootstrap_password_users_json: str | None = _get_optional_str("AUTH_BOOTSTRAP_PASSWORD_USERS_JSON")
    google_oauth_client_id: str = (getenv("GOOGLE_OAUTH_CLIENT_ID", _DEFAULT_GOOGLE_WEB_CLIENT_ID) or _DEFAULT_GOOGLE_WEB_CLIENT_ID).strip()
    google_oauth_web_client_id: str = (getenv("GOOGLE_OAUTH_WEB_CLIENT_ID", _DEFAULT_GOOGLE_WEB_CLIENT_ID) or _DEFAULT_GOOGLE_WEB_CLIENT_ID).strip()
    google_oauth_android_client_id: str = (getenv("GOOGLE_OAUTH_ANDROID_CLIENT_ID", _DEFAULT_GOOGLE_ANDROID_CLIENT_ID) or _DEFAULT_GOOGLE_ANDROID_CLIENT_ID).strip()
    google_oauth_allowed_client_ids: tuple[str, ...] = field(
        default_factory=lambda: _get_list(
            "GOOGLE_OAUTH_ALLOWED_CLIENT_IDS",
            ",".join((_DEFAULT_GOOGLE_WEB_CLIENT_ID, _DEFAULT_GOOGLE_ANDROID_CLIENT_ID)),
        )
    )
    google_oauth_client_secret: str = (getenv("GOOGLE_OAUTH_CLIENT_SECRET", "") or "").strip()
    google_oauth_timeout_seconds: int = max(_get_int("GOOGLE_OAUTH_TIMEOUT_SECONDS", 600), 60)

    secret_key: str = (_get_optional_str("SECRET_KEY", "SIGNED_SESSION_SECRET") or _DEV_SECRET_SENTINEL)
    signed_session_secret: str = (_get_optional_str("SIGNED_SESSION_SECRET", "SECRET_KEY") or _DEV_SECRET_SENTINEL)
    jwt_algorithm: str = (getenv("JWT_ALGORITHM", "HS256") or "HS256").strip() or "HS256"

    openai_api_key: str = (_get_optional_str("OPENAI_API_KEY", "OPENAI_STT_API_KEY", "PUHIS_OPENAI_API_KEY") or "")
    openai_model: str | None = _get_optional_str("OPENAI_MODEL")
    openai_temperature: float | None = None if getenv("OPENAI_TEMPERATURE") in (None, "") else _get_float("OPENAI_TEMPERATURE", 0.2)
    database_url: str | None = _get_optional_str("DATABASE_URL")

    cors_allow_origins: tuple[str, ...] = field(
        default_factory=lambda: _get_list(
            "CORS_ORIGINS",
            getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://localhost:8081,http://127.0.0.1:3000"),
        )
    )
    cors_allow_credentials: bool = _get_bool("CORS_ALLOW_CREDENTIALS", "true")
    cors_allow_origin_regex: str = getenv(
        "CORS_ALLOW_ORIGIN_REGEX",
        r"^https?://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    )

    port: int = _get_int("PORT", 8000)
    host: str = (getenv("HOST", "0.0.0.0") or "0.0.0.0").strip() or "0.0.0.0"
    public_base_url: str | None = _get_optional_str("PUBLIC_BASE_URL")
    billing_checkout_base_url: str | None = _get_optional_str("BILLING_CHECKOUT_BASE_URL")
    billing_portal_base_url: str | None = _get_optional_str("BILLING_PORTAL_BASE_URL")
    frontend_base_url: str | None = _get_optional_str("FRONTEND_BASE_URL")
    stripe_secret_key: str | None = _get_optional_str("STRIPE_SECRET_KEY")
    stripe_webhook_secret: str | None = _get_optional_str("STRIPE_WEBHOOK_SECRET")
    stripe_price_yki_1_month: str | None = _get_optional_str("STRIPE_PRICE_YKI_1_MONTH")
    stripe_price_yki_3_months: str | None = _get_optional_str("STRIPE_PRICE_YKI_3_MONTHS")
    stripe_price_yki_12_months: str | None = _get_optional_str("STRIPE_PRICE_YKI_12_MONTHS")
    stripe_price_professional_1_profession_1_month: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_1_PROFESSION_1_MONTH")
    stripe_price_professional_1_profession_3_months: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_1_PROFESSION_3_MONTHS")
    stripe_price_professional_1_profession_12_months: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_1_PROFESSION_12_MONTHS")
    stripe_price_professional_2_professions_1_month: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_2_PROFESSIONS_1_MONTH")
    stripe_price_professional_2_professions_3_months: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_2_PROFESSIONS_3_MONTHS")
    stripe_price_professional_2_professions_12_months: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_2_PROFESSIONS_12_MONTHS")
    stripe_price_professional_3_professions_1_month: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_3_PROFESSIONS_1_MONTH")
    stripe_price_professional_3_professions_3_months: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_3_PROFESSIONS_3_MONTHS")
    stripe_price_professional_3_professions_12_months: str | None = _get_optional_str("STRIPE_PRICE_PROFESSIONAL_3_PROFESSIONS_12_MONTHS")
    stripe_price_bundle_1_profession_1_month: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_1_PROFESSION_1_MONTH")
    stripe_price_bundle_1_profession_3_months: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_1_PROFESSION_3_MONTHS")
    stripe_price_bundle_1_profession_12_months: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_1_PROFESSION_12_MONTHS")
    stripe_price_bundle_2_professions_1_month: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_2_PROFESSIONS_1_MONTH")
    stripe_price_bundle_2_professions_3_months: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_2_PROFESSIONS_3_MONTHS")
    stripe_price_bundle_2_professions_12_months: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_2_PROFESSIONS_12_MONTHS")
    stripe_price_bundle_3_professions_1_month: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_3_PROFESSIONS_1_MONTH")
    stripe_price_bundle_3_professions_3_months: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_3_PROFESSIONS_3_MONTHS")
    stripe_price_bundle_3_professions_12_months: str | None = _get_optional_str("STRIPE_PRICE_BUNDLE_3_PROFESSIONS_12_MONTHS")
    yki_engine_base_url: str = (getenv("YKI_ENGINE_BASE_URL", "http://localhost:8010") or "http://localhost:8010").strip() or "http://localhost:8010"
    yki_engine_repo_root: str = (getenv("YKI_ENGINE_REPO_ROOT", str(_BACKEND_ROOT)) or str(_BACKEND_ROOT)).strip() or str(_BACKEND_ROOT)
    yki_engine_timeout_seconds: float = _get_float("YKI_ENGINE_TIMEOUT_SECONDS", 3.0)
    trusted_hosts: tuple[str, ...] = field(default_factory=lambda: _get_list("TRUSTED_HOSTS", "localhost,127.0.0.1"))
    max_request_bytes: int = _get_int("MAX_REQUEST_BYTES", 25 * 1024 * 1024)
    allow_orm_create_all: bool = _get_bool("ALLOW_ORM_CREATE_ALL", "false")
    admin_email_allowlist: tuple[str, ...] = field(default_factory=lambda: tuple(value.lower() for value in _get_list("ADMIN_EMAIL_ALLOWLIST")))
    internal_all_access_emails: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            value.lower()
            for value in (
                _get_list("INTERNAL_ALL_ACCESS_TEST_EMAILS")
                + _get_list("ALL_ACCESS_TEST_EMAILS")
            )
        )
    )

    default_review_queue_size: int = _get_int("DEFAULT_REVIEW_QUEUE_SIZE", 12)
    daily_goal_items: int = _get_int("DAILY_GOAL_ITEMS", 20)
    roleplay_session_ttl_minutes: int = _get_int("ROLEPLAY_SESSION_TTL_MINUTES", 60)

    tts_enabled: bool = _get_bool("TTS_ENABLED", "true")
    tts_default_provider: str = (getenv("TTS_DEFAULT_PROVIDER", "google") or "google").strip().lower() or "google"
    tts_fallback_provider: str = (getenv("TTS_FALLBACK_PROVIDER", "openai") or "openai").strip().lower() or "openai"
    fail_soft_on_tts_error: bool = _get_bool("FAIL_SOFT_ON_TTS_ERROR", "true")
    internal_tts_token: str | None = _get_optional_str("INTERNAL_TTS_TOKEN")
    tts_voice_a: str = (getenv("TTS_VOICE_A", "alloy") or "alloy").strip() or "alloy"
    tts_voice_b: str = (getenv("TTS_VOICE_B", "nova") or "nova").strip() or "nova"

    google_tts_enabled: bool = _get_bool("GOOGLE_TTS_ENABLED", "true")
    google_tts_credentials_path: str | None = _get_optional_str("GOOGLE_TTS_CREDENTIALS_PATH", "GOOGLE_STT_CREDENTIALS_PATH", "GOOGLE_APPLICATION_CREDENTIALS")
    google_tts_language_code: str = (getenv("GOOGLE_TTS_LANGUAGE_CODE", "fi-FI") or "fi-FI").strip() or "fi-FI"
    google_tts_default_voice: str | None = _get_optional_str("GOOGLE_TTS_DEFAULT_VOICE")

    openai_tts_enabled: bool = _get_bool("OPENAI_TTS_ENABLED", "true")
    openai_tts_model: str = (getenv("OPENAI_TTS_MODEL", "tts-1") or "tts-1").strip() or "tts-1"
    openai_tts_default_voice: str | None = _get_optional_str("OPENAI_TTS_DEFAULT_VOICE")

    azure_tts_enabled: bool = _get_bool("AZURE_TTS_ENABLED", "false")
    azure_tts_api_key: str = (getenv("AZURE_TTS_API_KEY", getenv("AZURE_SPEECH_KEY", "")) or "").strip()
    azure_tts_endpoint: str = (getenv("AZURE_TTS_ENDPOINT", "") or "").strip()
    azure_tts_region: str = (getenv("AZURE_TTS_REGION", getenv("AZURE_SPEECH_REGION", "")) or "").strip()
    azure_tts_default_voice: str | None = _get_optional_str("AZURE_TTS_DEFAULT_VOICE", "AZURE_DEFAULT_VOICE")
    azure_speech_key: str | None = _get_optional_str("AZURE_SPEECH_KEY", "AZURE_TTS_API_KEY")
    azure_speech_region: str | None = _get_optional_str("AZURE_SPEECH_REGION", "AZURE_TTS_REGION")
    azure_default_voice: str | None = _get_optional_str("AZURE_DEFAULT_VOICE", "AZURE_TTS_DEFAULT_VOICE")
    azure_speech_voices: tuple[str, ...] = field(default_factory=lambda: _get_list("AZURE_SPEECH_VOICES"))

    elevenlabs_tts_enabled: bool = _get_bool("ELEVENLABS_TTS_ENABLED", "false")
    elevenlabs_api_key: str = (getenv("ELEVENLABS_API_KEY", getenv("ELEVEN_API_KEY", "")) or "").strip()
    elevenlabs_default_voice_id: str | None = _get_optional_str("ELEVENLABS_DEFAULT_VOICE_ID", "ELEVEN_DEFAULT_VOICE")
    eleven_api_key: str | None = _get_optional_str("ELEVEN_API_KEY", "ELEVENLABS_API_KEY")
    eleven_default_voice: str | None = _get_optional_str("ELEVEN_DEFAULT_VOICE", "ELEVENLABS_DEFAULT_VOICE_ID")
    eleven_voice_ids: tuple[str, ...] = field(default_factory=lambda: _get_list("ELEVEN_VOICE_IDS"))

    card_default_dataset_name: str = (getenv("CARD_DEFAULT_DATASET_NAME", "default") or "default").strip() or "default"
    card_rate_limit_window_seconds: int = _get_int("CARD_RATE_LIMIT_WINDOW_SECONDS", 60)
    card_session_start_limit: int = _get_int("CARD_SESSION_START_LIMIT", 30)
    card_adaptive_start_limit: int = _get_int("CARD_ADAPTIVE_START_LIMIT", 30)
    card_answer_limit: int = _get_int("CARD_ANSWER_LIMIT", 240)
    card_runtime_answer_retention_days: int = _get_int("CARD_RUNTIME_ANSWER_RETENTION_DAYS", 90)
    card_runtime_session_retention_days: int = _get_int("CARD_RUNTIME_SESSION_RETENTION_DAYS", 30)
    card_review_queue_retention_days: int = _get_int("CARD_REVIEW_QUEUE_RETENTION_DAYS", 30)

    puhis_eleven_api_key: str | None = _get_optional_str("PUHIS_ELEVEN_API_KEY")
    puhis_eleven_voice_ids: str | None = _get_optional_str("PUHIS_ELEVEN_VOICE_IDS")
    puhis_eleven_default_voice: str | None = _get_optional_str("PUHIS_ELEVEN_DEFAULT_VOICE")
    puhis_eleven_model: str | None = _get_optional_str("PUHIS_ELEVEN_MODEL")
    puhis_eleven_stability: float | None = None if getenv("PUHIS_ELEVEN_STABILITY") in (None, "") else _get_float("PUHIS_ELEVEN_STABILITY", 0.5)
    puhis_eleven_similarity: float | None = None if getenv("PUHIS_ELEVEN_SIMILARITY") in (None, "") else _get_float("PUHIS_ELEVEN_SIMILARITY", 0.5)

    puhis_azure_speech_key: str | None = _get_optional_str("PUHIS_AZURE_SPEECH_KEY")
    puhis_azure_speech_region: str | None = _get_optional_str("PUHIS_AZURE_SPEECH_REGION")
    puhis_azure_speech_voices: str | None = _get_optional_str("PUHIS_AZURE_SPEECH_VOICES")
    puhis_azure_speech_default_voice: str | None = _get_optional_str("PUHIS_AZURE_SPEECH_DEFAULT_VOICE")
    puhis_azure_speech_language: str | None = _get_optional_str("PUHIS_AZURE_SPEECH_LANGUAGE")

    enable_request_logging: bool = _get_bool("ENABLE_REQUEST_LOGGING", "false")
    enable_tts_logging: bool = _get_bool("ENABLE_TTS_LOGGING", "false")

    yki_bank_root: str | None = _get_optional_str("YKI_BANK_ROOT")
    yki_bank_roots: str | None = _get_optional_str("YKI_BANK_ROOTS")
    yki_assembler_strict: bool = _get_bool("YKI_ASSEMBLER_STRICT", "false")
    yki_strict_blueprint_validation: bool = _get_bool("YKI_STRICT_BLUEPRINT_VALIDATION", "false")
    yki_require_certified_state: bool = _get_bool("YKI_REQUIRE_CERTIFIED_STATE", "false")
    yki_require_snapshots: bool = _get_bool("YKI_REQUIRE_SNAPSHOTS", "false")
    yki_min_certification_version: str | None = _get_optional_str("YKI_MIN_CERTIFICATION_VERSION")
    yki_assembler_max_expand_steps: int = _get_int("YKI_ASSEMBLER_MAX_EXPAND_STEPS", 2)
    yki_enable_legacy_exam_generate: bool = _get_bool("YKI_ENABLE_LEGACY_EXAM_GENERATE", "false")
    yki_skip_hygiene_report: bool = _get_bool("YKI_SKIP_HYGIENE_REPORT", "false")
    yki_skip_assembly_language_check: bool = _get_bool("YKI_SKIP_ASSEMBLY_LANGUAGE_CHECK", "false")
    yki_writing_min_chars_a1a2: int = _get_int("YKI_WRITING_MIN_CHARS_A1A2", 20)
    yki_speaking_min_chars_a1a2: int = _get_int("YKI_SPEAKING_MIN_CHARS_A1A2", 10)
    yki_fingerprint_cooldown_hours: int = _get_int("YKI_FINGERPRINT_COOLDOWN_HOURS", 72)
    yki_fingerprint_cooldown_exams: int = _get_int("YKI_FINGERPRINT_COOLDOWN_EXAMS", 10)
    yki_cooldown_mode: str = (getenv("YKI_COOLDOWN_MODE", "") or "").strip().lower()
    yki_bank_lock_hash: str | None = _get_optional_str("YKI_BANK_LOCK_HASH")

    def google_oauth_valid_audiences(self) -> tuple[str, ...]:
        values = (
            self.google_oauth_client_id,
            self.google_oauth_web_client_id,
            self.google_oauth_android_client_id,
            *self.google_oauth_allowed_client_ids,
        )
        deduped: list[str] = []
        seen: set[str] = set()
        for raw in values:
            value = str(raw or "").strip()
            if not value or value in seen:
                continue
            seen.add(value)
            deduped.append(value)
        return tuple(deduped)

    def get_yki_cooldown_mode(self) -> str:
        mode = (self.yki_cooldown_mode or "").strip().lower()
        if mode in {"off", "soft", "strict"}:
            return mode
        return "soft" if (self.debug or self.environment == "development" or self.app_env == "development") else "strict"


SETTINGS = Settings()

if SETTINGS.environment != "development" and SETTINGS.signed_session_secret == _DEV_SECRET_SENTINEL:
    print(
        "FATAL: SIGNED_SESSION_SECRET must be set to a strong secret in non-development environments.",
        file=sys.stderr,
    )
    sys.exit(1)


def get_settings() -> Settings:
    return SETTINGS
