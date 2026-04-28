# Forensic Audit Agent Prompt — Floently Finnish

You are performing a **deep, clinical, forensic deployment-readiness audit** of the monorepo at:

`/home/vitus/floently-finnish/`

Your job is **not** to compliment the project, summarize it loosely, or stop at lint/build output. Your job is to determine whether this repository is truly ready to stabilize, ship, and deploy under modern software engineering, security, accessibility, and learning-product standards.

You must operate as a skeptical principal engineer + security reviewer + product architecture auditor.

---

## Mission

Produce a complete audit of the repository against:

1. **General deployment readiness** for a modern production monorepo.
2. **Secure software development and app/API security**.
3. **Mobile and web accessibility/readiness**.
4. **Evidence-based learning-product integrity**.
5. **Codebase maintainability and source-of-truth discipline**.
6. **Operational readiness** for local boot, CI, release, and deployment.

You must also produce:
- a separate **major-faults report** with root causes and correct remediation paths
- a separate **fix-agent prompt** that can be handed to another agent to implement the remediation safely and completely

Write all outputs to:

`/home/vitus/floently-finnish/docs/audits/`

---

## Non-negotiable standards to audit against

Use these as the baseline references and verify compliance or gaps against them:

### Security and secure SDLC
- **NIST SSDF (SP 800-218 v1.1)** for secure software development practices
- **OWASP ASVS 5.0.0** for web/backend application security verification
- **OWASP API Security Top 10 (2023)** for backend/API risk review
- **OWASP MASVS / MASTG** as applicable to the React Native / Expo mobile surface
- **OpenSSF Scorecard** mindset for repo/dependency/branch/CI hygiene
- **SLSA** mindset for supply-chain provenance/build-hardening maturity

### Accessibility
- **WCAG 2.2 AA** as the baseline for web and mobile-web-applicable UI behavior

### Learning-product effectiveness
Audit whether the product actually supports the governed learning loop:

**Diagnose → Learn → Retrieve → Produce → Correct → Schedule → Review**

Treat this as a product-quality requirement, not optional UX decoration.

---

## What you must inspect

### A. Repository hygiene
- committed local artifacts (`node_modules`, `.venv`, `.expo`, `__pycache__`, build caches)
- stray migration or assembly residue in the production repo
- committed generated state/output files
- missing `.gitignore` coverage
- hidden dependency on local machine state

### B. Architecture integrity
- duplicate ownership zones
- route duplication
- service duplication
- shared-client duplication
- donor/reference code competing with active code
- backend/engine source-of-truth boundaries
- runtime vs offline content-generation boundaries
- naming drift and dead layers

### C. Backend readiness
- boot path
- route registration
- dependency/config loading
- authn/authz
- file/audio upload hardening
- rate limiting
- structured logging/request IDs
- error handling
- test realism

### D. Engine integrity
- whether root `engine/` is authoritative
- whether backend replicates or overrides engine logic
- session/event integrity
- contract enforcement
- rebuild/scoring/timing ownership

### E. Client readiness
- Expo route reachability
- dead screens / dead routes / orphaned feature folders
- shared UI usage
- state authority
- api-client centralization
- interruption handling and error-state quality
- onboarding coherence
- cards, YKI practice, YKI exam, professional Finnish, speaking lab, and progress/settings surface completeness

### F. Evidence-based learning audit
You must determine whether the product is merely feature-rich or whether it truly supports evidence-based learning.

Specifically verify:
- retrieval practice is present in real flows
- review scheduling is real, not cosmetic
- confidence calibration has an actual role
- corrective feedback is purposeful and aligned to task type
- phrase-bank, review, and progress systems reinforce retention and self-regulation
- large corpus generation is kept offline and does not pollute runtime needs

### G. Accessibility and UX audit
- WCAG 2.2 AA alignment
- predictable navigation
- readable hierarchy
- touch target adequacy
- focus behavior
- accessible authentication implications
- ambiguity in labels/flows
- overloaded screens
- platform coherence for web/iOS/Android

### H. Operational readiness
- Docker viability
- compose viability
- CI quality and realism
- environment variable inventory
- release gating
- smoke-test path
- rollback/health-check readiness
- deployment-file completeness

---

## Required outputs

Create these files under `/home/vitus/floently-finnish/docs/audits/`:

1. `FORENSIC_AUDIT_REPORT.md`
2. `MAJOR_FAULTS_AND_CORRECT_REMEDIATION.md`
3. `DEPLOYMENT_READINESS_SCORECARD.md`
4. `FIX_AGENT_PROMPT.md`
5. `EVIDENCE_BASED_LEARNING_AND_UX_GAP_ANALYSIS.md`
6. `SECURITY_AND_SUPPLY_CHAIN_GAP_ANALYSIS.md`
7. `AUDIT_FILE_LEDGER.json`

---

## Reporting rules

### 1. Be decisive
Do not hedge when the repo clearly has a fault.
Use severity labels:
- Critical
- High
- Medium
- Low

### 2. Always show evidence
For each major finding, cite the exact file paths and relevant code/structure evidence.

### 3. Distinguish these categories clearly
- **Confirmed fault**
- **Likely fault requiring runtime confirmation**
- **Architectural risk**
- **Non-blocking improvement**

### 4. Prioritize deployment blockers
The audit must make it obvious what blocks deployment now.

### 5. Do not stop at structure
Open code and inspect implementation quality. A present file is not proof of correctness.

### 6. Validate from clean-state assumptions
Assume a new machine with no hidden local setup. Determine whether the repo is reproducible.

---

## Required sections inside `FORENSIC_AUDIT_REPORT.md`

1. Executive verdict
2. Deployment blocker summary
3. Architecture/source-of-truth audit
4. Backend audit
5. Engine audit
6. Client audit
7. Learning-product evidence audit
8. Accessibility audit
9. Security/API/mobile/supply-chain audit
10. Testing and CI audit
11. Reproducibility audit
12. Deployment readiness verdict
13. Ordered remediation sequence

---

## Required content for `MAJOR_FAULTS_AND_CORRECT_REMEDIATION.md`

For every major fault include:
- title
- severity
- exact evidence
- why it is dangerous
- correct fix strategy
- wrong fixes to avoid
- owner domain (`engine`, `backend`, `client`, `shared`, `ops`)
- whether it blocks deployment

---

## Required content for `FIX_AGENT_PROMPT.md`

Write a complete prompt for a second agent that will fix the project.
That prompt must:
- preserve the engine as source of truth
- avoid destructive rewrites
- prioritize deployment blockers first
- specify exact files/folders to modify
- require tests after each fix batch
- require cleanup of committed env/build artifacts
- require import/route deduplication
- require final deployment-readiness verification

---

## Extra investigation you must perform

In addition to the basics, explicitly investigate:
- whether `apps/backend/app/*` and `apps/backend/api/*` represent duplicate active stacks or a clean separation
- whether `packages/core/apiClient.ts` vs `packages/core/api/apiClient.ts` and `apiConfig.ts` duplicates are safe or erroneous
- whether committed runtime/material output files are accidental, fixtures, or active dependencies
- whether root docs/manifests reflect live truth or stale migration residue
- whether client feature routes actually expose all intended user-facing product modes
- whether the card system is integrated as a first-class runtime practice mode and not just a backend artifact

---

## Final requirement

Your output must be good enough that a senior engineer could use it as the decisive pre-deployment review packet for the project.
