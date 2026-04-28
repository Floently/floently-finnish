from __future__ import annotations

import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from engine.api.server_v3_3 import app
from engine.exam.exam_scoring_engine_v3_2 import get_objective_answer_map
from engine.exam.exam_session_engine_v3_2 import ExamSession, speaking_duration_limits
from engine.exam.exam_timing_engine import (
    PRODUCTION_DURATION_PROFILE_SECONDS,
    TEST_DURATION_PROFILE_SECONDS,
    build_timing_manifest,
)
from engine.runtime.session_manager_v3_3 import delete_session, get_session


def _profile_copy(profile: dict[str, int]) -> dict[str, int]:
    return {section: int(seconds) for section, seconds in profile.items()}


class EngineTestModeApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.session_ids: list[str] = []

    def tearDown(self) -> None:
        for session_id in self.session_ids:
            delete_session(session_id, missing_ok=True)

    def test_production_mode_remains_unchanged_by_default(self) -> None:
        response = self.client.post("/exam/start", json={"level_band": "B1_B2"})
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        session_id = payload["session_id"]
        self.session_ids.append(session_id)

        self.assertEqual(payload["metadata"]["mode"], "production")
        self.assertEqual(
            payload["metadata"]["duration_profile_seconds"],
            _profile_copy(PRODUCTION_DURATION_PROFILE_SECONDS),
        )
        self.assertLessEqual(
            payload["metadata"]["timing"]["total_remaining_seconds"],
            sum(PRODUCTION_DURATION_PROFILE_SECONDS.values()),
        )
        self.assertGreaterEqual(
            payload["metadata"]["timing"]["total_remaining_seconds"],
            sum(PRODUCTION_DURATION_PROFILE_SECONDS.values()) - 1,
        )

    def test_test_mode_exposes_short_duration_profile(self) -> None:
        response = self.client.post(
            "/exam/start",
            json={"level_band": "B1_B2", "mode": "test"},
        )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        session_id = payload["session_id"]
        self.session_ids.append(session_id)

        self.assertEqual(payload["metadata"]["mode"], "test")
        self.assertEqual(
            payload["metadata"]["duration_profile_seconds"],
            _profile_copy(TEST_DURATION_PROFILE_SECONDS),
        )
        self.assertLessEqual(
            payload["metadata"]["timing"]["total_remaining_seconds"],
            sum(TEST_DURATION_PROFILE_SECONDS.values()),
        )
        self.assertGreaterEqual(
            payload["metadata"]["timing"]["total_remaining_seconds"],
            sum(TEST_DURATION_PROFILE_SECONDS.values()) - 1,
        )
        reading_items = payload["sections"][0]["items"]
        listening_items = payload["sections"][1]["items"]
        writing_items = payload["sections"][2]["items"]
        speaking_items = payload["sections"][3]["items"]
        self.assertEqual(len(reading_items), 1)
        self.assertEqual(len(listening_items), 1)
        self.assertEqual(len(writing_items), 1)
        self.assertEqual(len(speaking_items), 1)
        self.assertEqual(len(reading_items[0]["questions"]), 1)
        self.assertEqual(len(listening_items[0]["questions"]), 1)

        status_payload = self.client.get("/engine/status").json()
        self.assertEqual(status_payload["default_mode"], "production")
        self.assertIn("production", status_payload["supported_modes"])
        self.assertIn("test", status_payload["supported_modes"])
        self.assertGreaterEqual(status_payload["active_session_modes"]["test"], 1)

    def test_test_mode_accepts_explicit_duration_profile_override(self) -> None:
        override_profile = {
            "reading": 20,
            "listening": 35,
            "writing": 30,
            "speaking": 20,
        }
        response = self.client.post(
            "/exam/start",
            json={
                "level_band": "B1_B2",
                "mode": "test",
                "seed": "override-seed",
                "duration_profile_seconds": override_profile,
            },
        )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        session_id = payload["session_id"]
        self.session_ids.append(session_id)

        self.assertEqual(payload["metadata"]["mode"], "test")
        self.assertEqual(
            payload["metadata"]["duration_profile_seconds"],
            _profile_copy(override_profile),
        )
        self.assertLessEqual(
            payload["metadata"]["timing"]["total_remaining_seconds"],
            sum(override_profile.values()),
        )
        self.assertGreaterEqual(
            payload["metadata"]["timing"]["total_remaining_seconds"],
            sum(override_profile.values()) - 1,
        )

    def test_same_seed_produces_same_test_exam(self) -> None:
        first = self.client.post(
            "/exam/start",
            json={"level_band": "B1_B2", "mode": "test", "seed": "seed-fixed"},
        )
        second = self.client.post(
            "/exam/start",
            json={"level_band": "B1_B2", "mode": "test", "seed": "seed-fixed"},
        )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)

        first_payload = first.json()
        second_payload = second.json()
        self.session_ids.extend([first_payload["session_id"], second_payload["session_id"]])

        self.assertEqual(
            [item["item_id"] for item in first_payload["sections"][0]["items"]],
            [item["item_id"] for item in second_payload["sections"][0]["items"]],
        )
        self.assertEqual(
            [item["item_id"] for item in first_payload["sections"][1]["items"]],
            [item["item_id"] for item in second_payload["sections"][1]["items"]],
        )

    def test_different_seeds_rotate_test_exam_content(self) -> None:
        first = self.client.post(
            "/exam/start",
            json={"level_band": "B1_B2", "mode": "test", "seed": "seed-a"},
        )
        second = self.client.post(
            "/exam/start",
            json={"level_band": "B1_B2", "mode": "test", "seed": "seed-b"},
        )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)

        first_payload = first.json()
        second_payload = second.json()
        self.session_ids.extend([first_payload["session_id"], second_payload["session_id"]])

        first_signature = tuple(
            item["item_id"]
            for section in first_payload["sections"]
            for item in section["items"]
        )
        second_signature = tuple(
            item["item_id"]
            for section in second_payload["sections"]
            for item in section["items"]
        )
        self.assertNotEqual(first_signature, second_signature)


class EngineTestModeRuntimeTests(unittest.TestCase):
    def tearDown(self) -> None:
        delete_session("test-mode-runtime", missing_ok=True)

    def test_build_timing_manifest_uses_explicit_duration_profile(self) -> None:
        start_time = 1_000.0
        manifest = build_timing_manifest(
            start_time,
            now=start_time + 12,
            duration_profile=TEST_DURATION_PROFILE_SECONDS,
        )
        self.assertEqual(manifest["active_section"], "reading")
        self.assertEqual(manifest["section_remaining_seconds"], 8)
        self.assertEqual(manifest["total_remaining_seconds"], 58)
        self.assertEqual(manifest["sections"][0]["duration_seconds"], 20)

    def test_speaking_limits_follow_test_duration_profile(self) -> None:
        task = {
            "content": {
                "target_duration_seconds": 60,
            }
        }
        limits = speaking_duration_limits(task, duration_profile_seconds=TEST_DURATION_PROFILE_SECONDS)
        self.assertEqual(limits["max_duration_sec"], 15)
        self.assertEqual(limits["min_duration_sec"], 7)

    def test_speaking_limits_cap_minimum_for_short_override_window(self) -> None:
        task = {
            "content": {
                "target_duration_seconds": 60,
            }
        }
        limits = speaking_duration_limits(
            task,
            duration_profile_seconds={
                "reading": 20,
                "listening": 35,
                "writing": 30,
                "speaking": 40,
            },
        )
        self.assertEqual(limits["max_duration_sec"], 40)
        self.assertEqual(limits["min_duration_sec"], 10)

    def test_test_mode_session_can_complete_full_exam_with_real_section_progression(self) -> None:
        session = ExamSession.create("B1_B2", mode="test", seed="runtime-seed")
        self.addCleanup(delete_session, session.session_id, True)
        raw_session = get_session(session.session_id)
        answer_map = get_objective_answer_map(raw_session["exam"])
        start_time = float(raw_session["start_time"])

        reading_answers = []
        listening_answers = []
        for answer_id, metadata in answer_map.items():
            bucket = reading_answers if metadata["section"] == "reading" else listening_answers
            bucket.append((answer_id, metadata["correct_answer"]))

        with tempfile.TemporaryDirectory() as temp_dir:
            speaking_audio = Path(temp_dir) / "speaking.wav"
            speaking_audio.write_bytes(b"RIFF")

            checkpoints = [
                ("reading", start_time + 1, lambda: [session.record_answer(answer_id, answer) for answer_id, answer in reading_answers]),
                ("listening", start_time + 21, lambda: [session.record_answer(answer_id, answer) for answer_id, answer in listening_answers]),
                (
                    "writing",
                    start_time + 41,
                    lambda: [
                        session.record_writing(
                            task["id"],
                            f"Test mode writing answer for {task['id']}.",
                        )
                        for task in session.exam.get("writing", [])
                    ],
                ),
                (
                    "speaking",
                    start_time + 56,
                    lambda: [
                        session.record_speaking(task["id"], str(speaking_audio), 5.0)
                        for task in session.exam.get("speaking", [])
                    ],
                ),
            ]

            for _, current_time, action in checkpoints:
                with (
                    patch("engine.exam.exam_timing_engine.time.time", return_value=current_time),
                    patch("engine.runtime.session_manager_v3_3.time.time", return_value=current_time),
                ):
                    action()

            with (
                patch("engine.exam.exam_timing_engine.time.time", return_value=start_time + 65),
                patch("engine.runtime.session_manager_v3_3.time.time", return_value=start_time + 65),
            ):
                result = session.submit(confirm_incomplete=False)

        self.assertEqual(result["status"], "submitted")
        self.assertTrue(result["certificate_available"])
        self.assertGreaterEqual(sum(TEST_DURATION_PROFILE_SECONDS.values()), 30)
        self.assertLessEqual(sum(TEST_DURATION_PROFILE_SECONDS.values()), 90)


if __name__ == "__main__":
    unittest.main()
