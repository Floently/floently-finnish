from __future__ import annotations

import asyncio
import json
import unittest
from unittest.mock import MagicMock, patch

from app.core.config import SETTINGS
from app.routers.health import password_reset_delivery_readiness
from app.services.auth_service import PASSWORD_RESET_NEUTRAL_MESSAGE, request_password_reset
from app.services.password_reset_email_service import (
    PasswordResetLinks,
    get_password_reset_delivery_status,
    send_password_reset_email,
)


class PasswordResetDeliveryTests(unittest.TestCase):
    _SETTING_NAMES = (
        "password_reset_email_from",
        "password_reset_email_webhook_url",
        "password_reset_smtp_host",
        "password_reset_smtp_port",
        "password_reset_smtp_username",
        "password_reset_smtp_password",
        "password_reset_smtp_use_tls",
        "password_reset_smtp_use_ssl",
    )

    def setUp(self) -> None:
        self._original = {name: getattr(SETTINGS, name) for name in self._SETTING_NAMES}
        self._configure_none()

    def tearDown(self) -> None:
        for name, value in self._original.items():
            object.__setattr__(SETTINGS, name, value)

    def _set(self, name: str, value: object) -> None:
        object.__setattr__(SETTINGS, name, value)

    def _configure_none(self) -> None:
        self._set("password_reset_email_from", None)
        self._set("password_reset_email_webhook_url", None)
        self._set("password_reset_smtp_host", None)
        self._set("password_reset_smtp_port", 587)
        self._set("password_reset_smtp_username", None)
        self._set("password_reset_smtp_password", None)
        self._set("password_reset_smtp_use_tls", True)
        self._set("password_reset_smtp_use_ssl", False)

    def _configure_smtp(self) -> None:
        self._set("password_reset_email_from", "KieliValmis <no-reply@example.invalid>")
        self._set("password_reset_smtp_host", "smtp.example.invalid")
        self._set("password_reset_smtp_port", 587)
        self._set("password_reset_smtp_username", "example-user")
        self._set("password_reset_smtp_password", "example-value")
        self._set("password_reset_smtp_use_tls", True)
        self._set("password_reset_smtp_use_ssl", False)

    def test_unconfigured_delivery_is_not_ready(self) -> None:
        status = get_password_reset_delivery_status()
        self.assertFalse(status.ready)
        self.assertEqual(status.provider, "none")
        self.assertEqual(status.reason, "provider_not_configured")

    def test_existing_webhook_delivery_remains_ready(self) -> None:
        self._set("password_reset_email_from", "no-reply@example.invalid")
        self._set("password_reset_email_webhook_url", "https://mailer.example.invalid/reset")

        status = get_password_reset_delivery_status()

        self.assertTrue(status.ready)
        self.assertEqual(status.provider, "webhook")
        self.assertEqual(status.reason, "ready")

    def test_smtp_starttls_delivery_uses_default_ssl_context(self) -> None:
        self._configure_smtp()
        smtp_context_manager = MagicMock()
        smtp_connection = smtp_context_manager.__enter__.return_value
        tls_context = object()

        with patch(
            "app.services.password_reset_email_service.ssl.create_default_context",
            return_value=tls_context,
        ), patch(
            "app.services.password_reset_email_service.smtplib.SMTP",
            return_value=smtp_context_manager,
        ) as smtp_factory:
            accepted = send_password_reset_email(
                email="learner@example.invalid",
                links=PasswordResetLinks(
                    deep_link="floently://auth/reset-password?token=example",
                    web_link="https://app.kielivalmis.com/auth/reset-password?token=example",
                ),
                expires_in_minutes=30,
            )

        self.assertTrue(accepted)
        smtp_factory.assert_called_once_with("smtp.example.invalid", 587, timeout=5)
        smtp_connection.starttls.assert_called_once_with(context=tls_context)
        smtp_connection.login.assert_called_once_with("example-user", "example-value")
        smtp_connection.send_message.assert_called_once()
        message = smtp_connection.send_message.call_args.args[0]
        self.assertEqual(message["Subject"], "Reset your KieliValmis password")
        self.assertEqual(message["To"], "learner@example.invalid")

    def test_incomplete_smtp_credentials_fail_closed(self) -> None:
        self._configure_smtp()
        self._set("password_reset_smtp_password", None)

        status = get_password_reset_delivery_status()

        self.assertFalse(status.ready)
        self.assertEqual(status.provider, "smtp")
        self.assertEqual(status.reason, "smtp_credentials_incomplete")

    def test_conflicting_smtp_tls_modes_fail_readiness(self) -> None:
        self._configure_smtp()
        self._set("password_reset_smtp_use_ssl", True)

        status = get_password_reset_delivery_status()

        self.assertFalse(status.ready)
        self.assertEqual(status.provider, "smtp")
        self.assertEqual(status.reason, "smtp_tls_mode_conflict")

    def test_readiness_endpoint_returns_503_when_delivery_is_unavailable(self) -> None:
        response = asyncio.run(password_reset_delivery_readiness())
        payload = json.loads(response.body)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(payload["status"], "unavailable")
        self.assertFalse(payload["ready"])
        self.assertEqual(payload["provider"], "none")

    def test_readiness_endpoint_returns_200_when_smtp_is_ready(self) -> None:
        self._configure_smtp()

        response = asyncio.run(password_reset_delivery_readiness())
        payload = json.loads(response.body)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "ready")
        self.assertTrue(payload["ready"])
        self.assertEqual(payload["provider"], "smtp")
        self.assertEqual(payload["verification"], "configuration")
        response_text = response.body.decode("utf-8")
        self.assertNotIn("example-user", response_text)
        self.assertNotIn("example-value", response_text)

    def test_unknown_account_keeps_same_neutral_response_without_delivery(self) -> None:
        with patch(
            "app.services.auth_service._check_and_increment_rate_limit",
            return_value=True,
        ), patch(
            "app.services.auth_service._load_user_by_email",
            return_value=None,
        ), patch(
            "app.services.auth_service.send_password_reset_email",
        ) as delivery, patch(
            "app.services.auth_service._persist_auth_state",
        ):
            result = request_password_reset(
                email="unknown@example.invalid",
                request_ip="127.0.0.1",
            )

        self.assertEqual(result, {"message": PASSWORD_RESET_NEUTRAL_MESSAGE})
        delivery.assert_not_called()

    def test_reset_request_stays_neutral_when_delivery_is_unavailable(self) -> None:
        with patch(
            "app.services.auth_service._check_and_increment_rate_limit",
            return_value=True,
        ), patch(
            "app.services.auth_service._load_user_by_email",
            return_value={"user_id": "usr_test", "email": "learner@example.invalid"},
        ), patch(
            "app.services.auth_service._record_password_reset_token",
        ), patch(
            "app.services.auth_service.send_password_reset_email",
            return_value=False,
        ), patch(
            "app.services.auth_service._persist_auth_state",
        ), self.assertLogs("floently.auth.password_reset", level="ERROR") as captured:
            result = request_password_reset(
                email="learner@example.invalid",
                request_ip="127.0.0.1",
            )

        self.assertEqual(result, {"message": PASSWORD_RESET_NEUTRAL_MESSAGE})
        logs = "\n".join(captured.output)
        self.assertIn("delivery unavailable", logs.lower())
        self.assertNotIn("learner@example.invalid", logs)

    def test_reset_request_stays_neutral_when_provider_raises(self) -> None:
        self._configure_smtp()
        with patch(
            "app.services.auth_service._check_and_increment_rate_limit",
            return_value=True,
        ), patch(
            "app.services.auth_service._load_user_by_email",
            return_value={"user_id": "usr_test", "email": "learner@example.invalid"},
        ), patch(
            "app.services.auth_service._record_password_reset_token",
        ), patch(
            "app.services.auth_service.send_password_reset_email",
            side_effect=RuntimeError("provider unavailable"),
        ), patch(
            "app.services.auth_service._persist_auth_state",
        ), self.assertLogs("floently.auth.password_reset", level="ERROR") as captured:
            result = request_password_reset(
                email="learner@example.invalid",
                request_ip="127.0.0.1",
            )

        self.assertEqual(result, {"message": PASSWORD_RESET_NEUTRAL_MESSAGE})
        logs = "\n".join(captured.output)
        self.assertIn("provider error", logs.lower())
        self.assertNotIn("learner@example.invalid", logs)


if __name__ == "__main__":
    unittest.main()
