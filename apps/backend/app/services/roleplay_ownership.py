"""Authenticated ownership contract for roleplay sessions.

KV-SEC-002 closes the mounted-route gap where authenticated HTTP requests used
runtime sessions owned by the shared literal ``preview`` identity.

Legacy compatibility is deliberately narrow: an old preview-owned session may
be claimed only when its persisted rotation key matches an identity alias read
from the *same authenticated user record* (currently stable user_id or email).
Missing or mismatched evidence fails closed.
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from app.core.errors import AppError
from app.core.utils import iso_now


def _normalized_identity_keys(values: Iterable[str] | None) -> set[str]:
    return {
        str(value or "").strip()
        for value in (values or ())
        if str(value or "").strip() and str(value or "").strip() != "preview"
    }


def assert_or_claim_roleplay_owner(
    *,
    session: dict[str, Any] | None,
    user_id: str,
    authenticated_legacy_keys: Iterable[str] | None = None,
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
    authenticated_keys = _normalized_identity_keys(
        (caller, *(authenticated_legacy_keys or ()))
    )

    # There is no safe ownership inference from session ID, persona, profession,
    # timing, or arbitrary caller input. Only identity fields already attached to
    # the authenticated user record may prove a legacy preview session belongs to
    # this caller. user_id becomes the canonical owner after a successful claim.
    if (
        not stored_rotation_key
        or stored_rotation_key == "preview"
        or stored_rotation_key not in authenticated_keys
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
    session["ownership_migrated_key_kind"] = (
        "user_id" if stored_rotation_key == caller else "authenticated_alias"
    )
    session["ownership_migrated_at"] = iso_now()
    return session


def mark_new_roleplay_owner(
    *,
    session: dict[str, Any] | None,
    user_id: str,
    expected_rotation_user_key: str,
) -> dict[str, Any]:
    """Bind a just-created legacy-runtime session to its authenticated caller.

    New mounted sessions always use the canonical authenticated user_id as their
    rotation key. The claim therefore requires an exact user_id match; email is
    accepted only for older sessions that were already persisted before KV-SEC-002.
    """
    expected = str(expected_rotation_user_key or "").strip()
    caller = str(user_id or "").strip()
    if not expected or expected != caller:
        raise AppError(
            500,
            "ROLEPLAY_OWNER_BINDING_INVALID",
            "New roleplay session ownership could not be established.",
            False,
            {"classification": "terminal"},
        )
    return assert_or_claim_roleplay_owner(
        session=session,
        user_id=caller,
        authenticated_legacy_keys=(expected,),
    )
