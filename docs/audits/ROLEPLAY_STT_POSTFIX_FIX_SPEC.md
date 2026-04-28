# ROLEPLAY STT Postfix Fix Spec (No Implementation)

## Objective

Restore roleplay voice transcription reliability and make failure messaging/actionability exact.

## Exact Files To Change Next

1. `apps/backend/app/services/voice_service.py`
2. `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`
3. (optional but recommended) `scripts/dev.sh` or equivalent log filtering path that writes `dev.log`
4. runtime/deployment secret/config source for:
   - `OPENAI_API_KEY`
   - Google project/credentials + Speech-to-Text API enablement

## Exact Areas To Inspect/Change

### 1) Backend STT failure classification

File: `apps/backend/app/services/voice_service.py`

Areas:
- `_classify_stt_failures(...)`
- marker lists (`_CONFIG_FAILURE_MARKERS`, connectivity markers, etc.)

Required changes:
- Add explicit markers for provider auth/permission/service-disabled cases (for example invalid API key, permission denied, service disabled, quota/project access failures).
- Map these to precise `error_code` values (for example `STT_PROVIDER_AUTH_ERROR`, `STT_PROVIDER_PERMISSION_ERROR`) and accurate messages.
- Keep current silence/too-short behavior unchanged.

Why:
- Current fallthrough returns generic `STT_PROVIDER_ERROR` + temporary-unavailable text, which hides the real remediation path.

### 2) Frontend message normalization

File: `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`

Area:
- `normalizeRecorderError(...)`

Required changes:
- Preserve backend actionable errors (auth/permission/config) without collapsing them into generic phrases.
- Keep user-friendly wording for silence/too-short network-only cases.

Why:
- Roleplay UI should reflect actionable backend reason classes when available.

### 3) Operational logging visibility

File(s):
- local run/log filtering path that produces `/home/vitus/floently-finnish/dev.log`

Required changes:
- Ensure STT warnings from logger `floently.voice.service` are captured in dev log output.
- Keep sensitive token values masked/redacted.

Why:
- Current `dev.log` lacks STT stack traces, which delays diagnosis.

### 4) Provider configuration fix (non-code but mandatory)

Required actions:
- Replace invalid OpenAI API key for backend runtime.
- Enable Google Cloud Speech-to-Text API for configured project and verify credentials have permission.
- Re-run STT smoke test against real roleplay recording.

Why:
- Reproduced failures are provider readiness failures, not route or recorder failures.

## What Not To Touch

- Do not reintroduce deleted compatibility routes (`/voice/*`, `/api/v1/roleplay/sessions*`).
- Do not fork roleplay STT/TTS logic back into `packages/core/api/roleplay.ts`.
- Do not alter roleplay runtime session progression logic as part of STT outage fix.

## Post-Fix Test Plan

1. Backend unit-level:
   - add/extend tests for `_classify_stt_failures` with auth/permission/service-disabled signatures.
2. API-level:
   - call `POST /api/v1/voice/stt/transcriptions` with valid recorded m4a/wav and assert non-empty transcript when providers are healthy.
3. Negative-path API:
   - assert precise `error_code` and message for auth failure and permission failure.
4. Frontend roleplay:
   - verify mic record -> STT -> submit turn flow completes.
   - verify no generic temporary-unavailable message on credential/API-disabled failures when more specific error is available.
5. Logging:
   - confirm STT warnings/errors appear in `dev.log` with sensitive data masked.

