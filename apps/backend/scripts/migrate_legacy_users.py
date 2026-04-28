from __future__ import annotations

import argparse
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from core.state_store import InMemoryStateStore
from core.utils import PasswordHashError, iso_now, normalize_email, verify_password


LEGACY_PROFESSIONAL_PLAN_TYPES = {
    "PAID_YKI",
    "PROFESSIONAL_PREMIUM",
    "PAID_PROFESSIONAL",
    "WORKPLACE_PREMIUM",
}

LEGACY_GENERAL_PLAN_TYPES = {
    "GENERAL_PREMIUM",
    "PAID_GENERAL",
}

INACTIVE_STATUSES = {"cancelled", "canceled", "expired", "inactive", "ended"}


@dataclass
class MigrationStats:
    total_users_processed: int = 0
    migrated_users: int = 0
    duplicates_resolved: int = 0
    invalid_hashes: int = 0
    failed_validations: int = 0
    errors: int = 0


def _normalize_timestamp(value: Any) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    return text.replace(" ", "T")


def _map_plan_type_to_tier(plan_type: str | None) -> str:
    normalized = str(plan_type or "").strip().upper()
    if normalized in LEGACY_PROFESSIONAL_PLAN_TYPES:
        return "professional_premium"
    if normalized in LEGACY_GENERAL_PLAN_TYPES:
        return "general_premium"
    return "free"


def _row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def _load_entitlement(connection: sqlite3.Connection, *, user_id: str, email: str) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT user_id, plan_type, profession_code, trial_started_at, trial_expires_at,
               subscription_started_at, subscription_expires_at, status, source, created_at, updated_at
        FROM user_entitlements
        WHERE user_id IN (?, ?)
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
        """,
        (user_id, email),
    ).fetchone()
    return _row_to_dict(row)


def _build_legacy_user_record(user_row: dict[str, Any], entitlement: dict[str, Any] | None) -> dict[str, Any]:
    subscription_tier = "free"
    subscription_expires_at = None
    trial_ends_at = None

    if entitlement:
        subscription_expires_at = _normalize_timestamp(entitlement.get("subscription_expires_at"))
        trial_ends_at = _normalize_timestamp(entitlement.get("trial_expires_at"))
        mapped_tier = _map_plan_type_to_tier(entitlement.get("plan_type"))
        status = str(entitlement.get("status") or "").strip().lower()
        if mapped_tier != "free":
            if status in INACTIVE_STATUSES and not subscription_expires_at and not trial_ends_at:
                subscription_tier = "free"
            else:
                subscription_tier = mapped_tier

    return {
        "user_id": str(user_row["id"]).strip(),
        "email": normalize_email(user_row["email"]),
        "name": user_row.get("name"),
        "password_hash": user_row.get("password_hash"),
        "subscription_tier": subscription_tier,
        "subscription_expires_at": subscription_expires_at,
        "trial_ends_at": trial_ends_at,
        "provider_links": {},
        "created_at": _normalize_timestamp(user_row.get("created_at")),
    }


def _matching_user_ids(store: InMemoryStateStore, email: str) -> list[str]:
    normalized = normalize_email(email)
    matches: list[str] = []
    for user_id, payload in store._data["users"].items():
        if not isinstance(payload, dict):
            continue
        if normalize_email(payload.get("email")) == normalized:
            matches.append(str(user_id))
    return sorted(matches)


def _canonical_user_id(store: InMemoryStateStore, email: str, candidates: list[str]) -> str:
    indexed_user_id = store.get_ref("email_index", email)
    if indexed_user_id and str(indexed_user_id) in candidates and store.get_ref("users", str(indexed_user_id)):
        return str(indexed_user_id)
    return sorted(candidates)[0]


def _collect_provider_links(store: InMemoryStateStore, user_ids: list[str]) -> dict[str, str]:
    merged: dict[str, str] = {}
    for user_id in user_ids:
        payload = store.get_ref("users", user_id)
        if not isinstance(payload, dict):
            continue
        provider_links = payload.get("provider_links") or {}
        if not isinstance(provider_links, dict):
            continue
        for provider_name, external_id in provider_links.items():
            provider = str(provider_name or "").strip().lower()
            external_subject = str(external_id or "").strip()
            if provider and external_subject and provider not in merged:
                merged[provider] = external_subject
    return merged


def _rewrite_auth_references(store: InMemoryStateStore, *, old_user_ids: list[str], canonical_user_id: str) -> None:
    removed = {str(user_id) for user_id in old_user_ids if str(user_id) != canonical_user_id}
    if not removed:
        return
    for bucket in ("auth_sessions", "access_tokens", "refresh_tokens"):
        for key, payload in list(store._data[bucket].items()):
            if not isinstance(payload, dict):
                continue
            if str(payload.get("user_id") or "") not in removed:
                continue
            updated = dict(payload)
            updated["user_id"] = canonical_user_id
            store.set(bucket, key, updated)


def _sync_provider_index(store: InMemoryStateStore, *, canonical_user_id: str, provider_links: dict[str, str], merged_user_ids: list[str]) -> None:
    for key, user_id in list(store._data["provider_index"].items()):
        if str(user_id) in merged_user_ids:
            store.delete("provider_index", key)
    for provider_name, external_id in provider_links.items():
        store.set("provider_index", f"{provider_name}:{external_id}", canonical_user_id)


def _merge_authoritative_user(
    *,
    canonical_user_id: str,
    canonical_existing: dict[str, Any] | None,
    authoritative_user: dict[str, Any],
    merged_provider_links: dict[str, str],
) -> dict[str, Any]:
    existing = dict(canonical_existing or {})
    merged = dict(existing)
    merged["user_id"] = canonical_user_id
    merged["email"] = authoritative_user["email"]
    merged["name"] = authoritative_user.get("name") or existing.get("name")
    merged["password_hash"] = authoritative_user.get("password_hash")
    merged["subscription_tier"] = authoritative_user.get("subscription_tier", "free")
    merged["subscription_expires_at"] = authoritative_user.get("subscription_expires_at")
    merged["trial_ends_at"] = authoritative_user.get("trial_ends_at")
    merged["provider_links"] = merged_provider_links
    merged["created_at"] = existing.get("created_at") or authoritative_user.get("created_at") or iso_now()
    if merged != existing:
        merged["updated_at"] = iso_now()
    elif existing.get("updated_at"):
        merged["updated_at"] = existing["updated_at"]
    return merged


def _validate_user(store: InMemoryStateStore, *, user_id: str, email: str) -> tuple[bool, bool]:
    invalid_hash = False
    failed = False
    payload = store.get_ref("users", user_id)
    normalized_email = normalize_email(email)
    if not isinstance(payload, dict):
        print(f"VALIDATION_ERROR email={normalized_email} user_id={user_id} reason=missing_user_record")
        return invalid_hash, True
    if normalize_email(payload.get("email")) != normalized_email:
        print(f"VALIDATION_ERROR email={normalized_email} user_id={user_id} reason=email_not_normalized")
        failed = True
    if str(store.get_ref("email_index", normalized_email) or "") != user_id:
        print(f"VALIDATION_ERROR email={normalized_email} user_id={user_id} reason=email_index_mismatch")
        failed = True

    password_hash = str(payload.get("password_hash") or "").strip()
    if not password_hash:
        print(f"INVALID_HASH email={normalized_email} user_id={user_id} reason=empty_hash")
        return True, True

    try:
        verify_password("test_input", password_hash)
    except PasswordHashError as exc:
        print(f"INVALID_HASH email={normalized_email} user_id={user_id} reason={exc}")
        invalid_hash = True
        failed = True

    return invalid_hash, failed


def _deduplicate_store(store: InMemoryStateStore) -> int:
    email_to_user_ids: dict[str, list[str]] = {}
    for user_id, payload in store._data["users"].items():
        if not isinstance(payload, dict):
            continue
        email = normalize_email(payload.get("email"))
        if not email:
            continue
        email_to_user_ids.setdefault(email, []).append(str(user_id))

    duplicates_resolved = 0
    for email, user_ids in sorted(email_to_user_ids.items()):
        if len(user_ids) <= 1:
            continue
        canonical_user_id = _canonical_user_id(store, email, user_ids)
        merged_provider_links = _collect_provider_links(store, user_ids)
        canonical_existing = store.get_ref("users", canonical_user_id)
        merged_user = dict(canonical_existing or {})
        merged_user["user_id"] = canonical_user_id
        merged_user["email"] = email
        merged_user["provider_links"] = merged_provider_links
        if merged_user != canonical_existing:
            merged_user["updated_at"] = iso_now()
        store.set("users", canonical_user_id, merged_user)
        for user_id in user_ids:
            if user_id != canonical_user_id:
                store.delete("users", user_id)
        store.set("email_index", email, canonical_user_id)
        _rewrite_auth_references(store, old_user_ids=user_ids, canonical_user_id=canonical_user_id)
        _sync_provider_index(store, canonical_user_id=canonical_user_id, provider_links=merged_provider_links, merged_user_ids=user_ids)
        duplicates_resolved += len(user_ids) - 1
        print(f"DEDUPLICATED email={email} canonical_user_id={canonical_user_id} removed={len(user_ids) - 1}")
    return duplicates_resolved


def migrate_legacy_users(*, legacy_db: Path, state_file: Path) -> MigrationStats:
    stats = MigrationStats()
    store = InMemoryStateStore(path=state_file)

    connection = sqlite3.connect(str(legacy_db))
    connection.row_factory = sqlite3.Row
    validated_user_ids: dict[str, str] = {}
    state_changed = False

    try:
        user_rows = [
            _row_to_dict(row)
            for row in connection.execute("SELECT id, email, password_hash, name, created_at FROM users ORDER BY lower(email)")
        ]
        for user_row in user_rows:
            if not user_row:
                continue

            stats.total_users_processed += 1
            try:
                email = normalize_email(user_row.get("email"))
                legacy_user_id = str(user_row.get("id") or "").strip()
                if not email or not legacy_user_id:
                    stats.errors += 1
                    print(f"ERROR invalid_user_record id={legacy_user_id or '<missing>'} email={email or '<missing>'}")
                    continue

                entitlement = _load_entitlement(connection, user_id=legacy_user_id, email=email)
                authoritative_user = _build_legacy_user_record(user_row, entitlement)
                matched_user_ids = _matching_user_ids(store, email)

                if not matched_user_ids:
                    existing_user = store.get_ref("users", legacy_user_id)
                    if existing_user and normalize_email(existing_user.get("email")) != email:
                        stats.errors += 1
                        print(
                            "ERROR conflicting_user_id "
                            f"user_id={legacy_user_id} current_email={existing_user.get('email')} legacy_email={email}"
                        )
                        continue
                    store.set("users", legacy_user_id, authoritative_user)
                    store.set("email_index", email, legacy_user_id)
                    stats.migrated_users += 1
                    state_changed = True
                    validated_user_ids[email] = legacy_user_id
                    print(
                        "MIGRATED "
                        f"email={email} user_id={legacy_user_id} "
                        f"subscription_tier={authoritative_user['subscription_tier']} "
                        f"subscription_expires_at={authoritative_user['subscription_expires_at']}"
                    )
                    continue

                canonical_user_id = _canonical_user_id(store, email, matched_user_ids)
                canonical_existing = store.get_ref("users", canonical_user_id)
                merged_provider_links = _collect_provider_links(store, matched_user_ids)
                merged_user = _merge_authoritative_user(
                    canonical_user_id=canonical_user_id,
                    canonical_existing=canonical_existing,
                    authoritative_user=authoritative_user,
                    merged_provider_links=merged_provider_links,
                )

                changed = merged_user != canonical_existing
                removed_user_ids = [user_id for user_id in matched_user_ids if user_id != canonical_user_id]
                if changed:
                    store.set("users", canonical_user_id, merged_user)
                    state_changed = True
                for user_id in removed_user_ids:
                    store.delete("users", user_id)
                    state_changed = True
                store.set("email_index", email, canonical_user_id)
                _rewrite_auth_references(store, old_user_ids=matched_user_ids, canonical_user_id=canonical_user_id)
                _sync_provider_index(
                    store,
                    canonical_user_id=canonical_user_id,
                    provider_links=merged_provider_links,
                    merged_user_ids=matched_user_ids,
                )
                if canonical_existing is not None:
                    if changed or removed_user_ids:
                        stats.duplicates_resolved += 1
                        print(
                            "RESOLVED_DUPLICATE "
                            f"email={email} canonical_user_id={canonical_user_id} legacy_user_id={legacy_user_id}"
                        )
                validated_user_ids[email] = canonical_user_id
            except Exception as exc:
                stats.errors += 1
                print(f"ERROR email={user_row.get('email')} detail={exc}")
    finally:
        connection.close()

    extra_deduplicated = _deduplicate_store(store)
    if extra_deduplicated:
        stats.duplicates_resolved += extra_deduplicated
        state_changed = True

    for email, user_id in sorted(validated_user_ids.items()):
        invalid_hash, failed = _validate_user(store, user_id=user_id, email=email)
        if invalid_hash:
            stats.invalid_hashes += 1
        if failed:
            stats.failed_validations += 1

    email_to_user_ids: dict[str, list[str]] = {}
    for user_id, payload in store._data["users"].items():
        if not isinstance(payload, dict):
            continue
        email = normalize_email(payload.get("email"))
        if not email:
            continue
        email_to_user_ids.setdefault(email, []).append(str(user_id))
    duplicate_emails = {email: user_ids for email, user_ids in email_to_user_ids.items() if len(user_ids) > 1}
    if duplicate_emails:
        for email, user_ids in sorted(duplicate_emails.items()):
            print(f"VALIDATION_ERROR email={email} reason=duplicate_users_remaining user_ids={','.join(sorted(user_ids))}")
        stats.failed_validations += len(duplicate_emails)

    if state_changed:
        store.write_snapshot()
    return stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate legacy users into the current auth state store.")
    parser.add_argument(
        "--legacy-db",
        default="/home/vitus/Documents/puhis/backend/local_data.db",
        type=Path,
        help="Path to the legacy SQLite auth database.",
    )
    parser.add_argument(
        "--state-file",
        default=REPO_ROOT / "apps/backend/runtime/state.json",
        type=Path,
        help="Path to the current auth state snapshot.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    stats = migrate_legacy_users(legacy_db=args.legacy_db.expanduser(), state_file=args.state_file.expanduser())
    print(
        "SUMMARY "
        f"total_users_processed={stats.total_users_processed} "
        f"migrated_users={stats.migrated_users} "
        f"duplicates_resolved={stats.duplicates_resolved} "
        f"invalid_hashes={stats.invalid_hashes} "
        f"failed_validations={stats.failed_validations} "
        f"errors={stats.errors}"
    )
    return 0 if stats.errors == 0 and stats.invalid_hashes == 0 and stats.failed_validations == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
