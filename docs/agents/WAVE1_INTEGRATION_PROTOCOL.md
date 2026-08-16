# KieliValmis Wave 1 Integration Protocol

Status: MANDATORY
Owner: Agent A
Date: 2026-08-16

## Goal

Allow Agents B–G to make substantial progress independently while preserving a single forward, reviewable integration path and protecting the live KieliValmis server.

## Shared-base rule

Agents B–G start from the immutable `integration/wave1-shared-base-20260816` ref created by Agent A after governance/contracts freeze.

They never merge one another's branches. Cross-agent requirements are described in handoffs and resolved by Agent A during integration.

## Agent handoff contract

Each feature agent must hand Agent A:

- agent letter and task ID;
- exact base SHA;
- exact final SHA;
- branch name;
- draft PR number/link;
- research artifact path and `RESEARCH_GATE` result;
- concise architecture summary;
- changed-file list;
- tests run with exact results;
- negative/failure cases tested;
- protected-capability checks performed;
- screenshots/video/manual notes for UI work where practical;
- `INTEGRATION_REQUIREMENT` list;
- known limitations;
- user-test instructions;
- explicit `PRODUCTION_ACTIONS=NONE` statement.

## Agent-A review sequence

For each branch, Agent A:

1. resolve exact remote head;
2. compare against immutable Wave-1 shared base;
3. verify zero behind/unexpected ancestry;
4. inspect all changed paths and diff scope;
5. reject unrelated/broad rewrites;
6. inspect research and acceptance criteria;
7. inspect architecture for duplication/coupling;
8. rerun feature tests at exact SHA;
9. rerun relevant protected gates;
10. classify integration requirements;
11. require fixes on the feature branch when defects are local to that agent;
12. mark source accepted only after independent verification.

## Integration candidate creation

Agent A creates a fresh integration branch from the approved forward source lineage. It does not simply merge all feature branches.

For each accepted feature:

1. identify intended commits/files/behavior;
2. replay narrowly onto the fresh integration candidate;
3. resolve shared-file conflicts by behavior and tests;
4. preserve all protected capabilities;
5. record provenance in an integration ledger;
6. run targeted tests immediately after each replay;
7. only then replay the next package.

If a feature branch contains mixed or unnecessary changes, Agent A replays only the approved subset.

## Suggested integration order

Order is driven by contracts and risk rather than completion time:

1. Agent B — learning platform/events/capability registry;
2. Agent C — Reading engine;
3. Agent D — Writing/revision engine;
4. Agent F — Professional mission descriptors/adapters;
5. Agent E — Practice composer/session shell;
6. Agent G — experience/motion/accessibility refinements;
7. Agent-A integration-only wiring/shared-file changes.

This order does not block development: all agents develop against the frozen shared contract and fixtures.

## Conflict policy

Never resolve conflicts using whole-file `ours`/`theirs` assumptions where protected behavior exists.

For every material conflict, document:

- behavior from current integration candidate;
- behavior intended by feature package;
- protected invariants involved;
- chosen combined behavior;
- test proving it.

## Feature flags

Incomplete or not-yet-user-approved learning capabilities remain behind explicit feature flags or non-default routes when feasible. A flag is not a substitute for tests, auth or entitlement.

## Dependency policy

Prefer existing dependencies and platform capabilities. A new dependency requires justification in the research artifact and Agent-A review. New native dependencies require explicit user approval before introduction.

## Production firewall

Wave-1 integration happens entirely in Git/GitHub/build/test environments. The live server is not used as a development or integration test target.

No source acceptance, draft PR, integration branch or green CI run authorizes:

- server checkout changes;
- container rebuild/restart;
- database/state migration;
- live feature flag changes;
- OTA/mobile release;
- DNS/secrets changes.

## Promotion boundary

After Agent-A integration testing and user acceptance, a separate production-promotion decision may be made under `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`.

The production step must use one exact tested source commit and one immutable artifact with proven source identity and rollback preservation.
