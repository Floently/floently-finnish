# Architecture And Contracts Audit

## Scope Statement
Assessment of architecture boundaries, runtime contract integrity, module authority, and schema/version discipline.

## What Was Inspected
- `apps/backend/app/router.py`, backend routers, API client/config, auth/session code, YKI practice vs exam surfaces, state store, ORM models, and billing contracts.

## Methods Used
- Static import/path review.
- Contract comparison between frontend callers and backend routes.
- Authority review across runtime content sources.

## Commands Run
- `sed -n '1,260p' apps/backend/app/router.py`
- `sed -n '1,260p' packages/core/api/*.ts`
- `sed -n '1,260p' apps/backend/app/routers/*.py`
- `python3` JSON inventory and route summary scripts

## PASS / WARN / FAIL Verdicts
- Router mounting discipline: **WARN**
- Runtime contract integrity: **FAIL**
- Single source of truth discipline: **FAIL**
- API/versioning discipline: **WARN**

## Findings
### AUD-003 — Entitlements and billing are non-production stubs with dev-mode unlock behavior
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/services/subscription_service.py`, `apps/backend/app/routers/v1_subscription.py`, `packages/core/api/billing.ts`, `apps/backend/app/core/config.py`
        - Evidence:
        - apps/backend/app/services/subscription_service.py:66-88 upgrades every user to professional_premium when SETTINGS.dev_mode is true.
- apps/backend/app/routers/v1_subscription.py:26-50 returns development_stub checkout and portal URLs.
- packages/core/api/billing.ts:16-18 calls /api/v1/subscription/plans, but no matching backend route exists in v1_subscription.py.
- apps/backend/app/core/config.py defaults FLOENTLY_DEV_MODE to true unless overridden.
        - Suggested remediation: Remove dev-mode entitlement overrides from production code paths, implement real subscription plans/checkout/portal contracts, and add explicit environment gating that fails closed in production.
        - Verification after remediation:
        - Run authenticated subscription status checks in production mode and verify no premium access is granted without a valid entitlement.
- Smoke test /subscription/plans, /checkout, and /portal against real providers or a controlled sandbox.
- Add automated tests for free, preview, paid, expired, and internal tester states.

### AUD-007 — Environment separation is broken by hardcoded production URLs and committed local client env
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **should fix before deployment**
        - Owner suggestion: **frontend/mobile**
        - Exact paths: `packages/core/api/apiConfig.ts`, `apps/client/.env.local`, `render.yaml`
        - Evidence:
        - packages/core/api/apiConfig.ts:1-7 hardcodes https://learn-api.floently.com and ignores EXPO_PUBLIC_API_BASE_URL.
- apps/client/.env.local:1 points to a developer LAN host http://192.168.100.41:8000.
- render.yaml defines only backend env vars and no mobile/web environment contract.
        - Suggested remediation: Move API base URL resolution to explicit environment-configured values per build profile, remove committed machine-local env files, and document staging/production routing contracts.
        - Verification after remediation:
        - Build the app for local, staging, and production with different API base URLs without code changes.
- Static grep confirms no hardcoded production or developer LAN API endpoints remain.

### AUD-009 — Production auth/session architecture relies on JSON file state instead of durable hardened persistence
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/core/state_store.py`, `apps/backend/app/services/auth_service.py`, `apps/backend/app/db/models.py`
        - Evidence:
        - apps/backend/app/core/state_store.py:42-56 stores users, tokens, sessions, oauth state, and YKI sessions in a single JSON-backed in-memory store.
- The repository also contains ORM user/session-related models, proving dual persistence authorities rather than one production-grade source of truth.
- State snapshots are written with write_snapshot() and a committed runtime state file already contains password_hash values.
        - Suggested remediation: Consolidate auth/session persistence onto a real transactional datastore, retire file-backed auth state for production, and define a single authority for identity/session records.
        - Verification after remediation:
        - Auth lifecycle survives restarts without file-backed state mutation in the repo/runtime image.
- Concurrent login/logout/refresh tests pass against the chosen database-backed implementation.

### AUD-015 — YKI materials have authority drift and certification credibility problems
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **content**
        - Exact paths: `apps/backend/materials/yki/certified_bank/manifest.json`, `apps/backend/materials/yki/certified_bank/tasks/writing_prompt/writing_prompt_00116c99-59d7-5e7e-9de9-1422a536146c.json`, `apps/backend/app/routers/yki_practice.py`, `apps/backend/app/routers/yki_exam.py`
        - Evidence:
        - The certified bank manifest claims bank_version=certified and total_tasks=9706, but sampled tasks under that bank still carry quality.certification.status=uncertified.
- Manifest reports audio_tasks_verified=0, which is a major gap for listening material credibility.
- task_bank_certification_report.md shows topic distribution dominated by technology (5,222 tasks) and writing prompts (5,467 tasks), indicating imbalance.
- apps/backend/app/routers/yki_practice.py embeds a separate task bank directly in code, while yki_exam.py reads the certified bank, so practice and exam do not share one clear content authority.
        - Suggested remediation: Reconcile YKI practice and exam to one governed content authority, repair certification metadata so certified means certified, add verified audio coverage for listening, and rebalance topic/task distributions.
        - Verification after remediation:
        - Every task under certified_bank reports certified status with traceable certification metadata.
- Listening assets are present and verified.
- Practice and exam routes consume a documented shared authority or a deliberately versioned derivative.

## Additional Evidence
- `apps/backend/app/router.py` mounts the live API surface but does not mount `admin.py`, so claimed cohort/reporting capability is not part of the running app.
- `apps/backend/app/routers/yki_practice.py` embeds its own task bank directly in code, while `apps/backend/app/routers/yki_exam.py` reads from file-backed certified-bank artifacts.
- `packages/core/api/apiConfig.ts` hardcodes the production API host instead of taking the build-time environment as the source of truth.
