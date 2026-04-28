from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.paths import YKI_MATERIALS_DIR

YKI_TASK_INDEX_PATH = YKI_MATERIALS_DIR / "task_banks" / "task_index_v3_2.json"
YKI_POOL_INDEX_PATH = YKI_MATERIALS_DIR / "certified_bank" / "metadata" / "pool_index.json"
YKI_MANIFEST_PATH = YKI_MATERIALS_DIR / "manifest" / "manifest.json"
YKI_CERTIFIED_BANK_ROOT = YKI_MATERIALS_DIR / "certified_bank"
YKI_CERTIFIED_MANIFEST_PATH = YKI_CERTIFIED_BANK_ROOT / "manifest.json"


def load_yki_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Missing YKI materials file: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")
    return payload
