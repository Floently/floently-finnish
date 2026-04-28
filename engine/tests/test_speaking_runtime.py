from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from engine.exam.conversation_runtime import (
    generate_ai_reply,
    start_conversation,
    submit_turn_response,
)
from engine.exam.exam_session_engine_v3_2 import (
    build_submission_warning,
    serialize_exam_for_client,
)
from engine.exam.speaking_controller import (
    build_speaking_screen,
    normalize_speaking_task,
    speaking_answered,
)
from engine.media.tts_engine import provider_order


def _legacy_conversation_task() -> dict:
    return {
        "id": "speaking-conversation-1",
        "task_type": "speaking_roleplay",
        "level_band": "B1_B2",
        "content": {
            "instruction": "Soita terveyskeskukseen ja varaa aika.",
            "materials": {
                "roles": {
                    "user": "potilas",
                    "partner": "sairaanhoitaja",
                }
            },
            "items": [
                {
                    "id": "item-1",
                    "ai_first_turn_fi": "Terveyskeskus, hyvää päivää. Miten voin auttaa?",
                }
            ],
            "timing": {
                "recommended_minutes": 2,
            },
        },
    }


def _recording_task() -> dict:
    return {
        "id": "speaking-recording-1",
        "task_type": "speaking",
        "mode": "recording_response",
        "content": {
            "mode": "recording_response",
            "instruction": "Kerro työpäivästäsi.",
            "target_duration_seconds": 45,
        },
    }


class SpeakingRuntimeTests(unittest.TestCase):
    def test_recording_speaking_task_is_standardized(self) -> None:
        screen = build_speaking_screen(_recording_task())

        self.assertEqual(screen["screen_type"], "speaking_task")
        self.assertEqual(screen["mode"], "recording_response")
        self.assertEqual(screen["speaking_mode"], "recording")
        self.assertEqual(screen["ui_type"], "speaking_task")
        self.assertEqual(screen["section"], "speaking")
        self.assertTrue(isinstance(screen["prompt_text"], str) and screen["prompt_text"])
        self.assertTrue(isinstance(screen["prompt_audio_url"], str) and screen["prompt_audio_url"])
        self.assertEqual(screen["target_duration_seconds"], 45)
        self.assertIn("instruction", screen)
        self.assertEqual(screen["ui_variant"], "speaking_recording")
        self.assertTrue(screen["permissions"]["microphone_required"])

    def test_conversation_speaking_task_is_standardized(self) -> None:
        task = normalize_speaking_task(_legacy_conversation_task())
        screen = build_speaking_screen(task)

        self.assertEqual(task["mode"], "conversation")
        self.assertEqual(task["speaking_mode"], "conversation")
        self.assertEqual(screen["screen_type"], "speaking_task")
        self.assertEqual(screen["mode"], "conversation")
        self.assertEqual(screen["speaking_mode"], "conversation")
        self.assertEqual(screen["ui_type"], "speaking_task")
        self.assertEqual(screen["section"], "speaking")
        self.assertEqual(screen["conversation"]["speakers"]["partner"]["label"], "sairaanhoitaja")
        self.assertEqual(len(screen["conversation"]["turns"]), 1)
        self.assertEqual(screen["ui_variant"], "speaking_conversation")

    def test_conversation_flow_records_turns_and_completes(self) -> None:
        task = normalize_speaking_task(_legacy_conversation_task())
        session = {
            "session_id": "session-1",
            "speaking_runtime": {},
            "audio_answers": {},
        }

        started = start_conversation(session, task)
        self.assertTrue(started["conversation_active"])
        self.assertEqual(len(started["transcript"]), 1)
        self.assertIsNotNone(started["awaiting_turn_id"])
        self.assertEqual(started["state"], "WAITING_FOR_RECORDING")
        self.assertEqual(started["conversation_session"]["turn_number"], 1)
        self.assertEqual(started["conversation_session"]["exam_id"], "session-1")

        user_turn_id = started["awaiting_turn_id"]
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_path = Path(temp_dir) / "turn-1.wav"
            audio_path.write_bytes(b"RIFF")
            Path(f"{audio_path}.txt").write_text(
                "Haluaisin varata ajan ensi viikolle.",
                encoding="utf-8",
            )

            submitted = submit_turn_response(
                session,
                task,
                turn_id=user_turn_id,
                audio_file_path=str(audio_path),
            )

        self.assertIn(user_turn_id, submitted["responses"])
        self.assertEqual(len(submitted["transcript"]), 2)
        self.assertEqual(submitted["state"], "AI_RESPONDING")
        self.assertEqual(submitted["conversation_session"]["turn_number"], 2)

        replied = generate_ai_reply(session, task)
        self.assertEqual(len(replied["transcript"]), 3)
        self.assertEqual(replied["transcript"][-1]["speaker"], "partner")
        self.assertEqual(replied["state"], "WAITING_FOR_RECORDING")
        self.assertGreaterEqual(len(replied["state_history"]), 4)

        task_id = str(task["id"])
        session["speaking_runtime"][task_id]["completed"] = True
        self.assertTrue(speaking_answered(session, task))

    def test_scripted_multi_voice_payload_is_preserved(self) -> None:
        task = {
            "id": "speaking-scripted-1",
            "task_type": "speaking",
            "mode": "conversation",
            "content": {
                "mode": "conversation",
                "instruction": "Keskustele lääkärin kanssa.",
                "conversation": {
                    "speakers": {
                        "user": {"speaker_id": "user", "label": "Sinä", "kind": "user"},
                        "nurse": {"speaker_id": "nurse", "label": "Hoitaja", "kind": "ai", "voice_profile": "yki_standard_female"},
                        "doctor": {"speaker_id": "doctor", "label": "Lääkäri", "kind": "ai", "voice_profile": "yki_standard_male"},
                    },
                    "turns": [
                        {"turn_id": "t1", "speaker": "nurse", "text": "Hyvää päivää.", "response_required": False, "voice_profile": "yki_standard_female"},
                        {"turn_id": "t2", "speaker": "user", "text": "", "response_required": True},
                        {"turn_id": "t3", "speaker": "doctor", "text": "Mikä teitä vaivaa?", "response_required": False, "voice_profile": "yki_standard_male"},
                    ],
                },
            },
        }

        normalized = normalize_speaking_task(task)
        turns = normalized["content"]["conversation"]["turns"]
        self.assertEqual(turns[0]["voice_profile"], "yki_standard_female")
        self.assertEqual(turns[2]["voice_profile"], "yki_standard_male")

    def test_conversation_audio_uses_turn_voice_profile(self) -> None:
        task = normalize_speaking_task(
            {
                "id": "speaking-doctor-1",
                "task_type": "speaking",
                "speaking_mode": "conversation",
                "content": {
                    "speaking_mode": "conversation",
                    "instruction": "Keskustele lääkärin kanssa.",
                    "conversation": {
                        "speakers": {
                            "user": {"speaker_id": "user", "label": "Sinä", "kind": "user"},
                            "doctor": {
                                "speaker_id": "doctor",
                                "label": "Lääkäri",
                                "role": "doctor",
                                "kind": "ai",
                                "voice_profile": "yki_standard_male",
                            },
                        },
                        "turns": [
                            {
                                "turn_id": "doctor-1",
                                "speaker": "doctor",
                                "text": "Hei, mikä teitä vaivaa?",
                                "response_required": False,
                            },
                            {"turn_id": "user-1", "speaker": "user", "text": "", "response_required": True},
                        ],
                    },
                },
            }
        )
        session = {"session_id": "session-voice", "speaking_runtime": {}}

        with patch("engine.exam.conversation_runtime.resolve_audio", return_value={"url": "/audio/test.mp3", "duration_seconds": 1.0, "provider": "fixture", "replayable": True}) as mocked_resolve:
            start_conversation(session, task)

        self.assertEqual(mocked_resolve.call_args.kwargs["voice_profile"], "yki_standard_male")

    def test_tts_provider_order_prefers_elevenlabs_then_azure(self) -> None:
        providers = provider_order(None)
        self.assertEqual([provider.name for provider in providers[:2]], ["elevenlabs", "azure"])

    def test_exam_runtime_serializes_a_single_unified_speaking_screen(self) -> None:
        exam = {
            "level_band": "B1_B2",
            "reading": [],
            "listening": [],
            "writing": [],
            "speaking": [_legacy_conversation_task()],
        }

        payload = serialize_exam_for_client(exam, session_id="session-speaking")
        screen_types = [screen["screen_type"] for screen in payload["screens"]]
        self.assertIn("speaking_task", screen_types)
        self.assertNotIn("speaking_recording", screen_types)

    def test_submission_warning_marks_incomplete_speaking_and_writing(self) -> None:
        session = {
            "exam": {
                "reading": [],
                "listening": [],
                "writing": [{"id": "writing-1"}],
                "speaking": [_recording_task()],
            },
            "answers": {},
            "writing_answers": {},
            "audio_answers": {},
            "speaking_runtime": {},
        }

        warning = build_submission_warning(session)
        self.assertTrue(warning["warning_required"])
        self.assertEqual(set(warning["incomplete_sections"]), {"writing", "speaking"})
        self.assertEqual(warning["confirm_label"], "Submit Anyway")


if __name__ == "__main__":
    unittest.main()
