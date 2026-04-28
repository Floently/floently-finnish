# Roleplay / Voice Deletion Log

| Deleted Path | Why It Was Deleted | What Replaced It | Import / Callsite Cleanup Completed |
|---|---|---|---|
| `apps/backend/app/routers/v1_roleplay_voice.py` | Compatibility alias layer for root-level `/voice/*` routes | Canonical `/api/v1/voice/*` routes in `apps/backend/app/routers/v1_voice.py` | yes |
| `apps/backend/app/routers/voice.py` | False-authority legacy voice router not mounted by the app router | Canonical mounted voice router in `apps/backend/app/routers/v1_voice.py` | yes |
| `apps/backend/app/services/roleplay_service.py` | Legacy wrapper layer used only by the deleted legacy roleplay session API family | Canonical runtime flow in `apps/backend/app/runtime/roleplay.py` | yes |
| `docs/docs/**` | Duplicate docs tree creating false authorities and regression noise | Canonical `docs/**` tree | yes |

## Deleted Route Families

| Deleted Route | Why It Was Deleted | What Replaced It | Cleanup Completed |
|---|---|---|---|
| `/api/v1/roleplay/sessions*` | Legacy duplicated roleplay session API family | `/api/v1/roleplay/session/*` | yes |
| `/voice/stt` | Compatibility STT alias | `/api/v1/voice/stt/transcriptions` | yes |
| `/voice/tts/generate` | Compatibility TTS alias | `/api/v1/voice/tts/requests` | yes |
| `/voice/tts/audio/*` | Compatibility playback namespace | `/api/v1/voice/tts/audio/*` | yes |

## Notes

- `packages/core/api/roleplay.ts` no longer contains roleplay-specific STT/TTS implementation logic.
- `apps/backend/app/router.py` no longer imports or mounts the deleted compatibility router.
