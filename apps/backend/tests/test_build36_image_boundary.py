"""Offline regression tests for the candidate Docker build boundary.

No Docker daemon, production host, credential values, or live state is used.
"""
from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from scripts import verify_build36_image_boundary as boundary


@pytest.fixture()
def source_tree(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    root = boundary.ROOT
    (tmp_path / "apps/backend").mkdir(parents=True)
    for path in (".dockerignore", "docker-compose.yml", "apps/backend/Dockerfile"):
        shutil.copyfile(root / path, tmp_path / path)
    monkeypatch.setattr(boundary, "ROOT", tmp_path)
    return tmp_path


def test_current_candidate_source_boundary_passes(
    source_tree: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    boundary.main()
    output = capsys.readouterr().out
    assert "BACKEND_DOCKER_SECRET_EXCLUSION_SOURCE=PASS" in output
    assert "BACKEND_COMPOSE_SOURCE_SHA_PLUMBING=PASS" in output
    assert "CANDIDATE_IMAGE_BUILT=NO" in output
    assert "PRODUCTION_DEPLOYMENT_AUTHORIZED=NO" in output


@pytest.mark.parametrize(
    "excluded_path",
    [
        "apps/backend/.env",
        "apps/backend/.env.*",
        "apps/backend/persistent/",
        "apps/backend/runtime/",
        "ops/keys/",
    ],
)
def test_missing_secret_or_state_exclusion_fails(
    source_tree: Path, excluded_path: str,
) -> None:
    path = source_tree / ".dockerignore"
    path.write_text(
        path.read_text(encoding="utf-8").replace(excluded_path + "\n", "", 1),
        encoding="utf-8",
    )
    with pytest.raises(AssertionError, match="Docker context must exclude"):
        boundary.main()


def test_secret_reinclusion_fails(source_tree: Path) -> None:
    path = source_tree / ".dockerignore"
    with path.open("a", encoding="utf-8") as output:
        output.write("\n!apps/backend/.env\n")
    with pytest.raises(AssertionError, match="Unsafe Docker ignore negation"):
        boundary.main()


def test_broad_source_copy_fails(source_tree: Path) -> None:
    path = source_tree / "apps/backend/Dockerfile"
    with path.open("a", encoding="utf-8") as output:
        output.write("\nCOPY . /app\n")
    with pytest.raises(AssertionError, match="must not copy repository root"):
        boundary.main()


def test_missing_revision_label_fails(source_tree: Path) -> None:
    path = source_tree / "apps/backend/Dockerfile"
    path.write_text(
        path.read_text(encoding="utf-8").replace(
            'LABEL org.opencontainers.image.revision="${RELEASE_SOURCE_SHA}"', "",
        ),
        encoding="utf-8",
    )
    with pytest.raises(AssertionError, match="Docker release build contract missing"):
        boundary.main()


def test_missing_compose_revision_argument_fails(source_tree: Path) -> None:
    path = source_tree / "docker-compose.yml"
    path.write_text(
        path.read_text(encoding="utf-8").replace(
            "RELEASE_SOURCE_SHA: ${RELEASE_SOURCE_SHA:-UNVERIFIED_LOCAL_BUILD}", "",
        ),
        encoding="utf-8",
    )
    with pytest.raises(AssertionError, match="Runtime mount/build contract changed"):
        boundary.main()


def test_missing_persistent_volume_fails(source_tree: Path) -> None:
    path = source_tree / "docker-compose.yml"
    path.write_text(
        path.read_text(encoding="utf-8").replace(
            "./apps/backend/persistent/runtime:/app/runtime", "",
        ),
        encoding="utf-8",
    )
    with pytest.raises(AssertionError, match="Runtime mount/build contract changed"):
        boundary.main()
