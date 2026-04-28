# ROLEPLAY STT Postfix Remnant Matrix

| symbol / route / import / path / helper | file path | remnant / stale / conflict type | live or not live | risk level | why it matters |
|---|---|---|---|---|---|
| `createVoiceTtsRequest` wrapper | `packages/core/api/voiceTts.ts` | duplicate API surface wrapper over canonical `requestVoiceTts` | not live for roleplay STT | low | extra abstraction can reintroduce drift if contracts diverge |
| deleted `/voice/*` compatibility routes | `apps/backend/app/router.py` + `apps/backend/app/routers/v1_voice.py` | checked for remnant route mounts | not live | low | confirms no stale route wiring as root cause |
| deleted roleplay sessions API family (`/api/v1/roleplay/sessions*`) | backend mounted routers + `packages/core/api/roleplay.ts` | historical contract removed | not live | low | confirms frontend no longer calling removed path family |
| STT generic classifier fallback | `apps/backend/app/services/voice_service.py::_classify_stt_failures` | broad fallback bucket for unmatched provider errors | live | high | maps concrete auth/permission failures to generic temporary-unavailable message |
| STT provider calls (`_transcribe_with_openai`, `_transcribe_with_google`) | `apps/backend/app/services/voice_service.py` | runtime provider dependency | live | critical | provider failures are currently the direct outage trigger |
| dev lifecycle-only logging | `/home/vitus/floently-finnish/dev.log` | operational observability gap | live (ops) | medium | hides actionable STT stack traces during normal local debugging |
| canonical route string `/api/v1/voice/stt/transcriptions` | `packages/core/api/voice.ts` | route authority check | live | low | confirms frontend transport points to mounted endpoint |
| roleplay recorder hook to shared voice API | `apps/client/features/speaking/hooks/useRoleplayRecorder.ts` | post-consolidation single path | live | low | confirms no hidden local STT endpoint fallback |
| consumed audit artifacts (`removed_routes.json`, etc.) | `docs/audits/consumed/*` | historical authority docs | not runtime | low | useful baseline but must not replace code-truth during incident response |

