from __future__ import annotations

from pydantic import TypeAdapter

from .cards import CardEnvelope, validate_card_payload
from .collections import CardDeck, CardLesson, CardModule, CardReviewQueue
from .session import CardReviewState, CardSession

CollectionEnvelope = CardDeck | CardModule | CardLesson | CardReviewQueue

_COLLECTION_ADAPTER = TypeAdapter(CollectionEnvelope)
_SESSION_ADAPTER = TypeAdapter(CardSession)
_REVIEW_STATE_ADAPTER = TypeAdapter(CardReviewState)


def validate_collection_payload(payload: dict) -> CollectionEnvelope:
    return _COLLECTION_ADAPTER.validate_python(payload)


def validate_session_payload(payload: dict) -> CardSession:
    return _SESSION_ADAPTER.validate_python(payload)


def validate_review_state_payload(payload: dict) -> CardReviewState:
    return _REVIEW_STATE_ADAPTER.validate_python(payload)


__all__ = [
    "CardDeck",
    "CardEnvelope",
    "CardLesson",
    "CardModule",
    "CardReviewQueue",
    "CardReviewState",
    "CardSession",
    "CollectionEnvelope",
    "validate_card_payload",
    "validate_collection_payload",
    "validate_session_payload",
    "validate_review_state_payload",
]
