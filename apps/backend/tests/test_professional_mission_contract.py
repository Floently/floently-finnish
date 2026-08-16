from __future__ import annotations

import os
from pathlib import Path
import subprocess


REPO_ROOT = Path(__file__).resolve().parents[3]
VERIFIER = REPO_ROOT / "apps" / "client" / "scripts" / "verify-professional-missions.mjs"
IMMUTABLE_WAVE1_BASE = "69813b433838130d5afe4b052360dbfd12df3f40"


def test_professional_mission_contract() -> None:
    env = os.environ.copy()
    env.setdefault("WAVE1_BASE_REF", IMMUTABLE_WAVE1_BASE)
    result = subprocess.run(
        ["node", str(VERIFIER)],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, (
        "Professional mission verifier failed.\n"
        f"stdout:\n{result.stdout}\n"
        f"stderr:\n{result.stderr}"
    )
    assert "PROFESSIONAL_MISSION_FEATURE_TESTS=PASS" in result.stdout
    assert "PROFESSION_LEAKAGE_GUARD=PASS" in result.stdout
    assert "MALFORMED_MISSION_REJECTION=PASS" in result.stdout
    assert "CONTENT_PROVENANCE=PASS" in result.stdout
    assert "YKI_CONTENT_SEPARATION=PASS" in result.stdout
    assert "PROTECTED_ROLEPLAY_FILES_UNTOUCHED=PASS" in result.stdout
