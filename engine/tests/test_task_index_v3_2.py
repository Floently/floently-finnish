"""
Task index contract tests.
Run from repo root: python -m engine.tests.test_task_index_v3_2
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path


def rich_index_load_test() -> None:
    import engine.tools.build_task_index_v3_2 as build_mod
    from engine.exam.exam_generator_v3_2 import load_index

    payload = {
        "version": "3.2.0",
        "runtime_index": {
            "B1_B2": {
                "reading_mcq_set": [["/tmp/reading.json", "r1"]],
                "listening_mcq_set": [["/tmp/listening.json", "l1"]],
                "writing_prompt": [["/tmp/writing.json", "w1"]],
                "speaking_roleplay": [["/tmp/speaking.json", "s1"]],
            }
        },
    }

    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "task_index_v3_2.json"
        index_path.write_text(json.dumps(payload), encoding="utf-8")
        old_index_path = build_mod.INDEX_PATH
        build_mod.INDEX_PATH = index_path
        try:
            loaded = load_index()
            assert loaded["B1_B2"]["reading_mcq_set"][0][1] == "r1"
            print("rich_index_load_test PASSED")
        finally:
            build_mod.INDEX_PATH = old_index_path


def strict_validation_test() -> None:
    import engine.tools.build_task_index_v3_2 as build_mod

    payload = {
        "version": "3.2.0",
        "runtime_index": {
            "B1_B2": {
                "reading_mcq_set": [["/tmp/reading.json", "r1"]] * 4,
                "listening_mcq_set": [],
                "writing_prompt": [["/tmp/writing.json", "w1"]] * 2,
                "speaking_roleplay": [["/tmp/speaking.json", "s1"]] * 2,
            }
        },
    }
    errors = build_mod.validate_index_payload(payload, strict=True)
    assert any(error.startswith("insufficient_pool:B1_B2:listening_mcq_set") for error in errors)
    print("strict_validation_test PASSED")


def main() -> None:
    rich_index_load_test()
    strict_validation_test()
    print("All task index tests passed.")


if __name__ == "__main__":
    main()
