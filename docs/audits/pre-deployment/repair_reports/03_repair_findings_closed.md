Scope: audit findings fully or materially closed by this remediation pass.

Closed / materially mitigated findings:

1. Title: Hardcoded API base URL and local/prod drift
- Original severity: Critical
- Verdict: PASS
- Deployment impact: should fix before deployment
- Owner: frontend/mobile
- Files: [packages/core/api/apiConfig.ts](/home/vitus/floently-finnish/packages/core/api/apiConfig.ts), [apps/client/core/api/apiConfig.ts](/home/vitus/floently-finnish/apps/client/core/api/apiConfig.ts)
- Evidence: both files now normalize `EXPO_PUBLIC_API_BASE_URL` and stop pinning `https://learn-api.floently.com`.
- Suggested remediation applied: env-driven base URL with stable fallback.
- Verification: `cd apps/client && npx tsc --noEmit`, `cd apps/client && npx expo lint`

2. Title: Mobile token/session persisted in plain storage
- Original severity: Critical
- Verdict: PASS
- Deployment impact: should fix before deployment
- Owner: frontend/mobile
- Files: [apps/client/services/authStorage.ts](/home/vitus/floently-finnish/apps/client/services/authStorage.ts), [apps/client/state/authStore.ts](/home/vitus/floently-finnish/apps/client/state/authStore.ts)
- Evidence: native path now uses `expo-secure-store`; legacy `AsyncStorage` keys are migrated and cleared.
- Suggested remediation applied: secure storage with migration/cleanup.
- Verification: `cd apps/client && npx tsc --noEmit`

3. Title: Production entitlement override via default dev mode
- Original severity: Critical
- Verdict: PASS
- Deployment impact: blocks deployment
- Owner: backend
- Files: [apps/backend/app/core/config.py](/home/vitus/floently-finnish/apps/backend/app/core/config.py), [apps/backend/app/services/subscription_service.py](/home/vitus/floently-finnish/apps/backend/app/services/subscription_service.py)
- Evidence: `FLOENTLY_DEV_MODE` now defaults by environment; premium override requires explicit `ALLOW_DEV_ENTITLEMENT_OVERRIDE`.
- Suggested remediation applied: fail-closed production entitlements.
- Verification: code inspection plus targeted pytest subset.

4. Title: Billing stub success responses
- Original severity: High
- Verdict: PASS
- Deployment impact: should fix before deployment
- Owner: backend
- Files: [apps/backend/app/routers/v1_subscription.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_subscription.py), [apps/backend/app/services/subscription_service.py](/home/vitus/floently-finnish/apps/backend/app/services/subscription_service.py)
- Evidence: `/subscription/plans` exists; checkout/portal now depend on `BILLING_CHECKOUT_BASE_URL` / `BILLING_PORTAL_BASE_URL` and fail closed when absent.
- Suggested remediation applied: truthful contract, no fake-ready mode.
- Verification: code inspection; frontend typecheck/lint clean.

5. Title: Anonymous personalized card runtime access
- Original severity: Critical
- Verdict: PASS
- Deployment impact: blocks deployment
- Owner: backend
- Files: [apps/backend/app/routers/v1_cards.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_cards.py)
- Evidence: adaptive start, runtime answer, next, and runtime deck now require authenticated user ID.
- Suggested remediation applied: auth required for personalized card state.
- Verification: code inspection.

6. Title: TTS provider authority mismatch
- Original severity: High
- Verdict: PASS
- Deployment impact: should fix before deployment
- Owner: backend
- Files: [apps/backend/app/services/tts/providers/google.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/providers/google.py), [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py), [apps/backend/app/services/voice_service.py](/home/vitus/floently-finnish/apps/backend/app/services/voice_service.py)
- Evidence: runtime now honors configured provider order; health snapshot output includes aligned provider status.
- Suggested remediation applied: implemented Google provider path and runtime/health alignment.
- Verification: `apps/backend/.venv/bin/python3 -c "import sys; sys.path.insert(0, 'apps/backend'); from app.services.voice_service import get_tts_health_snapshot; print(get_tts_health_snapshot())"`

7. Title: Boot gate false-negative and weak readiness check
- Original severity: High
- Verdict: PASS
- Deployment impact: should fix before deployment
- Owner: infra/devops
- Files: [apps/backend/scripts/boot_gate.sh](/home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh)
- Evidence: final command output returned the health payload successfully.
- Suggested remediation applied: deterministic import + route-presence + handler execution probe.
- Verification: `bash apps/backend/scripts/boot_gate.sh`

8. Title: Debug keystore and runtime artifacts tracked in git
- Original severity: Critical
- Verdict: PASS
- Deployment impact: blocks deployment
- Owner: security/compliance
- Files: [.gitignore](/home/vitus/floently-finnish/.gitignore)
- Evidence: `git rm --cached` removed `android/app/debug.keystore`, runtime state, and voice recordings from version control; ignore rules added.
- Suggested remediation applied: repo containment of sensitive/generated material.
- Verification: `git status --short`
