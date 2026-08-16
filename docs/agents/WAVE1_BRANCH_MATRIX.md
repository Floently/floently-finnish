# KieliValmis Wave 1 Branch and Ownership Matrix

Status: MANDATORY
Date: 2026-08-16

## Source lock

Frozen pre-governance source candidate:

`107985d4dcb26d0c8ef010580e78cc9c61fce922`

Agent A owns the governance/contracts branch:

`agent/a-wave1-governance-contracts-20260816`

After Agent A freezes governance/contracts, an immutable shared base ref will be created:

`integration/wave1-shared-base-20260816`

Agents B–G MUST branch from that exact immutable shared base. They MUST NOT branch from one another, from `main`, from the stale rescue branch, or from a historical feature branch.

## Agents

### Agent A — Architecture, governance, integration and independent verification

Branch: `agent/a-wave1-governance-contracts-20260816`

Owns:
- Wave-1 shared learning contracts;
- agent rules and research standard;
- branch/ownership matrix;
- cross-agent integration protocol;
- whole-product safety/test matrix;
- review of every B–G PR;
- later controlled replay into an integration candidate;
- independent re-testing before any server discussion.

Agent A is the only Wave-1 role allowed to modify shared Wave-1 governance/contracts after freeze. Agent A still has **no production deployment authority**.

### Agent B — Learning platform, capability registry and learner events

Branch: `agent/b-learning-platform-events-20260816`

Primary ownership:
- new learning-platform service/types under dedicated learning/event paths;
- task capability registry implementation;
- learner event persistence interfaces and non-production implementations;
- deterministic availability/health contracts;
- event/result test fixtures.

Must not own Practice UI/composer, Reading renderer, Writing renderer, Professional mission content or motion system.

### Agent C — Shared Reading engine

Branch: `agent/c-reading-engine-20260816`

Primary ownership:
- Everyday/Professional learning Reading runtime and UI;
- Reading task/result adapters;
- CEFR reading task families;
- Reading accessibility/focus behavior;
- Reading tests and authored content fixtures.

Reserved routes: `/learn/reading`, `/professional/reading`.

Never repurpose `/read`; KieliValmis Read remains a separate product surface.

### Agent D — Shared Writing and revision engine

Branch: `agent/d-writing-revision-engine-20260816`

Primary ownership:
- Everyday/Professional learning Writing runtime and UI;
- draft/attempt/revision loop;
- focused feedback/retry architecture;
- writing evidence adapters;
- CEFR writing task families;
- Professional writing task adapters;
- tests.

Reserved routes: `/learn/writing`, `/professional/writing`.

### Agent E — Practice Hub and explainable composer

Branch: `agent/e-practice-hub-composer-20260816`

Primary ownership:
- top-level Practice destination;
- 5/10/20-minute session setup;
- hard filtering and deterministic ranking;
- explainable `Why these tasks?` reasons;
- context-coherent session manifest;
- Practice session shell and controls;
- pathway-scoped Daily Practice entry points;
- composer/session tests.

Must orchestrate canonical task runtimes; must not clone Reading, Writing, Roleplay, Cards or YKI business logic.

### Agent F — Professional mission system and profession content orchestration

Branch: `agent/f-professional-missions-20260816`

Primary ownership:
- profession/work-domain taxonomy adapters;
- coherent professional mission descriptors;
- Workplace Incident/Work Path integration adapters;
- interview/workplace mission content;
- four-skill professional mission chains;
- professional content tests.

Must consume shared Reading/Writing/Roleplay capabilities through descriptors/adapters, not fork their engines.

### Agent G — Experience system, visual language, motion, haptics and accessibility

Branch: `agent/g-experience-motion-20260816`

Primary ownership:
- reusable learning experience tokens/components;
- skill/pathway icon language;
- Practice path/progress presentation primitives;
- Reanimated-based transitions;
- semantic haptic helpers;
- reduced-motion behavior;
- focus-state visual rules;
- accessibility/visual regression contracts where feasible.

Must not add a native animation dependency (including Rive) in Wave 1 without explicit Agent-A/user approval. Use installed capabilities first.

## Shared-file rule

Files listed as protected/shared in `WAVE1_PROTECTED_FILES_AND_CAPABILITIES.md` may be edited only when the agent prompt explicitly grants it or Agent A approves a narrow change. If two agents need the same shared file, prefer:

1. new adapter/module owned by one agent;
2. frozen shared contract;
3. Agent-A integration change;

instead of parallel edits to the same file.

## Cross-agent dependency rule

Agents may code against the frozen shared contract and temporary local fixtures/adapters. They must not wait for, merge, cherry-pick or import code directly from another feature agent's moving branch.

Cross-agent needs are recorded in the handoff as `INTEGRATION_REQUIREMENT` items for Agent A.
