from __future__ import annotations

import copy
from typing import Any

from ..adapters.yki_engine_adapter import EngineResponse, perform_engine_request
from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import iso_now


async def engine_request(*, method: str, path: str, payload: dict[str, Any] | None = None) -> EngineResponse:
    return await perform_engine_request(method=method, path=path, payload=payload)


def map_engine_error(*, response: EngineResponse) -> None:
    if response.status_code < 400:
        return
    detail = response.payload.get("detail") if isinstance(response.payload, dict) else response.payload
    message = detail.get("message") if isinstance(detail, dict) and detail.get("message") else str(detail or "YKI engine request failed.")
    if response.status_code in {408, 429, 500, 502, 503, 504}:
        raise AppError(response.status_code, "YKI_ENGINE_RETRYABLE", message, True, {"classification": "retryable"})
    if response.status_code == 410:
        raise AppError(response.status_code, "YKI_SESSION_EXPIRED", message, False, {"classification": "terminal"})
    if response.status_code in {404, 409}:
        raise AppError(response.status_code, "YKI_INVALID_STATE", message, False, {"classification": "terminal"})
    raise AppError(response.status_code, "YKI_REQUEST_REJECTED", message, False, {"classification": "non_retryable"})


def store_yki_session(
    *,
    user_id: str,
    runtime: dict[str, Any],
) -> None:
    session_id = str(
        runtime.get("session_id")
        or ""
    ).strip()

    if not session_id:
        return

    incoming_token = str(
        runtime.get("engine_session_token")
        or (
            runtime.get("metadata")
            or {}
        ).get("engine_session_token")
        or ""
    ).strip()

    with STORE.locked(
        ("yki_sessions", session_id)
    ):
        existing = STORE.get_ref(
            "yki_sessions",
            session_id,
        )

        existing_record = (
            existing
            if isinstance(existing, dict)
            else {}
        )

        token = (
            incoming_token
            or str(
                existing_record.get(
                    "engine_session_token"
                )
                or ""
            ).strip()
        )

        schema_version = (
            runtime.get(
                "runtime_schema_version"
            )
            or existing_record.get(
                "runtime_schema_version"
            )
        )

        record: dict[str, Any] = {
            "user_id": user_id,
            "engine_session_token": token,
            "runtime_schema_version":
                schema_version,
            "runtime": copy.deepcopy(
                runtime
            ),
            "updated_at": iso_now(),
        }

        for key in (
            "evaluation_evidence",
            "submission_result",
            "evaluation_report",
            "submitted_at",
        ):
            if key in existing_record:
                record[key] = copy.deepcopy(
                    existing_record[key]
                )

        STORE.set(
            "yki_sessions",
            session_id,
            record,
        )


def sanitize_runtime_for_client(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            if key in {
                "engine_session_token",
                "debug",
                "canonical_structure",
                "canonical_task",
                "internal_state",
                "raw_runtime",
                "correct_index",
                "correctIndex",
                "correctBoolean",
                "correct_answer",
                "correctAnswer",
            }:
                continue
            sanitized[key] = sanitize_runtime_for_client(item)
        return sanitized
    if isinstance(value, list):
        return [sanitize_runtime_for_client(item) for item in value]
    return value


def get_yki_session_record(*, user_id: str, session_id: str) -> dict[str, Any]:
    with STORE.locked(("yki_sessions", session_id)):
        payload = STORE.get_ref("yki_sessions", session_id)
        if not payload:
            raise AppError(404, "YKI_SESSION_NOT_FOUND", "YKI session is not known to the adapter.", False, {"classification": "terminal"})
        if payload.get("user_id") != user_id:
            raise AppError(403, "YKI_SESSION_FORBIDDEN", "YKI session is not available for this user.", False, {"classification": "non_retryable"})
        return {
            "user_id": payload["user_id"],
            "engine_session_token":
                payload["engine_session_token"],
            "runtime_schema_version":
                payload.get(
                    "runtime_schema_version"
                ),
            "runtime": copy.deepcopy(
                payload.get("runtime")
            ),
            "evaluation_report":
                copy.deepcopy(
                    payload.get(
                        "evaluation_report"
                    )
                ),
            "submission_result":
                copy.deepcopy(
                    payload.get(
                        "submission_result"
                    )
                ),
            "submitted_at": payload.get(
                "submitted_at"
            ),
            "updated_at": payload.get(
                "updated_at"
            ),
        }

def record_yki_evaluation_evidence(
    *,
    user_id: str,
    session_id: str,
    category: str,
    key: str,
    value: Any,
) -> None:
    normalized_category = str(category or "").strip()
    normalized_key = str(key or "").strip()

    if not normalized_category or not normalized_key:
        return

    with STORE.locked(("yki_sessions", session_id)):
        record = STORE.get_ref(
            "yki_sessions",
            session_id,
        )

        if not record:
            raise AppError(
                404,
                "YKI_SESSION_NOT_FOUND",
                "YKI session is not known to the adapter.",
                False,
                {"classification": "terminal"},
            )

        if record.get("user_id") != user_id:
            raise AppError(
                403,
                "YKI_SESSION_FORBIDDEN",
                "YKI session is not available for this user.",
                False,
                {"classification": "non_retryable"},
            )

        evidence = record.setdefault(
            "evaluation_evidence",
            {},
        )

        bucket = evidence.setdefault(
            normalized_category,
            {},
        )

        bucket[normalized_key] = copy.deepcopy(
            value,
        )

        record["updated_at"] = iso_now()

        STORE.set(
            "yki_sessions",
            session_id,
            record,
        )


def store_yki_evaluation_result(
    *,
    user_id: str,
    session_id: str,
    submission: dict[str, Any],
    evaluation_report: dict[str, Any],
) -> None:
    with STORE.locked(
        ("yki_sessions", session_id)
    ):
        record = STORE.get_ref(
            "yki_sessions",
            session_id,
        )

        if not record:
            raise AppError(
                404,
                "YKI_SESSION_NOT_FOUND",
                (
                    "YKI session is not known "
                    "to the adapter."
                ),
                False,
                {
                    "classification":
                        "terminal"
                },
            )

        if record.get("user_id") != user_id:
            raise AppError(
                403,
                "YKI_SESSION_FORBIDDEN",
                (
                    "YKI session is not "
                    "available for this user."
                ),
                False,
                {
                    "classification":
                        "non_retryable"
                },
            )

        submitted_at = iso_now()

        record["submission_result"] = (
            copy.deepcopy(submission)
        )
        record["evaluation_report"] = (
            copy.deepcopy(
                evaluation_report
            )
        )
        record["submitted_at"] = (
            submitted_at
        )
        record["updated_at"] = (
            submitted_at
        )

        STORE.set(
            "yki_sessions",
            session_id,
            record,
        )


def read_yki_evaluation_evidence(
    *,
    user_id: str,
    session_id: str,
) -> dict[str, Any]:
    with STORE.locked(("yki_sessions", session_id)):
        record = STORE.get_ref(
            "yki_sessions",
            session_id,
        )

        if not record:
            raise AppError(
                404,
                "YKI_SESSION_NOT_FOUND",
                "YKI session is not known to the adapter.",
                False,
                {"classification": "terminal"},
            )

        if record.get("user_id") != user_id:
            raise AppError(
                403,
                "YKI_SESSION_FORBIDDEN",
                "YKI session is not available for this user.",
                False,
                {"classification": "non_retryable"},
            )

        evidence = record.get(
            "evaluation_evidence",
        )

        return (
            copy.deepcopy(evidence)
            if isinstance(evidence, dict)
            else {}
        )
