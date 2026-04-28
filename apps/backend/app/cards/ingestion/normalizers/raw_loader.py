from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from app.cards.ingestion.errors import RawInputError


def load_raw_items(source: Path | str | Iterable[dict]) -> list[dict]:
    if isinstance(source, (list, tuple)):
        return [_ensure_dict(item) for item in source]

    if not isinstance(source, (Path, str)):
        raise RawInputError("Unsupported source type")

    path = Path(source)
    if not path.exists():
        raise RawInputError(f"Raw source does not exist: {path}")

    if path.suffix == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            return [_ensure_dict(item) for item in payload]
        if isinstance(payload, dict):
            if isinstance(payload.get("items"), list):
                return [_ensure_dict(item) for item in payload["items"]]
            return [_ensure_dict(payload)]
        raise RawInputError("JSON source must contain a dict or list")

    if path.suffix == ".jsonl":
        items: list[dict] = []
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            payload = json.loads(line)
            items.append(_ensure_dict(payload, line_number=line_number))
        return items

    if path.suffix == ".txt":
        return [{"text": line.strip()} for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

    raise RawInputError(f"Unsupported source extension: {path.suffix}")


def _ensure_dict(item: object, *, line_number: int | None = None) -> dict:
    if not isinstance(item, dict):
        suffix = f" on line {line_number}" if line_number is not None else ""
        raise RawInputError(f"Raw item must be an object{suffix}")
    return dict(item)
