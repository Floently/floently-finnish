Scope: high-risk pre-deployment remediation based on the `NO-GO` audit packet under `docs/audits/pre-deployment/`.

What was inspected:
- backend env/config/auth/entitlement/TTS/deploy path
- mobile auth persistence and API base resolution
- Android release configuration and manifest security
- local verification gates

Methods used:
- audit-to-code mapping
- minimal-risk code edits
- gate reruns for evidence

Commands run:
- `bash apps/backend/scripts/boot_gate.sh`
- `cd apps/client && npx tsc --noEmit`
- `cd apps/client && npx expo lint`
- `apps/backend/.venv/bin/pytest apps/backend/tests/test_api_contract.py apps/backend/tests/test_learning_adapter.py apps/backend/tests/test_learning_scheduler.py -q`
- `apps/backend/.venv/bin/pytest apps/backend/tests -q`

Evidence-backed summary:
- PASS: API base URL is no longer hardcoded. `packages/core/api/apiConfig.ts` and `apps/client/core/api/apiConfig.ts` now honor `EXPO_PUBLIC_API_BASE_URL`.
- PASS: mobile auth/session persistence moved off plain `AsyncStorage` to `expo-secure-store` for native, with migration/cleanup logic in `apps/client/services/authStorage.ts` and `apps/client/state/authStore.ts`.
- PASS: production entitlement truth is hardened. `apps/backend/app/core/config.py` no longer defaults `FLOENTLY_DEV_MODE` to `true` outside non-production envs, and `apps/backend/app/services/subscription_service.py` now gates premium override behind explicit `ALLOW_DEV_ENTITLEMENT_OVERRIDE`.
- PASS: backend billing is now truthful. `apps/backend/app/routers/v1_subscription.py` exposes `/subscription/plans` and returns configured billing URLs only when env is present; otherwise it fails closed through `BILLING_NOT_CONFIGURED`.
- PASS: anonymous personalized card access is blocked. `apps/backend/app/routers/v1_cards.py` now requires auth for adaptive session, next, answer, and runtime deck endpoints.
- PASS: TTS provider authority is aligned. `apps/backend/app/services/tts/runtime.py` now honors `tts_default_provider`, `tts_fallback_provider`, and a real Google provider implementation in `apps/backend/app/services/tts/providers/google.py`; `apps/backend/app/services/voice_service.py` reports actual provider status.
- PASS: boot gate now passes locally. Output from `bash apps/backend/scripts/boot_gate.sh`: `Import OK` and `{'status': 'ok', 'service': 'floently-backend'}`.
- PASS: TypeScript compile and Expo lint now exit cleanly after `tsconfig.json` base URL fix and follow-up frontend type repairs.
- PASS: tracked sensitive runtime artifacts and the debug keystore were removed from git index; `.gitignore` now covers them.
- WARN: full backend pytest still fails in legacy card/YKI areas. Residual evidence from `apps/backend/.venv/bin/pytest apps/backend/tests -q` shows missing `tests.cards_test_support`, missing `jwt` in the local backend venv, and stale YKI contracts (`ExamSessionRequest`, `SECTION_ORDER`) not matching tests.
- FAIL: release signing is still not deployable without user-provided keystore env vars. `android/app/build.gradle` now fails closed instead of silently using the debug keystore.
- FAIL: content-bank and YKI integrity findings from the audit remain open; this remediation pass did not rewrite or re-author the banks.

PASS / WARN / FAIL verdicts:
- PASS: secrets/runtime artifact containment in git
- PASS: mobile auth storage hardening
- PASS: entitlement truth in production paths
- PASS: deploy/env/API/TTS contract alignment
- PASS: Android release config no longer uses debug signing
- WARN: backend CI coverage is improved but not clean
- FAIL: release readiness remains insufficient due unresolved backend test drift, external billing/signing handoffs, and content-bank integrity gaps
