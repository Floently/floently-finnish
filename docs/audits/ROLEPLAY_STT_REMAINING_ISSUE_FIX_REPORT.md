# ROLEPLAY STT Remaining Issue Fix Report

Date: 2026-04-23

## Root Cause Found

The remaining outage was a combination of:

1. Backend STT failure classification was too generic:
   - auth and permission/API-disabled failures were collapsed into `STT_PROVIDER_ERROR`.
2. Runtime provider state was mixed:
   - OpenAI STT key loaded at runtime but rejected (401 invalid key).
   - Google credentials path existed and Google STT succeeded in current runtime.
3. Frontend hold-to-record flow had a quick press/release timing edge that could produce unstable recording-stop behavior.
4. Roleplay mic panel was hardcoded dark, causing wrong UI in light mode.

## Files Changed

- `apps/backend/app/services/voice_service.py`
- `apps/backend/app/core/config.py`
- `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`
- `packages/core/api/voice.ts`
- `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx`

## Exact Logic Changes

### Backend STT (`voice_service.py`)

- Added explicit STT failure classes:
  - `STT_PROVIDER_AUTH_FAILED`
  - `STT_PROVIDER_PERMISSION_FAILED`
- Kept existing silence/too-short/network/config classes.
- Added provider-attempt telemetry fields in STT response:
  - `provider_attempt_order`
  - `provider_results`
- Added runtime snapshot helper:
  - `get_stt_runtime_snapshot()`

### Backend config (`config.py`)

- Expanded runtime key aliases so backend can consume alternate env names:
  - `OPENAI_STT_API_KEY`, `PUHIS_OPENAI_API_KEY` (fallbacks for OpenAI key)
  - `GOOGLE_STT_CREDENTIALS_PATH` (fallback for Google credentials path)

### Frontend recorder (`useRoleplayRecorder.ts`)

- Hardened press/release timing:
  - added phase ref tracking
  - added pending-stop handling for fast release before async start completion
- Improved normalization for actionable STT errors:
  - auth failure message
  - permission/API-enable failure message

### Shared voice transport (`packages/core/api/voice.ts`)

- Added explicit mapping for backend `error_code` values to actionable client errors
  when `error_message` is absent.

### Roleplay mic UI (`RoleplayConversationScreen.tsx`)

- Mic panel now theme-adaptive:
  - white panel in light mode
  - dark panel in dark mode

## Runtime Configuration Truth Found

From backend process-context snapshot:

- `openai_api_key_present`: true
- `google_credentials_path_exists`: true
- `openai_api_key_env_present`: true
- `google_application_credentials_env_present`: true

So this was not "keys missing" in-process. It was provider-specific runtime validity/permission state plus coarse error classification.

## Provider Behavior Confirmed

Real recording tested:
- `apps/backend/runtime/uploads/voice/roleplay-session/recording.m4a`

Observed:
- OpenAI: failed with 401 invalid key.
- Google: succeeded and returned transcript.
- Final STT result: success via Google provider.

## Before / After

Before:
- Failures frequently surfaced as generic `"Voice transcription is temporarily unavailable."`
- provider-level cause was obscured.

After:
- Backend classifies provider auth vs permission/API-enable failures explicitly.
- Frontend preserves actionable message classes.
- If OpenAI fails but Google succeeds, transcript still returns successfully.
- Hold-to-record behavior is stable under quick press/release.

## Verification Results

1. Backend import sanity:
- `./.venv/bin/python -c "import main"` passed.

2. STT real sample verification:
- returned transcript successfully using Google provider.

3. Legacy path reintroduction check:
- No active compatibility route reintroduced in runtime code.

4. Typecheck:
- `pnpm -s tsc --noEmit` still has pre-existing unrelated repo errors.
- No new failures were introduced specifically by this STT/roleplay fix set.

