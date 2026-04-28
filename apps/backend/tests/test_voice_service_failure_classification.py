from __future__ import annotations

import unittest

from app.services.voice_service import _classify_stt_failures


class VoiceServiceFailureClassificationTests(unittest.TestCase):
    def test_silence_takes_priority_over_other_provider_failures(self) -> None:
        code, message, stt_available = _classify_stt_failures(
            [
                "openai: openai_returned_empty_transcript",
                "google: google_exception: ServiceUnavailable",
            ]
        )
        self.assertEqual(code, "SILENCE_DETECTED")
        self.assertIn("No speech was detected", message)
        self.assertTrue(stt_available)

    def test_audio_too_short_classification(self) -> None:
        code, message, stt_available = _classify_stt_failures(["google: audio_too_short: 150ms"])
        self.assertEqual(code, "AUDIO_TOO_SHORT")
        self.assertIn("too short", message.lower())
        self.assertTrue(stt_available)

    def test_configuration_failure_classification(self) -> None:
        code, message, stt_available = _classify_stt_failures(
            [
                "openai: openai_not_configured",
                "google: google_speech_package_unavailable: ModuleNotFoundError('google')",
            ]
        )
        self.assertEqual(code, "STT_NOT_CONFIGURED")
        self.assertIn("not configured", message.lower())
        self.assertFalse(stt_available)

    def test_connectivity_failure_classification(self) -> None:
        code, message, stt_available = _classify_stt_failures(
            ["openai: openai_exception: APIConnectionError: Connection error."]
        )
        self.assertEqual(code, "STT_PROVIDER_UNREACHABLE")
        self.assertIn("unreachable", message.lower())
        self.assertFalse(stt_available)


if __name__ == "__main__":
    unittest.main()
