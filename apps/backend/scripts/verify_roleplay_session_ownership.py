#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.errors import AppError  # noqa: E402
from app.services.roleplay_ownership import (  # noqa: E402
    assert_or_claim_roleplay_owner,
    mark_new_roleplay_owner,
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def expect_error(code: str, status_code: int, callback) -> AppError:
    try:
        callback()
    except AppError as exc:
        require(exc.code == code, f"expected {code}, got {exc.code}")
        require(
            exc.status_code == status_code,
            f"expected status {status_code}, got {exc.status_code}",
        )
        return exc
    raise AssertionError(f"expected AppError {code}")


def legacy_session(rotation_key: str | None) -> dict:
    preferences = {}
    if rotation_key is not None:
        preferences["_rotation_user_key"] = rotation_key
    return {
        "session_id": "rp_legacy",
        "user_id": "preview",
        "display_preferences": preferences,
    }


def main() -> None:
    # Already-migrated/canonical ownership: same user passes, other user fails.
    owned = {
        "session_id": "rp_owned",
        "user_id": "usr_a",
        "display_preferences": {"_rotation_user_key": "usr_a"},
    }
    result = assert_or_claim_roleplay_owner(
        session=owned,
        user_id="usr_a",
        authenticated_legacy_keys=("usr_a", "a@example.test"),
    )
    require(result is owned, "same-user ownership did not preserve the session object")
    require(result["user_id"] == "usr_a", "same-user ownership changed owner")

    expect_error(
        "ROLEPLAY_FORBIDDEN",
        403,
        lambda: assert_or_claim_roleplay_owner(
            session=owned,
            user_id="usr_b",
            authenticated_legacy_keys=("usr_b", "b@example.test"),
        ),
    )

    # Old authenticated router normally persisted user_id as rotation key.
    legacy_by_id = legacy_session("usr_a")
    claimed_by_id = assert_or_claim_roleplay_owner(
        session=legacy_by_id,
        user_id="usr_a",
        authenticated_legacy_keys=("usr_a", "a@example.test"),
    )
    require(claimed_by_id["user_id"] == "usr_a", "legacy user-id session was not claimed")
    require(
        claimed_by_id["ownership_migrated_key_kind"] == "user_id",
        "legacy user-id claim was not classified correctly",
    )

    # Email is accepted only when it is an alias from this same authenticated
    # user record. It never becomes the canonical owner.
    legacy_by_email = legacy_session("a@example.test")
    claimed_by_email = assert_or_claim_roleplay_owner(
        session=legacy_by_email,
        user_id="usr_a",
        authenticated_legacy_keys=("usr_a", "a@example.test"),
    )
    require(claimed_by_email["user_id"] == "usr_a", "legacy email session was not canonicalized to user_id")
    require(
        claimed_by_email["ownership_migrated_key_kind"] == "authenticated_alias",
        "legacy email claim was not classified as an authenticated alias",
    )

    # A different authenticated account cannot claim another learner's legacy
    # preview session, even if it knows the session ID.
    cross_account = legacy_session("usr_a")
    expect_error(
        "ROLEPLAY_LEGACY_OWNER_UNPROVEN",
        403,
        lambda: assert_or_claim_roleplay_owner(
            session=cross_account,
            user_id="usr_b",
            authenticated_legacy_keys=("usr_b", "b@example.test"),
        ),
    )
    require(
        cross_account["user_id"] == "preview",
        "failed cross-account claim mutated the legacy owner",
    )

    email_cross_account = legacy_session("a@example.test")
    expect_error(
        "ROLEPLAY_LEGACY_OWNER_UNPROVEN",
        403,
        lambda: assert_or_claim_roleplay_owner(
            session=email_cross_account,
            user_id="usr_b",
            authenticated_legacy_keys=("usr_b", "b@example.test"),
        ),
    )

    # Legacy sessions with no trustworthy identity evidence fail closed.
    for session in (legacy_session(None), legacy_session("preview"), legacy_session("unknown")):
        expect_error(
            "ROLEPLAY_LEGACY_OWNER_UNPROVEN",
            403,
            lambda session=session: assert_or_claim_roleplay_owner(
                session=session,
                user_id="usr_a",
                authenticated_legacy_keys=("usr_a", "a@example.test"),
            ),
        )

    expect_error(
        "ROLEPLAY_OWNER_REQUIRED",
        401,
        lambda: assert_or_claim_roleplay_owner(
            session=legacy_session("usr_a"),
            user_id="",
            authenticated_legacy_keys=("usr_a",),
        ),
    )

    # New sessions have a stricter contract: canonical user_id must be the exact
    # rotation key. Email is migration-only and cannot own a new session.
    new_session = legacy_session("usr_a")
    marked_new = mark_new_roleplay_owner(
        session=new_session,
        user_id="usr_a",
        expected_rotation_user_key="usr_a",
    )
    require(marked_new["user_id"] == "usr_a", "new session was not bound to canonical user_id")

    expect_error(
        "ROLEPLAY_OWNER_BINDING_INVALID",
        500,
        lambda: mark_new_roleplay_owner(
            session=legacy_session("a@example.test"),
            user_id="usr_a",
            expected_rotation_user_key="a@example.test",
        ),
    )

    # Once claimed by A, B remains denied permanently.
    expect_error(
        "ROLEPLAY_FORBIDDEN",
        403,
        lambda: assert_or_claim_roleplay_owner(
            session=claimed_by_email,
            user_id="usr_b",
            authenticated_legacy_keys=("usr_b", "b@example.test"),
        ),
    )

    # Source-contract guards: the mounted router must not re-import the public
    # preview wrappers and the authenticated service must pass real owner IDs to
    # the runtime's existing same-user primitives.
    router_text = (BACKEND_ROOT / "app/routers/v1_roleplay.py").read_text(encoding="utf-8")
    service_text = (BACKEND_ROOT / "app/services/roleplay_session_service.py").read_text(encoding="utf-8")
    runtime_text = (BACKEND_ROOT / "app/runtime/roleplay.py").read_text(encoding="utf-8")
    auth_text = (BACKEND_ROOT / "app/services/auth_service.py").read_text(encoding="utf-8")

    require(
        "from app.services.roleplay_session_service import" in router_text,
        "mounted roleplay router does not use authenticated session service",
    )
    for stale_import in (
        "start_session as runtime_start_session",
        "submit_turn as runtime_submit_turn",
        "finish_session as runtime_finish_session",
    ):
        require(stale_import not in router_text, f"mounted router reintroduced preview wrapper: {stale_import}")

    require(
        'owner_id, legacy_aliases = _authenticated_roleplay_identity(user)' in router_text,
        "turn/finish routes do not derive ownership from authenticated user record",
    )
    require(
        'owner_id, _ = _authenticated_roleplay_identity(user)' in router_text,
        "start route does not derive canonical owner from authenticated user record",
    )
    require(
        'email = str(user.get("email") or "").strip()' in router_text,
        "legacy email alias is not sourced from authenticated user record",
    )
    require(
        'user_id = str(user.get("user_id") or "").strip()' in router_text,
        "canonical roleplay owner is not authenticated user_id",
    )
    require('user_id="preview"' not in router_text, "mounted router contains preview ownership")
    require('user_id="preview"' not in service_text, "authenticated roleplay service contains preview ownership")

    for protected_call in (
        "roleplay_runtime._submit_session_turn(\n        user_id=owner,",
        "roleplay_runtime._get_session(\n        user_id=owner,",
        "roleplay_runtime._build_review(\n        user_id=owner,",
    ):
        require(protected_call in service_text, f"authenticated service lost protected runtime call: {protected_call}")

    # The legacy runtime wrappers may remain for compatibility, but the source
    # guard proves they are still preview-scoped and therefore must never be
    # mounted directly again.
    require(
        'user_id="preview"' in runtime_text,
        "legacy preview wrapper signature changed; revisit migration verifier",
    )

    # Authenticated current-user payload must expose both stable fields used by
    # the safe migration logic.
    require('"user_id": user["user_id"]' in auth_text, "authenticated user payload lost user_id")
    require('"email": user["email"]' in auth_text, "authenticated user payload lost email")

    print("ROLEPLAY_AUTHENTICATED_OWNERSHIP=PASS")
    print("ROLEPLAY_CROSS_ACCOUNT_DENIAL=PASS")
    print("ROLEPLAY_LEGACY_SAFE_CLAIM=PASS")
    print("ROLEPLAY_NEW_SESSION_OWNER=user_id")


if __name__ == "__main__":
    main()
