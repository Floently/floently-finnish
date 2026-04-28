"""
Simple certificate payload generator for submitted exam sessions.
"""

from __future__ import annotations

from datetime import datetime, UTC


def generate_certificate(session):
    payload = session.to_dict() if hasattr(session, "to_dict") else dict(session)
    results = payload.get("results") or {}

    return {
        "user": payload.get("user") or payload.get("user_id") or "anonymous",
        "level_band": payload.get("level_band", "B1_B2"),
        "score": results.get("score") or payload.get("score", {}),
        "cefr_level": results.get("cefr_level") or payload.get("cefr_level"),
        "date": datetime.now(UTC).date().isoformat(),
    }
