# Deployment Infrastructure Mobile Store Readiness Audit

## Scope Statement
Audit of Docker/deploy descriptors, env management, boot stability, mobile native packaging, and store release readiness.

## What Was Inspected
- `apps/backend/Dockerfile`, `apps/backend/scripts/deploy.sh`, `apps/backend/scripts/boot_gate.sh`, `docker-compose.yml`, `apps/backend/railway.toml`, `render.yaml`, Android/iOS native configs.

## Methods Used
- Static descriptor review.
- Boot-gate execution.
- Native manifest/build config review.

## Commands Run
- `sed -n '1,220p' apps/backend/Dockerfile`
- `sed -n '1,220p' apps/backend/scripts/deploy.sh`
- `bash apps/backend/scripts/boot_gate.sh`
- `sed -n '1,260p' android/app/build.gradle`
- `sed -n '1,260p' android/app/src/main/AndroidManifest.xml`

## PASS / WARN / FAIL Verdicts
- Container/deploy reproducibility: **FAIL**
- Environment contract clarity: **FAIL**
- Android release readiness: **FAIL**
- iOS release readiness: **WARN**

## Findings
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

### AUD-006 — Boot health contract is unreliable and failed the provided boot gate
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **infra/devops**
        - Exact paths: `apps/backend/scripts/boot_gate.sh`, `apps/backend/app/routers/health.py`, `apps/backend/main.py`
        - Evidence:
        - bash apps/backend/scripts/boot_gate.sh printed Import OK, then logged startup, then exited with `ERROR: /health did not respond within 10s`.
- apps/backend/app/routers/health.py returns a static ok payload and does not validate DB, state store, YKI materials, TTS path, or mounted runtime dependencies.
        - Suggested remediation: Repair server startup/boot gate behavior and replace shallow health checks with readiness probes that validate critical dependencies and fail fast when the runtime is not genuinely ready.
        - Verification after remediation:
        - boot_gate.sh succeeds repeatedly on a clean environment.
- Readiness endpoint reflects DB, auth state store, material authority, and TTS readiness.
- Container orchestration uses readiness/liveness probes with realistic timeouts.

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
