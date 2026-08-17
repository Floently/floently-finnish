class LearningPlatformError(ValueError):
    """Base error for deterministic learning-platform boundary failures."""


class MissingLearnerIdentity(LearningPlatformError):
    """Raised when a canonical authenticated learner id is unavailable."""


class LearnerOwnershipError(LearningPlatformError):
    """Raised when a caller attempts to access another learner namespace."""


class IdempotencyConflict(LearningPlatformError):
    """Raised when an existing event id is reused with different content."""


class CapabilityConflict(LearningPlatformError):
    """Raised when a capability id is redefined with different content."""


class PersistenceError(LearningPlatformError):
    """Raised when non-production persistence cannot be safely read or written."""
