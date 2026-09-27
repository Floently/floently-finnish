# Wave 1 Shared Learning Contract

Status: FROZEN INTERFACE FOR PARALLEL DEVELOPMENT
Owner: Agent A
Date: 2026-08-16

## Purpose

Agents B–G need one small language for describing tasks, capabilities, sessions and learner evidence without importing one another's moving branches. This contract is intentionally narrower than any individual engine.

The TypeScript source of truth is `packages/core/schemas/learning.ts`.

## Design rules

1. **Practice orchestrates; task runtimes execute.** Practice may select and launch a task but does not copy Cards, Roleplay, Reading, Writing or YKI business logic.
2. **Descriptor before implementation coupling.** Cross-feature coordination happens through stable descriptors/results rather than direct imports from another agent's feature branch.
3. **Truthful evidence.** Learner-specific recommendations require durable learner-specific evidence. Curriculum-safe selection is explicitly labeled when personalization evidence is absent.
4. **Deterministic reasoning.** A Practice manifest records selection reasons and evidence mode. The same inputs should be explainable/reproducible enough for tests.
5. **Explicit modality.** Tasks declare audio/microphone/keyboard requirements so the composer can filter before launch.
6. **Entitlement remains authoritative.** A descriptor may state required entitlement keys but may not replace canonical server/client entitlement checks.
7. **YKI boundary is explicit.** `ykiMode` distinguishes ordinary YKI practice from mock/full exam semantics; Practice must never silently escalate modes.
8. **Version content.** Events/results reference task content versions so later content changes do not rewrite historical meaning.
9. **Adapters are allowed.** Existing Cards/Roleplay/YKI may be adapted to this contract without rewriting their internal engines.
10. **No feature branch owns the shared contract.** Proposed contract changes are integration requirements for Agent A.

## Core types

### `TaskDescriptor`

Describes an executable learning task without embedding the task engine itself.

Required concepts:

- stable task ID and content version;
- runtime owner;
- pathway;
- one or more skills;
- CEFR/level band;
- estimated duration;
- modality requirements;
- required entitlement keys;
- launch target;
- availability/health;
- optional profession/topic/context/prerequisite metadata;
- explicit YKI mode when applicable.

### `TaskCapability`

Describes what a runtime can safely offer to the registry/composer: supported pathways/skills, feature flag and health.

### `TaskResult`

The minimal runtime-neutral completion result. Engines can retain richer internal results, but adapters emit this form to the orchestration/evidence layer.

### `LearnerEvent`

A durable, learner-keyed observation of an actual action/outcome. It is not a telemetry substitute and is not inferred from screen visits alone.

### `SkillEvidence`

A normalized evidence record derived from real learner events. It must preserve source event identity and skill/level context.

### `PracticeSessionManifest`

An immutable description of the selected session: scope, target duration, task order, per-task reason and evidence mode (`learner` or `curriculum`).

## Evidence modes

`learner` means selection/reasoning is supported by durable learner-specific evidence.

`curriculum` means the product is making a safe curriculum/balance decision without claiming personalized weakness/mastery/overdue state.

A session may contain both modes task-by-task.

Forbidden copy examples when evidence is curriculum-only:

- `You are weak at speaking.`
- `You missed this twice.`
- `This is overdue.`

Allowed curriculum-safe explanations include:

- `This session balances reading and speaking.`
- `This continues the workplace handover theme.`
- `Microphone tasks were excluded for this session.`

## Availability and health

`available` — safe to schedule normally.

`degraded` — may be usable with an explicit deterministic fallback; composer decides according to policy.

`unavailable` — hard filter; do not schedule.

Health metadata does not override auth/entitlement/server availability checks at execution time.

## Launch model

The shared contract uses a route/parameter launch target because current KieliValmis capabilities are route-owned. Feature agents should prefer adding adapters/owners around canonical routes rather than moving unrelated navigation code.

Reserved ordinary-learning routes in Wave 1:

- `/learn/reading`
- `/professional/reading`
- `/learn/writing`
- `/professional/writing`

Do not repurpose `/read`, which belongs to the separate KieliValmis Read product surface.

## Practice composer contract

Hard filters happen before ranking:

- entitlement compatibility;
- profession/work-domain compatibility;
- level/prerequisite safety;
- runtime/feature health;
- modality availability;
- session time budget;
- recent repetition policy when evidence exists;
- YKI mode boundary;
- product truth constraints.

Ranking may then consider evidence-backed need, goal relevance, rolling skill balance, novelty, time fit and context coherence. When evidence-backed need is unavailable, its contribution must be omitted/neutral rather than fabricated.

## Integration compatibility

Reading, Writing and Professional Missions may produce descriptors/results independently using this contract. Practice may consume fixture descriptors without importing those agent branches. Agent B may implement persistence/registry infrastructure independently. Agent G may create presentation components that consume descriptors/manifests without owning composer logic.

## Contract-change protocol

If an agent discovers a missing field:

1. do not mutate this contract on its feature branch;
2. document the concrete use case;
3. propose the smallest backward-compatible addition as `INTEGRATION_REQUIREMENT`;
4. continue through a local adapter/extension where safe;
5. Agent A reviews and, if accepted, changes the shared contract centrally before integration.

Breaking changes during Wave 1 require explicit user approval.
