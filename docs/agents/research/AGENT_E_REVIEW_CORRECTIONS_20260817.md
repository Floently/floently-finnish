# Agent E Review Corrections — 2026-08-17

Agent: E
Branch: `agent/e-practice-hub-composer-20260816`
Immutable base: `69813b433838130d5afe4b052360dbfd12df3f40`
Original reviewed SHA: `bd52e1a6fca0bf1ec1eb7e81ff191478ea615cd8`
Director / Agent-A disposition: `CHANGES_REQUIRED`

## Required corrections

1. Normalize Practice entitlement declarations to the owner contract vocabulary instead of local aliases.
2. Add explicit profession-isolation regression tests.
3. Fail closed on duplicate `taskId` identities so candidate order cannot select one content version through `Map` last-write-wins behavior.

## Repository evidence checked before correction

`apps/client/state/subscriptionStore.ts` on the immutable base defines the authoritative compatibility entitlement fields as:

- `learnAccess: boolean`
- `ykiAccess: boolean`
- `professionalAccess: boolean`
- `professions: ProfessionCode[]`

The profession codes are `doctor`, `nurse`, and `practical_nurse`.

The frozen `TaskDescriptor.requiredEntitlements` field is intentionally runtime-neutral (`string[]`). Therefore no frozen-contract change is necessary: Practice can declare owner-aligned keys locally and use `profession:<key>` as the narrow profession entitlement identity.

## Decisions caused by the review

### Entitlement vocabulary

- Everyday descriptors require `learnAccess`.
- YKI descriptors require `ykiAccess`.
- Professional descriptors require both `professionalAccess` and `profession:<exact-profession>`.
- The Practice route converts subscription status to exactly those declaration keys. Internal all-access emits all pathway keys and all three profession keys.
- The composer remains only a scheduling filter; canonical runtime auth/entitlement checks remain authoritative.

### Profession isolation

Professional candidate selection must satisfy both:

1. the descriptor's exact `profession` matches the active/supplied Practice profession; and
2. all required entitlement declarations, including `profession:<key>`, are present.

Regression tests will prove that a nurse entitlement cannot schedule doctor or practical-nurse tasks, even when `professionalAccess` is true.

### Duplicate task identities

A repeated non-empty `taskId` is treated as an ambiguous product-truth failure. Every candidate with that duplicated identity is excluded before ranking. This applies even when the duplicate entries have different `contentVersion` values; Practice must not pick one based on input order.

A local diagnostic code `duplicate_task_id` will make the rejection testable and explainable to integrators without changing the frozen learning contract.

## Alternatives rejected

- Keeping local aliases `learn`, `professional`, `yki`: rejected because they diverge from the owner entitlement vocabulary and can hide integration mistakes.
- Relying only on the descriptor `profession` field without a profession entitlement declaration: rejected because pathway access and profession ownership are separate product-truth dimensions.
- Deduplicating by choosing first or last candidate: rejected because either choice makes content-version selection dependent on candidate ordering and can silently schedule ambiguous content.
- Modifying `packages/core/schemas/learning.ts`: rejected; the existing string entitlement declaration field is sufficient and remains frozen.

## Test additions required

- exact owner-vocabulary entitlement acceptance/rejection;
- professional access without matching `profession:<key>` fails closed;
- nurse/doctor/practical-nurse cross-isolation;
- duplicate same-version `taskId` fails closed;
- duplicate different-version `taskId` fails closed;
- reversing duplicate candidate order produces the same empty selection/duplicate diagnostic outcome;
- all previous deterministic, modality, time, evidence, YKI, summary, accessibility, and no-engine-logic tests continue to pass.

RESEARCH_GATE=PASS
