# Transplant Report

## Completed transplants

### Frontend auth
- Source: former `apps/client/state/AuthRoute.tsx`
- Destination: `apps/client/features/auth/screens/AuthScreen.tsx`
- Preserved logic:
  - live sign-in/sign-up form flow
  - tester login behavior
  - auth-store integration
  - token handoff

### Frontend YKI practice
- Source: former `apps/client/state/YkiPracticeRoute.tsx`
- Destination: `apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`
- Preserved logic:
  - overview loading
  - practice session start
  - persisted-session resume
  - first-task rendering
  - controlled explicit error handling

### Frontend YKI exam
- Source: former `apps/client/state/YkiExamRoute.tsx`
- Destination: `apps/client/features/yki-exam/screens/YkiExamScreen.tsx`
- Preserved logic:
  - exam overview loading
  - level-band switching
  - governed exam start action
  - practice/mock/speaking navigation surface

### Shared core API shims
- Source: root-level shims `packages/core/apiClient.ts` and `packages/core/apiConfig.ts`
- Destination: canonical `packages/core/api/apiClient.ts` and `packages/core/api/apiConfig.ts`
- Preserved logic:
  - none needed; they were compatibility re-exports only
- Result:
  - final remaining importer moved to canonical path
  - shims deleted

## Backend YKI transplant/repair

### In-process engine fallback
- Source of missing behavior: documented but absent from live runtime path
- Destination: `apps/backend/adapters/yki_engine_adapter.py`
- Preserved/added behavior:
  - external engine support when reachable
  - in-process fallback when external engine host is down
  - fallback for start/read/answer/writing/audio/speaking/conversation/submit/certificate flows

### Engine support modules restored for fallback
- Added under `engine/media/**`, `engine/speech/**`, `engine/evaluation/**`
- Purpose:
  - make the root `engine/**` usable as the real fallback runtime authority

## Not yet transplanted

- `apps/client/state/BillingRoute.tsx` -> feature screen not created yet
- `apps/client/state/LearningRoute.tsx` -> feature landing screen not created yet
- `apps/client/state/ProfessionalRoute.tsx` -> feature entry screen not created yet
- `apps/client/state/SpeakingRoute.tsx` -> feature menu screen not created yet
- `apps/backend/app/cards/**` useful deeper card publication/runtime pieces have not been promoted into the live card runtime
- `apps/backend/app/services/tts/**` support logic has not yet been rehomed into canonical `apps/backend/services/**`
