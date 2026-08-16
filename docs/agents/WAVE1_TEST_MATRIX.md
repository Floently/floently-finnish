# KieliValmis Wave 1 Test Matrix

Status: MANDATORY
Date: 2026-08-16

## Principle

Wave-1 quality uses three independent verification layers before any server introduction is even considered:

1. **Agent verification** — feature owner tests its own branch repeatedly.
2. **Agent-A verification** — Agent A independently reviews/retests the exact feature SHA and later the combined integration candidate.
3. **User acceptance** — the user manually exercises the candidate in an explicitly non-production/safe environment before any production promotion decision.

None of these layers authorizes deployment by itself.

## Layer 1 — feature-agent verification

Every Agent B–G must run:

### During implementation

- focused unit/contract tests after each meaningful behavioral change;
- TypeScript/Python compile/type checks for touched code;
- lint for touched code where a working protected lint path exists;
- targeted source-contract/regression verifier;
- at least one negative/failure-path test for each new boundary;
- accessibility/reduced-motion checks for UI/motion work;
- deterministic-repeat test for composer/selection logic;
- no-network/local fixtures for logic tests where practical.

### Before handoff

The agent reruns the full feature-specific suite from a clean exact branch head and records commands/results in its handoff.

Required handoff markers:

- `RESEARCH_GATE=PASS`
- `FEATURE_TESTS=PASS`
- `NEGATIVE_PATH_TESTS=PASS`
- `REGRESSION_GUARDS=PASS`
- `SELF_DIFF_REVIEW=PASS`
- `PRODUCTION_ACTIONS=NONE`

If a generic CI job fails because of known baseline debt, the agent must document the exact inherited failure and still prove its protected/feature-specific checks. It may not hide the failure by weakening CI.

## Layer 2 — Agent-A independent verification

Agent A must not rely only on the feature owner's report.

For each feature SHA Agent A independently verifies:

- branch starts from the immutable Wave-1 shared base;
- changed paths match ownership scope;
- no server/deployment/secrets/native-build changes slipped in;
- research artifact predates/substantiates the design;
- contract compatibility;
- maintainability and duplication review;
- feature tests rerun at exact SHA;
- protected invariants relevant to touched surfaces;
- negative/fallback behavior;
- cross-agent integration requirements.

Agent A records one of:

- `AGENT_A_REVIEW=ACCEPT_SOURCE`
- `AGENT_A_REVIEW=CHANGES_REQUIRED`
- `AGENT_A_REVIEW=REJECT_SCOPE`

Accepted branches are not merged into each other. Agent A replays reviewed changes onto a fresh forward integration candidate in a controlled order.

## Integration candidate verification

After selected work is replayed, Agent A must verify at least:

### Source/integration

- production/canonical ancestry relationship is explicitly proven before any promotion stage;
- changed-file provenance is understood;
- no wholesale old snapshots/folders;
- shared-contract changes are intentional/backward compatible;
- all conflict resolutions preserve still-valid protected capabilities.

### Client

- TypeScript;
- protected lint path(s);
- navigation invariants;
- KieliValmis branding;
- Cards compatibility;
- Roleplay audio/navigation compatibility;
- YKI client contracts;
- Reading/Writing/Practice/Professional feature suites;
- reduced-motion/accessibility contract checks;
- Android/iOS/web manual smoke plan.

### Backend

- compile checks for touched modules;
- targeted pytest/verifiers;
- auth/session ownership invariants;
- subscription/access invariants where touched;
- Roleplay ownership/voice gates;
- YKI evaluation/recovery gates;
- Cards/material invariants where touched;
- learner-event isolation/durability tests when implemented.

### Product behavior

- Practice never schedules unavailable/unauthorized/wrong-profession tasks;
- Practice never fabricates personalized weakness/overdue explanations;
- YKI practice/mock/full-exam boundaries remain explicit;
- Reading/Writing ordinary learning does not hijack separate `/read` or other product surfaces;
- Professional missions consume canonical task owners rather than duplicated engines;
- no distracting looping animation in focus/recording states.

## Layer 3 — user acceptance

Before any production introduction, provide the user an exact immutable candidate build/environment and a scripted acceptance checklist.

User acceptance must include, as applicable:

- Everyday navigation and learning entry points;
- Professional entry points and profession correctness;
- Practice 5/10/20-minute flows;
- `Why these tasks?` truthfulness;
- skip / another task / no-microphone / shorter controls;
- Reading A1/A2/B1/B2 representative tasks;
- Writing draft → feedback → revise → compare flow;
- Professional mission continuity;
- Roleplay same-user continuation and voice identity;
- YKI two-speaker listening and formal exam safety;
- Cards audio/practice unchanged;
- subscription/access behavior;
- reduced-motion behavior;
- Android, iOS and web visual/layout sanity where supported.

User acceptance marker:

`USER_ACCEPTANCE=PASS`

## Production promotion remains separate

Even after all three test layers pass, production promotion remains governed by `ANTI-REGRESSION-001` and requires the release gates, including:

- `PRODUCTION_ANCESTRY_GATE=PASS`
- `PROTECTED_INVARIANT_GATES=PASS`
- `CANDIDATE_ARTIFACT_IDENTITY=PASS`
- `TRACKED_SOURCE_MISSING_OR_DIFFERENT=0`
- `UNEXPLAINED_RUNTIME_SOURCE=0`
- `POST_DEPLOY_CANARY=PASS`

Deployment is a separate deliberate operation. No Wave-1 feature agent performs it.
