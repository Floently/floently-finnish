from __future__ import annotations

import asyncio
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

from app.core.errors import AppError
from app.core.state_store import InMemoryStateStore
from app.services import account_deletion_service


_TEST_USER = {
    "user_id": "user.account-delete.001",
    "email": "delete-test@example.com",
}


class AccountDeletionServiceTests(unittest.TestCase):
    def test_success_reports_deleted_only_after_db_and_state_cleanup(self) -> None:
        call_order: list[str] = []

        async def fake_db_cleanup(*, user_id: str, email: str):
            self.assertEqual(user_id, _TEST_USER["user_id"])
            self.assertEqual(email, _TEST_USER["email"])
            call_order.append("database")
            return {"users": 1, "subscriptions": 1}, True

        def fake_state_cleanup(*, user_id: str, email: str):
            self.assertEqual(user_id, _TEST_USER["user_id"])
            self.assertEqual(email, _TEST_USER["email"])
            call_order.append("state_store")
            return {"users": 1, "auth_sessions": 1}

        with (
            patch.object(account_deletion_service, "_delete_db_records", side_effect=fake_db_cleanup),
            patch.object(account_deletion_service, "_delete_state_records", side_effect=fake_state_cleanup),
        ):
            result = asyncio.run(
                account_deletion_service.delete_account_for_user(
                    user=_TEST_USER,
                    deletion_reason="in_app_settings",
                )
            )

        self.assertEqual(call_order, ["database", "state_store"])
        self.assertTrue(result["account_deleted"])
        self.assertEqual(result["details"]["db_cleanup_status"], "completed")
        self.assertEqual(result["details"]["db_records_removed"]["users"], 1)
        self.assertEqual(result["details"]["state_records_removed"]["auth_sessions"], 1)

    def test_database_failure_does_not_remove_state_or_claim_success(self) -> None:
        db_cleanup = AsyncMock(return_value=({}, False))
        state_cleanup = Mock(return_value={"users": 1})

        with (
            patch.object(account_deletion_service, "_delete_db_records", db_cleanup),
            patch.object(account_deletion_service, "_delete_state_records", state_cleanup),
        ):
            with self.assertRaises(AppError) as raised:
                asyncio.run(
                    account_deletion_service.delete_account_for_user(
                        user=_TEST_USER,
                        deletion_reason="in_app_settings",
                    )
                )

        error = raised.exception
        self.assertEqual(error.status_code, 503)
        self.assertEqual(error.code, "ACCOUNT_DELETION_INCOMPLETE")
        self.assertTrue(error.retryable)
        self.assertEqual(error.details.get("stage"), "database")
        state_cleanup.assert_not_called()

    def test_state_store_failure_does_not_claim_success(self) -> None:
        db_cleanup = AsyncMock(return_value=({"users": 1}, True))
        state_cleanup = Mock(side_effect=RuntimeError("test state-store failure"))

        with (
            patch.object(account_deletion_service, "_delete_db_records", db_cleanup),
            patch.object(account_deletion_service, "_delete_state_records", state_cleanup),
        ):
            with self.assertRaises(AppError) as raised:
                asyncio.run(
                    account_deletion_service.delete_account_for_user(
                        user=_TEST_USER,
                        deletion_reason="in_app_settings",
                    )
                )

        error = raised.exception
        self.assertEqual(error.status_code, 503)
        self.assertEqual(error.code, "ACCOUNT_DELETION_INCOMPLETE")
        self.assertTrue(error.retryable)
        self.assertEqual(error.details.get("stage"), "state_store")
        db_cleanup.assert_awaited_once()
        state_cleanup.assert_called_once()

    def test_state_cleanup_removes_identity_sessions_and_tokens_for_deleted_user(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = InMemoryStateStore(Path(temp_dir) / "state.json")
            deleted_user_id = _TEST_USER["user_id"]
            deleted_email = _TEST_USER["email"]
            other_user_id = "user.account-delete.other"

            store.set("users", deleted_user_id, {"user_id": deleted_user_id, "email": deleted_email})
            store.set("email_index", deleted_email, {"user_id": deleted_user_id, "email": deleted_email})
            store.set("auth_sessions", "session-delete", {"user_id": deleted_user_id, "email": deleted_email})
            store.set("access_tokens", "access-delete", {"user_id": deleted_user_id})
            store.set("refresh_tokens", "refresh-delete", {"user_id": deleted_user_id})
            store.set("auth_sessions", "session-keep", {"user_id": other_user_id, "email": "other@example.com"})

            with patch.object(account_deletion_service, "STORE", store):
                counts = account_deletion_service._delete_state_records(
                    user_id=deleted_user_id,
                    email=deleted_email,
                )

            self.assertEqual(counts.get("users"), 1)
            self.assertEqual(counts.get("auth_sessions"), 1)
            self.assertEqual(counts.get("access_tokens"), 1)
            self.assertEqual(counts.get("refresh_tokens"), 1)
            self.assertFalse(store.has("users", deleted_user_id))
            self.assertFalse(store.has("email_index", deleted_email))
            self.assertFalse(store.has("auth_sessions", "session-delete"))
            self.assertFalse(store.has("access_tokens", "access-delete"))
            self.assertFalse(store.has("refresh_tokens", "refresh-delete"))
            self.assertTrue(store.has("auth_sessions", "session-keep"))


if __name__ == "__main__":
    unittest.main()
