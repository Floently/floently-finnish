# Security Privacy Compliance Audit

## Scope Statement
Audit of secrets handling, access control, storage safety, privacy risk, and production hardening gaps.

## What Was Inspected
- Tracked env files, auth/session storage, runtime state, route authz, native manifests, and backend security helpers.

## Methods Used
- Secret-pattern scan with `rg`.
- Review of token persistence and route protection.
- Manual compliance-oriented review of retention/deletion/privacy posture.

## Commands Run
- `rg -n secret patterns across repo`
- `sed -n '1,240p' apps/backend/app/core/security.py`
- `sed -n '1,140p' apps/backend/app/core/state_store.py`

## PASS / WARN / FAIL Verdicts
- Secrets and key management: **FAIL**
- Broken access control risk: **FAIL**
- Secure local storage: **FAIL**
- Data minimization / privacy posture: **WARN**

## Findings
### AUD-001 — Committed secrets and sensitive runtime data are present in the repository
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **security/compliance**
        - Exact paths: `apps/backend/.env`, `apps/backend/app/runtime/state.json`, `android/app/debug.keystore`
        - Evidence:
        - apps/backend/.env:43 contains a live-looking OPENAI_API_KEY value.
- apps/backend/.env:22 contains a malformed OPENAI_API_KEY line with an inline comment, proving env hygiene drift.
- rg -n secret scan found password_hash material in apps/backend/app/runtime/state.json and a committed android/app/debug.keystore.
        - Suggested remediation: Purge committed secrets and runtime state from git history where required, rotate affected credentials immediately, remove committed debug/release-sensitive assets, and replace repo .env usage with secret injection per environment.
        - Verification after remediation:
        - Rotate OPENAI and any other exposed credentials.
- Confirm `git grep` no longer returns live secret values or password_hash snapshots.
- Verify production deploys receive secrets only from secret management, not tracked files.

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

### AUD-008 — Card runtime endpoints permit anonymous access and weaken authorization boundaries
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/routers/v1_cards.py`
        - Evidence:
        - apps/backend/app/routers/v1_cards.py:29-38 maps missing auth to user_id="anonymous".
- apps/backend/app/routers/v1_cards.py:51-108 exposes adaptive session start, answer, next, and deck retrieval without requiring a verified authenticated user.
        - Suggested remediation: Require authenticated identity for personalized card session endpoints, enforce entitlement checks, and add explicit public/private route boundaries.
        - Verification after remediation:
        - Unauthenticated calls to adaptive session and deck endpoints return 401/403.
- Authorized users can access only the tracks permitted by their entitlements.

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

### AUD-010 — Android release configuration is not store-safe
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **frontend/mobile**
        - Exact paths: `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, `android/app/debug.keystore`, `app.json`
        - Evidence:
        - android/app/build.gradle:112-115 signs the release build with the debug keystore.
- android/app/src/main/AndroidManifest.xml:5 requests SYSTEM_ALERT_WINDOW, a high-risk permission with no consumer justification in this product.
- android/app/src/main/AndroidManifest.xml:15 sets android:allowBackup="true".
- app.json is minimal and lacks store-facing metadata, privacy links, version discipline, and update-channel configuration.
        - Suggested remediation: Create a real release signing path, remove unjustified permissions, review backup behavior for sensitive data, and complete store metadata/configuration per platform.
        - Verification after remediation:
        - Build signed release artifacts with a non-debug keystore/certificate.
- Permission review passes with only justified runtime permissions present.
- Internal test uploads to Play/App Store Connect validate package metadata and signing.

## Compliance Risk Notes
- No convincing user-facing deletion/privacy/legal flow was found in the mobile deliverables inspected.
- The combination of committed runtime state and insecure token persistence raises clear GDPR and store-policy review risk.
