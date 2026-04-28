from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass
from typing import Awaitable, Callable, TypeVar


T = TypeVar("T")


@dataclass(frozen=True)
class RetryPolicy:
    attempts: int = 5
    initial_delay_seconds: float = 0.25
    max_delay_seconds: float = 3.0
    backoff_multiplier: float = 2.0
    jitter_ratio: float = 0.2


def _sleep_seconds(policy: RetryPolicy, attempt_index: int) -> float:
    base_delay = min(
        policy.max_delay_seconds,
        policy.initial_delay_seconds * (policy.backoff_multiplier ** attempt_index),
    )
    jitter_window = max(0.0, base_delay * policy.jitter_ratio)
    if jitter_window <= 0:
        return base_delay
    return max(0.0, base_delay + random.uniform(-jitter_window, jitter_window))


async def retry_async(
    operation: Callable[[], Awaitable[T]],
    *,
    is_retryable: Callable[[Exception], bool],
    on_retry: Callable[[int, Exception, float], None] | None = None,
    policy: RetryPolicy | None = None,
) -> T:
    resolved_policy = policy or RetryPolicy()
    last_error: Exception | None = None

    for attempt_index in range(resolved_policy.attempts):
        try:
            return await operation()
        except Exception as exc:
            last_error = exc
            is_last_attempt = attempt_index >= resolved_policy.attempts - 1
            if is_last_attempt or not is_retryable(exc):
                raise
            sleep_for = _sleep_seconds(resolved_policy, attempt_index)
            if on_retry is not None:
                on_retry(attempt_index + 1, exc, sleep_for)
            await asyncio.sleep(sleep_for)

    if last_error is not None:  # pragma: no cover - defensive guard
        raise last_error
    raise RuntimeError("retry_async exhausted without result")
