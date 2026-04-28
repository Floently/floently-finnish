"""
Media, runtime contract, and evaluation tests.
Run from repo root: venv/bin/python -m engine.tests.test_media_pipeline
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path
from unittest.mock import patch

import json


def _with_temp_media_roots():
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod

    tmp = tempfile.TemporaryDirectory()
    tmp_path = Path(tmp.name)
    old_cache = cache_mod.CACHE_DIR
    old_registry = registry_mod.REGISTRY_PATH
    cache_mod.CACHE_DIR = tmp_path / "audio_cache"
    cache_mod.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    registry_mod.REGISTRY_PATH = tmp_path / "media_registry.json"
    registry_mod.ensure_registry()
    return tmp, old_cache, old_registry


def hash_determinism_test() -> None:
    from engine.media.dialogue_audio_builder import hash_dialogue
    from engine.media.tts_engine import hash_transcript

    single_a = hash_transcript("Hei maailma", "yki_standard_female")
    single_b = hash_transcript("Hei maailma", "yki_standard_female")
    assert single_a == single_b

    dialogue_turns = [
        {"speaker": "A", "text": "Hei"},
        {"speaker": "B", "text": "Moi"},
    ]
    voices = {"A": "yki_standard_female", "B": "yki_standard_male"}
    assert hash_dialogue(dialogue_turns, voices) == hash_dialogue(dialogue_turns, voices)
    print("hash_determinism_test PASSED")


def cache_reuse_test() -> None:
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod
    from engine.media.tts_engine import generate_audio

    tmp, old_cache, old_registry = _with_temp_media_roots()
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    os.environ["YKI_TTS_PROVIDER"] = "fixture"
    try:
        first = generate_audio("Sama teksti", "yki_standard_female", audio_asset_id="asset-a")
        second = generate_audio("Sama teksti", "yki_standard_female", audio_asset_id="asset-b")
        assert first["audio_path"] == second["audio_path"]
        assert Path(str(first["audio_path"])).exists()
        assert registry_mod.lookup_audio("asset-b") is not None
        print("cache_reuse_test PASSED")
    finally:
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        cache_mod.CACHE_DIR = old_cache
        registry_mod.REGISTRY_PATH = old_registry
        tmp.cleanup()


def dialogue_stitching_test() -> None:
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod
    from engine.media.dialogue_audio_builder import build_dialogue_audio
    from engine.media.tts_engine import DeterministicFixtureProvider

    tmp, old_cache, old_registry = _with_temp_media_roots()
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    os.environ["YKI_TTS_PROVIDER"] = "fixture"
    try:
        turns = [
            {"speaker": "A", "text": "Lyhyt vastaus"},
            {"speaker": "B", "text": "Tama on hieman pidempi vastaus dialogiin."},
        ]
        result = build_dialogue_audio(turns, audio_asset_id="dialogue-asset")
        payload = Path(str(result["audio_path"])).read_bytes()
        fixture = DeterministicFixtureProvider()
        expected = (
            fixture.synthesize("Lyhyt vastaus", "yki_standard_female")
            + fixture.synthesize("Tama on hieman pidempi vastaus dialogiin.", "yki_standard_male")
        )
        assert payload == expected
        assert result["metadata"]["pause_map_ms"] == [500, 500]
        print("dialogue_stitching_test PASSED")
    finally:
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        cache_mod.CACHE_DIR = old_cache
        registry_mod.REGISTRY_PATH = old_registry
        tmp.cleanup()


def audio_api_streaming_test() -> None:
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod
    from engine.api.audio_routes import audio_health, stream_audio_asset
    from engine.media.tts_engine import generate_audio

    tmp, old_cache, old_registry = _with_temp_media_roots()
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    os.environ["YKI_TTS_PROVIDER"] = "fixture"
    try:
        generate_audio("Kuunneltava testi", "yki_standard_female", audio_asset_id="audio-api-asset")
        response = stream_audio_asset("audio-api-asset")
        assert response.media_type == "audio/mpeg"
        assert str(response.path).endswith(".mp3")
        assert Path(str(response.path)).read_bytes().startswith(b"ID3-FIXTURE-")
        health = audio_health()
        assert health["tts"] == "ok"
        assert health["audio_storage"] == "ok"
        print("audio_api_streaming_test PASSED")
    finally:
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        cache_mod.CACHE_DIR = old_cache
        registry_mod.REGISTRY_PATH = old_registry
        tmp.cleanup()


def audio_resolver_engine_fallback_test() -> None:
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod
    import engine.services.audio_resolver as resolver_mod

    tmp, old_cache, old_registry = _with_temp_media_roots()
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    os.environ["YKI_TTS_PROVIDER"] = "fixture"
    try:
        with patch.object(resolver_mod.httpx, "post", side_effect=RuntimeError("503 Service Unavailable")):
            resolved = resolver_mod.resolve_audio(
                transcript="Kuuntele haastattelu ja vastaa kysymyksiin.",
                audio_asset_id="resolver-fallback-audio",
                voice="female",
            )

        assert resolved["provider"] == "fixture"
        assert resolved["url"] == "/api/audio/resolver-fallback-audio.mp3"
        record = registry_mod.lookup_audio("resolver-fallback-audio")
        assert record is not None
        assert Path(str(record["audio_path"])).exists()
        print("audio_resolver_engine_fallback_test PASSED")
    finally:
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        cache_mod.CACHE_DIR = old_cache
        registry_mod.REGISTRY_PATH = old_registry
        tmp.cleanup()


def audio_resolver_uses_development_fallback_without_provider_credentials_test() -> None:
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod
    import engine.services.audio_resolver as resolver_mod

    tmp, old_cache, old_registry = _with_temp_media_roots()
    old_environment = os.environ.get("ENVIRONMENT")
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    old_eleven = os.environ.get("ELEVENLABS_API_KEY")
    old_azure_key = os.environ.get("AZURE_SPEECH_KEY")
    old_azure_region = os.environ.get("AZURE_SPEECH_REGION")
    old_openai = os.environ.get("OPENAI_API_KEY")
    os.environ["ENVIRONMENT"] = "development"
    os.environ.pop("YKI_TTS_PROVIDER", None)
    os.environ.pop("ELEVENLABS_API_KEY", None)
    os.environ.pop("AZURE_SPEECH_KEY", None)
    os.environ.pop("AZURE_SPEECH_REGION", None)
    os.environ.pop("OPENAI_API_KEY", None)
    try:
        with patch.object(resolver_mod.httpx, "post", side_effect=RuntimeError("503 Service Unavailable")):
            resolved = resolver_mod.resolve_audio(
                transcript="Tama toimii ilman ulkoisia TTS-avaimia.",
                audio_asset_id="resolver-dev-fallback-audio",
                voice="female",
            )

        assert resolved["provider"] == "fixture"
        assert resolved["url"] == "/api/audio/resolver-dev-fallback-audio.mp3"
        assert registry_mod.lookup_audio("resolver-dev-fallback-audio") is not None
        print("audio_resolver_uses_development_fallback_without_provider_credentials_test PASSED")
    finally:
        if old_environment is None:
            os.environ.pop("ENVIRONMENT", None)
        else:
            os.environ["ENVIRONMENT"] = old_environment
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        if old_eleven is None:
            os.environ.pop("ELEVENLABS_API_KEY", None)
        else:
            os.environ["ELEVENLABS_API_KEY"] = old_eleven
        if old_azure_key is None:
            os.environ.pop("AZURE_SPEECH_KEY", None)
        else:
            os.environ["AZURE_SPEECH_KEY"] = old_azure_key
        if old_azure_region is None:
            os.environ.pop("AZURE_SPEECH_REGION", None)
        else:
            os.environ["AZURE_SPEECH_REGION"] = old_azure_region
        if old_openai is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = old_openai
        cache_mod.CACHE_DIR = old_cache
        registry_mod.REGISTRY_PATH = old_registry
        tmp.cleanup()


def audio_resolver_remains_strict_in_production_without_providers_test() -> None:
    import engine.services.audio_resolver as resolver_mod

    old_environment = os.environ.get("ENVIRONMENT")
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    old_eleven = os.environ.get("ELEVENLABS_API_KEY")
    old_azure_key = os.environ.get("AZURE_SPEECH_KEY")
    old_azure_region = os.environ.get("AZURE_SPEECH_REGION")
    old_openai = os.environ.get("OPENAI_API_KEY")
    os.environ["ENVIRONMENT"] = "production"
    os.environ.pop("YKI_TTS_PROVIDER", None)
    os.environ.pop("ELEVENLABS_API_KEY", None)
    os.environ.pop("AZURE_SPEECH_KEY", None)
    os.environ.pop("AZURE_SPEECH_REGION", None)
    os.environ.pop("OPENAI_API_KEY", None)
    try:
        with patch.object(resolver_mod.httpx, "post", side_effect=RuntimeError("503 Service Unavailable")):
            try:
                resolver_mod.resolve_audio(
                    transcript="Tuotannossa ei saa kayttaa fixture-fallbackia.",
                    audio_asset_id="resolver-prod-failure-audio",
                    voice="female",
                )
            except resolver_mod.MediaIntegrityError:
                print("audio_resolver_remains_strict_in_production_without_providers_test PASSED")
            else:
                raise AssertionError("Expected MediaIntegrityError in production without providers")
    finally:
        if old_environment is None:
            os.environ.pop("ENVIRONMENT", None)
        else:
            os.environ["ENVIRONMENT"] = old_environment
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        if old_eleven is None:
            os.environ.pop("ELEVENLABS_API_KEY", None)
        else:
            os.environ["ELEVENLABS_API_KEY"] = old_eleven
        if old_azure_key is None:
            os.environ.pop("AZURE_SPEECH_KEY", None)
        else:
            os.environ["AZURE_SPEECH_KEY"] = old_azure_key
        if old_azure_region is None:
            os.environ.pop("AZURE_SPEECH_REGION", None)
        else:
            os.environ["AZURE_SPEECH_REGION"] = old_azure_region
        if old_openai is None:
            os.environ.pop("OPENAI_API_KEY", None)
        else:
            os.environ["OPENAI_API_KEY"] = old_openai


def public_runtime_contract_test() -> None:
    import engine.exam.exam_session_engine_v3_2 as session_mod
    import engine.exam.speaking_controller as speaking_mod
    from engine.schema.runtime_contract_v1 import ExamRuntimeContract

    try:
        def _resolve_audio(*, transcript: str, audio_asset_id: str, voice: str, speed: float = 1.0):
            return {
                "url": f"http://127.0.0.1:8000/api/tts/audio/{audio_asset_id}.mp3",
                "duration_seconds": 4.5 if voice == "female" else 5.0,
                "provider": "elevenlabs",
                "replayable": True,
            }

        original_resolve_audio = session_mod.resolve_audio
        original_speaking_resolve_audio = speaking_mod.resolve_audio
        session_mod.resolve_audio = _resolve_audio
        speaking_mod.resolve_audio = _resolve_audio
        exam = {
            "level_band": "B1_B2",
            "reading": [],
            "listening": [
                {
                    "id": "listen-1",
                    "content": {
                        "instruction": "Kuuntele.",
                        "materials": {
                            "transcript": "Tata ei saa nakya.",
                            "audio_asset_id": "listen-audio-1",
                        },
                        "questions": [
                            {
                                "id": "q1",
                                "prompt": "Mita kuulit?",
                                "options": ["A", "B"],
                                "correct_index": 0,
                            }
                        ],
                        "timing": {"recommended_minutes": 2},
                    },
                }
            ],
            "writing": [],
            "speaking": [
                {
                    "id": "speak-1",
                    "task_type": "speaking",
                    "mode": "recording_response",
                    "content": {
                        "instruction": "Keskustele suomeksi.",
                        "mode": "recording_response",
                        "prompt_audio_text": "Hei, etsitko lahjaa?",
                        "timing": {"recommended_minutes": 1},
                    },
                }
            ],
        }
        public_exam = session_mod.serialize_exam_for_client(exam, session_id="contract-test")
        ExamRuntimeContract(**public_exam)
        prompt_screen = public_exam["screens"][0]
        questions_screen = public_exam["screens"][1]
        speaking_task = next(
            screen for screen in public_exam["screens"] if screen["screen_type"] == "speaking_task"
        )
        assert public_exam["contract_type"] == "exam_runtime"
        assert public_exam["runtime_schema_version"] == "1.0"
        assert prompt_screen["payload"]["audio"]["provider"] == "elevenlabs"
        assert prompt_screen["payload"]["audio"]["url"].startswith("http://127.0.0.1:8000/api/tts/audio/")
        assert "transcript" not in json.dumps(public_exam, ensure_ascii=False)
        assert prompt_screen["screen_type"] == "listening_prompt"
        assert questions_screen["screen_type"] == "listening_questions"
        assert speaking_task["payload"]["audio"]["provider"] == "elevenlabs"
        assert speaking_task["payload"]["audio"]["url"].startswith("http://127.0.0.1:8000/api/tts/audio/")
        assert speaking_task["payload"]["mode"] == "recording_response"
        assert speaking_task["payload"]["instruction"] == "Keskustele suomeksi."
        print("public_runtime_contract_test PASSED")
    finally:
        session_mod.resolve_audio = original_resolve_audio
        speaking_mod.resolve_audio = original_speaking_resolve_audio


def media_integrity_failure_falls_back_to_engine_tts_test() -> None:
    import engine.media.audio_cache_manager as cache_mod
    import engine.media.media_registry as registry_mod
    import engine.services.audio_resolver as resolver_mod
    import engine.exam.exam_session_engine_v3_2 as session_mod

    tmp, old_cache, old_registry = _with_temp_media_roots()
    old_provider = os.environ.get("YKI_TTS_PROVIDER")
    os.environ["YKI_TTS_PROVIDER"] = "fixture"
    try:
        exam = {
            "level_band": "B1_B2",
            "reading": [],
            "listening": [
                {
                    "id": "listen-fail-safe",
                    "content": {
                        "instruction": "Kuuntele.",
                        "materials": {
                            "transcript": "Tata ei saada generoida nyt.",
                            "audio_asset_id": "listen-fail-safe-audio",
                        },
                        "questions": [],
                        "timing": {"recommended_minutes": 1},
                    },
                }
            ],
            "writing": [],
            "speaking": [],
        }
        with patch.object(resolver_mod.httpx, "post", side_effect=RuntimeError("503 Service Unavailable")):
            public_exam = session_mod.serialize_exam_for_client(exam, session_id="runtime-fail-safe")

        listening_prompt = next(
            screen for screen in public_exam["screens"] if screen["screen_type"] == "listening_prompt"
        )
        assert listening_prompt["payload"]["audio"]["provider"] == "fixture"
        assert listening_prompt["payload"]["audio"]["url"] == "/api/audio/listen-fail-safe-audio.mp3"
        record = registry_mod.lookup_audio("listen-fail-safe-audio")
        assert record is not None
        assert Path(str(record["audio_path"])).exists()
        print("media_integrity_failure_falls_back_to_engine_tts_test PASSED")
    finally:
        if old_provider is None:
            os.environ.pop("YKI_TTS_PROVIDER", None)
        else:
            os.environ["YKI_TTS_PROVIDER"] = old_provider
        cache_mod.CACHE_DIR = old_cache
        registry_mod.REGISTRY_PATH = old_registry
        tmp.cleanup()


def evaluation_scoring_test() -> None:
    from engine.evaluation.writing_evaluator import evaluate_writing

    weak = evaluate_writing("Hei.", prompt="Kirjoita harrastuksista ja perustele mielipiteesi.")
    strong = evaluate_writing(
        (
            "Kirjoitan harrastuksistani, koska liikunta auttaa minua jaksamaan arjessa. "
            "Lisaksi tapaan ystaviani viikoittain, ja siksi harrastus on minulle tarkea. "
            "Toisaalta kustannukset voivat olla suuria, mutta yhteinen tekeminen on silti arvokasta."
        ),
        prompt="Kirjoita harrastuksista ja perustele mielipiteesi.",
    )
    assert strong["overall"] >= weak["overall"]
    assert strong["content"] >= weak["content"]
    print("evaluation_scoring_test PASSED")


def main() -> None:
    hash_determinism_test()
    cache_reuse_test()
    dialogue_stitching_test()
    audio_api_streaming_test()
    audio_resolver_engine_fallback_test()
    audio_resolver_uses_development_fallback_without_provider_credentials_test()
    audio_resolver_remains_strict_in_production_without_providers_test()
    public_runtime_contract_test()
    media_integrity_failure_falls_back_to_engine_tts_test()
    evaluation_scoring_test()
    print("All media and evaluation tests passed.")


if __name__ == "__main__":
    main()
