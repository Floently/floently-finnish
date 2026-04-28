from __future__ import annotations

import unittest
from unittest.mock import patch

from app.core.config import SETTINGS
from app.core.errors import AppError
from app.integrations.google_oauth_service import complete_google_id_token_auth


class GoogleOauthNativeTests(unittest.TestCase):
    def setUp(self) -> None:
        self._original_client_id = SETTINGS.google_oauth_client_id
        self._original_web_client_id = SETTINGS.google_oauth_web_client_id
        self._original_android_client_id = SETTINGS.google_oauth_android_client_id
        self._original_allowed_client_ids = SETTINGS.google_oauth_allowed_client_ids

    def tearDown(self) -> None:
        object.__setattr__(SETTINGS, "google_oauth_client_id", self._original_client_id)
        object.__setattr__(SETTINGS, "google_oauth_web_client_id", self._original_web_client_id)
        object.__setattr__(SETTINGS, "google_oauth_android_client_id", self._original_android_client_id)
        object.__setattr__(SETTINGS, "google_oauth_allowed_client_ids", self._original_allowed_client_ids)

    def test_accepts_android_audience_when_configured(self) -> None:
        object.__setattr__(SETTINGS, "google_oauth_client_id", "web-client-id")
        object.__setattr__(SETTINGS, "google_oauth_web_client_id", "web-client-id")
        object.__setattr__(SETTINGS, "google_oauth_android_client_id", "android-client-id")
        object.__setattr__(SETTINGS, "google_oauth_allowed_client_ids", tuple())

        token_info = {
            "iss": "https://accounts.google.com",
            "aud": "android-client-id",
            "exp": "4102444800",
            "email": "native.user@floently.com",
            "sub": "google-sub-123",
            "name": "Native User",
            "email_verified": "true",
        }

        with patch("app.integrations.google_oauth_service._google_json_request", return_value=token_info):
            with patch("app.integrations.google_oauth_service.login_google_identity", return_value={"ok": True}) as mocked_login:
                payload = complete_google_id_token_auth("native-id-token")

        self.assertEqual(payload, {"ok": True})
        mocked_login.assert_called_once_with(
            provider="google",
            external_id="google-sub-123",
            email="native.user@floently.com",
            name="Native User",
        )

    def test_rejects_unknown_audience(self) -> None:
        object.__setattr__(SETTINGS, "google_oauth_client_id", "web-client-id")
        object.__setattr__(SETTINGS, "google_oauth_web_client_id", "web-client-id")
        object.__setattr__(SETTINGS, "google_oauth_android_client_id", "android-client-id")
        object.__setattr__(SETTINGS, "google_oauth_allowed_client_ids", tuple())

        token_info = {
            "iss": "https://accounts.google.com",
            "aud": "wrong-client-id",
            "exp": "4102444800",
            "email": "native.user@floently.com",
            "sub": "google-sub-123",
            "name": "Native User",
            "email_verified": "true",
        }

        with patch("app.integrations.google_oauth_service._google_json_request", return_value=token_info):
            with self.assertRaises(AppError) as error:
                complete_google_id_token_auth("native-id-token")

        self.assertEqual(error.exception.code, "AUTH_PROVIDER_INVALID_TOKEN")


if __name__ == "__main__":
    unittest.main()
