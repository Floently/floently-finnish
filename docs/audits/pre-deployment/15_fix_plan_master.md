# Fix Plan Master

## Scope Statement
Prioritized remediation sequence for making Floently Finnish deployable without broad destructive rewrites.

## What Was Inspected
- All blocking findings in this audit packet.

## Methods Used
- Risk-based prioritization by release impact, exploitability, and dependency order.

## Commands Run
- N/A for planning artifact; derived from audit evidence.

## Remediation Sequence
1. **Secrets and environment containment**
- Remove committed secrets/runtime state, rotate credentials, and establish per-environment secret injection.
- Lock production config so dev_mode cannot default open.

2. **Auth/session hardening**
- Move mobile auth persistence to secure storage.
- Replace JSON file-backed auth/session authority with a proper datastore-backed implementation.
- Enforce auth on personalized endpoints.

3. **Billing/entitlement truth**
- Remove dev entitlement override from production paths.
- Implement real plans, checkout, portal, and plan-list contracts.
- Add tests for free/preview/paid/internal paths.

4. **Quality gate repair**
- Fix Python import/package layout and TS path configuration.
- Make pytest, TypeScript, and lint pass in CI before release branches can advance.

5. **TTS and deploy contract repair**
- Align TTS runtime with configured providers.
- Fix deploy env handling and health/readiness probes.
- Add deterministic TTS smoke tests.

6. **Mobile release packaging**
- Replace debug signing, review permissions, and complete store metadata/legal/config artifacts.

7. **Content-bank remediation**
- Clean duplicates and malformed card content.
- Augment profession-specific scenario coverage.
- Reconcile YKI certification and authority drift.

## Verification Exit Criteria
- All release blockers in `17_audit_findings.csv` closed.
- CI passes on a clean environment.
- Boot/readiness and TTS smoke checks pass.
- Manual regression of auth, billing, YKI, professional, cards, and audio journeys completed on release candidates.
