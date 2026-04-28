"""Finnish persona registry for roleplay sessions.

Loads the shared registry from ``packages/core/speaking/finnishPersonas.json`` so
the Python backend and the TypeScript client see identical data. If the shared
JSON cannot be located (e.g. running outside a monorepo layout), falls back to
an embedded minimal set so the app continues to function.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


# --- Data classes ---------------------------------------------------------

@dataclass(frozen=True)
class PersonaPick:
    id: str
    display_name: str
    short_name: str
    first_name: str
    last_name: str
    gender: str
    title: str | None
    voice_profile: str


# --- Registry loading -----------------------------------------------------

def _candidate_paths() -> Iterable[Path]:
    here = Path(__file__).resolve()
    # Walk up looking for a monorepo root that contains packages/core/speaking
    for parent in [here.parent, *here.parents]:
        candidate = parent / "packages" / "core" / "speaking" / "finnishPersonas.json"
        if candidate.exists():
            yield candidate
    # Also try common env-derived roots
    try:
        import os
        repo_root = os.environ.get("FLOENTLY_REPO_ROOT")
        if repo_root:
            yield Path(repo_root) / "packages" / "core" / "speaking" / "finnishPersonas.json"
    except Exception:
        pass


_FALLBACK_REGISTRY: list[dict[str, Any]] = [
    # Minimal fallback so the app works even if the JSON isn't found at runtime.
    {"id": "fi-f-001", "firstName": "Liisa", "lastName": "Korhonen", "gender": "female", "title": None, "scenarios": [], "professions": ["general"], "voiceProfile": "yki_standard_female", "ageBand": "senior"},
    {"id": "fi-m-001", "firstName": "Matti", "lastName": "Virtanen", "gender": "male", "title": None, "scenarios": [], "professions": ["general"], "voiceProfile": "yki_standard_male", "ageBand": "adult"},
]


def _load_registry() -> list[dict[str, Any]]:
    for path in _candidate_paths():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            personas = payload.get("personas") or []
            if personas:
                return personas
        except Exception:
            continue
    return list(_FALLBACK_REGISTRY)


_PERSONAS: list[dict[str, Any]] = _load_registry()


# --- Resolver -------------------------------------------------------------

def _hash_seed(seed: str) -> int:
    """Stable deterministic hash for seed-based picking."""
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], byteorder="big", signed=False)


def _build_display(persona: dict[str, Any]) -> PersonaPick:
    title = persona.get("title")
    first = persona["firstName"]
    last = persona["lastName"]
    display = f"{title} {first} {last}" if title else f"{first} {last}"
    short = f"{title} {last}" if title else first
    return PersonaPick(
        id=persona["id"],
        display_name=display,
        short_name=short,
        first_name=first,
        last_name=last,
        gender=persona["gender"],
        title=title,
        voice_profile=persona.get("voiceProfile", "yki_standard_female"),
    )


def pick_persona(
    *,
    scenario_id: str | None = None,
    profession: str | None = None,
    prefer_gender: str | None = None,
    seed: str | None = None,
) -> PersonaPick:
    """Pick a persona for a scenario + profession combination.

    Matching precedence: exact scenario match → profession match → general fallback.
    When ``seed`` is provided (recommended: ``f"{user_id}:{session_id}"``) the choice
    is deterministic within that seed, so mid-session reloads don't re-roll the name.
    """
    scenario_id_clean = (scenario_id or "").strip()
    profession_clean = (profession or "").strip().lower()

    scenario_matches = (
        [p for p in _PERSONAS if scenario_id_clean in (p.get("scenarios") or [])]
        if scenario_id_clean else []
    )
    profession_matches = (
        [p for p in _PERSONAS if profession_clean in (p.get("professions") or [])]
        if profession_clean else []
    )
    pool = scenario_matches or profession_matches
    if not pool:
        pool = [p for p in _PERSONAS if "general" in (p.get("professions") or [])]
    if not pool:
        pool = list(_PERSONAS)

    if prefer_gender:
        gender_filtered = [p for p in pool if p.get("gender") == prefer_gender]
        if gender_filtered:
            pool = gender_filtered

    seed_value = seed or f"{scenario_id_clean}:{profession_clean}"
    index = _hash_seed(seed_value) % len(pool)
    return _build_display(pool[index])


def list_personas() -> list[dict[str, Any]]:
    return list(_PERSONAS)


def get_persona_by_id(persona_id: str) -> PersonaPick | None:
    for p in _PERSONAS:
        if p.get("id") == persona_id:
            return _build_display(p)
    return None
