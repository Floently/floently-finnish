from __future__ import annotations

import asyncio
import unittest
from datetime import UTC, datetime

from fastapi import HTTPException

from app.cards.runtime.api.router import answer_card, deck, next_card, runtime_deck, start_card_session
from app.cards.runtime.models.api_models import (
    AnswerRequest,
    AnswerResponse,
    CardPreviewResponse,
    CardSessionResponse,
    CorrectAnswerResponse,
    DeckResponse,
    NextCardResponse,
    ServedFollowUpResponse,
    SessionStartRequest,
    SessionStateResponse,
)
from app.cards.runtime.session_engine import CardSessionEngineError


class _UserStub:
    def __init__(self, user_id: str = "user.test.001", email: str = "test@example.com") -> None:
        self.id = user_id
        self.email = email


def _session_state(*, session_id: str = "session-1", index: int = 0, total: int = 1, answered: int = 0, status: str = "active") -> SessionStateResponse:
    now = datetime.now(UTC)
    return SessionStateResponse(
        session_id=session_id,
        status=status,
        current_card_index=index,
        total_cards=total,
        answered_count=answered,
        created_at=now,
        updated_at=now,
    )


def _card_preview(*, card_id: str = "card.grammar.missa", order_index: int = 0) -> CardPreviewResponse:
    return CardPreviewResponse(
        id=card_id,
        content_type="grammar_card",
        path="general",
        domain="yki_support",
        profession="none",
        level_band="B1_B2",
        difficulty="core",
        tags=["missa"],
        prompt_family="grammar_memory",
        word="talossa",
        state="new",
        seen_count=0,
        correct_rate=0.0,
        front_text="Opiskelijat ovat luokassa.",
        back_prompt="Write the correct missa-form.",
        audio=None,
        served_follow_up=ServedFollowUpResponse(
            variant_type="grammar_application",
            prompt="Write the correct missa-form.",
        ),
        order_index=order_index,
    )


class _FakeRuntimeService:
    def __init__(self) -> None:
        self.calls = []

    async def list_cards(self, **kwargs):
        self.calls.append(("list_cards", kwargs))
        return DeckResponse(count=1, cards=[_card_preview()])

    async def start_session(self, **kwargs):
        self.calls.append(("start_session", kwargs))
        return CardSessionResponse(session=_session_state(), first_card=_card_preview())

    async def answer_current_card(self, **kwargs):
        self.calls.append(("answer_current_card", kwargs))
        return AnswerResponse(
            correct=True,
            is_correct=True,
            expected_variant_type="grammar_application",
            evaluation_mode="normalized_text",
            submitted_answer_normalized="talossa",
            correct_answer=CorrectAnswerResponse(value="talossa", display_text="talossa"),
            accepted_variants=["talossa"],
            explanation="Correct inessive form.",
            next_recommended_action="advance_session",
            session_completed=False,
            session=_session_state(answered=1),
            next_card=_card_preview(card_id="card.sentence.mina_asun", order_index=1),
            adaptive_update=None,
        )

    async def get_next_card(self, *, session_id: str, user_id: str):
        self.calls.append(("get_next_card", {"session_id": session_id, "user_id": user_id}))
        if session_id == "missing-session":
            raise CardSessionEngineError("Unknown session_id: missing-session")
        return NextCardResponse(
            session=_session_state(session_id=session_id, index=1, total=2, answered=1),
            card=_card_preview(card_id="card.sentence.mina_asun", order_index=1),
            completed=False,
        )


class RuntimeApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = _FakeRuntimeService()
        self.user = _UserStub()

    def test_deck_maps_filters_to_runtime_service(self) -> None:
        payload = asyncio.run(
            deck(
                domain="general",
                content_type="grammar_card",
                profession=None,
                level="B1_B2",
                source=None,
                current_user=self.user,
                service=self.service,
            )
        )
        self.assertEqual(payload.count, 1)
        call_name, kwargs = self.service.calls[-1]
        self.assertEqual(call_name, "list_cards")
        self.assertEqual(kwargs["user_id"], self.user.id)
        self.assertEqual(kwargs["domain"].value, "general")
        self.assertEqual(kwargs["content_type"].value, "grammar_card")
        self.assertEqual(kwargs["level_band"].value, "B1_B2")

    def test_runtime_deck_forwards_source_without_defaulting_domain(self) -> None:
        payload = asyncio.run(
            runtime_deck(
                domain=None,
                content_type=None,
                profession=None,
                level=None,
                source="new_practice",
                current_user=self.user,
                service=self.service,
            )
        )
        self.assertEqual(payload.cards[0].id, "card.grammar.missa")
        call_name, kwargs = self.service.calls[-1]
        self.assertEqual(call_name, "list_cards")
        self.assertIsNone(kwargs["domain"])
        self.assertEqual(kwargs["source"], "new_practice")

    def test_start_session_returns_first_card_from_service(self) -> None:
        payload = asyncio.run(
            start_card_session(
                SessionStartRequest(domain="general", content_type="grammar_card", level="B1_B2"),
                current_user=self.user,
                service=self.service,
            )
        )
        self.assertEqual(payload.first_card.id, "card.grammar.missa")
        call_name, kwargs = self.service.calls[-1]
        self.assertEqual(call_name, "start_session")
        self.assertEqual(kwargs["domain"].value, "general")
        self.assertEqual(kwargs["content_type"].value, "grammar_card")

    def test_answer_endpoint_returns_service_payload(self) -> None:
        payload = asyncio.run(
            answer_card(
                "session-1",
                AnswerRequest(user_answer="talossa"),
                current_user=self.user,
                service=self.service,
            )
        )
        self.assertTrue(payload.correct)
        self.assertEqual(payload.correct_answer.value, "talossa")
        call_name, kwargs = self.service.calls[-1]
        self.assertEqual(call_name, "answer_current_card")
        self.assertEqual(kwargs["session_id"], "session-1")
        self.assertEqual(kwargs["user_answer"], "talossa")

    def test_next_card_maps_missing_session_to_http_404(self) -> None:
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(next_card("missing-session", current_user=self.user, service=self.service))
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertEqual(ctx.exception.detail["code"], "invalid_session")


if __name__ == "__main__":
    unittest.main()
