from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Header

from app.core.errors import AppError
from app.core.request_context import request_header
from app.core.state_store import STORE
from app.core.utils import parse_iso, utc_now
from app.services.auth_service import current_user_from_authorization

router = APIRouter(prefix="/devices", tags=["devices"])

ACTIVE_DEVICE_WINDOW_DAYS = 30


def _require_user(authorization: str | None) -> dict[str, Any]:
    user, _ = current_user_from_authorization(authorization)
    return user


def _current_device_id() -> str | None:
    value = request_header("x-floently-device-id")
    return str(value or "").strip() or None


def _active_devices_for_user(user_id: str) -> list[dict[str, Any]]:
    cutoff = utc_now() - timedelta(days=ACTIVE_DEVICE_WINDOW_DAYS)
    rows: list[dict[str, Any]] = []
    current = _current_device_id()

    for key, payload in list(STORE._data.get("client_devices", {}).items()):
        if not isinstance(payload, dict):
            continue
        if str(payload.get("user_id") or "") != user_id:
            continue

        last_seen = parse_iso(payload.get("last_seen_at"))
        if not last_seen or last_seen < cutoff:
            continue

        device_id = str(payload.get("device_id") or key.split(":", 1)[-1])
        rows.append(
            {
                "device_id": device_id,
                "platform": payload.get("platform") or "unknown",
                "first_seen_at": payload.get("first_seen_at"),
                "last_seen_at": payload.get("last_seen_at"),
                "current": bool(current and device_id == current),
            }
        )

    rows.sort(key=lambda item: str(item.get("last_seen_at") or ""), reverse=True)
    return rows


@router.get("")
def list_devices(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _require_user(authorization)
    devices = _active_devices_for_user(str(user["user_id"]))
    return {
        "ok": True,
        "devices": devices,
        "device_count": len(devices),
        "current_device_id": _current_device_id(),
    }


@router.delete("/{device_id}")
def remove_device(device_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _require_user(authorization)
    user_id = str(user["user_id"])
    normalized = str(device_id or "").strip()

    if not normalized:
        raise AppError(
            400,
            "DEVICE_ID_REQUIRED",
            "Device id is required.",
            False,
            {"classification": "non_retryable"},
        )

    key = f"{user_id}:{normalized}"
    existed = key in STORE._data.get("client_devices", {})
    if existed:
        STORE.delete("client_devices", key)
        STORE.write_snapshot()

    return {"ok": True, "removed": existed, "device_id": normalized}


@router.post("/reset")
def reset_other_devices(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _require_user(authorization)
    user_id = str(user["user_id"])
    current = _current_device_id()
    removed: list[str] = []

    for key, payload in list(STORE._data.get("client_devices", {}).items()):
        if not isinstance(payload, dict):
            continue
        if str(payload.get("user_id") or "") != user_id:
            continue

        device_id = str(payload.get("device_id") or key.split(":", 1)[-1])
        if current and device_id == current:
            continue

        STORE.delete("client_devices", key)
        removed.append(device_id)

    if removed:
        STORE.write_snapshot()

    return {"ok": True, "removed": removed, "removed_count": len(removed)}
