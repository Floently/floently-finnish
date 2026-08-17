from __future__ import annotations

import os
from pathlib import Path
import subprocess


REPO_ROOT = Path(__file__).resolve().parents[3]
VERIFIER = REPO_ROOT / "apps" / "client" / "scripts" / "verify-professional-missions.mjs"
IMMUTABLE_WAVE1_BASE = "69813b433838130d5afe4b052360dbfd12df3f40"


def _git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


def _ensure_diff_history_available() -> None:
    if _git("merge-base", IMMUTABLE_WAVE1_BASE, "HEAD").returncode == 0:
        return

    current_ref = os.environ.get("GITHUB_REF", "").strip()
    fetch_args = ["fetch", "--no-tags", "--deepen=16", "origin"]
    if current_ref:
        fetch_args.append(current_ref)

    fetched = _git(*fetch_args)
    if fetched.returncode != 0:
        raise AssertionError(
            "Unable to deepen the current checkout for the immutable-base diff guard.\n"
            f"stdout:\n{fetched.stdout}\n"
            f"stderr:\n{fetched.stderr}"
        )

    if _git("merge-base", IMMUTABLE_WAVE1_BASE, "HEAD").returncode != 0:
        raise AssertionError(
            "The current checkout still has no merge base with the immutable Wave-1 base after a bounded history fetch."
        )


def _ensure_immutable_base_available() -> None:
    probe = _git("cat-file", "-e", f"{IMMUTABLE_WAVE1_BASE}^{{commit}}")
    if probe.returncode != 0:
        fetched = _git("fetch", "--no-tags", "--depth=1", "origin", IMMUTABLE_WAVE1_BASE)
        if fetched.returncode != 0:
            raise AssertionError(
                "Unable to fetch the immutable Wave-1 base required for the protected-file diff guard.\n"
                f"stdout:\n{fetched.stdout}\n"
                f"stderr:\n{fetched.stderr}"
            )

    _ensure_diff_history_available()


def _run_verifier() -> subprocess.CompletedProcess[str]:
    _ensure_immutable_base_available()
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
