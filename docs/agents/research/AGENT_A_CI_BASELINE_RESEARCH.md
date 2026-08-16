# Agent A — Generic CI Baseline Repair Research

Date: 2026-08-16
Scope: source/CI only; no production deployment, server access, restart, migration, OTA, or mobile release.
Base: `69813b433838130d5afe4b052360dbfd12df3f40`
Branch: `agent/a-ci-baseline-repair-20260816`

## Questions investigated

1. Why does the generic client CI job fail before TypeScript runs?
2. What package manager and lockfile are authoritative in the current repository?
3. Why does the generic backend job fail during test collection?
4. Are the missing engine modules regressions that should be restored, or references that were never backed by source?
5. Can the baseline be repaired without weakening test coverage or touching production?

## Repository evidence

### Client

- `.github/workflows/ci.yml` currently runs `cd apps/client && npm ci`.
- The repository contains a committed root `pnpm-lock.yaml` (lockfileVersion 9) with importers for the root workspace and `apps/client`.
- `.github/workflows/yki-evaluation.yml` already uses `pnpm/action-setup@v6`, pnpm `10.34.0`, `pnpm install --frozen-lockfile`, then `pnpm --dir apps/client exec tsc --noEmit`; that protected workflow has been green on the Wave-1 lineage.
- Root `package.json` declares workspaces including `apps/client` and `packages/*`.
- `.npmrc` contains `legacy-peer-deps=true`, but there is no requirement to use npm for the workspace CI path.

Decision: generic client CI should use the repository's existing pnpm workspace/lockfile rather than `npm ci` in a subdirectory. This is a correction to match current repository authority, not a dependency change.

### Backend / engine

- Generic CI currently runs `pytest apps/backend/tests engine/tests -q`.
- `engine/tests/test_daily_practice_engine.py` imports `engine.learning.daily_practice_engine`.
- `engine/api/learning_api_v1.py` also imports that path.
- `engine/tests/test_engine_test_mode.py` imports `engine.api.server_v3_3`.
- `engine/api/server_v3_3.py` imports `engine.logging.json_logger`, `engine.blueprints.loader`, and `engine.api.learning_api_v1`.
- Current source has no `engine/learning`, `engine/logging`, or `engine/blueprints` package.
- GitHub path history for `engine/learning/daily_practice_engine.py`, `engine/logging/json_logger.py`, and `engine/blueprints/loader.py` is empty: those files were not deleted from repository history; they were never committed on the current repository lineage.
- `engine/tests/test_daily_practice_engine.py` and `engine/api/server_v3_3.py` both originate from the repository's original `fresh overwrite` root commit.
- `docs/KIELIVALMIS_CURRENT_RUNTIME_AUTHORITY.md` classifies `apps/backend/main.py -> apps/backend/app/router.py` as the mounted backend HTTP authority. It classifies the root `engine/**` as active formal-YKI engine authority through the authenticated backend bridge, so engine tests cannot simply be removed from generic CI.

Decision: do **not** hide the backend failure by deleting `engine/tests` from CI. First repair the deterministic client CI mismatch. Then use the next exact-head CI run to obtain the complete engine failure set after client is no longer masking its job. Backend repair must preserve active formal-YKI behavior and must not invent missing legacy learning/runtime components merely to satisfy imports.

## Current external/primary-source research

Accessed 2026-08-16.

1. npm CLI official documentation — `npm ci`
   - https://docs.npmjs.com/cli/v10/commands/npm-ci/
   - Finding: `npm ci` requires an existing `package-lock.json` or `npm-shrinkwrap.json`; it exits rather than generating/updating a lockfile.
   - Decision influenced: do not keep `npm ci` on a pnpm-locked workspace.

2. GitHub Actions official documentation — Building and testing Node.js
   - https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs
   - Finding: the workflow should install dependencies with the package manager/lockfile actually used by the repository; `npm ci` is appropriate when an npm lockfile is present.
   - Decision influenced: align generic CI with the proven pnpm workflow already used in the repository.

3. GitHub Actions official documentation — dependency caching
   - https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
   - Finding: `setup-node` supports pnpm caching when configured with the lockfile.
   - Decision influenced: reuse the same pnpm setup/cache pattern already proven in the YKI workflow rather than introducing a second install strategy.

## Alternatives rejected

### Change `npm ci` to `npm install`
Rejected. It would make generic CI depend on npm resolution even though the repository already carries a pnpm lockfile and a proven pnpm workflow. That is less reproducible and creates two package-manager authorities.

### Generate and commit a new `package-lock.json`
Rejected. It would create a second lockfile/package-manager authority and a large dependency-resolution artifact without product value.

### Remove `engine/tests` from generic CI
Rejected. The root engine participates in formal YKI execution. Removing the tests would conceal baseline debt rather than repair it.

### Add placeholder `engine.learning`, `engine.logging`, or `engine.blueprints` packages immediately
Rejected for now. Repository history shows they were never present, so reconstructing them without proving intended behavior risks inventing architecture and overlapping Agent E's new Practice work.

## Planned repair sequence

1. Isolated Agent-A CI branch from exact frozen base.
2. Change only generic client CI to the existing, locked pnpm installation pattern.
3. Open a draft PR against the frozen Wave-1 base and observe exact-head CI.
4. Confirm client install + TypeScript result.
5. Capture the full backend/engine error set from the same exact head.
6. Classify every failing engine reference as active contract, orphaned bootstrap reference, or missing legitimate implementation.
7. Apply the smallest source/test repair that restores truthful coverage without weakening YKI protections.
8. Rerun generic CI and protected YKI/roleplay gates before any acceptance.

## Safety / acceptance criteria

- Frozen Wave-1 shared base ref is not moved.
- B–G branches are not modified.
- No production/server action.
- No dependency versions changed in the first repair.
- No tests removed or skipped to obtain green CI.
- Generic CI must eventually execute client TypeScript and backend/engine tests rather than stopping at setup/collection debt.
- Protected YKI and roleplay workflows must remain green after backend repair.

RESEARCH_GATE=PASS
PRODUCTION_ACTIONS=NONE
