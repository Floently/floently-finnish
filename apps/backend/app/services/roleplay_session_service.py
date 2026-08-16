"""Mounted authenticated roleplay session service.

This service is the HTTP-facing ownership boundary for roleplay. It deliberately
reuses the current roleplay runtime's scenario/persona/mission logic while
calling the runtime's existing internal same-user primitives with the real
learner identity.
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from app.core.state_store import STORE
from app.runtime import roleplay as roleplay_runtime
from app.services.roleplay_evaluation_service import evaluate_roleplay_session
from app.services.roleplay_ownership import (
    assert_or_claim_roleplay_owner,
    mark_new_roleplay_owner,
)


def _claim_session(
    *,
    session_id: str,
    user_id: str,
    authenticated_legacy_keys: Iterable[str] | None = None,
    is_new_session: bool = False,
) -> dict[str, Any]:
    with STORE.locked(("roleplay_sessions", session_id)):
        session = STORE.get_ref("roleplay_sessions", session_id)
        if is_new_session:
            return mark_new_roleplay_owner(
                session=session,
                user_id=user_id,
                expected_rotation_user_key=user_id,
            )
        return assert_or_claim_roleplay_owner(
            session=session,
            user_id=user_id,
            authenticated_legacy_keys=authenticated_legacy_keys,
        )


def start_session(
    *,
    user_id: str,
    profession: str,
    level_band: str,
    scenario_id: str | None = None,
    context_label: str | None = None,
) -> dict[str, Any]:
    owner = str(user_id or "").strip()

    # Reuse the protected runtime start behavior exactly. Its current public
    # wrapper creates the session as `preview`, but persists owner inside
    # display_preferences as the rotation key. Claim it before returning the ID.
    result = roleplay_runtime.start_session(
        profession=profession,
        level_band=level_band,
        scenario_id=scenario_id,
        context_label=context_label,
        rotation_user_key=owner,
    )
    session_id = str(result.get("sessionId") or result.get("session_id") or "").strip()

    try:
        _claim_session(
            session_id=session_id,
            user_id=owner,
            is_new_session=True,
        )
    except Exception:
        # Never leave a newly-created, unreturned preview-owned session behind
        # when the authenticated binding itself failed.
        if session_id:
            with STORE.locked(("roleplay_sessions", session_id)):
                candidate = STORE.get_ref("roleplay_sessions", session_id)
                if candidate and str(candidate.get("user_id") or "") == "preview":
                    STORE.delete("roleplay_sessions", session_id)
        raise

    return result


def submit_turn(
    *,
    user_id: str,
    session_id: str,
    transcript: str,
    authenticated_legacy_keys: Iterable[str] | None = None,
) -> dict[str, Any]:
    owner = str(user_id or "").strip()
    _claim_session(
        session_id=session_id,
        user_id=owner,
        authenticated_legacy_keys=authenticated_legacy_keys,
    )

    # These protected runtime primitives already call _assert_session_access.
    # Passing the authenticated owner here gives the internal runtime the same
    # ownership boundary as the HTTP router.
    result = roleplay_runtime._submit_session_turn(
        user_id=owner,
        session_id=session_id,
        user_message=transcript,
    )
    session = roleplay_runtime._get_session(
        user_id=owner,
        session_id=session_id,
    )
    ai_text = str(
        (result.get("appended_messages") or [{}, {}])[-1].get("text")
        or ""
    )
    return {
        "sessionId": session_id,
        "session_id": session_id,
        "aiText": ai_text,
        "aiReply": ai_text,
        "voiceProfile": session.get("voice_profile", "yki_standard_female"),
        "personaName": session.get("persona_name", "AI"),
        "personaId": session.get("persona_id"),
        "personaGender": session.get("persona_gender"),
        "completed": result.get("status") == "completed",
        "currentUserTurn": result.get("progress", {}).get("user_turns_completed", 0),
        "feedbackLine": result.get("feedback_line"),
        "missingPhrases": result.get("missing_phrases") or [],
        "engineMode": result.get("engine_mode") or session.get("last_engine_mode") or "unknown",
    }


def finish_session(
    *,
    user_id: str,
    session_id: str,
    authenticated_legacy_keys: Iterable[str] | None = None,
) -> dict[str, Any]:
    owner = str(user_id or "").strip()
    _claim_session(
        session_id=session_id,
        user_id=owner,
        authenticated_legacy_keys=authenticated_legacy_keys,
    )
    session = roleplay_runtime._get_session(
        user_id=owner,
        session_id=session_id,
    )

    if session.get("status") != "completed":
        return {
            "session_id": session_id,
            "status": session.get("status"),
            "completed": False,
            "message": "Session is still in progress.",
        }

    review = roleplay_runtime._build_review(
        user_id=owner,
        session_id=session_id,
    )
    evaluation_report = evaluate_roleplay_session(
        session=session,
        review=review,
    )

    return {
        **review,
        "completed": True,
        "evaluation": evaluation_report,
        "evaluationReport": evaluation_report,
        "disclaimer": evaluation_report["disclaimer"],
    }
