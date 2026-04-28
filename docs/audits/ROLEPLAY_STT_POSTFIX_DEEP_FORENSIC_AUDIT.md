# ROLEPLAY STT Postfix Deep Forensic Audit

Date: 2026-04-23  
Scope: Audit-only (no code changes)

## Executive Summary

The canonical roleplay+voice path is live and used. The failure is not caused by stale route wiring.

The error text "Voice transcription is temporarily unavailable. Please try again in a moment." is produced by backend STT failure classification in `apps/backend/app/services/voice_service.py` when provider failures do not match silence/too-short/config/connectivity marker buckets.

Direct reproduction against a real roleplay recording (`apps/backend/runtime/uploads/voice/roleplay-session/recording.m4a`) returned:
- OpenAI STT: AuthenticationError 401 invalid API key
- Google STT: PermissionDenied 403 Speech-to-Text API disabled
- backend response: `error_code=STT_PROVIDER_ERROR`, `error_message="Voice transcription is temporarily unavailable..."`, `stt_available=false`

So roleplay fails because both configured STT providers fail at provider/auth/service level, then the classifier maps those reasons to a generic temporary-unavailable message.

## Canonical Path Live Status

Confirmed live:
- Frontend recorder uses shared STT API helper only:
  - `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`
  - `packages/core/api/voice.ts` -> `POST /api/v1/voice/stt/transcriptions`
- Backend router mounts canonical v1 voice and roleplay routers:
  - `apps/backend/app/router.py`
  - `apps/backend/app/routers/v1_voice.py`
  - `apps/backend/app/routers/v1_roleplay.py`
- STT service implementation is canonical:
  - `apps/backend/app/services/voice_service.py`

No active runtime calls to deleted `/voice/*` compatibility endpoints were found in `apps/client`, `packages/core`, or mounted backend router code.

## End-to-End Live Execution Map

1. UI entry:
   `apps/client/state/ProfessionalRoute.tsx` or `apps/client/state/SpeakingRoute.tsx`
2. Roleplay screen:
   `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx`
3. Mic flow:
   `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`
4. STT request builder:
   `packages/core/api/voice.ts::transcribeVoiceAudio`
   - sends multipart `file`, `mime_type`, `locale`, `mode`, `session_id`, `speaking_session_id`
5. Backend route:
   `apps/backend/app/routers/v1_voice.py::/api/v1/voice/stt/transcriptions`
6. Backend STT service:
   `apps/backend/app/services/voice_service.py::transcribe_audio`
7. File persistence:
   `apps/backend/app/runtime/voice.py::save_voice_file`
8. Provider attempts:
   `apps/backend/app/services/voice_service.py::_transcribe_with_openai`
   `apps/backend/app/services/voice_service.py::_transcribe_with_google`
9. Failure classification:
   `apps/backend/app/services/voice_service.py::_classify_stt_failures`
10. Frontend interpretation:
   `packages/core/api/voice.ts` throws server `error_message`
   `useRoleplayRecorder.ts::normalizeRecorderError` returns raw message when not matched by local regex mappers.

## Root Cause

Primary root-cause location:
- `apps/backend/app/services/voice_service.py`
  - provider failures occur (OpenAI 401 invalid key; Google 403 API disabled)
  - classifier falls through to generic `STT_PROVIDER_ERROR`
  - user receives "Voice transcription is temporarily unavailable..."

Operational/config root cause:
- OpenAI key is invalid for transcription call (401).
- Google Speech-to-Text API is disabled/not activated for the configured project (403 SERVICE_DISABLED).

## Contract and Drift Analysis

Frontend:
- Mic permission and recording are present and healthy by code path.
- Audio uploads occur; backend recorded files exist with non-trivial sizes (`recording.m4a` ~62 KB in roleplay session path).
- UI message originates from backend `error_message`, not hardcoded frontend phrase.

Shared package:
- `packages/core/api/voice.ts` is authoritative STT/TTS transport.
- `packages/core/api/roleplay.ts` no longer performs STT/TTS itself.
- A compatibility-style wrapper remains (`packages/core/api/voiceTts.ts`) but roleplay path does not use it.

Backend:
- Route and service wiring is canonical.
- STT failures are surfaced, but classification is coarse for auth/permissions failures (mapped to temporary unavailability).

## Remnants / Stale Paths / Risk Notes

1. `packages/core/api/voiceTts.ts`
   - Remaining wrapper around `requestVoiceTts`.
   - Not part of roleplay STT path; low risk but still duplicate API surface.

2. `apps/backend/tools/phase_5_2_live_verification.py`
   - Contains route string checks; not runtime.
   - Not a failure cause, but can become stale authority if docs/scripts diverge.

3. `dev.log` visibility gap:
   - `dev.log` currently contains lifecycle lines, but not STT warning stack traces.
   - This masked the actionable provider errors during normal debugging.

## Exact Source of "Voice transcription is temporarily unavailable"

Backend source:
- `apps/backend/app/services/voice_service.py::_classify_stt_failures(...)`
  - default return branch emits:
    - `error_code="STT_PROVIDER_ERROR"`
    - `error_message="Voice transcription is temporarily unavailable. Please try again in a moment."`

Frontend pass-through:
- `packages/core/api/voice.ts::transcribeVoiceAudio(...)`
  - throws when `error_message` exists.
- `apps/client/features/speaking/hooks/useRoleplayRecorder.ts::normalizeRecorderError(...)`
  - unmatched strings are returned directly.

## Severity Ranking

1. Critical: STT providers unusable in environment (OpenAI 401 + Google 403).
2. High: Backend classifier maps credential/service-permission failures to generic temporary-unavailable text, reducing actionability.
3. Medium: Operational logging path (`dev.log`) does not reliably surface STT provider stack traces in normal run flow.
4. Low: residual wrapper (`packages/core/api/voiceTts.ts`) creates extra surface area but not this outage.

## Why Failure Persists After Consolidation

Consolidation fixed routing/duplication, but not provider readiness. The live path is clean; it now consistently reaches STT, where provider auth/service configuration fails. Because failure classification defaults to generic message, users still see roleplay STT failure despite architectural cleanup.

## Critical Questions (Explicit Answers)

1. Is the canonical live path truly the one being executed?  
   Yes.
2. Any remnants of deleted routes/imports/helpers still in use?  
   Not in live roleplay STT path.
3. Any stale imports/exports/types/calls causing drift?  
   Minor residual wrapper (`voiceTts.ts`), not causal for this failure.
4. Is microphone capture healthy?  
   Yes by path and persisted upload evidence.
5. Is recorded audio non-empty and valid?  
   Yes; roleplay m4a upload exists and is >60 KB.
6. MIME/container/extension chain correct end to end?  
   Yes for tested roleplay sample (`audio/m4a` accepted).
7. Is frontend sending exactly what backend expects?  
   Yes (`file` + `mime_type` + session/mode/locale fields).
8. Is backend receiving and saving file correctly?  
   Yes (`save_voice_file` path written successfully).
9. Is normalization succeeding?  
   Not the blocking stage in reproduced failure; provider calls were reached.
10. Is transcription running, and what does it return?  
    Yes; both providers run and fail (OpenAI 401, Google 403), transcript null.
11. Backend return shape on failure?  
    `ok=true`, `transcript=null`, `stt_available=false`, `failure_reasons`, `error_code`, `error_message`.
12. Where is temporary-unavailable message decided?  
    `voice_service.py::_classify_stt_failures` default branch.
13. Is UI message accurate?  
    Partially; true that STT is unavailable, but it masks actionable credential/API enablement failures.
14. Remaining hidden duplicate/conflicting functions?  
    Only low-risk wrapper duplication (`voiceTts.ts`) outside causal path.
15. Prior consolidation remnant still creating regression?  
    No route remnant regression found; failure is provider/config + coarse classification.
16. Why still failing after consolidation?  
    Canonical path now reaches failing providers consistently.
17. Exact root-cause files/logic now?  
    `apps/backend/app/services/voice_service.py` (provider calls + classifier), plus runtime provider credentials/API project configuration.
18. Minimum surgical fix set needed next?  
    See dedicated fix spec in `ROLEPLAY_STT_POSTFIX_FIX_SPEC.md`.

## Minimum Surgical Fix Set (Do Not Implemented Here)

See:
- `docs/audits/ROLEPLAY_STT_POSTFIX_FIX_SPEC.md`

