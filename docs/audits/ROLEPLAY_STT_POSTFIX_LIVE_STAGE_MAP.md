# ROLEPLAY STT Postfix Live Stage Map

| stage | implementation evidence | status | notes |
|---|---|---|---|
| frontend entry | `apps/client/state/SpeakingRoute.tsx`, `apps/client/state/ProfessionalRoute.tsx` | healthy | roleplay routes open canonical conversation screen |
| recorder start/stop | `apps/client/features/speaking/hooks/useRoleplayRecorder.ts` | healthy | mic permission and native/web recorder flows are active |
| request builder | `packages/core/api/voice.ts::transcribeVoiceAudio` | healthy | multipart fields align with backend Form params |
| transport URL | `POST /api/v1/voice/stt/transcriptions` in `packages/core/api/voice.ts` | healthy | canonical v1 voice endpoint only |
| backend receive | `apps/backend/app/routers/v1_voice.py::transcribe_audio_route` | healthy | reads upload and forwards bytes to service |
| file save | `apps/backend/app/runtime/voice.py::save_voice_file` | healthy | recorded files exist in `apps/backend/runtime/uploads/voice/*` |
| normalize/format prep | `apps/backend/app/services/voice_service.py` (`_guess_src_format`, `_to_linear16`) | healthy/uncertain | pipeline runs; not the observed blocker in reproduced case |
| transcribe provider execution | `_transcribe_with_openai`, `_transcribe_with_google` | broken | reproduced failures: OpenAI 401 invalid key, Google 403 Speech API disabled |
| backend return payload | `transcribe_audio` response body | masked | explicit failure reasons included, but classifier emits generic temporary-unavailable message |
| frontend interpretation | `packages/core/api/voice.ts` + `useRoleplayRecorder.ts::normalizeRecorderError` | masked | backend message is surfaced; user does not see credential/API-enable action directly |
| roleplay session continuity | `RoleplayConversationScreen.tsx::onMicPress/submitTranscript` | healthy but blocked by upstream STT | manual text path still works; voice turn blocked when STT returns no transcript/error |

