# KieliValmis Durable Learner Events Research — 2026-10-03

Status: implementation research for the additive learner-event persistence/API slice.

## Current-source findings

### Existing contract authority

The repository already defines a cross-feature `learning.v1` contract in:

- `packages/core/schemas/learning.ts`
- `apps/backend/app/services/learning_platform/models.py`

The backend service already defines:

- `LearnerEvent`
- `LearnerEventService`
- `LearnerIdentity`
- deterministic `SkillEvidence`
- idempotency and ownership errors.

Decision:

**Do not create a second learner-event semantic model. Extend the existing learning-platform package.**

### Current persistence gap

`apps/backend/app/services/learning_platform/repositories.py` currently provides:

- an in-memory repository for tests/pure service use;
- a JSON-file repository explicitly documented as non-production.

The application already has SQLAlchemy AsyncSession infrastructure in:

- `apps/backend/app/db/database.py`

and durable product/auth models in:

- `apps/backend/app/db/models.py`.

Decision:

**Add an async SQLAlchemy learner-event repository using the application's existing database/session infrastructure.**

### Auth ownership

`apps/backend/app/core/auth_dependencies.py::get_current_user` returns the canonical authenticated SQL `User`.

`canonical_identity_from_user` intentionally accepts only `user.id`.

Decision:

**Every learner-event HTTP operation must derive learner ownership from the authenticated database user and must reject a mismatched client `learnerId`.**

### API envelope

Current v1 API routes use:

- `success_payload`
- `AppError`
- request IDs from `get_request_id()`.

Decision:

**The new endpoint follows the existing v1 response envelope rather than inventing a new response format.**

## External primary-source checks

Accessed 2026-10-03:

- SQLAlchemy 2.0 Session Basics:
  https://docs.sqlalchemy.org/en/20/orm/session_basics.html
- SQLAlchemy asyncio:
  https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- FastAPI dependencies:
  https://fastapi.tiangolo.com/tutorial/dependencies/

Relevant decisions:

- one request/task uses its own AsyncSession supplied by the existing FastAPI dependency;
- the repository does not share one AsyncSession across concurrent tasks;
- transactions commit or roll back explicitly;
- FastAPI dependency injection remains the route-level owner of authenticated user and database session lifetime.

## Acceptance criteria

1. A real authenticated learner can append a valid `learning.v1` event.
2. The event survives a new SQL session/repository instance.
3. Re-sending the same learner/event id and identical payload is idempotent.
4. Reusing the same learner/event id with different content is rejected.
5. One user cannot write/read another learner's namespace.
6. Event listing is owner-scoped and bounded.
7. Pathway/skill/since filtering remains deterministic.
8. Skill evidence is derived from the canonical stored event.
9. No Expo UI file is changed.
10. No production migration/deployment is run by this branch.

## Production integration requirement

The source model is additive, but production has `ALLOW_ORM_CREATE_ALL=false`.

Therefore production activation still requires an explicitly reviewed database migration/DDL step creating the learner-event table before the new API is used in production.

This branch does **not** run that migration.
