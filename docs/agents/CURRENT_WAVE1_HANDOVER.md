# KieliValmis Wave 1 — Authoritative Engineering Handover

Status: **MANDATORY READ BEFORE CONTINUING AGENT-A / WAVE-1 INTEGRATION WORK**

Handover date: 2026-08-18

Repository: `Floently/floently-finnish`

Coordinator role at handover: Agent A / Wave-1 integration owner

Production status at handover: **untouched by Wave-1 source development**. No deployment, production restart, production migration, live container/image change, OTA, App Store/Play action, production secret change, canonical/main production ref movement, or production artifact promotion is authorized by this document.

---

## 0. Read this first

This file is the current continuation authority for Wave-1 Agent-A/integration work. It summarizes the exact source lineage, accepted feature packages, review corrections, integration state, frozen UAT candidate, post-UAT Roleplay follow-up, QA evidence, known CI/provenance debt, deferred capabilities, production firewall, and exact next steps.

Before editing runtime source, the next continuing agent must:

1. read this file completely;
2. read `.github/AGENTS.md`;
3. read `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`;
4. read `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`;
5. read every `docs/agents/WAVE1_*` governance document;
6. inspect PR #33, PR #35, Issue #16 and the exact SHAs named below;
7. re-resolve current remote heads before assuming any branch is still frozen;
8. stop if ancestry, source identity or protected invariants differ from this handover.

Do not treat this handover as permission to deploy. It is source-development and continuation guidance only.

---

## 1. Product goal and Wave-1 engineering direction

KieliValmis is being developed into a coherent Finnish-learning system across:

- Everyday Finnish;
- Professional Finnish;
- YKI preparation;
- a unified Practice Hub that orchestrates existing learning capabilities without becoming a fake fourth pathway.

The product model is four-skill-first:

- Listening;
- Speaking;
- Reading;
- Writing.

Vocabulary and grammar support those four skills rather than replacing them.

Wave 1 is intentionally research-first, contract-driven and anti-regression. Feature packages were developed independently on a frozen base, reviewed by Agent A at exact SHAs, corrected locally when necessary, then replayed into a fresh integration candidate. Feature agents must never stack on one another, move production refs, weaken protected behavior, or manufacture green CI.

The product-quality standard is not merely “tests pass.” The system must remain truthful about learner evidence and persistence, accessible, profession-isolated, deterministic where contracts require it, maintainable, and conservative around unavailable capabilities.

---

## 2. Immutable foundations and production/source authority

### 2.1 Pre-Wave-1 parent / voice-security candidate

`107985d4dcb26d0c8ef010580e78cc9c61fce922`

This is also the combined pre-Wave-1 voice/security candidate used as the parent of Wave-1 governance.

### 2.2 Frozen Wave-1 shared base

Branch:

`integration/wave1-shared-base-20260816`

Exact SHA:

`69813b433838130d5afe4b052360dbfd12df3f40`

B–G feature work was required to branch from this exact source and never from another feature agent.

### 2.3 Reconciled canonical production source authority established before Wave 1

Branch:

`integration/canonical-production-20260816`

Latest reverified canonical head recorded during reconciliation:

`749ffe3669cc1c6184482a735001af769bc71547`

Do not use `main` as production-development authority. During reconciliation, `main` was identified as stale relative to the live/canonical lineage.

### 2.4 Recorded live image and rollback identity

Recorded live image:

`sha256:57b3ab1ef0986c9e0c84253b7b35482cb15db990b04f115dc33024cbca608bcf`

Rollback tag:

`floently-finnish-backend:rollback-20260816-pre-canonical`

These values belong to the production reconciliation record. They do **not** authorize any Wave-1 production action.

---

## 3. Production forward-only policy — non-negotiable

The production rule is `ANTI-REGRESSION-001`, documented in:

`docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`

and reconciled against live/canonical source in:

`docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`

Core requirements:

- production source is forward-only;
- never reset production to an older branch or old repository snapshot;
- never broad-overwrite production with an old feature tree;
- no force-push as a release mechanism;
- replay verified intended changes onto current lineage;
- the production source commit must be an ancestor of any production candidate;
- every discovered regression gets a permanent test;
- the release artifact must be built from the exact tested candidate commit;
- rollback means redeploying the previous known-good artifact, **not** resetting source history;
- unknown live source identity is a STOP condition;
- composite Docker overlays are emergency-only and forbidden as normal release architecture.

Separate production gates, required only after user acceptance:

- `PRODUCTION_ANCESTRY_GATE=PASS`
- `PROTECTED_INVARIANT_GATES=PASS`
- `CANDIDATE_ARTIFACT_IDENTITY=PASS`
- `POST_DEPLOY_CANARY=PASS`
- `TRACKED_SOURCE_MISSING_OR_DIFFERENT=0`
- `UNEXPLAINED_RUNTIME_SOURCE=0`

A green feature branch or green UAT candidate is never production permission.

---

## 4. Mandatory governance and shared learning contract

Every continuing agent must read and obey:

- `.github/AGENTS.md`
- `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`
- `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`
- `docs/agents/WAVE1_RESEARCH_AND_QUALITY_STANDARD.md`
- `docs/agents/WAVE1_BRANCH_MATRIX.md`
- `docs/agents/WAVE1_PROTECTED_FILES_AND_CAPABILITIES.md`
- `docs/agents/WAVE1_SHARED_LEARNING_CONTRACT.md`
- `docs/agents/WAVE1_TEST_MATRIX.md`
- `docs/agents/WAVE1_INTEGRATION_PROTOCOL.md`
- `docs/agents/WAVE1_PRODUCT_BLUEPRINT.md`
- `docs/agents/WAVE1_AGENT_PROMPTS.md`
- `packages/core/schemas/learning.ts`

The frozen shared learning schema defines `learning.v1` and the common task/evidence/session boundaries used by Reading, Writing, Practice, Professional missions and future durable evidence integration.

Important shared concepts include:

- `LearningPathway`
- `LearningSkill`
- `LearningRuntime`
- `LearningEvidenceMode`
- `YkiTaskMode`
- `TaskModalityRequirements`
- `TaskHealth`
- `TaskLaunch`
- `TaskDescriptor`
- `TaskCapability`
- `TaskResult`
- `LearnerEvent`
- `SkillEvidence`
- Practice selection/reason/session manifest types.

Do not casually revise the frozen contract to make one feature easier. Prefer narrow adapters.

---

## 5. Wave-1 governance implementation already completed

The Agent-A governance/shared-base work established:

- `.github/AGENTS.md`
- all `docs/agents/WAVE1_*` documents listed above;
- `packages/core/schemas/learning.ts`;
- `apps/client/scripts/verify-wave1-agent-governance.mjs`;
- `.github/workflows/wave1-agent-governance.yml`;
- `apps/client/scripts/verify-wave1-feature-branch-safety.mjs`;
- `.github/workflows/wave1-feature-branch-safety.yml`.

The frozen shared base is `69813b...` and must remain the provenance reference for original B–G feature branches.

---

## 6. Research and prior documentation map

Research is mandatory and already exists for the accepted feature work. The next agent should inspect the relevant source before changing an owner boundary.

### Agent A / integration research

- `docs/agents/research/AGENT_A_RESEARCH.md`
- `docs/agents/research/AGENT_A_CI_BASELINE_RESEARCH.md`
- `docs/agents/research/AGENT_A_ROLEPLAY_DEEPLINK_BRIDGE_RESEARCH_20260818.md`

### Agent B

- `docs/agents/research/AGENT_B_RESEARCH.md`
- `docs/agents/research/AGENT_B_TIMEZONE_REVIEW_RESEARCH.md`

### Agent C

- `docs/agents/research/AGENT_C_RESEARCH.md`
- PR #23 records the 2026-08-17 follow-up profession/Practice interoperability correction and final acceptance evidence.

### Agent D

- `docs/agents/research/AGENT_D_RESEARCH.md`
- PR #22 records the final profession-provenance correction and acceptance evidence.

### Agent E

- `docs/agents/research/AGENT_E_RESEARCH.md`
- `docs/agents/research/AGENT_E_REVIEW_CORRECTIONS_20260817.md`

### Agent F

- `docs/agents/research/AGENT_F_RESEARCH.md`

### Agent G

- `docs/agents/research/AGENT_G_RESEARCH.md`
- `docs/agents/research/AGENT_G_ACCESSIBILITY_FOLLOWUP_20260817.md`

Coordinator history and review decisions are also recorded in Issue #16:

`Wave 1 Agent A — governance, shared contracts, integration and independent QA`

---

## 7. Final accepted B–G source packages

All six Wave-1 feature packages eventually reached `AGENT_A_REVIEW=ACCEPT_SOURCE` and were frozen for controlled replay.

### 7.1 Agent B — learning platform events/evidence

PR: #24

Branch:

`agent/b-learning-platform-events-20260816`

Final accepted SHA:

`e4fb747c0203dfb9b4b04ab9d94b80e089b0ac94`

Key responsibilities:

- deterministic capability registry and effective health/feature resolution;
- canonical learner ownership using authenticated user identity, not email fallback;
- owner-scoped learner-event repository/service;
- idempotent event writes with conflicting duplicate rejection;
- provenance retention;
- conservative SkillEvidence derivation;
- non-production persistence adapters;
- future Practice query interfaces.

Critical correction that must never regress:

- persisted `occurredAt` timestamps must be deterministic timezone-aware ISO-8601;
- malformed/naive persisted timestamps fail closed;
- mixed explicit offsets compare as actual aware instants.

Durable production persistence was deliberately left migration-ready, not invented.

### 7.2 Agent C — canonical shared Reading engine

PR: #23

Branch:

`agent/c-reading-engine-20260816`

Final accepted SHA:

`646f26fe6ec03ead60cccc05ae4eb5bd4abdc72b`

Independent Agent-A exact-head QA recorded in PR #23:

`32041925661` — SUCCESS

Critical corrections that must never regress:

- do not claim Reading progress is durably saved before real persistence wiring exists;
- generic cross-profession Professional Reading must **omit** `profession`;
- never emit pseudo-profession values such as `cross-sector`;
- real future profession-scoped tasks may preserve a valid canonical profession only when it is true provenance.

The separate `/read` product remains distinct; Wave-1 learning Reading owns `/learn/reading` and `/professional/reading`.

### 7.3 Agent D — canonical Writing revision engine

PR: #22

Branch:

`agent/d-writing-revision-engine-20260816`

Final accepted SHA:

`0e0b3088942ee019c0fdb980d6e6c03ce8f76bd9`

Independent Agent-A exact-head QA:

`32041943733` — SUCCESS

Core Writing loop:

`understand → plan → write → submit → focused feedback → revise → resubmit → compare → evidence`

Critical corrections that must never regress:

- remove fabricated `configured-at-launch` profession provenance permanently;
- generic Professional descriptors remain unscoped and omit profession;
- profession-scoped descriptors/events use actual validated canonical profession only;
- Professional learner events fail closed when required profession provenance is missing, unsupported or incompatible;
- Everyday descriptors/events reject unexpected profession scope;
- no fake durable autosave claims.

### 7.4 Agent E — Practice Hub / deterministic composer

PR: #21

Branch:

`agent/e-practice-hub-composer-20260816`

Final accepted SHA:

`12270de873661d8584f5793adbfdc9d84500c9af`

Critical corrections that must never regress:

- canonical entitlement vocabulary only:
  - `learnAccess`
  - `professionalAccess`
  - `ykiAccess`
  - `profession:<doctor|nurse|practical_nurse>`
- do not reintroduce local entitlement aliases `learn`, `professional`, `yki`;
- Professional tasks require both Professional access and exact profession entitlement;
- active profession must separately match task profession;
- repeated non-empty task IDs are ambiguous product truth and fail closed with `duplicate_task_id` regardless of candidate order or content-version difference;
- Practice remains deterministic and fail-closed on unavailable/incompatible tasks;
- current integrated Practice remains curriculum-only until real durable evidence is authenticated and reviewed.

### 7.5 Agent F — Professional Mission System

PR: #19

Branch:

`agent/f-professional-missions-20260816`

Final accepted SHA:

`6e275d1dd04e4f6a0bd2c0a5981f7e63121cf272`

Canonical paid profession identities:

- `doctor`
- `nurse`
- `practical_nurse`

Important architecture:

- professions are entitlement identities;
- broader work domains are not new paid profession identities;
- mission source includes coherent four-skill chains and stable context/order IDs;
- Roleplay/Reading/Writing are launch descriptors/adapters, not duplicated runtimes;
- unresolved ordinary Professional Listening remains explicitly unavailable until a canonical owner/runtime exists;
- provenance and regulated-context language-practice safety boundaries are part of the source contract.

Agent F’s original mission Roleplay descriptors were intentionally `degraded` pending a separately reviewed protected launch bridge. Do not mutate F’s accepted source to “make it green.” Integration must adapt around it.

### 7.6 Agent G — learning experience/accessibility system

PR: #20

Branch:

`agent/g-experience-motion-20260816`

Final accepted SHA:

`0cfdb15c6094bba2835ff36d82f0f1afe47cabf5`

Independent QA:

`32039878994` — SUCCESS

Critical corrections that must never regress:

- interactive Practice path nodes have a visible keyboard-focus appearance independent of selected/current state;
- focus must not activate the task;
- non-error dynamic feedback uses `role="status"` and polite live-region semantics;
- errors use `role="alert"` and assertive semantics;
- no programmatic focus stealing;
- reduced-motion behavior must suppress unnecessary/decorative motion, especially during Reading, Writing, formal YKI and recording focus;
- graphics/motion are instructional/orienting/responding/rewarding, not decorative noise.

---

## 8. Controlled integration order and Agent-A integration result

Accepted packages were replayed into fresh Agent-A integration in this order:

`B → C → D → F → E → G → Agent-A integration wiring`

Do not merge feature branches into one another. Do not replay Agent-A QA instrumentation branches.

Cross-agent seams handled in integration include:

- B learner-event/evidence model ↔ Practice evidence adapter boundary;
- C/D/F descriptors ↔ E entitlement/profession/health/feature/modality/time filters;
- C generic Professional Reading profession omission;
- D truthful profession event/descriptor behavior;
- C/D route/task identity preservation;
- F Professional mission Reading/Writing adapters;
- F Professional Listening retained unavailable;
- G learning-experience primitives integrated additively rather than broad-restyling the product;
- truthful UI copy with no fake saved progress, autosave or learner personalization.

---

## 9. Frozen non-production Wave-1 UAT candidate

PR: #33

Title:

`Wave 1 user acceptance candidate — visual + functional review`

Branch:

`agent/a-wave1-user-acceptance-20260818`

Exact frozen source SHA:

`e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`

Base:

`69813b433838130d5afe4b052360dbfd12df3f40`

At freeze:

- ahead: 28 commits;
- behind: 0;
- merge base: exactly the frozen Wave-1 base.

Full protected integration QA:

`32079751370` — SUCCESS

Recorded pass scope includes:

- backend selected integration/protected suite: 53 passed;
- whole-client TypeScript: PASS;
- Reading/Writing/Practice/experience regressions: PASS;
- Professional Mission Reading + Writing integration/profession gates: PASS;
- Agent F accepted-source identity: PASS;
- navigation, Roleplay, audio and scenario-rotation invariants: PASS;
- protected YKI client invariants: PASS;
- 20-language catalog completeness + KieliValmis brand/native identity: PASS;
- graphics/focus/reduced-motion/product wiring: PASS.

**PR #33 is frozen evidence. Do not edit or repurpose it in place.**

Current status:

`USER_ACCEPTANCE=PENDING`

`PRODUCTION_ACTIONS=NONE`

`PRODUCTION_PROMOTION=NOT_AUTHORIZED`

`SERVER_STATE=UNCHANGED`

---

## 10. Manual UAT scope already defined for PR #33

Visual acceptance should cover at least:

1. Practice Hub hierarchy and 5/10/20-minute choices;
2. pathway/skill preview and progress path;
3. Practice transitions and semantic completion feedback;
4. Reading focus surface and level-sensitive illustration/scaffolding;
5. Writing focus surface and draft/revision/check flow;
6. stronger A1/A2 scaffolding versus restrained B1/B2 treatment;
7. Professional Reading/Writing profession behavior;
8. keyboard focus visibility;
9. small-screen wrapping;
10. light/dark themes;
11. reduced-motion behavior;
12. spacing, typography, clarity and KieliValmis visual quality.

Functional acceptance should cover at least:

- Everyday Reading A1/A2/B1/B2;
- Everyday Writing full revision loop;
- Professional Reading/Writing for doctor/nurse/practical_nurse without leakage;
- Practice start/open/complete/skip/another/no-microphone/shorter/summary;
- curriculum-only Practice reasons remain truthful;
- existing Professional Roleplay microphone/STT/profession identity;
- Cards;
- YKI Practice/mock/full-exam boundaries;
- auth/session/subscription/access;
- back/menu/deep-link navigation.

---

## 11. Truthful limitations at the frozen UAT point

PR #33 deliberately kept these limitations visible instead of faking completeness:

### 11.1 Durable Practice evidence not yet wired

Current integrated Practice still supplies:

`evidence: []`

This means curriculum-based selection only. Do not write UI copy implying saved weakness, mastery, overdue review or learner personalization until authenticated durable evidence is actually connected and learner-isolated.

### 11.2 Professional Listening unavailable

No canonical ordinary Professional Listening runtime owner exists. Agent F’s unavailable listening descriptors must remain unavailable until a real implementation is researched, owned, tested and integrated.

### 11.3 Mission-specific Professional Roleplay from Practice was deferred in PR #33

Generic protected Professional Roleplay remained available. The mission-specific deep-launch seam was intentionally left out until the protected profession/scenario parameter boundary could be independently reviewed.

This is the post-UAT follow-up now implemented and targeted-QA-passed in PR #35; see sections 12–14.

### 11.4 Some new curriculum/revision UI chrome remains English

The existing 20-language catalog covers common actions but not every newly introduced Wave-1 curriculum/revision concept. These strings were intentionally not filled with guessed translations.

### 11.5 Generic repository CI debt remains visible

See section 15. Dedicated exact-source protected integration QA is green; generic CI is separately unhealthy for inherited harness/provenance reasons.

---

## 12. Post-UAT follow-up: Professional Mission Roleplay → Practice

After freezing PR #33, work continued only on a new non-production branch:

`agent/a-wave1-roleplay-deeplink-20260818`

Draft PR:

#35 — `Agent A follow-up: protected Professional mission Roleplay deep links`

The **runtime source SHA** that was independently reviewed and tested is:

`ddef94695001656b44d51f7469cd1ea4f5029232`

This follow-up targets the frozen UAT branch, not production.

Purpose:

close only the deliberately deferred **Professional Mission Roleplay → Practice** seam without modifying Agent F’s accepted mission source or the ordinary `/speaking` entry.

---

## 13. Roleplay follow-up architecture

The accepted follow-up design is deliberately narrow.

### 13.1 Ordinary Speaking remains protected and unchanged

Ordinary `/speaking` remains behind `AppShell`.

The follow-up does not change:

- `AppShell.tsx` runtime behavior;
- `SpeakingRoute.tsx`;
- `RoleplayConversationScreen`;
- microphone/STT ownership;
- backend Roleplay session ownership;
- voice identity;
- protected ordinary Speaking navigation.

### 13.2 Agent F source remains intact

Agent F’s original mission Roleplay descriptor remains:

- byte-identical in F source;
- `degraded`;
- feature-flagged;
- routed to `/speaking`;
- owner of the canonical mission/profession/context/scenario launch tuple.

Do not “fix” F by mutating that accepted source.

### 13.3 Practice-facing clone only

Agent A creates only a Practice-facing clone of the accepted F Roleplay step.

The clone:

- preserves F’s task identity;
- preserves canonical launch params;
- changes only integration-owned availability/route behavior;
- targets `/speaking/mission`;
- becomes `available` only because the guarded adapter exists;
- drops F’s deferred bridge feature flag on the clone only.

### 13.4 Canonical full-tuple parser

`apps/client/state/professionalMissionSpeakingParams.mjs`

validates the complete tuple against `PROFESSIONAL_MISSIONS`:

- `missionId`;
- `profession`;
- `contextId`;
- `scenarioId`;
- `entryMode`.

It fails closed for:

- unknown mission IDs;
- array/ambiguous URL params;
- unsafe identifier characters;
- overlong identifiers;
- cross-profession tuple mixing;
- cross-context tuple mixing;
- wrong scenario;
- wrong entry mode;
- any mismatch between URL values and the canonical mission descriptor.

### 13.5 Entitlement/auth boundary

`apps/client/app/speaking/mission.tsx`

waits until authentication and subscription state are hydrated before rendering mission content.

A canonical tuple is still not enough. Valid mission launch requires:

- non-preview Professional access;
- the exact profession entitlement;
- or internal all-access.

A general/YKI Speaking entitlement must not become Professional mission access merely because a URL was crafted.

Unauthorized or invalid input falls back to the ordinary protected AppShell Speaking entry.

### 13.6 Reuse protected runtime rather than duplicate it

Authorized valid launches reuse existing `SpeakingRoute`, lock the profession and preserve the exact canonical scenario/entry mode.

The adapter does not import `RoleplayConversationScreen` directly.

Background audio cleanup behavior is preserved.

Professional Listening remains unavailable.

---

## 14. Roleplay follow-up changed paths and QA evidence

### 14.1 Net runtime/product diff at tested SHA `ddef9469...`

Exactly these eight files differ from frozen UAT:

- `apps/client/app/speaking/mission.tsx`
- `apps/client/features/practice/integratedRegistry.ts`
- `apps/client/features/professional/missionPracticeEntries.ts`
- `apps/client/scripts/verify-wave1-professional-mission-integration.mjs`
- `apps/client/state/professionalMissionSpeakingParams.mjs`
- `apps/client/state/professionalMissionSpeakingParams.d.ts`
- `apps/client/state/professionalMissionSpeakingParams.d.mts`
- `docs/agents/research/AGENT_A_ROLEPLAY_DEEPLINK_BRIDGE_RESEARCH_20260818.md`

No AppShell, SpeakingRoute, RoleplayConversationScreen, backend, deployment or release file is part of that runtime diff.

### 14.2 Exact source ancestry

The tested Roleplay follow-up runtime is ahead-only from frozen UAT.

Frozen UAT parent:

`e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`

Tested Roleplay follow-up runtime:

`ddef94695001656b44d51f7469cd1ea4f5029232`

At review, merge base was exactly the frozen UAT source and the follow-up was behind by 0.

### 14.3 Governance QA

Exact follow-up runtime Wave-1 governance run:

`32150787933` — SUCCESS

### 14.4 Independent targeted Agent-A QA

Instrumentation-only QA PR:

#36 — **closed without merge**

Do not replay or merge its instrumentation.

Purpose-built run:

`32152077058` — SUCCESS

Passed:

- `pnpm install --frozen-lockfile`;
- whole-client TypeScript;
- executable canonical + malicious Professional Mission URL tuple guards;
- exact Professional/profession entitlement isolation;
- Practice composer contract/profession isolation;
- Wave-1 product wiring;
- protected navigation invariants;
- protected Roleplay audio invariants;
- protected Roleplay scenario-rotation invariants;
- QA/runtime source identity proving instrumentation was the only difference from the reviewed runtime.

Current classification:

`AGENT_A_ROLEPLAY_DEEPLINK_QA=PASS`

`FOLLOWUP_SOURCE=ACCEPT_SOURCE_FOR_FULL_PROTECTED_QA`

This does **not** yet make PR #35 a replacement UAT candidate.

---

## 15. Generic repository CI debt — keep separate from feature QA

The generic repository `ci` workflow is not presently a reliable release signal.

### 15.1 Generic client CI problem

The current generic client job executes:

`cd apps/client && npm ci`

but the repository is a pnpm workspace and the client does not have the package-lock/shrinkwrap required by `npm ci`.

This causes generic client CI to fail before TypeScript.

Do not “solve” this by adding an accidental npm lockfile or weakening TypeScript. The intended client CI modernization already exists separately.

### 15.2 Agent-A isolated client CI repair

Branch:

`agent/a-ci-baseline-repair-20260816`

Draft PR:

#17

Head:

`c78b59658ffd25e333e2af384875d1607f0a5565`

Research:

`docs/agents/research/AGENT_A_CI_BASELINE_RESEARCH.md`

The repair moved the workflow toward the repository’s real pnpm toolchain and preserved test coverage.

Classification:

`AGENT_A_CI_CLIENT_REPAIR=ACCEPT_SOURCE`

### 15.3 Backend/root-engine provenance debt

Generic backend tests still encounter inherited root-engine provenance/structure debt involving missing or uncertain source authority such as:

- `engine/learning/`
- `engine/logging/`
- `engine/blueprints/`

while tests/server code reference root-engine modules.

Classification:

`AGENT_A_CI_BACKEND_REPAIR=PROVENANCE_BLOCKED`

Do not manufacture green CI by:

- deleting root-engine tests;
- skipping backend suites;
- weakening assertions;
- inventing a duplicate root engine;
- silently changing backend/YKI source authority.

The next agent must first establish provenance/source authority before repairing that debt.

---

## 16. Pre-Wave-1 reliability/source history that still matters

Important prior source work includes:

- YKI recovery: `99b21e6349079265f2f9ed116f7bb7cbf70d438d`
- voice commits: `be186b...`, `3a636b...`, `599331...`
- security: `f8dcf7195d47f27d72d78092304199f3f76ba530`
- combined voice/security candidate: `107985d4dcb26d0c8ef010580e78cc9c61fce922`
- draft PR #8 for the combined candidate.

Use the production reconciliation document as authority for how these relate to canonical/live production. Do not infer production state from old branches or `main`.

---

## 17. What remains to be done — exact next-agent sequence

The immediate next milestone is **full protected integration QA on the exact Roleplay follow-up runtime** before any replacement UAT candidate is created.

### Step 1 — prove current heads before trusting this handover

Resolve remote PR #35.

Expected tested runtime source:

`ddef94695001656b44d51f7469cd1ea4f5029232`

This repository handover may add documentation/governance-only commits after that runtime SHA. Therefore distinguish:

- **runtime SHA:** the commit whose product code was tested;
- **handover/documentation head:** later commit(s) that add only this handover and the mandatory read-first governance rule.

If PR #35 has runtime changes after `ddef9469...`, inspect every runtime delta and invalidate the old exact-SHA QA until re-tested.

Resolve PR #33.

Expected frozen UAT source:

`e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`

If PR #33 moved, STOP and investigate. It is supposed to remain frozen.

### Step 2 — do not use QA PR #36 as source

PR #36 is instrumentation-only evidence and was closed without merge.

Never replay or merge its workflow changes into integration/UAT/production.

### Step 3 — run full protected integration QA on Roleplay follow-up runtime

Target breadth must be at least equivalent to frozen-UAT run `32079751370`, plus the new Roleplay deep-link negative guards.

At minimum include:

#### Backend/protected integration

- selected backend protected suite;
- auth/session/access behavior;
- learner identity/data isolation paths relevant to integrated APIs;
- YKI backend/protected behavior that existed in the previous full suite.

#### Whole client

- frozen pnpm workspace install;
- whole-client TypeScript.

#### Wave-1 learning runtimes

- Reading verifier;
- Writing verifier;
- Writing profession-provenance verifier;
- Practice composer verifier;
- integrated product-wiring verifier;
- learning-experience/accessibility verifier;
- Professional missions verifier;
- Professional mission integration verifier including executable malicious URL cases.

#### Protected product invariants

- Cards/material convergence;
- existing Roleplay identity/continuity;
- Roleplay microphone/STT;
- public STT;
- Roleplay audio lifecycle;
- scenario identity/rotation;
- YKI Practice/mock/full-exam boundary invariants;
- navigation/deep-link/back/menu;
- auth/session/subscription/access;
- KieliValmis brand/native identity;
- supported-language catalog completeness;
- keyboard focus/accessibility;
- reduced motion;
- negative/fallback states.

#### Source identity

Prove the tested checkout is exactly the runtime SHA being proposed for UAT. QA instrumentation may differ only on instrumentation branches and must never be replayed.

### Step 4 — if any full gate fails

- keep PR #33 frozen;
- fix only on the Roleplay follow-up branch or a fresh Agent-A follow-up branch as appropriate;
- add a permanent regression guard for the failure;
- review the exact new SHA;
- re-run targeted and full protected QA;
- do not weaken prior tests.

### Step 5 — if full protected QA passes

Create a **new deliberate non-production UAT candidate** from the exact tested follow-up runtime SHA.

Do **not** silently move or rewrite PR #33. Preserve PR #33 as historical frozen evidence.

The replacement UAT record must state:

- exact source SHA;
- exact base/merge-base ancestry;
- full protected QA run ID;
- targeted Roleplay QA run ID `32152077058` as supplementary evidence;
- changed capability summary;
- known truthful limitations;
- explicit `PRODUCTION_ACTIONS=NONE`.

### Step 6 — extend manual UAT for mission Roleplay

Add explicit manual acceptance for all three canonical professions:

- doctor mission Roleplay opened from Practice;
- nurse mission Roleplay opened from Practice;
- practical-nurse mission Roleplay opened from Practice;
- exact scenario identity;
- profession remains locked/isolation preserved;
- microphone/STT works;
- back/menu behavior remains coherent;
- malformed/unknown mission URL falls back safely;
- cross-profession/context/scenario URL cannot launch another profession’s mission;
- Preview access cannot use mission deep launch;
- Professional access without the exact profession cannot use the mission;
- ordinary `/speaking` remains unchanged.

### Step 7 — obtain explicit user acceptance

Until the user explicitly passes the new UAT candidate:

`USER_ACCEPTANCE=PENDING`

No production promotion discussion is authorized.

### Step 8 — production remains a separate later phase

Only after explicit `USER_ACCEPTANCE=PASS` may Agent A prepare a production-promotion plan.

Even then, all forward-only production gates in section 3 must pass from the exact tested candidate/artifact.

If live source identity is uncertain: STOP.

---

## 18. Deferred capabilities — separate future packages, not opportunistic edits

### 18.1 Authenticated durable Practice evidence bridge

Goal:

connect integrated client Practice to Agent B’s server-owned durable learner evidence without breaking learner isolation or truthful semantics.

Requirements before implementation:

- inspect Agent B accepted source and integration adapters;
- confirm authenticated learner identity contract;
- preserve event/evidence provenance and idempotency;
- preserve timezone-aware timestamp rules;
- define authenticated client API/repository boundary;
- prove cross-account isolation;
- map only real durable evidence into `DurablePracticeEvidence`;
- add negative tests for wrong learner, malformed evidence, stale/invalid evidence and duplicate identity;
- update UI reason copy only when learner evidence is actually present.

Until then:

leave `evidence: []` and never simulate weakness/mastery/overdue personalization.

### 18.2 Professional Listening

Do not simply flip Agent F listening task health.

A real Professional Listening package needs:

- an explicit canonical runtime owner;
- original/licensed-safe content strategy;
- profession and entitlement isolation;
- task descriptor/health contract;
- audio modality and offline/error behavior;
- accessibility/transcript strategy;
- user-visible truthful availability;
- independent tests and Agent-A review;
- protected YKI separation so Professional Listening does not clone or corrupt YKI logic.

### 18.3 Localization of new Wave-1 curriculum/revision UI

Create a controlled translation/content-quality package for new concepts rather than guessing strings inline.

Requirements:

- enumerate all new untranslated Wave-1 strings;
- preserve supported-language catalog completeness;
- use language-quality review appropriate to each supported language;
- keep Finnish learning content itself pedagogically intentional;
- add catalog/integration regressions;
- do not rename the KieliValmis native brand identity accidentally.

### 18.4 Generic CI repair

Client pnpm modernization may continue from PR #17 after re-review against current repository state.

Backend/root-engine repair remains blocked until provenance is established.

Do not mix generic CI repair into a learning-feature UAT candidate unless a deliberate Agent-A integration decision and full retest justify it.

### 18.5 Broader Professional expansion

Preserve canonical paid profession IDs:

- doctor;
- nurse;
- practical_nurse.

Do not turn broad work domains into entitlement profession identities. Any new profession product requires an explicit product/entitlement decision, not a local descriptor string.

---

## 19. Protected invariants that must remain green through all future work

The next agent must treat these as anti-regression surfaces:

- Roleplay identity and continuity;
- Roleplay profession isolation;
- Roleplay microphone/STT;
- public STT;
- audio session ownership/background cleanup;
- Cards/material convergence;
- Everyday Finnish routes and learning behavior;
- Reading/Writing route ownership;
- navigation/deep-link/back/menu behavior;
- auth/session;
- subscription/access/profession entitlements;
- YKI Practice/mock/full-exam semantics;
- KieliValmis brand/native identity;
- supported language catalog;
- keyboard focus and live-region accessibility;
- reduced motion;
- truthful persistence/evidence claims;
- deterministic task identity and fail-closed duplicate behavior.

A change that requires weakening one of these is a STOP condition until architecture is reconsidered.

---

## 20. Branch and PR map at handover

### Governance/shared base

- Agent-A governance issue: #16
- Agent-A governance draft PR: #9
- frozen base: `69813b433838130d5afe4b052360dbfd12df3f40`

### Feature source PRs

- B: PR #24 — `e4fb747c0203dfb9b4b04ab9d94b80e089b0ac94`
- C: PR #23 — `646f26fe6ec03ead60cccc05ae4eb5bd4abdc72b`
- D: PR #22 — `0e0b3088942ee019c0fdb980d6e6c03ce8f76bd9`
- E: PR #21 — `12270de873661d8584f5793adbfdc9d84500c9af`
- F: PR #19 — `6e275d1dd04e4f6a0bd2c0a5981f7e63121cf272`
- G: PR #20 — `0cfdb15c6094bba2835ff36d82f0f1afe47cabf5`

Keep these feature PRs draft/open/unmerged as source provenance unless a later explicit repository-governance decision says otherwise.

### Generic CI repair

- PR #17
- `c78b59658ffd25e333e2af384875d1607f0a5565`

### Frozen Wave-1 UAT

- PR #33
- `e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`
- frozen / user acceptance pending.

### Roleplay follow-up

- PR #35
- tested runtime: `ddef94695001656b44d51f7469cd1ea4f5029232`
- targeted QA: PASS;
- full protected QA: still required before replacement UAT.

### Roleplay QA instrumentation

- PR #36
- closed without merge;
- evidence only;
- never replay.

---

## 21. How the next agent should work operationally

When asked to “continue working,” do not start by editing code.

First:

1. fetch/resolve PR #35 head and current changed files;
2. compare current branch against `ddef9469...` and separate docs/governance-only commits from runtime changes;
3. fetch PR #33 and prove exact frozen SHA;
4. fetch Issue #16 latest comments for coordinator history;
5. read this handover and all mandatory governance files;
6. inspect current implementation before proposing any replacement;
7. run or construct independent QA from exact runtime source, keeping instrumentation isolated;
8. record exact run IDs and exact tested SHA;
9. update Issue #16 and relevant PR with evidence;
10. never claim a gate passed merely because a different branch or older SHA passed it.

If GitHub Actions visibility is limited, construct an instrumentation-only QA branch/PR whose source identity can be proven and whose workflow is observable. Never replay that instrumentation into runtime integration.

---

## 22. Status markers at this handover

Frozen UAT #33:

`FROZEN_UAT_SHA=e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`

`FROZEN_UAT_FULL_PROTECTED_QA=PASS`

`FROZEN_UAT_QA_RUN=32079751370`

Roleplay follow-up #35 tested runtime:

`ROLEPLAY_FOLLOWUP_RUNTIME_SHA=ddef94695001656b44d51f7469cd1ea4f5029232`

`ROLEPLAY_FOLLOWUP_TARGETED_QA=PASS`

`ROLEPLAY_FOLLOWUP_QA_RUN=32152077058`

`ROLEPLAY_FOLLOWUP_FULL_PROTECTED_QA=PENDING`

Overall:

`USER_ACCEPTANCE=PENDING`

`PRODUCTION_ACTIONS=NONE`

`PRODUCTION_PROMOTION=NOT_AUTHORIZED`

`SERVER_STATE=UNCHANGED`

Immediate next milestone:

`NEXT_MILESTONE=FULL_PROTECTED_QA_ON_ROLEPLAY_FOLLOWUP_RUNTIME`

If that passes:

`NEXT_AFTER_QA=CREATE_NEW_FROZEN_NON_PRODUCTION_UAT_CANDIDATE`

Then:

`NEXT_AFTER_NEW_UAT=EXPLICIT_USER_MANUAL_ACCEPTANCE`

---

## 23. Final instruction to the next agent

Do not repeat completed feature development and do not reopen accepted source packages without a concrete integration regression.

Do not modify frozen PR #33.

Do not treat documentation-only handover commits as if the Roleplay runtime had changed; always identify the exact runtime SHA separately.

Do not promote PR #35 to UAT until full protected integration QA passes on its exact runtime.

Do not unlock Professional Listening or fake Practice personalization.

Do not hide generic CI debt.

Do not touch production.

Your first engineering task after reading this file is to verify current remote state and execute the full protected integration QA on the exact Roleplay follow-up runtime, then either fix/retest failures or freeze a new non-production UAT candidate with exact source identity and expanded manual acceptance instructions.

If any source lineage, live-source authority, protected invariant or entitlement boundary is uncertain, stop and report the uncertainty before proceeding.
