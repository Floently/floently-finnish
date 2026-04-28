from __future__ import annotations

import unittest
from unittest.mock import patch

import app.runtime.cards_logic as cards_logic


def _card_fixture(*, content_type: str) -> dict:
    return {
        "id": f"card.{content_type}.fixture",
        "content_type": content_type,
        "path": "general",
        "profession": "none",
        "level_band": "B1_B2",
        "front": "etu",
        "prompt": "question",
        "accepted_answers": ["Correct"],
        "answer_value": "Correct",
        "choices": None,
        "variant_type": "recognition",
        "follow_up_prompt": "question",
        "follow_up": {
            "variant_type": "recognition_mcq",
            "prompt": "question",
            "options": [
                {"option_id": "opt_1", "text": "Distractor 1"},
                {"option_id": "opt_2", "text": "Distractor 2"},
                {"option_id": "opt_3", "text": "Distractor 3"},
                {"option_id": "opt_4", "text": "Correct"},
            ],
            "answer_key": "opt_4",
            "answer_text": "Correct",
            "accepted_variants": ["Correct"],
            "evaluation_mode": "option_id",
        },
    }


class CardsLogicAnswerOptionsTests(unittest.TestCase):
    def setUp(self) -> None:
        cards_logic._SESSIONS.clear()
        cards_logic._HISTORY.clear()

    def test_make_served_follow_up_shuffles_options_and_keeps_answer_alignment(self) -> None:
        card = _card_fixture(content_type="vocabulary_card")
        follow_up = cards_logic._make_served_follow_up(card, option_shuffle_seed="stable-seed")

        option_ids = [item["option_id"] for item in follow_up["options"]]
        self.assertNotEqual(option_ids, ["opt_1", "opt_2", "opt_3", "opt_4"])

        answer_key = follow_up["answer_key"]
        answer_text = next(item["text"] for item in follow_up["options"] if item["option_id"] == answer_key)
        self.assertEqual(answer_text, "Correct")

    def test_answer_runtime_card_uses_shuffled_option_id_mapping(self) -> None:
        single_card = [_card_fixture(content_type="vocabulary_card")]
        with patch.object(cards_logic, "_filtered_cards", return_value=single_card):
            payload = cards_logic.start_cards_session(
                user_id="user_a",
                domain="general",
                content_type="vocabulary_card",
                profession=None,
                level="B1_B2",
                limit=1,
            )

        session_id = payload["session"]["session_id"]
        first_card = payload["first_card"]
        options = first_card["served_follow_up"]["options"]
        correct_option = next(item for item in options if item["text"] == "Correct")
        wrong_option = next(item for item in options if item["text"] != "Correct")

        correct_result = cards_logic.answer_card(
            user_id="user_a",
            session_id=session_id,
            user_answer=correct_option["option_id"],
        )
        self.assertTrue(correct_result["correct"])

        cards_logic._SESSIONS.clear()
        with patch.object(cards_logic, "_filtered_cards", return_value=single_card):
            payload = cards_logic.start_cards_session(
                user_id="user_a",
                domain="general",
                content_type="vocabulary_card",
                profession=None,
                level="B1_B2",
                limit=1,
            )
        session_id = payload["session"]["session_id"]
        incorrect_result = cards_logic.answer_card(
            user_id="user_a",
            session_id=session_id,
            user_answer=wrong_option["option_id"],
        )
        self.assertFalse(incorrect_result["correct"])

    def test_start_sessions_do_not_systematically_place_correct_answer_last(self) -> None:
        for content_type in ("vocabulary_card", "sentence_card", "grammar_card"):
            payload = cards_logic.start_cards_session(
                user_id=f"user_{content_type}",
                domain="general",
                content_type=content_type,
                profession=None,
                level="B1_B2",
                limit=40,
            )
            session_id = payload["session"]["session_id"]
            session = cards_logic._SESSIONS[session_id]

            positions = []
            for card in session["cards"]:
                follow_up = card["served_follow_up"]
                options = follow_up.get("options") or []
                answer_key = follow_up.get("answer_key")
                if not options or answer_key is None:
                    continue
                option_ids = [item.get("option_id") for item in options]
                if answer_key in option_ids:
                    positions.append(option_ids.index(answer_key))

            self.assertTrue(positions)
            self.assertNotEqual(sum(1 for item in positions if item == 3), len(positions))


if __name__ == "__main__":
    unittest.main()
