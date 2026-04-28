"""
Session-scoped in-memory request rate limiting helpers.
"""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import HTTPException


_entries: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(*, scope: str, session_id: str, limit: int, window_seconds: float) -> None:
    key = f"{scope}:{session_id}"
    now = time.time()
    entries = _entries[key]
    entries[:] = [timestamp for timestamp in entries if now - timestamp < window_seconds]
    if len(entries) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests")
    entries.append(now)
