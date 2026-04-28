from __future__ import annotations

import json
from pathlib import Path

from app.cards.ingestion.ingestion_pipeline import CardIngestionPipeline
from app.cards.ingestion.normalizers.models import IngestionSourceProfile
from app.cards.schemas.common import DomainScope, LearningPath, ProfessionScope, ProfessionTrack, QualityStatus, SourceKind


def main() -> None:
    profile = IngestionSourceProfile(
        profile_id="ingest.example.nurse",
        source_id="source.workspace.nurse.prototype",
        source_kind=SourceKind.imported_workspace,
        origin_path="apps/backend/card_bank/ready_bank/imported/nurse_cards.json",
        authoring_note="example ingestion run",
        path=LearningPath.professional,
        domain=DomainScope.healthcare,
        profession=ProfessionScope(track=ProfessionTrack.nurse, slug="nurse", label="Nurse"),
        quality_status=QualityStatus.raw,
        reviewer="cards-ingestion",
        version_tag="ingest_2026_03",
        manifest_ref="manifest.ingest.nurse",
    )
    raw_items = [
        {
            "type": "recognition",
            "prompt": "lääkäri",
            "options": ["lääkäri", "hoitaja", "koulu"],
            "answer": "lääkäri",
            "difficulty": "B1_B2",
            "tags": ["healthcare", "job_title"],
            "example_sentence": "Lääkäri tulee kohta huoneeseen.",
        },
        {
            "text": "you have requested a debate on this subject",
            "difficulty": "B1",
            "tags": ["dirty_material"],
        },
    ]
    pipeline = CardIngestionPipeline()
    result = pipeline.ingest_items(
        raw_items,
        profile=profile,
        run_id="run.example.nurse",
        source_name="inline_example",
    )
    print(json.dumps(result.report.model_dump(mode="json"), ensure_ascii=False, indent=2, sort_keys=True))
    for name, path in result.output_paths.items():
        print(f"{name}: {path}")


if __name__ == "__main__":
    main()
