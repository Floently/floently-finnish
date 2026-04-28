"""Authentication and security utilities."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

import jwt

from app.core.config import get_settings
from app.core.utils import hash_password as hash_password_with_fallback, verify_password as verify_password_with_fallback

try:
    import bcrypt  # type: ignore
except Exception:  # pragma: no cover - optional dependency fallback
    bcrypt = None


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def _secret_key() -> str:
    secret = str(get_settings().secret_key or "").strip()
    if not secret:
        raise RuntimeError("SECRET_KEY must be configured")
    return secret


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    if bcrypt is None:
        return hash_password_with_fallback(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    if bcrypt is None:
        return verify_password_with_fallback(plain_password, hashed_password)
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, _secret_key(), algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, _secret_key(), algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, _secret_key(), algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """Extract user ID from a token."""
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None
