from __future__ import annotations

import os
from pathlib import Path
import subprocess


REPO_ROOT = Path(__file__).resolve().parents[3]
VERIFIER = REPO_ROOT / "apps" / "client" / "scripts" / "verify-professional-missions.mjs"
IMMUTABLE_WAVE1_BASE = "69813b433838130d5afe4b052360dbfd12df3f40"


def _run_verifier() -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env.setdefault("WAVE1_BASE_REF", IMMUTABLE_WAVE1_BASE)
    return subprocess.run(
        ["node", str(VERIFIER)],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


# Execute during pytest collection so this feature's contract is independently
# observable even when unrelated engine modules fail later in global collection.
_RESULT = _run_verifier()
print(_RESULT.stdout, end="")
if _RESULT.returncode != 0:
    raise AssertionError(
        "Professional mission verifier failed during collection.\n"
        f"stdout:\n{_RESULT.stdout}\n"
        f"stderr:\n{_RESULT.stderr}"
    )


def test_professional_mission_contract() -> None:
    assert "PROFESSIONAL_MISSION_FEATURE_TESTS=PASS" in _RESULT.stdout
    assert "PROFESSION_LEAKAGE_GUARD=PASS" in _RESULT.stdout
    assert "MISSION_ORDER_AND_CONTEXT=PASS" in _RESULT.stdout
    assert "CANONICAL_RUNTIME_REFERENCES=PASS" in _RESULT.stdout
    assert "LEVEL_AND_SKILL_METADATA=PASS" in _RESULT.stdout
    assert "MALFORMED_MISSION_REJECTION=PASS" in _RESULT.stdout
    assert "CONTENT_PROVENANCE=PASS" in _RESULT.stdout
    assert "YKI_CONTENT_SEPARATION=PASS" in _RESULT.stdout
    assert "PROTECTED_ROLEPLAY_FILES_UNTOUCHED=PASS" in _RESULT.stdout
