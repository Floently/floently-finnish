from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .errors import MissingLearnerIdentity


@dataclass(frozen=True, slots=True)
class LearnerIdentity:
    """Canonical authenticated learner identity.

    The value is intentionally only the database user's stable id. Email and
    other mutable profile fields are not accepted as ownership fallbacks.
    """

    user_id: str

    def __post_init__(self) -> None:
        normalized = str(self.user_id or "").strip()
        if not normalized:
            raise MissingLearnerIdentity("Authenticated user id is required")
        object.__setattr__(self, "user_id", normalized)


def canonical_identity_from_user(user: Any) -> LearnerIdentity:
    """Create learner identity from the canonical authenticated user object.

    This deliberately reads only ``user.id``. An object that has an email but
    no id fails closed rather than creating email-owned learner data.
    """

    if user is None:
        raise MissingLearnerIdentity("Authenticated user is required")
    return LearnerIdentity(getattr(user, "id", None))
