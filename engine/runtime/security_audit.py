"""
==========================================================
YKI SECURITY AUDIT LOG
==========================================================

logs/security_audit.log — JSON lines for invalid_transition_attempt,
tampered_event_chain, expired_session_submission.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

AUDIT_LOG_PATH = Path("logs/security_audit.log")


def _ensure_log_dir() -> None:
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


def audit_log(event_type: str, **fields: object) -> None:
    """Append a structured JSON line to the security audit log."""
    _ensure_log_dir()
    payload = {
        "event": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **fields,
    }
    with AUDIT_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
