from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.core.config import SETTINGS
from app.core.state_store import InMemoryStateStore
from app.core.utils import hash_password
from app.db.auth_repository import AuthUserRepository
from app.services.auth_service import bootstrap_password_users, login_user
from app.services.subscription_service import start_trial


class AuthPersistenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._original_bootstrap_json = SETTINGS.auth_bootstrap_password_users_json

    def tearDown(self) -> None:
        object.__setattr__(SETTINGS, "auth_bootstrap_password_users_json", self._original_bootstrap_json)

    def _repo(self, db_path: Path) -> AuthUserRepository:
        repo = AuthUserRepository(database_path=db_path)
        repo.ensure_schema()
        return repo

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

    def test_bootstrap_password_users_writes_password_into_db(self) -> None:
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

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            db_path = tmp_path / "puhis.db"
            state_path = tmp_path / "state.json"
            store = InMemoryStateStore(path=state_path)
            store.set(
                "users",
                "usr_legacy",
                {
                    "user_id": "usr_legacy",
                    "email": "obum@learn.floently.com",
                    "name": "Obum",
                    "password_hash": None,
                    "subscription_tier": "free",
                    "provider_links": {},
                },
            )
            store.set("email_index", "obum@learn.floently.com", "usr_legacy")
            store.write_snapshot()

            repo = self._repo(db_path)
            repo.migrate_state_users(store._data["users"])

            with patch("app.db.auth_repository.AUTH_USERS", repo):
                object.__setattr__(SETTINGS, "auth_bootstrap_password_users_json", json.dumps(payload))
                result = bootstrap_password_users()

            self.assertEqual(result["created"], 1)
            self.assertEqual(result["updated"], 1)
            self.assertEqual(result["skipped"], 0)

            reloaded = self._repo(db_path)
            obum_user = reloaded.get_user_by_email("obum@learn.floently.com")
            testuser_user = reloaded.get_user_by_email("testuser@floently.com")
            self.assertIsNotNone(obum_user)
            self.assertIsNotNone(testuser_user)
            self.assertTrue(obum_user["password_hash"])
            self.assertTrue(testuser_user["password_hash"])
            self.assertEqual(obum_user["name"], "Obum")
            self.assertEqual(testuser_user["name"], "Test User")

    def test_login_user_ignores_stale_json_state_once_password_is_in_db(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            db_path = tmp_path / "puhis.db"
            state_path = tmp_path / "state.json"
            stale_store = InMemoryStateStore(path=state_path)
            stale_store.set(
                "users",
                "usr_stale",
                {
                    "user_id": "usr_stale",
                    "email": "obum@learn.floently.com",
                    "password_hash": None,
                },
            )
            stale_store.set("email_index", "obum@learn.floently.com", "usr_stale")
            stale_store.write_snapshot()

            repo = self._repo(db_path)
            repo.save_user(
                {
                    "user_id": "usr_stale",
                    "email": "obum@learn.floently.com",
                    "name": "Obum",
                    "password_hash": hash_password("Obum-Password-123"),
                    "subscription_tier": "free",
                    "provider_links": {},
                    "created_at": "2026-01-01T00:00:00+00:00",
                },
                overwrite_password=True,
            )

            with patch("app.db.auth_repository.AUTH_USERS", repo), patch("app.services.auth_service.STORE", stale_store):
                result = login_user(email="obum@learn.floently.com", password="Obum-Password-123")

            self.assertEqual(result["auth_user"]["email"], "obum@learn.floently.com")

            restarted_repo = self._repo(db_path)
            restarted_user = restarted_repo.get_user_by_email("obum@learn.floently.com")
            self.assertIsNotNone(restarted_user)
            self.assertTrue(restarted_user["password_hash"])

    def test_start_trial_persists_to_database(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "puhis.db"
            repo = self._repo(db_path)
            repo.save_user(
                {
                    "user_id": "usr_trial",
                    "email": "trial@learn.floently.com",
                    "name": "Trial User",
                    "password_hash": hash_password("Trial-Password-123"),
                    "subscription_tier": "free",
                    "provider_links": {},
                    "created_at": "2026-01-01T00:00:00+00:00",
                },
                overwrite_password=True,
            )

            with patch("app.db.auth_repository.AUTH_USERS", repo):
                trial_user = repo.get_user_by_email("trial@learn.floently.com")
                status = start_trial(user=trial_user, trial_days=3)

            self.assertEqual(status["access_choice"], "trial")
            self.assertTrue(status["trial_ends_at"])

            restarted_repo = self._repo(db_path)
            persisted = restarted_repo.get_user_by_email("trial@learn.floently.com")
            self.assertEqual(persisted["access_choice"], "trial")
            self.assertTrue(persisted["trial_ends_at"])


if __name__ == "__main__":
    unittest.main()
