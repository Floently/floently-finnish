"""Canonical path resolver for the backend.

All other modules should import path constants from here instead of computing
their own Path(__file__).resolve().parents[N] chains, which break whenever the
directory depth changes.
"""
from __future__ import annotations

from pathlib import Path


def _find_backend_root() -> Path:
    """Return the backend root: the directory that contains main.py and app/."""
    here = Path(__file__).resolve()
    for candidate in here.parents:
        if (candidate / "main.py").exists() and (candidate / "app").is_dir():
            return candidate
    return here.parents[2]


def _find_repo_root(backend_root: Path) -> Path:
    """Return the monorepo root, or backend_root if running inside Docker."""
    for candidate in [backend_root, *backend_root.parents]:
        if (candidate / "pnpm-workspace.yaml").exists():
            return candidate
        if (candidate / "package.json").exists() and (candidate / "apps").is_dir():
            return candidate
    return backend_root


BACKEND_ROOT: Path = _find_backend_root()
REPO_ROOT: Path = _find_repo_root(BACKEND_ROOT)

MATERIALS_DIR: Path = BACKEND_ROOT / "materials"
YKI_MATERIALS_DIR: Path = MATERIALS_DIR / "yki"

CARD_BANK_DIR: Path = BACKEND_ROOT / "card_bank"
CARD_BANK_READY_DIR: Path = CARD_BANK_DIR / "ready_bank"
CARD_BANK_CANONICAL_DIR: Path = CARD_BANK_DIR / "canonical_bank"
CARD_BANK_PUBLISHED_DIR: Path = CARD_BANK_CANONICAL_DIR / "published"
CARD_BANK_REPORTS_DIR: Path = CARD_BANK_CANONICAL_DIR / "reports"
CARD_BANK_INDEX_DIR: Path = CARD_BANK_CANONICAL_DIR / "index"

RUNTIME_DIR: Path = BACKEND_ROOT / "runtime"
