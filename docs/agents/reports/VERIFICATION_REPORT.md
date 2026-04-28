# Verification Report

## Frontend

### Route-wrapper verification

- `apps/client/app/auth/login.tsx` and `register.tsx`
  - verified as thin `AppShell` wrappers
- `apps/client/app/yki-practice/index.tsx`
  - verified as thin `AppShell` wrapper
- `apps/client/app/yki-exam/index.tsx`
  - verified as thin `AppShell` wrapper
- `apps/client/state/AuthRoute.tsx`
  - verified as thin wrapper to `features/auth/screens/AuthScreen.tsx`
- `apps/client/state/YkiPracticeRoute.tsx`
  - verified as thin wrapper to `features/yki-practice/screens/YkiPracticeScreen.tsx`
- `apps/client/state/YkiExamRoute.tsx`
  - verified as thin wrapper to `features/yki-exam/screens/YkiExamScreen.tsx`

### Shim verification

- `rg` shows no remaining importers of:
  - `packages/core/apiClient.ts`
  - `packages/core/apiConfig.ts`
  - `@core/apiClient`
  - `@core/apiConfig`

### Dead route verification

- `apps/client/app/(tabs)/**` was starter residue only
- files removed from the live route tree

### TypeScript verification

- attempted: `pnpm -C apps/client exec tsc --noEmit`
- result: failed because `tsc` is not available in the current environment (`Command "tsc" not found`)

## Backend

### Mounted route verification

Mounted routes confirmed from `apps.backend.main:app` include:
- `/api/v1/yki-exam/overview`
- `/api/v1/yki-exam/mock-cycle`
- `/api/v1/yki-practice/overview`
- `/api/v1/yki-practice/start`
- `/api/v1/yki-practice/{session_id}`
- `/api/v1/yki/sessions`
- `/api/v1/yki/sessions/{session_id}`
- `/api/v1/yki/sessions/{session_id}/answers`
- `/api/v1/yki/sessions/{session_id}/writing`
- `/api/v1/yki/sessions/{session_id}/audio`
- `/api/v1/yki/sessions/{session_id}/speaking`
- `/api/v1/yki/sessions/{session_id}/speaking/conversation`
- `/api/v1/yki/sessions/{session_id}/speaking/turns`
- `/api/v1/yki/sessions/{session_id}/speaking/reply`
- `/api/v1/yki/sessions/{session_id}/submit`
- `/api/v1/yki/sessions/{session_id}/certificate`
- `/voice/stt`
- `/voice/tts/generate`
- `/voice/tts/audio/{filename}`
- `/health`

### Practice smoke

- direct practice start returned:
  - session id
  - `4` tasks
  - concrete first task id

### Exam smoke

- direct async service start with normalized level band (`B1_B2`) succeeds through the live backend path
- in-process engine fallback remains available when external engine host is unreachable

### Import graph verification

- live backend shadow dependency still present:
  - `apps/backend/services/voice_service.py` imports `app.core.config` and `app.services.tts.*`
- therefore `apps/backend/app/services/tts/**` is still live support infrastructure, not deletable yet
