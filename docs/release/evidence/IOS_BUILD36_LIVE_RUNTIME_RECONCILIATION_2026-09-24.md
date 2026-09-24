# Build 36 — running-backend source reconciliation (2026-09-24)

Status: **SOURCE-LINEAGE COMPARISON COMPLETE; LIVE CONTAINER FILE AUDIT PENDING; PRODUCTION PROMOTION BLOCKED.**

## Independently observed source identities

- Hetzner checkout: `749ffe3669cc1c6184482a735001af769bc71547` (an unrelated untracked domain-static .gitignore remains; preserve it).
- Running container `floently-finnish-backend-1` (ID observed `5eaab23e4edf`; verify anew before deployment).
- Running image `sha256:57b3ab1ef0986c9e0c84253b7b35482cb15db990b04f115dc33024cbca608bcf`.
- Image OCI revision label `0e5dc84fa8dcdb0ea746f404c557d8683ce70b75`.
- Build 36 source candidate reviewed: `9d128763d2a0d78f7c140382d50e0d1dad2e4832`.
- Historical Git merge base between the labelled image revision and the checkout/Build 36 is `413051227ca0025ade593c5221e2f1b124e40c9b`. The label branch adds 13 unique commits; Build 36 does **not** descend from it.
- The legacy production reconciliation ledger explicitly identifies this exact image as **composite with source overlays**. The OCI revision label is therefore a historical reference, **not proof of its exact executable source**.

## Git-blob audit: 15 legacy labelled-image files vs Build 36

This is a Git-versus-Git **source provenance check**, NOT a live-container audit. Git SHA-1 blob equality means exact source bytes match for that file. Group and decisions:

**KEEP — 12 exact matches** (origin `0e5dc84`, candidate Build 36):
- `apps/backend/app/models/api_models.py` — `cde19a28b9fca418016e99988f08ea0883216de3`
- `apps/backend/app/routers/v1_yki.py` — `e0f2ddcbabc5d9b77a0bc9a572923c74fe9c30f4`
- `apps/backend/app/runtime/yki.py` — `8a284e44d363d712f78fb0140636a6504663b7ce`
- `apps/backend/app/runtime/yki_local_fallback.py` — `d10ed3e479d71bd601d9d3e42bc44b033d4fd13d`
- `apps/backend/app/services/yki_service.py` — `aa02bf9de6e66ea5385b3f2fd803b8c58cfb9d11`
- `apps/backend/app/services/roleplay_evaluation_service.py` — `6bcc27ea335a08ee253508d584071d02e26c6a51`
- `apps/backend/app/services/yki_evaluation_service.py` — `4b6fdd1c1f8e22a79488d1b49053bf5895a094b3`
- `apps/backend/scripts/verify_roleplay_ai_evaluation.py` — `9f17f9f0fe8ebe0f4448650a7423098e24782985`
- `apps/backend/scripts/verify_yki_evaluation_regression_recovery.py` — `c97ba05c00bbf45cb2b2a51c0179f5c0dd301bb0`
- `apps/backend/scripts/verify_yki_final_submit_recovery.py` — `c0b0414c1bfc254dc1d1811ff940bb3d5997b521`
- `apps/backend/scripts/verify_yki_local_fallback_evaluation.py` — `ee5d8d17aad6da6f308de6118aa2c6b0dd360aa7`
- `apps/backend/scripts/verify_yki_report_calibration.py` — `416345fa58eb163c048534e185dd0cdd8d7002d0`

**MERGE / intentional strengthening — three nonidentical files**, subject to protected regression and actual-runtime inspection:

1. `apps/backend/app/runtime/roleplay.py` — legacy `e1dfb689354da781b01464745e627c4c363e8980`, Build 36 `dcb87b3763563d1c95d0c84c74c80b7b84a80b91`. Candidate preserves the `evaluate_roleplay_session` completion path while adding explicit role-contract construction, semantic AI reply validation and bounded repair, deterministic counterpart-safe fallback, and ownership/continuity protection. These are not interchangeable entire-file copies; preserve the integrated candidate and run all roleplay protections.
2. `apps/backend/scripts/verify_yki_ai_evaluation.py` — legacy `9f17?` **not used**; exact legacy blob `314e636b4166019dfcafe5d82b83d6e05ef8b9c5`, candidate `697078fdcca9b652fe57a2f4181c73f0993681f1`. The historical verifier expected older YKI report version 1.0; the accepted runtime emits 1.2. Retain the candidate's 1.2 assertion, never downgrade report behavior just to satisfy the stale verifier.
3. `apps/backend/.env.example` — legacy `61fec93b2ec415bdc91c8267567a8bb3b5ec3ed4`, candidate `2e81b342e7b8d611b250b86b97dc641ab1043bca`: adds documented opt-in AI evaluation and professional roleplay-validator settings. It is **configuration documentation**, not a live secret file. Never copy a server `.env` into Git or logs.

## Gates passed on isolated local source

At exact Build 36 `9d128763d2a0d78f7c140382d50e0d1dad2e4832`, user ran full `apps/backend/tests`: **149 passed, 3 deprecation warnings**; client TypeScript `tsc --noEmit`: **exit 0**. Earlier five iOS source invariants PASS; live read-only RevenueCat V1 historic expired sandbox subscription verified. No new webhook delivery, Apple introductory offer, or effective server configuration verified.

## What remains NON-NEGOTIABLE

1. Read-only **running container** inventory, not just Git revision label; compare executable `.py` source in BOTH directions against a candidate (no source missing/different, no unclassified extra runtime source).
2. Account for code from overlays, generated files, mounted persistent state, and image-specific bytes. Do not run tests against production data, print secrets, or change/restart the live backend.
3. Reconcile any runtime-only capability/extra source via KEEP/MERGE/REPLACE/DELETE with evidence and regression tests before release.
4. Prove exact candidate production ancestry under the forward-only policy, or document a controlled reconciled integration on current approved production lineage. The Git candidate currently **does not** descend from the OCI label: `PRODUCTION_ANCESTRY_GATE=NOT_PROVEN`.
5. Pin immutable candidate build and previous rollback image; full source/artifact identity, post-deploy canaries, and explicit promotion approval.
6. Verify authenticated backend user ID is the RevenueCat App User ID (or safely reconciled alias), then secure server-only credentials and real sandbox three-day intro trial; do not install secrets or deploy just because source tests pass.

Reference: `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`, `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`, release issue #43.
