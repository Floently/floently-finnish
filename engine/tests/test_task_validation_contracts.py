from __future__ import annotations

import unittest

from engine.validator.task_validator_v3_2 import validate_task_v3_2


def _base_task() -> dict:
    return {
        "id": "reading-fixture-1",
        "version": "3.2.0",
        "task_type": "reading_mcq_set",
        "level_band": "B1_B2",
        "skill": "reading",
        "difficulty": 0.5,
        "language": "fi",
        "source": {
            "origin": "test",
            "generator": "fixture",
            "generated_at": "2026-03-15T00:00:00Z",
        },
        "quality": {
            "certification": {
                "status": "certified",
                "certified_at": "2026-03-15T00:00:00Z",
                "certified_by": "test",
            }
        },
        "content": {
            "instruction": "Lue teksti ja vastaa kysymyksiin.",
            "materials": {
                "text": "yksi kaksi kolme",
                "word_count": 3,
            },
            "questions": [
                {
                    "id": f"q-{index + 1}",
                    "prompt": f"Kysymys {index + 1}",
                    "options": ["a", "b"],
                    "correct_index": 0,
                }
                for index in range(3)
            ],
            "timing": {
                "recommended_minutes": 2,
            },
        },
    }


class TaskValidationContractTests(unittest.TestCase):
    def test_accepts_finnish_task_with_in_range_difficulty(self) -> None:
        result = validate_task_v3_2(_base_task())
        self.assertTrue(result.structural_pass)
        self.assertTrue(result.blueprint_pass)

    def test_rejects_non_finnish_language(self) -> None:
        task = _base_task()
        task["language"] = "en"
        result = validate_task_v3_2(task)
        self.assertFalse(result.structural_pass)
        self.assertIn("language must be 'fi'", " ".join(result.structural_errors))

    def test_rejects_out_of_range_difficulty(self) -> None:
        task = _base_task()
        task["difficulty"] = 1.5
        result = validate_task_v3_2(task)
        self.assertFalse(result.structural_pass)
        self.assertIn("outside allowed range", " ".join(result.structural_errors))


if __name__ == "__main__":
    unittest.main()
