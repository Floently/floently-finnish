from __future__ import annotations

import time
from collections import defaultdict, deque

from app.cards.observability import increment_metric, log_card_event
from app.core.config import get_settings


class CardRateLimitError(RuntimeError):
    """Raised when a card runtime rate limit is exceeded."""


class InMemoryRateLimiter:
    def __init__(self):
        self._events: dict[tuple[str, str], deque[float]] = defaultdict(deque)

    def check(self, *, scope: str, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        bucket = self._events[(scope, key)]
        cutoff = now - float(window_seconds)
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= int(limit):
            raise CardRateLimitError(f"Rate limit exceeded for {scope}")
        bucket.append(now)


class CardRateLimiter:
    def __init__(
        self,
        *,
        limiter: InMemoryRateLimiter | None = None,
        window_seconds: int | None = None,
        session_start_limit: int | None = None,
        adaptive_start_limit: int | None = None,
        answer_limit: int | None = None,
    ):
        settings = get_settings()
        self._limiter = limiter or InMemoryRateLimiter()
        self.window_seconds = window_seconds or settings.card_rate_limit_window_seconds
        self.session_start_limit = session_start_limit or settings.card_session_start_limit
        self.adaptive_start_limit = adaptive_start_limit or settings.card_adaptive_start_limit
        self.answer_limit = answer_limit or settings.card_answer_limit

    def check_session_start(self, user_id: str) -> None:
        self._check(scope="cards.session_start", key=user_id, limit=self.session_start_limit)

    def check_adaptive_start(self, user_id: str) -> None:
        self._check(scope="cards.adaptive_start", key=user_id, limit=self.adaptive_start_limit)

    def check_answer_submit(self, user_id: str, session_id: str) -> None:
        self._check(scope="cards.answer", key=f"{user_id}:{session_id}", limit=self.answer_limit)

    def _check(self, *, scope: str, key: str, limit: int) -> None:
        try:
            self._limiter.check(scope=scope, key=key, limit=limit, window_seconds=self.window_seconds)
        except Exception as exc:
            increment_metric("cards.rate_limited", scope=scope)
            log_card_event("cards.rate_limited", scope=scope, key=key)
            raise CardRateLimitError(f"Rate limit exceeded for {scope}") from exc
