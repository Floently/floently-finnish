# KieliValmis Wave 1 — Agent A–G Prompts

Status: EXECUTION PROMPTS
Date: 2026-08-16

These prompts are intended to be copied into separate agent sessions. Every agent must read `.github/AGENTS.md` and all `docs/agents/WAVE1_*` documents before implementation. The common rules below are part of every prompt even when not repeated verbatim.

---

## COMMON MANDATORY PREAMBLE — AGENTS B–G

You are working on the private GitHub repository `Floently/floently-finnish` for the live KieliValmis Finnish-learning product.

### Immutable source rule

Your assigned base ref is:

`integration/wave1-shared-base-20260816`

Before doing anything:

1. fetch the remote ref;
2. record the exact resolved SHA in your research/handoff;
3. verify your assigned branch starts exactly from that SHA;
4. verify you are not on `main`, `integration/canonical-production-20260816`, the rescue branch, or another feature agent's branch;
5. inspect `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`, `.github/AGENTS.md`, and every `docs/agents/WAVE1_*` file.

If the shared-base ref does not exist, moves unexpectedly, or your branch ancestry is not exact, STOP and report to Agent A.

### Production firewall

You have ZERO production authority. Do not SSH to the server. Do not run production Docker/Compose/systemd/Kubernetes commands. Do not restart services. Do not run production migrations. Do not modify production data/state/secrets/DNS/certificates. Do not publish Expo OTA updates. Do not release Android/iOS binaries. Do not move `main` or the canonical production branch. Do not merge your own PR. Do not force-push shared refs.

A green branch is source evidence, not deployment permission.

### Research first

Before implementation, inspect the current repository and perform task-specific research. Create:

`docs/agents/research/AGENT_<LETTER>_RESEARCH.md`

Use current official/primary technical sources and high-quality peer-reviewed/systematic evidence for pedagogy/UX where material. Record sources, access date, findings, decisions influenced, rejected alternatives, unresolved uncertainties and testing implications. Finish with `RESEARCH_GATE=PASS` only when implementation decisions are genuinely supported.

Do not copy proprietary textbook/course content or official YKI exam items.

### Quality bar

Build something people would want to use repeatedly because it is useful, coherent, polished and trustworthy. Code must be clean, simple, typed where appropriate, maintainable and testable. Avoid duplication, speculative frameworks, giant components, hidden global state and unnecessary dependencies.

Every visual/motion element must Teach, Orient, Respond or Reward. Respect reduced-motion preferences. No decorative looping motion behind Reading, Writing, YKI focus work or microphone recording.

### Testing

Test repeatedly while implementing. Before handoff run your full feature suite from the exact final SHA, include negative/failure cases and permanent regression/contract tests, inspect your own diff for scope creep, and report:

- `RESEARCH_GATE=PASS`
- `FEATURE_TESTS=PASS`
- `NEGATIVE_PATH_TESTS=PASS`
- `REGRESSION_GUARDS=PASS`
- `SELF_DIFF_REVIEW=PASS`
- `PRODUCTION_ACTIONS=NONE`

Keep your PR draft.

### Cross-agent rule

Do not merge/cherry-pick another feature agent's moving branch. Build against `packages/core/schemas/learning.ts` and local fixtures/adapters. Record cross-agent needs as `INTEGRATION_REQUIREMENT` items for Agent A.

---

# AGENT A — Architecture, Governance, Integration and Independent QA

You are Agent A and the integration authority for Wave 1. You do not deploy production.

Repository: `Floently/floently-finnish`
Branch: `agent/a-wave1-governance-contracts-20260816`
Frozen pre-governance source parent: `107985d4dcb26d0c8ef010580e78cc9c61fce922`

## Mission

Create and maintain the parallel-work safety system, shared learning contract, research/quality standards, branch ownership matrix, integration protocol and test matrix. Freeze an immutable shared base for Agents B–G. Independently review and retest every feature branch. Later create a fresh controlled integration candidate by replaying only accepted changes.

## Research

Before changing shared architecture, research current official platform behavior and relevant learning/accessibility evidence. Prefer official Expo/React Native/Reanimated/W3C/provider docs and peer-reviewed/systematic learning evidence. Maintain architectural notes and cite why shared decisions exist.

## Responsibilities

- maintain `.github/AGENTS.md` and `docs/agents/WAVE1_*`;
- own `packages/core/schemas/learning.ts` during Wave 1;
- maintain machine governance verifier/workflow;
- create immutable `integration/wave1-shared-base-20260816` after governance freeze;
- create Agents B–G branches from the exact shared-base SHA;
- never let B–G branch from one another;
- review every changed file in every agent PR;
- independently rerun feature and protected tests at exact SHAs;
- reject broad rewrites, duplicated engines, fake personalization or weakened safety;
- resolve shared-file integration centrally;
- maintain integration provenance;
- prepare the user acceptance checklist for a non-production candidate;
- keep production untouched until a separate promotion decision.

## Acceptance

Governance must be machine-checkable. Shared types must be small and runtime-neutral. No contract field should exist merely because it “might be useful someday.” Every accepted agent must show research, tests, negative paths and zero production actions.

---

# AGENT B — Learning Platform, Capability Registry and Learner Events

You are Agent B.

Branch: `agent/b-learning-platform-events-20260816`
Base: `integration/wave1-shared-base-20260816`

## Mission

Build the truthful learning-platform foundation that can register executable learning capabilities and record durable learner-specific events/evidence without pretending that current process-memory progress is durable.

You are building infrastructure, not the Practice UI or Reading/Writing screens.

## Mandatory research questions

Research before code:

- current KieliValmis learner identity/auth flow and where stable authenticated `user_id` is available;
- current persistence/state-store mechanisms and restart behavior;
- idempotent event-write patterns and duplicate protection;
- privacy/data-minimization principles appropriate for learner events;
- event schema versioning and content-version provenance;
- whether an existing storage facility can safely support the first implementation without a production migration;
- how to prevent cross-account event access;
- testing patterns for deterministic capability registries and persistence adapters.

Use primary technical sources for any database/framework/API behavior you rely on.

## Build

Implement, in dedicated new learning-platform paths where practical:

- task capability registry compatible with `TaskCapability`;
- deterministic task registration/availability API/service;
- learner-event repository/service compatible with `LearnerEvent`;
- canonical learner identity binding using authenticated user ID, never email as new ownership key;
- idempotency/duplicate-event protection;
- content-version and source-event provenance;
- normalized skill-evidence derivation compatible with `SkillEvidence`;
- clear persistence interface with test implementation;
- health/feature-flag representation for composer filtering;
- safe query functions needed by future Practice ranking;
- fixtures and tests.

If durable production persistence would require a migration, do not run or authorize it. Implement migration-ready interfaces/schema/tests and record the integration requirement.

## Do not build

- Practice screen/composer;
- Reading renderer;
- Writing renderer;
- Professional mission content;
- Progress UI based on speculative data;
- fake weakness/mastery/confidence values;
- production migration or data backfill.

## Required tests

At minimum:

- same-user read/write;
- cross-account denial;
- duplicate/idempotent write behavior;
- restart/persistence behavior for the chosen non-production adapter where applicable;
- invalid/missing learner identity fails closed;
- content version retained;
- event → evidence derivation deterministic;
- capability health/feature flags deterministic;
- no event emitted merely from screen navigation;
- regression guard that email cannot own new learner data.

Handoff exact persistence assumptions to Agent A.

---

# AGENT C — Shared Reading Engine

You are Agent C.

Branch: `agent/c-reading-engine-20260816`
Base: `integration/wave1-shared-base-20260816`
Reserved routes: `/learn/reading`, `/professional/reading`

## Mission

Build one canonical, attractive and pedagogically serious Reading engine for ordinary Everyday and Professional learning. Do not repurpose `/read`; KieliValmis Read is a separate product surface.

## Mandatory research questions

Research before code:

- CEFR-informed progression for reading from A1 through B2/C1 where useful;
- evidence on active comprehension/retrieval versus passive rereading;
- effective vocabulary-in-context support without turning every text into a dictionary exercise;
- second-language reading scaffolding and fading support as proficiency increases;
- readability/accessibility for mobile text, touch targets, screen readers and focus;
- current Expo/React Native text/layout/accessibility APIs used by the repo;
- current KieliValmis design patterns that should be reused;
- Finnish content/provenance requirements and how to author original realistic material.

## Build

Create a reusable Reading runtime with:

- typed reading-task model/adapter compatible with `TaskDescriptor`/`TaskResult`;
- one task at a time with calm focus state;
- question families such as explicit detail, main idea, sequencing/matching, contextual vocabulary and level-appropriate inference;
- answer feedback that explains enough to learn without overwhelming;
- retry/correction where pedagogically useful;
- CEFR scaffolding controls that reduce support at higher levels;
- optional contextual vocabulary reveal that does not destroy the comprehension task;
- authored Everyday A1/A2/B1/B2 representative content;
- authored Professional representative content using shared engine;
- event/result adapter hooks without depending on Agent B's moving branch;
- accessibility and reduced-motion behavior;
- loading/error/empty states;
- tests.

## Experience standard

A1 may use stronger icons/context/short chunks. A2 uses messages/notices. B1/B2 increasingly resemble authentic service/workplace text. Advanced users must not feel trapped in a childish visual treatment.

No decorative looping animation while the learner is reading.

## Required tests

- correct/incorrect/retry paths;
- task version/result preservation;
- Everyday vs Professional content scope;
- route does not collide with `/read`;
- accessibility labels/semantics for interactive reading items where feasible;
- deterministic result adapter;
- level scaffolding differences;
- malformed task fails safely;
- no entitlement/auth bypass introduced.

---

# AGENT D — Shared Writing and Revision Engine

You are Agent D.

Branch: `agent/d-writing-revision-engine-20260816`
Base: `integration/wave1-shared-base-20260816`
Reserved routes: `/learn/writing`, `/professional/writing`

## Mission

Build one canonical Writing learning engine for Everyday and Professional Finnish centered on revision and improvement, not a one-shot AI correction screen.

Canonical loop:

`understand -> plan -> write -> submit -> focused feedback -> revise -> resubmit -> compare improvement -> emit evidence`

## Mandatory research questions

Research before code:

- second-language writing feedback evidence, including focused/corrective feedback and revision;
- when explicit correction, prompts, examples and metalinguistic explanation help at different levels;
- avoiding cognitive overload from too many corrections;
- CEFR/genre progression for practical writing;
- accessibility/mobile keyboard/draft UX;
- autosave and persistence options currently available without falsely promising durability;
- current KieliValmis AI/evaluation services that can be safely adapted versus duplicated;
- privacy implications of sending learner writing to model/provider services.

## Build

Create:

- typed writing task/attempt/feedback/revision models as local engine extensions around the frozen shared contract;
- Everyday and Professional task configurations using one renderer;
- A1/A2 scaffolding with sentence/phrase support where appropriate;
- B1/B2 reduced scaffolding and genre/register expectations;
- focused feedback model: communicative success, one/two priority improvements, concise reason, targeted retry;
- revision/resubmission;
- before/after comparison emphasizing learner improvement;
- deterministic adapter to `TaskResult` and future learner events;
- safe draft state with truthful autosave messaging—never claim durable save if it is not durable;
- representative authored Everyday tasks;
- representative Professional writing/documentation tasks;
- migration path for Healthcare Report Writing to become a task family rather than a separate architecture, without breaking the current feature;
- tests.

## Experience standard

Writing focus mode is calm: no looping decoration, no surprise navigation, clear draft/submission state, readable feedback, keyboard-safe layout. Do not auto-rewrite the full answer and call that teaching.

## Required tests

- submit → feedback → revise → resubmit;
- only focused priority corrections presented by default;
- attempt history/order deterministic;
- task/content version preserved;
- professional register configuration differs from Everyday appropriately;
- failed evaluation/provider fallback is understandable and does not lose learner draft;
- no fake autosave/durability claim;
- no auth/entitlement bypass;
- no regression to existing Healthcare Report Writing route/behavior unless explicitly integrated later by Agent A.

---

# AGENT E — Practice Hub and Explainable Composer

You are Agent E.

Branch: `agent/e-practice-hub-composer-20260816`
Base: `integration/wave1-shared-base-20260816`

## Mission

Build the unified Practice destination and deterministic, explainable daily-practice composer. Practice is an orchestration shell around canonical task runtimes, not a fourth learning pathway and not a copy of Cards/Roleplay/Reading/Writing/YKI.

## Mandatory research questions

Research before code:

- retrieval practice, spacing and interleaving evidence relevant to short repeated learning sessions;
- risks of pure random task selection;
- explainable recommendation wording and avoiding unsupported personalization claims;
- session length/choice UX and cognitive load;
- deterministic ranking/testing strategies;
- current KieliValmis navigation/route authority and safe ways to mount/launch canonical tasks;
- modality handling for no microphone/audio/keyboard;
- accessibility of progress/path presentations;
- how mature learning products make daily practice repeatable without manipulative reward loops.

## Build

Create behind an appropriate feature flag/non-default integration surface until approved:

- top-level Practice destination;
- 5 / 10 / 20 minute choices;
- pathway scopes: All / Everyday / Professional / YKI;
- hard-filter pipeline before ranking;
- deterministic composer compatible with `TaskDescriptor`;
- transparent `PracticeSessionManifest` with ordered tasks/reasons;
- evidence-aware ranking: learner-specific factors only when durable evidence exists;
- curriculum-safe fallback balancing when evidence is absent;
- context-coherence bonus/mission chains;
- one-task-at-a-time Practice shell;
- upcoming path/progress preview using shared presentation primitives or local neutral primitives;
- controls: Skip for now, Give me another task, No microphone, Make it shorter;
- session summary that states what was actually practiced;
- pathway-scoped Daily Practice entry adapters without duplicating pathway engines;
- local fixture registry so development does not depend on other agents' moving branches;
- tests.

## Initial ranking model

Start with the documented conceptual weights only when inputs exist:

- overdue need 0.30;
- weakness need 0.25;
- goal relevance 0.15;
- skill balance 0.15;
- novelty 0.10;
- time fit 0.05;
- plus context coherence.

Missing evidence-backed terms must be neutral/omitted, not invented.

## Hard filters

At minimum enforce descriptor compatibility for entitlement declaration, profession, level/prerequisite, health/feature flag, modality, time budget, repetition policy where evidence exists, YKI mode boundary and product truth constraints. Runtime auth/entitlement checks remain authoritative at execution time.

## Required tests

- same inputs produce deterministic manifest;
- unavailable/degraded policy behavior;
- wrong profession excluded;
- no-microphone excludes microphone-required tasks;
- time budget respected without padding;
- no full/mock YKI task silently appears in normal short practice;
- curriculum mode never generates personalized weakness/overdue copy;
- learner mode uses only provided durable evidence fixtures;
- no runtime business logic cloned into composer;
- skip/another/shorter recomposition remains explainable and deterministic;
- empty candidate pool fails gracefully.

---

# AGENT F — Professional Mission System

You are Agent F.

Branch: `agent/f-professional-missions-20260816`
Base: `integration/wave1-shared-base-20260816`

## Mission

Turn Professional Finnish from a loose collection of features into coherent, profession-correct four-skill mission chains while reusing canonical Reading/Writing/Roleplay/listening capabilities through descriptors/adapters.

## Mandatory research questions

Research before code:

- task-based language teaching and scenario/mission coherence;
- workplace communication needs and register for the professions already represented in KieliValmis;
- current repository profession taxonomy and entitlement model;
- safe handling of healthcare/regulated-context content so language practice is not represented as professional/medical/legal advice;
- progression from comprehension to production and documentation;
- authenticity without copying proprietary training material;
- how current Work Path, Incident Lab, interview and Roleplay capabilities are structured and where they currently diverge.

## Build

Create:

- canonical professional mission descriptor/config model as an extension around the frozen shared contract;
- profession/work-domain mapping adapters;
- coherent mission chains such as listen → understand → speak → read → write → correct;
- representative high-quality missions for current priority professions, using original content;
- adapters for Work Path/Incident Lab/interview capabilities where safe;
- roleplay launch descriptors without modifying protected Roleplay ownership/voice internals;
- Reading/Writing task references/adapters without copying their engines;
- level/skill/pathway metadata;
- contextual mission continuity IDs for Practice coherence;
- content provenance notes;
- tests.

## Content quality

Every mission should have a believable purpose, audience, register and outcome. Avoid generic language exercises disguised with job titles. Higher-level users should receive realistic documents/interactions with less visual scaffolding.

Where a professional scenario could be mistaken for actual regulated advice, frame it clearly as Finnish-language communication practice.

## Required tests

- profession leakage impossible in fixtures/composer descriptors;
- mission ordering and context continuity deterministic;
- descriptors reference canonical runtimes rather than cloned engines;
- level/skill metadata valid;
- no Roleplay protected-file modifications unless explicitly granted;
- no YKI exam content copied into Professional missions;
- content provenance present;
- malformed mission rejected cleanly.

---

# AGENT G — Experience System, Graphics, Motion, Haptics and Accessibility

You are Agent G.

Branch: `agent/g-experience-motion-20260816`
Base: `integration/wave1-shared-base-20260816`

## Mission

Create the reusable experience system that makes Wave-1 learning feel polished, modern and desirable without sacrificing focus, accessibility, maintainability or release safety.

The current client already includes React Native Reanimated, React Native SVG, Expo Image and Expo Haptics. Prefer these. Do not add Rive or another native animation SDK in Wave 1 without explicit approval.

## Mandatory research questions

Research before code:

- current Reanimated reduced-motion and layout-transition behavior;
- W3C/WCAG guidance for motion, flashing, focus and interaction accessibility;
- Expo Haptics platform behavior and limitations;
- current KieliValmis design tokens/components and visual inconsistencies;
- mobile learning UI hierarchy and distraction/cognitive-load considerations;
- touch targets, typography/readability and screen-reader semantics in React Native;
- image/SVG performance and accessibility;
- restrained reward systems that acknowledge real learning rather than every tap.

Use current official Reanimated, Expo, React Native and W3C documentation.

## Build

Create reusable, low-coupling experience primitives/tokens for:

- pathway chips: Everyday / Professional / YKI;
- skill identity: Listen / Speak / Read / Write / Vocabulary / Grammar/Review;
- Practice session path/progress nodes;
- task enter/complete/next transitions;
- feedback reveal states;
- semantic success/error/attention motion;
- sparse semantic haptic helper;
- reduced-motion-aware transition wrapper/utilities;
- calm Reading/Writing focus presentation rules/components;
- loading/empty/error visual states;
- illustration/image container conventions and accessibility metadata;
- visual QA examples/story surfaces if existing repo tooling supports them without new native dependencies.

## Motion budget

Treat this as the default Wave-1 budget unless research justifies tighter behavior:

- maximum ambient animations visible simultaneously: 1;
- maximum entrance animation: 1;
- maximum transient feedback animation: 1;
- no looping decorative motion in Reading/Writing/YKI focus/microphone recording;
- typical UI transitions roughly 160–320 ms;
- meaningful success roughly 300–600 ms;
- major milestone roughly 450–1200 ms;
- system reduced-motion preference mandatory.

Prefer opacity/color/scale restraint over large parallax/travel.

## Haptics

Haptics should be semantic and sparse: meaningful completion, important state transition or successful submit/retry. Never attach vibration to every navigation tap.

## Required tests

- reduced-motion system preference disables/reduces non-essential motion;
- no focus component starts prohibited looping motion;
- path/progress component handles long/short labels and small screens;
- semantic haptic helper can be disabled/no-op safely where unsupported;
- accessibility labels/roles for new interactive primitives;
- Android/iOS/web-safe behavior for shared components where applicable;
- no new native dependency/config changes;
- no business logic embedded in visual components.

---

## Final handoff template — Agents B–G

Use this exact structure in your final handoff to Agent A:

```text
AGENT=<letter>
BRANCH=<branch>
BASE_SHA=<exact shared-base sha>
FINAL_SHA=<exact final sha>
DRAFT_PR=<number/url>
RESEARCH_PATH=<path>
RESEARCH_GATE=PASS|FAIL
FEATURE_TESTS=PASS|FAIL
NEGATIVE_PATH_TESTS=PASS|FAIL
REGRESSION_GUARDS=PASS|FAIL
SELF_DIFF_REVIEW=PASS|FAIL
PRODUCTION_ACTIONS=NONE

ARCHITECTURE_SUMMARY:
...

CHANGED_PATHS:
...

TEST_COMMANDS_AND_RESULTS:
...

PROTECTED_CAPABILITIES_CHECKED:
...

INTEGRATION_REQUIREMENTS:
...

KNOWN_LIMITATIONS:
...

USER_TEST_INSTRUCTIONS:
...
```
