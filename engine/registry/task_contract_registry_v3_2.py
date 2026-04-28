from __future__ import annotations


_ALL_LEVEL_BANDS = ["A1_A2", "B1_B2", "C1_C2"]
_ALL_DIFFICULTY_RANGES = {
    level_band: (0.0, 1.0) for level_band in _ALL_LEVEL_BANDS
}


TASK_REGISTRY = {
    "reading_mcq_set": {
        "difficulty_range": dict(_ALL_DIFFICULTY_RANGES),
        "content_structure": {
            "structural_constraints": {
                "questions_min_count": 3,
                "options_min_count_per_question": 2,
                "correct_index_must_be_in_bounds": True,
                "word_count_must_equal_text_split_len": True,
            },
            "blueprint_validation_constraints": {
                "allowed_level_bands": list(_ALL_LEVEL_BANDS),
                "difficulty_required": True,
                "difficulty_precision_decimals": 3,
            },
        },
    },
    "listening_mcq_set": {
        "difficulty_range": dict(_ALL_DIFFICULTY_RANGES),
        "content_structure": {
            "structural_constraints": {
                "questions_min_count": 3,
                "options_min_count_per_question": 2,
                "correct_index_must_be_in_bounds": True,
                "transcript_must_be_non_empty": True,
            },
            "blueprint_validation_constraints": {
                "allowed_level_bands": list(_ALL_LEVEL_BANDS),
                "difficulty_required": True,
                "difficulty_precision_decimals": 3,
            },
        },
    },
    "writing_prompt": {
        "difficulty_range": dict(_ALL_DIFFICULTY_RANGES),
        "content_structure": {
            "structural_constraints": {
                "items_min_count": 1,
            },
            "blueprint_validation_constraints": {
                "allowed_level_bands": list(_ALL_LEVEL_BANDS),
                "difficulty_required": True,
                "difficulty_precision_decimals": 3,
            },
        },
    },
    "speaking_roleplay": {
        "difficulty_range": dict(_ALL_DIFFICULTY_RANGES),
        "content_structure": {
            "structural_constraints": {
                "items_min_count": 1,
            },
            "blueprint_validation_constraints": {
                "allowed_level_bands": list(_ALL_LEVEL_BANDS),
                "difficulty_required": True,
                "difficulty_precision_decimals": 3,
            },
        },
    },
}
