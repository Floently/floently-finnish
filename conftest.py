from __future__ import annotations

import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent

for candidate in (
    REPO_ROOT / "apps" / "backend",
    REPO_ROOT / "apps" / "backend" / "app",
    REPO_ROOT,
):
    candidate_str = str(candidate)
    if candidate.exists() and candidate_str not in sys.path:
        sys.path.insert(0, candidate_str)
