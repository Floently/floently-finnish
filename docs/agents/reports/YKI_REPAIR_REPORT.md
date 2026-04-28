# YKI Repair Report

## Exam failure root cause

Primary root cause:
- the governed exam runtime depended on an external engine host and the live adapter lacked a real in-process fallback

Evidence:
- external engine host was unreachable
- live route path:
  - `apps/backend/api/yki_routes.py`
  - `apps/backend/services/yki_service.py`
  - `apps/backend/yki/runtime.py`
  - `apps/backend/adapters/yki_engine_adapter.py`
- fallback is now implemented in `apps/backend/adapters/yki_engine_adapter.py`

Secondary contract note:
- the exam API model expects underscore level bands (`B1_B2`)
- the frontend service already normalizes display bands (`B1-B2` -> `B1_B2`) in `apps/client/features/yki-exam/services/ykiExamService.ts`
- direct service calls with hyphenated level bands will still fail; the live client path is already normalized

## Practice failure root cause

Primary root cause:
- frontend flow was contaminated by a missing/incorrect practice service import path inside the app-shell path

Resolved path:
- `apps/client/state/AppShell.tsx` no longer imports a missing `../features/yki-practice/services/ykiPracticeService`
- session persistence logic was moved to `apps/client/state/sessionPersistence.ts`
- live practice UI was promoted into `apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`
- `apps/client/state/YkiPracticeRoute.tsx` now just wraps the feature screen

## Authority now used

### Practice
- frontend route entry: `apps/client/app/yki-practice/index.tsx`
- app shell route dispatch: `apps/client/state/AppShell.tsx`
- feature screen authority: `apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`
- backend overview/start:
  - `apps/backend/api/routes/yki_practice.py`
  - canonical bank under `apps/backend/materials/yki/certified_bank/**`

### Exam
- frontend route entry: `apps/client/app/yki-exam/index.tsx`
- app shell route dispatch: `apps/client/state/AppShell.tsx`
- feature screen authority: `apps/client/features/yki-exam/screens/YkiExamScreen.tsx`
- backend exam authority:
  - `apps/backend/api/yki_routes.py`
  - `apps/backend/services/yki_service.py`
  - `apps/backend/adapters/yki_engine_adapter.py`
  - `engine/**`

## YKI material authority enforced

- canonical bank:
  - `apps/backend/materials/yki/certified_bank/`
- canonical pool index:
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- canonical runtime task index:
  - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`

## Current outcome

- practice overview/start works against the canonical bank
- exam start no longer depends on a reachable external engine host as long as the client uses the normalized level-band contract
