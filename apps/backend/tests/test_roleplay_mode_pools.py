from __future__ import annotations

import unittest
from unittest.mock import patch

from app.core.state_store import STORE
from app.runtime import roleplay


class RoleplayModePoolTests(unittest.TestCase):
    def tearDown(self) -> None:
        # Tests use isolated synthetic users; remove only their rotation cursors.
        snapshot = STORE.snapshot().get("user_content_history", {})
        for key in list(snapshot):
            if key.startswith("roleplay_scenario_rotation:"):
                STORE.delete("user_content_history", key)

    def test_general_mode_pools_are_disjoint_and_substantial(self) -> None:
        pools = {
            mode: {
                spec.scenario_id
                for spec in roleplay.roleplay_scenario_pool(
                    roleplay_mode=mode,
                    profession="general",
                )
            }
            for mode in ("everyday", "workplace", "yki")
        }

        for mode, scenario_ids in pools.items():
            self.assertEqual(
                len(scenario_ids),
                8,
                f"{mode} should expose exactly eight distinct general scenarios",
            )

        self.assertTrue(pools["everyday"].isdisjoint(pools["workplace"]))
        self.assertTrue(pools["everyday"].isdisjoint(pools["yki"]))
        self.assertTrue(pools["workplace"].isdisjoint(pools["yki"]))

    def test_professional_and_interview_pools_are_isolated(self) -> None:
        for profession in ("doctor", "nurse", "practical_nurse"):
            professional = {
                spec.scenario_id
                for spec in roleplay.roleplay_scenario_pool(
                    roleplay_mode="professional",
                    profession=profession,
                )
            }
            interview = {
                spec.scenario_id
                for spec in roleplay.roleplay_scenario_pool(
                    roleplay_mode="interview",
                    profession=profession,
                )
            }
            self.assertTrue(professional)
            self.assertTrue(interview)
            self.assertTrue(professional.isdisjoint(interview))

    def test_every_scenario_has_exactly_one_runtime_mode(self) -> None:
        assignments: dict[str, set[str]] = {}
        for (mode, _profession), specs in roleplay._ROLEPLAY_POOLS.items():
            for spec in specs:
                assignments.setdefault(spec.scenario_id, set()).add(mode)

        self.assertEqual(set(assignments), set(roleplay._SCENARIO_BY_ID))
        self.assertTrue(
            all(len(modes) == 1 for modes in assignments.values()),
            "each scenario ID must belong to exactly one roleplay mode",
        )

    def test_rotation_exhausts_pool_before_reuse(self) -> None:
        mode = "workplace"
        profession = "general"
        user_key = "test-roleplay-pool-rotation"
        catalog = [
            spec.scenario_id
            for spec in roleplay.roleplay_scenario_pool(
                roleplay_mode=mode,
                profession=profession,
            )
        ]

        selected: list[str] = []
        with patch.object(STORE, "write_snapshot", return_value=None):
            for _ in catalog:
                spec, returned_catalog, reason = roleplay.select_roleplay_scenario(
                    user_key=user_key,
                    roleplay_mode=mode,
                    profession=profession,
                )
                selected.append(spec.scenario_id)
                self.assertEqual(returned_catalog, catalog)
                self.assertIn(reason, {"unused_pool", "pool_recycled"})

            self.assertEqual(len(set(selected)), len(catalog))

            next_spec, _, next_reason = roleplay.select_roleplay_scenario(
                user_key=user_key,
                roleplay_mode=mode,
                profession=profession,
            )

        if len(catalog) > 1:
            self.assertNotEqual(next_spec.scenario_id, selected[-1])
        self.assertEqual(next_reason, "pool_recycled")

    def test_ten_starts_rotate_without_consecutive_duplicates(self) -> None:
        for mode in ("everyday", "workplace", "yki"):
            user_key = f"test-ten-starts-{mode}"
            selected: list[str] = []

            with patch.object(STORE, "write_snapshot", return_value=None):
                for _ in range(10):
                    spec, catalog, _reason = roleplay.select_roleplay_scenario(
                        user_key=user_key,
                        roleplay_mode=mode,
                        profession="general",
                    )
                    selected.append(spec.scenario_id)
                    self.assertEqual(len(catalog), 8)

            self.assertEqual(
                len(set(selected[:8])),
                8,
                f"{mode} must exhaust all eight scenarios before reuse",
            )
            self.assertTrue(
                all(left != right for left, right in zip(selected, selected[1:])),
                f"{mode} must not immediately repeat across ten starts",
            )

    def test_cefr_changes_dialogue_complexity_not_scenario_catalog(self) -> None:
        pool = roleplay.roleplay_scenario_pool(
            roleplay_mode="yki",
            profession="general",
        )
        spec = pool[0]
        selected = {
            level: spec.select_for_session(
                level_band=level,
                seed="fixed-cefr-comparison",
            )
            for level in ("A1-A2", "B1-B2", "C1-C2")
        }

        self.assertEqual(
            {item["level_band"] for item in selected.values()},
            {"A1-A2", "B1-B2", "C1-C2"},
        )
        self.assertEqual(len({item["opener"] for item in selected.values()}), 3)
        self.assertEqual(
            [item.scenario_id for item in pool],
            [
                item.scenario_id
                for item in roleplay.roleplay_scenario_pool(
                    roleplay_mode="yki",
                    profession="general",
                )
            ],
        )

    def test_explicit_replay_is_allowed_but_wrong_pool_is_rejected(self) -> None:
        user_key = "test-roleplay-explicit-replay"
        everyday = roleplay.roleplay_scenario_pool(
            roleplay_mode="everyday",
            profession="general",
        )[0]
        workplace = roleplay.roleplay_scenario_pool(
            roleplay_mode="workplace",
            profession="general",
        )[0]

        with patch.object(STORE, "write_snapshot", return_value=None):
            selected, catalog, reason = roleplay.select_roleplay_scenario(
                user_key=user_key,
                roleplay_mode="everyday",
                profession="general",
                explicit_scenario_id=everyday.scenario_id,
            )

        self.assertEqual(selected.scenario_id, everyday.scenario_id)
        self.assertIn(everyday.scenario_id, catalog)
        self.assertEqual(reason, "explicit_scenario")

        with self.assertRaisesRegex(ValueError, "ROLEPLAY_SCENARIO_OUTSIDE_POOL"):
            roleplay.select_roleplay_scenario(
                user_key=user_key,
                roleplay_mode="everyday",
                profession="general",
                explicit_scenario_id=workplace.scenario_id,
            )

    def test_display_context_does_not_choose_content(self) -> None:
        user_key = "test-roleplay-context-not-authority"
        with patch.object(STORE, "write_snapshot", return_value=None):
            first, _, _ = roleplay.select_roleplay_scenario(
                user_key=user_key,
                roleplay_mode="yki",
                profession="general",
            )

        self.assertEqual(first.roleplay_mode, "yki")
        self.assertNotIn(
            first.scenario_id,
            {
                spec.scenario_id
                for spec in roleplay.roleplay_scenario_pool(
                    roleplay_mode="workplace",
                    profession="general",
                )
            },
        )

    def test_start_response_reports_mode_pool_and_selection_reason(self) -> None:
        with patch.object(STORE, "write_snapshot", return_value=None):
            result = roleplay.start_session(
                profession="general",
                level_band="B1-B2",
                roleplay_mode="yki",
                rotation_user_key="test-roleplay-start-diagnostics",
                context_label="This translated label must not route content",
            )

        try:
            self.assertEqual(result["roleplayMode"], "yki")
            self.assertEqual(len(result["scenarioPool"]), 8)
            self.assertIn(result["scenarioId"], result["scenarioPool"])
            self.assertIn(
                result["selectionReason"],
                {"unused_pool", "pool_recycled", "explicit_scenario"},
            )
            self.assertEqual(result["scenario"]["roleplayMode"], "yki")
        finally:
            session_id = result.get("sessionId")
            if session_id:
                STORE.delete("roleplay_sessions", session_id)


if __name__ == "__main__":
    unittest.main()
