"""Ingestion-stage exceptions."""


class IngestionError(ValueError):
    """Base error for strict card ingestion."""


class RawInputError(IngestionError):
    """Raised when the input source cannot be loaded safely."""


class NormalizationError(IngestionError):
    """Raised when a raw item cannot be normalized safely."""


class BuilderError(IngestionError):
    """Raised when a normalized item cannot be converted into a canonical card payload."""
