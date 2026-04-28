# Roleplay / Voice Regression Elimination Checklist

- [x] no duplicate roleplay routers
- [x] no duplicate voice routers
- [x] no compatibility `/voice/*` calls in active app/package code
- [x] no legacy roleplay session API family mounted
- [x] no stale roleplay/voice/shared contract drift in the touched implementation surfaces
- [x] no false-authority backend voice router file left
- [x] no duplicate docs tree left
- [x] canonical TTS playback URLs only
- [x] canonical STT flow only
- [x] canonical session flow only

## Verification Notes

- Backend router authority verified in [apps/backend/app/router.py](/home/vitus/floently-finnish/apps/backend/app/router.py:1)
- Canonical TTS URL generation verified in [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py:104)
- Canonical roleplay frontend contracts verified in [packages/core/api/roleplay.ts](/home/vitus/floently-finnish/packages/core/api/roleplay.ts:1)
- Canonical shared voice contracts verified in [packages/core/api/voice.ts](/home/vitus/floently-finnish/packages/core/api/voice.ts:1)
- Full repo TypeScript still has unrelated pre-existing failures outside this checklist scope
