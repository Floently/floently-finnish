# KieliValmis Synthesis Source Authority

Established: 2026-08-15

Frozen Phase 0 source checkpoint:

`b0ca66fcdf93ca8add495b027c2dcbe89192f445`

## Purpose

This document defines which evidence may govern the KieliValmis post-release
implementation program.

The repository contains several generations of agent audits, remediation
prompts, implementation reports, and historical runtime reports.

They must not be treated as equally current.

The implementation program must follow current code and current verified
product evidence rather than resurrecting obsolete defects or obsolete
architecture.

---

# 1. Source precedence

Use this precedence whenever sources disagree.

## Priority 1 — Current code and frozen Phase 0 evidence

Authoritative:

- current source tree at the frozen checkpoint;
- `docs/UI_EXPOSURE_AUDIT.md`;
- `docs/PROSPECTIVE_IMPROVEMENTS.md`;
- current runtime/configuration evidence gathered during the 2026-08-15 audit.

Current code wins over an older report.

---

## Priority 2 — Later verified fix / runtime reports

May be used when their claim still agrees with current code.

Examples include:

- YKI repair/fallback verification;
- roleplay/STT post-fix runtime verification;
- targeted implementation reports whose live paths still exist.

They are evidence of what was achieved at that time, not permission to assume
the implementation has remained unchanged forever.

---

## Priority 3 — Historical forensic reports

Examples:

- duplication ledgers;
- authority maps;
- material convergence reports;
- April run-app reports;
- old release-readiness reports;
- old final-risk reports.

Use them to identify areas worth checking.

Do not execute their deletion, quarantine, authority, count, or migration
recommendations until current code independently confirms them.

---

## Priority 4 — Agent prompts and specifications

Agent prompts define intended work, standards, or investigation questions.

They are not proof that:

- a defect still exists;
- a route remains active;
- a migration remains necessary;
- a fix was completed;
- a historical architecture remains authoritative.

Prompts may contribute principles and candidate requirements only.

---

# 2. Explicitly superseded historical claims

## Old backend route authority

Historical reports described:

- `apps/backend/api/**` as mounted HTTP authority;
- `apps/backend/app/routers/**` as a shadow/quarantine candidate.

Current source contradicts that model.

Current `apps/backend/main.py` imports and mounts:

`app.router`

Current `apps/backend/app/router.py` actively mounts:

- learning
- professional
- speaking
- YKI practice
- YKI exam
- authentication
- YKI session APIs
- voice
- roleplay
- subscriptions
- payments
- cards
- card audio
- devices

Therefore:

DO NOT quarantine or delete `apps/backend/app/routers/**` from an April report.

Any backend convergence work requires a new current-tree authority audit.

---

## Old YKI Practice wrapper claim

Historical duplication reports said:

`apps/client/state/YkiPracticeRoute.tsx`

had become a thin wrapper around:

`apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`

Current code no longer matches that statement.

The current `YkiPracticeRoute.tsx` contains substantial YKI practice UI and
session logic.

Therefore old frontend winner/loser classifications must be re-derived from the
current tree before architecture cleanup.

---

## Old card-material authority and counts

Historical material-convergence reports described an authority using old
accepted-card/material paths and reported approximately 1,418 imported cards.

Current runtime code loads the canonical bank from:

`apps/backend/card_bank/canonical_bank/validated`

through:

`apps/backend/app/runtime/cards_material_bank.py`

Historical material counts and quarantine instructions must not drive current
card-bank changes.

The current canonical bank must be audited using current-bank tooling and
current runtime paths.

---

## Old mobile/release blocker claims

Historical April reports said the application:

- was named `client`;
- lacked bundle/package identifiers;
- lacked an EAS project;
- lacked a production backend URL;
- still consisted largely of route stubs.

Those claims are superseded.

Current configuration includes:

- customer-facing app name `KieliValmis`;
- technical slug `client`, intentionally retained;
- iOS/Android identifier `com.vitusidi.floently`;
- EAS project ID;
- KieliValmis branded icon assets;
- production API default `https://learn-api.floently.com`;
- runtime version and OTA configuration.

Do not resurrect those old blockers.

---

## Old roleplay/STT outage

Earlier roleplay prompts were created while voice transcription was failing.

Later verified evidence established:

- canonical roleplay/voice routing;
- real STT success through Google fallback;
- differentiated provider errors;
- hardened quick press/release recording behavior.

Therefore the old STT outage is not a current architectural blocker merely
because an old audit prompt says it was.

Current roleplay work should focus on current product-quality goals unless new
runtime evidence proves an STT regression.

---

# 3. Agent-package principles retained

The following principles remain useful unless later evidence disproves them.

## Architecture

- one current authority for each critical concern;
- no silent parallel runtime stacks;
- route files should have clear ownership;
- compatibility layers should have explicit retirement criteria;
- current code, not historical documentation, defines runtime truth.

## Learning architecture

Use the governed learning loop as a design model:

Diagnose
-> Learn
-> Retrieve
-> Produce
-> Correct
-> Schedule
-> Review

The loop must be backed by real learner evidence rather than decorative UI.

## UX

Retain useful principles:

- calm, clear navigation;
- secondary utilities should not overwhelm primary learning pathways;
- one dominant next action when practical;
- context-aware guidance rather than excessive global navigation;
- accessibility and cross-platform behavior are required;
- no fabricated learner progress.

Current product taxonomy overrides older five-mode wording.

The primary KieliValmis learning pathways are:

1. Everyday Finnish
2. Professional / workplace Finnish
3. YKI preparation

These pathway labels do not make KieliValmis a general-purpose language
catalog. Everyday Finnish is the practical foundation supporting the product's
deeper focus on work life in Finland, workplace/cultural competence, and YKI
preparation.

Floently Read and Floently Create remain separate product experiences even
where they share the native application shell.

## Quality

Retain:

- reproducible clean-checkout expectations;
- meaningful CI;
- explicit loading/error/empty states;
- authn/authz regression coverage;
- accessibility review;
- safe secret/config handling;
- cross-platform regression testing;
- evidence before deletion.

---

# 4. Partially reusable historical sources

## YKI reports

Retain as historical architecture evidence:

- certified-bank authority decisions;
- level-band normalization findings;
- in-process engine fallback work;
- media-path caution areas.

Before any YKI architecture change, verify those paths against the current
tree.

Do not assume historical frontend winner/loser classifications remain true.

---

## Material/card reports

Retain:

- provenance/governance principles;
- validator-before-publication principle;
- explicit quarantine principle;
- authority must have a declared validator.

Do not retain historical counts, old runtime paths, or old donor promotion
instructions as current truth.

---

## Duplication/final-risk reports

Retain the anti-duplication goal.

Re-audit every concrete current owner before moving or deleting code.

No old quarantine list is executable against the current tree without fresh
proof.

---

# 5. Forbidden synthesis behavior

The combined implementation plan must not:

- copy an old agent remediation order verbatim;
- treat an agent prompt as current defect evidence;
- restore already-fixed release blockers;
- quarantine current `app/routers` based on the April authority map;
- replace the current canonical card bank with an older material snapshot;
- rebuild roleplay/STT because of superseded outage documentation;
- expose Phase 0 blocked features before their data foundations exist;
- delete a candidate before the current-tree dependency gates pass.

---

# 6. Canonical synthesis inputs

The combined implementation plan is built from:

1. current code at the frozen checkpoint;
2. `docs/UI_EXPOSURE_AUDIT.md`;
3. `docs/PROSPECTIVE_IMPROVEMENTS.md`;
4. validated useful principles from the agents package;
5. later fix/verification reports that still agree with current code;
6. current product decisions established during the August 2026 improvement
   program.

This document supersedes any assumption that every file under
`docs/agents/**` is automatically current implementation truth.
