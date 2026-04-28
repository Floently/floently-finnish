from __future__ import annotations

from app.cards.schemas import (
    CollectionEnvelope,
    CardEnvelope,
    CardReviewState,
    CardSession,
    validate_card_payload,
    validate_collection_payload,
    validate_review_state_payload,
    validate_session_payload,
)


def validate_card(data: dict) -> CardEnvelope:
    return validate_card_payload(data)


def validate_collection(data: dict) -> CollectionEnvelope:
    return validate_collection_payload(data)


def validate_session(data: dict) -> CardSession:
    return validate_session_payload(data)


def validate_review_state(data: dict) -> CardReviewState:
    return validate_review_state_payload(data)
