from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path
from uuid import uuid4

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.runtime.roleplay import start_session
from app.runtime.roleplay_missions import (
    all_roleplay_missions,
    missions_for_scenario,
    select_mission_from_state,
)


EXPECTED_SCENARIOS = {
    "general_everyday_conversation": 21,
    "general_supervisor_instruction": 21,
    "general_issue_report": 18,
}


def require(
    condition: bool,
    message: str,
) -> None:
    if not condition:
        raise AssertionError(message)

    print(f"PASS: {message}")


def verify_catalog() -> None:
    missions = all_roleplay_missions()

    require(
        len(missions) == 60,
        "general mission bank contains exactly 60 missions",
    )

    mission_ids = [
        mission.mission_id
        for mission in missions
    ]

    require(
        len(set(mission_ids)) == 60,
        "all mission IDs are unique",
    )

    counts = Counter(
        mission.scenario_id
        for mission in missions
    )

    require(
        dict(counts) == EXPECTED_SCENARIOS,
        "mission distribution matches the curated 21/21/18 catalogue",
    )

    for mission in missions:
        require(
            bool(mission.title.strip()),
            f"{mission.mission_id} has a title",
        )

        require(
            bool(mission.complication.strip()),
            f"{mission.mission_id} has a complication",
        )

        require(
            len(mission.required_actions) >= 4,
            f"{mission.mission_id} has at least four communicative actions",
        )

        require(
            len(set(mission.question_intents)) >= 6,
            f"{mission.mission_id} has at least six distinct question intents",
        )

        for level in (
            "A1-A2",
            "B1-B2",
            "C1-C2",
        ):
            require(
                bool(
                    mission.opening_for_level(
                        level
                    ).strip()
                ),
                f"{mission.mission_id} has a {level} opening",
            )


def verify_rotation() -> None:
    for scenario_id, expected_count in EXPECTED_SCENARIOS.items():
        state = None
        selected: list[str] = []
        intent_sequences: set[tuple[str, ...]] = set()

        for index in range(expected_count):
            payload, state = select_mission_from_state(
                scenario_id=scenario_id,
                level_band="B1-B2",
                session_seed=(
                    f"verify:{scenario_id}:{index}"
                ),
                previous_state=state,
            )

            require(
                payload is not None,
                f"{scenario_id} returns mission {index + 1}",
            )

            mission_id = str(
                payload["missionId"]
            )

            if selected:
                require(
                    mission_id != selected[-1],
                    f"{scenario_id} does not immediately repeat a mission",
                )

            selected.append(mission_id)
            intent_sequences.add(
                tuple(payload["questionIntents"])
            )

        require(
            len(set(selected)) == expected_count,
            f"{scenario_id} exhausts all 20 missions before recycling",
        )

        require(
            len(intent_sequences) >= 12,
            f"{scenario_id} produces diverse question-intent sequences",
        )

        next_payload, state = select_mission_from_state(
            scenario_id=scenario_id,
            level_band="B1-B2",
            session_seed=f"verify:{scenario_id}:next-cycle",
            previous_state=state,
        )

        require(
            next_payload is not None,
            f"{scenario_id} begins a new cycle",
        )

        require(
            next_payload["missionId"] != selected[-1],
            f"{scenario_id} avoids a boundary repeat between cycles",
        )


def verify_runtime_integration() -> None:
    user_key = f"mission-verifier-{uuid4().hex}"

    observed_ids: set[str] = set()
    observed_titles: set[str] = set()

    for scenario_id in EXPECTED_SCENARIOS:
        for index in range(4):
            payload = start_session(
                profession="general",
                level_band="B1-B2",
                scenario_id=scenario_id,
                context_label=None,
                rotation_user_key=user_key,
            )

            mission = payload.get("mission")
            scenario = payload.get("scenario") or {}

            require(
                isinstance(mission, dict),
                f"runtime returns mission metadata for {scenario_id}",
            )

            require(
                bool(
                    str(
                        mission.get("missionId")
                        or ""
                    ).strip()
                ),
                f"runtime mission has an ID for {scenario_id}",
            )

            require(
                payload.get("openingText")
                == mission.get("openingText"),
                f"runtime uses curated mission opening for {scenario_id}",
            )

            require(
                scenario.get("title")
                == mission.get("title"),
                f"client-visible title matches the selected mission for {scenario_id}",
            )

            require(
                scenario.get("prompt")
                == mission.get("prompt"),
                f"AI prompt matches the selected mission for {scenario_id}",
            )

            observed_ids.add(
                str(mission["missionId"])
            )
            observed_titles.add(
                str(mission["title"])
            )

    require(
        len(observed_ids) == 12,
        "runtime produced 12 non-repeating missions in the smoke sample",
    )

    require(
        len(observed_titles) == 12,
        "runtime produced 12 distinct client-visible mission titles",
    )


def verify_source_guards() -> None:
    ai_source = (
        BACKEND_ROOT
        / "app/services/roleplay_ai_service.py"
    ).read_text(
        encoding="utf-8"
    )

    router_source = (
        BACKEND_ROOT
        / "app/routers/v1_roleplay.py"
    ).read_text(
        encoding="utf-8"
    )

    require(
        '"next_question_intent": next_question_intent'
        in ai_source,
        "AI receives the next rotating question intent",
    )

    require(
        "Do not repeat a question that has already been answered"
        in ai_source,
        "AI has an explicit answered-question repetition guard",
    )

    require(
        'user.get("user_id")'
        in router_source,
        "mission rotation is scoped to the authenticated user",
    )


def main() -> None:
    verify_catalog()
    verify_rotation()
    verify_runtime_integration()
    verify_source_guards()

    print(
        "ROLEPLAY_MISSION_BANK_VERIFICATION=PASS"
    )


if __name__ == "__main__":
    main()
