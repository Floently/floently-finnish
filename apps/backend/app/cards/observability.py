from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any

from app.core.request_context import get_request_id

log = logging.getLogger("puhis.cards")
_metrics = Counter()


def increment_metric(name: str, **labels: str) -> None:
    key = name
    if labels:
        suffix = ",".join(f"{item[0]}={item[1]}" for item in sorted(labels.items()))
        key = f"{name}|{suffix}"
    _metrics[key] += 1


def metric_snapshot() -> dict[str, int]:
    return dict(_metrics)


def log_card_event(event_type: str, **payload: Any) -> None:
    event = {
        "event_type": event_type,
        "request_id": get_request_id(),
        **payload,
    }
    log.info(json.dumps(event, ensure_ascii=False, default=str, sort_keys=True))
