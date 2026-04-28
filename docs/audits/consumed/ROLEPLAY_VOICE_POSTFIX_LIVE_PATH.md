# Roleplay / Voice Post-Fix Live Path

## Canonical Frontend Entrypoints

- [apps/client/state/ProfessionalRoute.tsx](/home/vitus/floently-finnish/apps/client/state/ProfessionalRoute.tsx:1)
- [apps/client/state/SpeakingRoute.tsx](/home/vitus/floently-finnish/apps/client/state/SpeakingRoute.tsx:1)
- [apps/client/features/speaking/screens/RoleplayConversationScreen.tsx](/home/vitus/floently-finnish/apps/client/features/speaking/screens/RoleplayConversationScreen.tsx:1)
- [apps/client/features/speaking/hooks/useRoleplayRecorder.ts](/home/vitus/floently-finnish/apps/client/features/speaking/hooks/useRoleplayRecorder.ts:1)
- [apps/client/features/speaking/services/roleplayAudio.ts](/home/vitus/floently-finnish/apps/client/features/speaking/services/roleplayAudio.ts:1)

## Canonical Shared API Files

- [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:1)
- [packages/core/api/voice.ts](/home/vitus/floently-finnish/packages/core/api/voice.ts:1)

## Canonical Backend Routers

- [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1)
- [apps/backend/app/routers/v1_roleplay.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_roleplay.py:1)
- [apps/backend/app/routers/v1_voice.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_voice.py:1)

## Canonical Backend Services / Runtime

- [apps/backend/app/runtime/roleplay.py](/home/vitus/floently-finnish/apps/backend/app/runtime/roleplay.py:1)
- [apps/backend/app/services/voice_service.py](/home/vitus/floently-finnish/apps/backend/app/services/voice_service.py:1)
- [apps/backend/app/runtime/voice.py](/home/vitus/floently-finnish/apps/backend/app/runtime/voice.py:1)
- [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py:1)

## Canonical Route URLs

### Roleplay session flow

- `POST /api/v1/roleplay/session/start`
- `POST /api/v1/roleplay/session/{session_id}/turn`
- `POST /api/v1/roleplay/session/{session_id}/finish`

### Voice flow

- `POST /api/v1/voice/stt/transcriptions`
- `POST /api/v1/voice/tts/requests`
- `GET /api/v1/voice/tts/audio/{cache_key}.{file_extension}`

## End-to-End Live Path

### Session start

`ProfessionalRoute` or `SpeakingRoute`
-> `RoleplayConversationScreen.startSession()`
-> `packages/core/api/roleplay.ts:startRoleplaySession(...)`
-> `POST /api/v1/roleplay/session/start`
-> `apps/backend/app/routers/v1_roleplay.py`
-> `apps/backend/app/runtime/roleplay.py:start_session(...)`
-> frontend receives `sessionId`, `scenario`, `voiceProfile`, `personaName`, `openingText`

### TTS playback

`RoleplayConversationScreen`
-> `apps/client/features/speaking/services/roleplayAudio.ts:speakRoleplayText(...)`
-> `packages/core/api/voice.ts:requestVoiceTts(...)`
-> `POST /api/v1/voice/tts/requests`
-> `apps/backend/app/routers/v1_voice.py`
-> `apps/backend/app/services/voice_service.py:create_tts_request(...)`
-> `apps/backend/app/services/tts/runtime.py:resolve_tts_audio(...)`
-> backend returns `/api/v1/voice/tts/audio/{cache_key}.{ext}`
-> frontend plays that canonical URL

### STT transcription

`useRoleplayRecorder.stopRecording()`
-> `packages/core/api/voice.ts:transcribeVoiceAudio(...)`
-> `POST /api/v1/voice/stt/transcriptions`
-> `apps/backend/app/routers/v1_voice.py`
-> `apps/backend/app/services/voice_service.py:transcribe_audio(...)`
-> `apps/backend/app/runtime/voice.py:save_voice_file(...)`
-> frontend receives transcript string or explicit error

### Turn submit

`RoleplayConversationScreen.submitTranscript()`
-> `packages/core/api/roleplay.ts:submitRoleplayTurn(...)`
-> `POST /api/v1/roleplay/session/{session_id}/turn`
-> `apps/backend/app/routers/v1_roleplay.py`
-> `apps/backend/app/runtime/roleplay.py:submit_turn(...)`
-> frontend receives `aiText`, `currentUserTurn`, `feedbackLine`, `missingPhrases`

### Session finish

`RoleplayConversationScreen`
-> `packages/core/api/roleplay.ts:finishRoleplaySession(...)`
-> `POST /api/v1/roleplay/session/{session_id}/finish`
-> `apps/backend/app/routers/v1_roleplay.py`
-> `apps/backend/app/runtime/roleplay.py:finish_session(...)`
-> frontend receives final review payload
