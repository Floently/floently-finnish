"""Fail-closed source check for the Build 36 backend Docker build boundary.

This checks tracked Docker build configuration; it does not substitute for
inspecting the built image filesystem and OCI revision label. No Docker daemon
or production server is accessed.
"""
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]


def main() -> None:
    ignore = (ROOT / ".dockerignore").read_text(encoding="utf-8").splitlines()
    rules = [line.strip() for line in ignore if line.strip() and not line.lstrip().startswith("#")]
    dockerfile = (ROOT / "apps/backend/Dockerfile").read_text(encoding="utf-8")
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")

    required_ignores = (
        ".git/",
        "apps/backend/.env",
        "apps/backend/.env.*",
        "apps/backend/persistent/",
        "apps/backend/runtime/",
        "ops/keys/",
    )
    for required in required_ignores:
        if required not in rules:
            raise AssertionError(f"Docker context must exclude {required}")

    env_pattern = rules.index("apps/backend/.env.*")
    if "!apps/backend/.env.example" not in rules[env_pattern + 1:]:
        raise AssertionError("Safe .env.example must remain available after exclusion")
    for forbidden_reinclusion in (
        "!apps/backend/.env",
        "!apps/backend/persistent/",
        "!apps/backend/runtime/",
        "!ops/keys/",
    ):
        if forbidden_reinclusion in rules:
            raise AssertionError(f"Unsafe Docker ignore negation: {forbidden_reinclusion}")

    required_dockerfile = (
        "ARG RELEASE_SOURCE_SHA=UNVERIFIED_LOCAL_BUILD",
        'LABEL org.opencontainers.image.revision="${RELEASE_SOURCE_SHA}"',
        "COPY apps/backend/requirements.txt ./requirements.txt",
        "COPY apps/backend/ .",
    )
    for required in required_dockerfile:
        if required not in dockerfile:
            raise AssertionError(f"Docker release build contract missing: {required}")

    if re.search(r"(?m)^\s*(?:COPY|ADD)\s+(?:\.|\./|/|apps/\s)", dockerfile):
        raise AssertionError("Backend image must not copy repository root or unrelated apps")

    required_compose = (
        "apps/backend/.env",
        "./apps/backend/persistent/puhis.db:/app/puhis.db",
        "./apps/backend/persistent/runtime:/app/runtime",
        "${GOOGLE_KEYS_DIR:-./ops/keys}:/keys:ro",
    )
    for required in required_compose:
        if required not in compose:
            raise AssertionError(f"Runtime data/secret mount contract changed: {required}")

    print("BACKEND_DOCKER_SECRET_EXCLUSION_SOURCE=PASS")
    print("BACKEND_DOCKER_PERSISTENCE_EXCLUSION_SOURCE=PASS")
    print("BACKEND_DOCKER_REVISION_LABEL_SOURCE=PASS")
    print("CANDIDATE_IMAGE_BUILT=NO")
    print("BIDIRECTIONAL_CANDIDATE_IMAGE_IDENTITY=NOT_TESTED")
    print("PRODUCTION_DEPLOYMENT_AUTHORIZED=NO")


if __name__ == "__main__":
    main()
