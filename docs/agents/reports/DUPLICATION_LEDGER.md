# Duplication Ledger

## Frontend

### `apps/client/app/auth/*` vs `apps/client/features/auth/screens/*`
- Classification: `WRAPPER VS IMPLEMENTATION`
- Live importers:
  - `app/auth/login.tsx` -> `AppShell`
  - `app/auth/register.tsx` -> `AppShell`
  - `state/AuthRoute.tsx` -> `features/auth/screens/AuthScreen.tsx`
- Mounted/live:
  - `app/auth/*` are live route entries.
  - `features/auth/screens/AuthScreen.tsx` is the live auth implementation through `AppShell`.
- Winner: `apps/client/features/auth/**`
- Wrapper retention: keep `app/auth/*`
- Transplant: completed from former `state/AuthRoute.tsx` into `features/auth/screens/AuthScreen.tsx`
- Decision: keep wrappers, retain feature implementation, do not use `LoginScreen.tsx` / `RegisterScreen.tsx` as the governing auth flow

### `apps/client/state/AuthRoute.tsx` vs `apps/client/features/auth/screens/AuthScreen.tsx`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Unique logic on loser side:
  - full auth form flow
  - dev tester login behavior
  - live auth-store integration
- Winner: `features/auth/screens/AuthScreen.tsx`
- Loser: `state/AuthRoute.tsx`
- Decision: transplanted, reduced to wrapper

### `apps/client/app/yki-practice/index.tsx` vs `apps/client/state/YkiPracticeRoute.tsx` vs `apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`
- Classification:
  - `app/yki-practice/index.tsx`: `WRAPPER VS IMPLEMENTATION`
  - `state/YkiPracticeRoute.tsx` vs feature screen: `CONTAMINATED PARALLEL VERSIONS`
- Winner: `features/yki-practice/screens/YkiPracticeScreen.tsx`
- Transplant: completed from former `state/YkiPracticeRoute.tsx`
- Decision: keep route entry, keep state wrapper temporarily, feature screen is authority

### `apps/client/app/yki-exam/index.tsx` vs `apps/client/state/YkiExamRoute.tsx` vs `apps/client/features/yki-exam/screens/YkiExamScreen.tsx`
- Classification:
  - `app/yki-exam/index.tsx`: `WRAPPER VS IMPLEMENTATION`
  - `state/YkiExamRoute.tsx` vs feature screen: `CONTAMINATED PARALLEL VERSIONS`
- Winner: `features/yki-exam/screens/YkiExamScreen.tsx`
- Transplant: completed from former `state/YkiExamRoute.tsx`
- Decision: keep route entry, keep state wrapper temporarily, feature screen is authority

### `apps/client/features/exam/**` vs `apps/client/features/yki-exam/**`
- Classification: `SPLIT-RESPONSIBILITY LAYER`
- Evidence:
  - `features/yki-exam/screens/YkiExamScreen.tsx` governs exam selection/start.
  - `features/exam/screens/ExamRuntimeScreen.tsx`, `CertificateScreen.tsx`, `ReviewAnswersScreen.tsx`, `ResultsOverviewScreen.tsx`, `MockExamCycleScreen.tsx` back the deeper runtime/result routes.
- Winner: split by responsibility, not a duplicate.
- Decision: keep both; `features/yki-exam` = entry/start authority, `features/exam` = runtime/results authority.

### `apps/client/state/BillingRoute.tsx` vs `apps/client/features/billing/**`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Evidence:
  - feature service exists under `features/billing/services/paymentService.ts`
  - state route still owns the billing screen UI
- Winner: not yet migrated
- Decision: keep live for now, migrate later

### `apps/client/state/LearningRoute.tsx` vs `apps/client/features/learning/**`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Evidence:
  - route owns the learning landing UI
  - detailed learning screens/services already live under `features/learning/**`
- Winner: not yet migrated
- Decision: keep temporarily, migrate later

### `apps/client/state/ProfessionalRoute.tsx` vs `apps/client/features/professional/**` and `features/speaking/**`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Evidence:
  - route owns professional roleplay entry UI
  - feature services/screens exist elsewhere
- Winner: not yet migrated
- Decision: keep temporarily, migrate later

### `apps/client/state/SpeakingRoute.tsx` vs `apps/client/features/speaking/**`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Evidence:
  - state route still owns speaking menu UI
  - actual speaking surfaces live in `features/speaking/screens/*`
- Winner: not yet migrated
- Decision: keep temporarily, migrate later

### `packages/core/apiClient.ts` and `packages/core/apiConfig.ts` vs `packages/core/api/apiClient.ts` and `packages/core/api/apiConfig.ts`
- Classification: `TRUE DUPLICATE`
- Winner: `packages/core/api/*`
- Transplant: final importer updated to canonical client
- Decision: root shims deleted

### `apps/client/app/(tabs)/**`
- Classification: `TRUE DUPLICATE`
- Evidence:
  - Expo starter sample routes
  - no role in current `AppShell`-driven application
- Decision: deleted

## Backend

### `apps/backend/api/**` vs `apps/backend/app/routers/**`
- Classification: `SHADOW ARCHITECTURE`
- Live status:
  - `apps/backend/api/router.py` is mounted
  - `apps/backend/app/routers/auth.py`, `voice.py`, `yki_engine.py`, `roleplay.py` are not mounted
- Winner: `apps/backend/api/**`
- Decision: quarantine `app/routers/**` after dependent shadow trees are retired

### `apps/backend/services/**` vs `apps/backend/app/services/**`
- Classification: `SHADOW ARCHITECTURE` with `STILL-LIVE SUPPORT INFRASTRUCTURE`
- Winner: `apps/backend/services/**`
- Still-live support:
  - `app/services/tts/**`
  - `app/core/config.py`
- Decision: do not delete `app/services/tts/**` yet

### `apps/backend/yki/**` vs `engine/**`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Evidence:
  - engine runtime authority is `engine/**`
  - service/orchestration path still crosses `apps/backend/yki/runtime.py`
- Winner: `engine/**`
- Decision: keep `apps/backend/yki/**` only as compatibility/orchestration residue until imports are severed

### `apps/backend/cards/*` vs `apps/backend/app/cards/**`
- Classification: `CONTAMINATED PARALLEL VERSIONS`
- Winner today: `apps/backend/cards/*` + `services/cards_service.py` + `api/cards_routes.py`
- Loser: `apps/backend/app/cards/**` for current runtime
- Decision: quarantine candidate, not deleted yet

### `apps/backend/services/voice_service.py` / `api/roleplay_voice_routes.py` vs `apps/backend/app/services/tts/**` / `app/core/config.py`
- Classification: `STILL-LIVE SUPPORT INFRASTRUCTURE`
- Evidence:
  - canonical voice service imports `app.*`
- Winner: canonical route/service remains `apps/backend/api/**` + `apps/backend/services/**`
- Decision: retain `app.services.tts/**` and `app.core.config.py` until canonical voice dependencies are rewritten

### YKI material mirrors
- `apps/backend/materials/yki/certified_bank/manifest.json` vs `apps/backend/materials/yki/manifest/manifest.json`
- Classification: `TRUE DUPLICATE`
- Winner: `certified_bank/manifest.json`
- Loser: mirror manifest only

### Salvage and unusable indexes vs runtime task index
- Classification: `SPLIT-RESPONSIBILITY LAYER`
- Winner for runtime: `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- Losers for runtime: salvaged/unusable indexes

### `apps/backend/src/features/practice_content/**`
- Classification: `SHADOW ARCHITECTURE`
- Role: donor/generator pipeline, not runtime authority
- Decision: quarantine candidate
