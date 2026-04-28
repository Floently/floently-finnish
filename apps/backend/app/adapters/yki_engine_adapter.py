from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin

import httpx

from app.core.config import SETTINGS


@dataclass
class EngineResponse:
    status_code: int
    payload: dict[str, Any]


async def perform_engine_request(*, method: str, path: str, payload: dict[str, Any] | None = None) -> EngineResponse:
    base_url = SETTINGS.yki_engine_base_url.rstrip("/") + "/"
    target = urljoin(base_url, path.lstrip("/"))
    timeout = httpx.Timeout(SETTINGS.yki_engine_timeout_seconds)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(method.upper(), target, json=payload)
    except httpx.HTTPError as exc:
        return EngineResponse(status_code=503, payload={"detail": {"message": f"YKI engine unavailable: {exc}"}})
    try:
        data = response.json()
        if isinstance(data, dict):
            payload_data = data
        else:
            payload_data = {"data": data}
    except ValueError:
        payload_data = {"detail": {"message": response.text or response.reason_phrase or "YKI engine request failed."}}
    return EngineResponse(status_code=response.status_code, payload=payload_data)
