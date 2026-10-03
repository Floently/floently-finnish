# KieliValmis Learner-Event SQL Handoff

Status: **source implementation only — production activation blocked on reviewed DB migration**

## Added source

- SQLAlchemy learner-event table model
- async SQL repository
- async authenticated ownership service
- protected v1 event/evidence endpoints
- focused persistence/idempotency/ownership/filter tests

## New API surface

All endpoints require the existing Bearer authentication dependency.

- `POST /api/v1/learning/events`
- `GET /api/v1/learning/events`
- `GET /api/v1/learning/events/{event_id}`
- `GET /api/v1/learning/evidence`

The POST payload is the existing canonical `learning.v1` `LearnerEvent`.

The server verifies `learnerId` against the authenticated SQL user id.

## Data table

Logical table:

`learner_events`

It stores:

- owner/event uniqueness;
- queryable time/pathway/runtime/task metadata;
- complete canonical event JSON payload.

The payload is retained so contract fields are not silently lost during persistence.

## Production gate

Production configuration currently has `ALLOW_ORM_CREATE_ALL=false`.

Therefore merging source does not itself authorize production use of this API.

Before deployment:

1. review generated/desired DDL for the target production database;
2. create the additive table/indexes through the approved database-change process;
3. run learner isolation/idempotency smoke tests;
4. only then enable native client event sync.

No production migration, deployment, restart, or live-state modification is performed by this work.
