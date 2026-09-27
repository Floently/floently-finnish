# Roleplay pool isolation and rotation research — 2026-09-27

## Research gate

`RESEARCH_GATE=PASS`

Branch: `feature/build47-roleplay-pool-isolation-20260927`  
Base: green Practice Phase 4 head `9f9e87774e3c9c7839f8825806c061b249dcfbf4`

## Product problem

Issue #2 requires Roleplay to stop choosing content from profession-only buckets or translated labels. Everyday, Workplace, YKI, Professional and Interview are different communicative contexts and must therefore have explicit, non-localized runtime identities and separate scenario pools.

Current source still violates that contract:
- the backend registry is keyed only by profession;
- general Everyday and Workplace scenarios live in the same bucket;
- `_default_scenario_for_profession(..., context_label)` uses translated display text to infer Interview;
- explicit scenario IDs are accepted from the global registry without validating the requested mode/profession;
- the client performs an additional profession-only rotation, so scenario authority is split between client and server;
- session-start responses do not report the selected mode, eligible pool or selection reason.

## External evidence

### Council of Europe — CEFR / action-oriented approach

Sources:
- https://www.coe.int/en/web/common-european-framework-reference-languages/action-orientation-in-the-classroom
- https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-
- https://www.coe.int/en/web/common-european-framework-reference-languages/the-user/learners-as-a-social-agent
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom

Accessed: 2026-09-27.

Findings:
- CEFR treats language use as action in meaningful communicative tasks rather than decontextualized sentence production.
- CEFR explicitly distinguishes domains of language use, including personal/public and professional contexts.
- Selected descriptors can structure a series of activities and make objectives transparent to learners.
- Learners should act as social agents pursuing different goals in different contexts.

Implementation decisions:
- context is part of the scenario identity, not cosmetic display metadata;
- Everyday, Workplace, YKI, Professional and Interview must be explicit runtime modes;
- a scenario belongs to one mode by default;
- CEFR level changes complexity inside the same scenario family rather than moving learners between unrelated domains.

### Task repetition and L2 oral performance — System (2025)

Source:
- https://www.sciencedirect.com/science/article/pii/S0346251X25002787
- DOI: 10.1016/j.system.2025.103868

Accessed: 2026-09-27.

Finding:
- the 2025 meta-analysis reports benefits from task repetition for L2 oral performance, with effects moderated by task type and repetition design.

Implementation decision:
- repetition remains available deliberately through Replay;
- ordinary new sessions should rotate through unused scenarios before recycling the pool;
- rotation must not prevent intentional same-scenario practice.

## Runtime contract

1. Add explicit `roleplay_mode`: `everyday | workplace | yki | professional | interview`.
2. Store mode on every ScenarioSpec and derive one canonical pool from the registry.
3. Validate an explicit `scenario_id` against both requested mode and profession.
4. Server owns ordinary scenario selection and per-user/mode rotation.
5. Persist recent scenario progress in existing state storage; no schema/database migration.
6. Exhaust unused pool entries before recycling; avoid immediate repeat when alternatives exist.
7. Never inspect `context_label` to select content. It may remain display metadata only.
8. Return `roleplayMode`, `scenarioPool`, and `selectionReason` from session start.
9. Preserve Replay by allowing an explicit valid scenario ID.
10. Preserve CEFR-specific line variants, voice/persona identity, ownership, AI fallback, evaluation and existing session IDs.

## Migration boundary

The existing client-side scenario rotator remains temporarily readable for compatibility, but the mounted Roleplay start path will stop using it once the server becomes authoritative. The backend pool contract is the source of truth.

## Acceptance criteria

- ordinary session start supplies a non-localized roleplay mode;
- missing/unknown modes fail closed in the new mounted client/server contract;
- no scenario ID is present in more than one mode pool unless explicitly allow-listed;
- general Everyday, Workplace and YKI pools are isolated;
- professional scenarios cannot be selected from general modes;
- interview scenarios cannot be selected from ordinary professional mode;
- ten sequential starts do not repeat while unused pool entries remain, where pool size permits;
- the first selection after pool recycle does not immediately repeat the previous scenario when an alternative exists;
- explicit Replay can request the same valid scenario again;
- an explicit scenario from the wrong mode/profession is rejected;
- `context_label` has no effect on scenario selection;
- session-start diagnostics expose mode, pool and selection reason;
- reload/continuation keeps the same selected scenario and deterministic dialogue variant;
- existing roleplay audio, evaluation, ownership and release regression gates remain green.

## Safety

No production deployment, OTA publication, App Store/TestFlight action, native dependency, billing/auth mutation or database migration is part of this branch.

`PRODUCTION_ACTIONS=NONE`
