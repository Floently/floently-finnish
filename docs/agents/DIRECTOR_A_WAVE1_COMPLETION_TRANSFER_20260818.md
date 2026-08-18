# KieliValmis — Director A Wave 1 Completion Transfer

Status: **MANDATORY OPERATING NOTE FOR THE NEXT DIRECTOR / AGENT A**

Date: 2026-08-18
Repository: `Floently/floently-finnish`
Target reader: the next Agent A / engineering director responsible for completing Wave 1
Primary companion document: `docs/agents/CURRENT_WAVE1_HANDOVER.md`

---

## 0. Why this note exists

The broader handover (`docs/agents/CURRENT_WAVE1_HANDOVER.md`) is the authoritative history and state record. This document is narrower and operational. It tells the next Director exactly how to **finish Wave 1 quickly and safely** before any Wave 2 work begins.

The user has explicitly observed that progress has been too slow despite using up to seven parallel agents. The response to that problem must **not** be weaker review, broader merges, or production shortcuts. The response must be better orchestration:

- one source-of-truth integration owner;
- fewer agents editing the same critical path;
- more parallel verification and bounded review;
- exact-SHA decisions;
- no reopening already accepted feature packages without a concrete regression;
- no speculative new Wave 1 scope;
- explicit exit criteria for Wave 1.

The next Director's objective is therefore not to redesign Wave 1. It is to close it.

**Primary mission:**

> Finish the currently implemented Wave 1 source, prove it with the full protected test suite, produce the final non-production UAT candidate, get explicit visual + functional user acceptance, and only then declare Wave 1 complete.

Do **not** begin Wave 2 personalization/evidence work, Professional Listening expansion, broad localization, large new content banks, or general platform redesign until Wave 1 has an explicit completion record.

---

## 1. Read-first requirements

Before doing anything else, read completely:

1. `docs/agents/CURRENT_WAVE1_HANDOVER.md`
2. `.github/AGENTS.md`
3. `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`
4. `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`
5. `docs/agents/WAVE1_RESEARCH_AND_QUALITY_STANDARD.md`
6. `docs/agents/WAVE1_BRANCH_MATRIX.md`
7. `docs/agents/WAVE1_PROTECTED_FILES_AND_CAPABILITIES.md`
8. `docs/agents/WAVE1_SHARED_LEARNING_CONTRACT.md`
9. `docs/agents/WAVE1_TEST_MATRIX.md`
10. `docs/agents/WAVE1_INTEGRATION_PROTOCOL.md`
11. `docs/agents/WAVE1_PRODUCT_BLUEPRINT.md`
12. `docs/agents/WAVE1_AGENT_PROMPTS.md`
13. `packages/core/schemas/learning.ts`
14. this document.

Then inspect the current remote state of:

- Issue #16;
- PR #33;
- PR #35;
- PR #17;
- feature PRs #19, #20, #21, #22, #23, #24.

Do not rely on remembered branch heads. Re-resolve all relevant refs from GitHub first.

---

## 2. Exact state at transfer

### 2.1 Frozen Wave 1 base

`integration/wave1-shared-base-20260816`

`69813b433838130d5afe4b052360dbfd12df3f40`

All accepted feature packages B–G were developed from this immutable base.

### 2.2 Accepted feature-package provenance

These source packages are **already accepted**. Do not send agents back to reimplement them.

- Agent B — learning-platform events/evidence foundation
  - PR #24
  - accepted SHA `e4fb747c0203dfb9b4b04ab9d94b80e089b0ac94`
- Agent C — canonical Reading engine
  - PR #23
  - accepted SHA `646f26fe6ec03ead60cccc05ae4eb5bd4abdc72b`
- Agent D — canonical Writing revision engine
  - PR #22
  - accepted SHA `0e0b3088942ee019c0fdb980d6e6c03ce8f76bd9`
- Agent E — Practice Hub/composer
  - PR #21
  - accepted SHA `12270de873661d8584f5793adbfdc9d84500c9af`
- Agent F — Professional Missions
  - PR #19
  - accepted SHA `6e275d1dd04e4f6a0bd2c0a5981f7e63121cf272`
- Agent G — learning experience, graphics, motion and accessibility
  - PR #20
  - accepted SHA `0cfdb15c6094bba2835ff36d82f0f1afe47cabf5`

Those feature PRs remain useful as provenance and design records. They are not the place to continue Wave 1 integration.

### 2.3 Frozen historical UAT candidate

PR #33

Branch:

`agent/a-wave1-user-acceptance-20260818`

Exact source SHA:

`e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`

Full protected integration QA:

`32079751370` — **SUCCESS**

This candidate proved the integrated B–G Wave 1 stack before the Professional Mission Roleplay-from-Practice seam was completed.

**Do not modify or silently move PR #33.** It is historical frozen evidence.

### 2.4 Current Wave 1 follow-up runtime

PR #35

Branch:

`agent/a-wave1-roleplay-deeplink-20260818`

The exact **runtime SHA** that has already received targeted independent QA is:

`ddef94695001656b44d51f7469cd1ea4f5029232`

Targeted independent QA:

`32152077058` — **SUCCESS**

Wave 1 governance on that runtime:

`32150787933` — **SUCCESS**

The targeted QA passed:

- whole-client TypeScript;
- executable canonical Professional Mission Roleplay tuple parsing;
- malicious/ambiguous URL rejection;
- profession/context/scenario/entryMode isolation;
- Professional entitlement isolation;
- Practice composer contract/profession isolation;
- Wave 1 product wiring;
- navigation invariants;
- Roleplay audio invariants;
- Roleplay scenario-rotation invariants;
- source identity.

After this tested runtime SHA, documentation/governance-only commits were added. They do **not** change runtime behavior.

Current documentation/governance head before this note was created:

`bb36847aabf9bda5e2fb6ee8224c692a40120084`

The new Director must always distinguish:

- **tested runtime SHA**;
- later documentation/governance SHA.

Do not falsely claim the later docs SHA was independently runtime-tested if no runtime files changed.

---

## 3. What the current follow-up actually adds

The current follow-up closes one deliberate Wave 1 omission:

**Professional Mission Roleplay launched from Practice.**

Important design decisions already made:

1. ordinary `/speaking` remains unchanged behind `AppShell`;
2. Agent F's original Roleplay mission descriptor remains byte-identical, `degraded`, feature-flagged and routed to `/speaking`;
3. Agent A creates a Practice-facing clone only;
4. the clone targets `/speaking/mission`;
5. the adapter validates the complete canonical mission tuple:
   - `missionId`;
   - `profession`;
   - `contextId`;
   - `scenarioId`;
   - `entryMode`;
6. auth and subscription hydration must complete before mission content is rendered;
7. valid launch requires non-preview Professional access and the exact profession entitlement, except internal all-access;
8. malformed/unknown/ambiguous/cross-profession/cross-context/cross-scenario/wrong-entry-mode launch fails closed;
9. valid launch reuses existing `SpeakingRoute`;
10. profession is locked;
11. microphone/STT, RoleplayConversationScreen, backend session ownership and voice identity are not modified;
12. Professional Listening remains unavailable.

Do not redesign this architecture unless a real test proves a flaw.

---

## 4. The speed problem: what must change in Director behavior

Wave 1 used up to seven agents, but much time was consumed by repeated source inspection, branch QA setup, correction cycles, and parallel work that could not all progress the same critical path simultaneously.

The next Director should **not** conclude that seven agents should all be coding at once.

For the remainder of Wave 1, the runtime critical path is extremely small. Most useful parallel work is verification.

### 4.1 New operating principle

Use parallel agents only when their work products are independent and can be consumed simultaneously.

Bad use of seven agents:

- seven agents all studying PR #35;
- multiple agents proposing different rewrites of the same route;
- multiple agents modifying the same shared integration files;
- reopening B–G accepted packages without a demonstrated regression;
- giving each agent a broad "improve Wave 1" mandate;
- repeatedly rebuilding the same QA environment.

Good use of seven agents:

- one Director owns source and final decisions;
- one agent audits backend/protected regressions;
- one audits client TypeScript + Reading/Writing/Practice;
- one audits Roleplay/voice/navigation;
- one audits YKI/Cards/auth/subscription invariants;
- one audits visual/accessibility/localization/UAT checklist;
- one audits source ancestry/artifact identity/CI evidence and prepares consolidated QA evidence;
- only the Director or one specifically assigned fixer touches runtime code when an actual failure exists.

### 4.2 Source freeze during QA

Once full protected QA starts on a runtime SHA, **freeze that runtime**.

Do not allow other agents to push runtime changes while QA is running.

If a failure appears:

1. identify owning subsystem;
2. assign exactly one fixer;
3. make the smallest fix;
4. add a permanent regression guard;
5. produce a new exact runtime SHA;
6. rerun affected focused tests;
7. rerun full protected QA before UAT.

This prevents the previous cycle where test evidence became stale while source continued moving.

---

## 5. Recommended seven-agent allocation to finish Wave 1

The Director may use fewer agents if some jobs are unnecessary. Do not create busywork merely to occupy seven slots.

### Director / Agent A — Integration authority

Owns:

- exact source identity;
- final branch decisions;
- assigning blockers;
- accepting/rejecting fixes;
- full protected QA orchestration;
- replacement UAT freeze;
- user UAT preparation;
- production firewall.

Director must not delegate final source classification.

### Agent B role — backend and evidence regression auditor

Do **not** ask Agent B to build Wave 2 evidence integration.

For Wave 1 completion, ask this role only to verify that the current candidate has not regressed:

- Agent B event/evidence contracts;
- auth-derived learner identity;
- cross-account isolation;
- deterministic timestamp handling;
- event idempotency/conflicting duplicate behavior;
- backend selected integration tests used by frozen UAT QA.

Return exact commands/results and no runtime edits unless a failure is found.

### Agent C role — Reading + Practice launch auditor

Verify:

- Everyday Reading A1/A2/B1/B2 source/runtime;
- Professional Reading profession handling;
- generic Professional Reading remains profession-unscoped where intended;
- Practice uses real Reading descriptors;
- mission Reading task launch identity;
- route/task params preserved;
- no false durable-progress language;
- Reading focus graphics and reduced-motion behavior structurally intact.

No new Reading feature work.

### Agent D role — Writing + profession/evidence auditor

Verify:

- canonical revision loop;
- generic Professional Writing remains unscoped unless real profession exists;
- no `configured-at-launch` or any replacement pseudo-profession;
- profession-specific events carry actual canonical profession only;
- Practice mission Writing launches into the existing Writing engine;
- draft preservation/fallback tests;
- focus graphics/reduced motion.

No new Writing feature work.

### Agent E role — Practice orchestration auditor

Verify:

- deterministic composition;
- 5/10/20 minute behavior;
- entitlement filtering;
- exact profession filtering;
- duplicate task ID fail-closed behavior;
- modality controls (`No microphone`, `Make it shorter`, `another task`, `skip`);
- YKI practice/mock/full-exam boundary;
- current curriculum-only truth (`evidence: []`);
- new Professional Mission Roleplay descriptor appears only for the correct profession;
- launch params are preserved to `/speaking/mission`.

Do **not** implement durable learner personalization in Wave 1.

### Agent F role — Professional Mission source-identity auditor

Verify:

- accepted F source remains byte-identical where required;
- original Roleplay descriptor remains `degraded` and `/speaking`;
- Practice-facing clone is integration-owned;
- doctor/nurse/practical_nurse isolation;
- mission/context/scenario identity;
- no invented Professional Listening runtime;
- no work-domain string is accidentally treated as paid profession identity.

Do not expand the mission bank during Wave 1 closure.

### Agent G role — visual/accessibility/UAT auditor

This is particularly important because the user wants graphics and animation to be core quality signals.

Verify structurally and, where practical, visually:

- Practice progress path;
- task entry/next/completion transitions;
- Reading illustration;
- Writing revision illustration;
- A1/A2 stronger scaffolding vs B1/B2 restraint;
- light/dark presentation;
- small-screen wrapping;
- keyboard focus;
- status/alert live-region semantics;
- reduced-motion behavior;
- no decorative looping motion behind Reading, Writing, YKI or microphone recording;
- no graphics competing with Finnish content;
- consistent pathway/skill identities;
- Profession selector clarity.

Agent G should return a visual manual-test checklist and screenshots only if the environment can render them reliably. Do not block product acceptance solely because headless rendering infrastructure is unavailable if native/manual UAT can cover the visual requirement.

### Optional seventh parallel role — release-evidence / provenance auditor

If using all seven roles beyond the Director, use the final slot to independently verify:

- ancestry;
- tested SHA;
- feature-source identities;
- QA run IDs;
- workflow conclusions;
- instrumentation-only branch separation;
- no production files changed;
- no server actions;
- generic CI debt classification;
- replacement UAT record completeness.

This role should not edit runtime source.

---

## 6. Immediate next task — do this before anything else

The current blocker to closing Wave 1 is **not feature implementation**.

It is:

> Run the full protected integration QA on the exact current Roleplay-follow-up runtime and prove that the new mission Roleplay seam does not regress the entire product.

Start by re-resolving PR #35.

If the runtime changed from:

`ddef94695001656b44d51f7469cd1ea4f5029232`

then inspect every runtime delta before using old targeted QA evidence.

If only documentation/governance files changed, preserve `ddef9469...` as the runtime under test.

The full protected run should be at least as broad as frozen UAT run:

`32079751370`

plus the new Roleplay mission integration verifier.

---

## 7. Full protected QA required for Wave 1 completion

The Director should construct one observable exact-source protected workflow/QA run rather than many overlapping ad hoc runs.

### 7.1 Backend / service tests

Run the same selected backend/protected suite that passed frozen UAT, including where applicable:

- learning service/event/evidence behavior;
- auth persistence/OAuth behavior;
- Cards/material convergence;
- Roleplay ownership/identity;
- voice failure classification;
- YKI fallback/orchestrator/state-machine behavior;
- mission bank validation;
- Finnish voice identity.

Do not weaken tests to avoid root-engine provenance debt. Keep generic CI debt separately classified.

### 7.2 Whole client compilation

Required:

`pnpm --dir apps/client exec tsc --noEmit`

Must pass on the exact runtime candidate.

### 7.3 Wave 1 feature verifiers

At minimum rerun:

- Agent C Reading verifier;
- Agent D Writing verifier;
- Agent D profession verifier;
- Agent E Practice composer verifier;
- Agent F mission verifier / source identity in its correct accepted-source context;
- Agent G learning-experience/accessibility verifier;
- Wave 1 product wiring verifier;
- Professional mission integration verifier, including new Roleplay URL/entitlement guards.

### 7.4 Protected Roleplay/voice

Required:

- Roleplay identity/continuity;
- profession identity/isolation;
- navigation invariants;
- microphone/STT invariants;
- public STT invariants where part of the protected suite;
- audio ownership/background cleanup;
- scenario rotation/identity;
- ordinary `/speaking` behavior unchanged;
- `/speaking/mission` valid launch;
- invalid mission launch safe fallback.

### 7.5 YKI

Required:

- Practice/mock/full-exam separation;
- protected YKI client invariants;
- state/fallback/orchestration invariants;
- no Practice task can accidentally convert a YKI mock/full-exam descriptor into ordinary adaptive practice.

### 7.6 Auth/subscription/access

Required:

- signed-out behavior;
- subscription hydration;
- Professional entitlement;
- exact profession entitlement;
- preview behavior;
- internal-all-access behavior;
- profession switching/isolation;
- no deep-link entitlement creation;
- wrong-profession mission launch rejected.

### 7.7 Brand/localization/accessibility

Required:

- supported language catalog structural completeness;
- KieliValmis native brand identity;
- hard-coded UI report executed;
- keyboard focus;
- live regions;
- reduced motion;
- small-screen structural checks;
- graphics/focus wiring.

The hard-coded text audit may report known Wave 1 English explanatory strings. That report is not automatically a Wave 1 blocker unless it exposes new accidental untranslated critical navigation/access text or contradicts the accepted UAT limitation. Broad translation work belongs after Wave 1 unless the user specifically blocks acceptance on wording.

### 7.8 Source identity

The protected run must record:

- exact runtime SHA;
- exact branch/ref;
- exact frozen UAT parent/base;
- any docs-only commits excluded from runtime identity;
- QA instrumentation differences;
- workflow run ID;
- result of every major step.

No ambiguous "latest branch passed" language.

---

## 8. If full protected QA passes

Do not add more Wave 1 features.

Immediately perform these steps.

### Step A — freeze a replacement UAT candidate

Create a new non-production UAT branch/ref from the exact tested runtime source.

Do not rewrite or move PR #33.

The replacement UAT record must include:

- exact source SHA;
- exact ancestry/merge base;
- full protected QA run ID;
- targeted Roleplay QA run `32152077058` as supplementary evidence;
- list of differences from PR #33;
- known limitations;
- `PRODUCTION_ACTIONS=NONE`.

### Step B — build a non-production visual artifact

Use the same credential-free Expo web/static preview approach already proven for PR #33 if still supported.

Purpose:

- layout review;
- responsive review;
- graphics/illustration review;
- transition review where web supports it;
- light/dark theme review;
- wording review.

This does not replace native mobile testing.

### Step C — prepare the user's final Wave 1 manual acceptance checklist

The checklist must be concise enough to execute but complete enough to cover protected functionality.

The user must test visually and functionally before production.

---

## 9. Mandatory manual UAT for final Wave 1

The replacement UAT checklist should explicitly cover these groups.

### Practice Hub

- entry from Home/Learn;
- 5/10/20 minute choices;
- pathway/skill preview;
- progress path;
- start/open/complete;
- skip;
- another task;
- no microphone;
- shorter session;
- summary;
- truthful reason copy;
- transitions feel polished, not excessive;
- reduced motion works.

### Everyday Reading

- A1;
- A2;
- B1;
- B2;
- task loading;
- feedback;
- focus graphic appropriateness;
- back/menu behavior.

### Everyday Writing

Full loop:

`understand → plan → write → feedback → revise → compare`

Check:

- draft safety;
- feedback volume;
- retry flow;
- writing illustration;
- keyboard layout;
- no false durable-save claim.

### Professional Reading/Writing

For:

- doctor;
- nurse;
- practical nurse.

Check:

- correct profession context;
- wrong-profession tasks never appear;
- Reading route/task identity;
- Writing route/task identity;
- mission context coherence.

### Professional Mission Roleplay from Practice

This is the new acceptance area.

For all three professions:

- launch mission Roleplay from Practice;
- correct profession;
- correct scenario;
- profession is locked;
- microphone works;
- STT works;
- conversation behaves as existing protected Roleplay;
- back/menu behavior coherent.

Negative manual checks:

- malformed mission URL;
- unknown mission ID;
- wrong profession;
- wrong context;
- wrong scenario;
- preview account;
- Professional access without exact profession.

All must fail safely without exposing another profession's mission.

### Existing protected functionality

Quick regression pass:

- generic Professional Roleplay;
- Everyday Speaking/Roleplay;
- Cards;
- YKI Practice;
- YKI mock;
- YKI full exam;
- sign in/session;
- subscription/access;
- navigation/back/menu/deep links;
- small screen;
- light/dark theme.

### Graphics and motion

The user has explicitly stated graphics and animation are core to build quality.

Ask the user to classify visual findings as:

- **BLOCKER** — confusing, broken, inaccessible, childish/unprofessional, layout failure, motion interfering with learning;
- **POLISH** — should improve before release but functionality is usable;
- **ACCEPT** — suitable for Wave 1.

Do not defer a genuine user-identified visual blocker merely because automated tests are green.

---

## 10. Wave 1 definition of done

Wave 1 is not complete when code is merged.

Wave 1 is complete only when all of the following are true:

1. all B–G accepted package provenance remains accounted for;
2. Professional Mission Reading/Writing/Roleplay integration is protected;
3. full protected integration QA passes on one exact runtime SHA;
4. final non-production UAT candidate is frozen from that exact tested SHA;
5. visual preview/native build is available for inspection;
6. the user completes visual + functional UAT;
7. all user BLOCKER findings are fixed and retested;
8. user explicitly states acceptance;
9. final UAT source identity is recorded;
10. Issue #16 records Wave 1 completion;
11. handover document is updated to say Wave 1 is closed;
12. only then may Wave 2 planning become active.

Recommended status markers:

`WAVE1_SOURCE_INTEGRATION=PASS`

`WAVE1_FULL_PROTECTED_QA=PASS`

`WAVE1_FINAL_UAT_CANDIDATE=FROZEN`

`USER_ACCEPTANCE=PASS`

`WAVE1_STATUS=COMPLETE`

`PRODUCTION_ACTIONS=NONE` until a separate production-promotion decision begins.

---

## 11. What is explicitly NOT required to finish Wave 1

Do not allow these future improvements to keep Wave 1 open indefinitely.

### Not Wave 1 completion work

- durable client personalization/evidence bridge;
- real weakness/overdue/mastery Practice recommendations;
- Professional Listening runtime;
- large new content banks;
- broad new professions;
- full localization of every new explanatory sentence;
- generic CI root-engine provenance reconstruction;
- broad architectural refactors;
- new native animation dependencies;
- release/production deployment itself.

These belong to later controlled work packages.

A known truthful limitation is acceptable if:

- it is documented;
- the UI does not falsely claim it exists;
- the user accepts the Wave 1 experience with that limitation;
- it does not violate a protected invariant.

---

## 12. Do not start Wave 2 early

The user wants Wave 1 finished before moving to the next level.

Therefore, until Wave 1 is explicitly closed, do not begin implementation of:

### Wave 2 durable personalization

No authenticated Practice evidence bridge yet.

Keep:

`evidence: []`

Do not invent:

- weakness;
- mastery;
- overdue state;
- personalized history;
- spaced repetition claims.

### Professional Listening

Do not flip F's unavailable/deferred descriptors.

### Broader localization/content expansion

Do not turn final UAT into a multi-month translation/content project unless the user specifically identifies critical wording as a blocker.

The Director may document Wave 2 design ideas, but no Wave 2 runtime source should be mixed into the Wave 1 final UAT candidate.

---

## 13. Generic CI: keep visible, keep separate

Generic CI remains known debt.

### Client generic CI problem

The legacy client CI still uses `npm ci` in `apps/client`, while the repository is a pnpm workspace and does not have the expected client package-lock.

### Backend/root-engine problem

The backend generic suite still has provenance/authority debt involving missing or uncertain root-engine modules such as:

- `engine.learning`;
- `engine.logging`;
- related root-engine source authority.

Agent A already isolated client workflow modernization in PR #17:

`c78b59658ffd25e333e2af384875d1607f0a5565`

Do not merge generic CI repair into final Wave 1 runtime merely to make a dashboard green.

Do not:

- delete tests;
- skip tests;
- invent duplicate engine modules;
- weaken assertions;
- misclassify generic CI failure as a new learning-feature regression when evidence shows otherwise.

But also do not hide it. Final Wave 1 documentation should state the debt clearly.

---

## 14. Production firewall

The Director completing Wave 1 has **no implicit production permission**.

Even after user acceptance, production is a separate phase.

Do not:

- SSH to production;
- restart live services;
- retag live images;
- run production migrations;
- move `main` as a substitute for reconciliation;
- move `integration/canonical-production-20260816` casually;
- publish Expo OTA;
- upload App Store/Play binaries;
- change production secrets;
- force-push;
- deploy the Wave 1 branch directly.

Production source must remain forward-only.

Required later production gates remain:

`PRODUCTION_ANCESTRY_GATE=PASS`

`PROTECTED_INVARIANT_GATES=PASS`

`CANDIDATE_ARTIFACT_IDENTITY=PASS`

`POST_DEPLOY_CANARY=PASS`

`TRACKED_SOURCE_MISSING_OR_DIFFERENT=0`

`UNEXPLAINED_RUNTIME_SOURCE=0`

If live source identity is uncertain: **STOP**.

Rollback means prior known-good artifact, not source history reset.

---

## 15. How to report progress to the user efficiently

The user has been watching a long engineering process and perceives progress as slow. The Director should make future updates milestone-based rather than narrating every internal investigation.

Recommended reporting format:

### A. Current milestone

Example:

`Wave 1 final protected QA — 9/12 gates passed`

### B. New concrete result

Example:

`Roleplay mission URL isolation, TypeScript and Practice profession filtering are green.`

### C. Remaining blocker

Example:

`YKI protected client suite remains; no runtime failure has appeared.`

### D. Production boundary

Example:

`Server unchanged; this is non-production QA.`

Avoid repeatedly explaining already-settled architecture unless a new decision changes it.

---

## 16. Director decision rules

When a failure occurs, classify it immediately.

### Runtime regression

Fix required before UAT.

### QA harness defect

Fix QA instrumentation only; do not mutate product source unnecessarily.

### Pre-existing generic CI debt

Document separately; do not treat as Wave 1 runtime failure unless the candidate actually changed the failing subsystem.

### Visual blocker

Fix before user acceptance if the user or reliable visual review identifies it.

### Polish item

Record and decide with the user whether it blocks Wave 1.

### Deferred Wave 2 capability

Do not pull it into Wave 1 merely because it would be nice to have.

---

## 17. Anti-regression facts that must never be forgotten

These defects were previously found and corrected. If any reappear, treat them as immediate regressions.

### Agent B

- naive timezone timestamps;
- malformed timestamp crashes;
- learner ownership via anything other than canonical authenticated ID;
- duplicate event identity rewriting history.

### Agent C

- false "progress saved" copy;
- pseudo profession `cross-sector` on generic Professional Reading.

### Agent D

- pseudo profession `configured-at-launch`;
- profession-scoped evidence without a real canonical profession;
- unsafe draft loss/evaluation failure behavior.

### Agent E

- local entitlement aliases instead of canonical entitlement vocabulary;
- nondeterministic duplicate task IDs;
- cross-profession Practice scheduling;
- fake personalization without durable evidence.

### Agent F

- treating work domain as paid profession identity;
- manufacturing Professional Listening before an owner exists;
- mutating accepted mission source instead of integration-owned adaptation.

### Agent G

- invisible keyboard focus;
- wrong live-region semantics;
- decorative looping motion in focus surfaces;
- overly childish graphics for advanced learners;
- reduced-motion violations.

### Agent A integration

- dropping launch params during Practice navigation;
- duplicating Reading/Writing runtimes instead of reusing canonical engines;
- claiming mission Roleplay available before the route/entitlement bridge exists;
- mixing QA instrumentation into runtime source.

---

## 18. Exact first-session instructions for the new Director

When you take over, perform this sequence without deviation unless remote state has materially changed.

### First 15 actions

1. Read `CURRENT_WAVE1_HANDOVER.md` fully.
2. Read this Director transfer fully.
3. Read `.github/AGENTS.md`.
4. Read production forward-only policy and reconciliation record.
5. Fetch PR #35 metadata/head.
6. Compare PR #35 current head to tested runtime `ddef9469...`.
7. List all changed runtime files since `ddef9469...`; expected result is none unless another agent changed runtime after this transfer.
8. Fetch PR #33 and verify frozen SHA `e3685e61...`.
9. Fetch Issue #16 latest comments.
10. Confirm feature-source SHAs B–G have not drifted if their provenance will be re-used in the protected test evidence.
11. Decide one exact runtime SHA for final protected QA.
12. Freeze that runtime while QA executes.
13. Allocate parallel agents by verification domain, not competing source edits.
14. Run/observe the single full protected QA matrix.
15. Consolidate all results into one Director decision.

If green: freeze replacement UAT immediately.

If red: assign one minimal fixer per real failure and repeat exact-SHA QA.

---

## 19. Expected completion path from this transfer

The desired remaining Wave 1 path should be short:

```text
read handover
  ↓
re-resolve exact source
  ↓
full protected QA on Roleplay follow-up
  ↓
(if failure) minimal fix + regression + rerun
  ↓
freeze replacement UAT
  ↓
build non-production visual/native acceptance candidate
  ↓
user visual + functional UAT
  ↓
fix only user blockers
  ↓
rereun full protected QA if runtime changed
  ↓
user acceptance PASS
  ↓
record WAVE1_STATUS=COMPLETE
  ↓
ONLY THEN plan Wave 2
```

The Director should resist adding side projects between these steps.

---

## 20. Definition of success for the new Director

A successful handover is not "I understand the repository."

A successful Director finishes with:

- one exact final Wave 1 source SHA;
- one complete protected QA record;
- one frozen final non-production UAT candidate;
- one clear user visual/functional test package;
- no unresolved user blockers;
- explicit `USER_ACCEPTANCE=PASS`;
- Issue #16 updated with Wave 1 completion;
- handover updated to final state;
- no production side effect;
- Wave 2 still separate.

That is the finish line.

---

## 21. Final directive to Agent A

You are not inheriting six unfinished feature agents.

You are inheriting a mostly integrated Wave 1 that needs disciplined closure.

Do not restart the project.

Do not re-run architecture debates that were already settled.

Do not ask B–G to invent more features.

Do not allow seven agents to mutate one critical path simultaneously.

Use parallelism to **verify faster**, not to create more reconciliation work.

Your immediate job is to prove the current Roleplay-follow-up runtime against the full protected matrix, freeze the final UAT candidate, and move it into the user's hands for visual and functional acceptance.

Until the user accepts:

`USER_ACCEPTANCE=PENDING`

`WAVE1_STATUS=NOT_COMPLETE`

`PRODUCTION_ACTIONS=NONE`

After user acceptance and final evidence:

`USER_ACCEPTANCE=PASS`

`WAVE1_STATUS=COMPLETE`

Only then should Wave 2 begin.
