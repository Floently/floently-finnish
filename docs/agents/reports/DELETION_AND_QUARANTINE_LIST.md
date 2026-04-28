# Deletion And Quarantine List

## Deleted now

- `apps/client/app/(tabs)/_layout.tsx`
- `apps/client/app/(tabs)/index.tsx`
- `apps/client/app/(tabs)/explore.tsx`
- `packages/core/apiClient.ts`
- `packages/core/apiConfig.ts`

Reason:
- all were proven redundant after import severing

## Retained as thin wrappers

- `apps/client/app/auth/login.tsx`
- `apps/client/app/auth/register.tsx`
- `apps/client/app/yki-practice/index.tsx`
- `apps/client/app/yki-exam/index.tsx`
- `apps/client/state/AuthRoute.tsx`
- `apps/client/state/YkiPracticeRoute.tsx`
- `apps/client/state/YkiExamRoute.tsx`

Reason:
- route-entry and `AppShell` wrapper roles are still legitimate

## Quarantine next, after one more validation pass

- `apps/backend/app/routers/auth.py`
- `apps/backend/app/routers/voice.py`
- `apps/backend/app/routers/yki_engine.py`
- `apps/backend/app/routers/roleplay.py`
- `apps/backend/app/services/auth_service.py`
- `apps/backend/app/db/**`
- `apps/backend/src/features/practice_content/**`
- `apps/backend/app/cards/**`

Reason:
- shadow architectures, not current route authority
- some still cross-reference each other, so they should be retired as coherent groups

## Keep for now as still-live support infrastructure

- `apps/backend/app/services/tts/**`
- `apps/backend/app/core/config.py`
- `apps/backend/app/services/audio_normalize.py`

Reason:
- canonical voice/roleplay audio still imports them indirectly

## Keep for now as legacy compatibility

- `apps/backend/yki/**`

Reason:
- still part of the current service/adapter orchestration path even though `engine/**` is the real runtime authority

## Runtime artifacts to ignore or clean separately

- `engine/.runtime_audio_cache/**`
- `exam_sessions/**`
- `logs/**`

Reason:
- generated runtime state, not source authority
