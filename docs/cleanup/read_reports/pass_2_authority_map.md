# Pass 2 Authority Map

## Governing inputs used

- `docs/cleanup/floently_finnish_duplication_cleanup_matrix.md`
- `docs/cleanup/read_reports/pass_1_report.md`
- `docs/cleanup/read_reports/pass_1_authority_map.md`
- `docs/cleanup/read_reports/pass_1_merge_log.md`
- `docs/cleanup/read_reports/pass_1_quarantine_manifest.md`
- `docs/cleanup/read_reports/pass_1_verification_results.md`
- `docs/cleanup/read_reports/pass_1_repo_tree_after.txt`
- `docs/cleanup/read_reports/pass_1_open_items_for_pass_2.md`

The Pass 2 prompt referenced the same stale `_v2` matrix name used in Pass 1. The actual governing matrix present in the repo is `floently_finnish_duplication_cleanup_matrix.md`.

## Canonical survivors confirmed in Pass 2

- `apps/client/features/*` is the active client feature tree
- `apps/client/app/*` is the active Expo Router route tree
- `apps/client/state/*` is the active app-local route/state/navigation layer
- `apps/client/config/*` remains the active app-local config layer
- `packages/core/api/*` is the active shared client API/config authority
- `packages/ui/*` remains the active shared UI authority

## Duplicate families inspected

### M09: `apps/client/features/*` vs `apps/client/src/features/*`

Inspected:

- `apps/client/features/**`
- `apps/client/src/features/**`

Findings:

- live feature code already resides under `apps/client/features/*`
- the only remaining file under `apps/client/src/features/*` was:
  - `apps/client/src/features/yki_speaking/AppShell_yki_speaking_patch.ts`
- that file was not live code; it was a documentation-only patch note
- the actual YKI speaking integration described there is already present in `apps/client/state/AppShell.tsx` and `apps/client/state/YkiPracticeRoute.tsx`

Authority decision:

- keep `apps/client/features/*`
- move all remaining `apps/client/src/*` residue out of the repo

### M10: `apps/client/src/navigation/*` vs `apps/client/app/*` / `state/*` / `config/*`

Inspected:

- `apps/client/src/navigation/routes.ts`
- `apps/client/state/navigationModel.ts`
- `apps/client/app/**`

Findings:

- `apps/client/src/navigation/routes.ts` was unused legacy route mapping
- active path ownership already lives in:
  - `apps/client/state/navigationModel.ts`
  - `apps/client/app/**`
  - feature-local route helpers such as `apps/client/features/onboarding/routes.ts`

Authority decision:

- keep `apps/client/app/*`, `apps/client/state/*`, and feature-local route helpers
- move `apps/client/src/navigation/*` out of the repo

### M11: `apps/client/core/*` vs `packages/core/*`

Inspected:

- `apps/client/core/api/apiConfig.ts`
- `packages/core/api/apiConfig.ts`
- imports of `@core/api/apiConfig`

Findings:

- `apps/client/core/api/apiConfig.ts` duplicated `getApiBaseUrl()` only
- `packages/core/api/apiConfig.ts` is the stronger shared authority and also provides:
  - `getAudioBaseUrl()`
  - `resolveApiUrl()`
- live imports already resolve to `@core/api/apiConfig`, which points to `packages/core/api/apiConfig.ts` via Babel/Metro/TS aliasing
- no live code depended on `apps/client/core/api/apiConfig.ts`

Authority decision:

- keep `packages/core/api/apiConfig.ts`
- move `apps/client/core/api/apiConfig.ts` out of the repo

## Pass 3+ observations

- No backend, cards, YKI authority-chain, or engine-adjacent merge work was required for Pass 2
- Documentation moved in `docs/cleanup/` reflects cleanup process state, not active client runtime authority
