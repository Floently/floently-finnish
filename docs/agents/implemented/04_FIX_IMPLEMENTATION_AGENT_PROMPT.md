# Fix Agent Prompt — Floently Finnish Deployment Readiness

You are the implementation agent responsible for fixing the deployment-blocking and high-severity issues in:

`/home/vitus/floently-finnish/`

Before you start, you must read the following audit outputs from:

`/home/vitus/floently-finnish/docs/audits/`

Required inputs:
- `FORENSIC_AUDIT_REPORT.md`
- `MAJOR_FAULTS_AND_CORRECT_REMEDIATION.md`
- `DEPLOYMENT_READINESS_SCORECARD.md`
- `EVIDENCE_BASED_LEARNING_AND_UX_GAP_ANALYSIS.md`
- `SECURITY_AND_SUPPLY_CHAIN_GAP_ANALYSIS.md`

Your job is to fix the project **safely**, **surgically**, and **without breaking the engine source-of-truth model**.

---

## Non-negotiable constraints

1. The root `engine/` remains the authoritative source of truth for YKI exam behavior.
2. Do not rewrite working systems wholesale if targeted repair can solve the issue.
3. Remove duplicate ownership, do not create new duplicate ownership.
4. Keep donor/reference material isolated or delete it if unused.
5. Prefer correctness, reproducibility, and clarity over convenience.
6. After each fix batch, run the relevant checks and record the outcome.

---

## Primary mission

Take the audited repo from “structurally promising but risky” to “clean, reproducible, deployment-ready baseline”.

---

## Fix order

### Phase 1 — Repository hygiene and reproducibility
- remove committed local artifacts (`.venv`, `.expo`, `node_modules`, `__pycache__`, caches)
- tighten `.gitignore`
- confirm clean install paths from manifests only

### Phase 2 — Source-of-truth convergence
- resolve duplicate route/service/API ownership
- converge duplicate shared client/config entrypoints
- remove or demote dead/stub/donor layers
- ensure engine authority is explicit and not shadowed

### Phase 3 — Runtime/generated artifact cleanup
- classify runtime state, fixtures, and generated files
- keep only legitimate version-controlled fixtures/seeds
- move generated/runtime files out of source control where required

### Phase 4 — Boot and test stabilization
- make backend boot deterministic
- make client boot deterministic
- fix any import/path breakage
- ensure health checks and smoke tests pass

### Phase 5 — Security and accessibility hardening
- address critical and high audit findings for API/auth/config/secret handling
- address high-priority WCAG and mobile-security issues

### Phase 6 — Deployment readiness
- finalize deployment descriptors for the chosen platform path
- validate Docker/compose/CI/EAS workflows
- produce a final readiness note

---

## Required outputs

Write these files under `/home/vitus/floently-finnish/docs/audits/`:
- `FIX_EXECUTION_LOG.md`
- `FIX_CHANGE_LEDGER.json`
- `POST_FIX_DEPLOYMENT_READINESS_SUMMARY.md`
- `POST_FIX_OPEN_ISSUES.md`

---

## Required implementation behavior

For every change:
- identify exact file(s) changed
- state why the change was necessary
- state which audit finding it resolves
- state how you verified it

Do **not** make unlogged speculative changes.

---

## Required verification after each phase

At minimum, run and record:
- dependency install checks
- backend import/boot checks
- frontend type/lint/build checks as applicable
- test suite or targeted tests relevant to the changed area
- smoke checks for critical routes or screens

---

## Specific high-risk zones to treat carefully
- route registration and route authority
- engine/backend boundary
- auth/session state
- cards publication/runtime flow
- generated practice-content and material inventory flow
- duplicate API client/config wrappers
- files that are currently committed but should be runtime- or build-generated

---

## Final success condition

The project should end in a state where:
- a clean clone can install and run
- there is no ambiguity about source of truth
- deployment blockers are resolved
- the repo is materially cleaner and safer
- the resulting state is documented for handoff
