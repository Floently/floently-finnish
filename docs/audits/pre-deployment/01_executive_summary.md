# Executive Summary

## Scope Statement
Blocking production-readiness audit for Floently Learn / Floently Finnish before mobile store deployment.

## What Was Inspected
- Product-critical flows: onboarding, auth, entitlements, YKI, profession tracks, cards, audio, billing surfaces, settings, and runtime startup.
- Architecture and contract authority across backend, mobile client, and content banks.
- Security posture, secrets handling, environment separation, and deployment descriptors.
- Bank integrity for doctor, nurse, practical nurse, and YKI materials.

## Methods Used
- Static inspection of code, configs, manifests, and content banks.
- Execution of repo-declared test/typecheck/lint and boot-gate commands.
- Focused evidence sampling of professional and YKI materials.

## Commands Run
- git status --short
- find . -maxdepth 3 -type d | sort | sed -n "1,400p"
- rg --files .github apps/backend packages App.tsx android ios | sed -n "1,400p"
- apps/backend/.venv/bin/pytest apps/backend/tests engine/tests -q
- cd apps/client && npx tsc --noEmit
- cd apps/client && npx expo lint
- bash apps/backend/scripts/boot_gate.sh
- python3 scripts and inline JSON inspection across cards and YKI banks

## Release Readiness Scores

| Area | Score / 100 |
| --- | ---: |
| Backend | 34 |
| Frontend/mobile | 38 |
| Auth/identity | 28 |
| Security/privacy | 18 |
| Performance/reliability | 31 |
| Usability/accessibility | 42 |
| B2B2C/B2M2C readiness | 20 |
| Content bank integrity | 26 |
| YKI materials integrity | 33 |
| Overall release readiness | 28 |


## Final Release Decision
- **NO-GO**

## Executive Conclusion
The project is not safe to ship to Google Play or the App Store in its current state. The failures are not cosmetic. They affect security, identity handling, entitlement truth, deployment reproducibility, quality gates, mobile release signing, and the credibility of the profession/YKI content banks.

The strongest negative signal is systemic authority drift. Production claims such as "secure storage", "certified bank", "configured Google TTS", "premium entitlements", and "CI coverage" are contradicted by the actual code paths and command outputs inspected during this audit.

## Highest-Risk Findings
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

### AUD-004 — Declared quality gates do not run successfully
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **infra/devops**
        - Exact paths: `.github/workflows/ci.yml`, `tsconfig.json`, `apps/backend/tests/`, `engine/tests/`
        - Evidence:
        - pytest apps/backend/tests engine/tests -q fails during collection with 13 ModuleNotFoundError import errors for api_contract, learning, cards, yki, and engine modules.
- cd apps/client && npx tsc --noEmit fails with TS5090 because tsconfig.json defines paths without baseUrl.
- cd apps/client && npx expo lint fails on the same tsconfig resolver issue before linting business logic.
- .github/workflows/ci.yml:22-38 still advertises these broken gates as the release baseline.
        - Suggested remediation: Repair Python import/package layout and TS config resolution, then require passing backend tests, TypeScript, and lint in CI before merges.
        - Verification after remediation:
        - Backend pytest completes without collection errors.
- Client tsc and expo lint exit 0 on CI and locally.
- Protect main/master with required passing checks.

### AUD-005 — TTS runtime, diagnostics, and deployment contract are inconsistent
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/services/tts/runtime.py`, `apps/backend/app/services/voice_service.py`, `apps/backend/scripts/deploy.sh`, `apps/backend/.env`
        - Evidence:
        - apps/backend/app/services/tts/runtime.py:137-151 only selects OpenAI or development fallback; Google is never selected in the main resolver.
- apps/backend/app/services/voice_service.py:237-250 reports Google as configured in health output, creating a false operational signal.
- apps/backend/scripts/deploy.sh:33-37 excludes .env from rsync but deploy.sh:65-70 starts the container with --env-file $REMOTE_BACKEND/.env.
- Local check showed resolve_tts_audio succeeds only via provider=openai, while the health snapshot claims default provider google.
        - Suggested remediation: Make TTS provider routing honor configured provider order, align health diagnostics to the actual resolver path, and make deployment env injection explicit and deterministic.
        - Verification after remediation:
        - Production-mode TTS health endpoint must name the real active provider chain.
- End-to-end TTS request succeeds on a clean deploy using only documented environment variables.
- A regression test asserts Google/OpenAI/fallback selection behavior.

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

### AUD-013 — Professional card banks contain heavy duplication, generic filler, and low-integrity vocabulary
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **content**
        - Exact paths: `apps/backend/materials/cards/published/professional/doctor/phrases/b1_b2.json`, `apps/backend/materials/cards/published/professional/nurse/phrases/b1_b2.json`, `apps/backend/materials/cards/published/professional/practical_nurse/phrases/b1_b2.json`, `apps/backend/materials/cards/published/professional/*/words/*.json`
        - Evidence:
        - Doctor phrase bank has 1,157 duplicate entries in phrases/b1_b2.json; nurse has 716; practical nurse has 975 duplicate entries (analysis script run during audit).
- Published vocabulary includes suspect low-value tokens such as aamtu, aim, how, who, TT, and other malformed or decontextualized items.
- Sample phrase entries include generic historical medical statements such as `1700-luvulla kirurgian ja lääketieteen oppialat alkoivat yhdistyä`, which do not support workplace communication readiness.
        - Suggested remediation: Deduplicate aggressively, quarantine malformed vocabulary, and rebuild profession banks around authentic Finnish workplace scenarios and communicative tasks rather than imported noise.
        - Verification after remediation:
        - Re-run bank integrity metrics showing duplicate counts near zero and malformed term removal.
- Human review confirms each profession track is dominated by authentic, role-specific, actionable Finnish.

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
