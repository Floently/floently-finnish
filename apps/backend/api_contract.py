from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib
import json
from typing import Any

BACKEND_VERSION = "2026-04-01.backend-lock.v1"
CONTRACT_VERSION = "2026-04-01.contract-lock.v1"
contract_audit_log: list[dict] = []
_trace_counter = 0

def stable_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: stable_value(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [stable_value(item) for item in value]
    return value


def deterministic_hash(value: Any) -> str:
    payload = json.dumps(stable_value(value), ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class SessionIdentity:
    user_id: str
    mode: str


@dataclass(frozen=True)
class DiagnoseRequest:
    identity: SessionIdentity


def current_timestamp():
    return datetime.now(UTC).isoformat()


def payload_hash(value):
    return deterministic_hash(value)

def meta(trace_id: str, event_id: str | None = None):
    metadata: dict[str, Any] = {
        "version": BACKEND_VERSION,
        "contract_version": CONTRACT_VERSION,
        "timestamp": current_timestamp(),
        "trace_id": trace_id,
    }
    if event_id is not None:
        metadata["event_id"] = event_id
    return metadata


def next_trace_id():
    global _trace_counter
    _trace_counter += 1
    return f"trace-{_trace_counter:06d}"


def resolve_trace_id(trace_id: str | None):
    return trace_id or next_trace_id()


def _extract_session_hash(payload):
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return None
    return data.get("session_hash")


def _extract_task_sequence_hash(payload):
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return None
    return data.get("task_sequence_hash")


def _extract_user_id(payload):
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        return None
    user_id = data.get("user_id")
    return user_id if isinstance(user_id, str) else None


def record_contract_action(
    action_type: str,
    session_id: str | None,
    request_payload,
    response_payload,
    *,
    trace_id: str,
    event_id: str | None,
    user_id: str | None = None,
):
    try:
        from audit.audit_service import record_event
    except Exception:
        def record_event(payload: dict[str, Any]) -> dict[str, Any]:
            return {
                "timestamp": current_timestamp(),
                "event_id": payload.get("event_id") or f"event-{next_trace_id()}",
                "request_payload_hash": payload.get("request_payload_hash"),
                "response_payload_hash": payload.get("response_payload_hash"),
            }

    serialized_response = stable_value(response_payload)
    event = record_event(
        {
            "event_id": event_id,
            "trace_id": trace_id,
            "user_id": user_id or _extract_user_id(serialized_response),
            "session_id": session_id,
            "event_type": action_type,
            "request_payload_hash": payload_hash(request_payload),
            "response_payload_hash": payload_hash(serialized_response),
            "contract_version": CONTRACT_VERSION,
            "session_hash": _extract_session_hash(serialized_response),
            "task_sequence_hash": _extract_task_sequence_hash(serialized_response),
            "input_snapshot": stable_value(request_payload),
            "output_snapshot": serialized_response,
            "constraint_metadata": {
                "backend_version": BACKEND_VERSION,
                "contract_version": CONTRACT_VERSION,
            },
        }
    )

    contract_audit_log.append(
        {
            "timestamp": event["timestamp"],
            "event_id": event["event_id"],
            "trace_id": trace_id,
            "action_type": action_type,
            "session_id": session_id,
            "request_payload_hash": event["request_payload_hash"],
            "response_payload_hash": event["response_payload_hash"],
        }
    )

    if len(contract_audit_log) > 50:
        del contract_audit_log[: len(contract_audit_log) - 50]

    return event


def success(data, *, trace_id: str, event_id: str | None = None):
    return {
        "ok": True,
        "data": stable_value(data),
        "error": None,
        "meta": meta(trace_id, event_id),
    }


def failure(
    code,
    message=None,
    retryable=False,
    *,
    trace_id: str,
    event_id: str | None = None,
):
    return {
        "ok": False,
        "data": None,
        "error": {
            "code": code,
            "message": message or code,
            "retryable": retryable,
            "trace_id": trace_id,
            "event_id": event_id,
        },
        "meta": meta(trace_id, event_id),
    }
