from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from pydantic import ValidationError

from app.cards.ingestion.audit import write_ingestion_outputs
from app.cards.ingestion.builders import build_card_payload
from app.cards.ingestion.errors import BuilderError, IngestionError, NormalizationError, RawInputError
from app.cards.ingestion.normalizers import IngestionSourceProfile, load_raw_items, normalize_raw_item
from app.cards.ingestion.reports.models import IngestionAuditRecord, IngestionRunReport, RejectedCardRecord
from app.cards.schemas import validate_card_payload


@dataclass(frozen=True)
class IngestionRunResult:
    accepted_cards: list[dict]
    rejected_cards: list[RejectedCardRecord]
    report: IngestionRunReport
    output_paths: dict[str, Path]


class CardIngestionPipeline:
    def __init__(self, *, output_root: Path | None = None):
        self.output_root = output_root or (Path(__file__).resolve().parents[1] / "output")

    def ingest_file(self, source: str | Path, *, profile: IngestionSourceProfile, run_id: str) -> IngestionRunResult:
        raw_items = load_raw_items(source)
        source_name = str(source)
        return self.ingest_items(raw_items, profile=profile, run_id=run_id, source_name=source_name)

    def ingest_items(
        self,
        raw_items: Iterable[dict],
        *,
        profile: IngestionSourceProfile,
        run_id: str,
        source_name: str,
    ) -> IngestionRunResult:
        accepted_cards: list[dict] = []
        accepted_audit: list[IngestionAuditRecord] = []
        rejected_cards: list[RejectedCardRecord] = []

        for item_index, raw_item in enumerate(raw_items):
            normalized = None
            try:
                normalized = normalize_raw_item(dict(raw_item), item_index=item_index, profile=profile)
                candidate_payload = build_card_payload(normalized)
                validated_card = validate_card_payload(candidate_payload)
                accepted_payload = validated_card.model_dump(mode="json")
                accepted_cards.append(accepted_payload)
                accepted_audit.append(
                    IngestionAuditRecord(
                        item_index=item_index,
                        card_id=accepted_payload["id"],
                        content_type=accepted_payload["content_type"],
                    )
                )
            except (RawInputError, NormalizationError, BuilderError, ValidationError, IngestionError) as exc:
                rejected_cards.append(
                    RejectedCardRecord(
                        item_index=item_index,
                        original_input=dict(raw_item),
                        normalized_form=normalized.model_dump(mode="json") if normalized is not None else None,
                        error_messages=_error_messages(exc),
                    )
                )

        report = IngestionRunReport(
            run_id=run_id,
            generated_at=datetime.now(timezone.utc),
            source_name=source_name,
            accepted_count=len(accepted_cards),
            rejected_count=len(rejected_cards),
            accepted_cards=accepted_audit,
            rejected_cards=rejected_cards,
        )
        output_paths = write_ingestion_outputs(self.output_root, accepted_cards=accepted_cards, report=report)
        return IngestionRunResult(
            accepted_cards=accepted_cards,
            rejected_cards=rejected_cards,
            report=report,
            output_paths=output_paths,
        )


def _error_messages(exc: Exception) -> list[str]:
    if isinstance(exc, ValidationError):
        return [f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}" for error in exc.errors()]
    return [str(exc)]
