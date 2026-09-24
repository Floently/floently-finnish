"""Source-only Build 36 preservation gate for the labelled historic backend.

This is NOT the artifact identity or production ancestry gate. When given a
read-only JSON inventory from inside the running container, this checks whether
its executable Python files are present in the candidate, with one explicitly
reviewed roleplay strengthening exception. Never pass an .env or secret file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[3]
HISTORIC_LABEL = "0e5dc84fa8dcdb0ea746f404c557d8683ce70b75"

UNCHANGED_LABEL_BLOBS: dict[str, str] = {
    "apps/backend/app/models/api_models.py": "cde19a28b9fca418016e99988f08ea0883216de3",
    "apps/backend/app/routers/v1_yki.py": "e0f2ddcbabc5d9b77a0bc9a572923c74fe9c30f4",
    "apps/backend/app/runtime/yki.py": "8a284e44d363d712f78fb0140636a6504663b7ce",
    "apps/backend/app/runtime/yki_local_fallback.py": "d10ed3e479d71bd601d9d3e42bc44b033d4fd13d",
    "apps/backend/app/services/yki_service.py": "aa02bf9de6e66ea5385b3f2fd803b8c58cfb9d11",
    "apps/backend/app/services/roleplay_evaluation_service.py": "6bcc27ea335a08ee253508d584071d02e26c6a51",
    "apps/backend/app/services/yki_evaluation_service.py": "4b6fdd1c1f8e22a79488d1b49053bf5895a094b3",
    "apps/backend/scripts/verify_roleplay_ai_evaluation.py": "9f17f9f0fe8ebe0f4448650a7423098e24782985",
    "apps/backend/scripts/verify_yki_evaluation_regression_recovery.py": "c97ba05c00bbf45cb2b2a51c0179f5c0dd301bb0",
    "apps/backend/scripts/verify_yki_final_submit_recovery.py": "c0b0414c1bfc254dc1d1811ff940bb3d5997b521",
    "apps/backend/scripts/verify_yki_local_fallback_evaluation.py": "ee5d8d17aad6da6f308de6118aa2c6b0dd360aa7",
    "apps/backend/scripts/verify_yki_report_calibration.py": "416345fa58eb163c048534e185dd0cdd8d7002d0",
}
REVIEWED_DIFFERENT_BLOBS: dict[str, tuple[str, str]] = {
    "apps/backend/app/runtime/roleplay.py": (
        "e1dfb689354da781b01464745e627c4c363e8980",
        "dcb87b3763563d1c95d0c84c74c80b7b84a80b91",
    ),
    "apps/backend/scripts/verify_yki_ai_evaluation.py": (
        "314e636b4166019dfcafe5d82b83d6e05ef8b9c5",
        "697078fdcca9b652fe57a2f4181c73f0993681f1",
    ),
    "apps/backend/.env.example": (
        "61fec93b2ec415bdc91c8267567a8bb3b5ec3ed4",
        "2e81b342e7b8d611b250b86b97dc641ab1043bca",
    ),
}
HEX_256 = re.compile(r"^[a-f0-9]{64}$")


def git(*args: str) -> str:
    return subprocess.check_output(
        ["git", *args], cwd=REPOSITORY, text=True, stderr=subprocess.PIPE
    ).strip()


def hash_git_file(ref: str, path: str) -> str:
    return hashlib.sha256(
        subprocess.check_output(["git", "show", f"{ref}:{path}"], cwd=REPOSITORY)
    ).hexdigest()


def validate_git_preservation() -> None:
    bad: list[str] = []
    for path, expected in UNCHANGED_LABEL_BLOBS.items():
        old = git("rev-parse", f"{HISTORIC_LABEL}:{path}")
        current = git("rev-parse", f"HEAD:{path}")
        if old != expected or current != expected:
            bad.append(path)
    for path, (expected_old, expected_candidate) in REVIEWED_DIFFERENT_BLOBS.items():
        old = git("rev-parse", f"{HISTORIC_LABEL}:{path}")
        current = git("rev-parse", f"HEAD:{path}")
        if old != expected_old or current != expected_candidate:
            bad.append(path)
    if bad:
        raise AssertionError(
            "Historic Git preservation changed without reconciliation review: "
            + ", ".join(sorted(bad))
        )
    print("LABELLED_SOURCE_BLOB_COMPARISON=PASS")
    print("EXACTLY_MATCHING_PRESERVED_FILES=12")
    print("REVIEWED_INTENTIONAL_DIVERGENCES=3")
    print("GIT_ONLY_IS_NOT_LIVE_CONTAINER_PROOF=TRUE")


def validate_container_inventory(inventory: Path) -> None:
    data = json.loads(inventory.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("root") != "/app":
        raise ValueError("Expected read-only /app Python-source inventory")
    live_files = data.get("files")
    if not isinstance(live_files, dict) or not live_files:
        raise ValueError("No running-container source paths were collected")

    candidate_paths = {
        p for p in git("ls-files", "--", "apps/backend").splitlines()
        if p.endswith(".py")
    }
    problems: list[str] = []
    exact: list[str] = []
    reviewed: list[str] = []
    extras: list[str] = []
    for path, live_sha in sorted(live_files.items()):
        if (
            not isinstance(path, str)
            or not path.startswith("apps/backend/")
            or ".." in Path(path).parts
            or not HEX_256.fullmatch(str(live_sha))
        ):
            raise ValueError("Unsafe or invalid file entry in live manifest")
        if path not in candidate_paths:
            extras.append(path)
            continue
        candidate_sha = hashlib.sha256((REPOSITORY / path).read_bytes()).hexdigest()
        if candidate_sha == live_sha:
            exact.append(path)
            continue

        # This is an explicit labelled-legacy source comparison exception, not
        # a blanket allowance for unknown overlays or other source regressions.
        reviewed_paths = {
            "apps/backend/app/runtime/roleplay.py",
            "apps/backend/scripts/verify_yki_ai_evaluation.py",
        }
        if (
            path in reviewed_paths
            and path in REVIEWED_DIFFERENT_BLOBS
            and live_sha == hash_git_file(HISTORIC_LABEL, path)
            and git("rev-parse", f"HEAD:{path}") == REVIEWED_DIFFERENT_BLOBS[path][1]
        ):
            reviewed.append(path)
            continue
        problems.append(path)

    for path in extras:
        print(f"UNEXPLAINED_LIVE_PYTHON_SOURCE={path}")
    for path in problems:
        print(f"UNRECONCILED_LIVE_PYTHON_DIFFERENCE={path}")
    print(f"LIVE_PYTHON_FILES_CHECKED={len(live_files)}")
    print(f"LIVE_PYTHON_EXACT_SOURCE_MATCHES={len(exact)}")
    print(f"LIVE_PYTHON_REVIEWED_LEGACY_DIFFERENCES={len(reviewed)}")
    print(f"UNEXPLAINED_LIVE_PYTHON_COUNT={len(extras)}")
    print(f"UNRECONCILED_LIVE_PYTHON_COUNT={len(problems)}")
    if extras or problems:
        raise AssertionError("Running Python source still has unclassified differences")
    print("LIVE_PYTHON_CAPABILITY_PRESERVATION=PASS")
    print("BIDIRECTIONAL_CANDIDATE_IMAGE_IDENTITY=NOT_TESTED")
    print("DEPLOYMENT_AUTHORIZATION=NOT_GRANTED")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--live-manifest",
        type=Path,
        help="JSON path/sha256 read-only inventory from the running Docker container",
    )
    args = parser.parse_args()
    validate_git_preservation()
    if args.live_manifest:
        validate_container_inventory(args.live_manifest)
    else:
        print("LIVE_PYTHON_CAPABILITY_PRESERVATION=NOT_TESTED")
    print("PRODUCTION_ANCESTRY_GATE=NOT_PROVEN")


if __name__ == "__main__":
    main()
