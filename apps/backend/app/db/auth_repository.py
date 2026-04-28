from __future__ import annotations

import threading
from contextlib import contextmanager
from datetime import UTC, datetime
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
                    "subscription_expires_at": "ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME",
                    "trial_ends_at": "ALTER TABLE users ADD COLUMN trial_ends_at DATETIME",
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
                        "UPDATE users SET provider_links = '{}' "
                        "WHERE provider_links IS NULL OR provider_links = ''"
                    )
                )

    def _serialize_user(self, user: User) -> dict[str, Any]:
        return {
            "user_id": str(user.id),
            "email": str(user.email).strip().lower(),
            "name": user.name,
            "password_hash": user.password_hash,
            "subscription_tier": str(user.subscription_tier or "free"),
            "subscription_expires_at": _serialize_datetime(user.subscription_expires_at),
            "trial_ends_at": _serialize_datetime(user.trial_ends_at),
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
        return {
            "user_id": str(payload.get("user_id") or "").strip() or None,
            "email": normalized_email or None,
            "name": str(payload.get("name") or "").strip() or None,
            "password_hash": str(payload.get("password_hash") or "").strip() or None,
            "subscription_tier": str(payload.get("subscription_tier") or "free").strip() or "free",
            "subscription_expires_at": _coerce_datetime(payload.get("subscription_expires_at")),
            "trial_ends_at": _coerce_datetime(payload.get("trial_ends_at")),
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
                    subscription_expires_at=normalized["subscription_expires_at"],
                    trial_ends_at=normalized["trial_ends_at"],
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
            if "subscription_expires_at" in raw_payload and raw_payload.get("subscription_expires_at") is not None:
                existing.subscription_expires_at = normalized["subscription_expires_at"]
            if "trial_ends_at" in raw_payload and raw_payload.get("trial_ends_at") is not None:
                existing.trial_ends_at = normalized["trial_ends_at"]
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
