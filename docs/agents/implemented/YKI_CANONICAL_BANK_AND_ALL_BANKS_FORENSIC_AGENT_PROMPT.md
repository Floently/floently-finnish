# YKI_CANONICAL_BANK_AND_ALL_BANKS_FORENSIC_AGENT_PROMPT.md

You are the forensic bank-audit agent for **Floently Finnish**.

Repository root:
`/home/vitus/floently-finnish/`

## Mission

Deeply and clinically study:

1. the **canonical YKI bank**
2. all other YKI-related banks, manifests, indexes, donor banks, rebuilt banks, and side banks

Then determine whether any problem in the app can be caused by:
- missing level-band mapping
- bad manifest/index wiring
- empty or broken sections
- invalid runtime references
- duplicated/conflicting banks
- wrong authority chain
- malformed task payloads
- broken speaking/writing/listening/reading distribution
- path references that point to files that do not exist anymore

This is not a vague inventory.  
This is a **forensic bank-trustworthiness and runtime-compatibility audit**.

---

## Why this audit exists

The app has already shown symptoms such as:
- YKI exam showing zero tasks
- YKI practice failing to start
- uncertainty about whether the real certified bank is actually being used

Project evidence already says the authoritative v3.2 YKI family contains **9706 internalized YKI tasks** and should be the canonical exam authority. If the app behaves as if there are no tasks, the audit must determine whether the problem comes from:
- bank files
- manifests/indexes
- level mapping
- or the code reading them incorrectly

Do not assume the bank is healthy just because many files exist.

---

## Non-negotiable rules

1. Treat the **canonical certified bank** as the working authority candidate, but verify it.
2. Do **not** assume any manifest/index is correct without checking it against the actual files.
3. Do **not** trust counts alone. Verify actual reachable tasks.
4. Check all three level bands explicitly:
   - `A1_A2`
   - `B1_B2`
   - `C1_C2`
5. Check all four exam skills explicitly:
   - reading
   - listening
   - writing
   - speaking
6. If donor or side banks are present, classify them clearly:
   - canonical
   - compatible secondary
   - donor only
   - broken / reject
7. Preserve one source of truth in the report.

---

## Read first

Inspect at minimum:

### Canonical candidates
- `apps/backend/materials/yki/certified_bank/`
- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- `apps/backend/materials/yki/manifest/manifest.json`

### Other likely bank/index sources
- `engine/`
- any additional `manifest.json`
- any `pool_index.json`
- any `task_index*.json`
- donor YKI banks copied from other repos
- raw / rebuilt / salvaged / archive banks if present

### Backend/runtime readers
- `apps/backend/api/routes/yki_exam.py`
- `apps/backend/api/routes/yki_practice.py`
- `apps/backend/yki/`
- `apps/backend/services/`
- `engine/exam/`
- `engine/registry/`
- `engine/runtime/`
- `engine/tools/`

---

## Required phases

# Phase 1 — Inventory every YKI bank and index
Find every YKI-related:
- bank root
- manifest
- pool index
- task index
- section index
- salvage or rebuilt bank
- archive bank
- donor bank

Create a complete ledger.

# Phase 2 — Determine the canonical authority
Decide which bank is the true canonical bank for the full exam.
You must prove it with:
- file completeness
- manifest coherence
- runtime references
- level-band coverage
- task reachability

# Phase 3 — Validate manifests and indexes against real files
For every important manifest/index:
- verify referenced files exist
- verify counts match reachable tasks
- verify level labels are coherent
- verify skills are represented correctly
- verify task types are consistent

# Phase 4 — Level-band and skill coverage audit
For each of:
- A1_A2
- B1_B2
- C1_C2

verify counts and usable tasks for:
- reading
- listening
- writing
- speaking

Identify holes, broken sections, empty sections, or suspiciously thin distributions.

# Phase 5 — Runtime compatibility audit
Check whether the current app/backend/engine code is reading:
- the correct manifest
- the correct task index
- the correct pool index
- the correct level-band values

Flag:
- wrong path assumptions
- wrong label normalization
- broken file references
- competing index readers

# Phase 6 — Bank-quality and integrity audit
Check for:
- duplicate tasks
- malformed tasks
- missing audio/media references
- broken speaking prompts
- unusable writing prompts
- section imbalance
- files present but unreachable from indexes
- indexes pointing to deleted files

# Phase 7 — Remediation recommendations
If a bank problem is found, say exactly what must be repaired:
- manifest rebuild
- task-index rebuild
- level remap
- file move
- canonical-bank promotion
- donor-bank demotion
- path normalization
- runtime reader fix

---

## Output files

Write all reports to:
`/home/vitus/floently-finnish/docs/agents/`

Create:

1. `YKI_BANK_FORENSIC_AUDIT_REPORT.md`
2. `YKI_BANK_FILE_LEDGER.json`
3. `YKI_CANONICAL_AUTHORITY_DECISION.md`
4. `YKI_MANIFEST_AND_INDEX_VERIFICATION.md`
5. `YKI_LEVEL_AND_SKILL_COVERAGE_REPORT.md`
6. `YKI_BANK_RUNTIME_COMPATIBILITY_REPORT.md`
7. `YKI_BANK_OPEN_ISSUES.md`

---

## Required verdicts

Near the top of the audit report, include:

- `Canonical bank verdict: HEALTHY`
or
- `Canonical bank verdict: HEALTHY BUT RUNTIME WIRING BROKEN`
or
- `Canonical bank verdict: BANK INTEGRITY PROBLEMS FOUND`

Also include:

- `Root cause class: bank problem`
or
- `Root cause class: runtime wiring problem`
or
- `Root cause class: mixed`

---

## Completion rule

You are not done until:
- one canonical YKI bank is identified
- all important side banks are classified
- manifests/indexes are verified against actual files
- all level bands and skills are checked
- runtime compatibility is checked
- reports are written
