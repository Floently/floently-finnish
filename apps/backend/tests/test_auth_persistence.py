from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.core.config import SETTINGS
from app.core.state_store import InMemoryStateStore
from app.services.auth_service import bootstrap_password_users


class AuthPersistenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._original_bootstrap_json = SETTINGS.auth_bootstrap_password_users_json

    def tearDown(self) -> None:
        object.__setattr__(SETTINGS, "auth_bootstrap_password_users_json", self._original_bootstrap_json)

    def test_state_store_recovers_from_backup_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            state_path = Path(tmpdir) / "state.json"
            store = InMemoryStateStore(path=state_path)
            store.set(
                "users",
                "usr_1",
                {
                    "user_id": "usr_1",
                    "email": "obum@learn.floently.com",
                    "password_hash": "salt$hash",
                },
            )
            store.set("email_index", "obum@learn.floently.com", "usr_1")
            store.write_snapshot()

            state_path.write_text("{broken json", encoding="utf-8")

            recovered = InMemoryStateStore(path=state_path)
            self.assertEqual(
                recovered.get_ref("users", "usr_1"),
                {
                    "user_id": "usr_1",
                    "email": "obum@learn.floently.com",
                    "password_hash": "salt$hash",
                },
            )
            self.assertEqual(recovered.get_ref("email_index", "obum@learn.floently.com"), "usr_1")

    def test_bootstrap_password_users_creates_missing_account(self) -> None:
        payload = [
            {
                "email": "obum@learn.floently.com",
                "password": "Obum-Password-123",
                "name": "Obum",
            },
            {
                "email": "testuser@floently.com",
                "password": "Testuser-Password-123",
                "name": "Test User",
                "force": True,
            },
        ]
        object.__setattr__(SETTINGS, "auth_bootstrap_password_users_json", json.dumps(payload))

        with tempfile.TemporaryDirectory() as tmpdir:
            state_path = Path(tmpdir) / "state.json"
            temp_store = InMemoryStateStore(path=state_path)
            with patch("app.services.auth_service.STORE", temp_store):
                result = bootstrap_password_users()

            self.assertEqual(result["created"], 2)
            self.assertEqual(result["updated"], 0)
            self.assertEqual(result["skipped"], 0)
            obum_user_id = temp_store.get_ref("email_index", "obum@learn.floently.com")
            self.assertIsInstance(obum_user_id, str)
            obum_user = temp_store.get_ref("users", obum_user_id)
            self.assertIsNotNone(obum_user)
            self.assertTrue(obum_user["password_hash"])

    def test_bootstrap_password_users_reads_runtime_file_when_env_missing(self) -> None:
        payload = [
            {
                "email": "obum@learn.floently.com",
                "password": "Obum-Password-123",
                "name": "Obum",
            },
        ]

        with tempfile.TemporaryDirectory() as tmpdir:
            runtime_dir = Path(tmpdir)
            (runtime_dir / "auth_bootstrap_password_users.json").write_text(json.dumps(payload), encoding="utf-8")
            state_path = runtime_dir / "state.json"
            temp_store = InMemoryStateStore(path=state_path)
            with patch("app.services.auth_service.STORE", temp_store), patch("app.services.auth_service.RUNTIME_DIR", runtime_dir):
                object.__setattr__(SETTINGS, "auth_bootstrap_password_users_json", None)
                result = bootstrap_password_users()

            self.assertEqual(result["created"], 1)
            self.assertEqual(result["updated"], 0)
            self.assertEqual(result["skipped"], 0)


if __name__ == "__main__":
    unittest.main()
