from __future__ import annotations

import json
from pathlib import Path

from app.cards.ingestion.reports.models import IngestionRunReport


def write_ingestion_outputs(output_root: Path, *, accepted_cards: list[dict], report: IngestionRunReport) -> dict[str, Path]:
    accepted_dir = output_root / "accepted"
    rejected_dir = output_root / "rejected"
    reports_dir = output_root / "reports"

    accepted_dir.mkdir(parents=True, exist_ok=True)
    rejected_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    accepted_path = accepted_dir / "accepted_cards.json"
    rejected_path = rejected_dir / "rejected_cards.json"
    report_path = reports_dir / "validation_report.json"

    _write_json(accepted_path, accepted_cards)
    _write_json(rejected_path, [item.model_dump(mode="json") for item in report.rejected_cards])
    _write_json(report_path, report.model_dump(mode="json"))

    return {
        "accepted_cards": accepted_path,
        "rejected_cards": rejected_path,
        "validation_report": report_path,
    }


def _write_json(path: Path, payload: object) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
