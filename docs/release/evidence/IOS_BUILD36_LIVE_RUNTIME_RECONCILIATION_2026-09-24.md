# Build 36 — running-backend source reconciliation (2026-09-24)

Status: **LIVE CONTAINER PYTHON-SOURCE RECONCILIATION PASSED AT PINNED MANIFEST; ARTIFACT/ANCESTRY, BILLING AND PRODUCTION PROMOTION BLOCKED.**

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
2. `apps/backend/scripts/verify_yki_ai_evaluation.py` — exact legacy blob `314e636b4166019dfcafe5d82b83d6e05ef8b9c5`, candidate `697078fdcca9b652fe57a2f4181c73f0993681f1`. The historical verifier expected older YKI report version 1.0; the accepted runtime emits 1.2. Retain the candidate's 1.2 assertion, never downgrade report behavior just to satisfy the stale verifier.
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

## 2026-09-24 — actual container Python-source inventory and origin diagnosis

A user-executed **read-only** SHA-256 inventory collected all `*.py` under running `/app/app`, `/app/scripts` and `/app/main.py`, after checking the live image ID against the pinned image. Comparing these exact live bytes at source HEAD `7ded4cec5928f937ea0448a39f0145a34c134024` established:

    LIVE_PYTHON_FILES_CHECKED=205
    LIVE_PYTHON_EXACT_SOURCE_MATCHES=193
    LIVE_PYTHON_REVIEWED_LEGACY_DIFFERENCES=2
    UNEXPLAINED_LIVE_PYTHON_COUNT=0
    UNRECONCILED_LIVE_PYTHON_COUNT=10

A second user-executed hash-origin diagnosis compared **the actual ten live SHA-256 hashes** against `git show` of the OCI-labelled historic revision, server checkout, and Build 36. Every one of the ten matches the labelled historic revision exactly; six also match the server checkout. No ten-path discrepancy is an unknown overlay.

### Ten independently classified runtime-to-Build36 differences

| Path (under `apps/backend/`) | Actual live byte source | Reviewed candidate change and decision |
|---|---|---|
| `app/core/config.py` | IMAGE_LABEL | MERGE: KieliValmis password-reset link default and three server-only RevenueCat secret settings; keep all existing settings. |
| `app/core/state_store.py` | IMAGE_LABEL + CHECKOUT | MERGE: new processed-RevenueCat-webhook event-ID bucket; existing persistence and backup retained. |
| `app/routers/v1_roleplay.py` | IMAGE_LABEL + CHECKOUT | MERGE: authenticated same-owner roleplay session routing, safe legacy aliases, deterministic provider voice identity; preserve existing route contracts and evaluation service. |
| `app/routers/v1_subscription.py` | IMAGE_LABEL + CHECKOUT | MERGE: existing store sync moved off event loop and secured RevenueCat webhook route added; no change to existing public billing path semantics without tests. |
| `app/services/account_deletion_service.py` | IMAGE_LABEL + CHECKOUT | MERGE: complete DB cleanup first; fail retryably instead of claiming deletion when cleanup partially fails. |
| `app/services/password_reset_email_service.py` | IMAGE_LABEL only | REPLACE textual email subject: "Reset your Floently Finnish password" → "Reset your KieliValmis password"; webhook sender/link contract unchanged. |
| `app/services/roleplay_ai_service.py` | IMAGE_LABEL only | MERGE: professional counterpart role-contract validation / bounded retry and deterministic fail-safe; preserve AI/fallback flows. |
| `app/services/subscription_service.py` | IMAGE_LABEL only | MERGE: server-authoritative RevenueCat V1 Apple/Google purchase and restore; no direct trust in client `customerInfo` or `activeEntitlements`; preserve existing Stripe/employer grants. |
| `app/services/tts/runtime.py` | IMAGE_LABEL + CHECKOUT | MERGE: clarify provider gender metadata and amend deterministic Finnish fallback; preserve existing TTS call contracts. |
| `app/services/tts/voice_registry.py` | IMAGE_LABEL + CHECKOUT | MERGE: explicit curated gender metadata and stable per-persona versioned voice identity; preserve legacy resolved-profile transport. |

The exact historical and candidate Git blob IDs for all ten are pinned in `apps/backend/scripts/verify_build36_live_source_audit.py` at commit `736c6b3e12800509308ecd54cf179305a14a2ba0`. This fail-closed release gate accepts a difference only if BOTH (1) the user's live SHA-256 matches its exact historical labelled Git bytes and (2) the Build 36 file is its specifically pinned reviewed blob. Unknown overlays, incomplete manifests and unreviewed source edits still fail.

**Important qualification:** This classifies source preservation; it does **not** by itself prove behavioral equivalence, correct billing identity, all bidirectional Docker artifact content, future migrations, canaries, runtime health or production ancestry. The full backend 149-test suite and TypeScript passed on earlier Build36 source; rerun the new audit locally against the existing manifest before recording its PASS.

**Deployment remains blocked** by exact running-artifact provenance/reconciliation, forward-only ancestry resolution, secure provisioning, real webhook delivery, physical StoreKit introductory trial, and explicit approval.

## 2026-09-24 — verified live Python manifest; immutable candidate-image next gate

The user independently reran the actual **read-only** running-container `/app` Python SHA-256 manifest on Build36 source `311d8144b4aec6117f98a0d8b7bec108c0a46f57` and recorded:

- `LABELLED_SOURCE_BLOB_COMPARISON=PASS`;
- `LIVE_PYTHON_FILES_CHECKED=205` / `LIVE_PYTHON_EXACT_SOURCE_MATCHES=193`;
- `LIVE_PYTHON_REVIEWED_LEGACY_DIFFERENCES=12`;
- `UNEXPLAINED_LIVE_PYTHON_COUNT=0` / `UNRECONCILED_LIVE_PYTHON_COUNT=0`;
- `LIVE_PYTHON_CAPABILITY_PRESERVATION=PASS`.

This supersedes the earlier incomplete-manifest counts above. It classifies existing Python file bytes and intentional source changes; it **does not** prove a clean composite artifact, binary/data/config preservation, production-source ancestry, behavior parity, or permission to deploy.

Build36 subsequent **source-only** commits `82116574`, `74e58339`, `df3248c` exclude backend secrets and mutable persistence from fresh Docker contexts, add an OCI source-revision label, and guard those declarations. Commits `7c4496a`, `2ac2752`, `46d21b1` thread an explicit candidate SHA through Compose and add 11 offline fail-closed tests. Latest Build36 head at this ledger update: `46d21b166704a3fac2d660dcf6641b0d04cbc88f`; source guard and new tests are **NOT yet independently run at this exact head**. No backend image built/deployed, no secret installed, no Hetzner restart, and no Apple resubmission performed by these steps.

Next gates in order: exact-head offline source guard/unit tests; old-image sensitive-path presence check without showing file contents; isolated immutable candidate image; bidirectional candidate application-source manifest with image revision/secret exclusion proof; historic lineage reconciliation before production promotion; secure staging, real RevenueCat/StoreKit device tests, rollback-backed promotion, and App Review assets. The old server checkout `749ffe...` is not proof of deployed-image ancestry; preserve the pinned rollback artifact and live state.
