# KieliValmis Agent Rules — Wave 1

Status: MANDATORY for Agent A–G work started from Wave 1.

Frozen pre-governance source base: `107985d4dcb26d0c8ef010580e78cc9c61fce922`.

The Agent-A governance branch is the only place allowed to define shared Wave-1 contracts. Agent B–G branches must be created from the final reviewed Agent-A governance SHA, never from another feature agent.

## Production is out of scope

No Wave-1 agent is authorized to deploy, SSH to production, restart services, rebuild or retag production Docker images, run migrations against production, alter live state, publish Expo OTA updates, release mobile binaries, modify production secrets, move `main`, move `integration/canonical-production-20260816`, merge its own PR, or force-push.

A green feature branch is source evidence, **not permission to deploy**.

Every agent must obey `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md` and `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`.

## Required work order

Every agent must perform work in this order:

1. verify exact branch/base/ancestry and clean worktree;
2. read Wave-1 rules, branch matrix, protected capabilities, shared contract and test matrix;
3. inspect current implementation before proposing replacements;
4. perform current research before implementation;
5. write `docs/agents/research/AGENT_<LETTER>_RESEARCH.md` on its branch;
6. derive explicit acceptance criteria from the research;
7. implement the smallest maintainable solution that satisfies the acceptance criteria;
8. add permanent regression/contract tests;
9. run focused tests repeatedly during development;
10. run the agent's full required test matrix before handoff;
11. inspect its own diff for scope creep, duplication, dead code, secrets and accidental protected-file changes;
12. commit coherent units, push only its assigned branch, and keep its PR draft;
13. hand off exact SHA, changed paths, tests, research sources, known risks, integration requirements and manual-test instructions to Agent A.

## Required handoff markers

Every feature-agent handoff must explicitly report:

- `RESEARCH_GATE=PASS`
- `FEATURE_TESTS=PASS`
- `NEGATIVE_PATH_TESTS=PASS`
- `REGRESSION_GUARDS=PASS`
- `SELF_DIFF_REVIEW=PASS`
- `PRODUCTION_ACTIONS=NONE`

A missing or failed marker means Agent A does not accept the source package.

## Research rule

Research is mandatory, not decorative. Prefer primary/authoritative sources for platform/API facts and high-quality peer-reviewed/systematic evidence for learning design. Record URLs, access date, finding, decision influenced and rejected alternatives. Do not copy proprietary course/book content or licensed assessment material.

## Quality rule

Code must be clean, simple, typed where appropriate, testable, accessible, maintainable and consistent with existing KieliValmis architecture. Avoid speculative abstractions, duplicate engines, hidden global state, random adaptive claims, unnecessary dependencies and broad rewrites.

User experience must be attractive because it is clear, coherent and responsive—not because it is noisy. Every visual/motion element must Teach, Orient, Respond or Reward. Respect reduced-motion settings. Never use decorative looping motion behind Reading, Writing or microphone recording.

## Stop conditions

Stop implementation and report to Agent A if any of these occur:

- branch ancestry differs from the assigned base;
- required work would touch production/server operations;
- ownership overlaps another agent's protected area and cannot be solved through the frozen contract;
- an auth, entitlement, billing, YKI exam, Roleplay ownership/voice, Cards or navigation invariant would need to be weakened;
- current source contradicts the task assumptions materially;
- a new native dependency or schema/data migration appears necessary but is not explicitly approved;
- a test failure indicates a pre-existing baseline problem that would be hidden by the proposed change.

Do not bypass a stop condition by deleting tests, weakening assertions, skipping CI, disabling safety checks or taking one side of a merge conflict wholesale.
