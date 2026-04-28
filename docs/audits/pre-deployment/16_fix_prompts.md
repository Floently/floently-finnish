# Fix Prompts

## Scope Statement
Ready-to-use prompts for a follow-up agent to remediate grouped failures safely.

## What Was Inspected
- Blocking findings and their file-level evidence.

## Methods Used
- Grouped by change safety, ownership, and dependency order.

## Commands Run
- N/A for prompt artifact.

## Prompt 1 — Secrets, env hardening, and deploy contract
Inspect and fix secret handling and deployment environment drift in `/home/vitus/floently-finnish/apps/backend/.env`, `/home/vitus/floently-finnish/apps/backend/scripts/deploy.sh`, `/home/vitus/floently-finnish/apps/backend/app/core/config.py`, and related deployment descriptors. Remove tracked secret values from active files, make production fail closed when required secrets are missing, and ensure deploy scripts do not exclude files they later require. Do not change product behavior unrelated to configuration. Verify by running the boot gate, documenting the final env contract, and proving no live secret values remain in tracked files.

## Prompt 2 — Mobile auth/session hardening
Inspect `/home/vitus/floently-finnish/apps/client/state/authStore.ts`, `/home/vitus/floently-finnish/apps/client/services/authStorage.ts`, and the Expo config. Replace AsyncStorage/localStorage token persistence with secure storage, keep session restore/logout working, and add a migration path that clears insecure legacy keys. Do not break existing login/register/session restore flows. Verify on device/emulator that login persists, logout clears, and AsyncStorage no longer contains the bearer token.

## Prompt 3 — Entitlements and billing truthfulness
Inspect `/home/vitus/floently-finnish/apps/backend/app/services/subscription_service.py`, `/home/vitus/floently-finnish/apps/backend/app/routers/v1_subscription.py`, `/home/vitus/floently-finnish/packages/core/api/billing.ts`, and any related plan/entitlement code. Remove dev-only entitlement overrides from production logic, implement or stub-safe the missing `/api/v1/subscription/plans` contract, and make checkout/portal clearly production-ready or unavailable. Do not regress existing auth session handling. Verify with automated tests covering free, preview, paid, expired, and internal-access states.

## Prompt 4 — CI and packaging repair
Inspect `/home/vitus/floently-finnish/.github/workflows/ci.yml`, `/home/vitus/floently-finnish/tsconfig.json`, backend Python package imports, and client TypeScript/lint configuration. Make backend pytest collect and execute, make `npx tsc --noEmit` and `npx expo lint` pass, and update CI so these become required checks. Do not rewrite unrelated product code. Verify by running all three commands locally and in CI.

## Prompt 5 — TTS/runtime alignment
Inspect `/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py`, `/home/vitus/floently-finnish/apps/backend/app/services/voice_service.py`, and related provider modules. Make provider selection honor configured provider order, align diagnostics with actual runtime behavior, and add a smoke test covering configured provider resolution and failure behavior. Do not break existing TTS response shapes. Verify with local provider health checks and a real `resolve_tts_audio` call in production-mode configuration.

## Prompt 6 — Professional bank cleanup and augmentation
Inspect `/home/vitus/floently-finnish/apps/backend/materials/cards/published/professional/`, validated banks, and source import pipelines. Remove duplicate sentence stock, quarantine malformed vocabulary, and augment doctor, nurse, and practical nurse banks with authentic Finnish workplace communication for handover, emergencies, medication safety, documentation, home care, relatives, and reassurance. Do not break manifest or schema compatibility. Verify by regenerating coverage CSVs with sharply reduced duplicates and by producing human-review samples for each profession.

## Prompt 7 — YKI authority and certification repair
Inspect `/home/vitus/floently-finnish/apps/backend/materials/yki/certified_bank/`, `/home/vitus/floently-finnish/apps/backend/app/routers/yki_practice.py`, and `/home/vitus/floently-finnish/apps/backend/app/routers/yki_exam.py`. Reconcile the source of truth so practice and exam are governed by one documented authority or a versioned derivative, ensure certified-bank tasks carry truthful certification metadata, and add verified listening-audio coverage. Do not break existing API response envelopes. Verify by sampling tasks, manifest metadata, and route behavior after the change.
