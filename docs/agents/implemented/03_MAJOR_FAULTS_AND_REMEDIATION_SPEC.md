# Major Faults and Correct Remediation — Spec + Initial Fault Map

This file serves two purposes:
1. It defines what the audit agent must produce.
2. It records the major faults already visible from the final tree so they are not missed.

## Required structure for the final major-faults report
For each fault:
- ID
- Title
- Severity
- Evidence
- Why it matters
- Correct remediation
- Wrong remediation to avoid
- Deployment blocking? (Yes/No)
- Verification steps after fix

---

## Initial major-fault map from current tree

### MF-01 — Committed local environments and caches
**Severity:** Critical

**Evidence to verify:**
- `apps/backend/.venv`
- root `node_modules`
- `apps/client/node_modules`
- `apps/client/.expo`
- `apps/backend/__pycache__`

**Why it matters:**
- breaks reproducibility
- bloats repo and hides missing manifests
- contaminates audits, CI, and deployment images
- creates false confidence that the repo works cleanly

**Correct remediation:**
- remove all local artifacts from version control
- tighten `.gitignore`
- re-verify clean checkout install/build/test

**Wrong remediation to avoid:**
- leaving them in place “until deployment is ready”
- testing only on the original machine

---

### MF-02 — Duplicate ownership zones in backend
**Severity:** High

**Evidence to verify:**
- `apps/backend/api/*`
- `apps/backend/app/routers/*`
- `apps/backend/services/*`
- donor/reference layers under `apps/backend/reference/*`

**Why it matters:**
- makes route and service authority ambiguous
- raises risk of dead code, drift, and production bugs
- complicates security and test coverage

**Correct remediation:**
- define one authoritative active route layer
- explicitly demote donor/reference code to non-active reference or remove it
- make imports and route registration unambiguous

**Wrong remediation to avoid:**
- keeping multiple active stacks “just in case”

---

### MF-03 — Duplicate shared client/network entrypoints
**Severity:** High

**Evidence to verify:**
- `packages/core/apiClient.ts`
- `packages/core/api/apiClient.ts`
- `packages/core/apiConfig.ts`
- `packages/core/api/apiConfig.ts`

**Why it matters:**
- easy source of inconsistent base URLs, headers, retry logic, auth handling, and typing

**Correct remediation:**
- converge on one shared client/config source of truth
- leave compatibility wrappers only if deliberately thin and documented

---

### MF-04 — Committed runtime/generated state and output
**Severity:** High

**Evidence to verify:**
- `apps/backend/runtime/state.json`
- `apps/backend/runtime/materials/material_inventory.json`
- publication/accepted output files under cards output

**Why it matters:**
- may mask missing bootstrap logic
- may leak stale state into production or tests
- blurs fixture vs generated artifact vs active dependency

**Correct remediation:**
- classify each file as fixture, seed, generated artifact, or runtime state
- keep only true fixtures/seeds under version control
- generate everything else in controlled build/runtime paths

---

### MF-05 — Migration residue in production repo root
**Severity:** Medium

**Evidence to verify:**
- `EVERYTHING_REMAINING_README.md`
- `PRODUCE_NOW_README.md`
- other assembly-era files not needed in a production repo root

**Why it matters:**
- increases ambiguity about what is active truth
- makes repo feel unfinished and less trustworthy

**Correct remediation:**
- archive or move historical migration materials under a clearly non-production docs/archive path
- keep only live operational and developer docs in the active root/docs

---

### MF-06 — Stub leftovers next to real engine
**Severity:** Medium

**Evidence to verify:**
- real root `engine/*`
- `apps/backend/engine/README.stub.txt`

**Why it matters:**
- can confuse future contributors and tools about engine ownership

**Correct remediation:**
- remove stubs that no longer serve an active purpose or convert them into explicit documentation pointing to the authoritative root engine

---

### MF-07 — Potentially under-specified deployment platform files
**Severity:** Medium

**Evidence to verify:**
- presence of `docker-compose.yml`, `apps/backend/Dockerfile`, `.github/workflows/ci.yml`, `apps/client/eas.json`
- absence or incompleteness of platform-specific deployment descriptors if needed

**Why it matters:**
- project may run locally but still lack a crisp production deployment contract

**Correct remediation:**
- define the intended deployment targets explicitly and add the minimum required platform descriptors

---

### MF-08 — Feature-surface completeness and route exposure
**Severity:** Medium

**Evidence to verify:**
- client route tree vs feature folders vs intended five product modes plus supporting learning-growth surfaces

**Why it matters:**
- backend capability without clear frontend exposure weakens product coherence and testing confidence

**Correct remediation:**
- verify that all intended user-facing flows are actually reachable, owned, and testable

---

## What the audit agent must add beyond this map
- code-level validation of each suspected fault
- severity adjustments if evidence proves otherwise
- exact remediation sequence and effort estimate
