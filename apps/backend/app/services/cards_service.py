from __future__ import annotations

from dataclasses import asdict
from typing import Any

from app.runtime.cards_logic import (
    answer_card as answer_card_logic,
    evaluate_card_answer,
    get_card_session,
    list_cards as list_cards_logic,
    next_card as next_card_logic,
    start_cards_session as start_cards_session_logic,
    report_card_issue as report_card_issue_logic,
)
from app.runtime.cards_material_bank import load_runtime_bank


class CardsService:
    def get_session(self, mode: str, limit: int = 10) -> dict[str, Any]:
        items = [asdict(item) for item in get_card_session(mode, limit)]
        return {"mode": mode, "items": items}

    def answer(self, card_id: str, answer: str) -> dict[str, Any]:
        bank = {card.id: card for card in load_runtime_bank()}
        if card_id not in bank:
            return {"correct": False, "explanation": "Korttia ei loytynyt.", "nextReviewInDays": 1}
        correct, explanation, next_review = evaluate_card_answer(bank[card_id], answer)
        return {"correct": correct, "explanation": explanation, "nextReviewInDays": next_review}

    def start_runtime_session(
        self,
        *,
        user_id: str,
        domain: str,
        content_type: str | None,
        profession: str | None,
        level: str | None,
        adaptive: bool = False,
        limit: int = 10,
    ) -> dict[str, Any]:
        return start_cards_session_logic(
            user_id=user_id,
            domain=domain,
            content_type=content_type,
            profession=profession,
            level=level,
            adaptive=adaptive,
            limit=limit,
        )

    def next_runtime_card(self, *, user_id: str, session_id: str) -> dict[str, Any]:
        return next_card_logic(user_id=user_id, session_id=session_id)

    def answer_runtime_card(self, *, user_id: str, session_id: str, user_answer: str) -> dict[str, Any]:
        return answer_card_logic(user_id=user_id, session_id=session_id, user_answer=user_answer)

    def get_runtime_deck(
        self,
        *,
        user_id: str,
        domain: str,
        content_type: str | None,
        profession: str | None,
        level: str | None,
        source: str | None = None,
    ) -> dict[str, Any]:
        return list_cards_logic(
            user_id=user_id,
            domain=domain,
            content_type=content_type,
            profession=profession,
            level=level,
            source=source,
        )


    def report_card_issue(self, *, user_id: str, card_id: str, reason: str, note: str | None = None, session_id: str | None = None) -> dict[str, Any]:
        return report_card_issue_logic(user_id=user_id, card_id=card_id, reason=reason, note=note, session_id=session_id)


cards_service = CardsService()
