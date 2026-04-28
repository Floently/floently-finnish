# Authority Map

## Frontend

- `apps/client/app/**`
  - Canonical role: Expo Router entry layer only.
  - Live status: live route-entry surface.
  - Allowed content: thin wrappers and direct route exports.

- `apps/client/features/**`
  - Canonical role: feature implementation authority.
  - Live status: live and growing authority.
  - Current promoted authorities:
    - `features/auth/screens/AuthScreen.tsx`
    - `features/yki-practice/screens/YkiPracticeScreen.tsx`
    - `features/yki-exam/screens/YkiExamScreen.tsx`

- `apps/client/state/**`
  - Canonical role: app orchestration only.
  - Live status: still partly contaminated.
  - Current state:
    - `AuthRoute.tsx`, `YkiPracticeRoute.tsx`, `YkiExamRoute.tsx` are now thin wrappers.
    - `BillingRoute.tsx`, `LearningRoute.tsx`, `ProfessionalRoute.tsx`, `SpeakingRoute.tsx` still contain feature UI and should be migrated later.

- `packages/core/api/**`
  - Canonical role: shared API client authority.
  - Live status: canonical and active.

- `packages/ui/**`
  - Canonical role: shared UI primitives and screens.
  - Live status: canonical supporting UI layer.

## Backend

- `apps/backend/main.py`
  - Canonical role: app boot/composition only.
  - Live status: authoritative backend entrypoint.

- `apps/backend/api/**`
  - Canonical role: HTTP boundary authority.
  - Live status: mounted router authority.

- `apps/backend/services/**`
  - Canonical role: request orchestration and backend service layer.
  - Live status: authoritative, but `voice_service.py` still depends on `app.*` TTS helpers.

- `engine/**`
  - Canonical role: sole YKI engine/runtime authority.
  - Live status: active via in-process fallback in `apps/backend/adapters/yki_engine_adapter.py`.

- `apps/backend/yki/**`
  - Canonical role: legacy compatibility/orchestration residue only.
  - Live status: still part of the adapter/service call path, but not the long-term engine authority.

- `apps/backend/materials/yki/certified_bank/**`
  - Canonical role: published YKI material authority.
  - Live status: active.

- `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
  - Canonical role: YKI pool index authority.
  - Live status: active.

- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
  - Canonical role: runtime task index authority.
  - Live status: active.

- `apps/backend/app/cards/**`
  - Canonical role by design: richer in-repo card publication/runtime architecture.
  - Live status: not the active card HTTP authority.
  - Current decision: quarantine candidate, not yet promoted.

- `apps/backend/app/services/tts/**` and `apps/backend/app/core/config.py`
  - Role: still-live support infrastructure.
  - Live status: still required by canonical voice/TTS routes through `apps/backend/services/voice_service.py` and `apps/backend/api/roleplay_voice_routes.py`.
