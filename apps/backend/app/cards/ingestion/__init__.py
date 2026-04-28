"""Strict ingestion pipeline for canonical card generation."""

from .ingestion_pipeline import CardIngestionPipeline, IngestionRunResult, IngestionSourceProfile

__all__ = [
    "CardIngestionPipeline",
    "IngestionRunResult",
    "IngestionSourceProfile",
]
