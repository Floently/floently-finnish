# Roleplay / Voice Forensic Audit

Audit date: April 23, 2026

## Executive Summary

The roleplay and voice system is unstable because the repo is running a mixed architecture:

1. The backend mounts both a new `/api/v1` roleplay stack and older root-level compatibility voice routes at the same time.
2. The frontend roleplay flow calls a shared voice layer that recently changed shape, but the shared roleplay helper still expects the old STT contract.
3. Several fallbacks swallow real failures and turn them into generic “voice unavailable” behavior, which hides the actual break point.
4. Some files that look authoritative are not live in the current execution path, while other compatibility routes remain live and keep old behavior reachable.

The most important immediate root cause is a live frontend contract break:

- [packages/core/api/voice.ts](/home/vitus/floently-finnish/packages/core/api/voice.ts:1) now returns `Promise<string | null>` from `transcribeVoiceAudio(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:198) still treats that result like an object with `sttAvailable` and `transcript`.
- That means the shared roleplay STT helper is internally inconsistent, and when it fails it falls through to compatibility behavior and generic fallback UI instead of exposing the real issue.

The second major root cause is architectural duplication:

- Live new roleplay endpoints exist under `/api/v1/roleplay/session/...` in [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:45).
- Legacy authenticated roleplay endpoints under `/api/v1/roleplay/sessions/...` are still mounted in the same router file.
- New shared voice endpoints exist under `/api/v1/voice/...` in [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:14).
- Root-level compatibility voice aliases still exist and are mounted via [apps/backend/app/routers/v1_roleplay_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay_voice.py:39).

This is why fixes often do not stick: the system has multiple plausible targets, some fixes land in shared helpers while live callers still use compatibility routes, and some files that appear to be “the voice router” are not mounted at all.

## System Map

### Live frontend roleplay path

1. Entry surface:
   - [apps/client/state/ProfessionalRoute.tsx](/home/vitus/floently-finnish/apps/client/state/ProfessionalRoute.tsx:1) opens roleplay or interview beta via `onOpenRoleplay`.
   - [apps/client/state/SpeakingRoute.tsx](/home/vitus/floently-finnish/apps/client/state/SpeakingRoute.tsx:1) resolves profession, entry mode, default scenario, and mounts the conversation screen.
2. Conversation UI:
   - [apps/client/features/speaking/screens/RoleplayConversationScreen.tsx](/home/vitus/floently-finnish/apps/client/features/speaking/screens/RoleplayConversationScreen.tsx:1)
   - starts session with `startRoleplaySession(...)`
   - records with `useRoleplayRecorder(...)`
   - submits turns with `submitRoleplayTurn(...)`
   - plays AI voice with `speakRoleplayText(...)`
3. Voice record/playback helpers:
   - [apps/client/features/speaking/hooks/useRoleplayRecorder.ts](/home/vitus/floently-finnish/apps/client/features/speaking/hooks/useRoleplayRecorder.ts:1)
   - [apps/client/features/speaking/services/roleplayAudio.ts](/home/vitus/floently-finnish/apps/client/features/speaking/services/roleplayAudio.ts:1)
4. Shared API layer:
   - [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:1)
   - [packages/core/api/voice.ts](/home/vitus/floently-finnish/packages/core/api/voice.ts:1)

### Live backend roleplay path

1. Backend bootstrap:
   - [apps/backend/main.py](/home/vitus/floently-finnish/apps/backend/main.py:1) imports `app.router`.
2. Router mounting authority:
   - [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1)
   - mounts `build_voice_router()`
   - mounts `build_roleplay_router()`
   - mounts `build_roleplay_voice_router()`
3. New roleplay authority:
   - [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:45)
   - delegates new session flow to [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:1)
4. Shared voice authority:
   - [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:14)
   - delegates STT/TTS to [apps/backend/app/services/voice_service.py](/home/vitus/floently-finnish/apps/backend/app/services/voice_service.py:1)
   - file persistence goes through [apps/backend/app/runtime/voice.py](/home/vitus/floently-finnish/apps/backend/app/runtime/voice.py:1)
5. Compatibility voice aliases:
   - [apps/backend/app/routers/v1_roleplay_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay_voice.py:39)

## Live Execution Path

### Roleplay session start

Frontend:

- `ProfessionalRoute` or `SpeakingRoute` chooses profession and optional scenario.
- `RoleplayConversationScreen.startSession()` calls `startRoleplaySession(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:142) posts to `/api/v1/roleplay/session/start`.

Backend:

- [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:60) handles `/api/v1/roleplay/session/start`.
- It calls `runtime_start_session(...)` in [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:296).
- Scenario selection is deterministic in the new runtime:
  - explicit `scenario_id` wins if it exists
  - otherwise `_default_scenario_for_profession(...)` picks the first registered scenario or interview-mode default when `context_label` contains `"interview"`

### Roleplay turn submit

Frontend:

- `RoleplayConversationScreen.submitTranscript(...)` calls `submitRoleplayTurn(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:156) posts to `/api/v1/roleplay/session/{sessionId}/turn`.

Backend:

- [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:78) handles the turn.
- It calls `runtime_submit_turn(...)` in [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:303).
- The runtime stores all state in `STORE` with `user_id="preview"` for the new session flow.

### TTS playback

Frontend:

- `RoleplayConversationScreen` calls `speakRoleplayText(...)`.
- [apps/client/features/speaking/services/roleplayAudio.ts](/home/vitus/floently-finnish/apps/client/features/speaking/services/roleplayAudio.ts:20) calls `requestRoleplayTts(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:178) first tries shared `requestVoiceTts(...)`.

Backend:

- Shared request goes to `/api/v1/voice/tts/requests` in [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:54).
- The resolved audio URL returned by [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py:79) is still root-level `/voice/tts/audio/{cache_key}.{ext}`.
- That root-level audio path works only because [apps/backend/app/routers/v1_roleplay_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay_voice.py:67) is also mounted.

### STT transcription

Frontend:

- `useRoleplayRecorder.stopRecording()` calls `transcribeRoleplayAudio(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:198) tries shared `transcribeVoiceAudio(...)`, then falls back to `/voice/stt`.

Backend:

- Shared path is `/api/v1/voice/stt/transcriptions` in [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:21).
- Compatibility path is `/voice/stt` in [apps/backend/app/routers/v1_roleplay_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay_voice.py:89).
- Both delegate to the same underlying [apps/backend/app/services/voice_service.py](/home/vitus/floently-finnish/apps/backend/app/services/voice_service.py:128) transcription logic.

## Root Causes

### 1. Shared roleplay STT helper is broken against the shared voice contract

Severity: Critical

Evidence:

- [packages/core/api/voice.ts](/home/vitus/floently-finnish/packages/core/api/voice.ts:102) returns `Promise<string | null>` from `transcribeVoiceAudio(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:222) still expects `result.sttAvailable` and `result.transcript`.
- `pnpm -s tsc --noEmit` fails with:
  - `Property 'sttAvailable' does not exist on type 'string'`
  - `Property 'transcript' does not exist on type 'string'`

Impact:

- Shared STT cannot be trusted as a stable authority for roleplay.
- Real failures are converted into compatibility fallbacks and generic UI messages.

### 2. New and legacy roleplay systems are both active

Severity: Critical

Evidence:

- [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:45) mounts:
  - new `/api/v1/roleplay/session/start`
  - new `/api/v1/roleplay/session/{id}/turn`
  - new `/api/v1/roleplay/session/{id}/finish`
  - old `/api/v1/roleplay/sessions`
  - old `/api/v1/roleplay/sessions/{id}/turns`
  - transcript/review legacy endpoints
- New flow uses `runtime.start_session/submit_turn/finish_session`.
- Legacy flow uses `services.roleplay_service`, which is just a wrapper back to legacy runtime-style functions in [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:207).

Impact:

- There is no single roleplay authority.
- Fixes can target the wrong route family and appear to “not stick.”

### 3. Shared voice and compatibility voice routes are both active

Severity: Critical

Evidence:

- Shared routes are mounted by [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:14).
- Compatibility aliases are mounted by [apps/backend/app/routers/v1_roleplay_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay_voice.py:39).
- Shared TTS returns URLs that still point to root-level `/voice/tts/audio/...` from [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py:91).

Impact:

- Even “new” shared TTS still depends on compatibility routing for playback.
- Removing or patching only one layer can break audio while making another route appear healthy.

### 4. Frontend/backend contract drift is present in live roleplay start and voice code

Severity: High

Evidence:

- [apps/client/features/speaking/screens/RoleplayConversationScreen.tsx](/home/vitus/floently-finnish/apps/client/features/speaking/screens/RoleplayConversationScreen.tsx:227) passes `contextLabel` to `startRoleplaySession(...)`.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:142) does not declare `contextLabel` in the input type for `startRoleplaySession(...)`.
- `pnpm -s tsc --noEmit` reports `contextLabel does not exist`.
- [apps/client/features/exam/services/audioPlayer.ts](/home/vitus/floently-finnish/apps/client/features/exam/services/audioPlayer.ts:41) uses `tts.url` without a null guard.
- `pnpm -s tsc --noEmit` reports `'tts' is possibly 'null'`.

Impact:

- Compile-time contract failures are real and current.
- The runtime may still limp along through JS execution and fallbacks, which increases regression risk.

### 5. Fallback handling hides the real failure source

Severity: High

Evidence:

- [apps/client/features/speaking/hooks/useRoleplayRecorder.ts](/home/vitus/floently-finnish/apps/client/features/speaking/hooks/useRoleplayRecorder.ts:96) and :147 convert null transcript results into “Voice input is unavailable — type your response below.”
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:95) `fallbackRoleplayStt(...)` returns `null` on non-OK without preserving the reason.
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:188) catches shared TTS failure and returns `null`.

Impact:

- Permission, MIME, endpoint, parsing, and provider failures are collapsed into the same user-facing outcome.
- Developers see symptoms, not causes.

### 6. Some files that look authoritative are not live

Severity: High

Evidence:

- [apps/backend/app/routers/voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/voice.py:1) defines a large root-level voice system, but it is not mounted in [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1).
- The live router imports in `app/router.py` do not include `app.routers.voice`.

Impact:

- Patching `apps/backend/app/routers/voice.py` will not affect the running HTTP API in the current app bootstrap.
- This is a direct explanation for previous “fixed but unchanged” behavior.

## Duplicate / Conflict Findings

### Roleplay

- New session API: `/api/v1/roleplay/session/...`
- Legacy session API: `/api/v1/roleplay/sessions/...`
- Both are live in the same mounted router file.
- New session path uses preview-style `user_id="preview"` state.
- Legacy path uses authenticated user-scoped wrappers.

### Voice

- New shared voice API: `/api/v1/voice/stt/transcriptions`, `/api/v1/voice/tts/requests`
- Compatibility aliases: `/voice/stt`, `/voice/tts/generate`, `/voice/tts/audio/{filename}`
- Unmounted legacy voice module: [apps/backend/app/routers/voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/voice.py:1)

### Package/export drift

- Shared roleplay helper is compiled against an outdated STT result shape.
- Shared roleplay start input omits `contextLabel` even though the screen passes it.
- Shared voice helper returns nullable TTS but at least one caller does not guard it.

### Wrong-path or noise duplicates

- A duplicate docs tree exists under `docs/docs/audits/...`.
- This tree is not runtime-active, but it is a real regression source for audit and maintenance work because it creates false authorities.

## Frontend / Backend Contract Mismatches

1. `transcribeVoiceAudio(...)`
   - frontend shared voice helper returns `string | null`
   - roleplay helper expects `{ transcript, sttAvailable }`
2. `startRoleplaySession(...)`
   - screen sends `contextLabel`
   - shared API type omits `contextLabel`
3. `requestVoiceTts(...)`
   - returns `VoiceTtsResult | null`
   - some callers still assume non-null
4. TTS URL authority
   - shared `/api/v1/voice/tts/requests` response still points to `/voice/tts/audio/...`
   - this keeps the new stack coupled to the compatibility stack

## Why Fixes Did Not Stick

1. Developers could patch [apps/backend/app/routers/voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/voice.py:1), but that file is not mounted.
2. Developers could patch shared voice helpers while the frontend still falls through to compatibility `/voice/*` aliases.
3. Developers could patch one roleplay route family while another route family remained live.
4. Shared helper changes were applied partially:
   - `packages/core/api/voice.ts` changed
   - `packages/core/api/roleplay.ts` was not fully updated to the new return shape
5. Generic fallback messaging hid the real failing stage, so the system looked “unchanged” even when the failure point moved.

## Exact Answers To The Critical Questions

1. Why do fixes to roleplay appear not to stick?
   - Because the system has two live roleplay route families, two live voice route families, and one unmounted legacy voice module that still looks authoritative.
2. Which exact files are actually live in the running system?
   - Backend authority: `apps/backend/main.py`, `apps/backend/app/router.py`, `apps/backend/app/routers/v1_roleplay.py`, `apps/backend/app/routers/v1_voice.py`, `apps/backend/app/routers/v1_roleplay_voice.py`, `apps/backend/app/runtime/roleplay.py`, `apps/backend/app/services/voice_service.py`, `apps/backend/app/runtime/voice.py`
   - Frontend authority: `apps/client/state/SpeakingRoute.tsx`, `apps/client/state/ProfessionalRoute.tsx`, `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx`, `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`, `apps/client/features/speaking/services/roleplayAudio.ts`, `packages/core/api/roleplay.ts`, `packages/core/api/voice.ts`
3. Which files were likely edited previously without affecting live runtime?
   - `apps/backend/app/routers/voice.py` is the clearest case.
   - Anything under duplicated docs trees such as `docs/docs/audits/...` also has no runtime effect.
4. Are there duplicate or conflicting roleplay routers/services/runtime modules?
   - Yes. New and legacy roleplay flows are both active.
5. Are there duplicate or conflicting voice/STT/TTS routers/services/runtime modules?
   - Yes. Shared `/api/v1/voice/*` and compatibility `/voice/*` aliases are both active, and an additional legacy `app/routers/voice.py` exists but is not mounted.
6. Is the frontend calling the wrong roleplay/voice endpoint?
   - Partly. The frontend prefers the correct `/api/v1` shared endpoints, but it still falls back to `/voice/stt`, and shared TTS still depends on `/voice/tts/audio/...`.
7. Is the frontend importing functions that are missing, stale, or shadowed?
   - Yes. `packages/core/api/roleplay.ts` is stale against `packages/core/api/voice.ts`, and `RoleplayConversationScreen` uses a `contextLabel` field not declared in the shared API type.
8. Is scenario selection deterministic or still falling back incorrectly?
   - In the new runtime it is deterministic. Explicit `scenario_id` wins; otherwise default-by-profession and interview-mode context apply in a fixed order.
9. Why does roleplay voice keep ending in fallback messages like “voice input unavailable”?
   - Because multiple failure types collapse to `null` in shared/helper layers, and the recorder converts `null` into a generic fallback message.
10. Is the failure in permission, recording, upload, MIME type, endpoint, transcription, response parsing, or session continuity?
   - The currently provable live failure is response parsing / helper contract drift. The architecture also preserves risk in endpoint coupling and fallback masking.
11. Are legacy and new systems both active at once?
   - Yes.
12. Are there dead-code or compatibility layers creating regression risk?
   - Yes. `apps/backend/app/routers/voice.py` is dead for current HTTP runtime, and `/voice/*` compatibility routes are still live.
13. What exact architectural changes are needed to stop future regression?
   - Collapse to one roleplay route family, one voice route family, one shared frontend contract, and one canonical TTS URL namespace.

## Severity Ranking

1. Critical: shared roleplay STT helper broken against shared voice contract
2. Critical: new and legacy roleplay systems both live
3. Critical: shared and compatibility voice stacks both live
4. High: fallback logic masks true failures
5. High: unmounted but authoritative-looking `app/routers/voice.py`
6. Medium: duplicate docs tree `docs/docs/audits/...`

## Priority Fixes

1. Make `packages/core/api/roleplay.ts` conform to the current `packages/core/api/voice.ts` STT/TTS contracts.
2. Choose one canonical frontend roleplay voice chain:
   - shared `/api/v1/voice/*`
   - no roleplay-specific parsing fork
3. Make shared TTS return canonical `/api/v1` playback URLs or add an explicit shared audio route under `/api/v1`.
4. Remove or quarantine one roleplay route family.
5. Remove or quarantine unmounted legacy `apps/backend/app/routers/voice.py` from active maintenance authority.
6. Replace silent/null fallbacks with structured error codes and stage-specific logging.
7. Remove or quarantine `docs/docs/audits/...` to reduce false authorities.

## Recommended Architectural Direction

- Canonical roleplay API:
  - only `/api/v1/roleplay/session/start`
  - only `/api/v1/roleplay/session/{id}/turn`
  - only `/api/v1/roleplay/session/{id}/finish`
- Canonical voice API:
  - only `/api/v1/voice/stt/transcriptions`
  - only `/api/v1/voice/tts/requests`
  - one canonical audio playback route namespace
- Canonical frontend authority:
  - one shared `packages/core/api/voice.ts`
  - `packages/core/api/roleplay.ts` uses shared voice helpers without shape translation or parallel compatibility STT code
- Explicitly demote compatibility layers:
  - move old routes to a quarantine module or remove them after migration
