"""
YKI Content Bank — Admin API endpoints.

All routes are mounted under /admin/yki/ in main.py.

These endpoints expose read and write access to the content bank certification
state. They must not be reachable without admin-level access (enforce at the
reverse-proxy / network boundary, consistent with the existing /admin/* pattern).

Endpoints
─────────
GET  /admin/yki/bank-status                  Task counts per certification state
POST /admin/yki/certify-batch                Trigger batch certification run
GET  /admin/yki/task/{task_id}/certification  Fetch certification report sidecar
POST /admin/yki/task/{task_id}/quarantine    Manually quarantine a task
POST /admin/yki/task/{task_id}/recertify     Reset task to draft_generated
GET  /admin/yki/reliability/latest           Most recent reliability report
POST /admin/yki/reliability/run              Compute reliability report for date range
"""
from __future__ import annotations

import asyncio
import json
import os
import tempfile
from collections import defaultdict
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.models import User
from app.core.auth_dependencies import get_current_user
from app.services.yki_certification_health import (
    YKICertificationHealthError,
    get_drift_statistics,
    get_quarantine_breakdown_by_reason,
    get_state_counts,
    get_version_distribution,
)
from app.services.yki_scoring_calibration import (
    YKIScoringCalibrationError,
    load_active_calibration,
    save_calibration,
    set_active_calibration,
)


def require_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Require admin authentication for /admin/yki endpoints.

    Admin users are controlled by YKI_ADMIN_EMAILS env var (comma-separated).
    """
    raw_allowlist = os.getenv("YKI_ADMIN_EMAILS", "")
    allowlist = {item.strip().lower() for item in raw_allowlist.split(",") if item.strip()}
    if not allowlist:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin allowlist missing (YKI_ADMIN_EMAILS).",
        )
    user_email = str(getattr(current_user, "email", "") or "").strip().lower()
    if user_email not in allowlist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


router = APIRouter(dependencies=[Depends(require_admin_user)])

# ── Bank root discovery ───────────────────────────────────────────────────────
# Mirrors the path order in scripts/migrate_manifest_state.py and
# scripts/certify_yki_bank.py.

from app.services.yki_materials import YKI_CERTIFIED_MANIFEST_PATH

_DEFAULT_MANIFESTS: dict[str, list[Path]] = {
    # The cleanup passes collapsed legacy bank roots into one canonical
    # workspace-certified bank under apps/backend/materials/yki/certified_bank.
    "v1": [YKI_CERTIFIED_MANIFEST_PATH],
    "v2": [YKI_CERTIFIED_MANIFEST_PATH],
    "certified": [YKI_CERTIFIED_MANIFEST_PATH],
}

_DEFAULT_BATCH_LIMIT = 500  # max entries per certify-batch call


def _find_manifest(bank: str) -> Path:
    candidates = _DEFAULT_MANIFESTS.get(bank, [])
    for p in candidates:
        if p.exists():
            return p
    raise HTTPException(status_code=404, detail=f"No manifest found for bank={bank}")


def _get_entries(payload: Any) -> list[dict[str, Any]]:
    """Return manifest entry dicts as shared references into payload."""
    if isinstance(payload, list):
        return [e for e in payload if isinstance(e, dict)]
    if isinstance(payload, dict):
        tasks = payload.get("tasks")
        if isinstance(tasks, list):
            return [e for e in tasks if isinstance(e, dict)]
        if isinstance(tasks, dict):
            entries: list[dict[str, Any]] = []
            for k, v in tasks.items():
                if isinstance(v, dict):
                    v.setdefault("id", k)
                    entries.append(v)
            return entries
    return []


def _load_manifest(bank: str) -> tuple[Path, Any, list[dict[str, Any]]]:
    """Load manifest, return (manifest_path, payload, entries)."""
    manifest_path = _find_manifest(bank)
    try:
        raw = manifest_path.read_text(encoding="utf-8")
        payload = json.loads(raw)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read manifest: {exc}") from exc
    return manifest_path, payload, _get_entries(payload)


def _atomic_write_json(path: Path, payload: Any) -> None:
    temp_fd, temp_path = tempfile.mkstemp(
        prefix=f"{path.name}.", suffix=".tmp", dir=str(path.parent)
    )
    try:
        with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp_path, path)
    except Exception:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise


def _find_entry(entries: list[dict[str, Any]], task_id: str) -> dict[str, Any] | None:
    for e in entries:
        if str(e.get("id") or "") == task_id:
            return e
    return None


# ── GET /admin/yki/bank-status ───────────────────────────────────────────────

@router.get("/bank-status")
async def bank_status(bank: str = "v2"):
    """
    Return task counts per certification state for the requested bank.

    Flags needs_recertification when any certified task has certification_version
    less than CURRENT_CERT_VERSION.

    Query params:
        bank: v1 | v2 (default: v2)
    """
    from app.services.yki_certification_policy import CURRENT_CERT_VERSION, compare_semver

    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}. Use v1 or v2.")

    _, _, entries = _load_manifest(bank)

    counts: dict[str, int] = defaultdict(int)
    needs_recertification_count = 0
    for e in entries:
        state = str(e.get("state") or "draft_generated")
        counts[state] += 1
        if state == "certified":
            entry_ver = str(e.get("certification_version") or "").strip()
            if entry_ver:
                try:
                    if compare_semver(entry_ver, CURRENT_CERT_VERSION) < 0:
                        needs_recertification_count += 1
                except ValueError:
                    needs_recertification_count += 1

    certified = counts.get("certified", 0)
    total = len(entries)

    result: dict[str, Any] = {
        "bank": bank,
        "total": total,
        "by_state": dict(counts),
        "certified_ratio": round(certified / total, 4) if total else 0.0,
    }
    if needs_recertification_count > 0:
        result["needs_recertification"] = True
        result["needs_recertification_count"] = needs_recertification_count
        result["current_cert_version"] = CURRENT_CERT_VERSION
    return result


# ── POST /admin/yki/certify-batch ────────────────────────────────────────────

@router.post("/certify-batch")
async def certify_batch(payload: dict):
    """
    Trigger a batch certification run on the content bank.

    Body (JSON):
        bank_version   str  "v1" | "v2"  (default: "v2")
        batch_size     int  Max entries to process (default: 100, max: 500)
        state_filter   str  Filter by state (default: "draft_generated", "all" = no filter)
        ai_fix_enabled bool Enable Layer 2 AI fixer (default: false)
        dry_run        bool Compute without writing (default: false)
    """
    from app.services.yki_certification_pipeline import certify_task, CertificationResult

    bank = str(payload.get("bank_version") or payload.get("bank") or "v2")
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}")

    batch_size = int(payload.get("batch_size") or 100)
    batch_size = max(1, min(batch_size, _DEFAULT_BATCH_LIMIT))
    state_filter = str(payload.get("state_filter") or "draft_generated").strip().lower()
    ai_fix_enabled = bool(payload.get("ai_fix_enabled", False))
    dry_run = bool(payload.get("dry_run", False))

    manifest_path, manifest_payload, entries = _load_manifest(bank)
    bank_root = manifest_path.parent

    if state_filter == "all":
        target = entries
    else:
        target = [e for e in entries if (e.get("state") or "draft_generated") == state_filter]

    work = target[:batch_size]

    # Seed known_hashes from already-certified entries
    known_hashes: set[str] = {
        e["user_visible_hash"]
        for e in entries
        if e.get("state") == "certified" and e.get("user_visible_hash")
    }

    n_certified = 0
    n_failed_precheck = 0
    n_failed_postcheck = 0
    n_quarantined = 0
    n_errors = 0

    for entry in work:
        task_id = str(entry.get("id") or "")
        try:
            result: CertificationResult = await certify_task(
                task_id=task_id,
                manifest_entry=entry,
                bank_root=bank_root,
                known_hashes=known_hashes,
                ai_fix_enabled=ai_fix_enabled,
                dry_run=dry_run,
            )
        except Exception:
            n_errors += 1
            continue

        if not dry_run:
            entry["state"] = result.final_state
            entry["certification_state"] = result.final_state
            entry["user_visible_hash"] = result.user_visible_hash
            entry["content_integrity_hash"] = result.content_integrity_hash
            entry["certification_version"] = (
                result.certification_version if result.final_state == "certified" else None
            )
            entry["certified_at"] = result.certified_at

        fs = result.final_state
        if fs == "certified":
            n_certified += 1
            if result.user_visible_hash:
                known_hashes.add(result.user_visible_hash)
        elif fs == "failed_precheck":
            n_failed_precheck += 1
        elif fs == "failed_postcheck":
            n_failed_postcheck += 1
        elif fs == "quarantined":
            n_quarantined += 1
        else:
            n_errors += 1

    if not dry_run and work:
        try:
            _atomic_write_json(manifest_path, manifest_payload)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Manifest write failed: {exc}") from exc

    return {
        "bank": bank,
        "processed": len(work),
        "dry_run": dry_run,
        "ai_fix_enabled": ai_fix_enabled,
        "results": {
            "certified": n_certified,
            "failed_precheck": n_failed_precheck,
            "failed_postcheck": n_failed_postcheck,
            "quarantined": n_quarantined,
            "errors": n_errors,
        },
    }


# ── GET /admin/yki/task/{task_id}/certification ──────────────────────────────

@router.get("/task/{task_id}/certification")
async def get_task_certification(task_id: str, bank: str = "v2"):
    """
    Fetch the certification report sidecar for a task.

    Query params:
        bank: v1 | v2 (default: v2)
    """
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}")

    manifest_path = _find_manifest(bank)
    bank_root = manifest_path.parent
    report_path = bank_root / "certification_reports" / f"{task_id}.json"

    if not report_path.exists():
        # Also return manifest entry state even if no sidecar exists
        _, _, entries = _load_manifest(bank)
        entry = _find_entry(entries, task_id)
        if entry is None:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found in manifest")
        return {
            "task_id": task_id,
            "bank": bank,
            "report": None,
            "manifest_state": entry.get("state") or "draft_generated",
            "user_visible_hash": entry.get("user_visible_hash"),
        }

    try:
        report = json.loads(report_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read report: {exc}") from exc

    return {"task_id": task_id, "bank": bank, "report": report}


# ── POST /admin/yki/task/{task_id}/quarantine ────────────────────────────────

@router.post("/task/{task_id}/quarantine")
async def quarantine_task(task_id: str, payload: dict, bank: str = "v2"):
    """
    Manually quarantine a task (set state = quarantined).

    Body (JSON):
        reason   str  Human-readable quarantine reason (stored in manifest)
        bank     str  "v1" | "v2" (can also be passed as query param, default: "v2")
    """
    bank = str(payload.get("bank") or bank)
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}")

    reason = str(payload.get("reason") or "manual_quarantine")

    manifest_path, manifest_payload, entries = _load_manifest(bank)
    entry = _find_entry(entries, task_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found in manifest")

    prev_state = entry.get("state") or "draft_generated"
    entry["state"] = "quarantined"
    entry["certification_state"] = "quarantined"
    entry["quarantine_reason"] = reason

    try:
        _atomic_write_json(manifest_path, manifest_payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Manifest write failed: {exc}") from exc

    return {
        "task_id": task_id,
        "bank": bank,
        "previous_state": prev_state,
        "new_state": "quarantined",
        "reason": reason,
    }


# ── POST /admin/yki/task/{task_id}/recertify ─────────────────────────────────

@router.post("/task/{task_id}/recertify")
async def recertify_task(task_id: str, payload: dict | None = None, bank: str = "v2"):
    """
    Reset a task back to draft_generated so it will be picked up on the next
    certification batch run.

    Clears: state, certification_state, certification_version, certified_at,
            user_visible_hash, quarantine_reason.

    Body (JSON, optional):
        bank  str  "v1" | "v2" (can also be passed as query param, default: "v2")
    """
    if payload:
        bank = str(payload.get("bank") or bank)
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}")

    manifest_path, manifest_payload, entries = _load_manifest(bank)
    entry = _find_entry(entries, task_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found in manifest")

    prev_state = entry.get("state") or "draft_generated"

    for key in ("certification_state", "certification_version", "certified_at",
                "user_visible_hash", "quarantine_reason"):
        entry.pop(key, None)
    entry["state"] = "draft_generated"

    try:
        _atomic_write_json(manifest_path, manifest_payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Manifest write failed: {exc}") from exc

    return {
        "task_id": task_id,
        "bank": bank,
        "previous_state": prev_state,
        "new_state": "draft_generated",
    }


# ── GET /admin/yki/certified-summary ─────────────────────────────────────────

@router.get("/certified-summary")
async def certified_summary(bank: str = "v2"):
    """
    Return certified-task counts grouped by certification_version.
    """
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}. Use v1 or v2.")
    try:
        version_stats = get_version_distribution(bank=bank)
        state_stats = get_state_counts(bank=bank)
    except YKICertificationHealthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {
        "bank": bank,
        "certified_total": int(state_stats.get("by_state", {}).get("certified", 0)),
        "by_certification_version": version_stats.get("certified_tasks", {}),
    }


# ── GET /admin/yki/quarantine-summary ────────────────────────────────────────

@router.get("/quarantine-summary")
async def quarantine_summary(bank: str = "v2"):
    """
    Return quarantined tasks and grouped quarantine reasons.
    """
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}. Use v1 or v2.")
    try:
        return get_quarantine_breakdown_by_reason(bank=bank)
    except YKICertificationHealthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── GET /admin/yki/drift-flags ───────────────────────────────────────────────

@router.get("/drift-flags")
async def drift_flags(bank: str = "v2"):
    """
    Return CEFR drift quarantines and drift reason counts.
    """
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}. Use v1 or v2.")
    try:
        return get_drift_statistics(bank=bank)
    except YKICertificationHealthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── GET /admin/yki/version-distribution ──────────────────────────────────────

@router.get("/version-distribution")
async def version_distribution(bank: str = "v2"):
    """
    Return certification_version histogram for all tasks and certified subset.
    """
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank}. Use v1 or v2.")
    try:
        return get_version_distribution(bank=bank)
    except YKICertificationHealthError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── GET /admin/yki/reliability/latest ────────────────────────────────────────

_REPORTS_DIR = YKI_CERTIFIED_MANIFEST_PATH.parent / "metadata"


@router.get("/reliability/latest")
async def reliability_latest():
    """
    Return the most recent YKI reliability report (if any).
    """
    if not _REPORTS_DIR.exists():
        return {"ok": False, "report": None, "path": None}
    pattern = "yki_reliability_*.json"
    reports = sorted(_REPORTS_DIR.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    if not reports:
        return {"ok": False, "report": None, "path": None}
    latest = reports[0]
    try:
        report = json.loads(latest.read_text(encoding="utf-8"))
        return {"ok": True, "report": report, "path": str(latest)}
    except (json.JSONDecodeError, OSError):
        return {"ok": False, "report": None, "path": str(latest)}


# ── POST /admin/yki/reliability/run ──────────────────────────────────────────

@router.post("/reliability/run")
async def reliability_run(payload: dict[str, Any] | None = None):
    del payload
    raise HTTPException(
        status_code=410,
        detail="Application-owned YKI reliability audit was removed. Run reliability analysis against kielitaikka-yki-engine instead.",
    )


# ── POST /admin/yki/scoring/upload-calibration ───────────────────────────────

@router.post("/scoring/upload-calibration")
async def upload_scoring_calibration(payload: dict[str, Any]):
    """
    Upload a scoring calibration JSON artifact.

    Body:
      - calibration payload itself, or
      - {"calibration": {...}}
    """
    calibration = payload.get("calibration") if isinstance(payload.get("calibration"), dict) else payload
    try:
        saved = save_calibration(calibration)
        return {"ok": True, "saved": saved}
    except YKIScoringCalibrationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ── GET /admin/yki/scoring/current-calibration ───────────────────────────────

@router.get("/scoring/current-calibration")
async def current_scoring_calibration():
    """
    Return active calibration pointer and active calibration payload.
    """
    try:
        return {"ok": True, **load_active_calibration()}
    except YKIScoringCalibrationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# ── POST /admin/yki/scoring/set-active-calibration ───────────────────────────

@router.post("/scoring/set-active-calibration")
async def set_active_scoring_calibration(payload: dict[str, Any]):
    """
    Activate a previously uploaded calibration version.

    Body:
      - calibration_version: str
    """
    version = str(payload.get("calibration_version") or "").strip()
    if not version:
        raise HTTPException(status_code=400, detail="Missing calibration_version")
    try:
        active = set_active_calibration(version)
        return {"ok": True, "active": active}
    except YKIScoringCalibrationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ── GET /admin/yki/integrity/latest ──────────────────────────────────────────

@router.get("/integrity/latest")
async def integrity_latest(bank: str = "v1"):
    """
    Return the most recent integrity snapshot for the given bank.

    Query params:
        bank: v1 | v2 (default: v1)
    """
    from app.services.yki_integrity_monitor import (  # noqa: PLC0415
        SNAPSHOTS_DIR,
        load_latest_snapshot,
    )

    snapshot = load_latest_snapshot()
    if snapshot is None:
        return {
            "ok": False,
            "snapshot": None,
            "snapshots_dir": str(SNAPSHOTS_DIR),
            "message": "No snapshot found. Run POST /admin/yki/integrity/run first.",
        }
    return {"ok": True, "snapshot": snapshot, "snapshots_dir": str(SNAPSHOTS_DIR)}


# ── POST /admin/yki/integrity/run ─────────────────────────────────────────────

@router.post("/integrity/run")
async def integrity_run(payload: dict[str, Any] | None = None):
    """
    Compute a fresh integrity snapshot, compare it to the previous one,
    save it to disk, and return the snapshot with any alerts.

    Body (JSON, all optional):
        bank: str  "v1" | "v2" (default: "v1")
    """
    from app.services.yki_integrity_monitor import (  # noqa: PLC0415
        compare_snapshots,
        compute_integrity_snapshot,
        load_latest_snapshot,
        save_snapshot,
    )

    payload = payload or {}
    bank = str(payload.get("bank") or "v1").strip()
    if bank not in _DEFAULT_MANIFESTS:
        raise HTTPException(status_code=400, detail=f"Unsupported bank={bank!r}. Use v1 or v2.")

    # Load previous snapshot before computing new one
    prev_snapshot = load_latest_snapshot()

    try:
        curr_snapshot = compute_integrity_snapshot(bank=bank)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=f"Snapshot computation failed: {exc}") from exc

    alerts = compare_snapshots(prev_snapshot, curr_snapshot) if prev_snapshot else []

    try:
        snap_path = save_snapshot(curr_snapshot)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Snapshot save failed: {exc}") from exc

    return {
        "ok": True,
        "snapshot": curr_snapshot,
        "snapshot_path": str(snap_path),
        "alerts": alerts,
        "alert_count": len(alerts),
        "critical_count": sum(1 for a in alerts if a.get("severity") == "critical"),
        "prev_snapshot_at": (prev_snapshot or {}).get("snapshot_at"),
    }


# ── GET /admin/yki/integrity/alerts ──────────────────────────────────────────

@router.get("/integrity/alerts")
async def integrity_alerts():
    """
    Return alerts by comparing the two most recent integrity snapshots.

    Returns an empty alert list if fewer than two snapshots exist.
    """
    from app.services.yki_integrity_monitor import (  # noqa: PLC0415
        compare_snapshots,
        load_latest_snapshot,
        load_previous_snapshot,
    )

    curr_snapshot = load_latest_snapshot()
    if curr_snapshot is None:
        return {
            "ok": False,
            "alerts": [],
            "message": "No snapshots found. Run POST /admin/yki/integrity/run first.",
        }

    prev_snapshot = load_previous_snapshot()
    if prev_snapshot is None:
        return {
            "ok": True,
            "alerts": [],
            "snapshot_at": curr_snapshot.get("snapshot_at"),
            "message": "Only one snapshot exists — no comparison available yet.",
        }

    alerts = compare_snapshots(prev_snapshot, curr_snapshot)
    return {
        "ok": True,
        "alerts": alerts,
        "alert_count": len(alerts),
        "critical_count": sum(1 for a in alerts if a.get("severity") == "critical"),
        "snapshot_at": curr_snapshot.get("snapshot_at"),
        "prev_snapshot_at": prev_snapshot.get("snapshot_at"),
    }
