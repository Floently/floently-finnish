# Testing CI CD Release Audit

## Scope Statement
Audit of automated tests, CI fidelity, release gating, and reproducible build confidence.

## What Was Inspected
- `.github/workflows/ci.yml`, backend/engine tests, client TypeScript/lint scripts, mobile/native versioning, and deployment scripts.

## Methods Used
- Direct execution of declared gates.
- Static CI/workflow review.

## Commands Run
- `apps/backend/.venv/bin/pytest apps/backend/tests engine/tests -q`
- `cd apps/client && npx tsc --noEmit`
- `cd apps/client && npx expo lint`

## PASS / WARN / FAIL Verdicts
- Backend tests: **FAIL**
- Client static checks: **FAIL**
- CI credibility: **FAIL**
- Release discipline: **WARN**

## Findings
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

## Test Output Evidence
- Pytest collection broke with 13 import errors before any assertions ran.
- TypeScript and ESLint both failed on invalid path alias configuration.
- CI does not run mobile release smoke tests or store packaging validation.
