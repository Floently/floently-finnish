from __future__ import annotations

import unittest

from engine.learning.daily_practice_engine import build_daily_practice_manifest


class DailyPracticeEngineTests(unittest.TestCase):
    def test_manifest_contains_learning_tracks(self) -> None:
        manifest = build_daily_practice_manifest("B1_B2")
        self.assertEqual(manifest["level_band"], "B1_B2")
        self.assertTrue(isinstance(manifest["vocabulary_practice"], list) and manifest["vocabulary_practice"])
        self.assertTrue(isinstance(manifest["grammar_practice"], list) and manifest["grammar_practice"])
        self.assertTrue(isinstance(manifest["conversation_practice"], dict))
        self.assertTrue(isinstance(manifest["exam_preparation"], list) and manifest["exam_preparation"])
        self.assertIn("exam_readiness", manifest["readiness_tracking"])


if __name__ == "__main__":
    unittest.main()
