# Deployment Readiness Checklist for Floently Finnish

This checklist is the standard the audit agent must verify against.

## 1. Reproducibility and clean checkout
- A fresh clone must install and run without relying on committed local environments.
- No committed `.venv`, `node_modules`, `.expo`, caches, or compiled bytecode.
- Backend and client dependencies must be reconstructible from manifests only.
- Lockfiles and dependency manifests must be internally consistent.

## 2. Source-of-truth integrity
- Exactly one authoritative owner for each critical concern:
  - YKI exam runtime truth
  - API routing and domain routing
  - auth/session state
  - shared API client/config
  - cards runtime and publication flow
- No donor/reference layer may silently compete with active production logic.

## 3. Backend readiness
- FastAPI boot path is deterministic.
- Route registration is explicit and test-covered.
- Health endpoint exists and is meaningful.
- Config loading is environment-driven and safe by default.
- Sensitive routes have authn/authz expectations documented and enforced.
- File/audio upload paths are validated and rate-limited where appropriate.
- Logging and request correlation exist and do not leak secrets.

## 4. Engine integrity
- Engine is the single source of truth for exam generation, session integrity, scoring, timing, and rebuild logic.
- Backend adapters do not replicate or override engine logic.
- Session reconstruction and event store invariants are test-covered.
- Runtime contracts are enforced at backend-client boundaries.

## 5. Client readiness
- Expo route tree is coherent and reachable.
- No dead routes, duplicated screens, or unowned feature entrypoints.
- Shared UI primitives are reused consistently.
- State shell and stores are authoritative and non-duplicated.
- Network clients are centralized and typed.
- Error states, loading states, and empty states are explicit.

## 6. Evidence-based learning quality
- Learning loop must support: Diagnose → Learn → Retrieve → Produce → Correct → Schedule → Review.
- Retrieval practice is visible in runtime behavior, not only content presentation.
- Review/scheduling logic exists and is not cosmetic.
- Confidence capture/calibration is purposeful and used downstream.
- Phrase-bank and progress features reinforce retention and self-regulated learning.
- Practice-content pipeline remains support infrastructure, not a runtime dependency.

## 7. Accessibility and UX quality
- Mobile/web UI is checkable against WCAG 2.2 AA.
- Touch targets, focus behavior, redundant entry, accessible authentication, and consistent help are reviewed.
- Navigation labels match user mental models.
- Critical learning flows are unambiguous and interruption-tolerant.

## 8. Security baseline
- Web/backend review against OWASP ASVS 5.0 and OWASP API Security Top 10 2023.
- Mobile/client review against OWASP MASVS / MASTG guidance for React Native / Expo-applicable controls.
- Secrets are not committed.
- Object-level authorization and function-level authorization are reviewed.
- SSRF, unsafe API consumption, misconfiguration, and unrestricted resource consumption are checked.
- Transport, storage, auth, and privacy controls are reviewed.

## 9. Supply-chain and CI quality
- CI is meaningful, not symbolic.
- Static checks, tests, and build steps reflect actual repo boundaries.
- Dependency and artifact hygiene are reviewed.
- OpenSSF Scorecard-aligned issues are considered.
- SLSA-style provenance/build-hardening maturity is assessed proportionately.
- SBOM generation feasibility is assessed.

## 10. Deployment readiness
- Docker path works.
- Local compose path works.
- Expo EAS config is valid.
- Missing deployment platform files are identified explicitly.
- Environment variable inventory exists with safe defaults and no hidden dependencies.
- Rollback, health-check, and smoke-test expectations are documented.

## 11. Test quality
- Tests map to critical flows, not only scaffolding.
- Engine, backend, and client all have meaningful coverage of risky behavior.
- Tests are reproducible from a clean environment.
- There is a clear gap list for any missing integration/e2e/security tests.
