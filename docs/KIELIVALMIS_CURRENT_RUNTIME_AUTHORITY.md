# KieliValmis Current Runtime Authority Map

Established: 2026-08-15

Current source checkpoint:

`8cb166170d271b24541603ca9ab509b8b1c0e17b`

Parent planning checkpoint:

`docs/KIELIVALMIS_COMBINED_IMPLEMENTATION_PLAN.md`

Source-precedence policy:

`docs/KIELIVALMIS_SYNTHESIS_SOURCE_AUTHORITY.md`

---

# 1. Purpose

This document records the runtime authorities proven from the current source
tree after Phase 0.

It replaces historical assumptions about which frontend, backend, material,
navigation, persistence, and API stacks are active.

This document records current ownership.

It does not authorize deletion.

It also records compatibility/shadow layers and the evidence required before
they can be retired.

---

# 2. Frontend URL authority

## Canonical URL entry mechanism

Authority:

`apps/client/app/**`

Expo Router route files define browser/native URL entries.

Examples include:

- `/`
- `/learn`
- `/professional`
- `/speaking`
- `/yki-practice`
- `/yki-exam`
- `/progress`
- `/settings`
- `/billing/subscription`
- `/read/*`
- `/create/*`

The existence of an AppShell screen name alone does not create an Expo URL.

---

# 3. KieliValmis Learn navigation authority

Primary orchestration authority:

`apps/client/state/AppShell.tsx`

Path/stack contract:

`apps/client/state/navigationModel.ts`

Current AppShell-managed product surfaces include:

- Home
- Everyday / Learning
- YKI Practice
- YKI Exam
- Professional Finnish
- Speaking
- Progress
- Settings
- Help
- Billing
- daily-practice compatibility state

AppShell currently performs:

- auth/session-aware route resolution;
- entitlement checks;
- persisted navigation restoration;
- URL replacement for AppShell-managed routes;
- learning/YKI runtime restoration;
- screen rendering;
- navigation-state persistence.

---

# 4. Help authority and defect

Capability authority:

`apps/client/state/HelpRoute.tsx`

Navigation contract:

`navigationModel.ts` maps:

`help -> /help`

Current defect:

There is no Expo `/help` route entry.

Therefore:

- Help is an active capability;
- `/help` is a declared path;
- direct browser refresh/deep linking cannot currently enter Help through an
  Expo route file.

Required Phase 1 repair:

Create one canonical Expo Help entry that delegates to the existing AppShell
Help implementation.

Do not create another Help implementation.

---

# 5. Read authority

Public product entry:

`apps/client/app/read/index.tsx`

Auth entry:

`apps/client/app/read/auth.tsx`

Protected native Read routes:

- `/read/app`
- `/read/import`
- `/read/library`
- `/read/reader`
- `/read/settings`
- `/read/analytics`
- `/read/subscribe`

Native Read implementation authority:

`apps/client/features/read/mobile/**`

Read service boundary includes:

- Read-specific screens/state;
- external Render Read API;
- Read TTS integration;
- RevenueCat/store Read access.

## Current direct-route guard

Current guard:

`apps/client/features/read/mobile/ReadProtectedRoute.tsx`

The guard currently proves only:

- auth hydration;
- presence of an auth token.

It does not prove:

`readAccess`

Therefore direct Read content routes currently have weaker access enforcement
than AppShell's Read entitlement logic.

## Subscription exception

`/read/subscribe` is itself the Read purchase/restore surface.

An unentitled authenticated learner must be able to reach the subscription
surface.

Therefore Phase 1 must not blindly add one entitlement requirement to every
route wrapped by `ReadProtectedRoute`.

The final route contract must distinguish:

- authentication-required Read routes;
- Read-entitlement-required content routes;
- the authenticated subscription/acquisition route.

---

# 6. Create authority

Public product entry:

`apps/client/app/create/index.tsx`

Auth entry:

`apps/client/app/create/auth.tsx`

Protected Studio entry:

`apps/client/app/create/studio.tsx`

Native Create implementation authority:

`apps/client/features/create/mobile/**`

Current Create Studio state:

pre-launch / coming soon.

Current guard:

`apps/client/features/create/mobile/CreateProtectedRoute.tsx`

The guard currently proves authentication only.

It does not enforce:

`createAccess`

Create entitlement semantics must remain explicit before Studio launch.

---

# 7. AppShell Read/Create compatibility discrepancy

`GuardedScreen` and `RequestedScreen` include:

- `read`
- `create`

`SCREEN_PATHS` maps them to:

- `/read`
- `/create`

AppShell also contains product entitlement logic for:

- `readAccess`
- `createAccess`

However:

- `isFeatureEntryScreen()` does not include Read/Create;
- `isSecondaryScreen()` does not include Read/Create;
- the current AppShell render branches do not render a Read or Create product
  shell.

Current product routes instead enter Read/Create directly through Expo route
files.

Classification:

DECLARED APPSHELL COMPATIBILITY CONTRACT - NOT CURRENT PRODUCT RENDER AUTHORITY

Required Phase 1 decision:

Choose one deliberate navigation architecture.

Preferred direction:

- Expo routes remain the product-boundary authority for Read/Create;
- AppShell must not pretend to own Read/Create rendering if it does not;
- shared product-gateway navigation may route to the product Expo roots;
- persisted AppShell state must not resolve Read/Create through a Learn/YKI
  fallback.

Retirement condition:

Read/Create may be removed from AppShell-specific persisted-screen handling
only after all gateway, deep-link, navigation restoration, and entitlement
consumers are proven safe.

---

# 8. Shared API transport authority

## Governed Learn API client

Primary token and governed-contract authority:

`packages/core/api/apiClient.ts`

Responsibilities include:

- current auth token;
- API base URL usage;
- device headers;
- governed API envelope validation;
- contract/version checking;
- contract violation recording;
- audit-trail recording.

This is the canonical source of:

`getAuthToken()` / `setAuthToken()`

---

## Lightweight API wrapper

Secondary transport abstraction:

`packages/core/api/client.ts`

It:

- reuses `getAuthToken()` from `apiClient.ts`;
- reuses the same API base URL;
- injects device headers;
- exposes `apiClient`, `getData`, `postData`, and `withFallback`.

It is therefore not a separate auth/token authority.

However, it has different response/error/fallback semantics.

Classification:

SHARED-TOKEN COMPATIBILITY/CONVENIENCE TRANSPORT

Required later decision:

Either:

1. explicitly retain it as a documented lightweight transport layer for
   endpoints that do not use the governed envelope;

or:

2. migrate its consumers to one canonical request abstraction.

Do not delete it while active consumers such as roleplay depend on it.

---

## Specialized transports

Some operations correctly require specialized transport behavior, including:

- multipart/audio upload;
- binary TTS/audio retrieval;
- external Read Render API communication.

These do not have to be forced through a JSON-only client merely to achieve
visual architectural uniformity.

They must still share correct authentication and error policy.

---

# 9. Backend HTTP composition authority

Application authority:

`apps/backend/main.py`

Current root composition:

`main.py`
-> imports `app.router`
-> `app.include_router(api_router)`

Mounted router composition authority:

`apps/backend/app/router.py`

Current mounted families include:

- health;
- learning;
- YKI practice;
- YKI exam overview/mock;
- professional;
- speaking;
- auth;
- authenticated YKI session API;
- voice;
- roleplay;
- subscriptions;
- payments;
- cards;
- card audio;
- devices.

Historical `apps/backend/api/**` architecture is not present in the current
tree and is not a current authority.

---

# 10. Unmounted backend router files

The current `apps/backend/app/routers/` directory also contains files such as:

- `admin.py`
- `admin_yki.py`

They are not mounted by the current root router shown above.

Classification:

UNMOUNTED / INTERNAL CANDIDATE - NOT DELETION AUTHORIZED

Before deletion or promotion:

- inspect direct imports;
- inspect scripts/tests/admin tooling;
- inspect operational use;
- prove unique capability.

---

# 11. Card HTTP/runtime authority

Mounted HTTP authority:

`apps/backend/app/routers/v1_cards.py`

Service authority:

`apps/backend/app/services/cards_service.py`

Runtime behavior authority:

`apps/backend/app/runtime/cards_logic.py`

Material loader:

`apps/backend/app/runtime/cards_material_bank.py`

Current active flow:

`/cards/*`
-> `v1_cards.py`
-> `CardsService`
-> `cards_logic.py`
-> `cards_material_bank.py`

---

# 12. Card material authority

Primary material directory:

`apps/backend/card_bank/canonical_bank/validated`

The loader currently defines:

`PUBLISHED_DIR = CARD_BANK_CANONICAL_DIR / "validated"`

There is also a secondary loader input:

`apps/backend/card_bank/canonical_bank/reports/accepted_items.jsonl`

Current checkpoint evidence:

`accepted_items.jsonl` exists but is empty.

Therefore the effective current runtime material is the validated canonical
bank.

## Latent dual-source behavior

`_iter_canonical_items()` processes:

1. validated JSON;
2. accepted-items JSONL.

`load_authority_cards()` stores material by card ID.

Because accepted-items rows are processed second, a future accepted-items row
with the same ID would replace the validated row in the runtime dictionary.

Classification:

CURRENTLY SINGLE EFFECTIVE SOURCE WITH LATENT SECONDARY OVERRIDE PATH

Required improvement:

Make the runtime material-source contract explicit.

Either:

- remove the obsolete secondary source after proof;

or:

- define exactly when it may contain data, its precedence, validation gate,
  provenance, and publication lifecycle.

Do not allow an accidentally repopulated report file to silently become a
second publication authority.

---

# 13. Additional app/cards architecture

The repository also contains:

`apps/backend/app/cards/**`

including:

- SQLAlchemy-backed adaptive state;
- publication repositories;
- card session repositories;
- a newer runtime API router;
- card/audio support.

The root `app/router.py` does not mount
`app.cards.runtime.api.router` as the active card HTTP API.

However, parts of `app/cards/**` are consumed by active code; for example,
card-audio logic uses card repositories.

Classification:

PARTIALLY ACTIVE SUPPORT ARCHITECTURE - NOT WHOLESALE SHADOW CODE

Do not quarantine/delete this tree based on old reports.

Any convergence must be file-level and current-consumer-based.

---

# 14. YKI Practice authority

Mounted route:

`apps/backend/app/routers/yki_practice.py`

Prefix:

`/api/v1/yki-practice`

Current practice material:

embedded certified practice pools.

Current session state:

module-level `_PRACTICE_SESSIONS`.

Classification:

ACTIVE PRACTICE AUTHORITY WITH PROCESS-LOCAL SESSION STATE

The practice route is separate from the formal YKI exam-session engine.

Required later improvement:

Decide the required durability contract for practice sessions.

If learner-facing resume is expected across backend restart/deployment, the
current process-local session state is insufficient.

---

# 15. YKI exam-selection/material authority

Mounted route:

`apps/backend/app/routers/yki_exam.py`

Prefix:

`/api/v1/yki-exam`

Responsibilities include:

- overview;
- level-banded certified material summary;
- mock-cycle entry.

It identifies its material authority as:

`engine_v3_2_certified`

This is not the same API as the authenticated formal exam-session runtime.

---

# 16. Formal YKI session authority

Mounted authenticated HTTP API:

`apps/backend/app/routers/v1_yki.py`

Service:

`apps/backend/app/services/yki_service.py`

Session/runtime bridge:

`apps/backend/app/runtime/yki.py`

Engine adapter:

`apps/backend/app/adapters/yki_engine_adapter.py`

Root engine:

`engine/**`

Current flow:

`/api/v1/yki/sessions/*`
-> authenticated user
-> subscription feature requirement
-> `yki_service`
-> stored user/session bridge
-> YKI engine request
-> local fallback when applicable.

Capabilities include:

- objective answers;
- writing;
- audio;
- speaking;
- conversation turns;
- submission;
- certificate retrieval.

Classification:

ACTIVE FORMAL YKI EXAM AUTHORITY

Do not replace this with the simpler `/api/v1/yki-exam` overview route.

---

# 17. Roleplay authority

Mounted HTTP authority:

`apps/backend/app/routers/v1_roleplay.py`

Runtime:

`apps/backend/app/runtime/roleplay.py`

AI reply generation:

`apps/backend/app/services/roleplay_ai_service.py`

The mounted API currently:

- authenticates the caller;
- checks workplace entitlement;
- exposes scenarios;
- starts sessions;
- submits turns;
- finishes sessions.

The runtime contains:

- scenario/profession selection;
- level-aware variants;
- deterministic variation;
- Finnish personas;
- AI reply generation;
- feedback/review;
- state storage.

---

# 18. Roleplay authenticated-session ownership defect

The HTTP router knows the authenticated user.

At session start it passes a user-derived value only as:

`rotation_user_key`

The public runtime wrapper functions used by the router currently call their
internal session functions with:

`user_id="preview"`

for start/turn/finish access.

Therefore the stored roleplay session is not bound to the authenticated
learner identity that called the HTTP API.

Classification:

ACTIVE OBJECT-OWNERSHIP DEFECT

The route still requires authentication and workplace entitlement, so this is
not equivalent to a public unauthenticated endpoint.

However, object ownership must not depend only on possession of a session ID.

Required Phase 1 repair:

- pass authenticated learner identity into roleplay runtime session creation;
- store that identity on the session;
- require the same authenticated learner for turn and finish operations;
- preserve that same-user check in internal session load/review helpers used by
  those flows;
- reject cross-user session access;
- preserve deterministic rotation separately from authorization identity;
- add explicit cross-account regression tests.

This must be fixed before later adaptive roleplay/event work builds on the
session model.

---

# 19. Voice authority

Mounted HTTP authority:

`apps/backend/app/routers/v1_voice.py`

Service authority:

`apps/backend/app/services/voice_service.py`

Runtime/audio references:

`apps/backend/app/runtime/voice.py`

TTS providers/runtime:

`apps/backend/app/services/tts/**`

Current responsibilities include:

- STT;
- TTS;
- pronunciation analysis;
- provider fallback/health;
- voice registry;
- audio references.

Historical STT-outage reports are not current authority.

Current code includes OpenAI/Google STT fallback and explicit hallucination
guards.

---

# 20. Persistence authorities

Persistence is currently split by concern.

## Authentication/user records

Primary durable user repository:

`apps/backend/app/db/auth_repository.py`

Database infrastructure:

`apps/backend/app/db/database.py`

---

## Runtime state snapshot store

Authority:

`apps/backend/app/core/state_store.py`

`STORE` is an in-memory structure with snapshot persistence.

Current users include:

- auth/session tokens;
- roleplay sessions;
- YKI session bridges;
- voice references;
- devices;
- some card issue/runtime state;
- roleplay mission state.

This is not interchangeable with SQLAlchemy persistence.

---

## SQLAlchemy-backed operational persistence

Current SQL-backed repositories include:

- audio asset repository;
- card publication datasets;
- adaptive card state;
- card session repositories;
- auth users.

Some of these belong to support architectures that are not themselves mounted
as the primary HTTP runtime.

---

# 21. LearningRepository authority and blocker

File:

`apps/backend/app/services/learning/repository.py`

Current implementation holds:

- learning units;
- progress;
- Phrase Bank

inside one module-level `LearningRepository`.

Its mutable state is plain process memory:

- `progress: dict[...]`
- `phrase_bank: dict[...]`

It has:

- no authenticated learner key;
- no durable database persistence;
- no account isolation.

Classification:

ACTIVE LEGACY LEARNING REPOSITORY - UNSUITABLE FOR PERSONALIZED PRODUCT TRUTH

It must not become the foundation for:

- real Progress;
- Phrase Bank exposure;
- Revision Vault;
- Confidence;
- Planner;
- learner-specific recommendations.

Phase 2's learner-event and durable learner-data architecture must replace or
properly adapt this role.

---

# 22. Known compatibility layers and retirement conditions

## daily-practice

Current status:

persisted-navigation compatibility alias mapping to `/learn`.

Retire only after old persisted/deep-link state is proven safe.

---

## Read/Create AppShell screen declarations

Current status:

declared navigation compatibility values but direct Expo product routes are the
actual rendering authority.

Retire or integrate only after one canonical navigation contract is proven.

---

## `packages/core/api/client.ts`

Current status:

active lightweight wrapper sharing token/base configuration with governed
`apiClient.ts`.

Retire only after all consumers are migrated or its distinct contract is
explicitly retained.

---

## accepted-items card source

Current status:

empty secondary input.

Retire or formalize only after current card generation/publication tooling is
proven not to require it.

---

## unmounted card runtime API

Current status:

its HTTP router is not root-mounted, but surrounding card repositories/services
have active consumers.

Never delete the whole architecture merely because that one router is
unmounted.

---

# 23. Current Phase 1 repair order derived from this map

The smallest safe dependency order is:

1. fix `/help` Expo route contract;
2. canonicalize AppShell handling of Read/Create navigation;
3. design Read auth-only versus entitlement-required direct-route guards;
4. enforce Read content entitlement without blocking `/read/subscribe`;
5. enforce the intended Create Studio entitlement contract;
6. bind roleplay sessions to the authenticated learner;
7. add navigation/access/object-ownership regression tests;
8. reconcile multi-product architecture documentation.

Card material-source cleanup is recorded but should not distract from this
navigation/access package unless it blocks current tests.

YKI practice durability is recorded for the YKI implementation phase.

---

# 24. Workstream 1A exit assessment

The current-tree authority audit establishes:

- frontend URL owner;
- Learn AppShell owner;
- Read/Create product route owners;
- API token/transport layers;
- backend mounted composition;
- active card runtime;
- card material inputs;
- YKI practice/exam authorities;
- roleplay/voice authorities;
- current persistence authorities;
- known compatibility layers;
- retirement criteria for ambiguous layers.

Therefore:

`KV-ARCH-001` may be marked DONE after this document is committed.

This does NOT mean Phase 1 is complete.

It means Workstream 1A has established the current authority baseline required
for the Phase 1 implementation packages.

---

# 25. Safety

This authority map authorizes:

- documentation;
- targeted Phase 1 repairs;
- targeted tests.

It does not authorize:

- bulk deletion;
- backend quarantine;
- card-bank migration;
- blocked-feature exposure;
- production deployment.
