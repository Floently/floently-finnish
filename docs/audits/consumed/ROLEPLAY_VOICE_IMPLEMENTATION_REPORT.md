# Roleplay / Voice Implementation Report

Implementation date: April 23, 2026

## Summary

The roleplay and voice system has been consolidated onto one active roleplay stack and one active voice stack.

Canonical backend authorities kept:

- [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1)
- [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:1)
- [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:1)
- [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:1)
- [apps/backend/app/services/voice_service.py](/home/vitus/floently-finnish/apps/backend/app/services/voice_service.py:1)
- [apps/backend/app/runtime/voice.py](/home/vitus/floently-finnish/apps/backend/app/runtime/voice.py:1)
- [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py:1)

Canonical frontend/shared authorities kept:

- [packages/core/api/voice.ts](/home/vitus/floently-finnish/packages/core/api/voice.ts:1)
- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:1)
- [apps/client/features/speaking/screens/RoleplayConversationScreen.tsx](/home/vitus/floently-finnish/apps/client/features/speaking/screens/RoleplayConversationScreen.tsx:1)
- [apps/client/features/speaking/hooks/useRoleplayRecorder.ts](/home/vitus/floently-finnish/apps/client/features/speaking/hooks/useRoleplayRecorder.ts:1)
- [apps/client/features/speaking/services/roleplayAudio.ts](/home/vitus/floently-finnish/apps/client/features/speaking/services/roleplayAudio.ts:1)
- [apps/client/state/SpeakingRoute.tsx](/home/vitus/floently-finnish/apps/client/state/SpeakingRoute.tsx:1)
- [apps/client/state/ProfessionalRoute.tsx](/home/vitus/floently-finnish/apps/client/state/ProfessionalRoute.tsx:1)

## Exact Changes

### Routes kept

- `GET /api/v1/roleplay/scenarios`
- `POST /api/v1/roleplay/session/start`
- `POST /api/v1/roleplay/session/{session_id}/turn`
- `POST /api/v1/roleplay/session/{session_id}/finish`
- `GET /api/v1/voice/tts/health`
- `POST /api/v1/voice/stt/transcriptions`
- `POST /api/v1/voice/tts/requests`
- `GET /api/v1/voice/tts/audio/{cache_key}.{file_extension}`
- `POST /api/v1/voice/pronunciation/analyze`

### Routes deleted

- `POST /api/v1/roleplay/sessions`
- `POST /api/v1/roleplay/sessions/{session_id}/turns`
- `GET /api/v1/roleplay/sessions/{session_id}`
- `GET /api/v1/roleplay/sessions/{session_id}/transcript`
- `GET /api/v1/roleplay/sessions/{session_id}/review`
- `POST /voice/stt`
- `POST /voice/tts/generate`
- `GET /voice/tts/audio/{filename}`
- `GET /voice/health`

### Contracts fixed

- `packages/core/api/voice.ts`
  - removed fallback routing to root-level `/voice/*`
  - canonicalized STT to `/api/v1/voice/stt/transcriptions` only
  - canonicalized TTS to `/api/v1/voice/tts/requests` only
  - changed failure handling to surface explicit errors instead of silent compatibility fallback
- `packages/core/api/roleplay.ts`
  - removed duplicate roleplay-specific STT/TTS implementations
  - kept only roleplay session APIs
  - added `contextLabel` to `startRoleplaySession(...)`
- `apps/client/features/speaking/hooks/useRoleplayRecorder.ts`
  - now calls canonical shared `transcribeVoiceAudio(...)` only
  - removed compatibility endpoint fallback
  - returns explicit transcription error messages
- `apps/client/features/speaking/services/roleplayAudio.ts`
  - now calls canonical shared `requestVoiceTts(...)` only
- `apps/backend/app/services/tts/runtime.py`
  - shared TTS URLs now resolve only to `/api/v1/voice/tts/audio/...`
- `apps/backend/app/routers/v1_voice.py`
  - added canonical audio playback route under `/api/v1/voice/tts/audio/...`

## Files Deleted

- `apps/backend/app/routers/v1_roleplay_voice.py`
- `apps/backend/app/routers/voice.py`
- `apps/backend/app/services/roleplay_service.py`
- `docs/docs/**`

## Regressions Removed

- root-level compatibility `/voice/*` aliases are gone from live code
- legacy roleplay session API family is gone from the mounted router
- shared TTS no longer returns compatibility playback URLs
- `packages/core/api/roleplay.ts` no longer contains a parallel STT/TTS stack
- the backend router no longer mounts the compatibility roleplay voice router
- the false-authority backend voice router file is removed
- the duplicate `docs/docs` tree is removed

## Verification Summary

- `pnpm -s tsc --noEmit`
  - still fails for pre-existing unrelated onboarding, settings, analytics, YKI, and UI typing issues outside the roleplay/voice scope
  - no remaining TypeScript failures were emitted for the touched roleplay/voice/frontend/shared files after the fix
- `./.venv/bin/python -c "import main"` from `apps/backend`
  - passed
- router authority check
  - [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1) mounts only canonical roleplay and canonical voice routers for active roleplay/voice behavior
- URL authority check
  - [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py:104) and :150 now emit only `/api/v1/voice/tts/audio/...`

## Remaining Known Risk

- The full repository TypeScript build still has unrelated pre-existing failures outside the roleplay/voice surfaces.
- The canonical roleplay runtime still uses the `preview` user/session model in [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:471), which is now the only authority but remains a product/security design risk outside this consolidation task.
