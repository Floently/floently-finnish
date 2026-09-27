# Agent B Research — Learning Platform, Capability Registry, and Learner Events

Date: 2026-08-16
Agent: B
Branch: `agent/b-learning-platform-events-20260816`
Immutable Wave-1 base: `69813b433838130d5afe4b052360dbfd12df3f40`

## Questions investigated

1. Where does KieliValmis obtain the canonical authenticated learner identity, and which value is safe to use for learner-data ownership?
2. What learner/persistence state exists today, and what survives process restart?
3. How should duplicate learner-event writes behave so retries are idempotent without silently accepting conflicting payloads?
4. How should cross-account access fail closed?
5. What learner-event data is necessary, and what should be excluded under data-minimization principles?
6. How should event/content provenance survive later content changes?
7. Can Wave 1 add durable production learner-event persistence without a production schema migration?
8. How should TaskCapability availability, health, and feature flags be made deterministic for future Practice filtering?
9. Which learner actions justify normalized SkillEvidence, and which events must not be promoted into stronger learning claims?
10. How can this foundation remain compatible with the frozen TypeScript contract while avoiding edits to protected auth/navigation/YKI/Roleplay/Cards code?

## Existing repository evidence

### Canonical identity

- `apps/backend/app/core/auth_dependencies.py` defines protected `get_current_user()`. It decodes the bearer token to a `user_id`, loads `User` with `User.id == user_id`, and fails with HTTP 401 when the token/user is invalid.
- `apps/backend/app/db/models.py` defines `User.id` as the primary key and `User.email` as a separate unique field.
- Therefore new learner records can be owned by the authenticated database `User.id`; email is neither necessary nor appropriate as a new learner ownership key.
- The protected auth helper will not be modified by Agent B. The learning-platform service will accept a small identity value derived from `current_user.id`, enabling Agent A to wire it later without changing this feature package.

### Existing persistence and restart behavior

- `apps/backend/app/db/database.py` uses SQLAlchemy AsyncSession and defaults to SQLite (`sqlite+aiosqlite:///./puhis.db`) when no configured database URL is supplied.
- Existing durable product/auth records are SQLAlchemy models in `apps/backend/app/db/models.py`.
- The current learning service is different: `apps/backend/app/services/learning/repository.py` creates a module-level `LearningRepository()` singleton whose `progress` is an in-memory dictionary keyed only by `unit_id`.
- `apps/backend/app/services/learning/adapter.py` mutates that singleton on result submission. This process-memory state is lost on restart and is not isolated by learner.
- This legacy repository is outside the new Wave-1 shared event contract and will not be broadly rewritten on Agent B's branch.

### Shared Wave-1 contract

- `packages/core/schemas/learning.ts` is frozen and owned by Agent A.
- It defines `TaskCapability`, `LearnerEvent`, and `SkillEvidence` under `LEARNING_CONTRACT_VERSION = 'learning.v1'`.
- `LearnerEvent` already contains canonical provenance fields: `eventId`, `learnerId`, `occurredAt`, `eventKind`, `taskId`, `contentVersion`, `pathway`, `runtime`, `skills`, and `levelBand`.
- `SkillEvidence` requires `sourceEventId`, observed time, skill/level, evidence type, pathway, and optional score/profession.
- The contract explicitly says events are durable observations of actual actions/outcomes and are not inferred from screen visits alone.

### Production constraints

- `.github/AGENTS.md`, `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`, `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`, and all `docs/agents/WAVE1_*` documents prohibit production mutation and require Agent B to avoid protected auth/server/deployment changes.
- Adding a production learner-event SQL table would require a schema migration. Agent B is not authorized to run or introduce production migration work as a deployment action.
- Result: implement a migration-ready repository protocol plus safe memory/file implementations for test/non-production use, and report the durable SQL implementation as an integration requirement.

## External sources and findings

All sources accessed 2026-08-16.

### 1. FastAPI dependency injection

Source: FastAPI — Dependencies
https://fastapi.tiangolo.com/tutorial/dependencies/

Finding: FastAPI dependencies are intended to centralize shared requirements such as authentication, authorization, and database-session provision rather than duplicating those checks inside feature logic.

Decision caused: Agent B will not invent a second token parser or auth path. The platform service will consume a canonical identity derived from the existing protected `get_current_user()` result. HTTP wiring can later inject that identity through the existing dependency chain.

Rejected alternative: parse bearer tokens inside the learner-event service. Rejected because it duplicates protected authentication behavior and increases the risk of identity drift.

### 2. SQLAlchemy uniqueness constraints

Source: SQLAlchemy 2.0 — Defining Constraints and Indexes
https://docs.sqlalchemy.org/en/20/core/constraints.html

Finding: SQLAlchemy supports explicit single/composite `UniqueConstraint` definitions. A durable relational event store can enforce idempotency at the database boundary rather than relying only on process memory.

Decision caused: the future production schema should use an ownership-aware uniqueness invariant such as `(learner_id, event_id)`, with a foreign key from `learner_id` to `users.id`. Agent B will model the same invariant in non-production repositories now.

Rejected alternative: treat duplicate event IDs as ordinary new rows. Rejected because request retry/network replay would create false evidence.

### 3. Python atomic file replacement

Source: Python standard library — `os.replace`
https://docs.python.org/3/library/os.html#os.replace

Finding: on POSIX systems a successful replacement rename is atomic when source and destination are on the same filesystem.

Decision caused: the non-production JSON-file repository will write a complete temporary snapshot, flush/fsync it, and replace the target file rather than rewriting the live file in place. This gives deterministic restart tests without pretending the file adapter is production database infrastructure.

Rejected alternative: direct in-place JSON writes. Rejected because a process interruption can leave a partially written store.

### 4. GDPR data minimisation and privacy by design

Source: Regulation (EU) 2016/679, Articles 5 and 25 (EUR-Lex)
https://eur-lex.europa.eu/eli/reg/2016/679/oj

Finding: personal data should be adequate, relevant, and limited to what is necessary; privacy safeguards and minimisation should be built into processing by default.

Decision caused: the learner-event foundation stores the opaque authenticated user ID required for ownership but adds no email/name field, no access token, and no automatic raw writing/speech transcript capture. It persists only the frozen learning-event fields supplied for a real learning action/outcome.

Rejected alternative: copy email into every learning record for convenience. Rejected because it duplicates personal data, creates identity-change problems, and conflicts with the mission requirement that email never own new learner data.

### 5. Authorization deny-by-default / ownership checking

Source: OWASP Cheat Sheet Series — Authorization Cheat Sheet
https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

Finding: authorization should deny by default, validate permissions on each request, and test authorization logic explicitly.

Decision caused: event reads and writes require a non-empty authenticated learner identity. Repository/service query methods require the requester identity to match the target learner and raise a dedicated ownership error on mismatch. Missing identity never falls back to a demo/global learner.

Rejected alternative: accept `learnerId` from an untrusted request body as the owner. Rejected because callers could write/read another account's evidence by changing one field.

### 6. xAPI immutable statement/idempotency precedent

Sources:
- IEEE xAPI Working Group / IEEE 9274.1.1 context: https://sagroups.ieee.org/9274-1-1/
- ADL xAPI specification communication rules (historical open specification source): https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md

Finding: learning-record systems use stable statement IDs as an idempotency boundary; when an already-known ID is received, the stored record must not be modified, and a conflicting payload should be rejected rather than mutating history.

Decision caused: `(learnerId, eventId)` is immutable. Repeating the exact same event returns the existing event with `inserted=False`; reusing the same ID with a different payload raises an idempotency conflict. This preserves historical meaning and prevents retry duplication.

Rejected alternative: last-write-wins updates to an existing event ID. Rejected because historical evidence would change after the fact.

### 7. CEFR communicative activity categories

Source: Council of Europe — CEFR descriptors / Companion Volume
https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors

Finding: CEFR proficiency evidence is framed through differentiated communicative activities and can-do descriptors rather than one undifferentiated global score.

Decision caused: SkillEvidence remains skill- and level-band-specific exactly as the frozen contract requires. No global mastery/confidence estimate will be inferred by this foundation.

Rejected alternative: collapse any completed event into a global learner proficiency score. Rejected as unsupported and inconsistent with the shared contract's truthfulness requirement.

### 8. Retrieval-practice evidence

Sources:
- Agarwal, Nunes & Blunt (2021), systematic review, Educational Psychology Review. DOI: 10.1007/s10648-021-09595-9
- Yang et al. (2021), systematic/meta-analytic review, Psychological Bulletin. DOI: 10.1037/bul0000309

Finding: retrieval/testing can support learning, but the value depends on the actual learning action and conditions; passive exposure is not equivalent to successful retrieval or production.

Decision caused: event-to-evidence derivation uses conservative action semantics. `task_started`, skipped, and abandoned events produce no SkillEvidence. Completion without a more specific demonstrated action can produce only `exposure`; answer/reading/listening completion maps to `retrieval`; writing/speaking maps to `production`; correction and successful retry map to their explicit evidence types.

Rejected alternative: classify a screen visit or task start as mastery/retrieval evidence. Rejected because it would fabricate learner capability from navigation.

## Implementation decisions

1. Add a dedicated `apps/backend/app/services/learning_platform/` package. Do not modify the legacy process-memory learning repository.
2. Mirror only the frozen `learning.v1` concepts required by Agent B in a Python adapter model; keep `packages/core/schemas/learning.ts` untouched.
3. Add `LearnerIdentity` derived only from authenticated `User.id`; no email ownership field or email fallback.
4. Define `LearnerEventRepository` as a persistence protocol with explicit owner-scoped append/get/list operations.
5. Implement:
   - `InMemoryLearnerEventRepository` for isolated unit tests;
   - `JsonFileLearnerEventRepository` for safe non-production restart/durability tests using atomic replacement.
6. Do not wire the JSON repository into production startup/configuration. Choosing a production repository remains an explicit integration decision.
7. Treat an identical duplicate event as an idempotent no-op; reject conflicting reuse of the same `(learnerId, eventId)`.
8. Preserve `schemaVersion`, `contentVersion`, source `eventId`, timestamps, and scores exactly.
9. Derive SkillEvidence as a deterministic pure function of a LearnerEvent. Evidence IDs are deterministic from source event + skill + evidence type.
10. Build a deterministic TaskCapability registry with sorted output. Duplicate identical capability registration is harmless; conflicting redefinition is rejected.
11. Feature-flag resolution is explicit: unflagged capabilities use configured health; a capability with a flag is unavailable unless the supplied flag state is explicitly true. Registry lookup itself does not perform entitlement/auth checks.
12. Add future-Practice query helpers that return only the authenticated learner's events/evidence and support deterministic filtering by skill/pathway/time without computing fake weakness/mastery.
13. No learner event is emitted by capability listing, registry lookup, or navigation. Events are recorded only through explicit `record_event` calls for actual actions/outcomes.

## Acceptance criteria derived from research

- Same authenticated user can append/read own events.
- Different authenticated user cannot read/write a target learner namespace.
- Missing/blank identity fails closed.
- User email cannot substitute for missing `User.id` and is never persisted as event ownership.
- Exact duplicate `(learnerId, eventId)` is idempotent.
- Conflicting duplicate event ID is rejected without modifying stored history.
- JSON non-production repository survives a new repository instance/restart simulation.
- Content version and schema version are retained byte-for-byte as supplied.
- Event-to-evidence derivation is deterministic and conservative.
- Starts/skips/abandons/navigation-only operations do not create SkillEvidence.
- Capability ordering/health/feature-flag resolution is deterministic.
- Registry/query calls do not create learner events.
- Frozen TypeScript learning contract is not modified.
- No protected auth, entitlement, Roleplay, Cards, YKI, navigation, deployment, Docker, secret, or migration path is changed.

## Alternatives rejected

### Add SQLAlchemy learner-event models now

Rejected for Agent B implementation because a real production table requires a migration and integration review. The interface is intentionally migration-ready, but production DDL belongs to a later controlled integration/migration decision.

### Reuse `TrackingEvent`

Rejected. Product/business telemetry permits nullable `user_id`, includes email/screen fields, and has different semantics. `LearnerEvent` is durable learning evidence with stricter authenticated ownership and content/source provenance; conflating the two would violate the shared contract.

### Reuse the legacy `LearningRepository.progress`

Rejected. It is process-memory only and keyed by unit rather than authenticated learner. Broadly rewriting it would also expand Agent B's scope into the legacy learning engine.

### Make evidence/mastery adaptive now

Rejected. The shared contract requires truthful learner evidence, and this branch does not yet have enough calibrated history to claim weakness, confidence, overdue review, or mastery. Agent B will expose raw normalized evidence only.

## Uncertainties and how tests will contain them

1. **Future production database engine and migration mechanism** — current code can use SQLite or a configured database URL. The persistence protocol avoids backend-specific SQL. Integration must choose the concrete durable schema and migration procedure. Tests enforce repository semantics independent of database choice.
2. **Event ID generation ownership** — the frozen contract provides `eventId` but does not prescribe UUID format. Agent B will validate non-empty stable IDs without inventing a new shared field. Tests focus on idempotency semantics, not one ID format.
3. **Exact Practice ranking queries** — Agent E owns composer behavior. Agent B will expose conservative event/evidence filters, not ranking weights or personalization claims.
4. **Capability flag source** — no new global feature-flag service is introduced. The registry accepts an explicit flag-state mapping so the caller remains the source of truth. Tests cover missing/true/false states deterministically.
5. **Cross-language contract drift** — Python cannot import the TypeScript type at runtime. A regression test will assert the expected `learning.v1` markers/field names remain present in the frozen TypeScript source, and any future contract change must be handled by Agent A.

## Integration requirement

`INTEGRATION_REQUIREMENT`: Agent A must choose/approve the production learner-event persistence implementation. A relational implementation will require a reviewed migration that adds a learner-event table keyed by canonical `users.id`, preserves `content_version`/schema provenance, and enforces an ownership-aware uniqueness constraint such as `(learner_id, event_id)`. Agent B does not run or authorize that migration.

## Research gate

The repository evidence and current primary sources support a minimal, isolated implementation that meets the mission without protected-file edits or production migration.

RESEARCH_GATE=PASS
