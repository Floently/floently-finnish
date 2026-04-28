from __future__ import annotations

import tempfile
import time
import unittest
import os
from pathlib import Path
from unittest.mock import patch

from engine.exam.conversation_runtime import (
    generate_ai_reply,
    start_conversation,
    submit_turn_response,
)
from engine.exam.exam_session_engine_v3_2 import ExamSession
from engine.exam.speaking_controller import normalize_speaking_task
from engine.runtime.session_manager_v3_3 import delete_session, save_session
from engine.runtime.session_tokens import verify_engine_session_token


def _objective_questions(prefix: str) -> list[dict[str, object]]:
    return [
        {
            "id": f"{prefix}-q{index + 1}",
            "prompt": f"{prefix} question {index + 1}",
            "options": ["a", "b", "c"],
            "correct_index": 0,
        }
        for index in range(3)
    ]


def _recording_task() -> dict[str, object]:
    return {
        "id": "speaking-recording-1",
        "task_type": "speaking",
        "mode": "recording_response",
        "content": {
            "instruction": "Kerro päivästäsi.",
            "target_duration_seconds": 30,
        },
    }


def _conversation_task() -> dict[str, object]:
    return {
        "id": "speaking-conversation-1",
        "task_type": "speaking_roleplay",
        "level_band": "B1_B2",
        "content": {
            "instruction": "Soita työpaikalle ja kysy työvuorosta.",
            "materials": {
                "roles": {
                    "user": "työntekijä",
                    "partner": "esihenkilö",
                }
            },
            "items": [
                {
                    "id": "item-1",
                    "ai_first_turn_fi": "Hei, miten voin auttaa?",
                }
            ],
            "timing": {
                "recommended_minutes": 2,
            },
        },
    }


class ExamRuntimeIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self._old_session_secret = os.environ.get("YKI_ENGINE_SESSION_SECRET")
        os.environ["YKI_ENGINE_SESSION_SECRET"] = "test-engine-session-secret"
        self.session_id = "integration-session-1"
        save_session(
            {
                "session_id": self.session_id,
                "level_band": "B1_B2",
                "exam": {
                    "level_band": "B1_B2",
                    "reading": [
                        {
                            "id": "reading-1",
                            "task_type": "reading_mcq_set",
                            "content": {
                                "instruction": "Lue teksti ja vastaa kysymyksiin.",
                                "materials": {"text": "yksi kaksi kolme", "word_count": 3},
                                "questions": _objective_questions("reading"),
                                "timing": {"recommended_minutes": 2},
                            },
                        }
                    ],
                    "listening": [
                        {
                            "id": "listening-1",
                            "task_type": "listening_mcq_set",
                            "content": {
                                "instruction": "Kuuntele ja vastaa kysymyksiin.",
                                "materials": {
                                    "transcript": "Hei ja tervetuloa tähän testiin.",
                                    "audio_asset_id": "fixture-listening-audio",
                                },
                                "questions": _objective_questions("listening"),
                                "timing": {"recommended_minutes": 2},
                            },
                        }
                    ],
                    "writing": [
                        {
                            "id": "writing-1",
                            "task_type": "writing_prompt",
                            "content": {
                                "instruction": "Kirjoita viesti.",
                                "materials": {"scenario": "Lähetä viesti ystävälle."},
                                "items": [{"id": "item-1", "prompt": "Kerro viikonlopusta."}],
                                "rubric": "selkeys",
                                "timing": {"recommended_minutes": 5},
                            },
                        }
                    ],
                    "speaking": [_recording_task(), _conversation_task()],
                },
                "answers": {},
                "audio_answers": {},
                "writing_answers": {},
                "speaking_runtime": {},
                "start_time": time.time(),
                "completed": False,
            }
        )

    def tearDown(self) -> None:
        if self._old_session_secret is None:
            os.environ.pop("YKI_ENGINE_SESSION_SECRET", None)
        else:
            os.environ["YKI_ENGINE_SESSION_SECRET"] = self._old_session_secret
        delete_session(self.session_id, missing_ok=True)

    def test_exam_lifecycle_supports_warning_then_confirmed_submission(self) -> None:
        session = ExamSession(self.session_id)
        public_state = session.public_state()
        token = str(public_state["metadata"]["engine_session_token"])
        self.assertTrue(verify_engine_session_token(session.to_dict(), token))

        with patch("engine.exam.exam_session_engine_v3_2.assert_section_available", return_value=None):
            session.record_answer("reading-1_0", 0)
            session.record_answer("reading-1_1", 1)
            session.record_answer("reading-1_2", 2)
            session.record_writing("writing-1", "Kirjoitan ystävälle viikonlopusta.")

            with tempfile.TemporaryDirectory() as temp_dir:
                recording_path = Path(temp_dir) / "recording.wav"
                recording_path.write_bytes(b"RIFF")
                session.record_audio("speaking-recording-1", str(recording_path))

                conversation_task = normalize_speaking_task(_conversation_task())
                raw_session = session.to_dict()
                started = start_conversation(raw_session, conversation_task)
                user_turn_id = str(started["awaiting_turn_id"])

                conversation_audio = Path(temp_dir) / "conversation-turn.wav"
                conversation_audio.write_bytes(b"RIFF")
                Path(f"{conversation_audio}.txt").write_text(
                    "Haluaisin kysyä ensi viikon työvuoroista.",
                    encoding="utf-8",
                )

                submitted_turn = submit_turn_response(
                    raw_session,
                    conversation_task,
                    turn_id=user_turn_id,
                    audio_file_path=str(conversation_audio),
                )
                self.assertEqual(submitted_turn["state"], "AI_RESPONDING")

                replied = generate_ai_reply(raw_session, conversation_task)
                self.assertTrue(replied["conversation_active"] or replied["completed"])
                save_session(raw_session)

                warning = session.submit(confirm_incomplete=False)
                self.assertEqual(warning["status"], "warning")
                self.assertIn("listening", warning["warning"]["incomplete_sections"])

                result = session.submit(confirm_incomplete=True)
                self.assertEqual(result["status"], "submitted")
                self.assertTrue(result["certificate_available"])
                self.assertEqual(result["analytics"]["speaking"]["speaking-conversation-1"]["mode"], "conversation")


if __name__ == "__main__":
    unittest.main()
