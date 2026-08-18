# KieliValmis Agent Rules — Wave 1

Status: MANDATORY for Agent A–G work started from Wave 1.

Frozen pre-governance source base: `107985d4dcb26d0c8ef010580e78cc9c61fce922`.

The Agent-A governance branch is the only place allowed to define shared Wave-1 contracts. Agent B–G branches must be created from the final reviewed Agent-A governance SHA, never from another feature agent.

## Mandatory current handover — READ FIRST

Before **any** continuing Agent-A / Wave-1 integration work, branch mutation, runtime edit, QA construction, UAT replacement, production-planning discussion, or instruction to another engineering agent, the continuing agent must first read:

`docs/agents/CURRENT_WAVE1_HANDOVER.md`

in full.

This handover is the repository-level continuation authority for the current exact SHAs, frozen UAT state, accepted feature-package provenance, deferred work, known CI/provenance debt, protected invariants, current next milestone, and production firewall.

The continuing agent must then re-resolve the current remote PR/branch heads named in that handover before relying on any SHA. Documentation/governance-only commits after a tested runtime SHA must be distinguished from runtime changes; prior exact-SHA QA does not automatically cover a later runtime delta.

If `docs/agents/CURRENT_WAVE1_HANDOVER.md` is missing, materially stale, contradicts current remote ancestry, or cannot be reconciled with PR #33, PR #35 and Issue #16, **STOP** and repair/reconcile the handover before implementation.

When responsibility is handed to another Agent-A/integration owner, update `docs/agents/CURRENT_WAVE1_HANDOVER.md` with the new exact state and leave this read-first rule in place.

## Production is out of scope

No Wave-1 agent is authorized to deploy, SSH to production, restart services, rebuild or retag production Docker images, run migrations against production, alter live state, publish Expo OTA updates, release mobile binaries, modify production secrets, move `main`, move `integration/canonical-production-20260816`, merge its own PR, or force-push.

A green feature branch is source evidence, **not permission to deploy**.

Every agent must obey `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md` and `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`.

## Required work order

Every agent must perform work in this order:

1. read `docs/agents/CURRENT_WAVE1_HANDOVER.md` if continuing Agent-A / Wave-1 integration work;
2. verify exact branch/base/ancestry and clean worktree;
3. read Wave-1 rules, branch matrix, protected capabilities, shared contract and test matrix;
4. inspect current implementation before proposing replacements;
5. perform current research before implementation;
6. write `docs/agents/research/AGENT_<LETTER>_RESEARCH.md` on its branch;
7. derive explicit acceptance criteria from the research;
8. implement the smallest maintainable solution that satisfies the acceptance criteria;
9. add permanent regression/contract tests;
10. run focused tests repeatedly during development;
11. run the agent's full required test matrix before handoff;
12. inspect its own diff for scope creep, duplication, dead code, secrets and accidental protected-file changes;
13. commit coherent units, push only its assigned branch, and keep its PR draft;
14. hand off exact SHA, changed paths, tests, research sources, known risks, integration requirements and manual-test instructions to Agent A.

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

- `docs/agents/CURRENT_WAVE1_HANDOVER.md` is missing, materially stale, or contradicts current remote source/PR ancestry;
- branch ancestry differs from the assigned base;
- required work would touch production/server operations;
- ownership overlaps another agent's protected area and cannot be solved through the frozen contract;
- an auth, entitlement, billing, YKI exam, Roleplay ownership/voice, Cards or navigation invariant would need to be weakened;
- current source contradicts the task assumptions materially;
- a new native dependency or schema/data migration appears necessary but is not explicitly approved;
- a test failure indicates a pre-existing baseline problem that would be hidden by the proposed change.

Do not bypass a stop condition by deleting tests, weakening assertions, skipping CI, disabling safety checks or taking one side of a merge conflict wholesale.
