# KieliValmis Combined Implementation Plan

Established: 2026-08-15

Frozen Phase 0 source checkpoint:

`b0ca66fcdf93ca8add495b027c2dcbe89192f445`

Source authority:

`docs/KIELIVALMIS_SYNTHESIS_SOURCE_AUTHORITY.md`

Phase 0 evidence:

`docs/UI_EXPOSURE_AUDIT.md`

Persistent backlog:

`docs/PROSPECTIVE_IMPROVEMENTS.md`

---

# 1. Mission

Build KieliValmis into a narrow, deep Finnish-learning system focused on:

1. Finnish for work life and professional communication in Finland;
2. Finnish workplace and cultural competence;
3. serious YKI preparation, with especially strong writing practice.

Everyday Finnish remains an important practical foundation and learner pathway.
It should support living, working, communicating, and preparing for YKI in
Finland rather than expanding KieliValmis into a general-purpose language
learning catalog.

The product is not being redesigned into a broad general-purpose
language-learning platform.

The implementation must progressively build a coherent evidence-based learning
system rather than independently polishing disconnected screens.

---

# 2. Non-negotiable implementation rules

## 2.1 Truth before presentation

Never show fabricated learner-specific:

- progress;
- due counts;
- confidence;
- readiness;
- plans;
- milestones;
- completed missions;
- personalized recommendations.

Demo/sample data may exist only when explicitly isolated and clearly identified
as demo/test data.

A failed write must never be converted into a fake successful save.

---

## 2.2 Data foundation before adaptive surfaces

Do not repair/expose:

- Personal Phrase Bank;
- Revision Vault;
- Confidence Tracker;
- YKI Planner;
- Work Finnish Path;
- promoted Incident Lab experiences

one by one before the common learner-event/data architecture exists.

Build the shared foundation first.

Then reconnect each retained capability to real learner data.

---

## 2.3 One canonical product surface

Do not create competing:

- Everyday hubs;
- Professional hubs;
- YKI hubs;
- Progress dashboards;
- review systems;
- navigation models.

Merge unique useful capability into the canonical experience.

Delete obsolete implementations later only after dependency and
unique-capability proof.

---

## 2.4 Current-tree evidence only for deletion

Every deletion batch requires:

`PRE_DELETE_DEPENDENCY_GATE=PASS`

and:

`UNIQUE_REQUIRED_CAPABILITY_REMAINING=NO`

immediately before deletion against the then-current tree.

Historical agent deletion/quarantine lists are not sufficient.

---

## 2.5 Product boundaries remain explicit

KieliValmis Learn, Floently Read, and Floently Create may share a native shell,
but access, product navigation, and billing entitlements remain explicit.

Read/Create must not leak into the KieliValmis learning hierarchy.

---

# 3. Dependency map

The implementation order is:

Phase 1
Architecture, navigation, entitlement, and truth contracts

        ↓

Phase 2
Learner-event + durable learner-data foundation

        ↓

Phase 3
Real Progress + recommendations + adaptive continuation

        ↓

Phases 4–6
Everyday Finnish / YKI / Professional Finnish capability integration

        ↓

Phase 7
Cross-cutting roleplay, voice, UX, accessibility, and motivation quality

        ↓

Phase 8
Legacy consolidation and evidence-gated deletion

        ↓

Phase 9
Full cross-platform, security, CI, and release-quality verification

Blocked learner features return only after the dependencies they require are
real.

---

# PHASE 1 — Canonical architecture, navigation, and access truth

## Goal

Establish current architectural truth before deeper product work.

No historical authority map may be applied directly.

## Workstream 1A — Rebuild current authority map

Create a current-tree authority record covering:

- Expo route ownership;
- AppShell/state route ownership;
- feature screen ownership;
- shared API client ownership;
- backend application composition;
- backend router ownership;
- backend service/runtime ownership;
- cards runtime authority;
- YKI runtime authority;
- roleplay/voice authority;
- learner-data persistence authority.

This audit must use current imports and mounted routes.

Historical April winner/loser classifications are evidence only.

### Exit gate

Every critical domain has:

- current owner;
- current consumer graph;
- compatibility layers identified;
- explicit retirement condition where duplication remains.

---

## Workstream 1B — Navigation contract

Implement:

- `KV-UX-004`
- `KV-UX-005`
- `KV-P0-001`
- `KV-P0-004`
- `KV-P0-013`

Requirements:

- current section identity is clear;
- browser Back/Forward works;
- refresh and deep links work;
- `/help` has a canonical route contract;
- persisted navigation cannot fight URL navigation;
- Read/Create and Learn routing use one deliberate model;
- daily-practice alias remains only as long as compatibility requires it.

Preserve the existing Everyday Finnish navigation-race protection.

---

## Workstream 1C — Product entitlement boundaries

Implement:

- `KV-P0-002`
- `KV-P0-003`

Verify:

- Read direct routes enforce Read access;
- Create direct routes enforce Create access when applicable;
- authenticated-but-unentitled users cannot bypass product gates by deep link;
- backend paid operations enforce their own authorization where required;
- navigation hiding is never the only access control.

Create regression tests for:

- logged out;
- authenticated/no entitlement;
- Read entitlement;
- Learn entitlement;
- Professional entitlement;
- combined entitlement;
- internal/test access.

Also repair the current roleplay object-ownership boundary before later
learner-event work:

- bind each roleplay session to the authenticated learner;
- require that same learner for session turns and finish;
- preserve same-user enforcement in internal load/review helpers used by those
  flows;
- keep scenario/persona rotation identity separate from authorization identity;
- add a cross-user access-denial regression test.

This implements `KV-SEC-002`.

---

## Workstream 1D — Multi-product architecture record

Implement:

- `KV-P0-005`

Record clearly:

- KieliValmis Learn product boundary;
- native shared-suite shell;
- Read backend/service boundary;
- Create pre-launch state;
- payment/entitlement separation;
- current repositories/services;
- direct-route access expectations.

Old preview-only Read documentation must no longer compete with current
architecture.

---

## Workstream 1E — Small correctness fixes

Complete low-risk correctness issues discovered during Phase 0:

- React web document `<title>` must render as one string;
- replace deprecated React Native Web `shadow*` usage progressively with
  supported styling;
- do not turn this cleanup into a visual redesign.

Shadow cleanup is lower priority unless it causes functional problems.

---

## Phase 1 exit

Before Phase 2:

- current authority map exists;
- route/deep-link model is coherent;
- Help route contract is fixed;
- Read/Create direct entitlement behavior is truthful;
- roleplay sessions are bound to the authenticated learner identity;
- product architecture docs reflect reality;
- navigation regression tests pass;
- no production deployment has been required merely to complete architecture
  work.

---

# PHASE 2 — Learner-event and durable learner-data foundation

## Goal

Create the common evidence layer required by Progress, Revision Vault,
Confidence, Planner, adaptive recommendations, Professional progression, and
future personalization.

This is the most important foundation phase.

---

## Workstream 2A — Canonical learner-event contract

Define versioned learner events for at least:

- card shown;
- card answered;
- card correct/incorrect;
- confidence when captured;
- review scheduled;
- review completed;
- vocabulary mastery;
- grammar activity;
- reading task;
- listening task;
- writing submission;
- writing feedback;
- speaking session;
- roleplay turn/session;
- hesitation/retry evidence where defensible;
- YKI task attempt;
- YKI skill result;
- mock/full exam result;
- professional scenario attempt;
- professional mission completion;
- incident practice;
- phrase captured;
- phrase reviewed;
- learner correction/mistake;
- streak/qualified activity.

Every event needs:

- learner identity;
- timestamp;
- activity/source type;
- product pathway;
- skill area when applicable;
- relevant task/content identifier;
- result/evidence fields;
- schema version.

Do not collect data that has no product use.

---

## Workstream 2B — Durable account-specific storage

Create durable learner-scoped persistence for:

- Phrase Bank;
- revision/error history;
- progress aggregation inputs;
- YKI learner signals;
- professional mission progress;
- learner preferences required by Planner;
- study target and target exam date;
- review scheduling.

Data must survive:

- refresh;
- process restart;
- later login/session;
- normal backend deployment restart.

Process-local dictionaries are not sufficient.

---

## Workstream 2C — Truthful error/fallback policy

Create one policy for learner-personalized APIs:

- no silent personalized sample data;
- no fabricated success;
- no fabricated progress;
- no fabricated milestones;
- no fabricated due counts;
- no fabricated readiness.

Allowed production states:

- real data;
- true empty state;
- explicit unavailable/error state.

Fallback UI may preserve navigation or explanatory copy but must not pretend to
represent the learner.

---

## Workstream 2D — Learning loop primitives

Use:

Diagnose
-> Learn
-> Retrieve
-> Produce
-> Correct
-> Schedule
-> Review

as the common learning lifecycle.

This does not require every activity to use every step.

It does require that correction/review/progression are connected rather than
remaining isolated screens.

---

## Phase 2 exit

Prove with tests that two different learner accounts produce isolated data.

Prove event creation from representative:

- card;
- YKI;
- roleplay/speaking;
- writing;
- professional

flows.

Only after this phase may blocked personalized features begin remediation.

---

# PHASE 3 — Real Progress, recommendations, and adaptive continuation

## Goal

Make Progress the evidence layer the learner can actually understand and act
on.

Implement:

- `KV-PROGRESS-001`
- `KV-PROGRESS-002`
- `KV-PROGRESS-003`
- `KV-PROGRESS-004`
- `KV-PROGRESS-005`

---

## Workstream 3A — Explainable progress model

Progress must derive from real learner events.

Provide explainable views for:

- overall learning;
- Everyday Finnish;
- Professional Finnish;
- YKI;
- listening;
- speaking;
- reading;
- writing;
- vocabulary;
- grammar.

Avoid a single opaque percentage.

---

## Workstream 3B — Progress drill-down

Allow the learner to understand:

- what they completed;
- what improved;
- what remains weak;
- recent results;
- mastery by topic/skill;
- why a recommendation was made;
- what action will improve the relevant area.

---

## Workstream 3C — Recommendation engine

Build recommendations from evidence.

Examples:

- review overdue vocabulary;
- repair a recurring grammar error;
- practice a weak YKI skill;
- repeat a professional scenario;
- review a Phrase Bank item;
- complete the next profession mission;
- perform a writing task;
- practise speaking after listening work.

Recommendations must route to the exact activity where possible.

---

## Workstream 3D — Confidence integration

Remediate the retained Confidence capability only after real signals exist.

Correct:

- calibration semantics;
- over/under-confidence percentages;
- skill routing;
- durable signal aggregation.

Prefer integrating Confidence into Progress rather than creating another major
dashboard.

`KV-UX-008` re-enters here.

---

## Workstream 3E — Adaptive Continue

The Home/Continue experience should increasingly use:

- due review;
- weak skill;
- current pathway;
- unfinished work;
- recent mistakes;
- study target;
- profession;
- YKI target;
- learner availability.

Keep its decision understandable.

---

## Phase 3 exit

No Progress number or recommendation may be produced solely from entitlement,
fixed constants, sample arrays, or position in a list.

---

# PHASE 4 — Everyday Finnish and retention system

## Goal

Turn Everyday Finnish into a coherent multi-skill pathway instead of a
flashcard collection.

Implement:

- `KV-CARDS-001`
- `KV-CARDS-002`
- `KV-CARDS-003`
- `KV-LEARN-001`
- relevant portions of `KV-LEARN-004`.

---

## Workstream 4A — Current canonical card-bank level audit

Audit the current canonical bank only.

Measure:

- CEFR distribution;
- incorrect level assignments;
- vocabulary complexity;
- progression gaps;
- duplicates;
- missing metadata;
- cards that need physical level movement.

Do not use historical April material counts as current bank truth.

Do not solve incorrect canonical metadata only with UI filtering.

---

## Workstream 4B — Guided vocabulary progression

Build progression using:

- CEFR;
- usefulness;
- prerequisite knowledge;
- learner history;
- mastery;
- context.

Progress from high-value survival Finnish toward more complex language.

---

## Workstream 4C — Four-skill Everyday pathway

Systematically provide:

- listening;
- speaking;
- reading;
- writing;
- vocabulary;
- grammar;
- retrieval/review.

Flashcards remain a foundation, not the whole pathway.

---

## Workstream 4D — Personal Phrase Bank

Re-enter:

`KV-UX-006`

Implement the documented gates:

- authenticated durable storage;
- truthful GET;
- durable POST;
- no pseudo-success;
- Roleplay capture;
- targeted review;
- localization;
- runtime validation.

Expose only when all gates pass.

Permanent home:

Everyday Finnish.

---

## Workstream 4E — Revision Vault

Re-enter:

`KV-UX-007`

Populate from real:

- mistakes;
- corrections;
- weak patterns;
- scheduled review.

Connect to targeted review.

Expose only when all documented gates pass.

Permanent home:

Everyday Finnish with Progress/adaptive secondary entry.

---

# PHASE 5 — YKI architecture and learner journey

## Goal

Make YKI a coherent four-skill preparation system with especially strong
writing practice and defensible readiness/planning.

Implement:

- `KV-LEARN-003`
- `KV-P0-006`
- `KV-P0-008`
- `KV-P0-009`
- `KV-UX-009`

---

## Workstream 5A — Revalidate current YKI authority

Before altering architecture, prove current:

- certified bank;
- runtime task indexes;
- exam engine path;
- practice path;
- exam fallback;
- session persistence;
- results path;
- writing/audio/speaking paths.

Historical reports may guide questions but current code decides authority.

Preserve the certified bank unless current evidence justifies a controlled
migration.

---

## Workstream 5B — YKI Practice consolidation

Compare the legacy YKI Practice capability with the canonical active
implementation.

Explicitly decide whether to retain:

- skill-focus selection;
- persisted-session resume.

Migrate useful behavior first.

Only later delete the obsolete implementation after gates pass.

---

## Workstream 5C — Four-skill YKI progression

Provide separate learner evidence for:

- reading;
- listening;
- writing;
- speaking.

Writing should receive particularly strong practice, feedback, and progression
visibility.

---

## Workstream 5D — YKI Planner

Re-enter:

`KV-UX-009`

Use real:

- YKI events;
- target level;
- target exam date;
- available study time;
- study days;
- skill weaknesses;
- recent practice;
- mock/full exam performance.

Separate target level from readiness.

No positional fake completion states.

Route next actions to the actual recommended task.

Expose only after readiness language is defensible.

---

## Workstream 5E — Review route decision

For:

`KV-P0-008`

Either:

- build a real answer-review flow connected to actual exam/session results;

or:

- delete the placeholder route after deletion gates.

Do not retain a pretend review screen.

---

## Workstream 5F — Certificate capability

For:

`KV-P0-009`

First define what it means.

It must never imply an official Finnish YKI certificate unless that claim is
legally and factually justified.

If retained:

- bind to verified session/result;
- load from real backend capability;
- connect from valid results;
- localize;
- handle not-issued/error states.

Delete only placeholder frontend chains that are proven obsolete, not the real
backend capability without an explicit product decision.

---

# PHASE 6 — Professional Finnish architecture

## Goal

Build one canonical Professional Finnish pathway covering every profession
supported by the product.

Implement:

- `KV-LEARN-002`
- `KV-UX-010`
- `KV-UX-011`
- professional portions of Progress/recommendations.

---

## Workstream 6A — Canonical profession taxonomy

Resolve the current mismatch between paid professions such as:

- doctor;
- nurse;
- practical nurse

and broader backend work domains such as:

- healthcare;
- office;
- construction;
- cleaning;
- hospitality;
- retail.

Define explicitly:

- paid profession;
- content profession;
- work domain;
- profession-to-domain mapping;
- entitlement behavior;
- learner-selected profession.

No first-track or healthcare default may masquerade as personalization.

---

## Workstream 6B — Professional four-skill pathway

For every supported profession, provide meaningful:

- listening;
- speaking;
- reading;
- writing;
- vocabulary;
- workplace interaction;
- documentation;
- culture/communication competence.

Do not build a nurse-only architecture and call it generic Professional
Finnish.

---

## Workstream 6C — Merge Work Finnish Path capability

Re-enter:

`KV-UX-010`

Preserve useful:

- missions;
- next mission;
- skill sequencing;
- language targets;
- speaking scenarios;
- writing tasks;
- vocabulary clusters;
- progression.

Prefer integration into the canonical Professional hub rather than exposing a
second competing hub.

After migration, the old standalone Work Path surface may become a deletion
candidate if all gates pass.

---

## Workstream 6D — Repair Workplace Incident Lab

Re-enter:

`KV-UX-011`

Keep it contextual.

Requirements:

- preserve active profession;
- correct profession/work-domain mapping;
- profession-appropriate incidents;
- truthful personalization wording;
- real draft persistence or remove Save Draft;
- direct incident -> matching live practice;
- consume useful response choices/coaching fields;
- no unrelated fallback incidents;
- localization;
- entitlement validation.

Primary home:

Professional Finnish -> selected profession -> Incident practice.

Secondary entry:

Speaking/roleplay.

Not a global drawer destination.

---

# PHASE 7 — Roleplay, voice, UX, accessibility, and motivation

## Goal

Improve cross-cutting interaction quality after data and product architecture
are stable.

---

## Workstream 7A — Roleplay pedagogy

Implement:

- `KV-ROLEPLAY-001`
- `KV-ROLEPLAY-002`
- `KV-ROLEPLAY-003`

Requirements:

- stable learner/AI roles;
- OpenAI-generated variation remains part of conversation generation;
- anti-repetition;
- level-appropriate vocabulary, pace, complexity, and independence;
- scenario context retained across turns;
- profession context retained;
- real learner-event capture for later Progress/review.

Do not rebuild the voice stack solely because an obsolete audit described the
old STT outage.

---

## Workstream 7B — Voice identity

Implement:

`KV-VOICE-001`

Verify actual generated voice against:

- label;
- intended character;
- expected gender/identity metadata where used;
- Finnish pronunciation quality.

Voice mappings should be testable.

---

## Workstream 7C — Authentication usability

Implement:

- `KV-AUTH-001`
- `KV-AUTH-002`

Add:

- password reveal/hide;
- correct accessibility labels;
- Enter/return submit behavior;
- duplicate-submit protection;
- loading/focus behavior.

---

## Workstream 7D — Navigation/visual orientation

Continue:

`KV-UX-004`

Maintain calm pathway identity without adding unnecessary global navigation.

Preserve secondary utilities in secondary navigation.

---

## Workstream 7E — Motivation only after real progress

Implement only after Phase 3 evidence exists:

- `KV-PROGRESS-006`
- `KV-PROGRESS-007`
- `KV-MOTIVATION-001`
- `KV-MOTIVATION-002`

Rewards must correspond to real accomplishments.

Support:

- sound off;
- reduced motion;
- screen readers;
- non-audio feedback.

---

## Workstream 7F — Accessibility baseline

Perform a practical WCAG 2.2 AA-oriented review for web/mobile-relevant
controls.

Cover:

- focus;
- keyboard use;
- touch targets;
- contrast;
- dynamic text;
- screen-reader semantics;
- reduced motion;
- error identification;
- authentication;
- navigation;
- forms.

---

# PHASE 8 — Consolidation and evidence-gated deletion

## Goal

Remove obsolete implementations only after useful capability has been migrated.

Execute in small deletion batches.

---

## Batch candidates

Potential candidates recorded during Phase 0 include:

- orphan exam scaffolds;
- legacy ExamIntro;
- placeholder YKI Review route if not implemented;
- Expo template modal;
- obsolete packages/ui product screens;
- legacy public marketing/web implementations;
- legacy certificate placeholder chain;
- old YKI Practice after useful behavior migration;
- daily-practice alias after compatibility proof;
- standalone Work Path after capability merge.

No item in this list is automatically authorized for deletion.

---

## Backend cleanup

Historical agent reports proposed backend quarantine/removal work.

DO NOT execute those historical lists directly.

First run the current authority audit from Phase 1.

Only current orphan/shadow code may enter a backend deletion batch.

---

## Required deletion sequence

For every batch:

1. identify candidate;
2. enumerate direct consumers;
3. enumerate exports/re-exports;
4. inspect dynamic/string-based loading;
5. inspect route/deep-link dependencies;
6. inspect API/storage/event dependencies;
7. compare unique capability;
8. migrate required capability;
9. rerun dependency proof;
10. require both deletion gates;
11. delete;
12. build/test affected surfaces;
13. remove now-stale exports/routes/docs;
14. record evidence.

---

# PHASE 9 — Quality, CI, security, and release verification

## Goal

Make the improved system reproducible and regression-resistant.

Implement/complete:

- `KV-QA-002`
- `KV-QA-003`
- `KV-QA-004`
- continued `KV-QA-001` enforcement.

---

## Workstream 9A — UI exposure invariant

Automate detection of:

- new learner-facing routes with no intended entry;
- orphan screens;
- duplicate canonical/legacy surfaces;
- contextual surfaces with no declared retention reason.

---

## Workstream 9B — Cross-platform regression matrix

Validate important workflows on:

- web;
- Android;
- iOS.

Include:

- login/logout/session restore;
- onboarding;
- subscription/entitlements;
- Everyday;
- Progress;
- cards;
- YKI;
- Professional;
- speaking/roleplay;
- Read access;
- deep links;
- refresh/back navigation where applicable.

---

## Workstream 9C — Security/product-boundary tests

Verify:

- authenticated learner isolation;
- object-level ownership;
- product entitlement enforcement;
- cards/YKI/professional personalization authorization;
- Read/Create boundaries;
- no secret leakage;
- safe error payloads;
- safe upload/audio paths.

---

## Workstream 9D — Reproducibility/CI

Maintain a clean-checkout standard:

- dependencies reconstructed from manifests;
- no local environment required from source control;
- meaningful TypeScript/lint/test gates;
- backend tests;
- engine/YKI tests;
- navigation/exposure invariants;
- material/card-bank integrity checks;
- controlled deployment smoke tests.

CI must test current architecture, not historical paths.

---

# 4. Deferred / non-blocking research

These may proceed after core foundations are stable:

- `KV-LEARN-005` competitor-informed audit;
- broader interaction-pattern research;
- optional reward experimentation;
- deeper cosmetic cleanup.

They must not displace data truth, learning quality, navigation correctness, or
core Finnish-learning outcomes.

---

# 5. Blocked-feature return order

After Phases 1–3 establish the shared foundations, return to retained blocked
features in this order:

1. Confidence integration into real Progress;
2. Personal Phrase Bank;
3. Revision Vault;
4. YKI Planner;
5. Professional Work Path capability integration;
6. Workplace Incident Lab repair/promotion decision.

This order may change only when dependency evidence justifies it.

Each feature must pass its existing documented gates.

---

# 6. Product success criteria

The implementation program is successful when:

- KieliValmis has three coherent learning pathways;
- learner progress is real and explainable;
- recommendations have evidence;
- Everyday Finnish is more than flashcards;
- Professional Finnish works across every supported profession;
- YKI has strong four-skill preparation with especially strong writing;
- useful hidden capabilities are repaired and integrated rather than merely
  exposed;
- fabricated learner state is gone from production experiences;
- Read/Create product boundaries are enforced;
- duplicate/obsolete UI is removed safely;
- roleplay is varied, stable, level-appropriate, and measurable;
- accessibility and cross-platform behavior are validated;
- future orphan/duplicate surfaces are caught automatically.

---

# 7. Implementation discipline

For each implementation package:

1. verify clean branch/head;
2. inspect current source before patching;
3. make the smallest coherent dependency-aware change;
4. print progress/statistics for long-running scripts;
5. run targeted verification;
6. update roadmap status;
7. update this plan when dependencies change;
8. commit only intended files;
9. push;
10. independently verify the pushed commit;
11. keep production changes separate from source-development proof.

Do not skip directly to a visually attractive feature if its underlying data
would still be synthetic.

---

# 8. Immediate next implementation package after plan freeze

The first implementation package should be:

**CURRENT AUTHORITY + NAVIGATION + ENTITLEMENT FOUNDATION**

It should cover:

- regenerate current authority map;
- fix `/help` route contract;
- canonicalize route/deep-link handling;
- verify/fix Read direct entitlement enforcement;
- verify/fix Create direct entitlement enforcement;
- reconcile Read/Create AppShell navigation;
- update current multi-product architecture documentation;
- add regression tests for these boundaries.

Do not begin Phrase Bank, Revision Vault, Confidence, Planner, Work Path, or
Incident Lab repair in this first package.

That sequencing protects the later learner-event/data architecture from being
built on top of unstable routing or product-boundary assumptions.
