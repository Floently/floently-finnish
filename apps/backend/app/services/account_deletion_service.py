from __future__ import annotations

import hashlib
import logging
from typing import Any

from sqlalchemy import delete, or_

from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import iso_now
from app.db.database import AsyncSessionLocal
from app.db.models import Base


logger = logging.getLogger("floently.account_deletion")

_STATE_BUCKETS = (
    "users",
    "email_index",
    "provider_index",
    "auth_sessions",
    "access_tokens",
    "refresh_tokens",
    "oauth_states",
    "oauth_results",
    "cards_sessions",
    "cards_issues",
    "user_content_history",
    "roleplay_sessions",
    "voice_refs",
    "yki_sessions",
)


def _safe_subject(*, user_id: str, email: str) -> str:
    return hashlib.sha256(f"{user_id}:{email}".encode("utf-8")).hexdigest()[:12]


def _matches_user(payload: Any, *, key: str, user_id: str, email: str) -> bool:
    if key == user_id:
        return True
    if key == email:
        return True
    if not isinstance(payload, dict):
        return False
    if str(payload.get("user_id") or "") == user_id:
        return True
    if str(payload.get("email") or "").strip().lower() == email:
        return True
    return False


def _delete_state_records(*, user_id: str, email: str) -> dict[str, int]:
    lock_items: list[tuple[str, str]] = []
    deletions: dict[str, list[str]] = {}

    for bucket in _STATE_BUCKETS:
        if bucket not in STORE._data:
            continue
        keys_to_delete: list[str] = []
        for key, payload in STORE._data[bucket].items():
            normalized_key = str(key)
            if _matches_user(payload, key=normalized_key, user_id=user_id, email=email):
                keys_to_delete.append(normalized_key)
        for key in keys_to_delete:
            lock_items.append((bucket, key))
        if keys_to_delete:
            deletions[bucket] = keys_to_delete

    if not lock_items:
        return {}

    with STORE.locked(*lock_items):
        for bucket, keys in deletions.items():
            for key in keys:
                STORE.delete(bucket, key)
    STORE.write_snapshot()

    return {bucket: len(keys) for bucket, keys in deletions.items()}


async def _delete_db_records(*, user_id: str, email: str) -> tuple[dict[str, int], bool]:
    table_counts: dict[str, int] = {}
    succeeded = True
    try:
        async with AsyncSessionLocal() as session:
            for table in reversed(Base.metadata.sorted_tables):
                conditions = []
                if "user_id" in table.c:
                    conditions.append(table.c.user_id == user_id)
                if table.name == "users":
                    if "id" in table.c:
                        conditions.append(table.c.id == user_id)
                    if "email" in table.c:
                        conditions.append(table.c.email == email)
                elif "email" in table.c:
                    conditions.append(table.c.email == email)
                if not conditions:
                    continue
                result = await session.execute(delete(table).where(or_(*conditions)))
                row_count = int(result.rowcount or 0)
                if row_count > 0:
                    table_counts[str(table.name)] = row_count
            await session.commit()
    except Exception:
        succeeded = False
    return table_counts, succeeded


async def delete_account_for_user(*, user: dict[str, Any], deletion_reason: str | None) -> dict[str, Any]:
    user_id = str(user.get("user_id") or "").strip()
    email = str(user.get("email") or "").strip().lower()
    if not user_id or not email:
        raise AppError(500, "AUTH_DATA_CORRUPTION", "Account payload is incomplete.", False, {"classification": "terminal"})

    subject = _safe_subject(user_id=user_id, email=email)

    # Database cleanup is attempted before the state-store identity/session is
    # removed. If SQL cleanup fails, keep the authenticated state intact so the
    # user can retry the deletion request instead of receiving a false success
    # after their session has already been destroyed.
    db_counts, db_cleanup_succeeded = await _delete_db_records(user_id=user_id, email=email)
    if not db_cleanup_succeeded:
        logger.warning(
            "account deletion incomplete subject=%s stage=database reason_present=%s",
            subject,
            bool((deletion_reason or "").strip()),
        )
        raise AppError(
            503,
            "ACCOUNT_DELETION_INCOMPLETE",
            "Account deletion could not be completed. Please try again.",
            True,
            {"classification": "retryable", "stage": "database"},
        )

    try:
        state_counts = _delete_state_records(user_id=user_id, email=email)
    except Exception as exc:
        logger.warning(
            "account deletion incomplete subject=%s stage=state_store reason_present=%s",
            subject,
            bool((deletion_reason or "").strip()),
        )
        raise AppError(
            503,
            "ACCOUNT_DELETION_INCOMPLETE",
            "Account deletion could not be completed. Please contact support if retrying does not resolve the issue.",
            True,
            {"classification": "retryable", "stage": "state_store"},
        ) from exc

    logger.info(
        "account deletion completed subject=%s state_keys=%s db_cleanup=ok reason_present=%s",
        subject,
        sum(state_counts.values()),
        bool((deletion_reason or "").strip()),
    )

    return {
        "account_deleted": True,
        "deletion_initiated_at": iso_now(),
        "deletion_window": "up to 24 hours",
        "details": {
            "state_records_removed": state_counts,
            "db_records_removed": db_counts,
            "db_cleanup_status": "completed",
        },
    }
