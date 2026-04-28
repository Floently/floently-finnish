# Roleplay / Voice Duplicate Conflict Matrix

| Symbol / Route / Layer | File Path | Duplicate / Conflict Type | Runtime Status | Issue | Recommendation |
|---|---|---|---|---|---|
| `build_roleplay_router()` new session routes | `apps/backend/app/routers/v1_roleplay.py` | Coexists with legacy roleplay routes | Live | New and old roleplay APIs are mounted together | Keep only one roleplay session API family |
| `/api/v1/roleplay/session/start` | `apps/backend/app/routers/v1_roleplay.py` | Parallel session-start authority | Live | New preview-style roleplay path | Canonicalize as the only session-start path |
| `/api/v1/roleplay/sessions` | `apps/backend/app/routers/v1_roleplay.py` | Legacy parallel session-start authority | Live | Old authenticated roleplay API still mounted | Remove or quarantine after migration |
| `start_session()` | `apps/backend/app/runtime/roleplay.py` | New runtime session implementation | Live | Uses `user_id="preview"` state model | Keep only if this is the chosen authority |
| `create_roleplay_session()` | `apps/backend/app/runtime/roleplay.py` | Legacy runtime entrypoint | Live through legacy API | Coexists with new session runtime | Remove from active path if legacy API is retired |
| `services.roleplay_service` wrappers | `apps/backend/app/services/roleplay_service.py` | Thin duplicate wrapper layer | Live through legacy API | Adds extra “service” authority without real separation | Remove if legacy roleplay API is removed |
| `build_voice_router()` | `apps/backend/app/routers/v1_voice.py` | Shared voice authority | Live | New shared STT/TTS API | Keep as canonical voice API |
| `/api/v1/voice/stt/transcriptions` | `apps/backend/app/routers/v1_voice.py` | Shares responsibility with `/voice/stt` | Live | Same transcription service is reachable through two paths | Keep one canonical STT path |
| `/api/v1/voice/tts/requests` | `apps/backend/app/routers/v1_voice.py` | Shares responsibility with `/voice/tts/generate` | Live | Same TTS service is reachable through two paths | Keep one canonical TTS request path |
| `build_roleplay_voice_router()` | `apps/backend/app/routers/v1_roleplay_voice.py` | Compatibility alias layer | Live | Root-level `/voice/*` aliases stay active | Quarantine or remove after migration |
| `/voice/stt` | `apps/backend/app/routers/v1_roleplay_voice.py` | Compatibility STT alias | Live | Frontend can silently fall back here | Stop frontend fallback once shared path is fixed |
| `/voice/tts/generate` | `apps/backend/app/routers/v1_roleplay_voice.py` | Compatibility TTS alias | Live | Older route still works beside shared API | Remove from active frontend path |
| `/voice/tts/audio/{filename}` | `apps/backend/app/routers/v1_roleplay_voice.py` | Compatibility playback alias | Live | New shared TTS still returns URLs under this root path | Move playback to canonical shared route namespace |
| `resolve_tts_audio()` URL generation | `apps/backend/app/services/tts/runtime.py` | Cross-stack dependency | Live | Shared TTS returns compatibility-route URLs | Change generated URLs to canonical API route |
| `app.routers.voice` | `apps/backend/app/routers/voice.py` | Legacy duplicate voice system | Not mounted | Looks authoritative but is not in `app/router.py` | Mark as dead/quarantined or delete |
| `requestVoiceTts()` | `packages/core/api/voice.ts` | Shared frontend voice authority | Live | Returns nullable result; some callers still assume non-null | Keep canonical, fix all callers |
| `transcribeVoiceAudio()` | `packages/core/api/voice.ts` | Shared frontend STT authority | Live | Return shape changed to `string \| null` | Update all downstream helpers |
| `requestRoleplayTts()` | `packages/core/api/roleplay.ts` | Roleplay-specific wrapper over shared TTS | Live | Still maintains extra fallback logic and null swallowing | Reduce to thin canonical wrapper or inline shared helper |
| `transcribeRoleplayAudio()` | `packages/core/api/roleplay.ts` | Roleplay-specific STT fork | Live | Expects stale shared STT shape and falls back to compatibility path | Rewrite to current shared STT contract only |
| `RoleplayConversationScreen.startSession()` | `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx` | Screen-to-API type drift | Live | Passes `contextLabel` not declared in shared API type | Align screen and shared API types |
| `useRoleplayRecorder.stopRecording()` | `apps/client/features/speaking/hooks/useRoleplayRecorder.ts` | Error masking layer | Live | Converts null STT outcomes into generic fallback copy | Surface stage-specific failure reasons |
| `audioPlayer.playTextAsync()` | `apps/client/features/exam/services/audioPlayer.ts` | Shared caller nullability drift | Live | Uses `tts.url` though shared TTS may return null | Add explicit null guard |
| `docs/docs/audits/...` | `docs/docs/audits/...` | Wrong-path duplicate docs tree | Not runtime | Creates false authorities for audits and maintenance | Remove or quarantine |

## Notes

- Runtime authority for backend HTTP APIs is determined by [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1), not by filename similarity.
- Runtime authority for frontend shared imports is determined by Expo/Metro aliasing in [apps/client/babel.config.js](/home/vitus/floently-finnish/apps/client/babel.config.js:1), [apps/client/metro.config.js](/home/vitus/floently-finnish/apps/client/metro.config.js:1), and [tsconfig.json](/home/vitus/floently-finnish/tsconfig.json:1), which resolve `@core/*` to `packages/core/*`.
