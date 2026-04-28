"""
Runtime logging helpers for the YKI exam runtime.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


LOG_PATH = Path("logs/exam_sessions.log")
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


LOGGER = logging.getLogger("engine.runtime.v3_3")
if not LOGGER.handlers:
    file_handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    file_handler.setFormatter(logging.Formatter("%(message)s"))
    LOGGER.addHandler(file_handler)
    LOGGER.setLevel(logging.INFO)
    LOGGER.propagate = False


def log_event(event_name: str, **fields: Any) -> dict[str, Any]:
    payload = {
        "event": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **fields,
    }
    LOGGER.info(json.dumps(payload, ensure_ascii=False))
    return payload
