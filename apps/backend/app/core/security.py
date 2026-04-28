from __future__ import annotations

import hashlib
from hashlib import sha256
from hmac import compare_digest
from time import time

from .config import SETTINGS


class SimpleRateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, list[float]] = {}

    def allow(self, key: str, *, window_seconds: int, limit: int) -> bool:
        now = time()
        current = [value for value in self._buckets.get(key, []) if now - value < window_seconds]
        if len(current) >= limit:
            self._buckets[key] = current
            return False
        current.append(now)
        self._buckets[key] = current
        return True


rate_limiter = SimpleRateLimiter()


def hash_token(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sign_session_id(session_id: str) -> str:
    digest = sha256(f'{SETTINGS.signed_session_secret}:{session_id}'.encode('utf-8')).hexdigest()
    return f'{session_id}.{digest}'


def verify_signed_session(signed_value: str) -> bool:
    if '.' not in signed_value:
        return False
    session_id, provided = signed_value.rsplit('.', 1)
    expected = sha256(f'{SETTINGS.signed_session_secret}:{session_id}'.encode('utf-8')).hexdigest()
    return compare_digest(provided, expected)
