# Usability Accessibility User Satisfaction Audit

## Scope Statement
Audit of navigation clarity, user trust, accessibility basics, permission UX, and coherence of the learner journey.

## What Was Inspected
- App shell/navigation, home route gating, settings/image picker flow, audio/recording UX, and surfaced labels versus actual backend behavior.

## Methods Used
- Static code inspection.
- Entitlement and route comparison.

## Commands Run
- `sed -n '1,320p' apps/client/state/AppShell.tsx`
- `sed -n '1,220p' apps/client/state/HomeRoute.tsx`
- `sed -n '1,260p' packages/ui/screens/SettingsScreen.tsx`

## PASS / WARN / FAIL Verdicts
- Journey clarity: **WARN**
- State trustworthiness: **FAIL**
- Accessibility/privacy UX: **WARN**

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

## Additional Evidence
- The product exposes billing and access-state language that the backend cannot reliably honor in production yet.
- Permission denial in settings falls back to an alert rather than a recoverable, store-ready education flow.
