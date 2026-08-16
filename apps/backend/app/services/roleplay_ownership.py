"""Authenticated ownership contract for roleplay sessions.

KV-SEC-002 closes the mounted-route gap where authenticated HTTP requests used
runtime sessions owned by the shared literal ``preview`` identity.

Legacy compatibility is deliberately narrow: an old preview-owned session may
be claimed only when the persisted rotation key exactly equals the authenticated
caller's stable identity. Missing or mismatched evidence fails closed.
"""
from __future__ import annotations

from typing import Any

from app.core.errors import AppError
from app.core.utils import iso_now


def assert_or_claim_roleplay_owner(
    *,
    session: dict[str, Any] | None,
    user_id: str,
    legacy_rotation_user_key: str | None,
) -> dict[str, Any]:
    if not session:
        raise AppError(
            404,
            "ROLEPLAY_NOT_FOUND",
            "Roleplay session was not found.",
            False,
            {"classification": "terminal"},
        )

    caller = str(user_id or "").strip()
    if not caller or caller == "preview":
        raise AppError(
            401,
            "ROLEPLAY_OWNER_REQUIRED",
            "An authenticated learner identity is required for roleplay.",
            False,
            {"classification": "non_retryable"},
        )

    current_owner = str(session.get("user_id") or "").strip()
    if current_owner == caller:
        return session

    if current_owner != "preview":
        raise AppError(
            403,
            "ROLEPLAY_FORBIDDEN",
            "Roleplay session is not available for this user.",
            False,
            {"classification": "non_retryable"},
        )

    stored_rotation_key = str(
        (session.get("display_preferences") or {}).get("_rotation_user_key")
        or ""
    ).strip()
    supplied_rotation_key = str(legacy_rotation_user_key or "").strip()

    # There is no safe ownership inference from session ID, persona, profession,
    # email-like display values, or timing. Only the exact identity that the old
    # authenticated router persisted for scenario rotation is acceptable proof.
    if (
        not stored_rotation_key
        or stored_rotation_key == "preview"
        or not supplied_rotation_key
        or supplied_rotation_key != caller
        or stored_rotation_key != caller
    ):
        raise AppError(
            403,
            "ROLEPLAY_LEGACY_OWNER_UNPROVEN",
            "This older roleplay session cannot be safely linked to the current user. Start a new session.",
            False,
            {"classification": "non_retryable"},
        )

    session["user_id"] = caller
    session["ownership_version"] = "authenticated-v1"
    session["ownership_migrated_from"] = "preview"
    session["ownership_migrated_at"] = iso_now()
    return session


def mark_new_roleplay_owner(
    *,
    session: dict[str, Any] | None,
    user_id: str,
    expected_rotation_user_key: str,
) -> dict[str, Any]:
    """Bind a just-created legacy-runtime session to its authenticated caller.

    The existing runtime start wrapper still creates ``preview`` sessions. The
    mounted service calls it with the authenticated rotation key and immediately
    claims the new session before returning its ID to the client. This isolates
    the security repair from the very large roleplay runtime while preserving
    its scenario/persona/mission behavior byte-for-byte.
    """
    return assert_or_claim_roleplay_owner(
        session=session,
        user_id=user_id,
        legacy_rotation_user_key=expected_rotation_user_key,
    )
