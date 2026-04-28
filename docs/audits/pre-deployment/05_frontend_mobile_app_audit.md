# Frontend Mobile App Audit

## Scope Statement
Audit of the Expo/React Native mobile client, navigation shell, persistence, permissions, audio behavior, and store-readiness basics.

## What Was Inspected
- `apps/client/app`, `apps/client/state`, shared audio services, settings flow, app config, Android/iOS native files, and TypeScript/lint setup.

## Methods Used
- Static UI/navigation inspection.
- TypeScript and lint execution.
- Config and permission manifest review.

## Commands Run
- `cd apps/client && npx tsc --noEmit`
- `cd apps/client && npx expo lint`
- `sed -n '1,260p' apps/client/state/*.ts*`
- `sed -n '1,260p' android/app/src/main/AndroidManifest.xml`
- `sed -n '1,260p' ios/floentlyfinnish/Info.plist`

## PASS / WARN / FAIL Verdicts
- Navigation correctness: **WARN**
- Mobile persistence/security: **FAIL**
- Permission flow quality: **WARN**
- Store packaging readiness: **FAIL**
- Frontend quality gates: **FAIL**

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

### AUD-011 — Store compliance, privacy, and accessibility readiness are incomplete
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **should fix before deployment**
        - Owner suggestion: **product**
        - Exact paths: `packages/ui/screens/SettingsScreen.tsx`, `ios/floentlyfinnish/Info.plist`, `android/app/src/main/AndroidManifest.xml`, `apps/client/app/_layout.tsx`
        - Evidence:
        - packages/ui/screens/SettingsScreen.tsx uses alert-based permission denial UX and local-only image state with no persistence or deletion/privacy handling.
- apps/client/app/_layout.tsx is a bare Slot wrapper with no global error boundary, nav shell wiring, accessibility provider, or store-ready startup policy.
- No privacy policy, deletion flow, or data retention disclosures were found in the mobile deliverables reviewed.
        - Suggested remediation: Add user-visible privacy/legal surfaces, complete deletion and data handling flows, and perform an accessibility pass across critical journeys.
        - Verification after remediation:
        - Manual WCAG-style review of onboarding, auth, speaking, billing, and settings flows.
- Store listing and in-app legal pages align with actual data collection and microphone/photo usage.

## Evidence Highlights
- Root TypeScript config is broken (`TS5090`) before business logic is checked.
- The mobile app is configured with `expo-secure-store`, but auth storage still uses `AsyncStorage`.
- Android release signing is still tied to the debug keystore.
