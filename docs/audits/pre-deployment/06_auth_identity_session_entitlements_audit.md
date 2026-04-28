# Auth Identity Session Entitlements Audit

## Scope Statement
Audit of registration, login, token/session storage, entitlement calculation, mock/test access, and privilege enforcement.

## What Was Inspected
- `apps/backend/app/services/auth_service.py`, `apps/backend/app/services/subscription_service.py`, `apps/backend/app/routers/v1_auth.py`, `apps/client/state/authStore.ts`, `packages/core/api/auth.ts`, `packages/core/api/entitlements.ts`.

## Methods Used
- Static code review.
- Contract comparison across backend and client.
- Secret/persistence scan.

## Commands Run
- `sed -n '1,260p' apps/backend/app/services/auth_service.py`
- `sed -n '1,320p' apps/backend/app/services/subscription_service.py`
- `sed -n '1,280p' apps/client/state/authStore.ts`
- `sed -n '1,260p' packages/core/api/auth.ts`

## PASS / WARN / FAIL Verdicts
- Account/session handling: **FAIL**
- Entitlement truthfulness: **FAIL**
- Internal/test-access isolation: **FAIL**
- Session persistence security: **FAIL**

## Findings
### AUD-002 — Mobile auth tokens are stored in AsyncStorage instead of secure storage
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **frontend/mobile**
        - Exact paths: `apps/client/state/authStore.ts`, `apps/client/services/authStorage.ts`, `app.json`
        - Evidence:
        - apps/client/state/authStore.ts:51-60 serializes the full auth session to AsyncStorage/localStorage.
- apps/client/services/authStorage.ts:5-24 stores the bearer token in AsyncStorage, despite comments claiming secure storage.
- app.json:2-3 enables expo-secure-store, but the code path does not use it.
        - Suggested remediation: Move token and session storage to SecureStore/Keychain equivalents, minimize locally stored auth payload, and add migration/clear logic for existing insecure keys.
        - Verification after remediation:
        - Instrument login and confirm no auth token remains in AsyncStorage/localStorage.
- Test session restore, logout, reinstall, and device backup/restore behavior.
- Run a static grep proving AsyncStorage is no longer used for bearer token persistence.

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

## Additional Evidence
- `packages/core/api/auth.ts` supports mock login when `EXPO_PUBLIC_MOCK_AUTH=true`.
- `apps/backend/app/routers/v1_auth.py` exposes `/auth/mock-login` whenever environment is development.
- Entitlement normalization also recognizes all-access test emails on the client, which is not a stable production authority by itself.
