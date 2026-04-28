# YKI Surgical Fix Report

## Scope
- Fixed the YKI Practice frontend import/runtime break.
- Fixed the YKI Exam engine fallback/runtime break.
- Did not re-audit the canonical bank.

## Practice Fix
- `apps/client/state/AppShell.tsx` no longer imports `../features/yki-practice/services/ykiPracticeService`.
- Session cleanup for practice and exam now comes from `apps/client/state/sessionPersistence.ts`.
- The actual practice feature service still exists at `apps/client/features/yki-practice/services/ykiPracticeService.ts` and remains the canonical practice session service used by `apps/client/state/YkiPracticeRoute.tsx`.

### Why this fixes the reported break
- The reported bundle failure was specifically from `AppShell.tsx`.
- `AppShell.tsx` only needed storage cleanup, not feature-domain practice logic.
- Moving that cleanup into the state persistence layer removes the shell-to-feature dependency that Metro previously failed on.

## Exam Fallback Fix
- `apps/backend/adapters/yki_engine_adapter.py` now performs a fast reachability check against the configured external engine host.
- If the external engine host is unreachable, the adapter falls back immediately to the in-process engine runtime.
- The fallback is now real and executable because the missing in-process engine support modules were restored:
  - `engine/media/*`
  - `engine/speech/*`
  - `engine/evaluation/*`

## Validation Summary
- Practice overview loads from the canonical bank and returns `3882` tasks for `B1-B2`.
- Practice start returns a guided session with `4` tasks and a concrete first task id.
- Exam start works through fallback when the external engine is forced unreachable.
- Exam resume works through fallback.
- Objective answer submission works through fallback.
- Final exam submit works through fallback.
- Certificate fetch works through fallback.

## Key Evidence
- `AppShell.tsx` now has no `ykiPracticeService` import.
- Forced unreachable-engine validation:
  - `YKI_ENGINE_BASE_URL=http://127.0.0.1:1`
  - `YKI_ENGINE_TIMEOUT_SECONDS=0.5`
  - start/resume/answer/submit/certificate all succeeded through `in_process_fallback`.

## Final Outcome
- YKI Practice no longer depends on the broken `AppShell -> feature service` import path.
- YKI Exam no longer fails solely because `localhost:8010` or `127.0.0.1:8181` is down.
