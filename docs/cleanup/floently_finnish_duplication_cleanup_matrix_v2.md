# Floently Finnish Duplication Cleanup Matrix (Revised for Merge-and-Move Cleanup)

## Purpose
This matrix is the revised, execution-ready cleanup guide for a **merge-and-move** deduplication of `/home/vitus/floently-finnish`.

It incorporates the owner's non-negotiable decisions:
- **No freeze / hold / blocked rows**
- **No duplicate active structures left in the repo**
- **Everything overlapping must be merged into one canonical survivor and then moved out of the repo**
- **Mobile native build trees are not being preserved in-repo for now; they will be rebuilt later from scratch**
- **Only one canonical structure may remain**

## Canonical Surviving Structure

```text
apps/
  backend/
    app/
      core/
      db/
      routers/
      services/
      runtime/
      integrations/
      middleware/
      models/
      adapters/
      cards/
      audio/
  client/
    app/
    state/
    services/
    features/
    components/
    config/
    constants/
    hooks/
    assets/
    web/
    core/
packages/
  core/
  ui/
```

### Additional surviving repo-level governance files
These are **not duplicates** if they act as monorepo-level governance rather than app-level authority. Keep only if still referenced after merge:
- root `package.json`
- root `package-lock.json`
- root `tsconfig.json`
- root `eslint.config.js`
- root `conftest.py`
- root docs / ledgers / manifests that are not duplicate active runtime authorities

## Pass Plan (5 Passes)

| Pass | Goal | Contains |
|---|---|---|
| 1 | Remove obvious contamination and mobile build duplication | runtime artifacts, caches, logs, uploads, backup trees, root/native mobile build roots, `apps/client/android`, root mobile entry duplicates after config parity merge |
| 2 | Consolidate client-side duplicate source trees | `apps/client/src/*` into canonical `apps/client/*`, duplicate route/config/service helpers, shared client config overlap |
| 3 | Consolidate backend structural duplication | top-level backend legacy siblings into `apps/backend/app/*`, router/service/core/db/runtime/auth/state/oauth overlaps |
| 4 | Consolidate deep domain authorities | cards authority chain, YKI authority chain, engine-adjacent overlaps, audio/voice/TTS/roleplay authority |
| 5 | Final sweep and proof | stale imports/paths/aliases cleanup, quarantine verification, final tree, backend boot, client typecheck/lint, targeted runtime sanity |

---

## Duplication Cleanup Matrix

| ID | Duplicate / Overlap Family | Canonical Survivor to Keep | Merge Requirements Before Move | Move to Quarantine After Merge | Pass |
|---|---|---|---|---|---|
| M01 | Root mobile entrypoint vs canonical client app root | `apps/client/app/*` plus `apps/client/state/*` route shell | Merge any still-used startup wiring from root `App.tsx` and root `index.js` into `apps/client/app/_layout.tsx`, route wrappers, or canonical Expo entry configuration | `App.tsx`, `index.js` | 1 |
| M02 | Root mobile config vs canonical client config | `apps/client/app.json`, `apps/client/babel.config.js`, `apps/client/metro.config.js`, `apps/client/package.json`, `apps/client/tsconfig.json`, `apps/client/eas.json` | Compare root `app.json`, `babel.config.js`, `metro.config.js` against client versions; merge any still-needed permissions, plugins, aliases, startup flags, or Expo settings into canonical client configs | root `app.json`, root `babel.config.js`, root `metro.config.js` | 1 |
| M03 | Root native Android tree vs canonical client authority | `apps/client/app.json` + canonical client config/docs only (native tree rebuilt later) | Extract any required custom permissions, backup policy, signing assumptions, package identifiers, or manifest-level behavior into canonical client config / cleanup docs before move | root `android/` | 1 |
| M04 | Root native iOS tree vs canonical client authority | `apps/client/app.json` + canonical client config/docs only (native tree rebuilt later) | Extract any required iOS identifiers, plist policies, asset references, or entitlement assumptions into canonical client config / cleanup docs before move | root `ios/` | 1 |
| M05 | Backup native tree | none inside repo; canonical behavior already merged elsewhere | Confirm no file inside backup tree contains unique live behavior not already merged into canonical client config/docs | `android_backup_before_prebuild/` | 1 |
| M06 | Client native prebuild tree inside canonical client root | canonical client source/config only; native Android will be regenerated later | Merge any still-needed build-time settings from `apps/client/android` into `apps/client/app.json`, `eas.json`, or rebuild notes; then remove native tree from repo | `apps/client/android/` | 1 |
| M07 | Runtime/build/cache contamination in repo | none; only minimal fixtures if explicitly needed | For each runtime artifact root, preserve only true fixtures in canonical fixture/test/input location, then move contamination out | `.pytest_cache/`, root `logs/`, root `uploads/`, root `exam_sessions/`, `apps/backend/cache/`, `apps/backend/logs/`, `apps/backend/uploads/`, `apps/backend/runtime/`, `apps/backend/exam_sessions/`, `apps/backend/.tts_runtime/`, `engine/.runtime_audio_cache/` | 1 |
| M08 | Duplicate backend runtime state artifacts | canonical DB / app runtime contracts only | If any file-backed state still contains behavior contracts, merge the contract into canonical backend state/auth/session layers first; never keep JSON runtime state as live authority | `apps/backend/app/runtime/state.json`, any sibling state snapshots | 1 |
| M09 | Client `src/features/*` vs canonical `features/*` | `apps/client/features/*` | Merge any still-live screens, hooks, services, types, or route metadata from `apps/client/src/features/*` into corresponding canonical `apps/client/features/*` modules | `apps/client/src/features/*` | 2 |
| M10 | Client `src/navigation/*` vs canonical route/state/config structures | `apps/client/app/*`, `apps/client/state/*`, `apps/client/config/*` | Merge any remaining route constants, navigation helpers, or route names into canonical state/config/app route ownership | `apps/client/src/navigation/*` | 2 |
| M11 | Shared API config overlap | `packages/core/api/*` as shared authority, with thin local adapters only if absolutely necessary | Merge `apps/client/core/api/apiConfig.ts` behavior into `packages/core/api/apiConfig.ts` and update all client imports to shared path or an intentional thin wrapper; remove duplicate authority | `apps/client/core/api/*` that duplicates `packages/core/api/*` | 2 |
| M12 | Client-local services duplicating shared/core services | `packages/core/api/*` + `apps/client/services/*` only for client-device concerns | Merge duplicate auth/billing/health/service-client logic so shared API contracts live in `packages/core`, device/runtime concerns live in `apps/client/services` | any duplicated service clients under `apps/client/features/*/services` or `apps/client/services/*` that only mirror `packages/core/api/*` | 2 |
| M13 | Duplicate client route wrappers vs direct app routes | `apps/client/app/*` + `apps/client/state/*` | Merge any unique behavior from route wrappers into canonical state/app route ownership, but keep only one active route authority per feature | overlapping wrappers that duplicate direct Expo route authority | 2 |
| B01 | Backend legacy API namespace vs canonical backend app routers | `apps/backend/app/routers/*` + `apps/backend/app/router.py` | Merge any missing route behavior, mount logic, response envelopes, dependency wiring, or contract handling from `apps/backend/api/*` into canonical app routers | `apps/backend/api/` | 3 |
| B02 | Backend top-level audio namespace vs canonical `app/audio/*` and `app/services/*` | `apps/backend/app/audio/*` + `apps/backend/app/services/*` | Merge any unique audio helpers/contracts from `apps/backend/audio/*` into canonical audio/services layers | `apps/backend/audio/` | 3 |
| B03 | Backend top-level cards namespace vs canonical `app/cards/*` and `app/runtime/cards_*` | `apps/backend/app/cards/*` + canonical cards runtime/service chain | Merge any unique card helpers/contracts still living in `apps/backend/cards/*` into canonical cards authority before move | `apps/backend/cards/` | 3 |
| B04 | Backend top-level db namespace vs canonical `app/db/*` | `apps/backend/app/db/*` | Merge any still-used DB helpers/models/contracts from top-level `apps/backend/db/*` into canonical DB layer | `apps/backend/db/` | 3 |
| B05 | Backend top-level learning namespace vs canonical app services/runtime/cards or client shared contracts | canonical destination depends on exact responsibility, but must end under `apps/backend/app/*` or `packages/core/*` | Merge any still-used learning services/models/schedulers from `apps/backend/learning/*` into canonical app service/runtime ownership | `apps/backend/learning/` | 3 |
| B06 | Backend top-level services namespace vs canonical `app/services/*` | `apps/backend/app/services/*` | Merge any unique auth/cards/roleplay/subscription/voice/YKI services from `apps/backend/services/*` into canonical `app/services/*` | `apps/backend/services/` | 3 |
| B07 | Backend top-level runtime namespace vs canonical `app/runtime/*` | `apps/backend/app/runtime/*` | Merge any unique runtime/session/upload helpers from `apps/backend/runtime/*` into canonical runtime or DB/service ownership | `apps/backend/runtime/` | 3 |
| B08 | Backend auth/session/state authority drift | `apps/backend/app/core/*`, `apps/backend/app/services/auth_service.py`, `apps/backend/app/db/*` | Merge file-backed and DB-backed identity/session logic into one canonical authority; preserve all required auth/session behavior; rewrite callers/tests/imports accordingly | redundant auth/session/state files outside final canonical chain | 3 |
| B09 | Duplicate Google OAuth responsibility | preferred survivor: `apps/backend/app/integrations/google_oauth_service.py` with any required orchestrating behavior merged from service-layer duplicate | Merge integration-specific logic and any higher-level service orchestration into one canonical integration/service path, then update imports | `apps/backend/app/services/google_oauth_service.py` or other duplicate OAuth owners after merge | 3 |
| B10 | Versioned vs unversioned router duplication | choose one canonical public router per responsibility under `apps/backend/app/routers/*` | Where `v1_*` and unversioned routers overlap, merge required behavior into the chosen public surface and rewrite mounts/callers/tests | whichever router files are not chosen as final public surface | 3 |
| C01 | Cards authority: route/service/runtime duplication | one canonical cards chain under `apps/backend/app/routers/v1_cards.py` (or final chosen public router) -> `app/services/cards_service.py` -> `app/runtime/cards_logic.py` -> canonical card loader under `app/cards/*` or `app/runtime/*` | Merge every still-used cards behavior into one chain: route authz, deck/session logic, adaptive behavior, loader behavior, schema validation, publication/loading rules | all duplicate route/service/runtime/loader paths for cards not in final chain | 4 |
| C02 | Cards content authority drift: published vs donor/legacy/practice banks | one canonical published/manifest-backed cards authority under `apps/backend/app/cards/*` with canonical source directory documented in code | Merge useful content-loading rules and any required donor normalization logic into one canonical publication/load path; repoint runtime to that single authority | legacy donor/practice/loading authorities, old publication helpers, duplicate material roots that remain active authorities | 4 |
| C03 | Cards schema/validator/importer duplication | `apps/backend/app/cards/schemas/*`, `validators/*`, `importers/*`, `publication/*` | Merge overlapping schema, validation, and publication functions so one ingest/publish pipeline remains | redundant card schema/validator/importer/publication helpers outside survivor path | 4 |
| Y01 | Top-level YKI package vs canonical app YKI authority | final YKI authority must end under `apps/backend/app/*` only | Merge contracts, orchestrator/state-machine logic, runtime glue, and engine boundary helpers from top-level `apps/backend/yki/*` into canonical app service/runtime/adapter/router chain | `apps/backend/yki/` | 4 |
| Y02 | YKI route duplication: practice/exam/engine/router overlaps | one canonical router chain under `apps/backend/app/routers/*` | Merge embedded bank usage, exam/practice routing, review/runtime/result behaviors, and public envelopes into one canonical route family | duplicate YKI router files not chosen as canonical public surface | 4 |
| Y03 | YKI runtime/service duplication | `apps/backend/app/services/yki_service.py`, `apps/backend/app/runtime/yki.py`, canonical adapters/models as needed | Merge runtime guard, integrity, orchestration, and service logic into one chain with one source of truth | redundant YKI service/runtime helpers outside final chain | 4 |
| Y04 | YKI content/bank authority drift | one canonical app-level authority path only | Merge hardcoded/embedded task bank references and file-backed certified bank loaders into one governed authority path | duplicate or embedded YKI banks/loaders after merge | 4 |
| A01 | Audio / voice / TTS / roleplay authority drift | one canonical chain under `apps/backend/app/audio/*`, `app/services/*`, `app/runtime/*`, `app/routers/*` | Merge all unique TTS/provider, voice, roleplay, audio storage, router, and service logic into one canonical chain; preserve diagnostics and runtime behavior | redundant audio/voice/tts/roleplay authorities outside final chain | 4 |
| A02 | Engine-adjacent overlap with backend app responsibilities | canonical destinations under `apps/backend/app/*` only | Compare `engine/*` against canonical backend responsibilities; merge every needed unique function, contract, schema, runtime helper, or media/audio/YKI logic into canonical app layers; rewrite callers/imports | overlapping parts of `engine/*`; if entire engine becomes redundant, move entire `engine/` | 4 |
| D01 | Duplicate tests/helpers tied to moved authorities | canonical tests only against canonical paths | Merge or rewrite test helpers/imports to point only at canonical paths; preserve fixtures actually needed | stale tests/helpers that only exist to support moved duplicate authorities | 5 |
| D02 | Duplicate docs / ledgers that still declare old source-of-truth | canonical docs under `docs/*` | Merge still-useful decision records into current canonical docs and cleanup reports; move obsolete ledgers or duplicated reports if they duplicate active source-of-truth documentation | obsolete duplicate docs/ledgers after merge | 5 |
| D03 | Final stale import/path/alias residue | none; all references must resolve to canonical paths only | Repo-wide search and rewrite of stale moved-path references, aliases, loader paths, route mounts, scripts, and tests | any remaining redundant shim/wrapper files left only to preserve old paths | 5 |

---

## Execution Rules for This Matrix

1. **Every row ends in merge-and-move.**
2. **No duplicate active authority remains in the repo after its row is complete.**
3. **Cards and YKI are not exempt.** They are just later-wave, higher-risk merge groups.
4. **Mobile native trees are not preserved in-repo.** They are merged for surviving config value, then moved out because mobile builds will be regenerated later.
5. **Repo-level governance files may remain only if they are not duplicate app authorities.** If they are acting as a second mobile app root, they must be merged and moved too.

## Expected End State

After all 5 passes:
- only the canonical structure remains
- no duplicate client root remains
- no duplicate backend authority remains
- no cards/YKI duplicate authority remains
- no runtime/build/cache contamination remains as active source structure
- all moved material lives only in:
  `/home/vitus/floently-finnish-duplication-quarantine/`

