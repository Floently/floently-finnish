# Pass 2 Report

## Scope of Pass 2

Pass 2 covered:

- client-side duplicate feature tree consolidation
- client-side duplicate navigation/route support consolidation
- shared client API/config authority consolidation where `apps/client/*` overlapped with `packages/*`
- removal of stale client-side duplicate structures after authority confirmation

## Exact files and directories inspected

- `apps/client/features/**`
- `apps/client/src/**`
- `apps/client/src/features/yki_speaking/AppShell_yki_speaking_patch.ts`
- `apps/client/src/navigation/routes.ts`
- `apps/client/app/**`
- `apps/client/state/**`
- `apps/client/config/**`
- `apps/client/core/api/apiConfig.ts`
- `packages/core/api/apiConfig.ts`
- `docs/cleanup/read_reports/pass_1_*.md`
- `docs/cleanup/read_reports/pass_1_repo_tree_after.txt`

## Exact files and directories merged into canonical locations

- No new feature code needed to be merged into `apps/client/features/*`
- No navigation code needed to be merged into `apps/client/app/*` or `apps/client/state/*`
- Shared API/config authority was consolidated by keeping `packages/core/api/apiConfig.ts` as the sole survivor

## Exact files and directories moved to quarantine

- `apps/client/src/`
- `apps/client/core/api/apiConfig.ts`

## Preserved behavior, config, types, and exports before move

- preserved active feature ownership under `apps/client/features/*`
- preserved active route ownership under:
  - `apps/client/app/*`
  - `apps/client/state/navigationModel.ts`
  - feature-local route helpers such as `apps/client/features/onboarding/routes.ts`
- preserved shared API/config authority under `packages/core/api/apiConfig.ts`
- preserved existing YKI speaking practice integration already present in:
  - `apps/client/state/AppShell.tsx`
  - `apps/client/state/YkiPracticeRoute.tsx`

## Outcome

Pass 2 succeeded because:

- `apps/client/features/*` is the only active client feature tree left in the repo
- `apps/client/src/features/*` no longer remains in the repo
- `apps/client/src/navigation/*` no longer remains in the repo
- overlapping client API/config authority now has one active survivor: `packages/core/api/apiConfig.ts`
- no live non-doc references point to the moved Pass 2 paths
- client verification still passes
