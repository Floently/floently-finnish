from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class PipelineConfig:
    raw: dict[str, Any]

    @property
    def thresholds(self) -> dict[str, Any]:
        return self.raw.get("thresholds", {})

    @property
    def defaults(self) -> dict[str, Any]:
        return self.raw.get("defaults", {})

    @property
    def ai(self) -> dict[str, Any]:
        return self.raw.get("ai", {})

    @property
    def global_dedupe(self) -> dict[str, Any]:
        return self.raw.get("global_dedupe", {})


def load_config(config_path: str | None = None) -> PipelineConfig:
    if config_path:
        path = Path(config_path)
    else:
        path = Path(__file__).resolve().parents[1] / "config" / "defaults.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return PipelineConfig(raw=data)
