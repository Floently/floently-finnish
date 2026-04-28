# ROLEPLAY STT Provider Runtime Findings

Date: 2026-04-23

## Runtime Config Sources Used

Backend reads environment in:
- `apps/backend/app/core/config.py`
  - loads repo `.env`
  - loads backend `.env`
  - keeps pre-existing process env values authoritative when already set

STT-related runtime fields:
- `settings.openai_api_key`
  - now supports `OPENAI_API_KEY`, `OPENAI_STT_API_KEY`, `PUHIS_OPENAI_API_KEY`
- `settings.google_tts_credentials_path`
  - now supports `GOOGLE_TTS_CREDENTIALS_PATH`, `GOOGLE_STT_CREDENTIALS_PATH`, `GOOGLE_APPLICATION_CREDENTIALS`

## Runtime Snapshot (from backend process context)

- `openai_api_key_present`: true
- `google_credentials_path`: set
- `google_credentials_path_exists`: true
- `google_application_credentials_env_present`: true
- `openai_api_key_env_present`: true
- `openai_stt_api_key_env_present`: false

This confirms values are loaded in backend runtime; the issue is provider validity/permission state, not blank config at process level.

## Provider Attempt Order

Current order in STT path:
1. OpenAI
2. Google

Implementation location:
- `apps/backend/app/services/voice_service.py::_transcribe_best_effort`

## Provider Outcomes (real recording reproduction)

Input:
- `apps/backend/runtime/uploads/voice/roleplay-session/recording.m4a`

Observed:
- OpenAI: `AuthenticationError` (401 invalid API key)
- Google: success

Result:
- transcript returned successfully via Google.

## Why "keys were set" but failures still happened

Setting keys is not sufficient by itself:
- OpenAI key can be present but invalid/revoked/wrong project.
- Google credentials file can exist while one API/project path fails in another run (permission/API enablement drift).
- Without explicit failure classes, these conditions looked like a generic outage.

## Code-Level Fixes Applied for Findings

- Added explicit auth/permission failure classes in backend STT classifier.
- Added provider-attempt/result telemetry in STT response payload.
- Added runtime alias support for likely env-name mismatch patterns.
- Preserved canonical architecture (no compatibility routes reintroduced).

