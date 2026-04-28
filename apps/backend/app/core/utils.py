from __future__ import annotations

try:
    import crypt  # type: ignore
except Exception:  # pragma: no cover
    crypt = None
import hashlib
import secrets
import uuid
from datetime import datetime, timezone


class PasswordHashError(ValueError):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def normalize_email(email: str) -> str:
    return str(email or "").strip().lower()


def hash_password(password: str, *, salt: str | None = None) -> str:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        actual_salt.encode("utf-8"),
        200_000,
    ).hex()
    return f"{actual_salt}${digest}"


def password_hash_scheme(stored_hash: str) -> str:
    normalized = str(stored_hash or "").strip()
    if not normalized:
        raise PasswordHashError("Password hash is empty.")
    if normalized.startswith(("$2a$", "$2b$", "$2y$")):
        return "bcrypt"
    if "$" in normalized:
        salt, expected = normalized.split("$", 1)
        if not salt or not expected:
            raise PasswordHashError("Password hash is malformed.")
        return "pbkdf2_sha256"
    raise PasswordHashError("Password hash format is unsupported.")


def verify_password(password: str, stored_hash: str) -> bool:
    normalized = str(stored_hash or "").strip()
    scheme = password_hash_scheme(normalized)
    if scheme == "bcrypt":
        if crypt is None:
            raise PasswordHashError("bcrypt verification is unavailable for this password hash.")
        verified = crypt.crypt(password, normalized)
        if not verified or verified in {"*0", "*1"}:
            raise PasswordHashError("bcrypt verification is unavailable for this password hash.")
        return secrets.compare_digest(verified, normalized)
    try:
        salt, expected = normalized.split("$", 1)
    except ValueError:
        raise PasswordHashError("Password hash is malformed.") from None
    calculated = hash_password(password, salt=salt).split("$", 1)[1]
    return secrets.compare_digest(expected, calculated)
