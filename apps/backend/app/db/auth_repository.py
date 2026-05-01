from __future__ import annotations

import json
import threading
from contextlib import contextmanager
from datetime import datetime, timezone

UTC = timezone.utc
from pathlib import Path
from typing import Any, Iterator

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import SETTINGS
from app.core.paths import BACKEND_ROOT
from app.core.utils import iso_now, new_id, normalize_email, parse_iso, utc_now
from app.db.models import Base, User


def _resolve_database_path(database_path: Path | None = None) -> Path:
    if database_path is not None:
        return database_path.expanduser().resolve()
    raw = SETTINGS.database_url or "sqlite+aiosqlite:///./puhis.db"
    if raw.startswith("sqlite"):
        from sqlalchemy.engine import make_url

        url = make_url(raw)
        db_path = Path(url.database or "./puhis.db")
        if not db_path.is_absolute():
            db_path = BACKEND_ROOT / db_path
        return db_path.resolve()
    return (BACKEND_ROOT / "puhis.db").resolve()


def _sqlite_sync_url(database_path: Path) -> str:
    return f"sqlite:///{database_path.as_posix()}"


def _coerce_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    parsed = parse_iso(str(value).strip())
    return parsed


def _serialize_datetime(value: Any) -> str | None:
    if value in (None, ""):
        return None
    if isinstance(value, str):
        text = value.strip()
        return text or None
    if isinstance(value, datetime):
        current = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
        return current.astimezone(UTC).replace(microsecond=0).isoformat()
    return str(value)


def _normalize_provider_links(value: Any) -> dict[str, str]:
    if isinstance(value, dict):
        result: dict[str, str] = {}
        for key, external_id in value.items():
            provider = str(key or "").strip().lower()
            subject = str(external_id or "").strip()
            if provider and subject:
                result[provider] = subject
        return result
    return {}


def _normalize_selected_professions(value: Any) -> list[str]:
    if value in (None, ""):
        return []
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                parsed = json.loads(text)
            except Exception:
                parsed = None
            else:
                return _normalize_selected_professions(parsed)
        return [item.strip() for item in text.split(",") if item.strip()]
    if isinstance(value, (list, tuple, set)):
        result: list[str] = []
        for item in value:
            text = str(item or "").strip()
            if text and text not in result:
                result.append(text)
        return result
    text = str(value or "").strip()
    return [text] if text else []


def _normalize_int(value: Any, default: int = 0) -> int:
    try:
        if value in (None, ""):
            return default
        return int(value)
    except Exception:
        return default


def _normalize_bool(value: Any, default: bool = False) -> bool:
    if value in (None, ""):
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "no", "n", "off"}:
        return False
    return default


class AuthUserRepository:
    def __init__(self, database_path: Path | None = None) -> None:
        self.database_path = _resolve_database_path(database_path)
        self._engine = None
        self._session_factory = None
        self._init_lock = threading.RLock()

    def _get_engine(self):
        if self._engine is None:
            self.database_path.parent.mkdir(parents=True, exist_ok=True)
            self._engine = create_engine(
                _sqlite_sync_url(self.database_path),
                future=True,
                echo=False,
                connect_args={"check_same_thread": False},
            )
        return self._engine

    def _get_session_factory(self):
        if self._session_factory is None:
            self._session_factory = sessionmaker(bind=self._get_engine(), expire_on_commit=False)
        return self._session_factory

    @contextmanager
    def session(self) -> Iterator[Session]:
        session = self._get_session_factory()()
        try:
            yield session
        finally:
            session.close()

    def ensure_schema(self) -> None:
        engine = self._get_engine()
        with self._init_lock:
            Base.metadata.create_all(engine)
            with engine.begin() as connection:
                inspector = inspect(connection)
                if "users" not in inspector.get_table_names():
                    Base.metadata.create_all(engine)
                    return
                columns = {column["name"] for column in inspector.get_columns("users")}
                alterations = {
                    "access_choice": "ALTER TABLE users ADD COLUMN access_choice VARCHAR",
                    "access_choice_at": "ALTER TABLE users ADD COLUMN access_choice_at DATETIME",
                    "subscription_tier": "ALTER TABLE users ADD COLUMN subscription_tier VARCHAR NOT NULL DEFAULT 'free'",
                    "subscription_pathway": "ALTER TABLE users ADD COLUMN subscription_pathway VARCHAR",
                    "subscription_billing_period": "ALTER TABLE users ADD COLUMN subscription_billing_period VARCHAR",
                    "profession_slot_count": "ALTER TABLE users ADD COLUMN profession_slot_count INTEGER NOT NULL DEFAULT 0",
                    "selected_professions": "ALTER TABLE users ADD COLUMN selected_professions JSON NOT NULL DEFAULT '[]'",
                    "stripe_customer_id": "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR",
                    "stripe_subscription_id": "ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR",
                    "stripe_price_id": "ALTER TABLE users ADD COLUMN stripe_price_id VARCHAR",
                    "stripe_checkout_session_id": "ALTER TABLE users ADD COLUMN stripe_checkout_session_id VARCHAR",
                    "subscription_expires_at": "ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME",
                    "trial_ends_at": "ALTER TABLE users ADD COLUMN trial_ends_at DATETIME",
                    "subscription_provider": "ALTER TABLE users ADD COLUMN subscription_provider VARCHAR NOT NULL DEFAULT 'stripe'",
                    "subscription_status": "ALTER TABLE users ADD COLUMN subscription_status VARCHAR",
                    "access_source": "ALTER TABLE users ADD COLUMN access_source VARCHAR NOT NULL DEFAULT 'b2c_direct'",
                    "cancel_at_period_end": "ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT 0",
                    "canceled_at": "ALTER TABLE users ADD COLUMN canceled_at DATETIME",
                    "current_period_start": "ALTER TABLE users ADD COLUMN current_period_start DATETIME",
                    "current_period_end": "ALTER TABLE users ADD COLUMN current_period_end DATETIME",
                    "trial_started_at": "ALTER TABLE users ADD COLUMN trial_started_at DATETIME",
                    "access_ends_at": "ALTER TABLE users ADD COLUMN access_ends_at DATETIME",
                    "role": "ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'user'",
                    "organization_id": "ALTER TABLE users ADD COLUMN organization_id VARCHAR",
                    "cohort_id": "ALTER TABLE users ADD COLUMN cohort_id VARCHAR",
                    "email_verified_at": "ALTER TABLE users ADD COLUMN email_verified_at DATETIME",
                    "provider_links": "ALTER TABLE users ADD COLUMN provider_links JSON NOT NULL DEFAULT '{}'",
                    "updated_at": "ALTER TABLE users ADD COLUMN updated_at DATETIME",
                }
                for column_name, ddl in alterations.items():
                    if column_name not in columns:
                        connection.execute(text(ddl))
                connection.execute(
                    text(
                        "UPDATE users SET subscription_tier = 'free' "
                        "WHERE subscription_tier IS NULL OR subscription_tier = ''"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET profession_slot_count = 0 "
                        "WHERE profession_slot_count IS NULL"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET selected_professions = '[]' "
                        "WHERE selected_professions IS NULL OR selected_professions = ''"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET provider_links = '{}' "
                        "WHERE provider_links IS NULL OR provider_links = ''"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET subscription_provider = 'stripe' "
                        "WHERE subscription_provider IS NULL OR subscription_provider = ''"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET access_source = 'b2c_direct' "
                        "WHERE access_source IS NULL OR access_source = ''"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET cancel_at_period_end = 0 "
                        "WHERE cancel_at_period_end IS NULL"
                    )
                )
                connection.execute(
                    text(
                        "UPDATE users SET role = 'user' "
                        "WHERE role IS NULL OR role = ''"
                    )
                )

    def _serialize_user(self, user: User) -> dict[str, Any]:
        return {
            "user_id": str(user.id),
            "email": str(user.email).strip().lower(),
            "name": user.name,
            "password_hash": user.password_hash,
            "subscription_tier": str(user.subscription_tier or "free"),
            "subscription_pathway": user.subscription_pathway,
            "subscription_billing_period": user.subscription_billing_period,
            "profession_slot_count": int(user.profession_slot_count or 0),
            "selected_professions": list(user.selected_professions or []),
            "stripe_customer_id": user.stripe_customer_id,
            "stripe_subscription_id": user.stripe_subscription_id,
            "stripe_price_id": user.stripe_price_id,
            "stripe_checkout_session_id": user.stripe_checkout_session_id,
            "subscription_expires_at": _serialize_datetime(user.subscription_expires_at),
            "trial_ends_at": _serialize_datetime(user.trial_ends_at),
            "subscription_provider": user.subscription_provider or "stripe",
            "subscription_status": user.subscription_status,
            "access_source": user.access_source or "b2c_direct",
            "cancel_at_period_end": bool(user.cancel_at_period_end),
            "canceled_at": _serialize_datetime(user.canceled_at),
            "current_period_start": _serialize_datetime(user.current_period_start),
            "current_period_end": _serialize_datetime(user.current_period_end),
            "trial_started_at": _serialize_datetime(user.trial_started_at),
            "access_ends_at": _serialize_datetime(user.access_ends_at),
            "role": user.role or "user",
            "organization_id": user.organization_id,
            "cohort_id": user.cohort_id,
            "access_choice": user.access_choice,
            "access_choice_at": _serialize_datetime(user.access_choice_at),
            "email_verified_at": _serialize_datetime(user.email_verified_at),
            "provider_links": dict(user.provider_links or {}),
            "created_at": _serialize_datetime(user.created_at),
            "updated_at": _serialize_datetime(user.updated_at),
        }

    def _normalize_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        normalized_email = normalize_email(payload.get("email"))
        provider_links = _normalize_provider_links(payload.get("provider_links"))
        selected_professions = _normalize_selected_professions(
            payload.get("selected_professions") if "selected_professions" in payload else payload.get("selectedProfessions")
        )
        return {
            "user_id": str(payload.get("user_id") or "").strip() or None,
            "email": normalized_email or None,
            "name": str(payload.get("name") or "").strip() or None,
            "password_hash": str(payload.get("password_hash") or "").strip() or None,
            "subscription_tier": str(payload.get("subscription_tier") or "free").strip() or "free",
            "subscription_pathway": str(payload.get("subscription_pathway") or "").strip() or None,
            "subscription_billing_period": str(payload.get("subscription_billing_period") or "").strip() or None,
            "profession_slot_count": _normalize_int(payload.get("profession_slot_count"), len(selected_professions)),
            "selected_professions": selected_professions,
            "stripe_customer_id": str(payload.get("stripe_customer_id") or "").strip() or None,
            "stripe_subscription_id": str(payload.get("stripe_subscription_id") or "").strip() or None,
            "stripe_price_id": str(payload.get("stripe_price_id") or "").strip() or None,
            "stripe_checkout_session_id": str(payload.get("stripe_checkout_session_id") or "").strip() or None,
            "subscription_expires_at": _coerce_datetime(payload.get("subscription_expires_at")),
            "trial_ends_at": _coerce_datetime(payload.get("trial_ends_at")),
            "subscription_provider": str(payload.get("subscription_provider") or "stripe").strip() or "stripe",
            "subscription_status": str(payload.get("subscription_status") or "").strip() or None,
            "access_source": str(payload.get("access_source") or "b2c_direct").strip() or "b2c_direct",
            "cancel_at_period_end": _normalize_bool(payload.get("cancel_at_period_end"), False),
            "canceled_at": _coerce_datetime(payload.get("canceled_at")),
            "current_period_start": _coerce_datetime(payload.get("current_period_start")),
            "current_period_end": _coerce_datetime(payload.get("current_period_end")),
            "trial_started_at": _coerce_datetime(payload.get("trial_started_at")),
            "access_ends_at": _coerce_datetime(payload.get("access_ends_at")),
            "role": str(payload.get("role") or "user").strip() or "user",
            "organization_id": str(payload.get("organization_id") or "").strip() or None,
            "cohort_id": str(payload.get("cohort_id") or "").strip() or None,
            "access_choice": str(payload.get("access_choice") or "").strip() or None,
            "access_choice_at": _coerce_datetime(payload.get("access_choice_at")),
            "email_verified_at": _coerce_datetime(payload.get("email_verified_at")),
            "provider_links": provider_links,
            "created_at": _coerce_datetime(payload.get("created_at")) or utc_now(),
            "updated_at": _coerce_datetime(payload.get("updated_at")),
        }

    def _existing_user(self, session: Session, *, user_id: str | None, email: str | None) -> User | None:
        if user_id:
            user = session.get(User, user_id)
            if user:
                return user
        if email:
            return session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        return None

    def list_users(self) -> list[dict[str, Any]]:
        with self.session() as session:
            rows = session.execute(select(User).order_by(User.email.asc())).scalars().all()
            return [self._serialize_user(user) for user in rows]

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        user_id = str(user_id or "").strip()
        if not user_id:
            return None
        with self.session() as session:
            user = session.get(User, user_id)
            return self._serialize_user(user) if user else None

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        normalized = normalize_email(email)
        if not normalized:
            return None
        with self.session() as session:
            user = session.execute(select(User).where(User.email == normalized)).scalar_one_or_none()
            return self._serialize_user(user) if user else None

    def find_user_by_provider_link(self, provider: str, external_id: str) -> dict[str, Any] | None:
        provider_name = str(provider or "").strip().lower()
        external_subject = str(external_id or "").strip()
        if not provider_name or not external_subject:
            return None
        for user in self.list_users():
            provider_links = user.get("provider_links") if isinstance(user.get("provider_links"), dict) else {}
            if provider_links.get(provider_name) == external_subject:
                return user
        return None

    def save_user(self, payload: dict[str, Any], *, overwrite_password: bool = False) -> tuple[dict[str, Any], bool]:
        normalized = self._normalize_payload(payload)
        raw_payload = dict(payload)
        if not normalized["email"]:
            raise ValueError("User email is required.")
        with self.session() as session:
            existing = self._existing_user(
                session,
                user_id=normalized["user_id"],
                email=normalized["email"],
            )
            if existing is None:
                user = User(
                    id=normalized["user_id"] or new_id("usr"),
                    email=normalized["email"],
                    name=normalized["name"],
                    password_hash=normalized["password_hash"],
                    subscription_tier=normalized["subscription_tier"] or "free",
                    subscription_pathway=normalized["subscription_pathway"],
                    subscription_billing_period=normalized["subscription_billing_period"],
                    profession_slot_count=normalized["profession_slot_count"],
                    selected_professions=normalized["selected_professions"],
                    stripe_customer_id=normalized["stripe_customer_id"],
                    stripe_subscription_id=normalized["stripe_subscription_id"],
                    stripe_price_id=normalized["stripe_price_id"],
                    stripe_checkout_session_id=normalized["stripe_checkout_session_id"],
                    subscription_expires_at=normalized["subscription_expires_at"],
                    trial_ends_at=normalized["trial_ends_at"],
                    subscription_provider=normalized["subscription_provider"],
                    subscription_status=normalized["subscription_status"],
                    access_source=normalized["access_source"],
                    cancel_at_period_end=normalized["cancel_at_period_end"],
                    canceled_at=normalized["canceled_at"],
                    current_period_start=normalized["current_period_start"],
                    current_period_end=normalized["current_period_end"],
                    trial_started_at=normalized["trial_started_at"],
                    access_ends_at=normalized["access_ends_at"],
                    role=normalized["role"],
                    organization_id=normalized["organization_id"],
                    cohort_id=normalized["cohort_id"],
                    access_choice=normalized["access_choice"],
                    access_choice_at=normalized["access_choice_at"],
                    email_verified_at=normalized["email_verified_at"],
                    provider_links=normalized["provider_links"] or {},
                    created_at=normalized["created_at"] or utc_now(),
                    updated_at=normalized["updated_at"] or utc_now(),
                )
                session.add(user)
                try:
                    session.commit()
                except IntegrityError:
                    session.rollback()
                    existing = self._existing_user(session, user_id=None, email=normalized["email"])
                    if existing is None:
                        raise
                else:
                    session.refresh(user)
                    return self._serialize_user(user), True

            if existing is None:
                raise RuntimeError("Unable to save user record.")
            before = self._serialize_user(existing)
            existing.email = normalized["email"]
            if "name" in raw_payload and normalized["name"] is not None:
                existing.name = normalized["name"]
            if "password_hash" in raw_payload and normalized["password_hash"] is not None and (overwrite_password or not existing.password_hash):
                existing.password_hash = normalized["password_hash"]
            if "subscription_tier" in raw_payload and raw_payload.get("subscription_tier") is not None:
                existing.subscription_tier = normalized["subscription_tier"]
            if "subscription_pathway" in raw_payload:
                existing.subscription_pathway = normalized["subscription_pathway"]
            if "subscription_billing_period" in raw_payload:
                existing.subscription_billing_period = normalized["subscription_billing_period"]
            if "profession_slot_count" in raw_payload and raw_payload.get("profession_slot_count") is not None:
                existing.profession_slot_count = normalized["profession_slot_count"]
            if "selected_professions" in raw_payload and raw_payload.get("selected_professions") is not None:
                existing.selected_professions = normalized["selected_professions"]
            if "stripe_customer_id" in raw_payload and raw_payload.get("stripe_customer_id") is not None:
                existing.stripe_customer_id = normalized["stripe_customer_id"]
            if "stripe_subscription_id" in raw_payload and raw_payload.get("stripe_subscription_id") is not None:
                existing.stripe_subscription_id = normalized["stripe_subscription_id"]
            if "stripe_price_id" in raw_payload and raw_payload.get("stripe_price_id") is not None:
                existing.stripe_price_id = normalized["stripe_price_id"]
            if "stripe_checkout_session_id" in raw_payload and raw_payload.get("stripe_checkout_session_id") is not None:
                existing.stripe_checkout_session_id = normalized["stripe_checkout_session_id"]
            if "subscription_expires_at" in raw_payload and raw_payload.get("subscription_expires_at") is not None:
                existing.subscription_expires_at = normalized["subscription_expires_at"]
            if "trial_ends_at" in raw_payload and raw_payload.get("trial_ends_at") is not None:
                existing.trial_ends_at = normalized["trial_ends_at"]
            if "subscription_provider" in raw_payload and raw_payload.get("subscription_provider") is not None:
                existing.subscription_provider = normalized["subscription_provider"]
            if "subscription_status" in raw_payload:
                existing.subscription_status = normalized["subscription_status"]
            if "access_source" in raw_payload and raw_payload.get("access_source") is not None:
                existing.access_source = normalized["access_source"]
            if "cancel_at_period_end" in raw_payload and raw_payload.get("cancel_at_period_end") is not None:
                existing.cancel_at_period_end = normalized["cancel_at_period_end"]
            if "canceled_at" in raw_payload:
                existing.canceled_at = normalized["canceled_at"]
            if "current_period_start" in raw_payload:
                existing.current_period_start = normalized["current_period_start"]
            if "current_period_end" in raw_payload:
                existing.current_period_end = normalized["current_period_end"]
            if "trial_started_at" in raw_payload:
                existing.trial_started_at = normalized["trial_started_at"]
            if "access_ends_at" in raw_payload:
                existing.access_ends_at = normalized["access_ends_at"]
            if "role" in raw_payload and raw_payload.get("role") is not None:
                existing.role = normalized["role"]
            if "organization_id" in raw_payload:
                existing.organization_id = normalized["organization_id"]
            if "cohort_id" in raw_payload:
                existing.cohort_id = normalized["cohort_id"]
            if "access_choice" in raw_payload and raw_payload.get("access_choice") is not None:
                existing.access_choice = normalized["access_choice"]
            if "access_choice_at" in raw_payload and raw_payload.get("access_choice_at") is not None:
                existing.access_choice_at = normalized["access_choice_at"]
            if "email_verified_at" in raw_payload and raw_payload.get("email_verified_at") is not None:
                existing.email_verified_at = normalized["email_verified_at"]
            if "provider_links" in raw_payload and normalized["provider_links"]:
                merged_links = dict(existing.provider_links or {})
                merged_links.update(normalized["provider_links"])
                existing.provider_links = merged_links
            if "created_at" in raw_payload and normalized["created_at"] is not None and not existing.created_at:
                existing.created_at = normalized["created_at"]
            if "updated_at" in raw_payload and normalized["updated_at"] is not None:
                existing.updated_at = normalized["updated_at"]
            else:
                existing.updated_at = utc_now()
            session.commit()
            session.refresh(existing)
            after = self._serialize_user(existing)
            return after, after != before

    def update_user(self, user_id: str, **fields: Any) -> tuple[dict[str, Any], bool]:
        user_id = str(user_id or "").strip()
        if not user_id:
            raise ValueError("User id is required.")
        existing = self.get_user_by_id(user_id)
        if not existing:
            raise ValueError("User not found.")
        payload = dict(existing)
        payload.update(fields)
        payload["user_id"] = user_id
        updated, changed = self.save_user(payload, overwrite_password=bool(fields.get("password_hash")))
        return updated, changed

    def migrate_state_users(self, state_users: dict[str, Any]) -> dict[str, int]:
        created = 0
        updated = 0
        skipped = 0
        if not isinstance(state_users, dict):
            return {"created": created, "updated": updated, "skipped": skipped}
        for payload in state_users.values():
            if not isinstance(payload, dict):
                skipped += 1
                continue
            normalized = self._normalize_payload(payload)
            if not normalized["email"]:
                skipped += 1
                continue
            existing = self.get_user_by_email(normalized["email"])
            user, changed = self.save_user(payload, overwrite_password=False)
            if existing is None:
                created += 1
            elif changed:
                updated += 1
            else:
                skipped += 1
        return {"created": created, "updated": updated, "skipped": skipped}


AUTH_USERS = AuthUserRepository()
