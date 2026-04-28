"""
==========================================================
YKI EVENT STORE — Integrity verification (tamper detection)
==========================================================

verify_event_chain(session_id): recompute hashes, compare to stored.
If any mismatch → EventIntegrityError. Engine must refuse to load corrupted sessions.
"""

from __future__ import annotations

from pathlib import Path

from engine.events.exam_events import GENESIS_HASH, compute_event_hash
from engine.event_store.store import load_events


class EventIntegrityError(RuntimeError):
    """Raised when event chain verification fails (tampering or corruption)."""
    pass


class ManifestIntegrityError(RuntimeError):
    """Raised when manifest file hash does not match the hash stored in SESSION_CREATED."""
    pass


def verify_event_chain(session_id: str) -> bool:
    """
    Load events, recompute each event_hash from previous_hash + serialized body,
    compare to stored event_hash. Returns True if valid.
    Raises EventIntegrityError if any hash mismatch.
    """
    events = load_events(session_id)
    if not events:
        return True
    previous_hash = GENESIS_HASH
    for ev in events:
        ts = ev.timestamp.isoformat() if hasattr(ev.timestamp, "isoformat") else str(ev.timestamp)
        expected_hash = compute_event_hash(
            previous_hash,
            ev.event_id,
            ev.session_id,
            ev.event_type,
            ts,
            ev.payload,
        )
        stored_hash = getattr(ev, "event_hash", None) or ""
        if stored_hash and expected_hash != stored_hash:
            raise EventIntegrityError(
                f"Event chain integrity failed for session {session_id} at event_id={ev.event_id}: "
                f"expected hash {expected_hash[:16]}... got {stored_hash[:16]}..."
            )
        previous_hash = expected_hash
    return True


def verify_manifest_integrity(session_id: str, stored_manifest_hash: str) -> None:
    """
    Verify manifest file hash matches the hash stored in SESSION_CREATED.
    Raises ManifestIntegrityError if manifest file is missing or hash mismatch.
    """
    manifest_path = Path("exam_sessions/manifests") / f"{session_id}.json"
    if not manifest_path.exists():
        raise ManifestIntegrityError(f"Manifest missing for session {session_id}")
    from engine.exam.blueprint_assembler import calculate_manifest_hash
    calculated = calculate_manifest_hash(manifest_path)
    if calculated != stored_manifest_hash:
        raise ManifestIntegrityError(
            f"Manifest integrity failed for session {session_id}: "
            f"stored hash {stored_manifest_hash[:16]}... != calculated {calculated[:16]}..."
        )
